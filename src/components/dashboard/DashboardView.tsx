import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  CheckSquare,
  Calendar,
  Activity,
  MessageSquare,
  Clock,
  AlertTriangle,
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
    notes,
    addNote
  } = useWorkspace();

  const [scratchContent, setScratchContent] = useState('');
  const [scratchSaved, setScratchSaved] = useState(false);

  // Filter items for current user
  const myTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'done');
  const doneTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status === 'done');
  const myCompletedCount = doneTasks.length;

  const todayStr = '2026-09-10'; // Matching our seed current date
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
      tags: ['scratchpad', 'brain-dump'],
      pinned: false
    });
    setScratchContent('');
    setScratchSaved(true);
    setTimeout(() => setScratchSaved(false), 2500);
  };

  const priorityBadges = {
    urgent: 'bg-[#E05A47]/20 text-[#E05A47] border-[#E05A47]/40',
    high: 'bg-[#E5B869]/20 text-[#E5B869] border-[#E5B869]/40',
    medium: 'bg-[#4EC5D4]/20 text-[#4EC5D4] border-[#4EC5D4]/40',
    low: 'bg-[#9E9A8E]/20 text-[#9E9A8E] border-[#9E9A8E]/40'
  };

  return (
    <div className="space-y-6">
      {/* Top Tactical Briefing Banner */}
      <div className="bg-[#14171C] border border-[#2B313B] p-5 relative overflow-hidden patch-chamfer-md shadow-lg">
        {/* Embroidered border accent */}
        <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/15 pointer-events-none patch-chamfer-md" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <PatchAvatar user={currentUser} size="xl" showStatus />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                  OPERATOR {currentUser.name}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 bg-[#E5B869] text-[#0B0C0E] font-bold patch-chamfer-sm">
                  {currentUser.callsign}
                </span>
                <span className="font-mono text-xs text-[#9E9A8E] px-2 py-0.5 border border-[#323945]">
                  ROLE: {currentUser.role.toUpperCase()}
                </span>
              </div>
              <p className="font-mono text-xs text-[#9E9A8E] mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#5EBA7D] rounded-none inline-block animate-pulse" />
                Current Focus: <span className="text-[#EDE8DB] italic">"{currentUser.statusMessage}"</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="bg-[#0C0E11] border border-[#2D333F] px-3.5 py-2 patch-chamfer-sm min-w-[110px]">
              <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block">Assigned Tasks</span>
              <span className="font-patch text-2xl font-bold text-[#EDE8DB]">{myTasks.length}</span>
            </div>
            <div className="bg-[#0C0E11] border border-[#2D333F] px-3.5 py-2 patch-chamfer-sm min-w-[110px]">
              <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block">Completed</span>
              <span className="font-patch text-2xl font-bold text-[#5EBA7D]">{myCompletedCount}</span>
            </div>
            <div className="bg-[#0C0E11] border border-[#2D333F] px-3.5 py-2 patch-chamfer-sm min-w-[110px]">
              <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block">Lab Blockers</span>
              <span className="font-patch text-2xl font-bold text-[#E05A47]">{blockedCount}</span>
            </div>
            <div className="bg-[#0C0E11] border border-[#2D333F] px-3.5 py-2 patch-chamfer-sm min-w-[110px]">
              <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block">Lab Nodes</span>
              <span className="font-patch text-2xl font-bold text-[#4EC5D4]">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Command Center Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 1: MY ACTIVE TASKS */}
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#E5B869]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
                  My Assigned Tasks ({myTasks.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('tasks')}
                className="font-mono text-[11px] text-[#E5B869] hover:underline flex items-center gap-1"
              >
                Board <ArrowRight size={12} />
              </button>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#282F3B] bg-[#0C0E11]">
                <CheckCircle2 size={24} className="mx-auto text-[#5EBA7D] mb-2" />
                <p className="font-mono text-xs text-[#EDE8DB]">All assigned tasks clear!</p>
                <p className="font-mono text-[10px] text-[#9E9A8E] mt-1">Take a breather or pick a new task from the board.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {myTasks.map(t => (
                  <div
                    key={t.id}
                    className="p-3 bg-[#191D22] border border-[#2B323D] hover:border-[#E5B869]/50 transition-colors patch-chamfer-sm group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => updateTaskStatus(t.id, 'done')}
                          className="mt-0.5 w-4 h-4 border border-[#9E9A8E] hover:border-[#5EBA7D] hover:bg-[#5EBA7D]/20 flex items-center justify-center transition-colors"
                          title="Mark complete"
                        />
                        <div>
                          <h4 className="font-mono text-xs font-semibold text-[#EDE8DB] leading-snug group-hover:text-[#E5B869] transition-colors">
                            {t.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[9px] px-1.5 py-0.2 border uppercase font-mono ${priorityBadges[t.priority]}`}>
                              {t.priority}
                            </span>
                            <span className="font-mono text-[10px] text-[#9E9A8E] flex items-center gap-1">
                              <Clock size={10} />
                              Due {t.dueDate}
                            </span>
                            {t.subtasks.length > 0 && (
                              <span className="font-mono text-[10px] text-[#9E9A8E]">
                                [{t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} subtasks]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#242930] mt-4">
            <button
              onClick={() => setActiveTab('tasks')}
              className="w-full py-1.5 bg-[#1C2026] hover:bg-[#252B33] border border-[#323945] font-mono text-xs text-[#EDE8DB] flex items-center justify-center gap-2 transition-colors patch-chamfer-sm"
            >
              <Plus size={13} />
              Add or Reassign Tasks
            </button>
          </div>
        </div>

        {/* WIDGET 2: CALENDAR & UPCOMING ENGAGEMENTS */}
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#4EC5D4]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
                  Upcoming Engagements
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('calendar')}
                className="font-mono text-[11px] text-[#4EC5D4] hover:underline flex items-center gap-1"
              >
                Calendar <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {todayEvents.map(ev => {
                const isMeeting = ev.category === 'meeting';
                const isDeadline = ev.category === 'task_deadline';
                return (
                  <div
                    key={ev.id}
                    className={`p-3 border patch-chamfer-sm transition-colors ${
                      isMeeting
                        ? 'bg-[#182126] border-[#2C414E]'
                        : isDeadline
                        ? 'bg-[#241B1B] border-[#4E2C2C]'
                        : 'bg-[#191D22] border-[#2B323D]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-mono text-[9px] px-1.5 py-0.2 border uppercase ${
                        isMeeting
                          ? 'border-[#4EC5D4]/40 text-[#4EC5D4] bg-[#4EC5D4]/10'
                          : isDeadline
                          ? 'border-[#E05A47]/40 text-[#E05A47] bg-[#E05A47]/10'
                          : 'border-[#E5B869]/40 text-[#E5B869] bg-[#E5B869]/10'
                      }`}>
                        {ev.category.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[11px] text-[#EDE8DB] font-semibold">
                        {ev.startTime} - {ev.endTime}
                      </span>
                    </div>

                    <h4 className="font-mono text-xs font-semibold text-[#EDE8DB]">
                      {ev.title}
                    </h4>

                    {ev.location && (
                      <p className="font-mono text-[10px] text-[#9E9A8E] mt-1 flex items-center gap-1">
                        <Radio size={10} className="text-[#5EBA7D]" />
                        {ev.location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#242930] mt-4 flex gap-2">
            <button
              onClick={() => setActiveTab('meetings')}
              className="flex-1 py-1.5 bg-[#1C2026] hover:bg-[#252B33] border border-[#323945] font-mono text-xs text-[#4EC5D4] flex items-center justify-center gap-1.5 transition-colors patch-chamfer-sm"
            >
              Open Meetings
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className="flex-1 py-1.5 bg-[#1C2026] hover:bg-[#252B33] border border-[#323945] font-mono text-xs text-[#EDE8DB] flex items-center justify-center gap-1.5 transition-colors patch-chamfer-sm"
            >
              Overlay View
            </button>
          </div>
        </div>

        {/* WIDGET 3: LIVE TEAM PULSE */}
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#5EBA7D]" />
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
                  Team Pulse & Status
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('checkins')}
                className="font-mono text-[11px] text-[#5EBA7D] hover:underline flex items-center gap-1"
              >
                Check-in <ArrowRight size={12} />
              </button>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {users.map(u => {
                const latestCheckin = checkins.find(c => c.userId === u.id);
                return (
                  <div
                    key={u.id}
                    className="p-2.5 bg-[#181B20] border border-[#282F3B] patch-chamfer-sm flex items-start gap-2.5"
                  >
                    <PatchAvatar user={u} size="sm" showStatus />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#EDE8DB] truncate">
                          {u.name}
                        </span>
                        <span className="font-mono text-[9px] uppercase px-1 border border-[#323945] text-[#9E9A8E]">
                          {u.status}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-[#9E9A8E] truncate mt-0.5">
                        {u.statusMessage || 'Standby'}
                      </p>
                      {latestCheckin && (
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-[9px] text-[#D8D2C2] bg-[#0C0E11] px-1.5 py-0.5 border border-[#242930]">
                          <span>{latestCheckin.mood}</span>
                          <span className="text-[#9E9A8E] truncate">Next: {latestCheckin.workingOnNext}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#242930] mt-4">
            <button
              onClick={() => setActiveTab('checkins')}
              className="w-full py-1.5 bg-[#5EBA7D]/15 hover:bg-[#5EBA7D]/25 border border-[#5EBA7D]/40 font-mono text-xs text-[#5EBA7D] flex items-center justify-center gap-2 transition-colors patch-chamfer-sm font-semibold"
            >
              Submit Today's Pulse
            </button>
          </div>
        </div>

      </div>

      {/* SECOND ROW: QUICK CAPTURE STICKY NOTE + CHAT MENTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* QUICK CAPTURE / SCRATCHPAD WIDGET */}
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#E5B869]" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
                Operator Quick-Capture Scratchpad
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[#9E9A8E] border border-[#2E3541] px-1.5 py-0.5">
              AUTO-SAVES TO WIKI
            </span>
          </div>

          <p className="font-mono text-xs text-[#9E9A8E] mb-2">
            Jot down rapid thoughts, terminal outputs, deal leads, or snippets. One click archives them straight into the Knowledge Base.
          </p>

          <textarea
            value={scratchContent}
            onChange={(e) => setScratchContent(e.target.value)}
            placeholder="Type fast here... e.g. 'Founder email: ken@photonmatrix.io. Discussed 800 Gbps optical transceiver demo.'"
            className="w-full h-28 bg-[#0C0E11] border border-[#2D3440] p-3 text-xs font-mono text-[#EDE8DB] placeholder-[#666B75] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
          />

          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#5EBA7D]">
              {scratchSaved && '✓ Archived to Notes & Wiki!'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setQuickCaptureOpen(true)}
                className="px-3 py-1.5 bg-[#1C2026] hover:bg-[#252B33] border border-[#323945] font-mono text-xs text-[#9E9A8E] hover:text-[#EDE8DB] patch-chamfer-sm"
              >
                Expand Modal
              </button>
              <button
                onClick={handleSaveScratch}
                disabled={!scratchContent.trim()}
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] disabled:opacity-40 disabled:pointer-events-none text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Save Brain Dump
              </button>
            </div>
          </div>
        </div>

        {/* CHAT MENTIONS & ACTIONABLE PINGS */}
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#9D7BFF]" />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
                Direct Mentions & Tactical Pings ({myMentions.length})
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('chat')}
              className="font-mono text-[11px] text-[#9D7BFF] hover:underline flex items-center gap-1"
            >
              Open Comms <ArrowRight size={12} />
            </button>
          </div>

          {myMentions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#282F3B] bg-[#0C0E11]">
              <MessageSquare size={24} className="mx-auto text-[#666B75] mb-2" />
              <p className="font-mono text-xs text-[#EDE8DB]">No pending @mentions</p>
              <p className="font-mono text-[10px] text-[#9E9A8E] mt-1">You are all caught up on tactical team comms.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
              {myMentions.map(msg => {
                const sender = users.find(u => u.id === msg.senderId);
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 bg-[#191D22] border border-[#2D333F] patch-chamfer-sm flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2">
                      {sender && <PatchAvatar user={sender} size="sm" />}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-[#EDE8DB]">
                            {sender?.name || 'Operator'}
                          </span>
                          <span className="font-mono text-[10px] text-[#9E9A8E]">
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#D8D2C2] mt-0.5">
                          {msg.text}
                        </p>
                      </div>
                    </div>

                    {!msg.convertedToTaskId ? (
                      <button
                        onClick={() => convertMessageToTask(msg.id)}
                        className="px-2 py-1 bg-[#E5B869]/15 hover:bg-[#E5B869]/25 border border-[#E5B869]/40 text-[#E5B869] font-mono text-[10px] whitespace-nowrap patch-chamfer-sm flex items-center gap-1"
                        title="Spawn a new task from this chat message"
                      >
                        <ListTodo size={11} />
                        Make Task
                      </button>
                    ) : (
                      <span className="font-mono text-[9px] text-[#5EBA7D] border border-[#5EBA7D]/40 px-1.5 py-0.5">
                        ✓ TASKED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
