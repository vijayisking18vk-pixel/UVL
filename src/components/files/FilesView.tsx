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
    <div className="space-y-12 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>archive</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">file repository</span>
              <span>/</span>
              <span>assets & telemetry</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Document enclave & vault.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Project repositories, drag-and-drop vault sync, immutable version audits, and asset previews.
            </p>
          </div>

          <div className="self-start md:self-auto flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                sound.click();
                setIsVoiceMemoOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#A1A1AA] hover:border-white text-white font-semibold text-xs tracking-wide transition-all uppercase"
            >
              <Mic size={14} className="text-[#A1A1AA]" />
              <span>Record voice memo</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium text-xs tracking-wide transition-all uppercase"
            >
              <UploadCloud size={14} />
              <span>Upload document</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/50 uppercase text-[10px]">Folder:</span>
            <div className="flex border border-white/20">
              <button
                onClick={() => setSelectedFolder('all')}
                className={`px-3 py-1.5 uppercase transition-colors ${
                  selectedFolder === 'all'
                    ? 'bg-white text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
              {folders.map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`px-3 py-1.5 uppercase transition-colors border-l border-white/20 ${
                    selectedFolder === f
                      ? 'bg-white text-black font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/50 uppercase text-[10px]">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-black border border-white/20 text-white text-xs px-3 py-1.5 focus:outline-none focus:border-[#A1A1AA]"
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
        className={`p-10 border transition-all text-center ${
          isDragging
            ? 'border-[#A1A1AA] bg-white text-black'
            : 'border-dashed border-white/30 bg-black text-white hover:border-white'
        }`}
      >
        {isUploadingVault ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-[#A1A1AA]" />
            <h3 className="text-base font-bold text-white uppercase">
              Uploading to Supabase Storage...
            </h3>
            <p className="text-xs text-white/50">
              Writing binary object to Supabase bucket and indexing database metadata.
            </p>
          </div>
        ) : (
          <>
            <UploadCloud size={32} className={`mx-auto mb-3 ${isDragging ? 'text-black' : 'text-[#A1A1AA]'}`} />
            <h3 className={`text-base font-bold tracking-tight uppercase ${isDragging ? 'text-black' : 'text-white'}`}>
              Drag and drop files directly here to ingest into Vault
            </h3>
            <p className={`text-xs font-mono mt-1 ${isDragging ? 'text-black/60' : 'text-white/50'}`}>
              Direct Supabase cloud storage sync with permanent URL preservation.
            </p>
          </>
        )}
      </div>

      {/* FILE REPOSITORY LIST */}
      <div className="border border-white/20 bg-black p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/20 text-xs font-mono text-white/50 uppercase tracking-wider">
          <span>Repository assets ({filteredFiles.length})</span>
          <span className="text-[#A1A1AA]">Live Supabase Storage</span>
        </div>

        <div className="space-y-3">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-white/20 bg-black font-mono">
              <FolderArchive size={32} className="mx-auto text-white/30 mb-2" />
              <p className="text-xs text-white font-semibold">Vault is empty</p>
              <p className="text-[11px] text-white/40 mt-1">No documents stored in this space. Drag and drop, upload documents, or record audio memos above.</p>
            </div>
          ) : (
            filteredFiles.map(file => {
              const project = projects.find(p => p.id === file.projectId);
              const uploader = users.find(u => u.id === file.uploadedBy);

              return (
                <div
                  key={file.id}
                  className="p-4 border border-white/20 bg-black hover:border-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 border border-white/20 bg-black mt-0.5">
                      {getFileIcon(file.name, file.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className="font-bold text-white hover:text-[#A1A1AA] transition-colors cursor-pointer text-sm"
                          onClick={() => setPreviewFile(file)}
                        >
                          {file.name}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 border border-[#A1A1AA] text-[#A1A1AA] font-bold">
                          v{file.version}.0
                        </span>
                        {project && (
                          <span className="text-[10px] px-2 py-0.5 border border-white/20 text-white/70">
                            {project.code}
                          </span>
                        )}
                        {file.downloadUrl && (
                          <span className="text-[9px] px-1.5 py-0.2 border border-emerald-500/40 text-emerald-400 uppercase font-bold">
                            Live Storage
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/50 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Folder size={11} /> {file.folder}
                        </span>
                        <span>/</span>
                        <span>{file.size}</span>
                        <span>/</span>
                        <span>{file.uploadedAt}</span>
                        {uploader && (
                          <>
                            <span>/</span>
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
                        className="px-3 py-1.5 border border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white flex items-center gap-1 text-[11px] uppercase tracking-wider transition-colors"
                        title="Download file from live Supabase storage"
                      >
                        <Download size={12} /> Live File
                      </a>
                    )}

                    <button
                      onClick={() => setPreviewFile(file)}
                      className="px-3 py-1.5 border border-white/20 hover:border-white text-white flex items-center gap-1 text-[11px] uppercase tracking-wider transition-colors"
                      title="Preview File"
                    >
                      <Eye size={12} /> Preview
                    </button>

                    <button
                      onClick={() => setVersionHistoryFile(file)}
                      className="px-3 py-1.5 border border-[#A1A1AA]/40 text-[#A1A1AA] hover:border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black flex items-center gap-1 text-[11px] uppercase tracking-wider transition-all"
                      title="Version History & Add Revision"
                    >
                      <History size={12} /> History ({file.versions.length})
                    </button>

                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-1.5 border border-white/20 hover:border-red-500 text-white/40 hover:text-red-500 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 size={13} />
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
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 border border-white/20">
                  {getFileIcon(previewFile.name)}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white">
                    {previewFile.name}
                  </h3>
                  <span className="font-mono text-[11px] text-white/50">
                    v{previewFile.version}.0 / {previewFile.size} / {previewFile.folder}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Live Asset Viewer */}
            <div className="p-8 border border-white/20 bg-black min-h-[260px] flex flex-col justify-center items-center text-center font-mono">
              {previewFile.type?.startsWith('audio/') || previewFile.name.endsWith('.webm') || previewFile.name.endsWith('.wav') || previewFile.name.endsWith('.mp3') ? (
                <div className="space-y-4 w-full max-w-md p-5 border border-white/20 bg-white/5">
                  <div className="flex items-center justify-between text-[#A1A1AA] text-xs">
                    <span className="flex items-center gap-1.5 font-bold uppercase"><Mic size={14} /> Live Audio Voice Recording</span>
                    <span className="meta-number">{previewFile.size}</span>
                  </div>
                  {previewFile.downloadUrl ? (
                    <audio src={previewFile.downloadUrl} controls className="w-full h-10 brightness-95" />
                  ) : (
                    <p className="text-white/50 text-xs">Processing audio stream...</p>
                  )}
                  <p className="text-[11px] text-white/50">{previewFile.name}</p>
                </div>
              ) : previewFile.downloadUrl && (previewFile.type?.startsWith('image/') || previewFile.name.endsWith('.png') || previewFile.name.endsWith('.jpg') || previewFile.name.endsWith('.svg')) ? (
                <div className="space-y-3">
                  <img src={previewFile.downloadUrl} alt={previewFile.name} className="max-h-72 max-w-full object-contain border border-white/20" />
                  <p className="text-[11px] text-white/50">Stored in Supabase bucket / {previewFile.size}</p>
                </div>
              ) : previewFile.name.endsWith('.svg') || previewFile.name.includes('Patch') ? (
                <div className="space-y-4">
                  <div className="w-64 h-24 mx-auto bg-black border-2 border-dashed border-white flex items-center justify-center p-2">
                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold uppercase tracking-[0.25em] text-white font-brand-logo">
                        unfounded
                      </span>
                      <span className="text-base uppercase tracking-[0.3em] text-white/80 font-brand-logo">
                        venture lab
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">
                    [Rendered SVG Vector Mesh: Monochromatic Morale Badge]
                  </p>
                </div>
              ) : previewFile.name.endsWith('.pdf') ? (
                <div className="space-y-3 text-left w-full p-4 border border-white/20 bg-black">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2 text-[#A1A1AA] text-xs">
                    <span>DOCUMENT ENCLAVE: ENCRYPTED PDF</span>
                    <span>PAGE 1 OF 18</span>
                  </div>
                  <p className="text-sm font-bold text-white">CONFIDENTIAL VENTURE BRIEFING // UNFOUNDED VENTURE LAB</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    "The autonomous agent cluster has completed formal verification. Tamper sensor response is sub-12ns..."
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileCode size={36} className="mx-auto text-[#A1A1AA]" />
                  <p className="text-sm font-bold text-white">Raw Telemetry Dataset (Clean Ingested)</p>
                  <p className="text-xs text-white/50">Format: {previewFile.type}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between font-mono text-xs flex-wrap gap-2">
              <button
                onClick={() => {
                  setVersionHistoryFile(previewFile);
                  setPreviewFile(null);
                }}
                className="text-[#A1A1AA] hover:underline flex items-center gap-1.5 uppercase"
              >
                <History size={13} /> View revision history
              </button>

              <div className="flex items-center gap-2">
                {previewFile.downloadUrl && (
                  <a
                    href={previewFile.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={previewFile.name}
                    className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold flex items-center gap-1.5 uppercase tracking-wider transition-colors"
                  >
                    <Download size={13} />
                    <span>Download File</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-5 py-2 border border-white/20 hover:border-white text-white uppercase tracking-wider transition-colors"
                >
                  Close preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {versionHistoryFile && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Version audit: {versionHistoryFile.name}
                </h3>
                <span className="text-[11px] text-white/50">
                  Current active: v{versionHistoryFile.version}.0
                </span>
              </div>
              <button
                onClick={() => setVersionHistoryFile(null)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Version List */}
            <div className="space-y-3">
              {versionHistoryFile.versions.map((ver, idx) => (
                <div
                  key={ver.version}
                  className={`p-3.5 border ${
                    idx === 0
                      ? 'border-[#A1A1AA] bg-white text-black'
                      : 'border-white/20 bg-black text-white/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${idx === 0 ? 'text-[#A1A1AA]' : 'text-white'}`}>
                        v{ver.version}.0
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#A1A1AA] text-white font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-60">{ver.uploadedAt} / {ver.size}</span>
                  </div>
                  <p className="text-xs opacity-90 mt-1">
                    {ver.notes}
                  </p>
                </div>
              ))}
            </div>

            {/* Add New Version Form */}
            <form onSubmit={handleAddVersionSubmit} className="pt-4 border-t border-white/20 space-y-3">
              <span className="block uppercase text-[10px] text-white/50 font-bold">Commit new revision</span>
              <input
                type="text"
                required
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder="Revision changelog notes..."
                className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
              />
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={newVersionSize}
                  onChange={(e) => setNewVersionSize(e.target.value)}
                  placeholder="e.g. 1.8 MB"
                  className="w-32 bg-black border border-white/20 px-3 py-1.5 text-white focus:outline-none focus:border-[#A1A1AA]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors"
                >
                  Commit revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleManualUploadSubmit}
            className="bg-black border border-white/40 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#A1A1AA]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Upload document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Attachment / Picker */}
              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Select File (Image / Document / Audio) *</label>
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
                  className="w-full border border-dashed border-white/40 hover:border-white p-4 text-center flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors"
                >
                  <UploadCloud size={22} className="text-[#A1A1AA]" />
                  {vaultSelectedFile ? (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 justify-center text-white font-bold">
                        <CheckCircle2 size={14} className="text-[#A1A1AA]" />
                        <span>{vaultSelectedFile.name}</span>
                      </div>
                      <p className="text-[11px] text-white/50">{uploadSize} • {uploadType}</p>
                      <span className="text-[10px] text-[#A1A1AA] underline">Click to choose another file</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium">Click to browse device storage</p>
                      <p className="text-[11px] text-white/50 mt-0.5">PDF, DOC, PNG, JPG, WEBM, ZIP, Audio, etc. (Uploaded to Supabase)</p>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">File name *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Venture-Whitepaper-v2.pdf"
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Folder</label>
                  <input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    placeholder="Specs"
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Size estimate</label>
                  <input
                    type="text"
                    value={uploadSize}
                    onChange={(e) => setUploadSize(e.target.value)}
                    placeholder="2.4 MB"
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Project scope</label>
                <select
                  value={uploadProjectId}
                  onChange={(e) => setUploadProjectId(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setVaultSelectedFile(null);
                  setIsUploadOpen(false);
                }}
                className="px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploadingVault}
                className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingVault ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Uploading to Supabase...</span>
                  </>
                ) : (
                  <span>Confirm upload</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VOICE MEMO RECORDING MODAL */}
      {isVoiceMemoOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-black border border-white/40 max-w-md w-full p-6 space-y-6 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#A1A1AA]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Enclave Voice Memo
                </h3>
              </div>
              <button
                onClick={cancelVaultRecording}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Memo Title / Description</label>
                <input
                  type="text"
                  value={vaultMemoTitle}
                  onChange={(e) => setVaultMemoTitle(e.target.value)}
                  placeholder="e.g. Incident Review - Alpha Phase"
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              {/* Recording Status Display */}
              <div className="p-6 border border-white/20 bg-white/5 flex flex-col items-center justify-center text-center space-y-4">
                {isVaultRecording ? (
                  <>
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                          <Mic size={18} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-red-500 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>RECORDING [ {Math.floor(vaultRecordSeconds / 60)}:{vaultRecordSeconds % 60 < 10 ? '0' : ''}{vaultRecordSeconds % 60} ]</span>
                      </div>
                      <p className="text-[11px] text-white/50">Capturing lossless enclave microphone stream...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center bg-black">
                      <Mic size={24} className="text-[#A1A1AA]" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-bold uppercase">Microphone Ready</p>
                      <p className="text-[11px] text-white/50">Voice memos will be saved to Supabase Storage and logged in Vault.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={cancelVaultRecording}
                className="px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors uppercase"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {!isVaultRecording ? (
                  <button
                    type="button"
                    onClick={startVaultRecording}
                    className="px-5 py-2 bg-white hover:bg-white/90 text-black font-semibold font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Mic size={14} />
                    <span>Start Recording</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSavingVoiceMemo}
                    onClick={stopAndSaveVaultRecording}
                    className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
