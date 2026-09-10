import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CalendarEvent, CalendarLayer } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckSquare,
  Users,
  Layers,
  X,
  Radio
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    addCalendarEvent,
    deleteCalendarEvent,
    users,
    projects,
    currentUser,
    setActiveTab
  } = useWorkspace();

  // Layer filters
  const [layers, setLayers] = useState<Record<CalendarLayer, boolean>>({
    team: true,
    personal: true,
    meeting: true,
    task_deadline: true
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Month navigation: using September 2026 as base
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 0-indexed (8 = September)
  const currentYear = 2026;

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-09-15');
  const [newStartTime, setNewStartTime] = useState('11:00');
  const [newEndTime, setNewEndTime] = useState('12:00');
  const [newCategory, setNewCategory] = useState<CalendarLayer>('team');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newLocation, setNewLocation] = useState('Lab Room 01');
  const [newDescription, setNewDescription] = useState('');

  const toggleLayer = (layer: CalendarLayer) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Filter events based on active layers, project, and member
  const filteredEvents = calendarEvents.filter(ev => {
    if (!layers[ev.category]) return false;
    if (selectedProjectId !== 'all' && ev.projectId && ev.projectId !== selectedProjectId) return false;
    if (selectedMemberId !== 'all') {
      if (ev.memberId && ev.memberId !== selectedMemberId) return false;
      if (ev.attendeeIds && !ev.attendeeIds.includes(selectedMemberId)) return false;
    }
    return true;
  });

  // Days in month calculation for September 2026
  const daysInMonth = 30;
  const firstDayIndex = 2; // Sept 1, 2026 is Tuesday (0: Sun, 1: Mon, 2: Tue)
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - firstDayIndex + 1;
    if (dayNum > 0 && dayNum <= daysInMonth) {
      return dayNum;
    }
    return null;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCalendarEvent({
      title: newTitle,
      description: newDescription,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      category: newCategory,
      projectId: newProjectId || undefined,
      memberId: newCategory === 'personal' ? currentUser.id : undefined,
      location: newLocation
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddOpen(false);
  };

  const categoryBadges: Record<CalendarLayer, { label: string; color: string; border: string; bg: string }> = {
    team: { label: 'Team Shared', color: '#FFFFFF', border: 'border-white/40', bg: 'bg-black' },
    personal: { label: 'Personal Schedule', color: '#A1A1AA', border: 'border-[#A1A1AA]/60', bg: 'bg-black' },
    meeting: { label: 'Meeting', color: '#FFFFFF', border: 'border-white/60', bg: 'bg-black' },
    task_deadline: { label: 'Task Deadline', color: '#A1A1AA', border: 'border-[#A1A1AA]/80', bg: 'bg-black' }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Overlay Controller */}
      <div className="border-b border-white/20 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 micro-label text-white/60">
              <span className="w-1.5 h-1.5 bg-[#A1A1AA]" />
              <span>Index</span>
              <span>/</span>
              <span>Schedule</span>
              <span>/</span>
              <span className="meta-number text-white">Calendar Operations</span>
            </div>
            <h1 className="headline-section font-bold tracking-tight text-white">
              Command Calendar.
            </h1>
            <p className="body-text text-xs text-white/70 max-w-xl">
              Layered team and personal schedules, auto-synced meeting rooms, and real-time task milestone deadlines.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-white/20 px-2 py-1">
              <button
                onClick={() => setViewMode('month')}
                className={`micro-label transition-colors cursor-pointer ${
                  viewMode === 'month'
                    ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Month Grid /
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`micro-label transition-colors cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'text-white font-bold underline underline-offset-4 decoration-[#A1A1AA] decoration-2'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Agenda List /
              </button>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Schedule Event /</span>
            </button>
          </div>
        </div>

        {/* Calendar Overlay Layer Toggles */}
        <div className="mt-6 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="micro-label text-white/50 flex items-center gap-1.5 mr-1">
              <Layers size={13} className="text-[#A1A1AA]" /> Layers:
            </span>

            {(Object.keys(categoryBadges) as CalendarLayer[]).map(layerKey => {
              const active = layers[layerKey];
              const badge = categoryBadges[layerKey];
              return (
                <button
                  key={layerKey}
                  onClick={() => toggleLayer(layerKey)}
                  className={`px-2.5 py-1 text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? `${badge.border} text-white font-semibold bg-white/5`
                      : 'border-white/10 text-white/40'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5"
                    style={{ backgroundColor: active ? badge.color : '#555' }}
                  />
                  <span className="micro-label">{badge.label}</span>
                </button>
              );
            })}
          </div>

          {/* Project & Member Filter Dropdowns */}
          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-black border border-white/30 text-white text-xs px-2.5 py-1 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-black border border-white/30 text-white text-xs px-2.5 py-1 focus:outline-none focus:border-[#A1A1AA]"
            >
              <option value="all">All Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.callsign})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-[#000000] border border-white/20 p-6">
          {/* Month Navigator */}
          <div className="flex items-center justify-between pb-4 border-b border-white/20 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white tracking-tight">
                SEPTEMBER 2026
              </span>
              <span className="meta-number text-[10px] px-2 py-0.5 border border-white/20 text-[#A1A1AA]">
                /SPRINT·CYCLE·03
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentMonth(prev => Math.max(0, prev - 1))}
                className="p-1.5 bg-[#1B1F26] hover:bg-[#252B34] border border-[#323945] text-[#EDE8DB] patch-chamfer-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentMonth(prev => prev + 1)}
                className="p-1.5 bg-[#1B1F26] hover:bg-[#252B34] border border-[#323945] text-[#EDE8DB] patch-chamfer-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="font-mono text-xs text-[#9E9A8E] py-1 border-b border-[#20252D]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayNum, idx) => {
              if (!dayNum) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[105px] bg-[#0C0E11]/40 border border-dashed border-[#1D2128] opacity-20 patch-chamfer-sm"
                  />
                );
              }

              const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const dateStr = `2026-09-${formattedDay}`;
              const dayEvents = filteredEvents.filter(e => e.date === dateStr);
              const isToday = dateStr === '2026-09-10';

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setNewDate(dateStr);
                    setIsAddOpen(true);
                  }}
                  className={`min-h-[105px] p-2.5 border transition-colors cursor-pointer flex flex-col justify-between ${
                    isToday
                      ? 'bg-white/5 border-[#A1A1AA]'
                      : 'bg-black border-white/20 hover:border-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`meta-number text-xs font-bold ${
                      isToday ? 'text-[#A1A1AA] px-1 bg-[#A1A1AA]/10' : 'text-white'
                    }`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="meta-number text-[9px] text-white/50">
                        {dayEvents.length} ev
                      </span>
                    )}
                  </div>

                  {/* Event Badges inside Cell */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => {
                      const badge = categoryBadges[ev.category];
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] meta-number truncate border ${badge.border} text-white hover:border-[#A1A1AA]`}
                          title={`${ev.title} (${ev.startTime})`}
                        >
                          {ev.startTime} {ev.title}
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-mono text-[#9E9A8E] text-right">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#242930]">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#EDE8DB]">
              Synchronized Agenda Feed ({filteredEvents.length} events)
            </h3>
          </div>

          <div className="space-y-3">
            {filteredEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
              const badge = categoryBadges[ev.category];
              const project = projects.find(p => p.id === ev.projectId);
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-3.5 border patch-chamfer-sm cursor-pointer transition-all hover:translate-x-1 ${badge.bg} ${badge.border} flex flex-col md:flex-row md:items-center justify-between gap-3`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.2 border uppercase font-mono font-bold ${badge.border}`} style={{ color: badge.color }}>
                        {badge.label}
                      </span>
                      {project && (
                        <span className="font-mono text-[10px] text-[#9E9A8E] border border-[#323945] px-1.5 py-0.2">
                          {project.code}
                        </span>
                      )}
                      <span className="font-mono text-xs text-[#EDE8DB] font-bold">
                        {ev.date}
                      </span>
                    </div>

                    <h4 className="font-mono text-sm font-semibold text-[#EDE8DB]">
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="font-mono text-xs text-[#9E9A8E] max-w-2xl">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-[#EDE8DB] block">
                        {ev.startTime} - {ev.endTime}
                      </span>
                      {ev.location && (
                        <span className="font-mono text-[10px] text-[#9E9A8E] flex items-center gap-1 justify-end mt-0.5">
                          <MapPin size={10} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#000000] text-white border border-white/40 max-w-lg w-full p-6 relative">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-white/20 mb-4">
              <div>
                <span className={`meta-number text-[10px] px-2 py-0.5 border uppercase ${categoryBadges[selectedEvent.category].border}`} style={{ color: categoryBadges[selectedEvent.category].color }}>
                  /{categoryBadges[selectedEvent.category].label}
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-white">
              <div className="flex items-center gap-2 meta-number">
                <Clock size={14} className="text-[#A1A1AA]" />
                <span>{selectedEvent.date} • {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 micro-label">
                  <MapPin size={14} className="text-[#A1A1AA]" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="p-3 border border-white/20 text-white/80">
                  {selectedEvent.description}
                </div>
              )}

              {selectedEvent.sourceMeetingId && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setActiveTab('meetings');
                    }}
                    className="w-full py-2 border border-white/30 hover:border-[#A1A1AA] text-[#A1A1AA] text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Users size={13} />
                    Open Linked Meeting Notes & Action Items /
                  </button>
                </div>
              )}

              {selectedEvent.sourceTaskId && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setActiveTab('tasks');
                    }}
                    className="w-full py-2 border border-white/30 hover:border-[#A1A1AA] text-white text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckSquare size={13} />
                    View Linked Task on Task Board /
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-between">
              <button
                onClick={() => {
                  deleteCalendarEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="text-xs text-white/60 hover:text-[#A1A1AA] cursor-pointer"
              >
                Delete Event /
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-white text-black hover:bg-[#A1A1AA] hover:text-black text-xs font-semibold cursor-pointer"
              >
                Close /
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#000000] text-white border border-white/40 max-w-lg w-full p-6 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
              <h3 className="text-base font-bold text-white uppercase">
                Schedule Event
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block micro-label text-white/60 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Partner Review: Quantum Silicon Moat"
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block micro-label text-white/60 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
                <div>
                  <label className="block micro-label text-white/60 mb-1">Overlay Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CalendarLayer)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    <option value="team">Team Shared</option>
                    <option value="personal">Personal Schedule</option>
                    <option value="meeting">War Room Meeting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block micro-label text-white/60 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
                <div>
                  <label className="block micro-label text-white/60 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block micro-label text-white/60 mb-1">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    <option value="">None / General</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block micro-label text-white/60 mb-1">Location / Link</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Lab Pod 1 or Secure Jitsi"
                    className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              <div>
                <label className="block micro-label text-white/60 mb-1">Description & Notes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tactical details, topics to cover..."
                  className="w-full bg-black border border-white/30 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#A1A1AA] resize-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-white/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 border border-white/20 hover:border-white text-white/70 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-xs font-semibold cursor-pointer"
              >
                Confirm Event /
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
