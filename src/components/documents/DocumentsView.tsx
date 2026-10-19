import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  UVLDocument,
  UVLShareLink,
  UVLDocumentVersion,
  UVLDocumentSession
} from '../../types';
import {
  FileText,
  UploadCloud,
  Share2,
  BarChart3,
  Users,
  Settings,
  Plus,
  Search,
  Folder,
  Copy,
  Check,
  QrCode,
  Lock,
  Mail,
  Download,
  AlertTriangle,
  Clock,
  Trash2,
  Eye,
  History,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { sound } from '../../utils/sound';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    documentVersions,
    shareLinks,
    documentSessions,
    uploadDocument,
    uploadDocumentVersion,
    createShareLink,
    revokeShareLink,
    deleteDocument,
    getDocumentAnalytics,
    auditLogs
  } = useWorkspace();

  const [activeSubTab, setActiveSubTab] = useState<'library' | 'analytics' | 'sessions' | 'settings'>('library');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [newVersionModalOpen, setNewVersionModalOpen] = useState<boolean>(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState<boolean>(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState<string>('');
  const [uploadDesc, setUploadDesc] = useState<string>('');
  const [uploadFolder, setUploadFolder] = useState<string>('Investor Decks');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Version Form State
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionChangelog, setVersionChangelog] = useState<string>('');

  // Create Link Form State
  const [linkLabel, setLinkLabel] = useState<string>('');
  const [linkPassword, setLinkPassword] = useState<string>('');
  const [linkExpiryDays, setLinkExpiryDays] = useState<number>(30);
  const [linkRequireEmail, setLinkRequireEmail] = useState<boolean>(false);
  const [linkRequireVerified, setLinkRequireVerified] = useState<boolean>(false);
  const [linkAllowDownload, setLinkAllowDownload] = useState<boolean>(false);
  const [linkWatermark, setLinkWatermark] = useState<boolean>(false);
  const [linkWatermarkText, setLinkWatermarkText] = useState<string>('');
  const [linkAllowlistDomains, setLinkAllowlistDomains] = useState<string>('');

  // Analytics Filters
  const [analyticsVersionFilter, setAnalyticsVersionFilter] = useState<string>('all');
  const [analyticsLinkFilter, setAnalyticsLinkFilter] = useState<string>('all');

  // Resolved active document
  const activeDoc = useMemo(() => {
    if (selectedDocId) return documents.find(d => d.id === selectedDocId);
    return documents[0] || null;
  }, [documents, selectedDocId]);

  // Folders list
  const folders = useMemo(() => {
    const set = new Set(documents.map(d => d.folder || 'General'));
    return ['All', ...Array.from(set)];
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = selectedFolder === 'All' || d.folder === selectedFolder;
      return matchesSearch && matchesFolder;
    });
  }, [documents, searchQuery, selectedFolder]);

  // Analytics summary for active document
  const analytics = useMemo(() => {
    if (!activeDoc) return null;
    return getDocumentAnalytics(
      activeDoc.id,
      analyticsVersionFilter !== 'all' ? analyticsVersionFilter : undefined,
      analyticsLinkFilter !== 'all' ? analyticsLinkFilter : undefined
    );
  }, [activeDoc, analyticsVersionFilter, analyticsLinkFilter, getDocumentAnalytics]);

  // Copy Link Helper
  const handleCopyLink = (token: string) => {
    sound.click();
    const url = `${window.location.origin}/d/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Submit Upload Document
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const newDoc = await uploadDocument(uploadFile, uploadName, uploadDesc, uploadFolder);
      setSelectedDocId(newDoc.id);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to process and upload PDF document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit New Version
  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionFile || !activeDoc) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      await uploadDocumentVersion(activeDoc.id, versionFile, versionChangelog);
      setNewVersionModalOpen(false);
      setVersionFile(null);
      setVersionChangelog('');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload replacement version.');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Create Share Link
  const handleCreateLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;

    const expiresAt = linkExpiryDays > 0 ? new Date(Date.now() + linkExpiryDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
    const domains = linkAllowlistDomains
      .split(',')
      .map(d => d.trim().replace(/^@/, ''))
      .filter(Boolean);

    await createShareLink({
      documentId: activeDoc.id,
      label: linkLabel.trim() || 'Investor Share Link',
      expiresAt,
      password: linkPassword.trim() || undefined,
      requireEmail: linkRequireEmail || linkRequireVerified,
      requireVerifiedEmail: linkRequireVerified,
      allowlistDomains: domains,
      allowDownload: linkAllowDownload,
      watermarkEnabled: linkWatermark,
      watermarkText: linkWatermarkText.trim() || undefined
    });

    setCreateLinkModalOpen(false);
    setLinkLabel('');
    setLinkPassword('');
    setLinkWatermark(false);
    setLinkWatermarkText('');
    setLinkAllowlistDomains('');
  };

  // Export Analytics CSV
  const handleExportCSV = () => {
    if (!activeDoc || !analytics) return;
    sound.click();

    const rows = [
      ['Metric', 'Value'],
      ['Document Name', activeDoc.name],
      ['Total Viewing Sessions', analytics.totalSessions],
      ['Estimated Unique Viewers', analytics.estimatedUniqueViewers],
      ['Verified Viewers', analytics.verifiedViewers],
      ['Returning Sessions', analytics.returningSessions],
      ['Average Active Duration (seconds)', analytics.averageActiveDurationSeconds],
      ['Average Completion Percent (%)', analytics.averageCompletionPercent],
      ['Total Downloads', analytics.totalDownloads],
      [],
      ['Page Number', 'View Count', 'Average Active Seconds', 'Dropoff Viewers Reached', 'Dropoff %'],
      ...analytics.pagePerformance.map((p, idx) => {
        const drop = analytics.dropoffCurve[idx] || { viewersReached: 0, percentReached: 0 };
        return [p.pageNumber, p.viewCount, p.averageActiveSeconds, drop.viewersReached, `${drop.percentReached}%`];
      })
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = window.document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeDoc.name.replace(/[^a-zA-Z0-9]/g, '_')}_analytics.csv`);
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-black">Documents</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-[10px] font-mono text-[#6E6E73]">
              DocSend-Grade Tracking
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-1">
            Secure presentation sharing, page-by-page engagement tracking, watermark protection, and verified investor links.
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5E7] rounded-full p-1 text-xs font-medium">
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('library');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'library' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <FileText size={13} />
              <span>Library</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('analytics');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'analytics' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <BarChart3 size={13} />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('sessions');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'sessions' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Users size={13} />
              <span>Visitor Sessions</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('settings');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'settings' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Settings size={13} />
              <span>Settings</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.click();
              setUploadModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: LIBRARY & SHARE LINKS                         */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'library' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Documents List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search & Folder Filters */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-2.5 text-[#6E6E73]" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <select
                value={selectedFolder}
                onChange={e => setSelectedFolder(e.target.value)}
                className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-medium"
              >
                {folders.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Documents Cards */}
            <div className="space-y-2">
              {filteredDocs.length === 0 ? (
                <div className="p-8 text-center bg-[#F5F5F7] border border-dashed border-[#E5E5E7] rounded-3xl">
                  <FileText size={28} className="text-[#A1A1AA] mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-black">No Documents Yet</h3>
                  <p className="text-xs text-[#6E6E73] mt-1 mb-4">
                    Upload your pitch deck or executive summary to start tracking engagement.
                  </p>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Upload Pitch Deck</span>
                  </button>
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = activeDoc?.id === doc.id;
                  const docLinks = shareLinks.filter(l => l.documentId === doc.id && l.status === 'active');
                  const docSessions = documentSessions.filter(s => s.documentId === doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        sound.click();
                        setSelectedDocId(doc.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-black bg-white shadow-sm ring-1 ring-black/10'
                          : 'border-[#E5E5E7] bg-[#FFFFFF] hover:border-black/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {doc.thumbnailUrl ? (
                            <img
                              src={doc.thumbnailUrl}
                              alt={doc.name}
                              className="w-12 h-16 object-cover rounded-md border border-[#E5E5E7] shadow-2xs"
                            />
                          ) : (
                            <div className="w-12 h-16 rounded-md bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center text-[#6E6E73]">
                              <FileText size={20} />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-black leading-tight">{doc.name}</h3>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F5F7] border border-[#E5E5E7] text-[#6E6E73] font-mono">
                                v{doc.currentVersionNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6E6E73] mt-0.5 line-clamp-1">{doc.description || 'No description'}</p>

                            <div className="flex items-center gap-3 text-[10px] text-[#6E6E73] mt-2">
                              <span>{doc.totalPages} Pages</span>
                              <span>•</span>
                              <span>{(doc.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                              <span>•</span>
                              <span>{docLinks.length} Active Links</span>
                              <span>•</span>
                              <span className="font-semibold text-black">{docSessions.length} Views</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={14} className={isSelected ? 'text-black' : 'text-[#D1D1D6]'} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Document Details & Share Links (7 cols) */}
          <div className="lg:col-span-7">
            {activeDoc ? (
              <div className="space-y-6">
                {/* Document Detail Header Card */}
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                          {activeDoc.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#6E6E73]">Folder: <b className="text-black">{activeDoc.folder}</b></span>
                      </div>
                      <h2 className="text-lg font-bold text-black mt-1">{activeDoc.name}</h2>
                      <p className="text-xs text-[#6E6E73]">{activeDoc.description || 'No description provided.'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          sound.click();
                          setNewVersionModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black text-xs font-semibold flex items-center gap-1.5 transition-all"
                        title="Upload replacement version (preserves links)"
                      >
                        <History size={13} />
                        <span>Replace Version</span>
                      </button>

                      <button
                        onClick={() => {
                          sound.click();
                          setCreateLinkModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Share2 size={13} />
                        <span>Create Share Link</span>
                      </button>
                    </div>
                  </div>

                  {/* Versions History Strip */}
                  <div className="pt-3 flex items-center gap-4 text-xs text-[#6E6E73] overflow-x-auto">
                    <span className="font-semibold text-black">Version History:</span>
                    {documentVersions
                      .filter(v => v.documentId === activeDoc.id)
                      .map(ver => (
                        <div
                          key={ver.id}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                            ver.versionNumber === activeDoc.currentVersionNumber
                              ? 'border-black bg-neutral-100 text-black font-semibold'
                              : 'border-[#E5E5E7] bg-white text-[#6E6E73]'
                          }`}
                        >
                          <span>v{ver.versionNumber}</span>
                          <span>({ver.totalPages}p)</span>
                          <span className="text-[#A1A1AA]">{new Date(ver.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Share Links Manager Table */}
                <div className="bg-[#FFFFFF] border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-black">Active Share Links</h3>
                      <p className="text-xs text-[#6E6E73]">
                        Independent share links with customizable passcodes, email gating, watermarks, and instant revocation.
                      </p>
                    </div>

                    <button
                      onClick={() => setCreateLinkModalOpen(true)}
                      className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>New Link</span>
                    </button>
                  </div>

                  {shareLinks.filter(l => l.documentId === activeDoc.id).length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-[#E5E5E7] rounded-2xl bg-[#F5F5F7]">
                      <Share2 size={24} className="text-[#A1A1AA] mx-auto mb-1.5" />
                      <p className="text-xs text-[#6E6E73]">No links created yet for this document.</p>
                      <button
                        onClick={() => setCreateLinkModalOpen(true)}
                        className="mt-2 text-xs font-semibold text-black underline"
                      >
                        Create your first share link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shareLinks
                        .filter(l => l.documentId === activeDoc.id)
                        .map(link => {
                          const linkSessions = documentSessions.filter(s => s.shareLinkId === link.id);
                          const isRevoked = link.status === 'revoked';

                          return (
                            <div
                              key={link.id}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isRevoked
                                  ? 'border-neutral-200 bg-neutral-50 opacity-60'
                                  : 'border-[#E5E5E7] bg-white hover:border-[#D1D1D6]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-black">{link.label}</span>
                                  {isRevoked ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                                      REVOKED
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                      ACTIVE
                                    </span>
                                  )}
                                  {link.passwordProtected && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium flex items-center gap-1">
                                      <Lock size={10} />
                                      Passcode
                                    </span>
                                  )}
                                  {(link.requireEmail || link.requireVerifiedEmail) && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium flex items-center gap-1">
                                      <Mail size={10} />
                                      {link.requireVerifiedEmail ? 'Verified Email' : 'Email Required'}
                                    </span>
                                  )}
                                  {link.watermarkEnabled && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-800 font-medium">
                                      Watermarked
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-[#6E6E73] mt-1.5">
                                  <span className="font-mono text-black font-medium">{linkSessions.length} Views</span>
                                  <span>•</span>
                                  <span>Created: {new Date(link.createdAt).toLocaleDateString()}</span>
                                  {link.expiresAt && (
                                    <>
                                      <span>•</span>
                                      <span>Expires: {new Date(link.expiresAt).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1.5">
                                {!isRevoked && (
                                  <>
                                    <button
                                      onClick={() => handleCopyLink(link.token)}
                                      className="px-2.5 py-1 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs text-black font-semibold flex items-center gap-1 transition-all"
                                      title="Copy shareable link"
                                    >
                                      {copiedToken === link.token ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                      <span>{copiedToken === link.token ? 'Copied' : 'Copy'}</span>
                                    </button>

                                    <a
                                      href={`/d/${link.token}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black"
                                      title="Open viewer in new tab"
                                    >
                                      <ExternalLink size={12} />
                                    </a>

                                    <button
                                      onClick={() => revokeShareLink(link.id)}
                                      className="px-2.5 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-all"
                                      title="Revoke access immediately"
                                    >
                                      Revoke
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl">
                <p className="text-xs text-[#6E6E73]">Select a document from the left to view details and links.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: DETAILED ENGAGEMENT ANALYTICS                 */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'analytics' && activeDoc && analytics && (
        <div className="space-y-6">
          {/* Analytics Filters & Export Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-black">{activeDoc.name}</span>
              <span className="text-xs text-[#6E6E73]">|</span>
              <select
                value={analyticsVersionFilter}
                onChange={e => setAnalyticsVersionFilter(e.target.value)}
                className="px-3 py-1 rounded-xl border border-[#E5E5E7] bg-white text-xs text-black"
              >
                <option value="all">All Versions</option>
                {documentVersions
                  .filter(v => v.documentId === activeDoc.id)
                  .map(v => (
                    <option key={v.id} value={v.id}>
                      Version {v.versionNumber} ({v.totalPages}p)
                    </option>
                  ))}
              </select>

              <select
                value={analyticsLinkFilter}
                onChange={e => setAnalyticsLinkFilter(e.target.value)}
                className="px-3 py-1 rounded-xl border border-[#E5E5E7] bg-white text-xs text-black"
              >
                <option value="all">All Share Links</option>
                {shareLinks
                  .filter(l => l.documentId === activeDoc.id)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E7] hover:bg-[#EBEBED] text-xs font-semibold text-black inline-flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <FileSpreadsheet size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Total Sessions
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">{analytics.totalSessions}</span>
              <span className="text-[10px] text-[#A1A1AA]">Viewing sessions</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                  Unique Viewers
                </span>
                <span className="text-[9px] text-neutral-400 font-mono" title="Deduplicated by IP + User-Agent hash">
                  [Deduplicated]
                </span>
              </div>
              <span className="text-2xl font-bold text-black mt-1 block">{analytics.estimatedUniqueViewers}</span>
              <span className="text-[10px] text-[#A1A1AA]">Estimated unique</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Verified Viewers
              </span>
              <span className="text-2xl font-bold text-black mt-1 block text-emerald-600">
                {analytics.verifiedViewers}
              </span>
              <span className="text-[10px] text-[#A1A1AA]">OTP Authenticated</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Completion Rate
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">
                {analytics.averageCompletionPercent}%
              </span>
              <span className="text-[10px] text-[#A1A1AA]">Pages viewed / Total</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Avg Read Time
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">
                {Math.floor(analytics.averageActiveDurationSeconds / 60)}m {analytics.averageActiveDurationSeconds % 60}s
              </span>
              <span className="text-[10px] text-[#A1A1AA]">Active visible time</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Downloads
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">{analytics.totalDownloads}</span>
              <span className="text-[10px] text-[#A1A1AA]">Authorized requests</span>
            </div>
          </div>

          {/* Dropoff Curve & Page Engagement Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dropoff Curve */}
            <div className="p-5 rounded-3xl border border-[#E5E5E7] bg-white space-y-4">
              <div>
                <h3 className="text-sm font-bold text-black">Viewer Dropoff Curve</h3>
                <p className="text-xs text-[#6E6E73]">Percentage of viewing sessions reaching each page.</p>
              </div>

              <div className="space-y-2 pt-2">
                {analytics.dropoffCurve.map(curve => (
                  <div key={curve.pageNumber} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Page {curve.pageNumber}</span>
                      <span className="font-semibold text-black">
                        {curve.percentReached}% ({curve.viewersReached} viewers)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-500"
                        style={{ width: `${curve.percentReached}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page-by-Page Active Time */}
            <div className="p-5 rounded-3xl border border-[#E5E5E7] bg-white space-y-4">
              <div>
                <h3 className="text-sm font-bold text-black">Active Reading Time Per Page</h3>
                <p className="text-xs text-[#6E6E73]">Average active seconds spent on each slide/page.</p>
              </div>

              <div className="space-y-2 pt-2">
                {analytics.pagePerformance.map(perf => {
                  const maxSecs = Math.max(1, ...analytics.pagePerformance.map(p => p.averageActiveSeconds));
                  const barWidth = Math.round((perf.averageActiveSeconds / maxSecs) * 100);

                  return (
                    <div key={perf.pageNumber} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span>Page {perf.pageNumber}</span>
                        <span className="font-semibold text-black">
                          {perf.averageActiveSeconds}s avg ({perf.viewCount} views)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: VISITOR SESSIONS TABLE                        */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'sessions' && (
        <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-black">All Visitor Sessions</h3>
            <p className="text-xs text-[#6E6E73]">
              Audit log of viewing sessions with viewer classification (Anonymous vs. Self-Reported vs. Verified).
            </p>
          </div>

          {documentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E73] bg-[#F5F5F7] rounded-2xl">
              No sessions recorded yet. Share a document link to start gathering audience telemetry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#6E6E73] font-semibold">
                    <th className="pb-3 pl-2">Viewer</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Document</th>
                    <th className="pb-3">Active Duration</th>
                    <th className="pb-3">Pages Read</th>
                    <th className="pb-3">Completion</th>
                    <th className="pb-3">Download</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {documentSessions.map(session => {
                    const doc = documents.find(d => d.id === session.documentId);
                    return (
                      <tr key={session.id} className="hover:bg-[#F5F5F7] transition-colors">
                        <td className="py-3 pl-2 font-mono font-medium text-black">
                          {session.viewerEmail || 'Anonymous Viewer'}
                        </td>
                        <td className="py-3">
                          {session.viewerType === 'verified' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Verified
                            </span>
                          ) : session.viewerType === 'self_reported' ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">
                              Self-Reported
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-semibold">
                              Anonymous
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-[#6E6E73]">{doc?.name || session.documentId}</td>
                        <td className="py-3 font-mono">
                          {Math.floor(session.activeDurationSeconds / 60)}m {session.activeDurationSeconds % 60}s
                        </td>
                        <td className="py-3 font-mono">{session.pagesViewed?.length || 1} pages</td>
                        <td className="py-3 font-semibold text-black">{session.completionPercent}%</td>
                        <td className="py-3">
                          {session.downloadRequested ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <Check size={12} />
                              Yes
                            </span>
                          ) : (
                            <span className="text-[#A1A1AA]">No</span>
                          )}
                        </td>
                        <td className="py-3 text-[#6E6E73]">{new Date(session.startedAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: MODULE SETTINGS & AUDIT                       */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-black">UVL Documents Security Configuration</h3>
            <p className="text-xs text-[#6E6E73]">
              Default security policies enforced across all document links in this workspace.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
                <span className="text-xs font-bold text-black">Signed Asset URLs</span>
                <p className="text-[11px] text-[#6E6E73]">
                  All PDF assets are stored in private storage. Signed tokens expire in 15 minutes.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
                <span className="text-xs font-bold text-black">Passcode Hashing</span>
                <p className="text-[11px] text-[#6E6E73]">
                  Passcodes are hashed using Web Crypto SHA-256 with unique salting. Never logged in plaintext.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-black">Documents Audit Trail</h3>
            <div className="space-y-2">
              {auditLogs
                .filter(l => l.module === 'documents')
                .slice(0, 15)
                .map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border border-[#E5E5E7] text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-black">{log.action}</span>
                      <span className="text-[#6E6E73] ml-2 font-mono">[{log.entityType}: {log.entityId}]</span>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: UPLOAD DOCUMENT                             */}
      {/* ---------------------------------------------------- */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-black">Upload PDF Document</h2>
              <button onClick={() => setUploadModalOpen(false)} className="text-xs text-[#6E6E73] hover:text-black">
                Close
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Drop Area */}
              <div
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  uploadFile ? 'border-black bg-neutral-50' : 'border-[#E5E5E7] hover:border-black/40'
                }`}
                onClick={() => document.getElementById('pdf-file-input')?.click()}
              >
                <UploadCloud size={28} className="text-[#6E6E73] mx-auto mb-2" />
                {uploadFile ? (
                  <div>
                    <span className="text-xs font-bold text-black block">{uploadFile.name}</span>
                    <span className="text-[10px] text-[#6E6E73]">
                      {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-semibold text-black block">Choose a PDF or drag here</span>
                    <span className="text-[10px] text-[#6E6E73]">Up to 50MB. Safe private file handling.</span>
                  </div>
                )}
                <input
                  id="pdf-file-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setUploadFile(f);
                      if (!uploadName) {
                        setUploadName(f.name.replace(/\.pdf$/i, ''));
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UVL Seed Pitch Deck 2026"
                  value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Folder Category</label>
                <input
                  type="text"
                  placeholder="e.g. Investor Decks, Memos, Due Diligence"
                  value={uploadFolder}
                  onChange={e => setUploadFolder(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  placeholder="Optional context for operators"
                  value={uploadDesc}
                  onChange={e => setUploadDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs font-medium text-black hover:bg-[#F5F5F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isUploading}
                  className="px-5 py-2 rounded-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  {isUploading ? 'Inspecting & Processing...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: UPLOAD REPLACEMENT VERSION                  */}
      {/* ---------------------------------------------------- */}
      {newVersionModalOpen && activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-black">Upload New Version</h2>
              <p className="text-xs text-[#6E6E73]">
                Replacing "{activeDoc.name}". Existing links will automatically serve this version while historical analytics are cleanly preserved.
              </p>
            </div>

            <form onSubmit={handleVersionSubmit} className="space-y-4">
              <div
                className="p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer border-[#E5E5E7] hover:border-black"
                onClick={() => document.getElementById('version-file-input')?.click()}
              >
                <UploadCloud size={28} className="text-[#6E6E73] mx-auto mb-2" />
                {versionFile ? (
                  <span className="text-xs font-bold text-black block">{versionFile.name}</span>
                ) : (
                  <span className="text-xs font-semibold text-black block">Select revised PDF</span>
                )}
                <input
                  id="version-file-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setVersionFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Changelog / Release Notes</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Updated financial projections slide 8"
                  value={versionChangelog}
                  onChange={e => setVersionChangelog(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              {uploadError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl">{uploadError}</div>}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewVersionModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!versionFile || isUploading}
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold"
                >
                  {isUploading ? 'Uploading Version...' : `Publish Version ${activeDoc.currentVersionNumber + 1}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: CREATE SHARE LINK                           */}
      {/* ---------------------------------------------------- */}
      {createLinkModalOpen && activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-black">Create Secure Share Link</h2>
              <p className="text-xs text-[#6E6E73]">
                Generate an unguessable link for "{activeDoc.name}".
              </p>
            </div>

            <form onSubmit={handleCreateLinkSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1">Link Internal Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sequoia Capital / Partner Meeting"
                  value={linkLabel}
                  onChange={e => setLinkLabel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Optional Passcode Protection</label>
                <input
                  type="text"
                  placeholder="Leave empty for open link"
                  value={linkPassword}
                  onChange={e => setLinkPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              {/* Security Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkRequireEmail}
                    onChange={e => setLinkRequireEmail(e.target.checked)}
                    className="rounded text-black"
                  />
                  <span className="text-xs text-black">Require viewer email before viewing</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkRequireVerified}
                    onChange={e => setLinkRequireVerified(e.target.checked)}
                    className="rounded text-black"
                  />
                  <span className="text-xs text-black">Require verified work email via 6-digit OTP</span>
                </label>

                {linkRequireVerified && (
                  <div>
                    <label className="text-[11px] text-[#6E6E73] block mb-1">Authorized Domains (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. sequoiacap.com, accel.com"
                      value={linkAllowlistDomains}
                      onChange={e => setLinkAllowlistDomains(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkAllowDownload}
                    onChange={e => setLinkAllowDownload(e.target.checked)}
                    className="rounded text-black"
                  />
                  <span className="text-xs text-black">Allow viewer to download original PDF</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkWatermark}
                    onChange={e => setLinkWatermark(e.target.checked)}
                    className="rounded text-black"
                  />
                  <span className="text-xs text-black">Apply dynamic diagonal watermark</span>
                </label>

                {linkWatermark && (
                  <div>
                    <label className="text-[11px] text-[#6E6E73] block mb-1">Watermark Custom Text (optional)</label>
                    <input
                      type="text"
                      placeholder="Default: Viewer Email • CONFIDENTIAL"
                      value={linkWatermarkText}
                      onChange={e => setLinkWatermarkText(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateLinkModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md"
                >
                  Generate Share Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
