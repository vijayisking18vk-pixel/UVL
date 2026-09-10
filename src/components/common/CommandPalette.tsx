import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Search,
  CheckSquare,
  Calendar,
  FileText,
  FolderArchive,
  Users,
  Zap,
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
    expenses,
    investors,
    agentReports,
    setActiveTab,
    setQuickCaptureOpen
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))).slice(0, 3);
  const matchedNotes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)).slice(0, 3);
  const matchedFiles = files.filter(f => f.name.toLowerCase().includes(q) || f.folder.toLowerCase().includes(q)).slice(0, 2);
  const matchedMeetings = meetings.filter(m => m.title.toLowerCase().includes(q) || m.agenda.some(a => a.toLowerCase().includes(q))).slice(0, 2);
  const matchedExpenses = expenses.filter(e => e.vendor.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)).slice(0, 2);
  const matchedInvestors = investors.filter(i => i.name.toLowerCase().includes(q) || i.firm.toLowerCase().includes(q)).slice(0, 2);

  const quickActions = [
    {
      id: 'act-new-dump',
      title: 'Quick brain dump',
      category: 'Action',
      icon: Zap,
      action: () => {
        setCommandPaletteOpen(false);
        setQuickCaptureOpen(true);
      }
    },
    {
      id: 'act-goto-agent',
      title: 'AI Agent Task Executor',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('agent');
      }
    },
    {
      id: 'act-goto-expenses',
      title: 'Open Expense Ledger',
      category: 'Navigation',
      icon: FileText,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('expenses');
      }
    },
    {
      id: 'act-goto-investors',
      title: 'Open Investor Pipeline',
      category: 'Navigation',
      icon: Users,
      action: () => {
        setCommandPaletteOpen(false);
        setActiveTab('investors');
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
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-xl w-full p-6 space-y-4 text-xs font-sans text-black">
        {/* Search Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5E7]">
          <Search size={18} className="text-[#6E6E73]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, files, meetings, or commands..."
            className="flex-1 bg-transparent text-sm text-black placeholder-[#6E6E73] focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results / Actions List */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {/* Quick Actions if query is empty */}
          {!q && (
            <div>
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1">
                Quick shortcuts
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
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F5F5F7] text-left text-black transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-black">
                          <Icon size={14} />
                        </div>
                        <span className="font-medium text-sm">{act.title}</span>
                      </div>
                      <span className="text-[11px] text-[#6E6E73] font-medium">
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
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <CheckSquare size={13} className="text-[#6E6E73]" /> Tasks
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{t.title}</span>
                    <span className="text-[10px] uppercase font-semibold border border-[#E5E5E7] group-hover:border-white/30 px-2 py-0.5 rounded-full">
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
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <FileText size={13} className="text-[#6E6E73]" /> Notes & Wiki
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{n.title}</span>
                    <span className="text-[11px] text-[#6E6E73] group-hover:text-white/70">{n.updatedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Files */}
          {matchedFiles.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <FolderArchive size={13} className="text-[#6E6E73]" /> Files & Documents
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{f.name}</span>
                    <span className="text-[11px] text-[#6E6E73] group-hover:text-white/70">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Meetings */}
          {matchedMeetings.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <Users size={13} className="text-[#6E6E73]" /> War Rooms
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
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{m.title}</span>
                    <span className="text-[11px] text-[#6E6E73] group-hover:text-white/70">{m.date}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Expenses */}
          {matchedExpenses.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <FileText size={13} className="text-[#6E6E73]" /> Treasury & Expenses
              </span>
              <div className="space-y-1">
                {matchedExpenses.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('expenses');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{e.vendor} - {e.description || e.category}</span>
                    <span className="text-[11px] font-semibold">₹{e.amount.toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Investors */}
          {matchedInvestors.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider block mb-2 px-1 flex items-center gap-1.5">
                <Users size={13} className="text-[#6E6E73]" /> Investor Leads
              </span>
              <div className="space-y-1">
                {matchedInvestors.map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      sound.click();
                      setActiveTab('investors');
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F5F5F7] hover:bg-black hover:text-white text-left text-black border border-transparent transition-all group"
                  >
                    <span className="truncate font-medium">{i.name} ({i.firm})</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border border-[#E5E5E7] group-hover:border-white/30">{i.stage.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchedTasks.length === 0 && matchedNotes.length === 0 && matchedFiles.length === 0 && matchedMeetings.length === 0 && matchedExpenses.length === 0 && matchedInvestors.length === 0 && (
            <div className="p-8 text-center text-[#6E6E73]">
              No lab artifacts matching "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between text-[11px] text-[#6E6E73]">
          <span>Press ESC to dismiss</span>
          <span>UVL Command Quick Index</span>
        </div>
      </div>
    </div>
  );
};
