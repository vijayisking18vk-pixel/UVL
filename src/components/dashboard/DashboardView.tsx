import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  CheckSquare,
  Calendar,
  Activity,
  MessageSquare,
  Clock,
  ArrowRight,
  Plus,
  Radio,
  Zap,
  CheckCircle2,
  ListTodo
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    tasks,
    calendarEvents,
    messages,
    checkins,
    updateTaskStatus,
    setQuickCaptureOpen,
    setActiveTab,
    convertMessageToTask,
    addNote,
    supabaseConnected
  } = useWorkspace();

  const [scratchContent, setScratchContent] = useState('');
  const [scratchSaved, setScratchSaved] = useState(false);

  // Filter items for current user
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'done');
  const doneTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status === 'done');
  const myCompletedCount = doneTasks.length;

  const todayStr = '2026-09-10';
  const todayEvents = calendarEvents.filter(e => e.date === todayStr || e.date === '2026-09-09' || e.date === '2026-09-11');

  // Messages mentioning current user
  const userHandle = currentUser.handle.toLowerCase();
  const myMentions = messages.filter(m =>
    m.mentions.some(mention => mention.toLowerCase() === userHandle) ||
    m.text.toLowerCase().includes(userHandle)
  );

  const blockedCount = tasks.filter(t => t.status === 'blocked').length;

  const handleSaveScratch = () => {
    if (!scratchContent.trim()) return;
    addNote({
      title: `Scratchpad: ${scratchContent.slice(0, 30)}...`,
      content: scratchContent,
      type: 'quick_capture',
      authorId: currentUser.id,
      tags: ['scratchpad', 'editorial'],
      pinned: false
    });
    setScratchContent('');
    setScratchSaved(true);
    setTimeout(() => setScratchSaved(false), 2500);
  };

  return (
    <div className="space-y-12">
      {/* SECTION 1: HERO DISPLAY (Pure Black Background) */}
      <section className="bg-[#000000] text-[#FFFFFF] border-b border-white/20 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 micro-label text-white/60">
              <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
              <span>Command center</span>
              <span>/</span>
              <span>Overview</span>
              <span>/</span>
              <span className="meta-number text-white">{currentUser.name}</span>
            </div>

            <h1 className="headline-display font-extrabold tracking-tight">
              Unfounded <br />
              <span className="text-white/40">Venture Lab.</span>
            </h1>

            <div className="flex items-center gap-4 pt-2">
              <PatchAvatar user={currentUser} size="lg" showStatus />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">{currentUser.name}</span>
                  <span className="meta-number text-[11px] px-1.5 py-0.5 border border-white/30 text-[#A1A1AA]">
                    /{currentUser.callsign}
                  </span>
                </div>
                {currentUser.statusMessage ? (
                  <p className="body-text text-xs text-white/70 mt-0.5">
                    Focus: "{currentUser.statusMessage}"
                  </p>
                ) : (
                  <p className="micro-label text-white/50 mt-0.5">
                    Standby / Ready for mission deployment
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Asymmetric Right Data Matrix */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-0 border border-white/20 divide-x divide-white/20">
            <div className="p-4 bg-[#000000]">
              <span className="micro-label text-white/50 block">Assigned Tasks</span>
              <span className="meta-number text-3xl font-bold text-white mt-1 block">
                {String(myTasks.length).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 bg-[#000000]">
              <span className="micro-label text-white/50 block">Completed</span>
              <span className="meta-number text-3xl font-bold text-white mt-1 block">
                {String(myCompletedCount).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 bg-[#000000]">
              <span className="micro-label text-white/50 block">Lab Blockers</span>
              <span className="meta-number text-3xl font-bold text-white mt-1 block">
                {String(blockedCount).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 bg-[#000000]">
              <span className="micro-label text-white/50 block">Database</span>
              <span className="meta-number text-xs font-semibold text-[#A1A1AA] mt-3 block flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#A1A1AA]" />
                {supabaseConnected ? 'SUPABASE' : 'READY'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ALTERNATING FULL WHITE PANEL (Assigned Tasks) */}
      <section className="bg-[#FFFFFF] text-[#000000] p-6 sm:p-8 border border-black">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-black gap-4">
          <div>
            <span className="micro-label text-black/60 block">Catalog / Priority queue</span>
            <h2 className="headline-section font-bold text-black mt-1">
              Active Responsibilities ({myTasks.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className="px-4 py-2 bg-[#000000] text-[#FFFFFF] hover:bg-[#A1A1AA] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>View Full Board</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-16 text-center border-b border-black">
            <CheckCircle2 size={32} className="mx-auto text-black mb-3" />
            <p className="text-sm font-bold text-black uppercase tracking-wider">All assigned tasks clear</p>
            <p className="micro-label text-black/60 mt-1 max-w-sm mx-auto">
              Your personal queue is up to date. You can claim new operational items directly from the team board.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-black">
            {myTasks.map(t => (
              <div
                key={t.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[#000000] hover:text-[#FFFFFF] px-3 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => updateTaskStatus(t.id, 'done')}
                    className="mt-1 w-4 h-4 border border-current flex items-center justify-center cursor-pointer transition-colors group-hover:border-white"
                    title="Mark complete"
                  />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-black/60 group-hover:text-white/70 flex-wrap">
                      <span className="meta-number text-[10px] uppercase font-bold text-[#A1A1AA]">
                        /{t.priority}
                      </span>
                      <span>/</span>
                      <span className="meta-number text-[11px] flex items-center gap-1">
                        <Clock size={11} />
                        Due {t.dueDate}
                      </span>
                      {t.subtasks.length > 0 && (
                        <>
                          <span>/</span>
                          <span className="meta-number text-[11px]">
                            {t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} subtasks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => updateTaskStatus(t.id, 'done')}
                    className="px-3 py-1 border border-current text-xs font-semibold group-hover:border-white hover:bg-[#A1A1AA] hover:border-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 flex justify-between items-center text-xs text-black/60">
          <span className="meta-number text-[11px]">Direct Supabase live connection</span>
          <button
            onClick={() => setActiveTab('tasks')}
            className="font-semibold text-black hover:text-[#A1A1AA] flex items-center gap-1 cursor-pointer"
          >
            Create Task <Plus size={12} />
          </button>
        </div>
      </section>

      {/* SECTION 3: SPLIT ASYMMETRIC GRID (Pure Black Background) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: UPCOMING ENGAGEMENTS */}
        <div className="border border-white/20 p-6 bg-[#000000] text-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-4">
              <div>
                <span className="micro-label text-white/50 block">Schedule / War Room</span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Upcoming Engagements
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="micro-label text-white/70 hover:text-[#A1A1AA] flex items-center gap-1 cursor-pointer"
              >
                Calendar / <ArrowRight size={12} />
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-12 text-center border border-white/10">
                <Calendar size={24} className="mx-auto text-white/40 mb-2" />
                <p className="text-xs font-bold text-white uppercase">No engagements scheduled</p>
                <p className="micro-label text-white/50 mt-1">Calendar schedule is currently clear.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {todayEvents.map(ev => (
                  <div key={ev.id} className="py-3 group hover:text-[#A1A1AA] transition-colors">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="meta-number text-[10px] text-white/50 uppercase">
                        /{ev.category.replace('_', ' ')}
                      </span>
                      <span className="meta-number text-white font-medium">
                        {ev.startTime} – {ev.endTime}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#A1A1AA] transition-colors">
                      {ev.title}
                    </h4>
                    {ev.location && (
                      <p className="micro-label text-white/50 mt-1 flex items-center gap-1.5">
                        <Radio size={10} className="text-[#A1A1AA]" />
                        {ev.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/20 mt-6 flex gap-3">
            <button
              onClick={() => setActiveTab('meetings')}
              className="flex-1 py-2 border border-white/30 hover:border-[#A1A1AA] hover:text-[#A1A1AA] text-xs font-semibold transition-colors cursor-pointer"
            >
              Open Meetings /
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex-1 py-2 bg-white text-black hover:bg-[#A1A1AA] hover:text-black text-xs font-semibold transition-colors cursor-pointer"
            >
              Overlay View /
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: TEAM PULSE & ROSTER */}
        <div className="border border-white/20 p-6 bg-[#000000] text-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-4">
              <div>
                <span className="micro-label text-white/50 block">Roster / Standby</span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Team Pulse ({users.length})
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('checkins')}
                className="micro-label text-white/70 hover:text-[#A1A1AA] flex items-center gap-1 cursor-pointer"
              >
                Check-in / <ArrowRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-white/10">
              {users.map(u => {
                const latestCheckin = checkins.find(c => c.userId === u.id);
                return (
                  <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <PatchAvatar user={u} size="sm" showStatus />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{u.name}</span>
                          <span className="meta-number text-[9px] text-[#A1A1AA]">/{u.callsign}</span>
                        </div>
                        <p className="micro-label text-white/50 truncate">
                          {u.statusMessage || 'Standby'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="meta-number text-[10px] px-1.5 py-0.5 border border-white/20 text-white/70 uppercase">
                        {u.status}
                      </span>
                      {latestCheckin && (
                        <span className="block meta-number text-[9px] text-white/40 mt-1">
                          {latestCheckin.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 mt-6">
            <button
              onClick={() => setActiveTab('checkins')}
              className="w-full py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold transition-colors cursor-pointer"
            >
              Submit Today's Pulse /
            </button>
          </div>
        </div>

      </section>

      {/* SECTION 4: QUICK CAPTURE (Full White Panel) & DIRECT MENTIONS (Pure Black Panel) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* QUICK CAPTURE / SCRATCHPAD (Full White Panel) */}
        <div className="bg-[#FFFFFF] text-[#000000] p-6 border border-black flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-black mb-3">
              <div>
                <span className="micro-label text-black/60 block">Operator memo / Instant buffer</span>
                <h3 className="text-base font-bold text-black mt-0.5 flex items-center gap-2">
                  <Zap size={15} className="text-[#A1A1AA]" />
                  Quick-Capture Scratchpad
                </h3>
              </div>
              <span className="meta-number text-[10px] border border-black px-1.5 py-0.5 uppercase">
                Direct to Vault
              </span>
            </div>

            <p className="body-text text-xs text-black/70 mb-3">
              Jot down rapid thoughts, terminal outputs, deal leads, or architecture notes. One click archives directly into the Supabase knowledge repository.
            </p>

            <textarea
              value={scratchContent}
              onChange={(e) => setScratchContent(e.target.value)}
              placeholder="Type fast here... e.g. 'Discussed 800 Gbps optical transceiver demo with founder.'"
              className="w-full h-28 bg-[#FFFFFF] border border-black p-3 text-xs text-black placeholder-black/40 focus:outline-none focus:border-[#A1A1AA] resize-none"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-black flex items-center justify-between">
            <span className="micro-label text-[#A1A1AA] font-semibold">
              {scratchSaved && '✓ Archived to Supabase Notes!'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="px-3 py-1.5 border border-black hover:bg-black hover:text-white text-xs transition-colors cursor-pointer"
              >
                Expand /
              </button>
              <button
                onClick={handleSaveScratch}
                disabled={!scratchContent.trim()}
                className="px-4 py-1.5 bg-[#000000] hover:bg-[#A1A1AA] disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Archive Memo /
              </button>
            </div>
          </div>
        </div>

        {/* DIRECT MENTIONS (Pure Black Panel) */}
        <div className="bg-[#000000] text-[#FFFFFF] p-6 border border-white/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-3">
              <div>
                <span className="micro-label text-white/50 block">Tactical Comms / Pings</span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <MessageSquare size={15} className="text-[#A1A1AA]" />
                  Direct Mentions ({myMentions.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('chat')}
                className="micro-label text-white/70 hover:text-[#A1A1AA] flex items-center gap-1 cursor-pointer"
              >
                Open Comms / <ArrowRight size={12} />
              </button>
            </div>

            {myMentions.length === 0 ? (
              <div className="py-12 text-center border border-white/10">
                <MessageSquare size={24} className="mx-auto text-white/30 mb-2" />
                <p className="text-xs font-bold text-white uppercase">No pending @mentions</p>
                <p className="micro-label text-white/50 mt-1">You are all caught up on tactical team comms.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10 max-h-[180px] overflow-y-auto pr-1">
                {myMentions.map(msg => {
                  const sender = users.find(u => u.id === msg.senderId);
                  return (
                    <div key={msg.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {sender && <PatchAvatar user={sender} size="sm" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{sender?.name || 'Operator'}</span>
                            <span className="meta-number text-[10px] text-white/40">{msg.timestamp}</span>
                          </div>
                          <p className="body-text text-xs text-white/80 mt-0.5 truncate">
                            {msg.text}
                          </p>
                        </div>
                      </div>

                      {!msg.convertedToTaskId ? (
                        <button
                          onClick={() => convertMessageToTask(msg.id)}
                          className="px-2.5 py-1 border border-white/30 hover:border-[#A1A1AA] hover:bg-[#A1A1AA] hover:text-black text-white meta-number text-[10px] whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer"
                          title="Spawn a new task from this chat message"
                        >
                          <ListTodo size={11} />
                          Task /
                        </button>
                      ) : (
                        <span className="meta-number text-[9px] text-[#A1A1AA] border border-[#A1A1AA] px-1.5 py-0.5">
                          ✓ TASKED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/20 mt-4 text-right">
            <button
              onClick={() => setActiveTab('chat')}
              className="text-xs font-semibold text-white/70 hover:text-[#A1A1AA] transition-colors cursor-pointer"
            >
              Go to Tactical Chat Dispatch →
            </button>
          </div>
        </div>

      </section>
    </div>
  );
};
