import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  UVLShareLink,
  UVLDocument,
  UVLDocumentVersion,
  UVLDocumentSession,
  ViewerType
} from '../../types';
import { retrieveDocumentBlob, verifyDocumentPassword } from '../../lib/documentStorage';
import { loadPDFDocument, renderPDFPageToCanvas } from '../../lib/pdfHelper';
import { hashIpAddress, isLikelyBotOrPreview } from '../../lib/campaignAttribution';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Lock,
  Mail,
  ShieldAlert,
  FileText,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface DocumentPublicViewerProps {
  token: string;
}

export const DocumentPublicViewer: React.FC<DocumentPublicViewerProps> = ({ token }) => {
  const {
    shareLinks,
    documents,
    documentVersions,
    recordDocumentSession,
    ingestDocumentHeartbeat,
    recordDocumentDownload
  } = useWorkspace();

  // 1. Link & Document resolution
  const shareLink: UVLShareLink | undefined = shareLinks.find(l => l.token === token);
  const uvlDoc: UVLDocument | undefined = documents.find(d => d.id === shareLink?.documentId);
  const activeVersion: UVLDocumentVersion | undefined = documentVersions.find(
    v => v.documentId === shareLink?.documentId && v.versionNumber === (uvlDoc?.currentVersionNumber || 1)
  );

  // 2. Access gates state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState<string>('');
  const [emailSubmitted, setEmailSubmitted] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Email verification (OTP)
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

  // 3. PDF rendering state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 4. Session & Engagement tracking
  const sessionRef = useRef<UVLDocumentSession | null>(null);
  const [activeSecondsOnCurrentPage, setActiveSecondsOnCurrentPage] = useState<number>(0);
  const isActiveRef = useRef<boolean>(true);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const IDLE_TIMEOUT_MS = 20000; // 20s inactivity cutoff

  // Check Expiry / Revocation
  const isExpired = shareLink?.expiresAt ? new Date(shareLink.expiresAt).getTime() < Date.now() : false;
  const isRevoked = shareLink?.status === 'revoked';

  // Handle Initial Access Gates
  useEffect(() => {
    if (!shareLink) return;
    const needsPassword = shareLink.passwordProtected;
    const needsEmail = shareLink.requireEmail || shareLink.requireVerifiedEmail;

    if (!needsPassword && !needsEmail) {
      setIsUnlocked(true);
    }
  }, [shareLink]);

  // Handle Passcode Unlock
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (!shareLink?.passwordHash) {
      setIsUnlocked(true);
      return;
    }

    const isValid = await verifyDocumentPassword(passwordInput, shareLink.passwordHash);
    if (isValid) {
      sound.click();
      if (!shareLink.requireEmail && !shareLink.requireVerifiedEmail) {
        setIsUnlocked(true);
      } else {
        // Move to email gate
        setEmailSubmitted(false);
      }
    } else {
      sound.alert();
      setPasswordError('Incorrect passcode. Access denied.');
    }
  };

  // Handle Email Submission & Domain/Allowlist Verification
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    const domain = email.split('@')[1];

    // Check allowlist domains if configured
    if (shareLink?.allowlistDomains && shareLink.allowlistDomains.length > 0) {
      const allowed = shareLink.allowlistDomains.some(d => d.toLowerCase().trim() === domain);
      if (!allowed) {
        setEmailError(`Access restricted: domain @${domain} is not authorized for this document.`);
        sound.alert();
        return;
      }
    }

    // Check allowlist emails if configured
    if (shareLink?.allowlistEmails && shareLink.allowlistEmails.length > 0) {
      const allowed = shareLink.allowlistEmails.some(e => e.toLowerCase().trim() === email);
      if (!allowed) {
        setEmailError('Access restricted: this email is not on the authorized recipient list.');
        sound.alert();
        return;
      }
    }

    if (shareLink?.requireVerifiedEmail) {
      // Send 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setOtpSent(true);
      setEmailSubmitted(true);
      sound.click();
    } else {
      // Self-reported email
      setEmailSubmitted(true);
      setIsUnlocked(true);
      sound.click();
    }
  };

  // Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.trim() === generatedOtp) {
      setIsEmailVerified(true);
      setIsUnlocked(true);
      sound.patchStamp();
    } else {
      setEmailError('Invalid verification code. Please check and try again.');
      sound.alert();
    }
  };

  // 5. Initialize Document Session once Unlocked
  useEffect(() => {
    if (!isUnlocked || !shareLink || !uvlDoc || !activeVersion) return;

    let viewerType: ViewerType = 'anonymous';
    if (isEmailVerified) {
      viewerType = 'verified';
    } else if (emailInput.trim().length > 0) {
      viewerType = 'self_reported';
    }

    const isBot = isLikelyBotOrPreview(navigator.userAgent);
    const ipHash = hashIpAddress(window.location.hostname || 'viewer_host');

    async function initSession() {
      if (!uvlDoc || !activeVersion || !shareLink) return;
      const session = await recordDocumentSession({
        documentId: uvlDoc.id,
        versionId: activeVersion.id,
        shareLinkId: shareLink.id,
        viewerType,
        viewerEmail: emailInput.trim() || undefined,
        ipHash,
        userAgent: navigator.userAgent,
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
        totalDurationSeconds: 0,
        activeDurationSeconds: 0,
        pagesViewed: [1],
        completionPercent: Math.round((1 / (uvlDoc.totalPages || 1)) * 100),
        downloadRequested: false,
        isSuspectedBot: isBot
      });

      sessionRef.current = session;
    }

    initSession();
  }, [isUnlocked, shareLink, uvlDoc, activeVersion, isEmailVerified, emailInput, recordDocumentSession]);

  // 6. Load PDF Document
  useEffect(() => {
    if (!isUnlocked || !uvlDoc || !activeVersion) return;
    setIsLoading(true);
    setLoadError(null);

    async function fetchAndLoadPDF() {
      if (!activeVersion) return;
      try {
        const blob = await retrieveDocumentBlob(activeVersion.storagePath);
        if (!blob) {
          throw new Error('Unable to retrieve document storage file.');
        }

        const url = URL.createObjectURL(blob);
        setBlobUrl(url);

        const loadedPdf = await loadPDFDocument(url);
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF loading error:', err);
        setLoadError(err?.message || 'Failed to load PDF document.');
        setIsLoading(false);
      }
    }

    fetchAndLoadPDF();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isUnlocked, uvlDoc, activeVersion]);

  // 7. Render Current Page onto Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let isMounted = true;

    async function renderPage() {
      try {
        if (canvasRef.current && isMounted) {
          await renderPDFPageToCanvas(pdfDoc, currentPage, canvasRef.current, scale);
        }
      } catch (err) {
        console.error('Canvas render error:', err);
      }
    }

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, scale]);

  // 8. User Activity & Inactivity Detection
  useEffect(() => {
    if (!isUnlocked) return;

    const handleUserActivity = () => {
      lastInteractionTimeRef.current = Date.now();
      isActiveRef.current = true;
    };

    const handleVisibilityChange = () => {
      if (window.document.hidden) {
        isActiveRef.current = false;
      } else {
        lastInteractionTimeRef.current = Date.now();
        isActiveRef.current = true;
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity, true);
    window.addEventListener('touchstart', handleUserActivity);
    window.document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity, true);
      window.removeEventListener('touchstart', handleUserActivity);
      window.document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked]);

  // 9. Instrumented Bounded Heartbeats (every 5 seconds)
  useEffect(() => {
    if (!isUnlocked) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInteractionTimeRef.current;

      // Inactivity cutoff
      if (idleTime > IDLE_TIMEOUT_MS || window.document.hidden) {
        isActiveRef.current = false;
      }

      if (isActiveRef.current && sessionRef.current) {
        // Active tick of 5s, capped strictly at 10s max
        const credit = 5;
        setActiveSecondsOnCurrentPage(prev => prev + credit);
        ingestDocumentHeartbeat(sessionRef.current.id, currentPage, credit);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isUnlocked, currentPage, ingestDocumentHeartbeat]);

  // Handle Download Click
  const handleDownload = () => {
    if (!shareLink?.allowDownload || !blobUrl) return;
    sound.click();

    if (sessionRef.current) {
      recordDocumentDownload(sessionRef.current.id);
    }

    const a = window.document.createElement('a');
    a.href = blobUrl;
    a.download = uvlDoc?.name ? `${uvlDoc.name}.pdf` : 'document.pdf';
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  // Switch Page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      sound.click();
      setCurrentPage(page);
      setActiveSecondsOnCurrentPage(0);
      lastInteractionTimeRef.current = Date.now();
      isActiveRef.current = true;
    }
  };

  // Watermark text determination
  const watermarkText = shareLink?.watermarkEnabled
    ? shareLink.watermarkText || `${emailInput || 'CONFIDENTIAL'} • ${new Date().toLocaleDateString()}`
    : null;

  // ----------------------------------------------------
  // ERROR & ACCESS GATE SCREENS
  // ----------------------------------------------------
  if (!shareLink || !uvlDoc) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Link Not Found</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            This document link does not exist or has been permanently removed by the owner.
          </p>
          <span className="text-xs text-[#A1A1AA] font-mono">Token: {token}</span>
        </div>
      </div>
    );
  }

  if (isRevoked) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Access Revoked</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            The sender has revoked access to this document link. Please contact the document owner for a new link.
          </p>
          <span className="text-xs text-[#A1A1AA] font-mono">Link Label: {shareLink.label}</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-black flex items-center justify-center mx-auto mb-4">
            <Clock size={24} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Link Expired</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            This secure share link expired on {new Date(shareLink.expiresAt!).toLocaleDateString()}.
          </p>
        </div>
      </div>
    );
  }

  // Password Gate Screen
  if (shareLink.passwordProtected && !isUnlocked && (!passwordInput || passwordError)) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
            <Lock size={22} />
          </div>
          <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider block mb-1">
            Protected Document
          </span>
          <h2 className="text-2xl font-bold text-black mb-2">{uvlDoc.name}</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            This document requires an authorization passcode provided by {uvlDoc.createdBy}.
          </p>

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-black block mb-1.5">Passcode</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Enter passcode"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] focus:bg-white text-black text-sm outline-none transition-all"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl">
                <AlertCircle size={14} />
                <span>{passwordError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
            >
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Email Gate Screen (Self-reported or Verified OTP)
  if ((shareLink.requireEmail || shareLink.requireVerifiedEmail) && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-6">
            <Mail size={22} />
          </div>
          <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider block mb-1">
            Identity Verification
          </span>
          <h2 className="text-2xl font-bold text-black mb-2">{uvlDoc.name}</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            {shareLink.requireVerifiedEmail
              ? 'Please verify your work email with a one-time passcode to view this presentation.'
              : 'Please enter your email address to continue to the document.'}
          </p>

          {!otpSent ? (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1.5">Your Email</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] focus:bg-white text-black text-sm outline-none transition-all"
                />
              </div>

              {emailError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={14} />
                  <span>{emailError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                {shareLink.requireVerifiedEmail ? 'Send Verification Code' : 'Continue to Document'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-neutral-100 rounded-xl text-xs text-[#6E6E73] mb-2 flex items-center justify-between">
                <span>Code dispatched to: <b className="text-black">{emailInput}</b></span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#E5E5E7] text-black font-bold">
                  Demo OTP: {generatedOtp}
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1.5">6-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] focus:bg-white text-black text-center font-mono text-lg tracking-widest outline-none transition-all"
                />
              </div>

              {emailError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={14} />
                  <span>{emailError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-all shadow-md cursor-pointer"
              >
                Verify & Enter
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN INSTRUMENTED DOCUMENT VIEWER
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white flex flex-col select-none">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-30 bg-[#1C1C1E]/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <FileText size={16} />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-md">
              {uvlDoc.name}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span>Version {uvlDoc.currentVersionNumber}</span>
              <span>•</span>
              <span>{totalPages} Pages</span>
              {shareLink.label && (
                <>
                  <span>•</span>
                  <span className="text-neutral-300">{shareLink.label}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Jump & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Page Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 text-xs">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 hover:text-white disabled:text-neutral-600 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-neutral-300 px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 hover:text-white disabled:text-neutral-600 transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Zoom In / Out */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full px-2 py-1 text-xs">
            <button
              onClick={() => setScale(prev => Math.max(0.6, prev - 0.15))}
              className="p-1 hover:text-white text-neutral-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-[11px] text-neutral-400 px-1">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(prev => Math.min(2.0, prev + 0.15))}
              className="p-1 hover:text-white text-neutral-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Download Button (Only when explicitly permitted) */}
          {shareLink.allowDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-all shadow-md cursor-pointer"
              title="Download Document"
            >
              <Download size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Reading Viewport */}
      <div className="flex-1 flex overflow-hidden relative" ref={containerRef}>
        {/* Left Thumbnails Rail (Desktop) */}
        <aside className="hidden lg:flex flex-col w-24 bg-[#141416] border-r border-neutral-800 p-2 overflow-y-auto gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`p-1.5 rounded-lg border text-center transition-all ${
                currentPage === pageNum
                  ? 'border-white bg-white/10 text-white font-bold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-white/5'
              }`}
            >
              <div className="w-full aspect-[3/4] bg-neutral-800 rounded flex items-center justify-center text-[10px] font-mono mb-1">
                P.{pageNum}
              </div>
              <span className="text-[10px]">{pageNum}</span>
            </button>
          ))}
        </aside>

        {/* Center Canvas Viewport with Watermark */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-400">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-xs">Rendering document pages...</span>
            </div>
          ) : loadError ? (
            <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
              <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">Document Render Error</h3>
              <p className="text-xs text-neutral-400">{loadError}</p>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-sm overflow-hidden bg-white">
              {/* PDF Canvas */}
              <canvas ref={canvasRef} className="block max-w-full h-auto" />

              {/* Diagonal Watermark Overlay */}
              {watermarkText && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-20">
                  <div className="transform -rotate-45 select-none opacity-20 text-neutral-900 font-mono text-2xl sm:text-3xl font-extrabold tracking-widest whitespace-nowrap text-center">
                    {watermarkText}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Quiet Reader Status */}
      <footer className="border-t border-neutral-800 bg-[#141416] py-2 px-4 text-[11px] text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Page {currentPage} of {totalPages}</span>
          <span>•</span>
          <span className="text-neutral-500">Active engagement estimated</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-neutral-300">Protected by UVL Documents</span>
        </div>
      </footer>
    </div>
  );
};
