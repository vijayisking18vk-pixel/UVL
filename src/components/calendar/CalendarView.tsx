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
    team: { label: 'Team Shared', color: '#EDE8DB', border: 'border-[#EDE8DB]/50', bg: 'bg-[#1F2328]' },
    personal: { label: 'Personal Schedule', color: '#E5B869', border: 'border-[#E5B869]/50', bg: 'bg-[#292215]' },
    meeting: { label: 'Meeting', color: '#4EC5D4', border: 'border-[#4EC5D4]/50', bg: 'bg-[#152329]' },
    task_deadline: { label: 'Task Deadline', color: '#E05A47', border: 'border-[#E05A47]/50', bg: 'bg-[#291717]' }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overlay Controller */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#E5B869]">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                Team & Personal Command Calendar
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Layered multi-calendar with auto-synced meetings & task deadline telemetry.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-[#0C0E11] border border-[#2D333F] p-0.5 patch-chamfer-sm">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  viewMode === 'month'
                    ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                    : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-3 py-1 font-mono text-xs transition-colors ${
                  viewMode === 'agenda'
                    ? 'bg-[#E5B869] text-[#0B0C0E] font-bold'
                    : 'text-[#9E9A8E] hover:text-[#EDE8DB]'
                }`}
              >
                Agenda List
              </button>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
            >
              <Plus size={14} strokeWidth={3} />
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar Overlay Layer Toggles */}
        <div className="mt-4 pt-3 border-t border-[#242930] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-[#9E9A8E] flex items-center gap-1 mr-1">
              <Layers size={13} className="text-[#E5B869]" /> Overlays:
            </span>

            {(Object.keys(categoryBadges) as CalendarLayer[]).map(layerKey => {
              const active = layers[layerKey];
              const badge = categoryBadges[layerKey];
              return (
                <button
                  key={layerKey}
                  onClick={() => toggleLayer(layerKey)}
                  className={`px-2.5 py-1 font-mono text-xs border transition-all patch-chamfer-sm flex items-center gap-1.5 ${
                    active
                      ? `${badge.bg} ${badge.border} text-[#EDE8DB]`
                      : 'bg-[#0B0C0E]/40 border-[#222730] text-[#555A65] opacity-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-none"
                    style={{ backgroundColor: active ? badge.color : '#555' }}
                  />
                  <span>{badge.label}</span>
                </button>
              );
            })}
          </div>

          {/* Project & Member Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-2 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-[#0C0E11] border border-[#2D333F] text-[#EDE8DB] text-xs font-mono px-2 py-1 patch-chamfer-sm focus:outline-none focus:border-[#E5B869]"
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
        <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
          {/* Month Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
            <div className="flex items-center gap-2">
              <span className="font-patch text-xl font-bold text-[#EDE8DB] uppercase tracking-wider">
                SEPTEMBER 2026
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#1F242C] border border-[#323945] text-[#E5B869]">
                Q3 SPRINT CYCLE
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
                  className={`min-h-[105px] p-2 border transition-all cursor-pointer patch-chamfer-sm flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#181E27] border-[#4EC5D4] shadow-[0_0_8px_rgba(78,197,212,0.15)]'
                      : 'bg-[#16191E] border-[#252C36] hover:border-[#E5B869]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-mono text-xs font-bold ${
                      isToday ? 'text-[#4EC5D4] px-1 bg-[#4EC5D4]/20' : 'text-[#EDE8DB]'
                    }`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="font-mono text-[9px] text-[#9E9A8E]">
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
                          className={`px-1.5 py-0.5 text-[10px] font-mono truncate border patch-chamfer-sm ${badge.bg} ${badge.border}`}
                          style={{ color: badge.color }}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14171B] border-2 border-[#323A48] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative">
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#242930] mb-4">
              <div>
                <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase ${categoryBadges[selectedEvent.category].border}`} style={{ color: categoryBadges[selectedEvent.category].color }}>
                  {categoryBadges[selectedEvent.category].label}
                </span>
                <h3 className="font-mono text-base font-bold text-[#EDE8DB] mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs text-[#EDE8DB]">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#E5B869]" />
                <span>{selectedEvent.date} • {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#5EBA7D]" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="p-3 bg-[#0C0E11] border border-[#252B36] patch-chamfer-sm text-[#D8D2C2]">
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
                    className="w-full py-1.5 bg-[#4EC5D4]/15 hover:bg-[#4EC5D4]/25 border border-[#4EC5D4]/40 text-[#4EC5D4] font-mono text-xs patch-chamfer-sm flex items-center justify-center gap-2"
                  >
                    <Users size={13} />
                    Open Linked Meeting Notes & Action Items
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
                    className="w-full py-1.5 bg-[#E05A47]/15 hover:bg-[#E05A47]/25 border border-[#E05A47]/40 text-[#E05A47] font-mono text-xs patch-chamfer-sm flex items-center justify-center gap-2"
                  >
                    <CheckSquare size={13} />
                    View Linked Task on Task Board
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-between">
              <button
                onClick={() => {
                  deleteCalendarEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="font-mono text-xs text-[#E05A47] hover:underline"
              >
                Delete Event
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-[#252B34] hover:bg-[#323945] text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Schedule Lab Event
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Partner Review: Quantum Silicon Moat"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Overlay Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CalendarLayer)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  >
                    <option value="team">Team Shared</option>
                    <option value="personal">Personal Schedule</option>
                    <option value="meeting">War Room Meeting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  >
                    <option value="">None / General</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Location / Link</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Lab Pod 1 or Secure Jitsi"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Description & Notes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tactical details, topics to cover..."
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Confirm Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
