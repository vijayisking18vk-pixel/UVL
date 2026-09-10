import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Meeting, ActionItem } from '../../types';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  ListTodo,
  CheckCircle2,
  FileText,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const MeetingsView: React.FC = () => {
  const {
    meetings,
    addMeeting,
    updateMeeting,
    convertActionItemToTask,
    users,
    currentUser,
    setActiveTab
  } = useWorkspace();

  const [activeMeetingId, setActiveMeetingId] = useState<string>(meetings[0]?.id || '');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // New Meeting Form
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-09-17');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newDuration, setNewDuration] = useState('60 min');
  const [newAttendees, setNewAttendees] = useState<string[]>([currentUser.id]);
  const [newAgendaStr, setNewAgendaStr] = useState('Key milestones\nTechnical blockers\nAction assignments');
  const [newLink, setNewLink] = useState('https://meet.unfoundedlab.internal/room/briefing');

  // Action Item Quick Add in active meeting
  const [actionText, setActionText] = useState('');
  const [actionAssignee, setActionAssignee] = useState(currentUser.id);
  const [actionDue, setActionDue] = useState('2026-09-18');

  const activeMeeting = meetings.find(m => m.id === activeMeetingId) || meetings[0];

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const agenda = newAgendaStr
      .split('\n')
      .map(a => a.trim())
      .filter(Boolean);

    const created = addMeeting({
      title: newTitle,
      date: newDate,
      time: newTime,
      duration: newDuration,
      attendeeIds: newAttendees,
      agenda,
      notes: `### Tactical dossier: ${newTitle}\n\n- Briefing notes initialized on ${newDate}.\n- Agenda aligned. Action items listed below.`,
      actionItems: [],
      link: newLink
    });

    setNewTitle('');
    setIsScheduleOpen(false);
    setActiveMeetingId(created.id);
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionText.trim() || !activeMeeting) return;

    const newItem: ActionItem = {
      id: `ai-${Date.now().toString().slice(-4)}`,
      text: actionText.trim(),
      assignedTo: actionAssignee,
      dueDate: actionDue
    };

    const updated: Meeting = {
      ...activeMeeting,
      actionItems: [...activeMeeting.actionItems, newItem]
    };

    updateMeeting(updated);
    setActionText('');
  };

  const handleNotesChange = (newNotes: string) => {
    if (!activeMeeting) return;
    updateMeeting({
      ...activeMeeting,
      notes: newNotes
    });
  };

  const toggleAttendeeSelection = (userId: string) => {
    setNewAttendees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Editorial Header Section */}
      <section className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-medium tracking-widest uppercase text-[#6E6E73] mb-3 flex items-center gap-2">
              <span>Operations</span>
              <span>/</span>
              <span className="text-black">War Rooms & Briefings</span>
              <span>/</span>
              <span>Live Dispatch</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-black">
              War room & briefings.
            </h1>
            <p className="text-[#6E6E73] text-sm mt-2 max-w-xl">
              Agenda planning, live collaborative notes, and one-click action item to task conversions.
            </p>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-medium text-xs rounded-full transition-all shadow-xs"
          >
            <Plus size={15} />
            <span>Schedule War Room</span>
          </button>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scheduled Sessions List */}
        <div className="lg:col-span-4 bg-[#F5F5F7] border border-[#E5E5E7] rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7] text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
            <span>Sessions ({meetings.length})</span>
            <span className="text-black">Synchronized</span>
          </div>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-white text-xs text-[#6E6E73]">
                No scheduled war rooms. Click "Schedule War Room" to convene a session.
              </div>
            ) : (
              meetings.map(m => {
                const isActive = m.id === activeMeetingId;
                const pendingActions = m.actionItems.filter(ai => !ai.convertedToTaskId).length;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveMeetingId(m.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                      isActive
                        ? 'border-black bg-white shadow-sm text-black'
                        : 'border-[#E5E5E7] bg-white text-black hover:border-black/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-black flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#6E6E73]" /> {m.date}
                      </span>
                      <span className="text-xs text-[#6E6E73]">
                        {m.time} ({m.duration})
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold tracking-tight mb-3 text-black">
                      {m.title}
                    </h4>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E5E7]">
                      <div className="flex items-center -space-x-1.5">
                        {m.attendeeIds.slice(0, 4).map(uid => {
                          const user = users.find(u => u.id === uid);
                          return user ? (
                            <PatchAvatar key={uid} user={user} size="sm" />
                          ) : null;
                        })}
                      </div>

                      {pendingActions > 0 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                          {pendingActions} action item{pendingActions > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Meeting Dossier & Collaborative Notes */}
        {activeMeeting ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Session Top Card */}
            <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[#E5E5E7]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2.5 py-0.5 bg-black text-white rounded-full uppercase font-medium tracking-wider">
                      Briefing Dossier
                    </span>
                    <span className="text-xs text-[#6E6E73] flex items-center gap-1 font-medium">
                      <Clock size={13} /> {activeMeeting.date} @ {activeMeeting.time} ({activeMeeting.duration})
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-black">
                    {activeMeeting.title}
                  </h2>
                </div>

                {activeMeeting.link && (
                  <a
                    href={activeMeeting.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium rounded-full transition-all self-start"
                  >
                    <ExternalLink size={13} />
                    <span>Join Room</span>
                  </a>
                )}
              </div>

              {/* Attendees and Agenda Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendees */}
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-3">
                    Confirmed Attendees ({activeMeeting.attendeeIds.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeMeeting.attendeeIds.map(uid => {
                      const attendee = users.find(u => u.id === uid);
                      return attendee ? (
                        <div key={uid} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-white shadow-2xs">
                          <PatchAvatar user={attendee} size="sm" />
                          <span className="text-xs font-medium text-black">{attendee.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Agenda Items */}
                <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] block mb-3">
                    Agenda Protocol
                  </span>
                  <ul className="space-y-2 text-xs text-black">
                    {activeMeeting.agenda.map((ag, i) => (
                      <li key={i} className="flex items-start gap-2 font-medium">
                        <span className="text-[#6E6E73]">0{i + 1}.</span>
                        <span>{ag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Collaborative Notes Markdown Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-black flex items-center gap-2">
                    <FileText size={15} className="text-[#6E6E73]" />
                    Collaborative Briefing Notes
                  </span>
                  <span className="text-[10px] text-[#6E6E73] uppercase tracking-wider font-medium">
                    ● Live sync to Supabase
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={activeMeeting.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Record discussions, decisions, and tactical notes..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-2xl p-4 text-xs text-black placeholder-[#6E6E73] focus:bg-white focus:outline-none focus:border-black transition-all resize-y leading-relaxed"
                />
              </div>

              {/* ACTION ITEMS ENGINE */}
              <div className="pt-6 border-t border-[#E5E5E7] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-black" />
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-black">
                      Action Items Engine ({activeMeeting.actionItems.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#6E6E73]">
                    Auto-converts into real tasks and calendar events
                  </span>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {activeMeeting.actionItems.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-[#E5E5E7] bg-[#F5F5F7] text-xs text-[#6E6E73]">
                      No action items logged. Add one below to dispatch directly into the task backlog.
                    </div>
                  ) : (
                    activeMeeting.actionItems.map(ai => {
                      const assignee = users.find(u => u.id === ai.assignedTo);
                      const isConverted = Boolean(ai.convertedToTaskId);
                      return (
                        <div
                          key={ai.id}
                          className="p-3.5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            {isConverted ? (
                              <CheckCircle2 size={16} className="text-black shrink-0 mt-0.5 sm:mt-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-black bg-white text-black flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 sm:mt-0">
                                !
                              </div>
                            )}
                            <div>
                              <span className={`text-xs ${isConverted ? 'text-[#6E6E73] line-through' : 'text-black font-medium'}`}>
                                {ai.text}
                              </span>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6E6E73]">
                                <span>Assigned: {assignee?.name || 'Unassigned'}</span>
                                <span>•</span>
                                <span>Due: {ai.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isConverted ? (
                              <button
                                onClick={() => setActiveTab('tasks')}
                                className="px-3 py-1 border border-[#E5E5E7] bg-white text-[#6E6E73] rounded-full text-xs hover:text-black transition-colors"
                              >
                                View Task #{ai.convertedToTaskId}
                              </button>
                            ) : (
                              <button
                                onClick={() => convertActionItemToTask(activeMeeting.id, ai.id)}
                                className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-full text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-xs"
                              >
                                <ListTodo size={12} /> Convert to Task
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Action Item Inline Form */}
                <form
                  onSubmit={handleAddActionItem}
                  className="bg-[#F5F5F7] p-3.5 rounded-2xl border border-[#E5E5E7] flex flex-col md:flex-row items-stretch gap-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="New action item description..."
                    className="flex-1 bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black"
                  />

                  <select
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-black focus:outline-none focus:border-black"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                    className="bg-white border border-[#E5E5E7] rounded-xl px-3 py-2 text-black focus:outline-none focus:border-black"
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 bg-black text-white hover:bg-neutral-800 rounded-full text-xs font-medium transition-all shadow-xs whitespace-nowrap"
                  >
                    + Add Item
                  </button>
                </form>
              </div>

            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-16 text-center rounded-3xl border border-dashed border-[#E5E5E7] bg-[#F5F5F7] space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-black">No session selected</h3>
            <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
              Select a briefing from the list or schedule a new one to view meeting agendas and take notes.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE WAR ROOM MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-white border border-[#E5E5E7] shadow-2xl rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto text-black"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E7]">
              <div>
                <h3 className="text-xl font-serif font-medium tracking-tight text-black">
                  Schedule War Room.
                </h3>
                <p className="text-xs text-[#6E6E73] mt-0.5">Convene an executive sync or tactical briefing.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-[#6E6E73] hover:text-black p-1.5 rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Session Topic *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Series-A Deal Evaluation"
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-2 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-2 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60 min"
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-2 py-2 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Attendee Selection */}
              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Attendees</label>
                <div className="grid grid-cols-2 gap-2 border border-[#E5E5E7] rounded-2xl p-3 bg-[#F5F5F7]">
                  {users.map(u => {
                    const isSelected = newAttendees.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleAttendeeSelection(u.id)}
                        className={`p-2.5 rounded-xl flex items-center gap-2 cursor-pointer border transition-all ${
                          isSelected ? 'border-black bg-white text-black font-medium shadow-xs' : 'border-[#E5E5E7] bg-[#F5F5F7] text-[#6E6E73]'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly className="accent-black rounded" />
                        <span className="text-xs truncate">{u.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Agenda Items (1 per line)</label>
                <textarea
                  rows={3}
                  value={newAgendaStr}
                  onChange={(e) => setNewAgendaStr(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black placeholder-[#6E6E73] focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[#6E6E73] mb-1.5 uppercase text-[11px] font-medium tracking-wider">Virtual Room Link</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2.5 text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-black rounded-full hover:bg-[#F5F5F7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full font-medium transition-all shadow-xs"
              >
                Confirm Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
