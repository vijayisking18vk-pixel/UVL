import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { UserStatus } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Activity,
  AlertTriangle,
  Send,
  Sparkles,
  MessageSquare,
  CheckCircle2
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

  const statusConfigs: Record<UserStatus, { label: string; badgeClass: string }> = {
    active: { label: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    focus: { label: 'Deep Focus', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    reviewing: { label: 'Reviewing', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    away: { label: 'Away / Standby', badgeClass: 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5E7]' },
    leave: { label: 'Airgap / Leave', badgeClass: 'bg-[#F5F5F7] text-[#8E8E93] border-[#E5E5E7]' }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E5E5E7]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-black">
            Team Pulse & Standup.
          </h1>
          <p className="text-sm text-[#6E6E73] mt-1 max-w-xl">
            Daily standup telemetry, active operator status broadcasts, and blocker detection.
          </p>
        </div>
      </div>

      {/* TOP: OPERATOR LIVE STATUS CONTROLLER */}
      <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-black">
              My Live Status ({currentUser.name} / {currentUser.callsign})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Transmitting</span>
          </div>
        </div>

        <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4 text-xs">
            <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
              Activity State
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
              className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs text-black focus:outline-none focus:border-black shadow-2xs"
            >
              <option value="active">Active (Available)</option>
              <option value="focus">Deep Focus (Muted)</option>
              <option value="reviewing">Reviewing PRs / Memos</option>
              <option value="away">Away / Standby</option>
              <option value="leave">On Leave / Airgap</option>
            </select>
          </div>

          <div className="md:col-span-6 text-xs">
            <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">
              Status Subject / Current Sprint
            </label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Tuning vector cache latency..."
              className="w-full bg-white border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black shadow-2xs"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-black/90 text-white font-medium text-xs rounded-full shadow-xs transition-all cursor-pointer"
            >
              Broadcast
            </button>
          </div>
        </form>
      </div>

      {/* TEAM PULSE BOARD: CARDS FOR ALL MEMBERS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E7]">
          <div>
            <h2 className="font-serif text-2xl font-normal tracking-tight text-black">
              Member Roster.
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              {users.length} registered operators synchronized.
            </p>
          </div>
          <span className="text-xs text-[#6E6E73] font-medium px-2.5 py-1 rounded-full bg-[#F5F5F7] border border-[#E5E5E7]">
            Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map(u => {
            const statusConfig = statusConfigs[u.status] || statusConfigs.active;
            const latestCheckin = checkins.find(c => c.userId === u.id);
            const hasBlocker = latestCheckin && latestCheckin.blockers.toLowerCase() !== 'none' && latestCheckin.blockers.trim().length > 0;

            return (
              <div
                key={u.id}
                className="p-5 rounded-3xl border border-[#E5E5E7] bg-white text-black flex flex-col justify-between space-y-4 hover:border-black/30 hover:shadow-md transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <PatchAvatar user={u} size="md" showStatus />
                      <div>
                        <h4 className="font-semibold text-sm text-black leading-tight">
                          {u.name}
                        </h4>
                        <span className="text-[11px] text-[#6E6E73]">
                          {u.callsign}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${statusConfig.badgeClass}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Focus message */}
                  <div className="p-3 bg-[#F5F5F7] rounded-2xl border border-[#E5E5E7] my-2 text-xs">
                    <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider font-semibold block mb-1">
                      Current focus:
                    </span>
                    <p className="text-black font-medium italic">
                      "{u.statusMessage || 'Standby for deployment'}"
                    </p>
                  </div>

                  {/* Latest Checkin details */}
                  {latestCheckin && (
                    <div className="space-y-2 text-xs mt-3 pt-2 border-t border-[#E5E5E7]">
                      <div className="flex items-center justify-between text-[11px] text-[#6E6E73]">
                        <span>Check-in: {latestCheckin.timestamp}</span>
                        <span className="font-semibold text-black">{latestCheckin.mood}</span>
                      </div>

                      {hasBlocker && (
                        <div className="p-2.5 border border-red-200 bg-red-50 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span>Blocker: {latestCheckin.blockers}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between text-[11px]">
                  <span className="text-[#6E6E73]">
                    Active: {u.lastActive}
                  </span>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="text-black hover:text-[#6E6E73] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <MessageSquare size={12} />
                    <span>Ping</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ASYNC CHECK-IN SUBMISSION FORM */}
      <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E5E7] flex items-center justify-center text-black">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-black">
                Submit Daily Standup.
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Visible to all lab members asynchronously.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCheckinSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-black font-medium mb-1.5 text-xs">
              1. Key operations executed or shipped today *
            </label>
            <textarea
              rows={2}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="e.g. Audited enclave charge-dump circuitry, pushed firmware commit v1.4..."
              className="w-full bg-white border border-[#E5E5E7] rounded-2xl p-3.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black resize-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-black font-medium mb-1.5 text-xs">
              2. Next tactical objective
            </label>
            <input
              type="text"
              value={workingOnNext}
              onChange={(e) => setWorkingOnNext(e.target.value)}
              placeholder="e.g. Enter Vault B for hardware root of trust ceremony..."
              className="w-full bg-white border border-[#E5E5E7] rounded-2xl px-3.5 py-2.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-medium mb-1.5 text-xs">
                3. Blockers, dependencies, or access limitations
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. None, or Need Jax physical key"
                className="w-full bg-white border border-[#E5E5E7] rounded-2xl px-3.5 py-2.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1.5 text-xs">
                4. Operational velocity / mood
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['⚡ Hyper', '🟢 Good', '🟡 Grinding', '🔴 Blocked'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`py-2 text-[11px] rounded-xl border transition-all cursor-pointer ${
                      mood === m
                        ? 'border-black bg-black text-white font-medium shadow-xs'
                        : 'border-[#E5E5E7] bg-white text-[#6E6E73] hover:text-black hover:border-black/30'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between">
            <div>
              {isSubmitted && (
                <span className="text-emerald-600 font-medium text-xs flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>Check-in dispatched successfully to Pulse Board!</span>
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black hover:bg-black/90 text-white rounded-full text-xs font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Send size={13} />
              <span>Transmit Check-in</span>
            </button>
          </div>
        </form>
      </div>

      {/* CHRONOLOGICAL CHECK-IN STREAM */}
      <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="pb-3 border-b border-[#E5E5E7]">
          <h3 className="font-serif text-xl font-normal text-black">
            Daily Check-in Transmissions.
          </h3>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            {checkins.length} recorded today.
          </p>
        </div>

        <div className="space-y-3.5">
          {checkins.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73]">
              No check-ins logged for today yet. Use the transmitter above to post your status.
            </div>
          ) : (
            checkins.map(ci => {
              const author = users.find(u => u.id === ci.userId);

              return (
                <div
                  key={ci.id}
                  className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7]/50 hover:bg-[#F5F5F7] hover:border-[#D1D1D6] transition-all space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#E5E5E7] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      {author && <PatchAvatar user={author} size="sm" />}
                      <span className="font-semibold text-black text-sm">{author?.name}</span>
                      <span className="text-[11px] text-[#6E6E73]">[{author?.callsign}]</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E5E5E7] text-black text-[10px] font-medium">
                        {ci.mood}
                      </span>
                      <span className="text-[10px] text-[#8E8E93]">
                        {ci.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#6E6E73] block mb-1">Completed today:</span>
                      <p className="text-black leading-relaxed">{ci.completedToday}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#6E6E73] block mb-1">Working on next:</span>
                      <p className="text-black leading-relaxed">{ci.workingOnNext || 'Ongoing backlog items'}</p>
                    </div>
                  </div>

                  {ci.blockers && ci.blockers.toLowerCase() !== 'none' && (
                    <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
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
