import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
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
    <div className="space-y-12 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>archive</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">knowledge vault</span>
              <span>/</span>
              <span>documentation</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Intel vault & wiki.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Personal field notes, shared team intelligence wiki, and rapid stream captures.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setQuickCaptureOpen(true)}
              className="px-4 py-2.5 border border-white/20 hover:border-white text-white font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <Zap size={14} className="text-[#A1A1AA]" />
              <span>Quick capture</span>
            </button>

            <button
              onClick={() => {
                setNewType(activeTabType);
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium text-xs tracking-wide transition-all uppercase flex items-center gap-2"
            >
              <Plus size={14} />
              <span>New document</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Team Wiki vs Personal Notebook vs Brain Dumps */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex border border-white/20">
            <button
              onClick={() => setActiveTabType('team_wiki')}
              className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2 ${
                activeTabType === 'team_wiki'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BookOpen size={12} />
              <span>Team wiki ({notes.filter(n => n.type === 'team_wiki').length})</span>
            </button>
            <button
              onClick={() => setActiveTabType('personal')}
              className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2 border-l border-white/20 ${
                activeTabType === 'personal'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText size={12} />
              <span>Personal ({notes.filter(n => n.type === 'personal' && n.authorId === currentUser.id).length})</span>
            </button>
            <button
              onClick={() => setActiveTabType('quick_capture')}
              className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors flex items-center gap-2 border-l border-white/20 ${
                activeTabType === 'quick_capture'
                  ? 'bg-white text-black font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Zap size={12} />
              <span>Captures ({notes.filter(n => n.type === 'quick_capture').length})</span>
            </button>
          </div>

          {/* Search & Project Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search index or tags..."
                className="bg-black border border-white/20 text-white text-xs font-mono px-3 py-2 w-56 placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-black border border-white/20 text-white text-xs font-mono px-3 py-2 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Note Index */}
        <div className="lg:col-span-4 border border-white/20 bg-black p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/20 text-xs font-mono text-white/50 uppercase tracking-wider">
            <span>Documents ({filteredNotes.length})</span>
            <span className="text-[#A1A1AA]">Indexed</span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/20 bg-black font-mono text-xs text-white/40">
              No documents in this view. Click "New document" to author one.
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
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
                    className={`p-4 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#A1A1AA] bg-white text-black'
                        : 'border-white/20 bg-black text-white hover:border-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin size={11} className={isSelected ? 'text-[#A1A1AA] fill-[#A1A1AA]' : 'text-[#A1A1AA] fill-[#A1A1AA]'} />}
                        {project && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 border ${
                            isSelected ? 'border-black/30 text-black' : 'border-white/20 text-white/60'
                          }`}>
                            {project.code}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                        {n.updatedAt}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold tracking-tight line-clamp-1 mb-1 ${isSelected ? 'text-black' : 'text-white'}`}>
                      {n.title}
                    </h4>

                    <p className={`text-xs line-clamp-2 ${isSelected ? 'text-black/70' : 'text-white/50'}`}>
                      {n.content.replace(/#+/g, '').slice(0, 90)}
                    </p>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-current/10">
                      <div className="flex items-center gap-1.5">
                        {author && <PatchAvatar user={author} size="sm" />}
                        <span className={`text-[11px] font-mono ${isSelected ? 'text-black/70' : 'text-white/60'}`}>
                          {author?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {n.tags.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-[10px] font-mono ${isSelected ? 'text-black/50' : 'text-white/40'}`}>
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
          <div className="lg:col-span-8 border border-white/20 bg-black p-6 space-y-6">
            {/* Note Top Bar */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-white/20">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#A1A1AA] text-white uppercase font-bold tracking-wider">
                    {activeNote.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-white/50">
                    Last modified {activeNote.updatedAt}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {activeNote.title}
                </h2>
              </div>

              {/* Edit / Pin / Delete Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinNote(activeNote.id)}
                  className={`p-2 border text-xs font-mono transition-colors ${
                    activeNote.pinned
                      ? 'border-[#A1A1AA] bg-white text-black'
                      : 'border-white/20 text-white/60 hover:text-white hover:border-white'
                  }`}
                  title={activeNote.pinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin size={14} className={activeNote.pinned ? 'fill-[#A1A1AA] text-[#A1A1AA]' : ''} />
                </button>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3.5 py-2 border text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors ${
                    isEditing
                      ? 'bg-[#A1A1AA] border-[#A1A1AA] text-white'
                      : 'border-white/20 text-white hover:border-white'
                  }`}
                >
                  {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                  <span>{isEditing ? 'Preview' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-2 border border-white/20 hover:border-red-500 text-white/50 hover:text-red-500 transition-colors"
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Tags & Metadata */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-white/40 flex items-center gap-1.5 uppercase">
                <Tag size={12} className="text-[#A1A1AA]" /> Tags:
              </span>
              {activeNote.tags.map(t => (
                <span key={t} className="px-2.5 py-0.5 border border-white/20 text-white/80">
                  #{t}
                </span>
              ))}
            </div>

            {/* Note Content Area */}
            {isEditing ? (
              <div className="space-y-4">
                <textarea
                  rows={16}
                  value={activeNote.content}
                  onChange={(e) => updateNote({ ...activeNote, content: e.target.value })}
                  className="w-full bg-black border border-white/20 p-5 font-mono text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-y leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 bg-white text-black hover:bg-[#A1A1AA] hover:text-black text-xs font-bold font-mono uppercase tracking-wider transition-colors"
                  >
                    Save & view preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-white/20 bg-black min-h-[320px]">
                <div className="font-mono text-xs text-white/90 leading-relaxed whitespace-pre-wrap">
                  {activeNote.content}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-16 text-center border border-dashed border-white/20 bg-black font-mono space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">No document selected</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Select an indexed entry or click "New document" to draft a spec or operational note.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NOTE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-black border border-white/40 max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#A1A1AA]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                  Create vault document
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Document title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine Specs"
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Type / Space</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    <option value="team_wiki">Shared team wiki</option>
                    <option value="personal">Personal notebook</option>
                    <option value="quick_capture">Quick capture dump</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Project scope</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    <option value="">General / Lab-wide</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. architecture, specs, crypto"
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Markdown content</label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Heading&#10;&#10;Write markdown documentation here..."
                  className="w-full bg-black border border-white/20 p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors"
              >
                Save document
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
