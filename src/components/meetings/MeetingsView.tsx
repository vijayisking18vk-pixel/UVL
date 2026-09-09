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
  Send,
  X,
  Sparkles,
  ChevronRight
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
      notes: `### Tactical Dossier: ${newTitle}\n\n- Briefing notes initialized on ${newDate}.\n- Agenda aligned. Action items listed below.`,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1F242C] border border-[#3A4250] flex items-center justify-center patch-chamfer-sm text-[#4EC5D4]">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-patch text-2xl font-bold tracking-wider text-[#EDE8DB] uppercase">
                War Room & Meeting Operations
              </h2>
              <p className="font-mono text-xs text-[#9E9A8E]">
                Agenda planning, live collaborative notes, and 1-click action item to task conversions.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold transition-transform active:scale-95 patch-chamfer-sm shadow-sm"
          >
            <Plus size={14} strokeWidth={3} />
            Schedule War Room
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Meeting Directory */}
        <div className="lg:col-span-4 bg-[#14171B] border border-[#2A303A] p-4 patch-chamfer-md shadow-md space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#242930]">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#9E9A8E]">
              Scheduled Sessions ({meetings.length})
            </h3>
          </div>

          <div className="space-y-2">
            {meetings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#262C36] bg-[#0C0E11] font-mono text-xs text-[#9E9A8E]">
                No scheduled sessions. Click "Schedule War Room" to convene a session.
              </div>
            ) : (
              meetings.map(m => {
              const isActive = m.id === activeMeetingId;
              const pendingActions = m.actionItems.filter(ai => !ai.convertedToTaskId).length;
              return (
                <div
                  key={m.id}
                  onClick={() => setActiveMeetingId(m.id)}
                  className={`p-3 border patch-chamfer-sm cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#1A222B] border-[#4EC5D4] shadow-md'
                      : 'bg-[#181B20] border-[#252B35] hover:border-[#E5B869]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] text-[#4EC5D4] font-bold flex items-center gap-1">
                      <Calendar size={11} /> {m.date}
                    </span>
                    <span className="font-mono text-[10px] text-[#9E9A8E]">
                      {m.time} ({m.duration})
                    </span>
                  </div>

                  <h4 className="font-mono text-xs font-semibold text-[#EDE8DB] leading-snug">
                    {m.title}
                  </h4>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center -space-x-1.5">
                      {m.attendeeIds.slice(0, 4).map(uid => {
                        const user = users.find(u => u.id === uid);
                        return user ? (
                          <PatchAvatar key={uid} user={user} size="sm" />
                        ) : null;
                      })}
                    </div>

                    {pendingActions > 0 && (
                      <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#E5B869]/20 border border-[#E5B869]/40 text-[#E5B869]">
                        {pendingActions} Action Items
                      </span>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Right Column: Active Meeting Dossier & Collaborative Notes */}
        {activeMeeting ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Active Meeting Card */}
            <div className="bg-[#14171B] border border-[#2A303A] p-5 patch-chamfer-md shadow-md space-y-4">
              {/* Header Details */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#242930]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#4EC5D4] font-bold px-2 py-0.5 bg-[#4EC5D4]/10 border border-[#4EC5D4]/30">
                      WAR ROOM DOSSIER
                    </span>
                    <span className="font-mono text-xs text-[#9E9A8E] flex items-center gap-1">
                      <Clock size={12} /> {activeMeeting.date} @ {activeMeeting.time} ({activeMeeting.duration})
                    </span>
                  </div>
                  <h3 className="font-patch text-2xl font-bold uppercase tracking-wide text-[#EDE8DB]">
                    {activeMeeting.title}
                  </h3>
                </div>

                {activeMeeting.link && (
                  <a
                    href={activeMeeting.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#3A4250] text-[#EDE8DB] font-mono text-xs patch-chamfer-sm self-start"
                  >
                    <ExternalLink size={13} />
                    Secure Video Feed
                  </a>
                )}
              </div>

              {/* Attendees & Agenda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendees */}
                <div className="p-3 bg-[#0C0E11] border border-[#232832] patch-chamfer-sm">
                  <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block mb-2">
                    Confirmed Attendees ({activeMeeting.attendeeIds.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeMeeting.attendeeIds.map(uid => {
                      const attendee = users.find(u => u.id === uid);
                      return attendee ? (
                        <div key={uid} className="flex items-center gap-1.5 px-2 py-1 bg-[#16191D] border border-[#2B313B]">
                          <PatchAvatar user={attendee} size="sm" />
                          <span className="font-mono text-xs text-[#EDE8DB]">{attendee.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Agenda Items */}
                <div className="p-3 bg-[#0C0E11] border border-[#232832] patch-chamfer-sm">
                  <span className="font-mono text-[10px] text-[#9E9A8E] uppercase block mb-2">
                    Agenda Protocol
                  </span>
                  <ul className="space-y-1 font-mono text-xs text-[#D8D2C2]">
                    {activeMeeting.agenda.map((ag, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#E5B869] font-bold">0{i + 1}.</span>
                        <span>{ag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Collaborative Notes Markdown Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDE8DB] flex items-center gap-1.5">
                    <FileText size={14} className="text-[#E5B869]" />
                    Collaborative Notes & Briefing (Auto-Saved)
                  </span>
                  <span className="font-mono text-[10px] text-[#5EBA7D]">
                    ● LIVE SYNC
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={activeMeeting.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Record discussions, decisions, and notes here..."
                  className="w-full bg-[#0C0E11] border border-[#2C333F] p-3 font-mono text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-y leading-relaxed"
                />
              </div>

              {/* ACTION ITEMS CONVERSION ENGINE */}
              <div className="pt-4 border-t border-[#242930] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-[#E5B869]" />
                    <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#EDE8DB]">
                      Action Items Engine ({activeMeeting.actionItems.length})
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-[#9E9A8E]">
                    1-Click Auto-converts to Tasks & Calendar Deadlines
                  </span>
                </div>

                {/* Action Items List */}
                <div className="space-y-2">
                  {activeMeeting.actionItems.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-[#242A33] bg-[#0C0E11] font-mono text-xs text-[#9E9A8E]">
                      No action items created yet. Add one below to dispatch into the task system.
                    </div>
                  ) : (
                    activeMeeting.actionItems.map(ai => {
                      const assignee = users.find(u => u.id === ai.assignedTo);
                      const isConverted = Boolean(ai.convertedToTaskId);
                      return (
                        <div
                          key={ai.id}
                          className="p-2.5 bg-[#171A1F] border border-[#2B323D] patch-chamfer-sm flex items-center justify-between gap-3 font-mono text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {isConverted ? (
                              <CheckCircle2 size={16} className="text-[#5EBA7D]" />
                            ) : (
                              <div className="w-4 h-4 border border-[#E5B869] flex items-center justify-center text-[10px] text-[#E5B869]">
                                !
                              </div>
                            )}
                            <div>
                              <span className={`text-xs ${isConverted ? 'text-[#D8D2C2]' : 'text-[#EDE8DB] font-semibold'}`}>
                                {ai.text}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#9E9A8E]">
                                <span>Assigned: {assignee?.name || 'Unassigned'}</span>
                                <span>• Due: {ai.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isConverted ? (
                              <button
                                onClick={() => setActiveTab('tasks')}
                                className="px-2.5 py-1 bg-[#5EBA7D]/15 border border-[#5EBA7D]/40 text-[#5EBA7D] text-[10px] font-mono patch-chamfer-sm hover:underline"
                              >
                                ✓ Converted (Task #{ai.convertedToTaskId})
                              </button>
                            ) : (
                              <button
                                onClick={() => convertActionItemToTask(activeMeeting.id, ai.id)}
                                className="px-3 py-1 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] text-[10px] font-bold font-mono patch-chamfer-sm flex items-center gap-1 shadow-sm transition-transform active:scale-95"
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
                  className="bg-[#0C0E11] p-3 border border-[#242A33] patch-chamfer-sm flex flex-col md:flex-row items-center gap-2"
                >
                  <input
                    type="text"
                    required
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    placeholder="New action item description..."
                    className="flex-1 w-full bg-[#14171B] border border-[#2D333F] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm font-mono"
                  />

                  <select
                    value={actionAssignee}
                    onChange={(e) => setActionAssignee(e.target.value)}
                    className="w-full md:w-36 bg-[#14171B] border border-[#2D333F] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm font-mono"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={actionDue}
                    onChange={(e) => setActionDue(e.target.value)}
                    className="w-full md:w-36 bg-[#14171B] border border-[#2D333F] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm font-mono"
                  />

                  <button
                    type="submit"
                    className="w-full md:w-auto px-4 py-1.5 bg-[#1F242C] hover:bg-[#2A313C] border border-[#3A4250] text-[#EDE8DB] text-xs font-mono font-semibold patch-chamfer-sm whitespace-nowrap"
                  >
                    + Add Item
                  </button>
                </form>
              </div>

            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-16 text-center border border-dashed border-[#2A303A] bg-[#14171B] patch-chamfer-md space-y-3 font-mono">
            <div className="w-12 h-12 mx-auto bg-[#1F242C] border border-[#3A4250] flex items-center justify-center text-[#9E9A8E] patch-chamfer-sm">
              <Users size={22} />
            </div>
            <h4 className="text-sm font-bold text-[#EDE8DB] uppercase">No War Room Briefings</h4>
            <p className="text-xs text-[#9E9A8E] max-w-sm mx-auto">
              No operational sessions scheduled. Click "Schedule War Room" to create agendas and action items.
            </p>
          </div>
        )}
      </div>

      {/* SCHEDULE WAR ROOM MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleScheduleSubmit}
            className="bg-[#14171B] border-2 border-[#323A48] max-w-lg w-full p-5 patch-chamfer-md shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute inset-[3px] border border-dashed border-[#EDE8DB]/20 pointer-events-none patch-chamfer-md" />

            <div className="flex items-center justify-between pb-3 border-b border-[#242930] mb-4">
              <h3 className="font-patch text-xl font-bold uppercase tracking-wider text-[#EDE8DB]">
                Schedule War Room Session
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="p-1 hover:bg-[#20252C] text-[#9E9A8E] hover:text-[#EDE8DB]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Meeting Topic *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Series-A Deal Evaluation: NeuralMesh"
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Date *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Time</label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
                <div>
                  <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Duration</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="60 min"
                    className="w-full bg-[#0C0E11] border border-[#2D3440] px-2 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                  />
                </div>
              </div>

              {/* Attendee Selection */}
              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Select Attendees</label>
                <div className="grid grid-cols-2 gap-2 bg-[#0C0E11] p-2 border border-[#242A33] patch-chamfer-sm">
                  {users.map(u => {
                    const isSelected = newAttendees.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleAttendeeSelection(u.id)}
                        className={`p-1.5 flex items-center gap-2 cursor-pointer border ${
                          isSelected ? 'bg-[#1E252E] border-[#4EC5D4] text-[#EDE8DB]' : 'border-transparent text-[#9E9A8E]'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} readOnly className="accent-[#4EC5D4]" />
                        <span className="text-xs truncate">{u.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Agenda Items (1 per line)</label>
                <textarea
                  rows={3}
                  value={newAgendaStr}
                  onChange={(e) => setNewAgendaStr(e.target.value)}
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] focus:outline-none focus:border-[#E5B869] patch-chamfer-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-[#9E9A8E] mb-1 uppercase text-[10px]">Virtual Room URL</label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full bg-[#0C0E11] border border-[#2D3440] px-3 py-1.5 text-xs text-[#EDE8DB] patch-chamfer-sm"
                />
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#242930] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="px-3 py-1.5 bg-[#1F242C] hover:bg-[#282F3B] text-[#9E9A8E] hover:text-[#EDE8DB] font-mono text-xs patch-chamfer-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#E5B869] hover:bg-[#F0C57A] text-[#0B0C0E] font-mono text-xs font-bold patch-chamfer-sm"
              >
                Confirm War Room
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

