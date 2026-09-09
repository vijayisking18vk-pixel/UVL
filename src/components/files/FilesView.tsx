import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { FileItem } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  FolderArchive,
  UploadCloud,
  File,
  FileCode,
  FileImage,
  Folder,
  History,
  Eye,
  Download,
  Trash2,
  X,
  Plus,
  ArrowUpRight
} from 'lucide-react';

export const FilesView: React.FC = () => {
  const {
    files,
    uploadFile,
    addFileVersion,
    deleteFile,
    projects,
    users,
    currentUser
  } = useWorkspace();

  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [versionHistoryFile, setVersionHistoryFile] = useState<FileItem | null>(null);

  // New Version Form
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [newVersionSize, setNewVersionSize] = useState('1.5 MB');

  // Manual Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadSize, setUploadSize] = useState('2.4 MB');
  const [uploadType, setUploadType] = useState('application/pdf');
  const [uploadFolder, setUploadFolder] = useState('Specs');
  const [uploadProjectId, setUploadProjectId] = useState(projects[0]?.id || '');

  const folders = Array.from(new Set(files.map(f => f.folder)));

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const sizeKb = (droppedFile.size / 1024).toFixed(1);
      const sizeMb = (droppedFile.size / (1024 * 1024)).toFixed(2);
      const sizeStr = droppedFile.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

      uploadFile({
        name: droppedFile.name,
        size: sizeStr,
        type: droppedFile.type || 'application/octet-stream',
        projectId: selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || 'p-1',
        folder: selectedFolder !== 'all' ? selectedFolder : 'Ingested',
        notes: 'Drag-and-drop uploaded asset'
      });
    }
  };

  const handleManualUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    uploadFile({
      name: uploadName.trim(),
      size: uploadSize,
      type: uploadType,
      projectId: uploadProjectId,
      folder: uploadFolder,
      notes: 'Initial upload via Command Center'
    });

    setUploadName('');
    setIsUploadOpen(false);
  };

  const handleAddVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionHistoryFile || !newVersionNotes.trim()) return;

    addFileVersion(versionHistoryFile.id, {
      size: newVersionSize,
      notes: newVersionNotes.trim()
    });

    setNewVersionNotes('');
    // refresh current version file
    const updated = files.find(f => f.id === versionHistoryFile.id);
    if (updated) setVersionHistoryFile(updated);
  };

  const getFileIcon = (fileName: string, type: string) => {
    if (fileName.endsWith('.svg') || fileName.endsWith('.png') || fileName.endsWith('.jpg')) {
      return <FileImage size={18} className="text-[#4EC5D4]" />;
    }
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.csv') || fileName.endsWith('.json')) {
      return <FileCode size={18} className="text-[#E5B869]" />;
    }
    return <File size={18} className="text-[#9D7BFF]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#E5B869]">
              <FolderArchive size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Central Tactical File Vault
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Project repositories, drag-and-drop uploads, version histories & live asset previews.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
            >
              <UploadCloud size={14} strokeWidth={3} />
              Upload Document
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-3 border-t border-[#242930] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#9E9A8E]">Folders:</span>
            <button
              onClick={() => setSelectedFolder('all')}
              className={`px-2.5 py-1 border patch-chamfer-sm transition-colors ${
                selectedFolder === 'all'
                  ? 'bg-[#E5B869] text-[#0B0C0E] font-bold border-[#E5B869]'
                  : 'bg-[#16191E] border-[#292F3B] text-[#EDE8DB]'
              }`}
            >
              All Folders
            </button>
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`px-2.5 py-1 border patch-chamfer-sm transition-colors ${
                  selectedFolder === f
                    ? 'bg-[#E5B869] text-[#0B0C0E] font-bold border-[#E5B869]'
                    : 'bg-[#16191E] border-[#292F3B] text-[#EDE8DB]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#9E9A8E]">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs px-2 py-1 patch-chamfer-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DRAG AND DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-6 border-2 border-dashed patch-chamfer-md text-center transition-all ${
          isDragging
            ? 'bg-[#E5B869]/10 border-[#E5B869] scale-[1.01]'
            : 'bg-[#14171B]/60 border-[#2B313D] hover:border-[#E5B869]/50'
        }`}
      >
        <UploadCloud size={32} className={`mx-auto mb-2 ${isDragging ? 'text-[#E5B869] animate-bounce' : 'text-[#9E9A8E]'}`} />
        <h3 className="font-patch text-lg uppercase tracking-wider text-[#EDE8DB]">
          Drag & Drop Confidential Files Directly Here
        </h3>
        <p className="font-mono text-xs text-[#9E9A8E] mt-1">
          Instant client-side checksum generation and local vault sync.
        </p>
      </div>

      {/* FILE REPOSITORY LIST */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#242930] text-[10px] font-mono text-[#9E9A8E] uppercase">
          <span>Repository Assets ({filteredFiles.length})</span>
          <span>Version Protocol V1.0</span>
        </div>

        <div className="space-y-2">
          {filteredFiles.map(file => {
            const project = projects.find(p => p.id === file.projectId);
            const uploader = users.find(u => u.id === file.uploadedBy);

            return (
              <div
                key={file.id}
                className="p-3 bg-[#181B20] border border-[#252B35] hover:border-[#E5B869]/60 patch-chamfer-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[#0C0E11] border border-[#262C36] patch-chamfer-sm mt-0.5">
                    {getFileIcon(file.name, file.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-[#EDE8DB] hover:text-[#E5B869] transition-colors cursor-pointer" onClick={() => setPreviewFile(file)}>
                        {file.name}
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.2 bg-[#E5B869]/20 border border-[#E5B869]/40 text-[#E5B869] font-bold">
                        v{file.version}.0
                      </span>
                      {project && (
                        <span className="text-[9px] px-1.5 py-0.2 border" style={{ borderColor: `${project.color}50`, color: project.color }}>
                          {project.code}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[10px] text-[#9E9A8E] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Folder size={11} /> {file.folder}
                      </span>
                      <span>• {file.size}</span>
                      <span>• {file.uploadedAt}</span>
                      {uploader && (
                        <span>• By {uploader.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#EDE8DB] patch-chamfer-sm flex items-center gap-1 text-[11px]"
                    title="Preview File"
                  >
                    <Eye size={13} /> Preview
                  </button>

                  <button
                    onClick={() => setVersionHistoryFile(file)}
                    className="p-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#E5B869] patch-chamfer-sm flex items-center gap-1 text-[11px]"
                    title="Version History & Add Revision"
                  >
                    <History size={13} /> History ({file.versions.length})
                  </button>

                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-1.5 bg-[#1F242C] hover:bg-[#2A1E1E] border border-[#323945] hover:border-[#E05A47] text-[#E05A47] patch-chamfer-sm"
                    title="Delete File"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171B] border-2 border-[#323A48] max-w-2xl w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0C0E11] border border-[#2C333F]">
                  {getFileIcon(previewFile.name, previewFile.type)}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-[#EDE8DB]">
                    {previewFile.name}
                  </h3>
                  <span className="font-mono text-[10px] text-[#9E9A8E]">
                    Version {previewFile.version}.0 • {previewFile.size} • {previewFile.folder}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated Live Asset Viewer */}
            <div className="p-4 bg-[#0C0E11] border border-[#252B35] patch-chamfer-sm min-h-[260px] flex flex-col justify-center items-center text-center font-mono">
              {previewFile.name.endsWith('.svg') || previewFile.name.includes('Patch') ? (
                <div className="space-y-3">
                  <div className="w-64 h-24 mx-auto patch-pill bg-[#0C0E10] border-2 border-dashed border-[#EDE8DB]/60 flex items-center justify-center shadow-lg p-2">
                    <div className="flex flex-col items-center">
                      <span className="font-patch text-2xl font-bold uppercase tracking-[0.2em] text-[#EDE8DB]">
                        unfounded
                      </span>
                      <span className="font-patch text-lg font-medium uppercase tracking-[0.25em] text-[#D8D2C2]">
                        venture lab
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9E9A8E]">
                    [Rendered SVG Vector Mesh: 45-degree chamfered morale patch]
                  </p>
                </div>
              ) : previewFile.name.endsWith('.pdf') ? (
                <div className="space-y-2 text-left w-full p-3 bg-[#111418] border border-[#222730]">
                  <div className="flex items-center justify-between border-b border-[#242930] pb-1.5 text-[#E5B869] text-xs">
                    <span>DOCUMENT ENCLAVE: ENCRYPTED PDF</span>
                    <span>PAGE 1 OF 18</span>
                  </div>
                  <p className="text-xs text-[#EDE8DB]">CONFIDENTIAL VENTURE BRIEFING // UNFOUNDED VENTURE LAB</p>
                  <p className="text-[11px] text-[#9E9A8E]">
                    "The autonomous agent cluster has completed formal verification. Tamper sensor response is sub-12ns..."
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileCode size={36} className="mx-auto text-[#4EC5D4]" />
                  <p className="text-xs text-[#EDE8DB]">Raw Telemetry Dataset (Clean Ingested)</p>
                  <p className="text-[10px] text-[#9E9A8E]">Format: {previewFile.type}</p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-between">
              <button
                onClick={() => {
                  setVersionHistoryFile(previewFile);
                  setPreviewFile(null);
                }}
                className="font-mono text-xs text-[#E5B869] hover:underline flex items-center gap-1"
              >
                <History size={13} /> View Revision History
              </button>
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-[#252B34] hover:bg-[#323945] text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY DRAWER / MODAL */}
      {versionHistoryFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171B] border-2 border-[#323A48] max-w-xl w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <div>
                <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                  Version Audit: {versionHistoryFile.name}
                </h3>
                <span className="font-mono text-[10px] text-[#9E9A8E]">
                  Current active version: v{versionHistoryFile.version}.0
                </span>
              </div>
              <button
                onClick={() => setVersionHistoryFile(null)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Version List */}
            <div className="space-y-2 mb-4 font-mono text-xs">
              {versionHistoryFile.versions.map((ver, idx) => (
                <div
                  key={ver.version}
                  className={`p-3 border patch-chamfer-sm ${
                    idx === 0
                      ? 'bg-[#182129] border-[#4EC5D4] text-[#EDE8DB]'
                      : 'bg-[#0C0E11] border-[#222730] text-[#9E9A8E]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#E5B869]">v{ver.version}.0</span>
                      {idx === 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#4EC5D4]/20 text-[#4EC5D4] border border-[#4EC5D4]/40">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]">{ver.uploadedAt} • {ver.size}</span>
                  </div>
                  <p className="text-[11px] text-[#D8D2C2] mt-0.5">
                    {ver.notes}
                  </p>
                </div>
              ))}
            </div>

            {/* Add New Revision Form */}
            <form onSubmit={handleAddVersionSubmit} className="pt-3 border-t border-[#242930] space-y-2 font-mono text-xs">
              <span className="block uppercase text-[10px] text-[#9E9A8E] font-bold">
                Deploy New Revision (v{versionHistoryFile.version + 1}.0)
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    required
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="Changelog notes for this revision..."
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newVersionSize}
                    onChange={(e) => setNewVersionSize(e.target.value)}
                    placeholder="e.g. 1.6 MB"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
                >
                  Commit New Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleManualUploadSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Ingest Document to Vault
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Document Filename *</label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Blackbox_Enclave_Pinout.pdf"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Folder Category</label>
                  <input
                    type="text"
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    placeholder="e.g. Hardware Specs"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Linked Project</label>
                  <select
                    value={uploadProjectId}
                    onChange={(e) => setUploadProjectId(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Commit to Vault
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
