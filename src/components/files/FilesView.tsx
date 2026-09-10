import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { FileItem } from '../../types';
import { uploadToStorage } from '../../lib/supabase';
import { sound } from '../../utils/sound';
import {
  FolderArchive,
  UploadCloud,
  File,
  FileCode,
  FileImage,
  Folder,
  History,
  Eye,
  Trash2,
  X,
  Plus,
  Mic,
  MicOff,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const FilesView: React.FC = () => {
  const {
    files,
    uploadFile,
    addFileVersion,
    deleteFile,
    projects,
    users
  } = useWorkspace();

  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [versionHistoryFile, setVersionHistoryFile] = useState<FileItem | null>(null);

  // New Version Form
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionSize, setNewVersionSize] = useState('1.5 MB');

  // Real Storage Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploadingVault, setIsUploadingVault] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadSize, setUploadSize] = useState('2.4 MB');
  const [uploadType, setUploadType] = useState('application/pdf');
  const [uploadFolder, setUploadFolder] = useState('Specs');
  const [uploadProjectId, setUploadProjectId] = useState(projects[0]?.id || '');
  const [vaultSelectedFile, setVaultSelectedFile] = useState<File | null>(null);
  const vaultFileInputRef = useRef<HTMLInputElement>(null);

  // Voice Memo recording in Vault
  const [isVoiceMemoOpen, setIsVoiceMemoOpen] = useState(false);
  const [isVaultRecording, setIsVaultRecording] = useState(false);
  const [vaultRecordSeconds, setVaultRecordSeconds] = useState(0);
  const [vaultMemoTitle, setVaultMemoTitle] = useState('');
  const [isSavingVoiceMemo, setIsSavingVoiceMemo] = useState(false);
  const vaultMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vaultAudioChunksRef = useRef<Blob[]>([]);
  const vaultRecordTimerRef = useRef<number | null>(null);

  const defaultFolders = ['Specs', 'Pitch Decks', 'Expenses', 'Investor Relations', 'Voice Memos'];
  const folders = Array.from(new Set([...defaultFolders, ...files.map(f => f.folder)]));

  const filteredFiles = files.filter(f => {
    if (selectedFolder !== 'all' && f.folder !== selectedFolder) return false;
    if (selectedProjectId !== 'all' && f.projectId !== selectedProjectId) return false;
    return true;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const sizeKb = (droppedFile.size / 1024).toFixed(1);
      const sizeMb = (droppedFile.size / (1024 * 1024)).toFixed(2);
      const sizeStr = droppedFile.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

      setIsUploadingVault(true);
      try {
        const sanitizedName = droppedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uploadPath = `vault/${Date.now()}-${sanitizedName}`;
        const { url } = await uploadToStorage(droppedFile, uploadPath, droppedFile.type);

        await uploadFile({
          name: droppedFile.name,
          size: sizeStr,
          type: droppedFile.type || 'application/octet-stream',
          projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'p-1',
          folder: selectedFolder !== 'all' ? selectedFolder : 'Ingested',
          notes: 'Drag-and-drop vault ingestion (live storage)',
          fileUrl: url
        });
      } catch (err) {
        console.error('Drop upload failed:', err);
        alert('Failed to upload dropped file to database storage.');
      } finally {
        setIsUploadingVault(false);
      }
    }
  };

  const handleVaultFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.click();
    setVaultSelectedFile(file);
    setUploadName(file.name);
    setUploadType(file.type || 'application/octet-stream');
    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    setUploadSize(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`);
  };

  const handleManualUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    setIsUploadingVault(true);
    try {
      let liveUrl: string | undefined = undefined;

      if (vaultSelectedFile) {
        const sanitizedName = vaultSelectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uploadPath = `vault/${Date.now()}-${sanitizedName}`;
        const { url } = await uploadToStorage(vaultSelectedFile, uploadPath, vaultSelectedFile.type);
        liveUrl = url;
      }

      await uploadFile({
        name: uploadName.trim(),
        size: uploadSize,
        type: uploadType,
        projectId: uploadProjectId || projects[0]?.id || 'p-1',
        folder: uploadFolder || 'Specs',
        notes: 'Uploaded via Command Center vault',
        fileUrl: liveUrl
      });

      setUploadName('');
      setVaultSelectedFile(null);
      setIsUploadOpen(false);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file to database storage.');
    } finally {
      setIsUploadingVault(false);
    }
  };

  const startVaultRecording = async () => {
    try {
      sound.click();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      vaultAudioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      vaultMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          vaultAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsVaultRecording(true);
      setVaultRecordSeconds(0);

      vaultRecordTimerRef.current = window.setInterval(() => {
        setVaultRecordSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Microphone permission is required to record audio voice memos.');
    }
  };

  const cancelVaultRecording = () => {
    sound.click();
    if (vaultRecordTimerRef.current) clearInterval(vaultRecordTimerRef.current);
    if (vaultMediaRecorderRef.current) {
      vaultMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      vaultMediaRecorderRef.current = null;
    }
    vaultAudioChunksRef.current = [];
    setIsVaultRecording(false);
    setVaultRecordSeconds(0);
    setIsVoiceMemoOpen(false);
  };

  const stopAndSaveVaultRecording = async () => {
    if (!vaultMediaRecorderRef.current) return;
    sound.patchStamp();

    if (vaultRecordTimerRef.current) clearInterval(vaultRecordTimerRef.current);
    const durationMins = Math.floor(vaultRecordSeconds / 60);
    const durationSecs = vaultRecordSeconds % 60;
    const formattedDuration = `${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`;

    setIsSavingVoiceMemo(true);
    setIsVaultRecording(false);

    vaultMediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(vaultAudioChunksRef.current, { type: 'audio/webm' });
        const filePath = `vault-audio/memo-${Date.now()}.webm`;
        const { url } = await uploadToStorage(audioBlob, filePath, 'audio/webm');

        const sizeKb = (audioBlob.size / 1024).toFixed(1);
        const fileName = `${vaultMemoTitle.trim() || 'Audio Memo'} [${formattedDuration}].webm`;

        await uploadFile({
          name: fileName,
          size: `${sizeKb} KB`,
          type: 'audio/webm',
          projectId: projects[0]?.id || 'p-1',
          folder: 'Voice Memos',
          notes: `Recorded voice memo (${formattedDuration}) stored in database`,
          fileUrl: url
        });

        setIsVoiceMemoOpen(false);
        setVaultMemoTitle('');
        setVaultRecordSeconds(0);
      } catch (err) {
        console.error('Failed to save vault voice memo:', err);
        alert('Could not save voice memo to database storage.');
      } finally {
        setIsSavingVoiceMemo(false);
        if (vaultMediaRecorderRef.current) {
          vaultMediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          vaultMediaRecorderRef.current = null;
        }
      }
    };

    vaultMediaRecorderRef.current.stop();
  };

  const handleAddVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionHistoryFile || !newVersionNotes.trim()) return;

    addFileVersion(versionHistoryFile.id, {
      size: newVersionSize,
      notes: newVersionNotes.trim()
    });

    setNewVersionNotes('');
    const updated = files.find(f => f.id === versionHistoryFile.id);
    if (updated) setVersionHistoryFile(updated);
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    if (fileName.endsWith('.webm') || fileName.endsWith('.wav') || fileName.endsWith('.mp3') || fileType?.startsWith('audio/')) {
      return <Mic size={18} className="text-[#A1A1AA]" />;
    }
    if (fileName.endsWith('.svg') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileType?.startsWith('image/')) {
      return <FileImage size={18} className="text-[#A1A1AA]" />;
    }
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.csv') || fileName.endsWith('.json')) {
      return <FileCode size={18} className="text-white" />;
    }
    return <File size={18} className="text-white/60" />;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium tracking-widest uppercase text-[#6E6E73] mb-3 flex items-center gap-2">
              <span>Archive</span>
              <span>/</span>
              <span className="text-black">File Repository</span>
              <span>/</span>
              <span>Assets & Telemetry</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-black">
              Document enclave & vault.
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Project repositories, drag-and-drop vault sync, immutable version audits, and asset previews.
            </p>
          </div>

          <div className="self-start md:self-auto flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                sound.click();
                setIsVoiceMemoOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium rounded-full transition-all"
            >
              <Mic size={14} className="text-[#6E6E73]" />
              <span>Record Voice Memo</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium transition-all shadow-xs"
            >
              <UploadCloud size={15} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 pt-6 border-t border-[#E5E5E7] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#6E6E73] uppercase text-[11px] font-medium tracking-wider">Folder:</span>
            <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`px-3.5 py-1 rounded-full text-xs transition-all ${
                  selectedFolder === 'all'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                All
              </button>
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-3.5 py-1 rounded-full text-xs transition-all ${
                    selectedFolder === f
                      ? 'bg-white text-black font-semibold shadow-xs'
                      : 'text-[#6E6E73] hover:text-black'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6E6E73] uppercase text-[11px] font-medium tracking-wider">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3.5 py-1.5 focus:bg-white focus:outline-none focus:border-black transition-all"
            >
              <option value="all">All projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* DRAG AND DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-10 rounded-3xl border-2 transition-all text-center ${
          isDragging
            ? 'border-black bg-white shadow-md'
            : 'border-dashed border-[#E5E5E7] bg-[#F5F5F7] text-black hover:border-black/30 hover:bg-white'
        }`}
      >
        {isUploadingVault ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-black" />
            <h3 className="text-base font-semibold text-black">
              Uploading to Supabase Storage...
            </h3>
            <p className="text-xs text-[#6E6E73]">
              Writing binary object to Supabase bucket and indexing database metadata.
            </p>
          </div>
        ) : (
          <>
            <UploadCloud size={32} className="mx-auto mb-3 text-[#6E6E73]" />
            <h3 className="text-base font-semibold text-black">
              Drag and drop files directly here to ingest into Vault
            </h3>
            <p className="text-xs text-[#6E6E73] mt-1">
              Direct Supabase cloud storage sync with permanent URL preservation.
            </p>
          </>
        )}
      </div>

      {/* FILE REPOSITORY LIST */}
      <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
          <span>Repository Assets ({filteredFiles.length})</span>
          <span className="text-black">Live Supabase Storage</span>
        </div>

        <div className="space-y-3">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-white">
              <FolderArchive size={32} className="mx-auto text-[#6E6E73] mb-2" />
              <p className="text-sm font-semibold text-black">Vault is empty</p>
              <p className="text-xs text-[#6E6E73] mt-1">No documents stored in this space. Drag and drop, upload documents, or record audio memos above.</p>
            </div>
          ) : (
            filteredFiles.map(file => {
              const project = projects.find(p => p.id === file.projectId);
              const uploader = users.find(u => u.id === file.uploadedBy);

              return (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl border border-[#E5E5E7] bg-white hover:border-black/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] mt-0.5 text-black">
                      {getFileIcon(file.name, file.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className="font-semibold text-black hover:underline cursor-pointer text-sm"
                          onClick={() => setPreviewFile(file)}
                        >
                          {file.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-black font-semibold">
                          v{file.version}.0
                        </span>
                        {project && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73]">
                            {project.code}
                          </span>
                        )}
                        {file.downloadUrl && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold uppercase">
                            Live Storage
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6E6E73] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Folder size={12} /> {file.folder}
                        </span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{file.uploadedAt}</span>
                        {uploader && (
                          <>
                            <span>•</span>
                            <span>By {uploader.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {file.downloadUrl && (
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={file.name}
                        className="px-3.5 py-1.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full flex items-center gap-1.5 text-xs font-medium transition-all"
                        title="Download file from live Supabase storage"
                      >
                        <Download size={13} /> <span>Download</span>
                      </a>
                    )}

                    <button
                      onClick={() => setPreviewFile(file)}
                      className="px-3.5 py-1.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full flex items-center gap-1.5 text-xs font-medium transition-all"
                      title="Preview File"
                    >
                      <Eye size={13} /> <span>Preview</span>
                    </button>

                    <button
                      onClick={() => setVersionHistoryFile(file)}
                      className="px-3.5 py-1.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full flex items-center gap-1.5 text-xs font-medium transition-all"
                      title="Version History & Add Revision"
                    >
                      <History size={13} /> <span>History ({file.versions.length})</span>
                    </button>

                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-2 rounded-full border border-[#E5E5E7] hover:border-red-500 text-[#6E6E73] hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] text-black">
                  {getFileIcon(previewFile.name)}
                </div>
                <div>
                  <h3 className="font-serif font-medium text-lg text-black">
                    {previewFile.name}
                  </h3>
                  <span className="text-xs text-[#6E6E73]">
                    v{previewFile.version}.0 • {previewFile.size} • {previewFile.folder}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Live Asset Viewer */}
            <div className="p-8 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] min-h-[260px] flex flex-col justify-center items-center text-center">
              {previewFile.type?.startsWith('audio/') || previewFile.name.endsWith('.webm') || previewFile.name.endsWith('.wav') || previewFile.name.endsWith('.mp3') ? (
                <div className="space-y-4 w-full max-w-md p-5 rounded-2xl border border-[#E5E5E7] bg-white">
                  <div className="flex items-center justify-between text-[#6E6E73] text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-black uppercase"><Mic size={14} /> Live Audio Voice Recording</span>
                    <span>{previewFile.size}</span>
                  </div>
                  {previewFile.downloadUrl ? (
                    <audio src={previewFile.downloadUrl} controls className="w-full h-10" />
                  ) : (
                    <p className="text-[#6E6E73] text-xs">Processing audio stream...</p>
                  )}
                  <p className="text-xs text-[#6E6E73]">{previewFile.name}</p>
                </div>
              ) : previewFile.downloadUrl && (previewFile.type?.startsWith('image/') || previewFile.name.endsWith('.png') || previewFile.name.endsWith('.jpg') || previewFile.name.endsWith('.svg')) ? (
                <div className="space-y-3">
                  <img src={previewFile.downloadUrl} alt={previewFile.name} className="max-h-72 max-w-full object-contain rounded-xl border border-[#E5E5E7]" />
                  <p className="text-xs text-[#6E6E73]">Stored in Supabase bucket • {previewFile.size}</p>
                </div>
              ) : previewFile.name.endsWith('.svg') || previewFile.name.includes('Patch') ? (
                <div className="space-y-4">
                  <div className="w-64 h-24 mx-auto bg-black rounded-2xl flex items-center justify-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-serif tracking-[0.2em] text-white">
                        unfounded
                      </span>
                      <span className="text-xs uppercase tracking-[0.3em] text-white/80">
                        venture lab
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#6E6E73]">
                    Rendered SVG Vector Mesh: Monochromatic Morale Badge
                  </p>
                </div>
              ) : previewFile.name.endsWith('.pdf') ? (
                <div className="space-y-3 text-left w-full p-4 rounded-2xl border border-[#E5E5E7] bg-white">
                  <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-2 text-[#6E6E73] text-xs">
                    <span className="font-semibold text-black">DOCUMENT ENCLAVE: ENCRYPTED PDF</span>
                    <span>PAGE 1 OF 18</span>
                  </div>
                  <p className="text-sm font-semibold text-black">CONFIDENTIAL VENTURE BRIEFING • UNFOUNDED VENTURE LAB</p>
                  <p className="text-xs text-[#6E6E73] leading-relaxed">
                    "The autonomous agent cluster has completed formal verification. Tamper sensor response is sub-12ns..."
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileCode size={36} className="mx-auto text-black" />
                  <p className="text-sm font-semibold text-black">Raw Telemetry Dataset (Clean Ingested)</p>
                  <p className="text-xs text-[#6E6E73]">Format: {previewFile.type}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between text-xs flex-wrap gap-2">
              <button
                onClick={() => {
                  setVersionHistoryFile(previewFile);
                  setPreviewFile(null);
                }}
                className="text-[#6E6E73] hover:text-black flex items-center gap-1.5 font-medium transition-colors"
              >
                <History size={14} /> <span>View Revision History</span>
              </button>

              <div className="flex items-center gap-2">
                {previewFile.downloadUrl && (
                  <a
                    href={previewFile.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={previewFile.name}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-medium rounded-full flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download File</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-5 py-2 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black rounded-full font-medium transition-all"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {versionHistoryFile && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="text-lg font-serif font-medium text-black">
                  Version Audit: {versionHistoryFile.name}
                </h3>
                <span className="text-xs text-[#6E6E73]">
                  Current active: v{versionHistoryFile.version}.0
                </span>
              </div>
              <button
                onClick={() => setVersionHistoryFile(null)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Version List */}
            <div className="space-y-3">
              {versionHistoryFile.versions.map((ver, idx) => (
                <div
                  key={ver.version}
                  className={`p-4 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'border-black bg-white shadow-xs'
                      : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-black">
                        v{ver.version}.0
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black text-white font-medium">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#6E6E73]">{ver.uploadedAt} • {ver.size}</span>
                  </div>
                  <p className="text-xs text-black mt-1">
                    {ver.notes}
                  </p>
                </div>
              ))}
            </div>

            {/* Add New Version Form */}
            <form onSubmit={handleAddVersionSubmit} className="pt-4 border-t border-[#E5E5E7] space-y-3">
              <span className="block uppercase text-[11px] text-[#6E6E73] font-semibold tracking-wider">Commit New Revision</span>
              <input
                type="text"
                required
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder="Revision changelog notes..."
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
              />
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={newVersionSize}
                  onChange={(e) => setNewVersionSize(e.target.value)}
                  placeholder="e.g. 1.8 MB"
                  className="w-36 bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-medium rounded-full transition-all shadow-xs"
                >
                  Commit Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleManualUploadSubmit}
            className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="text-xl font-serif font-medium text-black">
                  Upload Document.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Ingest files into the secure team vault.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Attachment / Picker */}
              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Select File (Image / Document / Audio) *</label>
                <input
                  ref={vaultFileInputRef}
                  type="file"
                  onChange={handleVaultFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <button
                  type="button"
                  onClick={() => vaultFileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#E5E5E7] hover:border-black rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 bg-[#F5F5F7] hover:bg-white transition-all"
                >
                  <UploadCloud size={24} className="text-[#6E6E73]" />
                  {vaultSelectedFile ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 justify-center text-black font-semibold text-sm">
                        <CheckCircle2 size={16} className="text-black" />
                        <span>{vaultSelectedFile.name}</span>
                      </div>
                      <p className="text-xs text-[#6E6E73]">{uploadSize} • {uploadType}</p>
                      <span className="text-xs text-black underline font-medium">Click to choose another file</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-black font-semibold text-sm">Click to browse device storage</p>
                      <p className="text-xs text-[#6E6E73] mt-1">PDF, DOC, PNG, JPG, WEBM, ZIP, Audio, etc. (Uploaded to Supabase)</p>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">File Name *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Venture-Whitepaper-v2.pdf"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Folder</label>
                  <input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    placeholder="Specs"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Size Estimate</label>
                  <input
                    type="text"
                    value={uploadSize}
                    onChange={(e) => setUploadSize(e.target.value)}
                    placeholder="2.4 MB"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Project Scope</label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setVaultSelectedFile(null);
                  setIsUploadOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploadingVault}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full font-medium transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingVault ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <span>Confirm Upload</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VOICE MEMO RECORDING MODAL */}
      {isVoiceMemoOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="text-xl font-serif font-medium text-black">
                  Enclave Voice Memo.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Record high-fidelity voice notes directly to vault.</p>
              </div>
              <button
                onClick={cancelVaultRecording}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Memo Title / Description</label>
                <input
                  type="text"
                  value={vaultMemoTitle}
                  onChange={(e) => setVaultMemoTitle(e.target.value)}
                  placeholder="e.g. Incident Review - Alpha Phase"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              {/* Recording Status Display */}
              <div className="p-6 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col items-center justify-center text-center space-y-4">
                {isVaultRecording ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                          <Mic size={18} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-red-600 font-semibold tracking-wider text-sm flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        <span>RECORDING [ {Math.floor(vaultRecordSeconds / 60)}:{vaultRecordSeconds % 60 < 10 ? '0' : ''}{vaultRecordSeconds % 60} ]</span>
                      </div>
                      <p className="text-xs text-[#6E6E73]">Capturing lossless microphone stream...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full border border-[#E5E5E7] flex items-center justify-center bg-white shadow-2xs">
                      <Mic size={24} className="text-black" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-black font-semibold">Microphone Ready</p>
                      <p className="text-xs text-[#6E6E73]">Voice memos will be saved to Supabase Storage and logged in Vault.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={cancelVaultRecording}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {!isVaultRecording ? (
                  <button
                    type="button"
                    onClick={startVaultRecording}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-full font-medium transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Mic size={14} />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSavingVoiceMemo}
                    onClick={stopAndSaveVaultRecording}
                    className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-full font-medium transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingVoiceMemo ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving to Vault...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Stop & Save to Vault</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
