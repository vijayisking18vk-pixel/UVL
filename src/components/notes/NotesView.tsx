import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Note } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  FileText,
  Plus,
  Pin,
  Tag,
  BookOpen,
  Trash2,
  Edit3,
  Eye,
  Zap,
  Check,
  X,
  Search
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    users,
    projects,
    currentUser,
    setQuickCaptureOpen
  } = useWorkspace();

  const [activeTabType, setActiveTabType] = useState<'team_wiki' | 'personal' | 'quick_capture'>('team_wiki');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Note Form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'personal' | 'team_wiki' | 'quick_capture'>('team_wiki');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newTags, setNewTags] = useState('doctrine, architecture');

  // Filter notes
  const filteredNotes = notes.filter(n => {
    if (activeTabType === 'personal') {
      if (n.type !== 'personal' || n.authorId !== currentUser.id) return false;
    } else if (activeTabType === 'quick_capture') {
      if (n.type !== 'quick_capture') return false;
    } else {
      if (n.type !== 'team_wiki') return false;
    }

    if (projectFilter !== 'all' && n.projectId !== projectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const activeNote = notes.find(n => n.id === selectedNoteId) || filteredNotes[0] || notes[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean);

    const created = addNote({
      title: newTitle,
      content: newContent,
      type: newType,
      authorId: currentUser.id,
      projectId: newProjectId,
      tags,
      pinned: false
    });

    setNewTitle('');
    setNewContent('');
    setIsCreateModalOpen(false);
    setSelectedNoteId(created.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#E5B869]">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Notes, Wiki & Knowledge Vault
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Personal notebooks, shared team intelligence wiki, and quick brain-dumps.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setQuickCaptureOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#323945] text-[#E5B869] font-mono text-xs patch-chamfer-sm"
            >
              <Zap size={14} />
              Quick Capture
            </button>

            <button
              onClick={() => {
                setNewType(activeTabType);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
            >
              <Plus size={14} strokeWidth={3} />
              New Document
            </button>
          </div>
        </div>

        {/* Tab switcher: Team Wiki vs Personal Notebook vs Brain Dumps */}
        <div className="mt-4 pt-3 border-t border-[#242930] flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-[#0C0E11] border border-[#2D333F] p-0.5 patch-chamfer-sm">
            <button
              onClick={() => setActiveTabType('team_wiki')}
              className={`px-3 py-1 font-mono text-xs transition-colors flex items-center gap-1.5 ${
                activeTabType === 'team_wiki'
                  ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                  : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
              }`}
            >
              <BookOpen size={12} /> Team Wiki ({notes.filter(n => n.type === 'team_wiki').length})
            </button>
            <button
              onClick={() => setActiveTabType('personal')}
              className={`px-3 py-1 font-mono text-xs transition-colors flex items-center gap-1.5 ${
                activeTabType === 'personal'
                  ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                  : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
              }`}
            >
              <FileText size={12} /> My Personal Notebook ({notes.filter(n => n.type === 'personal' && n.authorId === currentUser.id).length})
            </button>
            <button
              onClick={() => setActiveTabType('quick_capture')}
              className={`px-3 py-1 font-mono text-xs transition-colors flex items-center gap-1.5 ${
                activeTabType === 'quick_capture'
                  ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                  : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
              }`}
            >
              <Zap size={12} /> Brain-Dumps ({notes.filter(n => n.type === 'quick_capture').length})
            </button>
          </div>

          {/* Search & Project Filter */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs or tags..."
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-3 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869] w-48"
            />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-2 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Note Index */}
        <div className="lg:col-span-4 bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#242930] text-[10px] font-mono text-[#9E9A8E] uppercase">
            <span>Indexed Documents ({filteredNotes.length})</span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#262C36] bg-[#0C0E11] font-mono text-xs text-[#9E9A8E]">
              No documents in this space. Click "New Document" to create one.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredNotes.map(n => {
                const isSelected = n.id === activeNote?.id;
                const author = users.find(u => u.id === n.authorId);
                const project = projects.find(p => p.id === n.projectId);

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNoteId(n.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 border patch-chamfer-sm cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1C2027] border-[#E5B869] shadow-md'
                        : 'bg-[#181B20] border-[#252B35] hover:border-[#E5B869]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin size={11} className="text-[#E5B869] fill-[#E5B869]" />}
                        {project && (
                          <span className="font-mono text-[9px] px-1 py-0.2 border" style={{ borderColor: `${project.color}50`, color: project.color }}>
                            {project.code}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#9E9A8E]">
                        {n.updatedAt}
                      </span>
                    </div>

                    <h4 className="font-mono text-xs font-semibold text-[#EDE8DB] leading-snug line-clamp-1">
                      {n.title}
                    </h4>

                    <p className="font-mono text-[10px] text-[#9E9A8E] line-clamp-2 mt-1">
                      {n.content.replace(/#+/g, '').slice(0, 100)}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#222730]">
                      <div className="flex items-center gap-1">
                        {author && <PatchAvatar user={author} size="sm" />}
                        <span className="font-mono text-[10px] text-[#D8D2C2]">{author?.name}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {n.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="font-mono text-[9px] text-[#7E8492]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Note Reader & Live Editor */}
        {activeNote ? (
          <div className="lg:col-span-8 bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-4">
            {/* Note Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#242930]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1F242C] border border-[#3A4250] text-[#E5B869] uppercase font-semibold">
                    {activeNote.type.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs text-[#9E9A8E]">
                    Last modified {activeNote.updatedAt}
                  </span>
                </div>
                <h3 className="font-patch text-2xl font-bold uppercase text-[#EDE8DB]">
                  {activeNote.title}
                </h3>
              </div>

              {/* Edit / Pin / Delete Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinNote(activeNote.id)}
                  className={`p-1.5 border font-mono text-xs patch-chamfer-sm transition-colors ${
                    activeNote.pinned
                      ? 'bg-[#E5B869]/20 border-[#E5B869] text-[#E5B869]'
                      : 'bg-[#1A1D23] border-[#2A303A] text-[#9E9A8E] hover:text-[#EDE8DB]'
                  }`}
                  title={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
                >
                  <Pin size={14} className={activeNote.pinned ? 'fill-[#E5B869]' : ''} />
                </button>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 border font-mono text-xs patch-chamfer-sm flex items-center gap-1.5 transition-colors ${
                    isEditing
                      ? 'bg-[#5EBA7D]/20 border-[#5EBA7D] text-[#5EBA7D]'
                      : 'bg-[#1A1D23] border-[#2A303A] text-[#EDE8DB] hover:border-[#E5B869]'
                  }`}
                >
                  {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                  <span>{isEditing ? 'Preview Mode' : 'Edit Mode'}</span>
                </button>

                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-1.5 bg-[#1A1D23] hover:bg-[#2A1D1D] border border-[#2A303A] hover:border-[#E05A47] text-[#E05A47] patch-chamfer-sm"
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Tags & Metadata */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-[#9E9A8E] flex items-center gap-1">
                <Tag size={12} className="text-[#E5B869]" /> Tags:
              </span>
              {activeNote.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-[#0C0E11] border border-[#292F3B] text-[#D8D2C2]">
                  #{t}
                </span>
              ))}
            </div>

            {/* Note Content Area */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  rows={16}
                  value={activeNote.content}
                  onChange={(e) => updateNote({ ...activeNote, content: e.target.value })}
                  className="w-full bg-[#0C0E11] border border-[#2C333F] p-4 font-mono text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-y leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 bg-[#5EBA7D] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
                  >
                    Save & View Preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#0C0E11] border border-[#252B36] patch-chamfer-sm min-h-[300px]">
                <div className="font-mono text-xs text-[#EDE8DB] leading-relaxed whitespace-pre-wrap">
                  {activeNote.content}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center border border-dashed border-[#2A303A] bg-[#14171B] font-mono text-xs text-[#9E9A8E]">
            Select a document to read or edit.
          </div>
        )}
      </div>

      {/* CREATE NOTE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-xl w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Create Knowledge Vault Document
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine Specs"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Type / Space</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  >
                    <option value="team_wiki">Shared Team Wiki</option>
                    <option value="personal">My Personal Notebook</option>
                    <option value="quick_capture">Quick Brain Dump</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Project Scope</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. architecture, specs, crypto"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                />
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Markdown Content</label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Heading&#10;&#10;Write markdown documentation here..."
                  className="w-full bg-[#0C0E11] border border-[#2D3440] p-3 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Save Document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
