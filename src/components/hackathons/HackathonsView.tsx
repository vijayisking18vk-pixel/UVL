import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  HackathonEvent,
  HackathonStatus,
  EventType
} from '../../types';
import { uploadToStorage } from '../../lib/supabase';
import { sound } from '../../utils/sound';
import { PatchAvatar } from '../common/PatchAvatar';
import {
  Trophy,
  Calendar,
  MapPin,
  ExternalLink,
  GitBranch,
  Plus,
  Search,
  Filter,
  Paperclip,
  Pencil,
  Trash2,
  Download,
  UploadCloud,
  CheckCircle2,
  X,
  FileText,
  Link2,
  Users,
  Award,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react';

const EVENT_TYPES: EventType[] = [
  'Hackathon',
  'Demo Day',
  'Pitch Competition',
  'Conference',
  'Grant Program',
  'Accelerator'
];

const EVENT_STATUSES: { id: HackathonStatus; label: string; bg: string; text: string; border: string }[] = [
  { id: 'Upcoming', label: 'Upcoming', bg: 'bg-[#F5F5F7]', text: 'text-[#6E6E73]', border: 'border-[#E5E5E7]' },
  { id: 'Registered', label: 'Registered', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { id: 'In Progress', label: 'In Progress', bg: 'bg-neutral-900', text: 'text-white', border: 'border-black' },
  { id: 'Submitted', label: 'Submitted', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { id: 'Finalist', label: 'Finalist', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { id: 'Winner', label: 'Winner 🏆', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300' },
  { id: 'Completed', label: 'Completed', bg: 'bg-[#F5F5F7]', text: 'text-black', border: 'border-[#E5E5E7]' }
];

export const HackathonsView: React.FC = () => {
  const {
    hackathons,
    addHackathon,
    updateHackathon,
    deleteHackathon,
    updateHackathonRemarks,
    addHackathonAttachment,
    deleteHackathonAttachment,
    users,
    currentUser
  } = useWorkspace();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Active Inspector / Selection
  const [selectedEvent, setSelectedEvent] = useState<HackathonEvent | null>(hackathons[0] || null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  // Form State: Add Event
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('Hackathon');
  const [organizer, setOrganizer] = useState('');
  const [location, setLocation] = useState('Online / Virtual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [status, setStatus] = useState<HackathonStatus>('Registered');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [awardPrize, setAwardPrize] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([currentUser.id]);
  const [remarks, setRemarks] = useState('');

  // Form State: Edit Event
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<EventType>('Hackathon');
  const [editOrganizer, setEditOrganizer] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<HackathonStatus>('Registered');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editDemoUrl, setEditDemoUrl] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');
  const [editPresentationUrl, setEditPresentationUrl] = useState('');
  const [editAwardPrize, setEditAwardPrize] = useState('');
  const [editParticipantIds, setEditParticipantIds] = useState<string[]>([]);
  const [editRemarks, setEditRemarks] = useState('');

  // Form State: Attachment
  const [attachMode, setAttachMode] = useState<'file' | 'link'>('file');
  const [attachName, setAttachName] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline Remarks Editing
  const [isEditingRemarksInline, setIsEditingRemarksInline] = useState(false);
  const [inlineRemarksText, setInlineRemarksText] = useState('');

  // Metrics
  const totalTracked = hackathons.length;
  const totalWinners = hackathons.filter(h => h.status === 'Winner').length;
  const totalFinalists = hackathons.filter(h => h.status === 'Finalist').length;
  const totalActive = hackathons.filter(h => h.status === 'In Progress' || h.status === 'Registered' || h.status === 'Submitted').length;

  // Filtered Events
  const filteredEvents = hackathons.filter(ev => {
    if (selectedStatusFilter !== 'all' && ev.status !== selectedStatusFilter) return false;
    if (selectedTypeFilter !== 'all' && ev.type !== selectedTypeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        ev.organizer.toLowerCase().includes(q) ||
        ev.projectName.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        (ev.remarks && ev.remarks.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Open Edit Modal
  const openEditModal = (ev: HackathonEvent) => {
    sound.click();
    setSelectedEvent(ev);
    setEditTitle(ev.title);
    setEditType(ev.type);
    setEditOrganizer(ev.organizer);
    setEditLocation(ev.location);
    setEditStartDate(ev.startDate);
    setEditEndDate(ev.endDate);
    setEditStatus(ev.status);
    setEditProjectName(ev.projectName);
    setEditProjectDescription(ev.projectDescription);
    setEditDemoUrl(ev.demoUrl || '');
    setEditRepoUrl(ev.repoUrl || '');
    setEditPresentationUrl(ev.presentationUrl || '');
    setEditAwardPrize(ev.awardPrize || '');
    setEditParticipantIds(ev.participantIds || []);
    setEditRemarks(ev.remarks || '');
    setIsEditOpen(true);
  };

  // Open Attachment Modal
  const openAttachModal = (ev: HackathonEvent) => {
    sound.click();
    setSelectedEvent(ev);
    setAttachName('');
    setAttachUrl('');
    setAttachFile(null);
    setAttachMode('file');
    setIsAttachOpen(true);
  };

  // Submit Add Event
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectName.trim()) {
      alert('Please enter event title and project name.');
      return;
    }

    const created = addHackathon({
      title: title.trim(),
      type,
      organizer: organizer.trim() || 'Circuit Host',
      location: location.trim() || 'Online',
      startDate,
      endDate,
      status,
      projectName: projectName.trim(),
      projectDescription: projectDescription.trim(),
      demoUrl: demoUrl.trim() || undefined,
      repoUrl: repoUrl.trim() || undefined,
      presentationUrl: presentationUrl.trim() || undefined,
      awardPrize: awardPrize.trim() || undefined,
      participantIds: participantIds.length > 0 ? participantIds : [currentUser.id],
      remarks: remarks.trim()
    });

    setSelectedEvent(created);
    setIsAddOpen(false);

    // Reset
    setTitle('');
    setOrganizer('');
    setProjectName('');
    setProjectDescription('');
    setDemoUrl('');
    setRepoUrl('');
    setPresentationUrl('');
    setAwardPrize('');
    setRemarks('');
  };

  // Submit Edit Event
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !editTitle.trim() || !editProjectName.trim()) {
      alert('Please enter event title and project name.');
      return;
    }

    const updated: HackathonEvent = {
      ...selectedEvent,
      title: editTitle.trim(),
      type: editType,
      organizer: editOrganizer.trim() || 'Circuit Host',
      location: editLocation.trim() || 'Online',
      startDate: editStartDate,
      endDate: editEndDate,
      status: editStatus,
      projectName: editProjectName.trim(),
      projectDescription: editProjectDescription.trim(),
      demoUrl: editDemoUrl.trim() || undefined,
      repoUrl: editRepoUrl.trim() || undefined,
      presentationUrl: editPresentationUrl.trim() || undefined,
      awardPrize: editAwardPrize.trim() || undefined,
      participantIds: editParticipantIds,
      remarks: editRemarks.trim()
    };

    updateHackathon(updated);
    setSelectedEvent(updated);
    setIsEditOpen(false);
  };

  // Submit Attachment
  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (attachMode === 'file' && !attachFile) {
      alert('Please select a file to attach.');
      return;
    }
    if (attachMode === 'link' && !attachUrl.trim()) {
      alert('Please enter an attachment URL.');
      return;
    }

    let finalUrl = attachUrl.trim();
    if (attachMode === 'file' && attachFile) {
      setIsUploading(true);
      try {
        const uploadPath = `hackathons/${Date.now()}-${attachFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { url } = await uploadToStorage(attachFile, uploadPath, attachFile.type);
        finalUrl = url;
      } catch (err) {
        console.error('Storage upload error:', err);
        finalUrl = URL.createObjectURL(attachFile);
      } finally {
        setIsUploading(false);
      }
    }

    await addHackathonAttachment(selectedEvent.id, {
      name: attachName.trim() || (attachMode === 'file' ? attachFile?.name : 'Resource Link') || 'Attachment',
      url: finalUrl,
      type: attachMode === 'link' ? 'link' : (attachFile?.type || 'document')
    });

    const refreshed = hackathons.find(h => h.id === selectedEvent.id);
    if (refreshed) setSelectedEvent(refreshed);

    setIsAttachOpen(false);
    setAttachName('');
    setAttachUrl('');
    setAttachFile(null);
  };

  // Save Inline Remarks
  const handleSaveInlineRemarks = () => {
    sound.patchStamp();
    if (!selectedEvent) return;
    updateHackathonRemarks(selectedEvent.id, inlineRemarksText.trim());
    const updated = {
      ...selectedEvent,
      remarks: inlineRemarksText.trim()
    };
    setSelectedEvent(updated);
    setIsEditingRemarksInline(false);
  };

  // Delete Event
  const handleDeleteEvent = (eventId: string) => {
    if (!confirm('Are you sure you want to remove this event record?')) return;
    sound.click();
    deleteHackathon(eventId);
    if (selectedEvent?.id === eventId) {
      const remaining = hackathons.filter(h => h.id !== eventId);
      setSelectedEvent(remaining[0] || null);
    }
    setIsEditOpen(false);
  };

  // Delete Attachment
  const handleDeleteAttachment = (attachmentId: string) => {
    if (!selectedEvent) return;
    sound.click();
    deleteHackathonAttachment(selectedEvent.id, attachmentId);
    const updated = {
      ...selectedEvent,
      attachments: (selectedEvent.attachments || []).filter(a => a.id !== attachmentId)
    };
    setSelectedEvent(updated);
  };

  const getStatusBadge = (st: HackathonStatus) => {
    const s = EVENT_STATUSES.find(item => item.id === st) || EVENT_STATUSES[0];
    return (
      <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-medium border ${s.bg} ${s.text} ${s.border}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Editorial Header */}
      <div className="border-b border-[#E5E5E7] pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">
                Autonomous Track • Competitive Circuit
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-black tracking-tight">
              Hackathons & Events.
            </h1>
            <p className="text-[#6E6E73] text-sm sm:text-base max-w-2xl mt-2 leading-relaxed font-sans">
              Track hackathons, demo days, prize winnings, prototypes submitted, team rosters, and strategic judge feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.click();
                setIsAddOpen(true);
              }}
              className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-full flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Add Event / Hackathon</span>
            </button>
          </div>
        </div>

        {/* Minimalist Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
            <span className="text-[11px] text-[#6E6E73] uppercase font-semibold">Total Tracked</span>
            <div className="font-serif text-2xl text-black">{totalTracked}</div>
            <span className="text-[10px] text-[#6E6E73]">Recorded circuit events</span>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
            <span className="text-[11px] text-[#6E6E73] uppercase font-semibold">Winners & Finalists</span>
            <div className="font-serif text-2xl text-black flex items-center gap-1.5">
              <span>{totalWinners + totalFinalists}</span>
              {(totalWinners > 0) && <span className="text-xs text-amber-600 font-sans">({totalWinners} 🏆)</span>}
            </div>
            <span className="text-[10px] text-[#6E6E73]">Podium & finalist ranks</span>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
            <span className="text-[11px] text-[#6E6E73] uppercase font-semibold">Active Submissions</span>
            <div className="font-serif text-2xl text-black">{totalActive}</div>
            <span className="text-[10px] text-[#6E6E73]">In preparation or under review</span>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-1">
            <span className="text-[11px] text-[#6E6E73] uppercase font-semibold">Verified Operators</span>
            <div className="font-serif text-2xl text-black">{users.length}</div>
            <span className="text-[10px] text-[#6E6E73]">Active participating roster</span>
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
            <input
              type="text"
              placeholder="Search hackathons, projects, prizes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs text-black placeholder-[#8E8E93] focus:outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs text-black focus:outline-none focus:border-black transition-all"
          >
            <option value="all">All Statuses</option>
            {EVENT_STATUSES.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs text-black focus:outline-none focus:border-black transition-all"
          >
            <option value="all">All Event Types</option>
            {EVENT_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs font-medium self-end sm:self-auto">
          <button
            onClick={() => { sound.click(); setViewMode('table'); }}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => { sound.click(); setViewMode('cards'); }}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
            }`}
          >
            Card Showcase
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredEvents.length === 0 ? (
        /* Empty State (Zero Mock Data Clean Baseline) */
        <div className="p-12 sm:p-16 border border-[#E5E5E7] bg-[#F5F5F7] rounded-3xl text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full border border-[#E5E5E7] bg-white mx-auto flex items-center justify-center shadow-xs">
            <Trophy size={24} className="text-black" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-normal text-black">No Hackathons or Events Recorded.</h3>
            <p className="text-xs text-[#6E6E73] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Track competitions, demo days, and hackathons your team participates in. Log prototypes built, prize winnings, and strategic remarks.
            </p>
          </div>
          <button
            onClick={() => {
              sound.click();
              setIsAddOpen(true);
            }}
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-full inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={13} />
            <span>+ Track First Hackathon or Event</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="border border-[#E5E5E7] bg-white rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E7] bg-[#F5F5F7] text-[11px] text-[#6E6E73] uppercase font-semibold">
                  <th className="py-3.5 px-4">Event & Type</th>
                  <th className="py-3.5 px-4">Organizer & Dates</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Project Built</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4">Prize / Award</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  <th className="py-3.5 px-4">Docs</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E7]">
                {filteredEvents.map(ev => {
                  const participants = users.filter(u => ev.participantIds?.includes(u.id));
                  const isSelected = selectedEvent?.id === ev.id;

                  return (
                    <tr
                      key={ev.id}
                      onClick={() => {
                        sound.click();
                        setSelectedEvent(ev);
                      }}
                      className={`hover:bg-[#F5F5F7] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#F5F5F7]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-black flex items-center gap-1.5">
                          <span>{ev.title}</span>
                          {ev.status === 'Winner' && <span title="Winner">🏆</span>}
                        </div>
                        <span className="text-[10px] uppercase font-medium text-[#6E6E73] block mt-0.5">
                          {ev.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#6E6E73]">
                        <div className="text-black font-medium">{ev.organizer}</div>
                        <span className="text-[10px] font-mono block mt-0.5">
                          {ev.startDate} → {ev.endDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(ev.status)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-black">{ev.projectName}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {ev.demoUrl && (
                            <a
                              href={ev.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] text-black hover:underline flex items-center gap-0.5"
                              title="View Demo"
                            >
                              <ExternalLink size={10} />
                              <span>Demo</span>
                            </a>
                          )}
                          {ev.repoUrl && (
                            <a
                              href={ev.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-[10px] text-black hover:underline flex items-center gap-0.5"
                              title="View GitHub"
                            >
                              <GitBranch size={10} />
                              <span>Code</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center -space-x-1.5">
                          {participants.map(p => (
                            <div key={p.id} title={p.name}>
                              <PatchAvatar user={p} size="sm" />
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {ev.awardPrize ? (
                          <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {ev.awardPrize}
                          </span>
                        ) : (
                          <span className="text-[#8E8E93]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <span className="text-xs text-[#6E6E73] line-clamp-1" title={ev.remarks}>
                          {ev.remarks || 'Click to add remarks'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-[#6E6E73] font-medium flex items-center gap-1">
                          <Paperclip size={12} />
                          <span>{ev.attachments?.length || 0}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              openEditModal(ev);
                            }}
                            className="p-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-[#6E6E73] hover:text-black transition-all cursor-pointer"
                            title="Edit Event & Remarks"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              openAttachModal(ev);
                            }}
                            className="p-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-[#6E6E73] hover:text-black transition-all cursor-pointer"
                            title="Attach File or Link"
                          >
                            <Paperclip size={12} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteEvent(ev.id);
                            }}
                            className="p-1.5 rounded-full border border-[#E5E5E7] hover:border-red-300 bg-white text-[#6E6E73] hover:text-red-600 transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Showcase / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(ev => {
            const participants = users.filter(u => ev.participantIds?.includes(u.id));

            return (
              <div
                key={ev.id}
                onClick={() => {
                  sound.click();
                  setSelectedEvent(ev);
                }}
                className="p-6 rounded-3xl border border-[#E5E5E7] bg-white hover:border-black/30 transition-all shadow-xs space-y-4 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#6E6E73] block">{ev.type}</span>
                      <h3 className="font-serif text-xl font-normal text-black mt-0.5 flex items-center gap-1.5">
                        <span>{ev.title}</span>
                        {ev.status === 'Winner' && <span>🏆</span>}
                      </h3>
                      <span className="text-xs text-[#6E6E73] block mt-0.5">{ev.organizer} • {ev.location}</span>
                    </div>
                    {getStatusBadge(ev.status)}
                  </div>

                  {ev.awardPrize && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                      <Trophy size={14} className="text-amber-700" />
                      <span>{ev.awardPrize}</span>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] space-y-1.5 text-xs">
                    <span className="text-[10px] text-[#6E6E73] uppercase font-semibold block">Prototype Built</span>
                    <div className="font-semibold text-black text-sm">{ev.projectName}</div>
                    {ev.projectDescription && (
                      <p className="text-[#6E6E73] line-clamp-2 leading-relaxed">{ev.projectDescription}</p>
                    )}
                  </div>

                  {/* Remarks Preview */}
                  {ev.remarks && (
                    <div className="text-xs text-[#6E6E73] bg-[#F5F5F7] p-3 rounded-xl border border-[#E5E5E7]">
                      <span className="text-[10px] font-semibold text-black uppercase block mb-1">Remarks:</span>
                      <p className="line-clamp-2 italic">{ev.remarks}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between gap-2">
                  <div className="flex items-center -space-x-1.5">
                    {participants.map(p => (
                      <div key={p.id} title={p.name}>
                        <PatchAvatar user={p} size="sm" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openAttachModal(ev);
                      }}
                      className="px-2.5 py-1 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-xs font-medium text-black flex items-center gap-1 transition-all"
                    >
                      <Paperclip size={11} />
                      <span>{ev.attachments?.length || 0}</span>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openEditModal(ev);
                      }}
                      className="px-3 py-1 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECTOR DRAWER / MODAL FOR SELECTED EVENT */}
      {selectedEvent && (
        <div className="border border-[#E5E5E7] bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E7]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Event Inspector</span>
                {getStatusBadge(selectedEvent.status)}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-black mt-1 flex items-center gap-2">
                <span>{selectedEvent.title}</span>
                {selectedEvent.status === 'Winner' && <span>🏆</span>}
              </h2>
              <span className="text-xs text-[#6E6E73] mt-0.5 block">
                {selectedEvent.organizer} • {selectedEvent.location} • {selectedEvent.startDate} to {selectedEvent.endDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openAttachModal(selectedEvent)}
                className="px-3.5 py-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-xs font-medium text-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Paperclip size={12} />
                <span>+ Attach File / Link</span>
              </button>
              <button
                onClick={() => openEditModal(selectedEvent)}
                className="px-4 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Pencil size={12} />
                <span>Edit Event</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Project Details & Links */}
            <div className="lg:col-span-7 space-y-6">
              {/* Project Card */}
              <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-black uppercase text-xs tracking-wider">Project / Solution Built</span>
                  {selectedEvent.awardPrize && (
                    <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      🏆 {selectedEvent.awardPrize}
                    </span>
                  )}
                </div>
                <h4 className="font-serif text-xl font-normal text-black">{selectedEvent.projectName}</h4>
                <p className="text-[#6E6E73] leading-relaxed">
                  {selectedEvent.projectDescription || 'No project description provided.'}
                </p>

                {/* Resource Links */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E5E5E7]">
                  {selectedEvent.demoUrl && (
                    <a
                      href={selectedEvent.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-white hover:border-black text-black text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink size={12} />
                      <span>Live Demo</span>
                    </a>
                  )}
                  {selectedEvent.repoUrl && (
                    <a
                      href={selectedEvent.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-white hover:border-black text-black text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <GitBranch size={12} />
                      <span>Source Code</span>
                    </a>
                  )}
                  {selectedEvent.presentationUrl && (
                    <a
                      href={selectedEvent.presentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-white hover:border-black text-black text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <FileText size={12} />
                      <span>Pitch Deck</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Remarks & Strategy (Click to Edit) */}
              <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-[#6E6E73]" /> Tactical Remarks & Judge Feedback
                  </span>
                  {!isEditingRemarksInline ? (
                    <button
                      onClick={() => {
                        sound.click();
                        setInlineRemarksText(selectedEvent.remarks || '');
                        setIsEditingRemarksInline(true);
                      }}
                      className="text-[11px] text-[#6E6E73] hover:text-black font-medium flex items-center gap-1 cursor-pointer"
                      title="Edit remarks inline"
                    >
                      <Pencil size={11} />
                      <span>Edit Remarks</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingRemarksInline(false)}
                        className="px-2.5 py-0.5 rounded-full border border-[#E5E5E7] bg-white text-[10px] text-[#6E6E73] hover:text-black font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveInlineRemarks}
                        className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-medium flex items-center gap-1 hover:bg-neutral-800 cursor-pointer"
                      >
                        <Check size={10} />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingRemarksInline ? (
                  <div
                    onClick={() => {
                      sound.click();
                      setInlineRemarksText(selectedEvent.remarks || '');
                      setIsEditingRemarksInline(true);
                    }}
                    className="p-3.5 bg-white rounded-xl border border-[#E5E5E7] hover:border-black/40 cursor-pointer transition-all min-h-[70px] group"
                    title="Click to edit tactical remarks"
                  >
                    {selectedEvent.remarks ? (
                      <p className="text-black leading-relaxed whitespace-pre-wrap">{selectedEvent.remarks}</p>
                    ) : (
                      <p className="text-[#8E8E93] italic flex items-center gap-1.5">
                        <Pencil size={11} className="opacity-60 group-hover:opacity-100" />
                        <span>No remarks logged yet. Click here to add mentor feedback, judge comments, or team reflections...</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      rows={4}
                      value={inlineRemarksText}
                      onChange={e => setInlineRemarksText(e.target.value)}
                      placeholder="Add judge feedback, mentor evaluations, next round actionables..."
                      className="w-full bg-white border border-black rounded-xl p-3 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black leading-relaxed resize-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-[#6E6E73]">
                      <span>Press Save to commit remarks to live storage.</span>
                      <button
                        onClick={handleSaveInlineRemarks}
                        className="px-3.5 py-1 bg-black text-white rounded-full text-xs font-medium hover:bg-neutral-800 cursor-pointer transition-all"
                      >
                        Save Remarks
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Team & Attachments Vault */}
            <div className="lg:col-span-5 space-y-6">
              {/* Team Participants */}
              <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-3 text-xs">
                <span className="font-semibold text-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Users size={13} className="text-[#6E6E73]" /> Participating Operators ({selectedEvent.participantIds?.length || 0})
                </span>
                <div className="space-y-2">
                  {users
                    .filter(u => selectedEvent.participantIds?.includes(u.id))
                    .map(u => (
                      <div key={u.id} className="p-2.5 bg-white rounded-xl border border-[#E5E5E7] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PatchAvatar user={u} size="sm" />
                          <div>
                            <span className="font-semibold text-black text-xs block">{u.name}</span>
                            <span className="text-[10px] text-[#6E6E73] font-mono">/{u.callsign}</span>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-medium text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-full border border-[#E5E5E7]">
                          Active
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Attachments Vault (Attach at any time) */}
              <div className="p-5 rounded-2xl border border-[#E5E5E7] bg-[#F5F5F7] space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-black uppercase text-xs tracking-wider flex items-center gap-1.5">
                    <Paperclip size={13} className="text-[#6E6E73]" /> Event Attachments ({selectedEvent.attachments?.length || 0})
                  </span>
                  <button
                    onClick={() => openAttachModal(selectedEvent)}
                    className="px-2.5 py-1 rounded-full border border-[#E5E5E7] hover:border-black bg-white text-xs font-medium text-black flex items-center gap-1 transition-all cursor-pointer"
                    title="Attach file or web link at any time"
                  >
                    <Plus size={12} />
                    <span>Attach</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {!selectedEvent.attachments || selectedEvent.attachments.length === 0 ? (
                    <div
                      onClick={() => openAttachModal(selectedEvent)}
                      className="p-4 border border-dashed border-[#E5E5E7] hover:border-black rounded-2xl text-center text-xs text-[#6E6E73] bg-white hover:bg-[#F5F5F7] cursor-pointer transition-all space-y-1"
                    >
                      <p className="font-medium text-black">No certificates or decks attached yet.</p>
                      <p className="text-[11px] text-[#6E6E73]">+ Click to attach certificates, pitch decks, or demo links at any time</p>
                    </div>
                  ) : (
                    selectedEvent.attachments.map(att => (
                      <div key={att.id} className="p-3 rounded-xl border border-[#E5E5E7] bg-white flex items-center justify-between gap-2">
                        <div className="truncate flex items-center gap-2">
                          <Paperclip size={13} className="text-[#6E6E73] shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold text-black truncate">{att.name}</div>
                            <span className="text-[10px] text-[#6E6E73] font-mono">{att.uploadedAt}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {att.url && (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              download={att.name}
                              className="p-1.5 rounded-full border border-[#E5E5E7] hover:border-black bg-[#F5F5F7] text-black transition-all"
                              title="Open attachment"
                            >
                              <Download size={12} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1.5 rounded-full border border-[#E5E5E7] hover:border-red-300 bg-[#F5F5F7] text-[#6E6E73] hover:text-red-600 transition-all cursor-pointer"
                            title="Delete attachment"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD EVENT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Circuit Roster</span>
                <h3 className="font-serif text-2xl font-normal text-black mt-0.5">
                  Track New Hackathon / Event
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Event Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ETHIndia 2026"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Event Category</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as EventType)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Organizer / Host</label>
                  <input
                    type="text"
                    placeholder="e.g. Devfolio / ETHGlobal"
                    value={organizer}
                    onChange={e => setOrganizer(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Location / Format</label>
                  <input
                    type="text"
                    placeholder="Bengaluru, India or Online"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as HackathonStatus)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {EVENT_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Project / Prototype Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LoopID MicroVM"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Award / Prize Won (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Place Track Winner • ₹5,00,000"
                    value={awardPrize}
                    onChange={e => setAwardPrize(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Project Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of technology built, APIs integrated, problem solved..."
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Demo / Devpost URL</label>
                  <input
                    type="url"
                    placeholder="https://devpost.com/software/..."
                    value={demoUrl}
                    onChange={e => setDemoUrl(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">GitHub Repository URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Participating Team Members */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Team Participants</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {users.map(u => {
                    const isChecked = participantIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isChecked ? 'border-black bg-white shadow-xs' : 'border-[#E5E5E7] bg-[#F5F5F7]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setParticipantIds(prev => prev.filter(id => id !== u.id));
                            } else {
                              setParticipantIds(prev => [...prev, u.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 accent-black rounded"
                        />
                        <span className="text-xs text-black truncate">{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Remarks & Strategic Feedback</label>
                <textarea
                  rows={2}
                  placeholder="Mentor advice, jury comments, next steps for prototype..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  Track Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {isEditOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Edit Event Record</span>
                <h3 className="font-serif text-2xl font-normal text-black mt-0.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Event Name *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Event Category</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as EventType)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Organizer / Host</label>
                  <input
                    type="text"
                    value={editOrganizer}
                    onChange={e => setEditOrganizer(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Location / Format</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as HackathonStatus)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  >
                    {EVENT_STATUSES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Project / Prototype Name *</label>
                  <input
                    type="text"
                    required
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Award / Prize Won</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Place Track Winner • ₹5,00,000"
                    value={editAwardPrize}
                    onChange={e => setEditAwardPrize(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Project Description</label>
                <textarea
                  rows={2}
                  value={editProjectDescription}
                  onChange={e => setEditProjectDescription(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Demo URL</label>
                  <input
                    type="url"
                    value={editDemoUrl}
                    onChange={e => setEditDemoUrl(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">GitHub URL</label>
                  <input
                    type="url"
                    value={editRepoUrl}
                    onChange={e => setEditRepoUrl(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Deck / Pitch</label>
                  <input
                    type="url"
                    value={editPresentationUrl}
                    onChange={e => setEditPresentationUrl(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* Participating Team Members */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Team Participants</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {users.map(u => {
                    const isChecked = editParticipantIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                          isChecked ? 'border-black bg-white shadow-xs' : 'border-[#E5E5E7] bg-[#F5F5F7]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditParticipantIds(prev => prev.filter(id => id !== u.id));
                            } else {
                              setEditParticipantIds(prev => [...prev, u.id]);
                            }
                          }}
                          className="w-3.5 h-3.5 accent-black rounded"
                        />
                        <span className="text-xs text-black truncate">{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Remarks & Strategic Feedback</label>
                <textarea
                  rows={3}
                  value={editRemarks}
                  onChange={e => setEditRemarks(e.target.value)}
                  placeholder="Mentor advice, jury comments, post-hackathon roadmap..."
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E5E7] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="px-3.5 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete Event</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH DOCUMENT / LINK MODAL */}
      {isAttachOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-[#E5E5E7] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
              <div>
                <span className="text-xs font-semibold text-[#6E6E73] uppercase tracking-wider">Attach Event Resource</span>
                <h3 className="font-serif text-xl font-normal text-black mt-0.5">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setIsAttachOpen(false)}
                className="text-[#6E6E73] hover:text-black transition-colors p-1.5 rounded-full hover:bg-[#F5F5F7] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 bg-[#F5F5F7] border border-[#E5E5E7] rounded-full text-xs font-medium w-full">
              <button
                type="button"
                onClick={() => setAttachMode('file')}
                className={`flex-1 py-1.5 rounded-full text-center transition-all cursor-pointer ${
                  attachMode === 'file' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Upload File (PDF / Slides)
              </button>
              <button
                type="button"
                onClick={() => setAttachMode('link')}
                className={`flex-1 py-1.5 rounded-full text-center transition-all cursor-pointer ${
                  attachMode === 'link' ? 'bg-white text-black shadow-xs font-semibold' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Attach Cloud URL
              </button>
            </div>

            <form onSubmit={handleAttachSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Document Title / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Winner Certificate / Devpost Submission"
                  value={attachName}
                  onChange={e => setAttachName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl px-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all"
                />
              </div>

              {attachMode === 'file' ? (
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Select File (PDF, Pitch Deck, Certificate, Photo)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        const f = e.target.files[0];
                        setAttachFile(f);
                        if (!attachName) setAttachName(f.name);
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 border border-dashed border-[#E5E5E7] hover:border-black rounded-2xl bg-[#F5F5F7] hover:bg-white text-center cursor-pointer transition-all"
                  >
                    {attachFile ? (
                      <div className="flex items-center justify-center gap-2 text-black">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="font-medium truncate">{attachFile.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <UploadCloud size={22} className="mx-auto text-[#6E6E73]" />
                        <span className="text-xs text-black font-medium block">Click to select certificate or pitch deck</span>
                        <span className="text-[11px] text-[#6E6E73] block">Stored securely in Supabase storage</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#6E6E73] uppercase tracking-wider mb-1.5">Cloud Document URL *</label>
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                    <input
                      type="url"
                      required
                      placeholder="https://devpost.com/software/... or Google Drive"
                      value={attachUrl}
                      onChange={e => setAttachUrl(e.target.value)}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5E7] rounded-xl pl-9 pr-3.5 py-2 text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E7]">
                <button
                  type="button"
                  onClick={() => setIsAttachOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] hover:bg-[#F5F5F7] text-black text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-full bg-black hover:opacity-90 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
                >
                  {isUploading ? 'Attaching...' : 'Attach Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
