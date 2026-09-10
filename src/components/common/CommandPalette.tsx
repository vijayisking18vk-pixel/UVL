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
    <div className="fixed inset-0 z-50 bg-black/90 flex items-start justify-center pt-24 p-4">
      <div className="bg-black border border-white/40 max-w-xl w-full p-5 space-y-4 font-mono text-xs">
        {/* Search Bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/20">
          <Search size={18} className="text-[#A1A1AA]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, files, meetings, or commands..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="text-white/50 hover:text-white p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search Results / Actions List */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {/* Quick Actions if query is empty */}
          {!q && (
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2">
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
                      className="w-full flex items-center justify-between p-2.5 hover:bg-white hover:text-black text-left text-white border border-transparent hover:border-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={14} className="text-[#A1A1AA]" />
                        <span className="font-medium">{act.title}</span>
                      </div>
                      <span className="text-[10px] opacity-60 uppercase">
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
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <CheckSquare size={11} className="text-[#A1A1AA]" /> Tasks
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[9px] uppercase font-bold border border-current px-1.5 py-0.2">
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
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <FileText size={11} className="text-[#A1A1AA]" /> Notes & Wiki
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{n.title}</span>
                    <span className="text-[10px] opacity-60">{n.updatedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Files */}
          {matchedFiles.length > 0 && (
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <FolderArchive size={11} className="text-[#A1A1AA]" /> Files & Documents
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className="text-[10px] opacity-60">{f.size}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Meetings */}
          {matchedMeetings.length > 0 && (
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Users size={11} className="text-[#A1A1AA]" /> War Rooms
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="text-[10px] opacity-60">{m.date}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Expenses */}
          {matchedExpenses.length > 0 && (
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <FileText size={11} className="text-[#A1A1AA]" /> Expenses & Receipts
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{e.vendor} - {e.description || e.category}</span>
                    <span className="text-[10px] font-bold meta-number">${e.amount.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Investors */}
          {matchedInvestors.length > 0 && (
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Users size={11} className="text-[#A1A1AA]" /> Investor Leads
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
                    className="w-full flex items-center justify-between p-2.5 bg-black hover:bg-white hover:text-black text-left text-white border border-white/20 hover:border-white transition-colors"
                  >
                    <span className="truncate">{i.name} ({i.firm})</span>
                    <span className="text-[10px] font-bold uppercase">{i.stage.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {q && matchedTasks.length === 0 && matchedNotes.length === 0 && matchedFiles.length === 0 && matchedMeetings.length === 0 && matchedExpenses.length === 0 && matchedInvestors.length === 0 && (
            <div className="p-8 text-center text-white/40">
              No lab artifacts matching "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/20 flex items-center justify-between text-[10px] text-white/40">
          <span>Escape to dismiss</span>
          <span>UNFOUNDED LAB / FAST INDEX</span>
        </div>
      </div>
    </div>
  );
};
