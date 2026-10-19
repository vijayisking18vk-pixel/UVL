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
  Maximize2,
  Minimize2,
  Layers,
  Sparkles
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

  // Full-Slide & Presentation Mode UX
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

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

  // Switch Page / Slide
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      sound.click();
      setCurrentPage(page);
      setActiveSecondsOnCurrentPage(0);
      lastInteractionTimeRef.current = Date.now();
      isActiveRef.current = true;
    }
  }, [totalPages, currentPage]);

  // Auto-fit slide scale to viewport
  const updateAutoFitScale = useCallback(async () => {
    if (!isAutoFit || !pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const vp = page.getViewport({ scale: 1.0 });
      const containerW = containerRef.current.clientWidth || window.innerWidth;
      const containerH = containerRef.current.clientHeight || (window.innerHeight - 100);

      // Deduct space for rails and padding
      const padX = showThumbnails ? 140 : 50;
      const padY = isPresentationMode ? 40 : 80;

      const availW = Math.max(300, containerW - padX);
      const availH = Math.max(200, containerH - padY);

      const scaleX = availW / vp.width;
      const scaleY = availH / vp.height;
      const fitScale = Math.min(scaleX, scaleY);

      setScale(Math.max(0.4, Math.min(fitScale, 2.5)));
    } catch (e) {
      console.warn('Auto fit calculation:', e);
    }
  }, [isAutoFit, pdfDoc, currentPage, showThumbnails, isPresentationMode]);

  useEffect(() => {
    updateAutoFitScale();
    const handleResize = () => updateAutoFitScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateAutoFitScale]);

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

  // Fullscreen Presentation Mode Toggle
  const toggleFullscreen = () => {
    sound.click();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        setIsPresentationMode(true);
      }).catch(() => {
        setIsPresentationMode(prev => !prev);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setIsPresentationMode(false);
      }).catch(() => {
        setIsPresentationMode(false);
      });
    }
  };

  // Keyboard Slide Navigation
  useEffect(() => {
    if (!isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPage(totalPages);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUnlocked, currentPage, totalPages, goToPage]);

  // Touch Swipe Navigation Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

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
  // ----------------------------------------------------
  // MAIN INSTRUMENTED DOCUMENT VIEWER (DOCSEND FULL-SLIDE UX)
  // ----------------------------------------------------
  return (
    <div className={`min-h-screen bg-[#0C0C0E] text-white flex flex-col select-none ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-30 bg-[#141416]/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <FileText size={16} />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {uvlDoc.name}
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span>v{uvlDoc.currentVersionNumber}</span>
              <span>•</span>
              <span>{totalPages} Slides</span>
              {shareLink.label && (
                <>
                  <span>•</span>
                  <span className="text-neutral-300 truncate max-w-[120px]">{shareLink.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Toggle Thumbnails Drawer */}
          <button
            onClick={() => setShowThumbnails(prev => !prev)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              showThumbnails
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800'
            }`}
            title="Toggle Slide Thumbnails Drawer"
          >
            <Layers size={13} />
            <span>Slides</span>
          </button>
        </div>

        {/* Center / Right Slide Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Slide Selector & Arrows */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full px-2 py-1 text-xs">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1 hover:text-white disabled:text-neutral-600 transition-colors cursor-pointer"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              value={currentPage}
              onChange={e => goToPage(Number(e.target.value))}
              className="bg-transparent text-neutral-200 text-xs font-mono font-semibold outline-none cursor-pointer px-1 text-center"
              title="Select slide"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <option key={p} value={p} className="bg-neutral-900 text-white">
                  {p} / {totalPages}
                </option>
              ))}
            </select>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 hover:text-white disabled:text-neutral-600 transition-colors cursor-pointer"
              title="Next Slide (Right Arrow, Space)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Auto-Fit / Custom Zoom Toggle */}
          <button
            onClick={() => {
              setIsAutoFit(prev => !prev);
              if (!isAutoFit) updateAutoFitScale();
            }}
            className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              isAutoFit
                ? 'bg-neutral-800 border-neutral-700 text-white'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle Auto-Fit to Window"
          >
            <Sparkles size={12} className={isAutoFit ? 'text-amber-400' : ''} />
            <span>{isAutoFit ? 'Fit Slide' : `${Math.round(scale * 100)}%`}</span>
          </button>

          {/* Manual Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-full px-1.5 py-1 text-xs">
            <button
              onClick={() => {
                setIsAutoFit(false);
                setScale(prev => Math.max(0.5, prev - 0.15));
              }}
              className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              onClick={() => {
                setIsAutoFit(false);
                setScale(prev => Math.min(2.5, prev + 0.15));
              }}
              className="p-1 hover:text-white text-neutral-400 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Fullscreen / Full Slide Presentation Mode (F) */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
            title="Presentation Mode (Press F)"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Full Slide'}</span>
          </button>

          {/* Download Button (Only when explicitly permitted) */}
          {shareLink.allowDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Download Document"
            >
              <Download size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Reading Viewport */}
      <div
        className="flex-1 flex overflow-hidden relative"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Thumbnails Rail (Collapsible) */}
        {showThumbnails && (
          <aside className="w-28 sm:w-36 bg-[#141416] border-r border-neutral-800 p-2 overflow-y-auto flex flex-col gap-2 z-20 transition-all shadow-xl">
            <div className="text-[10px] uppercase font-bold text-neutral-500 px-1 pt-1 pb-1">
              Slides ({totalPages})
            </div>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? 'border-white bg-white/15 text-white font-bold ring-1 ring-white/50'
                    : 'border-neutral-800/60 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <div className="w-full aspect-[16/10] bg-neutral-800/80 rounded-lg flex items-center justify-center text-[10px] font-mono mb-1">
                  Slide {pageNum}
                </div>
                <span className="text-[10px]">#{pageNum}</span>
              </button>
            ))}
          </aside>
        )}

        {/* Center Canvas Viewport with Watermark and Floating Chevrons */}
        <main className="flex-1 overflow-auto p-2 sm:p-6 flex items-center justify-center relative group">
          {/* Floating Left Arrow (Hover / Touch) */}
          {currentPage > 1 && (
            <button
              onClick={() => goToPage(currentPage - 1)}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md shadow-2xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center cursor-pointer border border-white/10"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Floating Right Arrow (Hover / Touch) */}
          {currentPage < totalPages && (
            <button
              onClick={() => goToPage(currentPage + 1)}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md shadow-2xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center cursor-pointer border border-white/10"
              title="Next Slide (Right Arrow, Space)"
            >
              <ChevronRight size={26} />
            </button>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-400 py-20">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-xs">Rendering slide canvas...</span>
            </div>
          ) : loadError ? (
            <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center">
              <AlertCircle size={28} className="text-red-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-white mb-1">Document Render Error</h3>
              <p className="text-xs text-neutral-400">{loadError}</p>
            </div>
          ) : (
            <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white border border-neutral-800/80 transition-all">
              {/* PDF Canvas */}
              <canvas ref={canvasRef} className="block max-w-full h-auto" />

              {/* Diagonal Watermark Overlay */}
              {watermarkText && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-20">
                  <div className="transform -rotate-45 select-none opacity-20 text-neutral-900 font-mono text-xl sm:text-3xl font-extrabold tracking-widest whitespace-nowrap text-center">
                    {watermarkText}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Interactive DocSend Scrubber & Status Dock */}
      <footer className="border-t border-neutral-800/80 bg-[#141416]/95 backdrop-blur-md py-2.5 px-4 text-[11px] text-neutral-400 flex flex-col gap-2">
        {/* Interactive Multi-Segment Slide Scrubber */}
        <div className="flex items-center gap-1 w-full max-w-3xl mx-auto py-0.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              title={`Jump to Slide ${p}`}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                p === currentPage
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-y-125'
                  : p < currentPage
                  ? 'bg-neutral-600 hover:bg-neutral-500'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* Footer Info Row */}
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Slide {currentPage} of {totalPages}</span>
            <span>•</span>
            <span className="text-neutral-400">{activeSecondsOnCurrentPage}s on current slide</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-neutral-500">Shortcuts: ← → / Space / F</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-300">Protected by UVL Documents</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
