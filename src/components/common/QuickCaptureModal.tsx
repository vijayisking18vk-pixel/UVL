import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Zap, X, Check, FileText } from 'lucide-react';
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
      title: title.trim() || `Brain Dump: ${content.slice(0, 25)}...`,
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
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#17191E] border-2 border-[#E5B869] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative">
        <div className="absolute inset-[3px] border border-dashed border-[#E5B869]/30 pointer-events-none patch-chamfer-md" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#2A303A] mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-[#E5B869]" />
            <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
              Sticky Brain Dump // Quick Capture
            </h3>
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          <div>
            <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">
              Title / Subject (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rapid topic or deal code..."
              className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
            />
          </div>

          <div>
            <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">
              Notes / Brain Dump *
            </label>
            <textarea
              rows={5}
              required
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dump thoughts, links, hardware specs, terminal snippets, or meeting notes..."
              className="w-full bg-[#0C0E11] border border-[#2D3440] p-3 text-xs text-[#EDE8DB] patch-chamfer-sm focus:outline-none focus:border-[#E5B869] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">Project Link</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#9E9A8E] text-[10px] uppercase mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="brain-dump, idea"
                className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#2A303A] flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#9E9A8E]">
              Press Escape or Cancel to close
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setQuickCaptureOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm transition-transform active:scale-95 flex items-center gap-1"
              >
                {isSaved ? <Check size={13} strokeWidth={3} /> : <Zap size={13} />}
                <span>{isSaved ? 'Archived!' : 'Capture to Vault'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

