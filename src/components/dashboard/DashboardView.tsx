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
    <div className="space-y-10">
      {/* SECTION 1: HERO DISPLAY (Apple Radical Simplicity & Whitespace) */}
      <section className="pb-8 border-b border-[#E5E5E7]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 micro-label text-[#6E6E73]">
              <span className="w-2 h-2 rounded-full bg-black inline-block" />
              <span>Command Center</span>
              <span className="text-[#D1D1D6]">•</span>
              <span>Overview</span>
              <span className="text-[#D1D1D6]">•</span>
              <span className="font-semibold text-black">{currentUser.name}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-black tracking-tight leading-[1.08]">
              Unfounded <br />
              <span className="text-[#6E6E73] font-normal">Venture Lab.</span>
            </h1>

            <div className="flex items-center gap-4 pt-2">
              <PatchAvatar user={currentUser} size="lg" showStatus />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-black">{currentUser.name}</span>
                  <span className="meta-number text-[11px] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-[#6E6E73]">
                    /{currentUser.callsign}
                  </span>
                </div>
                {currentUser.statusMessage ? (
                  <p className="body-text text-xs text-[#6E6E73] mt-0.5">
                    "{currentUser.statusMessage}"
                  </p>
                ) : (
                  <p className="micro-label text-[#6E6E73] mt-0.5">
                    Standby • Ready for deployment
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Apple 4-Card Metric Grid */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
              <span className="micro-label text-[#6E6E73] block">Assigned Tasks</span>
              <span className="text-3xl font-semibold text-black mt-1 block font-mono">
                {String(myTasks.length).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
              <span className="micro-label text-[#6E6E73] block">Completed</span>
              <span className="text-3xl font-semibold text-black mt-1 block font-mono">
                {String(myCompletedCount).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
              <span className="micro-label text-[#6E6E73] block">Lab Blockers</span>
              <span className="text-3xl font-semibold text-black mt-1 block font-mono">
                {String(blockedCount).padStart(2, '0')}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between">
              <span className="micro-label text-[#6E6E73] block">Cloud Sync</span>
              <span className="text-xs font-semibold text-black mt-2 block flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {supabaseConnected ? 'Supabase Live' : 'Cloud Ready'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ACTIVE RESPONSIBILITIES (Apple Surface Card) */}
      <section className="p-6 sm:p-8 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E5E7] gap-4">
          <div>
            <span className="micro-label text-[#6E6E73] block">Priority Queue</span>
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-black mt-0.5">
              Active Responsibilities ({myTasks.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('tasks')}
              className="px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>View Full Board</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-2xl border border-[#E5E5E7]">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-black">All Assigned Tasks Completed</p>
            <p className="micro-label text-[#6E6E73] mt-1 max-w-sm mx-auto">
              Your personal queue is completely clear. You can claim new operational items directly from the team board.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myTasks.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-white border border-[#E5E5E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-black/30 transition-all shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => updateTaskStatus(t.id, 'done')}
                    className="mt-0.5 w-5 h-5 rounded-full border border-[#D1D1D6] hover:border-black flex items-center justify-center cursor-pointer transition-colors bg-white"
                    title="Mark complete"
                  />
                  <div>
                    <h3 className="text-sm font-semibold text-black tracking-tight">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-2.5 mt-1 text-xs text-[#6E6E73] flex-wrap">
                      <span className="text-[10px] uppercase font-semibold text-black px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
                        {t.priority}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] flex items-center gap-1 font-medium text-[#6E6E73]">
                        <Clock size={11} />
                        Due {t.dueDate}
                      </span>
                      {t.subtasks.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-[11px] text-[#6E6E73]">
                            {t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} subtasks
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    onClick={() => updateTaskStatus(t.id, 'done')}
                    className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-[#F5F5F7] hover:bg-white text-xs font-medium text-black transition-all cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-between items-center text-xs text-[#6E6E73]">
          <span className="meta-number text-[11px]">Direct Supabase live sync</span>
          <button
            onClick={() => setActiveTab('tasks')}
            className="font-medium text-black hover:opacity-70 flex items-center gap-1 cursor-pointer"
          >
            Create Task <Plus size={12} />
          </button>
        </div>
      </section>

      {/* SECTION 3: SPLIT TWO-COLUMN GRID (Upcoming Engagements & Team Pulse) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: UPCOMING ENGAGEMENTS */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] mb-4">
              <div>
                <span className="micro-label text-[#6E6E73] block">Schedule & Events</span>
                <h2 className="text-lg font-serif font-semibold text-black mt-0.5">
                  Upcoming Engagements
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="text-xs font-medium text-[#6E6E73] hover:text-black flex items-center gap-1 cursor-pointer"
              >
                Calendar <ArrowRight size={12} />
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border border-[#E5E5E7]">
                <Calendar size={24} className="mx-auto text-[#6E6E73] mb-2" />
                <p className="text-xs font-semibold text-black">No Engagements Scheduled</p>
                <p className="micro-label text-[#6E6E73] mt-1">Calendar schedule is currently clear.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayEvents.map(ev => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-white border border-[#E5E5E7] hover:border-black/20 transition-all">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] text-[#6E6E73] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#F5F5F7]">
                        {ev.category.replace('_', ' ')}
                      </span>
                      <span className="meta-number text-black font-semibold">
                        {ev.startTime} – {ev.endTime}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-black">
                      {ev.title}
                    </h4>
                    {ev.location && (
                      <p className="micro-label text-[#6E6E73] mt-1 flex items-center gap-1.5">
                        <Radio size={11} className="text-[#6E6E73]" />
                        {ev.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5E5E7] flex gap-3">
            <button
              onClick={() => setActiveTab('meetings')}
              className="flex-1 py-2.5 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-black text-xs font-medium transition-all cursor-pointer text-center"
            >
              Open Meetings
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex-1 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-medium transition-all cursor-pointer text-center"
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: TEAM PULSE & ROSTER */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7] mb-4">
              <div>
                <span className="micro-label text-[#6E6E73] block">Operator Roster</span>
                <h2 className="text-lg font-serif font-semibold text-black mt-0.5">
                  Team Pulse ({users.length})
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('checkins')}
                className="text-xs font-medium text-[#6E6E73] hover:text-black flex items-center gap-1 cursor-pointer"
              >
                Pulse <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {users.map(u => {
                const latestCheckin = checkins.find(c => c.userId === u.id);
                return (
                  <div key={u.id} className="p-3 rounded-2xl bg-white border border-[#E5E5E7] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <PatchAvatar user={u} size="sm" showStatus />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-black truncate">{u.name}</span>
                          <span className="meta-number text-[10px] text-[#6E6E73]">/{u.callsign}</span>
                        </div>
                        <p className="micro-label text-[#6E6E73] truncate">
                          {u.statusMessage || 'Standby'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-[#6E6E73] uppercase font-medium">
                        {u.status}
                      </span>
                      {latestCheckin && (
                        <span className="block meta-number text-[9px] text-[#6E6E73] mt-1">
                          {latestCheckin.timestamp}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E7]">
            <button
              onClick={() => setActiveTab('checkins')}
              className="w-full py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 font-medium text-xs transition-all cursor-pointer"
            >
              Submit Today's Pulse
            </button>
          </div>
        </div>

      </section>

      {/* SECTION 4: QUICK CAPTURE & DIRECT MENTIONS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* QUICK CAPTURE / SCRATCHPAD */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-3">
              <div>
                <span className="micro-label text-[#6E6E73] block">Rapid Buffer</span>
                <h3 className="text-base font-serif font-semibold text-black mt-0.5 flex items-center gap-2">
                  <Zap size={15} className="text-black" />
                  Quick-Capture Scratchpad
                </h3>
              </div>
              <span className="meta-number text-[10px] rounded-full bg-white border border-[#E5E5E7] px-2 py-0.5 text-[#6E6E73]">
                Instant Vault
              </span>
            </div>

            <p className="body-text text-xs text-[#6E6E73] mb-3">
              Jot down rapid thoughts, terminal outputs, deal leads, or architecture notes. One click archives directly into the Supabase knowledge repository.
            </p>

            <textarea
              value={scratchContent}
              onChange={(e) => setScratchContent(e.target.value)}
              placeholder="Type fast here... e.g. 'Discussed drone motor telemetry benchmark with founder.'"
              className="w-full h-28 bg-white border border-[#E5E5E7] rounded-2xl p-3.5 text-xs text-black placeholder-[#6E6E73] focus:outline-none focus:border-black resize-none transition-all"
            />
          </div>

          <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between">
            <span className="micro-label text-emerald-600 font-medium">
              {scratchSaved && '✓ Archived to Supabase Notes!'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-black text-xs font-medium transition-all cursor-pointer"
              >
                Expand
              </button>
              <button
                onClick={handleSaveScratch}
                disabled={!scratchContent.trim()}
                className="px-4 py-1.5 rounded-full bg-black hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-medium transition-all cursor-pointer"
              >
                Archive Memo
              </button>
            </div>
          </div>
        </div>

        {/* DIRECT MENTIONS */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#F5F5F7] border border-[#E5E5E7] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-3">
              <div>
                <span className="micro-label text-[#6E6E73] block">Tactical Comms</span>
                <h3 className="text-base font-serif font-semibold text-black mt-0.5 flex items-center gap-2">
                  <MessageSquare size={15} className="text-black" />
                  Direct Mentions ({myMentions.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('chat')}
                className="text-xs font-medium text-[#6E6E73] hover:text-black flex items-center gap-1 cursor-pointer"
              >
                Open Comms <ArrowRight size={12} />
              </button>
            </div>

            {myMentions.length === 0 ? (
              <div className="py-10 text-center bg-white rounded-2xl border border-[#E5E5E7]">
                <MessageSquare size={24} className="mx-auto text-[#6E6E73] mb-2" />
                <p className="text-xs font-semibold text-black">No Pending @Mentions</p>
                <p className="micro-label text-[#6E6E73] mt-1">You are all caught up on tactical team comms.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {myMentions.map(msg => {
                  const sender = users.find(u => u.id === msg.senderId);
                  return (
                    <div key={msg.id} className="p-3 rounded-2xl bg-white border border-[#E5E5E7] flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {sender && <PatchAvatar user={sender} size="sm" />}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-black">{sender?.name || 'Operator'}</span>
                            <span className="meta-number text-[10px] text-[#6E6E73]">{msg.timestamp}</span>
                          </div>
                          <p className="body-text text-xs text-black mt-0.5 truncate">
                            {msg.text}
                          </p>
                        </div>
                      </div>

                      {!msg.convertedToTaskId ? (
                        <button
                          onClick={() => convertMessageToTask(msg.id)}
                          className="px-2.5 py-1 rounded-full border border-[#E5E5E7] hover:border-black hover:bg-black hover:text-white text-black meta-number text-[10px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="Spawn a new task from this chat message"
                        >
                          <ListTodo size={11} />
                          Task
                        </button>
                      ) : (
                        <span className="meta-number text-[9px] text-emerald-600 border border-emerald-500/40 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          ✓ TASKED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E5E5E7] text-right">
            <button
              onClick={() => setActiveTab('chat')}
              className="text-xs font-medium text-black hover:opacity-70 transition-all cursor-pointer"
            >
              Go to Tactical Chat Dispatch →
            </button>
          </div>
        </div>

      </section>
    </div>
  );
};
