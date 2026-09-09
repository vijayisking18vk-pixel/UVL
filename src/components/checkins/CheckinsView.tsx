import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Checkin, UserStatus } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Activity,
  AlertTriangle,
  Send,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
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

  const statusConfigs: Record<UserStatus, { label: string; color: string; bg: string; border: string }> = {
    active: { label: 'ACTIVE // ONLINE', color: '#5EBA7D', bg: 'bg-[#17221A]', border: 'border-[#5EBA7D]/50' },
    focus: { label: 'DEEP FOCUS // DO NOT DISTURB', color: '#4EC5D4', bg: 'bg-[#152329]', border: 'border-[#4EC5D4]/50' },
    reviewing: { label: 'CODE & DEAL REVIEW', color: '#E5B869', bg: 'bg-[#292215]', border: 'border-[#E5B869]/50' },
    away: { label: 'TEMPORARILY AWAY', color: '#9E9A8E', bg: 'bg-[#1D2024]', border: 'border-[#9E9A8E]/40' },
    leave: { label: 'ON LEAVE / AIRGAP', color: '#E05A47', bg: 'bg-[#291717]', border: 'border-[#E05A47]/50' }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#5EBA7D]">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Team Pulse & Async Check-ins
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Daily standup telemetry, active status dispatch, and team blocker radar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP: OPERATOR LIVE STATUS CONTROLLER */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-3">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDE8DB]">
            My Live Dispatch Signal ({currentUser.name} • {currentUser.callsign})
          </span>
          <span className="font-mono text-[10px] text-[#5EBA7D]">
            ● BROADCASTING
          </span>
        </div>

        <form onSubmit={handleStatusUpdate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-4">
            <label className="block text-[#9E9A8E] text-[10px] font-mono uppercase mb-1">Set Activity State</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
              className="w-full bg-[#0C0E11] border border-[#2D333F] px-3 py-1.5 text-xs font-mono text-[#EDE8DB] patch-chamfer-sm"
            >
              <option value="active">Active (Available)</option>
              <option value="focus">Deep Focus (Muted)</option>
              <option value="reviewing">Reviewing PRs / Memos</option>
              <option value="away">Away / Standby</option>
              <option value="leave">On Leave / Airgap</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="block text-[#9E9A8E] text-[10px] font-mono uppercase mb-1">Status Subject / What are you actively running?</label>
            <input
              type="text"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="e.g. Tuning vector cache latency..."
              className="w-full bg-[#0C0E11] border border-[#2D333F] px-3 py-1.5 text-xs font-mono text-[#EDE8DB] patch-chamfer-sm"
            />
          </div>

          <div className="md:col-span-2 pt-4">
            <button
              type="submit"
              className="w-full py-1.5 bg-[#5EBA7D] hover:bg-[#6EC88C] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm transition-transform active:scale-95"
            >
              Broadcast State
            </button>
          </div>
        </form>
      </div>

      {/* TEAM PULSE BOARD: CARDS FOR ALL MEMBERS */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#9E9A8E]">
          Team Operator Pulse Board ({users.length} Operators Registered)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => {
            const statusConfig = statusConfigs[u.status] || statusConfigs.active;
            const latestCheckin = checkins.find(c => c.userId === u.id);
            const hasBlocker = latestCheckin && latestCheckin.blockers.toLowerCase() !== 'none' && latestCheckin.blockers.trim().length > 0;

            return (
              <div
                key={u.id}
                className={`p-4 border patch-chamfer-md shadow-md transition-all ${statusConfig.bg} ${statusConfig.border} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <PatchAvatar user={u} size="md" showStatus />
                      <div>
                        <h4 className="font-mono text-sm font-bold text-[#EDE8DB] leading-none">
                          {u.name}
                        </h4>
                        <span className="font-mono text-[10px] text-[#9E9A8E] mt-0.5 block">
                          [{u.callsign}] • {u.role.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <span className={`font-mono text-[9px] px-1.5 py-0.2 border uppercase font-semibold ${statusConfig.border}`} style={{ color: statusConfig.color }}>
                      {u.status}
                    </span>
                  </div>

                  {/* Focus message */}
                  <div className="p-2.5 bg-[#0C0E11]/80 border border-[#242A33] patch-chamfer-sm my-2 text-xs font-mono">
                    <span className="text-[10px] text-[#9E9A8E] uppercase block mb-0.5">Current Focus:</span>
                    <p className="text-[#EDE8DB] italic">"{u.statusMessage || 'Standby for deployment'}"</p>
                  </div>

                  {/* Latest Checkin details */}
                  {latestCheckin && (
                    <div className="space-y-1 text-xs font-mono mt-2">
                      <div className="flex items-center justify-between text-[10px] text-[#9E9A8E]">
                        <span>Checked in at {latestCheckin.timestamp}</span>
                        <span className="font-bold text-[#EDE8DB]">{latestCheckin.mood}</span>
                      </div>

                      {hasBlocker && (
                        <div className="mt-1.5 p-2 bg-[#2D1616] border border-[#E05A47]/40 patch-chamfer-sm flex items-start gap-1.5 text-[#E05A47]">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">
                            Blocker: {latestCheckin.blockers}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-[#242930] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#9E9A8E]">
                    Last active: {u.lastActive}
                  </span>

                  <button
                    onClick={() => setActiveTab('chat')}
                    className="font-mono text-[10px] text-[#E5B869] hover:underline flex items-center gap-1"
                  >
                    <MessageSquare size={10} /> Ping Operator
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ASYNC CHECK-IN SUBMISSION FORM */}
      <div className="bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#242930]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#E5B869]" />
            <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
              Submit Today's Tactical Standup Check-in
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#9E9A8E]">
            Visible to all lab members asynchronously
          </span>
        </div>

        <form onSubmit={handleCheckinSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-[#EDE8DB] font-semibold mb-1 uppercase text-[11px]">
              1. What key operations did you execute or ship today? *
            </label>
            <textarea
              rows={2}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="e.g. Audited enclave charge-dump circuitry, pushed firmware commit v1.4..."
              className="w-full bg-[#0C0E11] border border-[#2D3440] p-2.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-[#EDE8DB] font-semibold mb-1 uppercase text-[11px]">
              2. What is your next tactical objective?
            </label>
            <input
              type="text"
              value={workingOnNext}
              onChange={(e) => setWorkingOnNext(e.target.value)}
              placeholder="e.g. Enter Vault B for hardware root of trust ceremony..."
              className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#EDE8DB] font-semibold mb-1 uppercase text-[11px]">
                3. Any blockers, dependencies, or access limitations?
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. None, or Need Jax physical key"
                className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
              />
            </div>

            <div>
              <label className="block text-[#EDE8DB] font-semibold mb-1 uppercase text-[11px]">
                4. Operational Velocity / Mood
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['⚡ Hyper', '🟢 Good', '🟡 Grinding', '🔴 Blocked'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`py-1.5 text-[11px] border patch-chamfer-sm transition-colors ${
                      mood === m
                        ? 'bg-[#E5B869] text-[#0B0C0E] font-bold border-[#E5B869]'
                        : 'bg-[#0C0E11] border-[#2B313B] text-[#EDE8DB]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#242930] flex items-center justify-between">
            <span className="text-[#5EBA7D] font-bold text-xs">
              {isSubmitted && '✓ Check-in dispatched successfully to Pulse Board!'}
            </span>
            <button
              type="submit"
              className="px-5 py-2 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <Send size={13} />
              Transmit Check-in
            </button>
          </div>
        </form>
      </div>

      {/* CHRONOLOGICAL CHECK-IN STREAM */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#9E9A8E] pb-2 border-b border-[#242930]">
          Daily Check-in Transmissions ({checkins.length})
        </h3>

        <div className="space-y-3">
          {checkins.map(chk => {
            const user = users.find(u => u.id === chk.userId);
            const isBlocked = chk.blockers.toLowerCase() !== 'none' && chk.blockers.trim().length > 0;

            return (
              <div
                key={chk.id}
                className="p-3.5 bg-[#181B20] border border-[#252B35] patch-chamfer-sm font-mono text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {user && <PatchAvatar user={user} size="sm" showStatus />}
                    <span className="font-bold text-[#EDE8DB]">{user?.name}</span>
                    <span className="text-[10px] text-[#E5B869] font-mono">[{user?.callsign}]</span>
                    <span className="text-[10px] text-[#9E9A8E]">• {chk.date} @ {chk.timestamp}</span>
                  </div>

                  <span className="text-xs px-2 py-0.5 bg-[#0C0E11] border border-[#2D333F]">
                    {chk.mood}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 text-[#D8D2C2]">
                  <div>
                    <span className="text-[10px] text-[#9E9A8E] uppercase block">Shipped / Completed:</span>
                    <p className="mt-0.5">{chk.completedToday}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9E9A8E] uppercase block">Next Target:</span>
                    <p className="mt-0.5">{chk.workingOnNext || 'Open exploration'}</p>
                  </div>
                </div>

                {isBlocked && (
                  <div className="ml-8 p-2 bg-[#2E1616] border border-[#E05A47]/40 text-[#E05A47] flex items-center gap-2 patch-chamfer-sm">
                    <AlertTriangle size={13} />
                    <span>Blocker: {chk.blockers}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

