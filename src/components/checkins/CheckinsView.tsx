import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { UserStatus } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Activity,
  AlertTriangle,
  Send,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export const CheckinsView: React.FC = () => {
  const {
    checkins,
    submitCheckin,
    users,
    currentUser,
    updateUserStatus,
    setActiveTab
  } = useWorkspace();

  // Active status form for current user
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(currentUser.status);
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage);

  // Check-in Form
  const [completedToday, setCompletedToday] = useState('');
  const [workingOnNext, setWorkingOnNext] = useState('');
  const [blockers, setBlockers] = useState('');
  const [mood, setMood] = useState<'⚡ Hyper' | '🟢 Good' | '🟡 Grinding' | '🔴 Blocked'>('🟢 Good');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserStatus(selectedStatus, statusMessage);
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completedToday.trim()) return;

    submitCheckin({
      date: new Date().toISOString().split('T')[0],
      completedToday: completedToday.trim(),
      workingOnNext: workingOnNext.trim(),
      blockers: blockers.trim() || 'None',
      mood
    });

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  const statusConfigs: Record<UserStatus, { label: string; indicator: string }> = {
    active: { label: 'Active // Online', indicator: 'bg-white text-black' },
    focus: { label: 'Deep Focus', indicator: 'bg-[#A1A1AA] text-white' },
    reviewing: { label: 'Code & Deal Review', indicator: 'bg-white text-black' },
    away: { label: 'Standby / Away', indicator: 'border border-white/40 text-white/60' },
    leave: { label: 'Airgap / Leave', indicator: 'border border-white/20 text-white/40' }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Top Editorial Header */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>status</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">team pulse & standup</span>
              <span>/</span>
              <span>asynchronous dispatch</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              Team pulse & standup.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Daily standup telemetry, active operator status broadcasts, and blocker detection.
            </p>
          </div>
        </div>
      </section>

      {/* TOP: OPERATOR LIVE STATUS CONTROLLER */}
      <div className="border border-white/20 bg-black p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <span className="text-xs font-mono uppercase tracking-wider text-white">
            My live status broadcast ({currentUser.name} / {currentUser.callsign})
          </span>
          <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">
            ● Transmitting
          </span>
        </div>

        <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4 font-mono text-xs">
            <label className="block text-white/50 text-[10px] uppercase mb-1">Activity State</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
              className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="active">Active (Available)</option>
              <option value="focus">Deep Focus (Muted)</option>
              <option value="reviewing">Reviewing PRs / Memos</option>
              <option value="away">Away / Standby</option>
              <option value="leave">On Leave / Airgap</option>
            </select>
          </div>

          <div className="md:col-span-6 font-mono text-xs">
            <label className="block text-white/50 text-[10px] uppercase mb-1">Status subject / current sprint</label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Tuning vector cache latency..."
              className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
            >
            </input>
          </div>

          <div className="md:col-span-2 md:pt-4">
            <button
              type="submit"
              className="w-full py-2 bg-white hover:bg-[#A1A1AA] text-black hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Broadcast
            </button>
          </div>
        </form>
      </div>

      {/* TEAM PULSE BOARD: CARDS FOR ALL MEMBERS */}
      <section className="section-white p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-black/20">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-black/50 mb-1">
              directory / operators / telemetry
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-black">
              Operator pulse board ({users.length} registered).
            </h2>
          </div>
          <span className="text-xs font-mono text-black/60 uppercase">
            Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map(u => {
            const statusConfig = statusConfigs[u.status] || statusConfigs.active;
            const latestCheckin = checkins.find(c => c.userId === u.id);
            const hasBlocker = latestCheckin && latestCheckin.blockers.toLowerCase() !== 'none' && latestCheckin.blockers.trim().length > 0;

            return (
              <div
                key={u.id}
                className="p-5 border border-black/20 bg-white text-black flex flex-col justify-between space-y-4 hover:border-black transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <PatchAvatar user={u} size="md" showStatus />
                      <div>
                        <h4 className="font-bold text-base text-black leading-tight">
                          {u.name}
                        </h4>
                        <span className="font-mono text-[11px] text-black/50">
                          {u.callsign}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold ${
                      u.status === 'focus' ? 'bg-[#A1A1AA] text-white' : 'border border-black text-black'
                    }`}>
                      {u.status}
                    </span>
                  </div>

                  {/* Focus message */}
                  <div className="p-3 border border-black/10 bg-black/[0.02] my-2 text-xs font-mono">
                    <span className="text-[10px] text-black/50 uppercase block mb-1">Current focus:</span>
                    <p className="text-black font-medium italic">"{u.statusMessage || 'Standby for deployment'}"</p>
                  </div>

                  {/* Latest Checkin details */}
                  {latestCheckin && (
                    <div className="space-y-1.5 text-xs font-mono mt-3">
                      <div className="flex items-center justify-between text-[11px] text-black/60">
                        <span>Check-in: {latestCheckin.timestamp}</span>
                        <span className="font-bold text-black">{latestCheckin.mood}</span>
                      </div>

                      {hasBlocker && (
                        <div className="p-2.5 border border-red-600/30 bg-red-50 flex items-start gap-2 text-red-600 text-[11px]">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span>Blocker: {latestCheckin.blockers}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-black/50">
                    Active: {u.lastActive}
                  </span>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="text-[#A1A1AA] hover:underline flex items-center gap-1 uppercase tracking-wider font-bold"
                  >
                    <MessageSquare size={11} /> Ping
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ASYNC CHECK-IN SUBMISSION FORM */}
      <div className="border border-white/20 bg-black p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/20">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#A1A1AA]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Submit daily standup check-in
            </h3>
          </div>
          <span className="text-[11px] font-mono text-white/50">
            Visible to all lab members asynchronously
          </span>
        </div>

        <form onSubmit={handleCheckinSubmit} className="space-y-5 font-mono text-xs">
          <div>
            <label className="block text-white/70 font-semibold mb-1 uppercase text-[11px]">
              1. Key operations executed or shipped today *
            </label>
            <textarea
              rows={2}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="e.g. Audited enclave charge-dump circuitry, pushed firmware commit v1.4..."
              className="w-full bg-black border border-white/20 p-3 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1 uppercase text-[11px]">
              2. Next tactical objective
            </label>
            <input
              type="text"
              value={workingOnNext}
              onChange={(e) => setWorkingOnNext(e.target.value)}
              placeholder="e.g. Enter Vault B for hardware root of trust ceremony..."
              className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/70 font-semibold mb-1 uppercase text-[11px]">
                3. Blockers, dependencies, or access limitations
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. None, or Need Jax physical key"
                className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1 uppercase text-[11px]">
                4. Operational velocity / mood
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['⚡ Hyper', '🟢 Good', '🟡 Grinding', '🔴 Blocked'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`py-2 text-[11px] border transition-colors ${
                      mood === m
                        ? 'border-[#A1A1AA] bg-white text-black font-bold'
                        : 'border-white/20 bg-black text-white hover:border-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-[#A1A1AA] font-bold text-xs">
              {isSubmitted && '✓ Check-in dispatched successfully to Pulse Board!'}
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Send size={13} />
              <span>Transmit check-in</span>
            </button>
          </div>
        </form>
      </div>

      {/* CHRONOLOGICAL CHECK-IN STREAM */}
      <div className="border border-white/20 bg-black p-6 space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white/50 pb-3 border-b border-white/20">
          Daily check-in transmissions ({checkins.length})
        </h3>

        <div className="space-y-4">
          {checkins.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/20 bg-black font-mono text-xs text-white/40">
              No check-ins logged for today yet. Use the transmitter above to post your status.
            </div>
          ) : (
            checkins.map(ci => {
              const author = users.find(u => u.id === ci.userId);

              return (
                <div
                  key={ci.id}
                  className="p-5 border border-white/20 bg-black hover:border-white transition-all space-y-3 font-mono text-xs"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2.5">
                      {author && <PatchAvatar user={author} size="sm" />}
                      <span className="font-bold text-white text-sm">{author?.name}</span>
                      <span className="text-[11px] text-white/50">[{author?.callsign}]</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 border border-white/20 text-white/80 text-[10px]">
                        {ci.mood}
                      </span>
                      <span className="text-[10px] text-white/40">
                        {ci.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-white/40 block mb-0.5">Completed today:</span>
                      <p className="text-white/90">{ci.completedToday}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-white/40 block mb-0.5">Working on next:</span>
                      <p className="text-white/90">{ci.workingOnNext || 'Ongoing backlog items'}</p>
                    </div>
                  </div>

                  {ci.blockers && ci.blockers.toLowerCase() !== 'none' && (
                    <div className="p-2.5 border border-red-600/40 bg-red-950/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Blocker: {ci.blockers}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
