import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { UserStatus } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  AlertTriangle,
  Send,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  Clock,
  Timer,
  Trash2,
  Zap,
  BarChart3,
  Users
} from 'lucide-react';

export const CheckinsView: React.FC = () => {
  const {
    checkins,
    submitCheckin,
    deleteCheckin,
    users,
    currentUser,
    updateUserStatus,
    setActiveTab
  } = useWorkspace();

  // Active status form for current user
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>(currentUser.status);
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage);

  // Check-in Form State
  const [completedToday, setCompletedToday] = useState('');
  const [workingOnNext, setWorkingOnNext] = useState('');
  const [blockers, setBlockers] = useState('');
  const [mood, setMood] = useState<'⚡ Hyper' | '🟢 Good' | '🟡 Grinding' | '🔴 Blocked'>('🟢 Good');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Time & Duration Calculator State
  const now = new Date();
  const currentHoursStr = String(now.getHours()).padStart(2, '0');
  const currentMinsStr = String(now.getMinutes()).padStart(2, '0');
  const [timeCalcMode, setTimeCalcMode] = useState<'range' | 'manual'>('range');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState(`${currentHoursStr}:${currentMinsStr}`);
  const [hoursWorked, setHoursWorked] = useState<number>(8);
  const [minutesWorked, setMinutesWorked] = useState<number>(0);

  // Helper to compute duration from start and end time inputs
  const computeTimeRangeDuration = (start: string, end: string) => {
    if (!start || !end) return { hours: 0, minutes: 0, totalMinutes: 0 };
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTotal = (startH || 0) * 60 + (startM || 0);
    const endTotal = (endH || 0) * 60 + (endM || 0);
    let diff = endTotal - startTotal;
    if (diff < 0) diff += 24 * 60; // Handles shifts across midnight
    return {
      hours: Math.floor(diff / 60),
      minutes: diff % 60,
      totalMinutes: diff
    };
  };

  // Re-calculate hours and minutes automatically when range changes
  useEffect(() => {
    if (timeCalcMode === 'range') {
      const { hours, minutes } = computeTimeRangeDuration(startTime, endTime);
      setHoursWorked(hours);
      setMinutesWorked(minutes);
    }
  }, [startTime, endTime, timeCalcMode]);

  const handleSetCurrentTime = () => {
    const cur = new Date();
    const curH = String(cur.getHours()).padStart(2, '0');
    const curM = String(cur.getMinutes()).padStart(2, '0');
    setEndTime(`${curH}:${curM}`);
  };

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
      mood,
      hoursWorked: hoursWorked > 0 || minutesWorked > 0 ? hoursWorked : undefined,
      minutesWorked: hoursWorked > 0 || minutesWorked > 0 ? minutesWorked : undefined,
      startTime: timeCalcMode === 'range' ? startTime : undefined,
      endTime: timeCalcMode === 'range' ? endTime : undefined
    });

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3500);
  };

  // Aggregated Team Analytics
  const todayDate = new Date().toISOString().split('T')[0];
  const todaysCheckins = checkins.filter(c => c.date === todayDate || c.date?.startsWith(todayDate));
  const totalTeamMinutes = todaysCheckins.reduce((acc, c) => acc + ((c.hoursWorked || 0) * 60 + (c.minutesWorked || 0)), 0);
  const totalTeamHours = Math.floor(totalTeamMinutes / 60);
  const remainingTeamMinutes = totalTeamMinutes % 60;

  const avgMinutes = todaysCheckins.length > 0 ? Math.round(totalTeamMinutes / todaysCheckins.length) : 0;
  const avgHours = Math.floor(avgMinutes / 60);
  const avgRemainingMins = avgMinutes % 60;

  const activeBlockersCount = todaysCheckins.filter(
    c => c.blockers && c.blockers.toLowerCase() !== 'none' && c.blockers.trim().length > 0
  ).length;

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
            Realtime daily standup telemetry, active operator status broadcasts, and engineering hours calculation.
          </p>
        </div>
      </div>

      {/* TOP: TEAM HOURS & STANDUP METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours Worked Today */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6E6E73] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Team Time</span>
            <div className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center text-black">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-black tracking-tight flex items-baseline gap-1.5">
              <span>{totalTeamHours}h {remainingTeamMinutes}m</span>
              <span className="text-xs text-[#6E6E73] font-normal">logged today</span>
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1">
              Sum of hours & minutes across all members
            </p>
          </div>
        </div>

        {/* Operators Checked In */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6E6E73] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Standup Roster</span>
            <div className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center text-black">
              <Users size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-black tracking-tight flex items-baseline gap-1.5">
              <span>{todaysCheckins.length} / {users.length}</span>
              <span className="text-xs text-[#6E6E73] font-normal">operators</span>
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1">
              {users.length - todaysCheckins.length === 0 ? 'All operators checked in' : `${users.length - todaysCheckins.length} awaiting standup`}
            </p>
          </div>
        </div>

        {/* Average Velocity per Member */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6E6E73] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Average Shift</span>
            <div className="w-7 h-7 rounded-full bg-[#F5F5F7] flex items-center justify-center text-black">
              <BarChart3 size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-black tracking-tight flex items-baseline gap-1.5">
              <span>{avgHours}h {avgRemainingMins}m</span>
              <span className="text-xs text-[#6E6E73] font-normal">/ operator</span>
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1">
              Average duration for submitted shifts
            </p>
          </div>
        </div>

        {/* Active Blockers */}
        <div className="p-5 rounded-3xl bg-white border border-[#E5E5E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6E6E73] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Blockers</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${activeBlockersCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle size={14} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-black tracking-tight flex items-baseline gap-1.5">
              <span className={activeBlockersCount > 0 ? 'text-red-600' : 'text-emerald-600'}>
                {activeBlockersCount}
              </span>
              <span className="text-xs text-[#6E6E73] font-normal">
                {activeBlockersCount === 0 ? 'Blockers detected' : 'Require clearance'}
              </span>
            </div>
            <p className="text-[11px] text-[#6E6E73] mt-1">
              {activeBlockersCount === 0 ? 'Engineering path clear' : 'See standup stream below'}
            </p>
          </div>
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
              Member Roster & Hours.
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              {users.length} registered operators · live standup & logged duration.
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
            const hasHoursLogged = latestCheckin && (latestCheckin.hoursWorked !== undefined || latestCheckin.minutesWorked !== undefined);

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

                  {/* Latest Checkin & Calculated Hours details */}
                  {latestCheckin ? (
                    <div className="space-y-2 text-xs mt-3 pt-2.5 border-t border-[#E5E5E7]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#6E6E73]">Standup: {latestCheckin.timestamp}</span>
                        <span className="font-semibold text-black">{latestCheckin.mood}</span>
                      </div>

                      {/* Logged Hours Badge */}
                      <div className="p-2.5 bg-[#F5F5F7] rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-black font-medium">
                          <Timer size={13} className="text-[#6E6E73]" />
                          <span>
                            {hasHoursLogged
                              ? `${latestCheckin.hoursWorked || 0}h ${latestCheckin.minutesWorked ? `${latestCheckin.minutesWorked}m` : '0m'} logged`
                              : 'Standup logged'}
                          </span>
                        </div>
                        {latestCheckin.startTime && latestCheckin.endTime && (
                          <span className="text-[10px] text-[#6E6E73] font-mono">
                            {latestCheckin.startTime} → {latestCheckin.endTime}
                          </span>
                        )}
                      </div>

                      {hasBlocker && (
                        <div className="p-2.5 border border-red-200 bg-red-50 rounded-xl flex items-start gap-2 text-red-700 text-[11px]">
                          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                          <span>Blocker: {latestCheckin.blockers}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-[#E5E5E7] text-[11px] text-[#8E8E93] italic">
                      No standup submitted for today yet
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

      {/* ASYNC CHECK-IN SUBMISSION FORM WITH HOURS & MINUTES CALCULATOR */}
      <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E5E7] flex items-center justify-center text-black">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-black">
                Submit Daily Standup & Log Time.
              </h3>
              <p className="text-xs text-[#6E6E73]">
                Log your engineering operations, next tactical objective, and calculate worked hours.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCheckinSubmit} className="space-y-5 text-xs">
          {/* 1. Key operations executed */}
          <div>
            <label className="block text-black font-medium mb-1.5 text-xs">
              1. Key operations executed or shipped today *
            </label>
            <textarea
              rows={2}
              required
              value={completedToday}
              onChange={(e) => setCompletedToday(e.target.value)}
              placeholder="e.g. Optimized Supabase query caching, pushed firmware build v1.4, audited enclave memory..."
              className="w-full bg-white border border-[#E5E5E7] rounded-2xl p-3.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black resize-none shadow-2xs"
            />
          </div>

          {/* 2. Next tactical objective */}
          <div>
            <label className="block text-black font-medium mb-1.5 text-xs">
              2. Next tactical objective
            </label>
            <input
              type="text"
              value={workingOnNext}
              onChange={(e) => setWorkingOnNext(e.target.value)}
              placeholder="e.g. Conduct cryptographic root-of-trust verification and stage demo..."
              className="w-full bg-white border border-[#E5E5E7] rounded-2xl px-3.5 py-2.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black shadow-2xs"
            />
          </div>

          {/* 3. HOURS & MINUTES TIME CALCULATOR */}
          <div className="p-4 sm:p-5 bg-white border border-[#E5E5E7] rounded-2xl space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E5E7]">
              <div className="flex items-center gap-2">
                <Timer size={15} className="text-black" />
                <span className="font-semibold text-black text-xs">
                  3. Time Worked Calculator (Hours & Minutes)
                </span>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-xl border border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setTimeCalcMode('range')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    timeCalcMode === 'range'
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-[#6E6E73] hover:text-black'
                  }`}
                >
                  Start → End Clock
                </button>
                <button
                  type="button"
                  onClick={() => setTimeCalcMode('manual')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    timeCalcMode === 'manual'
                      ? 'bg-black text-white shadow-2xs'
                      : 'text-[#6E6E73] hover:text-black'
                  }`}
                >
                  Direct Duration
                </button>
              </div>
            </div>

            {timeCalcMode === 'range' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[#6E6E73] text-[11px] font-medium mb-1">
                      Start Time (Clock In)
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black font-mono focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[#6E6E73] text-[11px] font-medium mb-1">
                      End Time (Clock Out / Current)
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black font-mono focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleSetCurrentTime}
                      className="w-full py-2 px-3 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-black hover:text-white text-xs text-black font-medium transition-all cursor-pointer"
                      title="Set end time to current time"
                    >
                      Set to Now
                    </button>
                  </div>
                </div>

                {/* Live Calculated Duration Pill */}
                <div className="p-3 bg-black text-white rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    <span>Calculated Duration:</span>
                    <strong className="text-sm font-semibold tracking-wide">
                      {hoursWorked} hrs {minutesWorked} mins
                    </strong>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({(hoursWorked * 60) + minutesWorked} total minutes)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#6E6E73] text-[11px] font-medium mb-1">
                      Hours Worked
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        value={hoursWorked}
                        onChange={(e) => setHoursWorked(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black font-mono focus:outline-none focus:border-black"
                      />
                      <span className="text-xs text-[#6E6E73]">hrs</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#6E6E73] text-[11px] font-medium mb-1">
                      Minutes Worked
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={minutesWorked}
                        onChange={(e) => setMinutesWorked(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3 py-2 text-xs text-black font-mono focus:outline-none focus:border-black"
                      />
                      <span className="text-xs text-[#6E6E73]">mins</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-[#6E6E73] text-[10px] font-medium uppercase tracking-wider mb-1.5">
                    Quick Duration Presets:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '2 hrs', h: 2, m: 0 },
                      { label: '4 hrs (Half Shift)', h: 4, m: 0 },
                      { label: '6 hrs', h: 6, m: 0 },
                      { label: '8 hrs (Full Day)', h: 8, m: 0 },
                      { label: '10 hrs (Sprint)', h: 10, m: 0 },
                      { label: '12 hrs (War Room)', h: 12, m: 0 }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setHoursWorked(preset.h);
                          setMinutesWorked(preset.m);
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                          hoursWorked === preset.h && minutesWorked === preset.m
                            ? 'bg-black text-white border-black font-medium shadow-2xs'
                            : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5E7] hover:text-black hover:border-black/30'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Calculated Duration Pill */}
                <div className="p-3 bg-black text-white rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-emerald-400" />
                    <span>Duration Selected:</span>
                    <strong className="text-sm font-semibold tracking-wide">
                      {hoursWorked} hrs {minutesWorked} mins
                    </strong>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ({(hoursWorked * 60) + minutesWorked} total minutes)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Blockers & 5. Mood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-black font-medium mb-1.5 text-xs">
                4. Blockers, dependencies, or access limitations
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. None, or Waiting on hardware enclave keys..."
                className="w-full bg-white border border-[#E5E5E7] rounded-2xl px-3.5 py-2.5 text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-black font-medium mb-1.5 text-xs">
                5. Operational velocity / mood
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
                  <span>Standup & {hoursWorked}h {minutesWorked}m logged and synchronized!</span>
                </span>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black hover:bg-black/90 text-white rounded-full text-xs font-medium flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Send size={13} />
              <span>Transmit Standup ({hoursWorked}h {minutesWorked}m)</span>
            </button>
          </div>
        </form>
      </div>

      {/* CHRONOLOGICAL CHECK-IN STREAM */}
      <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
          <div>
            <h3 className="font-serif text-xl font-normal text-black">
              Daily Check-in Transmissions.
            </h3>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              {checkins.length} recorded today · {totalTeamHours}h {remainingTeamMinutes}m total engineering logged.
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {checkins.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73]">
              No check-ins logged for today yet. Use the transmitter above to post your status and calculate your work hours.
            </div>
          ) : (
            checkins.map(ci => {
              const author = users.find(u => u.id === ci.userId);
              const hasHours = ci.hoursWorked !== undefined || ci.minutesWorked !== undefined;

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
                      {/* Logged Hours Badge */}
                      {hasHours && (
                        <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-medium flex items-center gap-1 shadow-2xs">
                          <Timer size={11} className="text-emerald-400" />
                          <span>{ci.hoursWorked || 0}h {ci.minutesWorked ? `${ci.minutesWorked}m` : '0m'}</span>
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#E5E5E7] text-black text-[10px] font-medium">
                        {ci.mood}
                      </span>
                      <span className="text-[10px] text-[#8E8E93]">
                        {ci.timestamp}
                      </span>

                      {/* Delete checkin button */}
                      <button
                        onClick={() => {
                          if (confirm('Delete this standup record?')) {
                            deleteCheckin(ci.id);
                          }
                        }}
                        className="p-1 text-[#8E8E93] hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete check-in"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#6E6E73] block mb-1">
                        Completed today:
                      </span>
                      <p className="text-black leading-relaxed">{ci.completedToday}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#6E6E73] block mb-1">
                        Working on next:
                      </span>
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
