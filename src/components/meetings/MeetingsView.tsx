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
    <div className="space-y-12 pb-16">
      {/* Editorial Header Section */}
      <section className="border-b border-white/20 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-mono tracking-widest uppercase text-white/50 mb-3 flex items-center gap-2">
              <span>operations</span>
              <span>/</span>
              <span className="text-[#A1A1AA]">war rooms & briefings</span>
              <span>/</span>
              <span>live dispatch</span>
            </div>
            <h1 className="headline-section text-white font-bold tracking-tight">
              War room & briefings.
            </h1>
            <p className="text-white/60 text-sm mt-2 max-w-xl">
              Agenda planning, live collaborative notes, and one-click action item to task conversions.
            </p>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium text-xs tracking-wide transition-all uppercase"
          >
            <Plus size={14} />
            <span>Schedule war room</span>
          </button>
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Scheduled Sessions List */}
        <div className="lg:col-span-4 border border-white/20 bg-black p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/20 text-xs font-mono text-white/50 uppercase tracking-wider">
            <span>Sessions ({meetings.length})</span>
            <span className="text-[#A1A1AA]">Synchronized</span>
          </div>

          <div className="space-y-3">
            {meetings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/20 bg-black font-mono text-xs text-white/40">
                No scheduled war rooms. Click "Schedule war room" to convene a session.
              </div>
            ) : (
              meetings.map(m => {
                const isActive = m.id === activeMeetingId;
                const pendingActions = m.actionItems.filter(ai => !ai.convertedToTaskId).length;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveMeetingId(m.id)}
                    className={`p-4 border cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#A1A1AA] bg-white text-black'
                        : 'border-white/20 bg-black text-white hover:border-white/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[11px] font-mono font-bold flex items-center gap-1.5 ${isActive ? 'text-[#A1A1AA]' : 'text-[#A1A1AA]'}`}>
                        <Calendar size={12} /> {m.date}
                      </span>
                      <span className={`text-[11px] font-mono ${isActive ? 'text-black/60' : 'text-white/40'}`}>
                        {m.time} ({m.duration})
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold tracking-tight mb-3 ${isActive ? 'text-black' : 'text-white'}`}>
                      {m.title}
                    </h4>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-current/10">
                      <div className="flex items-center -space-x-1">
                        {m.attendeeIds.slice(0, 4).map(uid => {
                          const user = users.find(u => u.id === uid);
                          return user ? (
                            <PatchAvatar key={uid} user={user} size="sm" />
                          ) : null;
                        })}
                      </div>

                      {pendingActions > 0 && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                          isActive
                            ? 'border-[#A1A1AA] text-[#A1A1AA] bg-[#A1A1AA]/10'
                            : 'border-[#A1A1AA]/60 text-[#A1A1AA] bg-[#A1A1AA]/10'
                        }`}>
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
            <div className="border border-white/20 bg-black p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-white/20">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#A1A1AA] text-white uppercase font-bold tracking-wider">
                      Briefing dossier
                    </span>
                    <span className="text-xs font-mono text-white/50 flex items-center gap-1">
                      <Clock size={12} /> {activeMeeting.date} @ {activeMeeting.time} ({activeMeeting.duration})
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {activeMeeting.title}
                  </h2>
                </div>

                {activeMeeting.link && (
                  <a
                    href={activeMeeting.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-white text-white text-xs font-mono uppercase tracking-wider transition-colors self-start"
                  >
                    <ExternalLink size={13} />
                    <span>Join room link</span>
                  </a>
                )}
              </div>

              {/* Attendees and Agenda Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendees */}
                <div className="p-4 border border-white/20 bg-black">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block mb-3">
                    Confirmed attendees ({activeMeeting.attendeeIds.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeMeeting.attendeeIds.map(uid => {
                      const attendee = users.find(u => u.id === uid);
                      return attendee ? (
                        <div key={uid} className="flex items-center gap-2 px-2.5 py-1.5 border border-white/20 bg-black">
                          <PatchAvatar user={attendee} size="sm" />
                          <span className="text-xs font-medium text-white">{attendee.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Agenda Items */}
                <div className="p-4 border border-white/20 bg-black">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 block mb-3">
                    Agenda protocol
                  </span>
                  <ul className="space-y-2 text-xs font-mono text-white/80">
                    {activeMeeting.agenda.map((ag, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#A1A1AA] font-bold">0{i + 1}.</span>
                        <span>{ag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Collaborative Notes Markdown Editor */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
                    <FileText size={14} className="text-[#A1A1AA]" />
                    Collaborative briefing notes
                  </span>
                  <span className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-wider">
                    ● Live sync to Supabase
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={activeMeeting.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Record discussions, decisions, and tactical notes..."
                  className="w-full bg-black border border-white/20 p-4 font-mono text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-y leading-relaxed"
                />
              </div>

              {/* ACTION ITEMS ENGINE */}
              <div className="pt-6 border-t border-white/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#A1A1AA]" />
                    <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                      Action items engine ({activeMeeting.actionItems.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">
                    Auto-converts into real tasks and calendar events
                  </span>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {activeMeeting.actionItems.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-white/20 bg-black font-mono text-xs text-white/40">
                      No action items logged. Add one below to dispatch directly into the task backlog.
                    </div>
                  ) : (
                    activeMeeting.actionItems.map(ai => {
                      const assignee = users.find(u => u.id === ai.assignedTo);
                      const isConverted = Boolean(ai.convertedToTaskId);
                      return (
                        <div
                          key={ai.id}
                          className="p-3.5 border border-white/20 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            {isConverted ? (
                              <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5 sm:mt-0" />
                            ) : (
                              <div className="w-4 h-4 border border-[#A1A1AA] text-[#A1A1AA] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 sm:mt-0">
                                !
                              </div>
                            )}
                            <div>
                              <span className={`text-xs ${isConverted ? 'text-white/40 line-through' : 'text-white font-medium'}`}>
                                {ai.text}
                              </span>
                              <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-white/50">
                                <span>Assigned: {assignee?.name || 'Unassigned'}</span>
                                <span>/</span>
                                <span>Due: {ai.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isConverted ? (
                              <button
                                onClick={() => setActiveTab('tasks')}
                                className="px-3 py-1 border border-white/20 text-white/60 text-[11px] font-mono hover:border-white hover:text-white transition-colors"
                              >
                                View task #{ai.convertedToTaskId}
                              </button>
                            ) : (
                              <button
                                onClick={() => convertActionItemToTask(activeMeeting.id, ai.id)}
                                className="px-3 py-1.5 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold text-[11px] font-medium font-mono uppercase tracking-wide flex items-center gap-1.5 transition-all"
                              >
                                <ListTodo size={12} /> Convert to task
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
                  className="bg-black p-3.5 border border-white/20 flex flex-col md:flex-row items-stretch gap-2 font-mono text-xs"
                >
                  <input
                    type="text"
                    required
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="New action item description..."
                    className="flex-1 bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                  />

                  <select
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                    className="bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />

                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-black hover:bg-[#A1A1AA] hover:text-black text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
                  >
                    + Add item
                  </button>
                </form>
              </div>

            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-16 text-center border border-dashed border-white/20 bg-black font-mono space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">No session selected</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Select a briefing from the list or schedule a new one to view meeting agendas and take notes.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE WAR ROOM MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-black border border-white/40 max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#A1A1AA]" />
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                  Schedule war room
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Session topic *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Series-A Deal Evaluation"
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-black border border-white/20 px-2 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-black border border-white/20 px-2 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
                <div>
                  <label className="block text-white/50 mb-1 uppercase text-[10px]">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60 min"
                    className="w-full bg-black border border-white/20 px-2 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                  />
                </div>
              </div>

              {/* Attendee Selection */}
              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Attendees</label>
                <div className="grid grid-cols-2 gap-2 border border-white/20 p-3 bg-black">
                  {users.map(u => {
                    const isSelected = newAttendees.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleAttendeeSelection(u.id)}
                        className={`p-2 flex items-center gap-2 cursor-pointer border ${
                          isSelected ? 'border-[#A1A1AA] bg-white text-black font-bold' : 'border-white/10 text-white/70'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly className="accent-[#A1A1AA]" />
                        <span className="text-xs truncate">{u.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Agenda items (1 per line)</label>
                <textarea
                  rows={3}
                  value={newAgendaStr}
                  onChange={(e) => setNewAgendaStr(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-[#A1A1AA] resize-none"
                />
              </div>

              <div>
                <label className="block text-white/50 mb-1 uppercase text-[10px]">Virtual room link</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-white focus:outline-none focus:border-[#A1A1AA]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/20 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-4 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#A1A1AA] hover:bg-[#D4D4D8] text-black font-semibold font-medium uppercase tracking-wider transition-colors"
              >
                Confirm session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
