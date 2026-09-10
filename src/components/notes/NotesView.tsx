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
    <div className="space-y-10 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium tracking-widest uppercase text-[#6E6E73] mb-3 flex items-center gap-2">
              <span>Archive</span>
              <span>/</span>
              <span className="text-black">Knowledge Vault</span>
              <span>/</span>
              <span>Documentation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-black">
              Intel vault & wiki.
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Personal field notes, shared team intelligence wiki, and rapid stream captures.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setQuickCaptureOpen(true)}
              className="px-4 py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium rounded-full flex items-center gap-2 transition-all"
            >
              <Zap size={14} className="text-[#6E6E73]" />
              <span>Quick Capture</span>
            </button>

            <button
              onClick={() => {
                setNewType(activeTabType);
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-all shadow-xs flex items-center gap-2"
            >
              <Plus size={15} />
              <span>New Document</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Team Wiki vs Personal Notebook vs Brain Dumps */}
        <div className="mt-8 pt-6 border-t border-[#E5E5E7] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full">
            <button
              onClick={() => setActiveTabType('team_wiki')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                activeTabType === 'team_wiki'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <BookOpen size={13} />
              <span>Team Wiki ({notes.filter(n => n.type === 'team_wiki').length})</span>
            </button>
            <button
              onClick={() => setActiveTabType('personal')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                activeTabType === 'personal'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <FileText size={13} />
              <span>Personal ({notes.filter(n => n.type === 'personal' && n.authorId === currentUser.id).length})</span>
            </button>
            <button
              onClick={() => setActiveTabType('quick_capture')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
                activeTabType === 'quick_capture'
                  ? 'bg-white text-black shadow-xs font-semibold'
                  : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Zap size={13} />
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
                className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-4 py-2 w-56 placeholder-[#6E6E73] focus:bg-white focus:outline-none focus:border-black transition-all"
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3.5 py-2 focus:bg-white focus:outline-none focus:border-black transition-all"
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
        <div className="lg:col-span-4 bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
            <span>Documents ({filteredNotes.length})</span>
            <span className="text-black">Indexed</span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-white text-xs text-[#6E6E73]">
              No documents in this view. Click "New Document" to author one.
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
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-black bg-white shadow-sm text-black'
                        : 'border-[#E5E5E7] bg-white text-black hover:border-black/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {n.pinned && <Pin size={11} className={isSelected ? 'text-black fill-black' : 'text-[#6E6E73] fill-[#6E6E73]'} />}
                        {project && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            isSelected ? 'border-black bg-black text-white' : 'border-[#E5E5E7] bg-[#F5F5F7] text-black'
                          }`}>
                            {project.code}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6E6E73]">
                        {n.updatedAt}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold tracking-tight line-clamp-1 mb-1 text-black">
                      {n.title}
                    </h4>

                    <p className="text-xs line-clamp-2 text-[#6E6E73]">
                      {n.content.replace(/#+/g, '').slice(0, 90)}
                    </p>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#E5E5E7]">
                      <div className="flex items-center gap-1.5">
                        {author && <PatchAvatar user={author} size="sm" />}
                        <span className="text-xs text-[#6E6E73]">
                          {author?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {n.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] text-[#6E6E73]">
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
          <div className="lg:col-span-8 bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Note Top Bar */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E5E5E7]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2.5 py-0.5 bg-black text-white rounded-full uppercase font-medium tracking-wider">
                    {activeNote.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[#6E6E73]">
                    Last modified {activeNote.updatedAt}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-black">
                  {activeNote.title}
                </h2>
              </div>

              {/* Edit / Pin / Delete Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePinNote(activeNote.id)}
                  className={`p-2 rounded-full border text-xs transition-all ${
                    activeNote.pinned
                      ? 'border-black bg-black text-white'
                      : 'border-[#E5E5E7] text-[#6E6E73] hover:text-black hover:border-black'
                  }`}
                  title={activeNote.pinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin size={14} className={activeNote.pinned ? 'fill-white text-white' : ''} />
                </button>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 border rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
                    isEditing
                      ? 'bg-black border-black text-white'
                      : 'border-[#E5E5E7] text-black hover:bg-[#F5F5F7]'
                  }`}
                >
                  {isEditing ? <Eye size={13} /> : <Edit3 size={13} />}
                  <span>{isEditing ? 'Preview' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-2 rounded-full border border-[#E5E5E7] hover:border-red-500 text-[#6E6E73] hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Tags & Metadata */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#6E6E73] flex items-center gap-1.5 uppercase font-medium">
                <Tag size={12} className="text-[#6E6E73]" /> Tags:
              </span>
              {activeNote.tags.map(t => (
                <span key={t} className="px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-black text-[11px] font-medium">
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
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl p-5 text-xs text-black placeholder-[#6E6E73] focus:outline-none focus:bg-white focus:border-black transition-all resize-y leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-full transition-all shadow-xs"
                  >
                    Save & View Preview
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] min-h-[320px]">
                <div className="text-xs text-black leading-relaxed whitespace-pre-wrap">
                  {activeNote.content}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-8 p-16 text-center rounded-3xl border border-dashed border-[#E5E5E7] bg-[#F5F5F7] space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black">No document selected</h3>
            <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
              Select an indexed entry or click "New document" to draft a spec or operational note.
            </p>
          </div>
        )}
      </div>

      {/* CREATE NOTE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-black"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="text-xl font-serif font-medium tracking-tight text-black">
                  Create Vault Document.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Author a specification, architecture note, or team briefing.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine Specs"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Type / Space</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="team_wiki">Shared team wiki</option>
                    <option value="personal">Personal notebook</option>
                    <option value="quick_capture">Quick capture dump</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Project Scope</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="">General / Lab-wide</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. architecture, specs, crypto"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Markdown Content</label>
                <textarea
                  rows={8}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="# Heading&#10;&#10;Write markdown documentation here..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl p-3.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full transition-all shadow-xs"
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
