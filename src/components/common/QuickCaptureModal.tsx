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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto font-sans text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
          <div>
            <h3 className="text-xl font-serif font-medium tracking-tight text-black">
              Quick Capture.
            </h3>
            <p className="text-xs text-[#6E6E73] mt-0.5">Rapidly log ideas, terminal snippets, or operational thoughts.</p>
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
              Title / Subject (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Topic or operational label..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-sm text-black placeholder-[#6E6E73] focus:bg-white focus:border-black focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
              Notes / Content *
            </label>
            <textarea
              rows={5}
              required
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dump thoughts, architecture links, hardware specs, or meeting notes..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl p-3.5 text-sm text-black placeholder-[#6E6E73] focus:bg-white focus:border-black focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Project Link</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-sm text-black focus:bg-white focus:border-black focus:outline-none transition-all"
              >
                <option value="">None / General</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="brain-dump, idea"
                className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-sm text-black placeholder-[#6E6E73] focus:bg-white focus:border-black focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between">
            <span className="text-[11px] text-[#6E6E73]">
              Press ESC to dismiss
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuickCaptureOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black transition-colors rounded-full hover:bg-[#F5F5F7]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                {isSaved ? <Check size={14} /> : <Zap size={14} />}
                <span>{isSaved ? 'Archived' : 'Commit Capture'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
