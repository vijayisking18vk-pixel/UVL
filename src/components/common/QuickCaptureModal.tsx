import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Zap, X, Check } from 'lucide-react';
import { sound } from '../../utils/sound';

export const QuickCaptureModal: React.FC = () => {
  const {
    quickCaptureOpen,
    setQuickCaptureOpen,
    addNote,
    currentUser,
    projects
  } = useWorkspace();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [tags, setTags] = useState('brain-dump');
  const [isSaved, setIsSaved] = useState(false);

  if (!quickCaptureOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    sound.patchStamp();
    addNote({
      title: title.trim() || `Capture: ${content.slice(0, 25)}...`,
      content: content.trim(),
      type: 'quick_capture',
      authorId: currentUser.id,
      projectId,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      pinned: false
    });

    setTitle('');
    setContent('');
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setQuickCaptureOpen(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-black border border-white/40 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#A1A1AA]" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Quick capture
            </h3>
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="text-white/50 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/50 text-[10px] uppercase mb-1">
              Title / subject (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rapid topic or deal code..."
              className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
            />
          </div>

          <div>
            <label className="block text-white/50 text-[10px] uppercase mb-1">
              Notes / stream content *
            </label>
            <textarea
              rows={5}
              required
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dump thoughts, links, hardware specs, terminal snippets, or meeting notes..."
              className="w-full bg-black border border-white/20 p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-[10px] uppercase mb-1">Project link</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
              >
                <option value="">None / General</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/50 text-[10px] uppercase mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="brain-dump, idea"
                className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-[10px] text-white/40">
              Escape to dismiss
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuickCaptureOpen(false)}
                className="px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                {isSaved ? <Check size={13} /> : <Zap size={13} />}
                <span>{isSaved ? 'Archived' : 'Commit capture'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
