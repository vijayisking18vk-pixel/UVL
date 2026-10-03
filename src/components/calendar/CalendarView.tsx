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

  // Dynamic date helpers
  const today = new Date();
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();

  // Dynamic Month & Year Navigation
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-indexed (0: Jan ... 9: Oct ... 11: Dec)

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState<string>(() => todayStr);
  const [newStartTime, setNewStartTime] = useState('11:00');
  const [newEndTime, setNewEndTime] = useState('12:00');
  const [newCategory, setNewCategory] = useState<CalendarLayer>('team');
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id || '');
  const [newLocation, setNewLocation] = useState('Lab Room 01');
  const [newDescription, setNewDescription] = useState('');

  const toggleLayer = (layer: CalendarLayer) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  // Accurate days in month calculation for the active month & year
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const totalSlots = (firstDayOfWeek + daysInCurrentMonth > 35) ? 42 : 35;

  interface CalendarCell {
    dayNum: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
    isToday: boolean;
  }

  const calendarCells: CalendarCell[] = [];

  // 1. Previous month trailing days
  for (let i = 0; i < firstDayOfWeek; i++) {
    const day = daysInPrevMonth - firstDayOfWeek + i + 1;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: day,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: day,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

  // 3. Next month leading days
  const remaining = totalSlots - calendarCells.length;
  for (let day = 1; day <= remaining; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dayNum: day,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dateStr,
      isToday: dateStr === todayStr
    });
  }

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
    team: { label: 'Team Shared', color: '#000000', border: 'border-[#E5E5E7]', bg: 'bg-[#F5F5F7]' },
    personal: { label: 'Personal Schedule', color: '#6E6E73', border: 'border-[#E5E5E7]', bg: 'bg-[#F5F5F7]' },
    meeting: { label: 'Meeting', color: '#000000', border: 'border-[#E5E5E7]', bg: 'bg-[#F5F5F7]' },
    task_deadline: { label: 'Task Deadline', color: '#000000', border: 'border-[#E5E5E7]', bg: 'bg-[#F5F5F7]' }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Top Header & Overlay Controller */}
      <div className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[11px] font-medium tracking-widest uppercase text-[#6E6E73] mb-3 flex items-center gap-2">
              <span>Operations</span>
              <span>/</span>
              <span className="text-black">Schedule</span>
              <span>/</span>
              <span>Calendar</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-black">
              Command calendar.
            </h1>
            <p className="text-[#6E6E73] text-sm max-w-xl">
              Layered team and personal schedules, auto-synced meeting rooms, and real-time task milestone deadlines.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Month Grid
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  viewMode === 'agenda'
                    ? 'bg-white text-black shadow-xs font-semibold'
                    : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Agenda List
              </button>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium transition-all shadow-xs"
            >
              <Plus size={15} />
              <span>Schedule Event</span>
            </button>
          </div>
        </div>

        {/* Calendar Overlay Layer Toggles */}
        <div className="mt-6 pt-4 border-t border-[#E5E5E7] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[#6E6E73] uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Layers size={13} className="text-[#6E6E73]" /> Layers:
            </span>

            {(Object.keys(categoryBadges) as CalendarLayer[]).map(layerKey => {
              const active = layers[layerKey];
              const badge = categoryBadges[layerKey];
              return (
                <button
                  key={layerKey}
                  onClick={() => toggleLayer(layerKey)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'border-black bg-black text-white font-medium'
                      : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73] hover:text-black hover:border-black'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: active ? '#FFFFFF' : '#6E6E73' }}
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
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3.5 py-1.5 focus:bg-white focus:outline-none focus:border-black transition-all"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
              ))}
            </select>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-[#F5F5F7] border border-[#E5E5E7] text-black text-xs rounded-full px-3.5 py-1.5 focus:bg-white focus:outline-none focus:border-black transition-all"
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
        <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 shadow-xs">
          {/* Month Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E7] mb-6 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-serif font-medium text-black tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-[#6E6E73] font-semibold uppercase tracking-wider">
                Q{Math.floor(currentMonth / 3) + 1} • Sprint Cycle 0{((currentMonth % 3) + 1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-xs font-medium text-black transition-all cursor-pointer shadow-2xs hover:border-black"
              >
                Today
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-full bg-white border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-xs font-semibold text-[#6E6E73] py-1 border-b border-[#E5E5E7]">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {calendarCells.map((cell) => {
              const dayEvents = filteredEvents.filter(e => e.date === cell.dateStr);

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    setNewDate(cell.dateStr);
                    setIsAddOpen(true);
                  }}
                  className={`min-h-[110px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    cell.isToday
                      ? 'bg-white border-black ring-1 ring-black shadow-xs'
                      : cell.isCurrentMonth
                      ? 'bg-white border-[#E5E5E7] hover:border-black/30'
                      : 'bg-white/40 border-[#E5E5E7]/60 opacity-60 hover:opacity-100 hover:border-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${
                      cell.isToday
                        ? 'w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-black'
                        : 'text-[#8E8E93]'
                    }`}>
                      {cell.dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-[#6E6E73] font-medium font-mono">
                        {dayEvents.length} ev
                      </span>
                    )}
                  </div>

                  {/* Event Badges inside Cell */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => {
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className="px-2 py-1 text-[10px] rounded-lg truncate border border-[#E5E5E7] bg-[#F5F5F7] text-black font-medium hover:border-black transition-colors"
                          title={`${ev.title} (${ev.startTime})`}
                        >
                          {ev.startTime} {ev.title}
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-[#6E6E73] text-right font-medium">
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
        <div className="bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black">
              Synchronized Agenda Feed ({filteredEvents.length} events)
            </h3>
          </div>

          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6E6E73] bg-white rounded-2xl border border-dashed border-[#E5E5E7]">
                No events found matching the active layers and filters.
              </div>
            ) : (
              filteredEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => {
              const badge = categoryBadges[ev.category];
              const project = projects.find(p => p.id === ev.projectId);
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-4 rounded-2xl border border-[#E5E5E7] bg-white cursor-pointer transition-all hover:border-black/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] uppercase font-semibold text-black">
                        {badge.label}
                      </span>
                      {project && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73] font-medium">
                          {project.code}
                        </span>
                      )}
                      <span className="text-xs text-black font-semibold">
                        {ev.date}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-black">
                      {ev.title}
                    </h4>

                    {ev.description && (
                      <p className="text-xs text-[#6E6E73] max-w-2xl">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-black block">
                        {ev.startTime} - {ev.endTime}
                      </span>
                      {ev.location && (
                        <span className="text-[11px] text-[#6E6E73] flex items-center gap-1 justify-end mt-0.5">
                          <MapPin size={11} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 relative">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E5E7] mb-4">
              <div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] uppercase font-semibold text-black">
                  {categoryBadges[selectedEvent.category].label}
                </span>
                <h3 className="text-xl font-serif font-medium text-black mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-black">
              <div className="flex items-center gap-2 font-medium">
                <Clock size={15} className="text-[#6E6E73]" />
                <span>{selectedEvent.date} • {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-[#6E6E73]">
                  <MapPin size={15} className="text-[#6E6E73]" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] text-black">
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
                    className="w-full py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] rounded-full text-black text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Users size={14} />
                    <span>Open Linked Meeting Notes & Action Items</span>
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
                    className="w-full py-2.5 border border-[#E5E5E7] hover:bg-[#F5F5F7] rounded-full text-black text-xs font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckSquare size={14} />
                    <span>View Linked Task on Task Board</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E5E7] flex items-center justify-between">
              <button
                onClick={() => {
                  deleteCalendarEvent(selectedEvent.id);
                  setSelectedEvent(null);
                }}
                className="text-xs text-[#6E6E73] hover:text-red-500 transition-colors"
              >
                Delete Event
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-full transition-all shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white text-black border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] mb-4">
              <div>
                <h3 className="text-xl font-serif font-medium text-black">
                  Schedule Event.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Add an operational meeting, deadline, or milestone.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Partner Review: Quantum Silicon Moat"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Overlay Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CalendarLayer)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="team">Team Shared</option>
                    <option value="personal">Personal Schedule</option>
                    <option value="meeting">War Room Meeting</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Linked Project</label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    <option value="">None / General</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code}: {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Location / Link</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Lab Pod 1 or Secure Link"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6E6E73] text-[11px] font-medium uppercase tracking-wider mb-1.5">Description & Notes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tactical details, topics to cover..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-medium transition-all shadow-xs"
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
