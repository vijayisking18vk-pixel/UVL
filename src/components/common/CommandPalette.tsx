import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Search,
  CheckSquare,
  Calendar,
  FileText,
  FolderArchive,
  Users,
  MessageSquare,
  Zap,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { sound } from '../../utils/sound';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    tasks,
    notes,
    files,
    meetings,
    channels,
    users,
    setActiveTab,
    switchUserById,
    setQuickCaptureOpen
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results aggregation
  const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))).slice(0, 3);
  const matchedNotes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 3);
  const matchedFiles = files.filter(f => f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q)).slice(0, 2);
  const matchedMeetings = meetings.filter(m => m.title.toLowerCase().includes(q) || m.agenda.some(a => a.toLowerCase().includes(q))).slice(0, 2);
  const matchedChannels = channels.filter(c => c.name.toLowerCase().includes(q)).slice(0, 2);

  const quickActions = [
    {
      id: 'act-new-dump',
      title: 'Quick Brain Dump',
      category: 'Action',
      icon: Zap,
      action: () => {
        setCommandPaletteOpen(false);
        setQuickCaptureOpen(true);
      }
    },
    {
      id: 'act-goto-tasks',
      title: 'Open Task Board',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('tasks');
      }
    },
    {
      id: 'act-goto-cal',
      title: 'Open Calendar & Overlays',
      category: 'Navigation',
      icon: Calendar,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('calendar');
      }
    },
    {
      id: 'act-goto-patch',
      title: 'Open Patch Identity Studio',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('personalization');
      }
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-[#14171B] border-2 border-[#3A4250] max-w-xl w-full p-4 patch-chamfer-md shadow-2xl relative">
        <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

        {/* Search Bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#242930]">
          <Search size={18} className="text-[#E5B869]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, files, meetings, or commands..."
            className="flex-1 bg-transparent text-sm font-mono text-[#EDE8DB] placeholder-[#6A7180] focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results / Actions List */}
        <div className="max-h-96 overflow-y-auto mt-3 space-y-3 font-mono text-xs pr-1">
          {/* Quick Actions if query is empty */}
          {!q && (
            <div>
              <span className="text-[10px] text-[#9E9A8E] uppercase tracking-wider block mb-1.5">
                Quick Shortcuts
              </span>
              <div className="space-y-1">
                {quickActions.map(act => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        sound.click();
                        act.action();
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-[#1E242C] text-left text-[#EDE8DB] patch-chamfer-sm transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className="text-[#E5B869]" />
                        <span>{act.title}</span>
                      </div>
                      <span className="text-[10px] text-[#9E9A8E] border border-[#2D333F] px-1.5 py-0.2">
                        {act.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Tasks */}
          {matchedTasks.length > 0 && (
            <div>
              <span className="text-[10px] text-[#9E9A8E] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <CheckSquare size={11} className="text-[#E5B869]" /> Tasks
              </span>
              <div className="space-y-1">
                {matchedTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('tasks');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 bg-[#0C0E11] hover:bg-[#1F242C] text-left text-[#EDE8DB] patch-chamfer-sm border border-[#252B35]"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[9px] text-[#E5B869] uppercase font-bold border border-[#E5B869]/40 px-1">
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Notes */}
          {matchedNotes.length > 0 && (
            <div>
              <span className="text-[10px] text-[#9E9A8E] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <FileText size={11} className="text-[#4EC5D4]" /> Notes & Wiki
              </span>
              <div className="space-y-1">
                {matchedNotes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('notes');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 bg-[#0C0E11] hover:bg-[#1F242C] text-left text-[#EDE8DB] patch-chamfer-sm border border-[#252B35]"
                  >
                    <span className="truncate">{n.title}</span>
                    <span className="text-[9px] text-[#9E9A8E]">{n.updatedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Files */}
          {matchedFiles.length > 0 && (
            <div>
              <span className="text-[10px] text-[#9E9A8E] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <FolderArchive size={11} className="text-[#5EBA7D]" /> Files & Artifacts
              </span>
              <div className="space-y-1">
                {matchedFiles.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('files');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 bg-[#0C0E11] hover:bg-[#1F242C] text-left text-[#EDE8DB] patch-chamfer-sm border border-[#252B35]"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-[9px] text-[#5EBA7D]">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Meetings */}
          {matchedMeetings.length > 0 && (
            <div>
              <span className="text-[10px] text-[#9E9A8E] uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Users size={11} className="text-[#9D7BFF]" /> Meetings & War Rooms
              </span>
              <div className="space-y-1">
                {matchedMeetings.map(m => (
                  <button
                    key={m.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('meetings');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2 bg-[#0C0E11] hover:bg-[#1F242C] text-left text-[#EDE8DB] patch-chamfer-sm border border-[#252B35]"
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="text-[9px] text-[#9D7BFF]">{m.date}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchedTasks.length === 0 && matchedNotes.length === 0 && matchedFiles.length === 0 && matchedMeetings.length === 0 && (
            <div className="p-8 text-center text-[#9E9A8E]">
              No lab artifacts matching "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-3 pt-2 border-t border-[#242930] flex items-center justify-between text-[10px] font-mono text-[#9E9A8E]">
          <span>Use ESC to close</span>
          <span>UNFOUNDED LAB // FAST INDEX</span>
        </div>
      </div>
    </div>
  );
};

