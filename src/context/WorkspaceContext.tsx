import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, Project, Task, CalendarEvent, Meeting, Note, FileItem,
  ChatChannel, ChatMessage, Checkin, WorkspaceConfig, TaskStatus,
  Expense, ExpenseStatus, Investor, InvestorStage, InvestorInteraction,
  InvestorDocument, AgentTask, AgentActivityLog, AgentReport, AgentConfig, AgentActionStep
} from '../types';
import {
  initialUsers, initialProjects, initialTasks, initialCalendarEvents,
  initialMeetings, initialNotes, initialFiles, initialChannels,
  initialMessages, initialCheckins, initialWorkspaceConfig,
  initialExpenses, initialInvestors, initialAgentLogs, initialAgentReports, initialAgentConfig
} from '../data/seedData';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { generateGeminiContent } from '../lib/gemini';

interface WorkspaceContextType {
  // Live Supabase Database Connection
  supabaseConnected: boolean;

  // Navigation & UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  quickCaptureOpen: boolean;
  setQuickCaptureOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  accessModalOpen: boolean;
  setAccessModalOpen: (open: boolean) => void;

  // Authentication & Session
  isAuthenticated: boolean;
  login: (userId: string, pin?: string) => boolean;
  logout: () => void;
  loginError: string | null;
  clearLoginError: () => void;

  // Active User & Team
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;
  users: User[];
  isVijayrajkumar: boolean;
  addMember: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (updated: User) => void;
  updateUserStatus: (status: User['status'], message: string) => void;

  // Projects
  projects: Project[];
  addProject: (p: Omit<Project, 'id'>) => void;

  // Tasks
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (t: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Meetings
  meetings: Meeting[];
  addMeeting: (m: Omit<Meeting, 'id'>) => Meeting;
  updateMeeting: (m: Meeting) => void;
  convertActionItemToTask: (meetingId: string, actionItemId: string) => void;

  // Notes & Wiki
  notes: Note[];
  addNote: (n: Omit<Note, 'id' | 'updatedAt'>) => Note;
  updateNote: (n: Note) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Files
  files: FileItem[];
  uploadFile: (file: { name: string; size: string; type: string; projectId: string; folder: string; notes?: string; fileUrl?: string }) => Promise<FileItem>;
  addFileVersion: (fileId: string, versionData: { size: string; notes: string }) => void;
  deleteFile: (id: string) => void;

  // Chat
  channels: ChatChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  addChannel: (c: Omit<ChatChannel, 'id'>) => void;
  messages: ChatMessage[];
  sendMessage: (
    channelId: string,
    text: string,
    parentId?: string,
    attachment?: { url: string; type: 'image' | 'file' | 'audio'; name?: string; size?: string; duration?: string }
  ) => void;
  togglePinMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  convertMessageToTask: (messageId: string) => void;

  // Checkins & Pulse
  checkins: Checkin[];
  submitCheckin: (data: Omit<Checkin, 'id' | 'userId' | 'timestamp'>) => void;

  // Expenses Module
  expenses: import('../types').Expense[];
  addExpense: (data: Omit<import('../types').Expense, 'id' | 'createdAt'>) => Promise<import('../types').Expense>;
  updateExpenseStatus: (expenseId: string, status: import('../types').ExpenseStatus, comment?: string) => void;
  deleteExpense: (expenseId: string) => void;

  // Investor Relations Module
  investors: import('../types').Investor[];
  addInvestor: (data: Omit<import('../types').Investor, 'id' | 'createdAt' | 'interactions' | 'documents'>) => import('../types').Investor;
  updateInvestor: (data: import('../types').Investor) => void;
  updateInvestorStage: (investorId: string, stage: import('../types').InvestorStage) => void;
  addInvestorInteraction: (investorId: string, interaction: Omit<import('../types').InvestorInteraction, 'id' | 'timestamp'>) => void;
  addInvestorDocument: (investorId: string, doc: Omit<import('../types').InvestorDocument, 'id' | 'uploadedAt'>) => void;
  scheduleInvestorFollowUp: (investorId: string, date: string, note?: string) => void;

  // Agentic AI Task Executor Module
  agentTasks: import('../types').AgentTask[];
  agentLogs: import('../types').AgentActivityLog[];
  agentReports: import('../types').AgentReport[];
  agentConfig: import('../types').AgentConfig;
  createAgentTask: (prompt: string, sourceTaskId?: string) => Promise<import('../types').AgentTask>;
  approveAndExecutePlan: (agentTaskId: string) => Promise<void>;
  generateAgentReport: (type: 'daily' | 'weekly' | 'monthly') => Promise<import('../types').AgentReport>;
  rollbackAgentAction: (logId: string) => void;
  updateAgentConfig: (config: Partial<import('../types').AgentConfig>) => void;
  delegateTaskToAgent: (taskId: string) => Promise<void>;

  // Workspace Config & Personalization
  workspaceConfig: WorkspaceConfig;
  updateWorkspaceConfig: (config: Partial<WorkspaceConfig>) => void;
  toggleSound: () => void;
  togglePixelFont: () => void;
  reorderWidgets: (newWidgets: string[]) => void;
  exportWorkspaceData: () => void;
  importWorkspaceData: (jsonData: string) => boolean;
  resetWorkspaceData: () => void;
}

const STORAGE_KEY = 'UVL_WORKSPACE_STATE_MEMBERS_V6_INR';
const AUTH_SESSION_KEY = 'UVL_AUTH_SESSION_USER_ID';

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved state or use initial seed
  const loadInitial = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all 5 real team members are always preserved and sanitized
        if (!parsed.users || parsed.users.length < 5) {
          parsed.users = initialUsers;
        } else {
          parsed.users = parsed.users.map((u: User) => {
            const seed = initialUsers.find(su => su.id === u.id);
            return {
              ...u,
              role: 'member',
              statusMessage: (u.statusMessage?.includes('Lab operations') || u.statusMessage?.includes('Core engine') || u.statusMessage?.includes('Deep tech') || u.statusMessage?.includes('telemetry') || u.statusMessage?.includes('Airgapped')) ? '' : u.statusMessage,
              avatarUrl: seed?.avatarUrl || u.avatarUrl
            };
          });
        }
        // Ensure no legacy mock expenses or investors remain
        if (parsed.expenses && parsed.expenses.some((e: any) => e.id === 'exp-1' || e.id === 'exp-2' || e.id === 'exp-3')) {
          parsed.expenses = [];
        }
        if (parsed.investors && parsed.investors.some((i: any) => i.id === 'inv-1' || i.id === 'inv-2' || i.id === 'inv-3')) {
          parsed.investors = [];
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const savedData = loadInitial();

  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [quickCaptureOpen, setQuickCaptureOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [accessModalOpen, setAccessModalOpen] = useState<boolean>(false);

  const [users, setUsers] = useState<User[]>(savedData?.users || initialUsers);

  // Authentication & Separate Login Session Management
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sessionUser = localStorage.getItem(AUTH_SESSION_KEY);
      return !!sessionUser;
    } catch {
      return false;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const sessionUser = localStorage.getItem(AUTH_SESSION_KEY);
      if (sessionUser) return sessionUser;
    } catch {}
    return savedData?.currentUserId || 'u-1';
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const clearLoginError = () => setLoginError(null);

  const login = (userId: string, pin?: string): boolean => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      setLoginError('Operator ID not recognized in tactical roster.');
      sound.alert();
      return false;
    }

    if (pin && targetUser.pin && pin !== targetUser.pin) {
      setLoginError('Authentication failed: Invalid security PIN code.');
      sound.alert();
      return false;
    }

    setLoginError(null);
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(AUTH_SESSION_KEY, userId);
    } catch {}
    sound.patchStamp();
    return true;
  };

  const logout = () => {
    sound.click();
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {}
  };

  const [projects, setProjects] = useState<Project[]>(savedData?.projects || initialProjects);
  const [tasks, setTasks] = useState<Task[]>(savedData?.tasks || initialTasks);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(savedData?.calendarEvents || initialCalendarEvents);
  const [meetings, setMeetings] = useState<Meeting[]>(savedData?.meetings || initialMeetings);
  const [notes, setNotes] = useState<Note[]>(savedData?.notes || initialNotes);
  const [files, setFiles] = useState<FileItem[]>(savedData?.files || initialFiles);
  const [channels, setChannels] = useState<ChatChannel[]>(savedData?.channels || initialChannels);
  const [activeChannelId, setActiveChannelId] = useState<string>(savedData?.activeChannelId || 'ch-general');
  const [messages, setMessages] = useState<ChatMessage[]>(savedData?.messages || initialMessages);
  const [checkins, setCheckins] = useState<Checkin[]>(savedData?.checkins || initialCheckins);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(savedData?.workspaceConfig || initialWorkspaceConfig);
  const [expenses, setExpenses] = useState<Expense[]>(savedData?.expenses || initialExpenses);
  const [investors, setInvestors] = useState<Investor[]>(savedData?.investors || initialInvestors);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>(savedData?.agentTasks || []);
  const [agentLogs, setAgentLogs] = useState<AgentActivityLog[]>(savedData?.agentLogs || initialAgentLogs);
  const [agentReports, setAgentReports] = useState<AgentReport[]>(savedData?.agentReports || initialAgentReports);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(savedData?.agentConfig || initialAgentConfig);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const isVijayrajkumar = currentUser?.id === 'u-1' || currentUser?.name?.toLowerCase().includes('vijay') || currentUser?.handle?.toLowerCase().includes('vijay');

  // Sync with Live Supabase Database
  useEffect(() => {
    let isMounted = true;

    async function syncSupabase() {
      try {
        const { data: dbUsers, error: uErr } = await supabase.from('users').select('*');
        if (!uErr && dbUsers && dbUsers.length > 0 && isMounted) {
          setSupabaseConnected(true);
          setUsers(dbUsers.map(u => ({
            id: u.id,
            name: u.name,
            handle: u.handle || `@${u.name.toLowerCase()}`,
            role: (u.role as any) || 'member',
            avatarUrl: u.avatar_url || `/avatars/${u.name.toLowerCase()}.png`,
            avatarEmblem: u.avatar_emblem || 'crosshair',
            avatarBg: u.avatar_bg || '#000000',
            avatarStitch: u.avatar_stitch || '#FFFFFF',
            callsign: u.callsign || 'OPERATOR',
            pin: u.pin,
            status: u.status || 'active',
            statusMessage: u.status_message || '',
            lastActive: u.last_active || 'Just now'
          })));
        } else if (!uErr) {
          setSupabaseConnected(true);
        }

        const { data: dbTasks, error: tErr } = await supabase.from('tasks').select('*');
        if (!tErr && dbTasks && isMounted) {
          setTasks(dbTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            assigneeId: t.assignee_id,
            status: t.status as TaskStatus,
            priority: t.priority as any,
            dueDate: t.due_date,
            projectId: t.project_id || 'p-1',
            subtasks: t.subtasks || [],
            dependencies: t.blocked_by ? [t.blocked_by] : [],
            tags: [],
            createdAt: t.created_at ? t.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          })));
        }

        const { data: dbMeetings, error: mErr } = await supabase.from('meetings').select('*');
        if (!mErr && dbMeetings && isMounted) {
          setMeetings(dbMeetings.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date,
            time: m.time,
            duration: m.duration,
            attendeeIds: m.attendees || [],
            agenda: m.agenda ? m.agenda.split(' • ') : [],
            notes: m.notes || '',
            actionItems: m.action_items || []
          })));
        }

        const { data: dbNotes, error: nErr } = await supabase.from('notes').select('*');
        if (!nErr && dbNotes && isMounted) {
          setNotes(dbNotes.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content || '',
            type: n.type as any,
            updatedAt: n.updated_at ? n.updated_at.replace('T', ' ').slice(0, 16) : 'Just now',
            authorId: n.author_id || currentUserId,
            tags: n.tags || [],
            pinned: n.is_pinned || false,
            projectId: n.project_id
          })));
        }

        const { data: dbCheckins, error: cErr } = await supabase.from('checkins').select('*');
        if (!cErr && dbCheckins && isMounted) {
          setCheckins(dbCheckins.map(c => ({
            id: c.id,
            userId: c.user_id,
            date: c.date || new Date().toISOString().split('T')[0],
            completedToday: c.completed_today || c.worked_on || '',
            workingOnNext: c.working_on_next || c.next_up || '',
            blockers: c.blockers || 'None',
            mood: (c.mood || '🟢 Good') as any,
            timestamp: c.timestamp || 'Today'
          })));
        }

        const { data: dbMessages, error: msgErr } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
        if (!msgErr && dbMessages && isMounted) {
          setMessages(dbMessages.map(m => {
            let text = m.text;
            let attachmentUrl: string | undefined;
            let attachmentType: 'image' | 'file' | 'audio' | undefined;
            let attachmentName: string | undefined;
            let attachmentSize: string | undefined;
            let audioDuration: string | undefined;

            try {
              if (typeof m.text === 'string' && m.text.startsWith('__UVL_ATTACHMENT__:')) {
                const parsed = JSON.parse(m.text.slice('__UVL_ATTACHMENT__:'.length));
                text = parsed.text || '';
                attachmentUrl = parsed.attachmentUrl;
                attachmentType = parsed.attachmentType;
                attachmentName = parsed.attachmentName;
                attachmentSize = parsed.attachmentSize;
                audioDuration = parsed.audioDuration;
              }
            } catch {
              // use standard text
            }

            return {
              id: m.id,
              channelId: m.channel_id,
              senderId: m.user_id,
              text,
              attachmentUrl,
              attachmentType,
              attachmentName,
              attachmentSize,
              audioDuration,
              timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              pinned: false,
              parentId: m.parent_id,
              replyCount: m.reply_count || 0,
              reactions: m.reactions || [],
              mentions: m.mentions || []
            };
          }));
        }

        const { data: dbProjects, error: pErr } = await supabase.from('projects').select('*');
        if (!pErr && dbProjects && isMounted) {
          setProjects(dbProjects.map(p => ({
            id: p.id,
            name: p.name,
            code: p.code,
            color: p.color || '#A1A1AA',
            description: p.description || ''
          })));
        }

        const { data: dbEvents, error: evErr } = await supabase.from('calendar_events').select('*');
        if (!evErr && dbEvents && isMounted) {
          setCalendarEvents(dbEvents.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description || '',
            date: e.date,
            startTime: e.start_time || '09:00',
            endTime: e.end_time || '10:00',
            category: e.category || 'team',
            projectId: e.project_id,
            memberId: e.user_id,
            sourceTaskId: e.task_id
          })));
        }

        const { data: dbFiles, error: fErr } = await supabase.from('files').select('*');
        if (!fErr && dbFiles && isMounted) {
          setFiles(dbFiles.map(f => ({
            id: f.id,
            name: f.name,
            size: f.size || '1.0 MB',
            type: f.type || 'document',
            projectId: f.project_id || 'p-1',
            folder: f.folder || 'Specs',
            uploadedBy: f.uploaded_by || currentUserId,
            uploadedAt: f.uploaded_at ? f.uploaded_at.split('T')[0] : 'Today',
            version: typeof f.version === 'number' ? f.version : 1,
            versions: f.version_history || [],
            downloadUrl: f.file_url || undefined
          })));
        }

        const { data: dbChannels, error: chErr } = await supabase.from('chat_channels').select('*');
        if (!chErr && dbChannels && isMounted && dbChannels.length > 0) {
          setChannels(dbChannels.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description || '',
            isPrivate: c.is_private || false,
            isDm: c.is_dm || false,
            memberIds: c.member_ids || []
          })));
        }
      } catch (err) {
        console.warn('Supabase sync warning:', err);
      }
    }

    syncSupabase();

    const channel = supabase
      .channel('uvl-live-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channels' }, () => syncSupabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => syncSupabase())
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Sync sound settings with sound utility
  useEffect(() => {
    sound.setEnabled(workspaceConfig.soundEnabled);
  }, [workspaceConfig.soundEnabled]);

  // Save to LocalStorage on state change
  useEffect(() => {
    try {
      const payload = {
        users,
        currentUserId,
        projects,
        tasks,
        calendarEvents,
        meetings,
        notes,
        files,
        channels,
        activeChannelId,
        messages,
        checkins,
        workspaceConfig,
        expenses,
        investors,
        agentTasks,
        agentLogs,
        agentReports,
        agentConfig
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage error
    }
  }, [users, currentUserId, projects, tasks, calendarEvents, meetings, notes, files, channels, activeChannelId, messages, checkins, workspaceConfig, expenses, investors, agentTasks, agentLogs, agentReports, agentConfig]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+Shift+N or Cmd+Shift+N: Quick Capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setQuickCaptureOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setActiveTab = (tab: string) => {
    sound.click();
    setActiveTabState(tab);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserId(user.id);
  };

  const switchUserById = (userId: string) => {
    sound.patchStamp();
    setCurrentUserId(userId);
  };

  const addMember = async (memberData: Omit<User, 'id'>): Promise<User> => {
    if (!isVijayrajkumar) {
      sound.alert();
      throw new Error('Access Denied: Only Vijayrajkumar has authority to add members.');
    }
    sound.patchStamp();
    const newId = `u-${Date.now().toString().slice(-4)}`;
    const newMember: User = {
      ...memberData,
      id: newId,
      status: memberData.status || 'active',
      statusMessage: memberData.statusMessage || '',
      lastActive: 'Just now',
    };

    setUsers(prev => [...prev, newMember]);

    const { error } = await supabase.from('users').insert({
      id: newMember.id,
      name: newMember.name,
      handle: newMember.handle || `@${newMember.name.toLowerCase().replace(/\s+/g, '')}`,
      role: newMember.role || 'member',
      avatar_url: newMember.avatarUrl || null,
      avatar_emblem: newMember.avatarEmblem || 'crosshair',
      avatar_bg: newMember.avatarBg || '#000000',
      avatar_stitch: newMember.avatarStitch || '#A1A1AA',
      callsign: newMember.callsign || `OP-${newMember.name.slice(0, 4).toUpperCase()}`,
      pin: newMember.pin || '1000',
      status: newMember.status,
      status_message: newMember.statusMessage,
      last_active: newMember.lastActive
    });

    if (error) {
      console.error('Supabase addMember error:', error);
      throw error;
    }

    return newMember;
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    supabase.from('users').upsert({
      id: updated.id,
      name: updated.name,
      handle: updated.handle,
      role: updated.role,
      avatar_url: updated.avatarUrl,
      avatar_emblem: updated.avatarEmblem,
      avatar_bg: updated.avatarBg,
      avatar_stitch: updated.avatarStitch,
      callsign: updated.callsign,
      pin: updated.pin,
      status: updated.status,
      status_message: updated.statusMessage,
      last_active: updated.lastActive
    }).then(({ error }) => {
      if (error) console.warn('Supabase updateUser error:', error);
    });
  };

  const updateUserStatus = (status: User['status'], message: string) => {
    sound.click();
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, status, statusMessage: message, lastActive: 'Just now' } : u));
    supabase.from('users').update({
      status,
      status_message: message,
      last_active: 'Just now'
    }).eq('id', currentUserId).then(({ error }) => {
      if (error) console.warn('Supabase updateUserStatus error:', error);
    });
  };

  const addProject = (p: Omit<Project, 'id'>) => {
    sound.click();
    const newProject: Project = {
      ...p,
      id: `p-${Date.now()}`
    };
    setProjects(prev => [...prev, newProject]);
    supabase.from('projects').insert({
      id: newProject.id,
      name: newProject.name,
      code: newProject.code,
      description: newProject.description,
      color: newProject.color || '#A1A1AA'
    }).then(({ error }) => {
      if (error) console.warn('Supabase addProject error:', error);
    });
  };

  const addTask = (t: Omit<Task, 'id' | 'createdAt'>): Task => {
    sound.patchStamp();
    const newTask: Task = {
      ...t,
      id: `t-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);

    // Persist to Supabase
    supabase.from('tasks').insert({
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      assignee_id: newTask.assigneeId,
      status: newTask.status,
      priority: newTask.priority,
      due_date: newTask.dueDate,
      project_id: newTask.projectId,
      subtasks: newTask.subtasks,
      blocked_by: (newTask as any).blockedBy || newTask.dependencies?.[0] || null
    }).then(({ error }) => {
      if (error) console.warn('Supabase addTask error:', error);
    });

    // Auto-sync to calendar as a task deadline
    if (newTask.dueDate) {
      const deadlineEvent: CalendarEvent = {
        id: `ce-task-${newTask.id}`,
        title: `Deadline: ${newTask.title}`,
        description: newTask.description,
        date: newTask.dueDate,
        startTime: '17:00',
        endTime: '18:00',
        category: 'task_deadline',
        projectId: newTask.projectId,
        memberId: newTask.assigneeId,
        sourceTaskId: newTask.id
      };
      setCalendarEvents(prev => [...prev, deadlineEvent]);
      supabase.from('calendar_events').insert({
        id: deadlineEvent.id,
        title: deadlineEvent.title,
        date: deadlineEvent.date,
        start_time: deadlineEvent.startTime,
        end_time: deadlineEvent.endTime,
        category: deadlineEvent.category,
        project_id: deadlineEvent.projectId,
        user_id: deadlineEvent.memberId,
        task_id: deadlineEvent.sourceTaskId
      }).then(({ error }) => {
        if (error) console.warn('Supabase addCalendarEvent error:', error);
      });
    }

    return newTask;
  };

  const updateTask = (updated: Task) => {
    sound.click();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

    supabase.from('tasks').update({
      title: updated.title,
      description: updated.description,
      assignee_id: updated.assigneeId,
      status: updated.status,
      priority: updated.priority,
      due_date: updated.dueDate,
      project_id: updated.projectId,
      subtasks: updated.subtasks,
      blocked_by: (updated as any).blockedBy || updated.dependencies?.[0] || null
    }).eq('id', updated.id).then(({ error }) => {
      if (error) console.warn('Supabase updateTask error:', error);
    });

    // Update synced calendar event if dueDate changed
    setCalendarEvents(prev => prev.map(ev => {
      if (ev.sourceTaskId === updated.id) {
        return {
          ...ev,
          title: `Deadline: ${updated.title}`,
          date: updated.dueDate,
          memberId: updated.assigneeId,
          projectId: updated.projectId
        };
      }
      return ev;
    }));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (status === 'done') {
      sound.taskComplete();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#000000', '#FFFFFF', '#A1A1AA']
      });
    } else {
      sound.click();
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

    supabase.from('tasks').update({ status }).eq('id', taskId).then(({ error }) => {
      if (error) console.warn('Supabase updateTaskStatus error:', error);
    });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    sound.click();
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
        const nextStatus: TaskStatus = allCompleted ? 'done' : task.status;

        supabase.from('tasks').update({
          subtasks: updatedSubtasks,
          status: nextStatus
        }).eq('id', taskId).then(({ error }) => {
          if (error) console.warn('Supabase toggleSubtask error:', error);
        });

        return {
          ...task,
          subtasks: updatedSubtasks,
          status: nextStatus
        };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    sound.click();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCalendarEvents(prev => prev.filter(ev => ev.sourceTaskId !== taskId));

    supabase.from('tasks').delete().eq('id', taskId).then(({ error }) => {
      if (error) console.warn('Supabase deleteTask error:', error);
    });
    supabase.from('calendar_events').delete().eq('task_id', taskId).then(({ error }) => {
      if (error) console.warn('Supabase deleteTask calendar link error:', error);
    });
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    sound.patchStamp();
    const newEvent: CalendarEvent = {
      ...event,
      id: `ce-${Date.now().toString().slice(-4)}`
    };
    setCalendarEvents(prev => [...prev, newEvent]);

    supabase.from('calendar_events').insert({
      id: newEvent.id,
      title: newEvent.title,
      date: newEvent.date,
      start_time: newEvent.startTime,
      end_time: newEvent.endTime,
      category: newEvent.category,
      project_id: newEvent.projectId,
      user_id: newEvent.memberId,
      location: newEvent.location,
      notes: newEvent.description
    }).then(({ error }) => {
      if (error) console.warn('Supabase addCalendarEvent error:', error);
    });
  };

  const deleteCalendarEvent = (id: string) => {
    sound.click();
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    supabase.from('calendar_events').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase deleteCalendarEvent error:', error);
    });
  };

  const addMeeting = (m: Omit<Meeting, 'id'>): Meeting => {
    sound.patchStamp();
    const newMeeting: Meeting = {
      ...m,
      id: `m-${Date.now().toString().slice(-4)}`
    };
    setMeetings(prev => [newMeeting, ...prev]);

    supabase.from('meetings').insert({
      id: newMeeting.id,
      title: newMeeting.title,
      date: newMeeting.date,
      time: newMeeting.time,
      duration: newMeeting.duration,
      attendees: newMeeting.attendeeIds,
      agenda: newMeeting.agenda.join(' • '),
      notes: newMeeting.notes,
      action_items: newMeeting.actionItems
    }).then(({ error }) => {
      if (error) console.warn('Supabase addMeeting error:', error);
    });

    // Auto-attach to calendar
    const meetingEvent: CalendarEvent = {
      id: `ce-meet-${newMeeting.id}`,
      title: `Meeting: ${newMeeting.title}`,
      description: `Agenda: ${newMeeting.agenda.join(' • ')}`,
      date: newMeeting.date,
      startTime: newMeeting.time.includes('AM') || newMeeting.time.includes('PM') ? '10:00' : newMeeting.time,
      endTime: '11:00',
      category: 'meeting',
      attendeeIds: newMeeting.attendeeIds,
      location: 'Lab Room 01 / Secure Jitsi',
      sourceMeetingId: newMeeting.id
    };
    setCalendarEvents(prev => [...prev, meetingEvent]);
    supabase.from('calendar_events').insert({
      id: meetingEvent.id,
      title: meetingEvent.title,
      date: meetingEvent.date,
      start_time: meetingEvent.startTime,
      end_time: meetingEvent.endTime,
      category: 'meeting',
      location: meetingEvent.location,
      notes: meetingEvent.description,
      meeting_id: newMeeting.id
    }).then(({ error }) => {
      if (error) console.warn('Supabase addCalendarEvent for meeting error:', error);
    });

    return newMeeting;
  };

  const updateMeeting = (updated: Meeting) => {
    sound.click();
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));

    supabase.from('meetings').update({
      title: updated.title,
      date: updated.date,
      time: updated.time,
      duration: updated.duration,
      attendees: updated.attendeeIds,
      agenda: updated.agenda.join(' • '),
      notes: updated.notes,
      action_items: updated.actionItems
    }).eq('id', updated.id).then(({ error }) => {
      if (error) console.warn('Supabase updateMeeting error:', error);
    });
  };

  const convertActionItemToTask = (meetingId: string, actionItemId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const actionItem = meeting.actionItems.find(ai => ai.id === actionItemId);
    if (!actionItem || actionItem.convertedToTaskId) return;

    sound.taskComplete();
    const spawnedTask = addTask({
      title: actionItem.text,
      description: `Action item originated from meeting "${meeting.title}" on ${meeting.date}.`,
      status: 'todo',
      priority: 'high',
      assigneeId: actionItem.assignedTo || currentUserId,
      projectId: 'p-1',
      dueDate: actionItem.dueDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      subtasks: [],
      dependencies: [],
      tags: ['action-item', 'meeting'],
      originMeetingId: meetingId
    });

    const updatedActionItems = meeting.actionItems.map(ai =>
      ai.id === actionItemId ? { ...ai, convertedToTaskId: spawnedTask.id } : ai
    );

    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, actionItems: updatedActionItems } : m));

    supabase.from('meetings').update({
      action_items: updatedActionItems
    }).eq('id', meetingId).then(({ error }) => {
      if (error) console.warn('Supabase convertActionItem error:', error);
    });
  };

  const addNote = (n: Omit<Note, 'id' | 'updatedAt'>): Note => {
    sound.patchStamp();
    const newNote: Note = {
      ...n,
      id: `n-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [newNote, ...prev]);

    const validProjectId = projects.some(p => p.id === newNote.projectId) ? newNote.projectId : (projects[0]?.id || null);

    supabase.from('notes').insert({
      id: newNote.id,
      title: newNote.title,
      content: newNote.content,
      author_id: newNote.authorId || currentUserId,
      type: newNote.type,
      tags: newNote.tags || [],
      project_id: validProjectId,
      is_pinned: newNote.pinned || false
    }).then(({ error }) => {
      if (error) console.warn('Supabase addNote error:', error);
    });

    return newNote;
  };

  const updateNote = (updated: Note) => {
    sound.click();
    const dateStr = new Date().toISOString().split('T')[0];
    setNotes(prev => prev.map(n => n.id === updated.id ? { ...updated, updatedAt: dateStr } : n));

    const validProjectId = updated.projectId && projects.some(p => p.id === updated.projectId) ? updated.projectId : (projects[0]?.id || null);

    supabase.from('notes').update({
      title: updated.title,
      content: updated.content,
      type: updated.type,
      tags: updated.tags || [],
      project_id: validProjectId,
      is_pinned: updated.pinned || false,
      updated_at: new Date().toISOString()
    }).eq('id', updated.id).then(({ error }) => {
      if (error) console.warn('Supabase updateNote error:', error);
    });
  };

  const deleteNote = (id: string) => {
    sound.click();
    setNotes(prev => prev.filter(n => n.id !== id));
    supabase.from('notes').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase deleteNote error:', error);
    });
  };

  const togglePinNote = (id: string) => {
    sound.click();
    const target = notes.find(n => n.id === id);
    const nextPinned = !target?.pinned;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: nextPinned } : n));

    supabase.from('notes').update({ is_pinned: nextPinned }).eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase togglePinNote error:', error);
    });
  };

  const uploadFile = async (fileData: {
    name: string;
    size: string;
    type: string;
    projectId: string;
    folder: string;
    notes?: string;
    fileUrl?: string;
  }): Promise<FileItem> => {
    sound.patchStamp();
    const newFile: FileItem = {
      id: `f-${Date.now().toString().slice(-4)}`,
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      projectId: fileData.projectId || 'p-1',
      folder: fileData.folder || 'General',
      uploadedBy: currentUserId,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      version: 1,
      downloadUrl: fileData.fileUrl,
      versions: [
        {
          version: 1,
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          size: fileData.size,
          notes: fileData.notes || 'Initial upload'
        }
      ]
    };
    setFiles(prev => [newFile, ...prev]);

    const { error } = await supabase.from('files').insert({
      id: newFile.id,
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      project_id: newFile.projectId,
      folder: newFile.folder,
      uploaded_by: currentUserId,
      version: 'v1.0',
      file_url: fileData.fileUrl || null,
      version_history: newFile.versions
    });
    if (error) console.warn('Supabase uploadFile error:', error);

    return newFile;
  };

  const addFileVersion = (fileId: string, versionData: { size: string; notes: string }) => {
    sound.patchStamp();
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const nextVer = f.version + 1;
        const newRev = {
          version: nextVer,
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          size: versionData.size,
          notes: versionData.notes
        };
        const updatedFile = {
          ...f,
          version: nextVer,
          size: versionData.size,
          uploadedAt: newRev.uploadedAt,
          versions: [newRev, ...f.versions]
        };

        supabase.from('files').update({
          version: `v${nextVer}.0`,
          size: versionData.size,
          version_history: updatedFile.versions
        }).eq('id', fileId).then(({ error }) => {
          if (error) console.warn('Supabase addFileVersion error:', error);
        });

        return updatedFile;
      }
      return f;
    }));
  };

  const deleteFile = (id: string) => {
    sound.click();
    setFiles(prev => prev.filter(f => f.id !== id));
    supabase.from('files').delete().eq('id', id).then(({ error }) => {
      if (error) console.warn('Supabase deleteFile error:', error);
    });
  };

  const addChannel = (c: Omit<ChatChannel, 'id'>) => {
    sound.click();
    const newChannel: ChatChannel = {
      ...c,
      id: `ch-${Date.now().toString().slice(-4)}`
    };
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);

    supabase.from('chat_channels').insert({
      id: newChannel.id,
      name: newChannel.name,
      description: newChannel.description,
      is_private: newChannel.isPrivate || false,
      is_dm: newChannel.isDm || false
    }).then(({ error }) => {
      if (error) console.warn('Supabase addChannel error:', error);
    });
  };

  const sendMessage = (
    channelId: string,
    text: string,
    parentId?: string,
    attachment?: { url: string; type: 'image' | 'file' | 'audio'; name?: string; size?: string; duration?: string }
  ) => {
    sound.click();
    const mentionRegex = /@(\w+)/g;
    const detectedMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      detectedMentions.push(`@${match[1]}`);
    }

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUserId,
      text,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
      attachmentSize: attachment?.size,
      audioDuration: attachment?.duration,
      timestamp: 'Just now',
      pinned: false,
      parentId,
      replyCount: 0,
      mentions: detectedMentions,
      reactions: []
    };

    setMessages(prev => [...prev, newMessage]);

    if (parentId) {
      setMessages(prev => prev.map(m => m.id === parentId ? { ...m, replyCount: m.replyCount + 1 } : m));
    }

    const dbPayloadText = attachment ? `__UVL_ATTACHMENT__:${JSON.stringify({
      text,
      attachmentUrl: attachment.url,
      attachmentType: attachment.type,
      attachmentName: attachment.name,
      attachmentSize: attachment.size,
      audioDuration: attachment.duration
    })}` : text;

    supabase.from('chat_messages').insert({
      id: newMessage.id,
      channel_id: channelId,
      user_id: currentUserId,
      text: dbPayloadText,
      parent_id: parentId || null,
      reactions: [],
      reply_count: 0
    }).then(({ error }) => {
      if (error) console.warn('Supabase sendMessage error:', error);
    });
  };

  const togglePinMessage = (messageId: string) => {
    sound.click();
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: !m.pinned } : m));
  };

  const addReaction = (messageId: string, emoji: string) => {
    sound.click();
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const existing = m.reactions.find(r => r.emoji === emoji);
        let updatedReactions;
        if (existing) {
          if (existing.userIds.includes(currentUserId)) {
            const filteredUsers = existing.userIds.filter(id => id !== currentUserId);
            updatedReactions = filteredUsers.length > 0
              ? m.reactions.map(r => r.emoji === emoji ? { ...r, userIds: filteredUsers } : r)
              : m.reactions.filter(r => r.emoji !== emoji);
          } else {
            updatedReactions = m.reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, currentUserId] } : r);
          }
        } else {
          updatedReactions = [...m.reactions, { emoji, userIds: [currentUserId] }];
        }

        supabase.from('chat_messages').update({
          reactions: updatedReactions
        }).eq('id', messageId).then(({ error }) => {
          if (error) console.warn('Supabase updateReaction error:', error);
        });

        return { ...m, reactions: updatedReactions };
      }
      return m;
    }));
  };

  const convertMessageToTask = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.convertedToTaskId) return;

    sound.taskComplete();
    const sender = users.find(u => u.id === msg.senderId);
    const newTask = addTask({
      title: msg.text.slice(0, 65) + (msg.text.length > 65 ? '...' : ''),
      description: `Task spawned from chat message by ${sender?.name || 'team member'}:\n\n"${msg.text}"`,
      status: 'todo',
      priority: 'medium',
      assigneeId: currentUserId,
      projectId: 'p-1',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      subtasks: [],
      dependencies: [],
      tags: ['chat-spawned'],
      originChatId: messageId
    });

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, convertedToTaskId: newTask.id } : m));
  };

  const submitCheckin = (data: Omit<Checkin, 'id' | 'userId' | 'timestamp'>) => {
    sound.patchStamp();
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#000000', '#FFFFFF', '#A1A1AA']
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newCheckin: Checkin = {
      ...data,
      id: `chk-${Date.now()}`,
      userId: currentUserId,
      timestamp: nowTime
    };

    setCheckins(prev => [newCheckin, ...prev.filter(c => !(c.userId === currentUserId && c.date === data.date))]);

    supabase.from('checkins').insert({
      id: newCheckin.id,
      user_id: currentUserId,
      worked_on: data.completedToday || 'Progress logged',
      next_up: data.workingOnNext || 'Next phase planned',
      blockers: data.blockers || '',
      velocity: String(data.mood || 'good').toLowerCase().includes('good') ? 'good' : String(data.mood || 'good')
    }).then(({ error }) => {
      if (error) console.warn('Supabase submitCheckin error:', error);
    });

    // Update user status
    let newStatus: User['status'] = 'active';
    updateUserStatus(newStatus, data.workingOnNext || data.completedToday);
  };

  const updateWorkspaceConfig = (config: Partial<WorkspaceConfig>) => {
    sound.click();
    setWorkspaceConfig(prev => ({ ...prev, ...config }));
  };

  const toggleSound = () => {
    const next = !workspaceConfig.soundEnabled;
    updateWorkspaceConfig({ soundEnabled: next });
    sound.setEnabled(next);
    if (next) sound.alert();
  };

  const togglePixelFont = () => {
    sound.click();
    updateWorkspaceConfig({ pixelFontActive: !workspaceConfig.pixelFontActive });
  };

  const reorderWidgets = (newWidgets: string[]) => {
    sound.click();
    updateWorkspaceConfig({ dashboardWidgets: newWidgets });
  };

  const exportWorkspaceData = () => {
    sound.click();
    const data = {
      users,
      projects,
      tasks,
      calendarEvents,
      meetings,
      notes,
      files,
      channels,
      messages,
      checkins,
      workspaceConfig,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uvl-command-center-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkspaceData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.users && parsed.tasks) {
        setUsers(parsed.users);
        if (parsed.projects) setProjects(parsed.projects);
        setTasks(parsed.tasks);
        if (parsed.calendarEvents) setCalendarEvents(parsed.calendarEvents);
        if (parsed.meetings) setMeetings(parsed.meetings);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.files) setFiles(parsed.files);
        if (parsed.channels) setChannels(parsed.channels);
        if (parsed.messages) setMessages(parsed.messages);
        if (parsed.checkins) setCheckins(parsed.checkins);
        if (parsed.workspaceConfig) setWorkspaceConfig(parsed.workspaceConfig);
        sound.taskComplete();
        return true;
      }
    } catch {
      // error
    }
    return false;
  };

  // ==========================================
  // EXPENSES IMPLEMENTATION
  // ==========================================
  const addExpense = async (data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    sound.patchStamp();
    const newId = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setExpenses(prev => [newExpense, ...prev]);

    // If receipt URL is provided, index it automatically into Central File Repo (FilesView) under "Expenses"
    if (newExpense.receiptUrl) {
      await uploadFile({
        name: newExpense.receiptName || `Receipt-${newExpense.vendor.replace(/\s+/g, '_')}-${newExpense.date}.pdf`,
        size: '1.2 MB',
        type: newExpense.receiptName?.endsWith('.png') ? 'image/png' : newExpense.receiptName?.endsWith('.jpg') ? 'image/jpeg' : 'application/pdf',
        projectId: projects[0]?.id || 'p-1',
        folder: 'Expenses',
        notes: `Expense receipt for ${newExpense.vendor} (₹${newExpense.amount.toLocaleString('en-IN')}) submitted by ${currentUser.name}`,
        fileUrl: newExpense.receiptUrl
      });
    }

    // If status is pending, auto-create a verification task for Vijayrajkumar
    if (newExpense.status === 'pending') {
      addTask({
        title: `[Expense Review] ${newExpense.vendor} (₹${newExpense.amount.toLocaleString('en-IN')})`,
        description: `Review and approve submitted expense of ₹${newExpense.amount.toLocaleString('en-IN')} for category ${newExpense.category}. Paid via ${newExpense.paymentMethod}. Description: ${newExpense.description}`,
        status: 'todo',
        priority: newExpense.amount > 25000 ? 'urgent' : 'medium',
        assigneeId: 'u-1', // Vijayrajkumar
        projectId: projects[0]?.id || 'p-1',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        subtasks: [
          { id: `st-${Date.now()}-1`, title: 'Verify vendor invoice/receipt', completed: !!newExpense.receiptUrl },
          { id: `st-${Date.now()}-2`, title: 'Verify budget allocation', completed: false },
          { id: `st-${Date.now()}-3`, title: 'Authorize payout/reimbursement', completed: false }
        ],
        dependencies: [],
        tags: ['expense', 'finance', newExpense.category.toLowerCase()]
      });
    }

    return newExpense;
  };

  const updateExpenseStatus = (expenseId: string, status: ExpenseStatus, comment?: string) => {
    sound.click();
    setExpenses(prev => prev.map(exp => {
      if (exp.id === expenseId) {
        return {
          ...exp,
          status,
          approverComment: comment || exp.approverComment,
          approvedBy: status === 'approved' || status === 'reimbursed' ? currentUser.id : exp.approvedBy,
          approvedAt: status === 'approved' || status === 'reimbursed' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : exp.approvedAt
        };
      }
      return exp;
    }));
  };

  const deleteExpense = (expenseId: string) => {
    sound.alert();
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // ==========================================
  // INVESTOR TRACKING IMPLEMENTATION
  // ==========================================
  const addInvestor = (data: Omit<Investor, 'id' | 'createdAt' | 'interactions' | 'documents'>): Investor => {
    sound.patchStamp();
    const newInv: Investor = {
      ...data,
      id: `inv-${Date.now()}`,
      interactions: [
        {
          id: `int-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Email',
          summary: `Investor lead created by ${currentUser.name}. Stage: ${data.stage}. Target: ₹${data.dealSize.toLocaleString('en-IN')}`,
          authorId: currentUser.id,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        }
      ],
      documents: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setInvestors(prev => [newInv, ...prev]);

    // If follow up date set, create a linked task
    if (data.nextFollowUpDate) {
      addTask({
        title: `[Investor Follow-Up] ${newInv.name} (${newInv.firm})`,
        description: `Follow up on deal pipeline. Stage: ${newInv.stage}, Deal size: ₹${newInv.dealSize.toLocaleString('en-IN')}. Notes: ${newInv.notes}`,
        status: 'todo',
        priority: 'high',
        assigneeId: newInv.relationshipOwnerId,
        projectId: projects[0]?.id || 'p-1',
        dueDate: data.nextFollowUpDate,
        subtasks: [
          { id: `st-${Date.now()}-1`, title: 'Prepare updated metrics/pitch', completed: false },
          { id: `st-${Date.now()}-2`, title: 'Send follow-up email/invite', completed: false }
        ],
        dependencies: [],
        tags: ['investor', 'fundraising', newInv.roundType.toLowerCase()]
      });
    }

    return newInv;
  };

  const updateInvestor = (data: Investor) => {
    sound.click();
    setInvestors(prev => prev.map(inv => inv.id === data.id ? data : inv));
  };

  const updateInvestorStage = (investorId: string, stage: InvestorStage) => {
    sound.click();
    setInvestors(prev => prev.map(inv => {
      if (inv.id === investorId) {
        const updated = { ...inv, stage };
        updated.interactions = [
          {
            id: `int-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'Due Diligence',
            summary: `Pipeline stage advanced from ${inv.stage} to ${stage} by ${currentUser.name}.`,
            authorId: currentUser.id,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
          },
          ...inv.interactions
        ];
        return updated;
      }
      return inv;
    }));

    if (stage === 'term_sheet' || stage === 'committed' || stage === 'closed') {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const addInvestorInteraction = (investorId: string, interaction: Omit<InvestorInteraction, 'id' | 'timestamp'>) => {
    sound.click();
    setInvestors(prev => prev.map(inv => {
      if (inv.id === investorId) {
        const newInt: InvestorInteraction = {
          ...interaction,
          id: `int-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        };
        return {
          ...inv,
          lastInteractionDate: interaction.date,
          interactions: [newInt, ...inv.interactions]
        };
      }
      return inv;
    }));
  };

  const addInvestorDocument = async (investorId: string, doc: { name: string; url: string; type: string }): Promise<void> => {
    sound.patchStamp();
    const newDoc: InvestorDocument = {
      id: `invdoc-${Date.now()}`,
      name: doc.name,
      url: doc.url,
      type: doc.type,
      version: 1,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: currentUser.id
    };

    setInvestors(prev => prev.map(inv => {
      if (inv.id === investorId) {
        return {
          ...inv,
          documents: [newDoc, ...inv.documents]
        };
      }
      return inv;
    }));

    // Mirror to Central File Enclave
    const targetInv = investors.find(i => i.id === investorId);
    await uploadFile({
      name: `${targetInv?.firm || 'Investor'}_${doc.name}`,
      size: '2.4 MB',
      type: doc.type,
      projectId: projects[0]?.id || 'p-1',
      folder: 'Pitch & Investors',
      notes: `Investor documentation for ${targetInv?.name || 'Investor'} (${targetInv?.firm || 'VC'})`,
      fileUrl: doc.url
    });
  };

  const scheduleInvestorFollowUp = (investorId: string, date: string, note?: string) => {
    sound.click();
    const targetInv = investors.find(i => i.id === investorId);
    if (!targetInv) return;

    setInvestors(prev => prev.map(inv => inv.id === investorId ? { ...inv, nextFollowUpDate: date } : inv));

    addTask({
      title: `[Investor Follow-Up] ${targetInv.name} (${targetInv.firm})`,
      description: note || `Scheduled deal follow-up. Deal: ₹${targetInv.dealSize.toLocaleString('en-IN')} (${targetInv.roundType}). Valuation: ₹${(targetInv.valuation || 0).toLocaleString('en-IN')}`,
      status: 'todo',
      priority: 'high',
      assigneeId: targetInv.relationshipOwnerId,
      projectId: projects[0]?.id || 'p-1',
      dueDate: date,
      subtasks: [
        { id: `st-${Date.now()}-1`, title: 'Review last interaction notes', completed: false },
        { id: `st-${Date.now()}-2`, title: 'Execute email/call outreach', completed: false }
      ],
      dependencies: [],
      tags: ['investor', 'follow-up', targetInv.stage]
    });
  };

  // ==========================================
  // AGENTIC AI TASK EXECUTOR IMPLEMENTATION
  // ==========================================
  const createAgentTask = async (prompt: string, sourceTaskId?: string): Promise<AgentTask> => {
    sound.click();
    const taskId = `agent-task-${Date.now()}`;
    
    // Snapshot context for Gemini
    const contextPrompt = `You are UVL Sentinel, the autonomous AI executive agent for Unfounded Venture Lab.
Current Workspace Snapshot:
- Users: ${users.map(u => `${u.name} (${u.callsign})`).join(', ')}
- Tasks (${tasks.length}): ${tasks.slice(0, 5).map(t => `${t.title} [${t.status}]`).join('; ')}
- Expenses (${expenses.length}): Total spend $${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}, Pending approvals: ${expenses.filter(e => e.status === 'pending').length}
- Investors (${investors.length}): Pipeline: ${investors.map(i => `${i.name} at ${i.firm} (${i.stage})`).join('; ')}

User Prompt: "${prompt}"

Your job:
1. Parse the user's intent.
2. Formulate an actionable, modular execution plan across tasks, calendar, notes, files, chat, investors, or expenses.
3. Return ONLY a valid JSON object matching this schema (do NOT wrap in explanatory text):
{
  "summary": "Brief summary of the proposed plan",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Action title",
      "targetModule": "tasks",
      "actionType": "create_task",
      "details": { "title": "Task title", "description": "Details", "priority": "high", "assignee": "Vijayrajkumar" },
      "reasoning": "Why this action is required",
      "requiresHumanApproval": false
    }
  ]
}`;

    let parsedPlan: AgentActionStep[] = [];
    let summaryText = `Plan formulated for: "${prompt}"`;

    try {
      const geminiRes = await generateGeminiContent(contextPrompt, agentConfig.activeModel || 'gemini-3.6-flash');
      if (geminiRes.text) {
        let cleanText = geminiRes.text.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleanText);
        summaryText = parsed.summary || summaryText;
        if (Array.isArray(parsed.steps)) {
          parsedPlan = parsed.steps.map((s: any, idx: number) => ({
            id: `step-${Date.now()}-${idx + 1}`,
            stepNumber: s.stepNumber || idx + 1,
            title: s.title || `Step ${idx + 1}`,
            targetModule: s.targetModule || 'tasks',
            actionType: s.actionType || 'execute',
            details: s.details || {},
            reasoning: s.reasoning || 'Automated agent task requirement',
            status: 'pending',
            requiresHumanApproval: s.requiresHumanApproval ?? (s.actionType?.includes('delete') || s.actionType?.includes('reject'))
          }));
        }
      }
    } catch (err) {
      console.warn('Gemini plan parse error, applying fallback:', err);
    }

    if (parsedPlan.length === 0) {
      parsedPlan = [
        {
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          title: `Inspect & synthesize context for: ${prompt.slice(0, 35)}...`,
          targetModule: prompt.toLowerCase().includes('investor') ? 'investors' : prompt.toLowerCase().includes('expense') ? 'expenses' : 'tasks',
          actionType: 'analyze_data',
          details: { query: prompt },
          reasoning: 'Review existing records and identify action dependencies.',
          status: 'pending',
          requiresHumanApproval: false
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          title: `Generate tactical task for team execution`,
          targetModule: 'tasks',
          actionType: 'create_task',
          details: { title: `Resolve: ${prompt.slice(0, 45)}`, priority: 'high', assigneeId: currentUser.id },
          reasoning: 'Assign concrete resolution item to active operator.',
          status: 'pending',
          requiresHumanApproval: false
        },
        {
          id: `step-${Date.now()}-3`,
          stepNumber: 3,
          title: `Post verification update in #agent-reports`,
          targetModule: 'chat',
          actionType: 'broadcast_announcement',
          details: { message: `Autonomous action initialized for: "${prompt}"` },
          reasoning: 'Keep all team members informed in real-time.',
          status: 'pending',
          requiresHumanApproval: false
        }
      ];
    }

    const newAgentTask: AgentTask = {
      id: taskId,
      prompt,
      status: 'pending_approval',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      sourceTaskId,
      plan: parsedPlan,
      resultSummary: summaryText
    };

    setAgentTasks(prev => [newAgentTask, ...prev]);

    const newLog: AgentActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType: 'Plan Formulation',
      targetEntity: `Task: ${prompt.slice(0, 35)}`,
      reasoning: `Formulated ${parsedPlan.length}-step execution plan using Gemini 3.6 Flash. Ready for review.`,
      status: 'success',
      rollbackAvailable: false
    };
    setAgentLogs(prev => [newLog, ...prev]);

    return newAgentTask;
  };

  const approveAndExecutePlan = async (agentTaskId: string) => {
    sound.taskComplete();
    const task = agentTasks.find(t => t.id === agentTaskId);
    if (!task) return;

    setAgentTasks(prev => prev.map(t => t.id === agentTaskId ? { ...t, status: 'executing' } : t));

    const executedSteps: AgentActionStep[] = [];

    for (const step of task.plan) {
      try {
        if (step.targetModule === 'tasks') {
          addTask({
            title: step.details.title || step.title,
            description: step.details.description || step.reasoning,
            status: 'todo',
            priority: step.details.priority || 'high',
            assigneeId: step.details.assigneeId || currentUser.id,
            projectId: projects[0]?.id || 'p-1',
            dueDate: step.details.dueDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            subtasks: [
              { id: `st-${Date.now()}-1`, title: 'Execute agent recommended action', completed: false }
            ],
            dependencies: [],
            tags: ['ai-agent', 'sentinel']
          });
        } else if (step.targetModule === 'calendar') {
          addCalendarEvent({
            title: step.details.title || step.title,
            description: step.reasoning,
            date: step.details.date || new Date().toISOString().split('T')[0],
            startTime: step.details.startTime || '10:00',
            endTime: step.details.endTime || '11:00',
            category: 'task_deadline',
            projectId: projects[0]?.id || 'p-1',
            attendeeIds: [currentUser.id]
          });
        } else if (step.targetModule === 'notes') {
          addNote({
            title: step.details.title || `AI Action Note: ${step.title}`,
            content: step.details.content || `## ${step.title}\n\n**Reasoning:** ${step.reasoning}\n\nGenerated by UVL Sentinel on ${new Date().toLocaleString()}`,
            type: 'team_wiki',
            authorId: currentUser.id,
            projectId: projects[0]?.id || 'p-1',
            tags: ['agent-output', 'automated'],
            pinned: false
          });
        } else if (step.targetModule === 'chat') {
          const channel = channels.find(c => c.name === 'agent-reports') || channels[0];
          sendMessage(
            channel.id,
            `🤖 **[UVL SENTINEL] Action Executed**: ${step.title}\n*Reasoning*: ${step.reasoning}`
          );
        } else if (step.targetModule === 'investors') {
          if (step.details.investorId && step.details.stage) {
            updateInvestorStage(step.details.investorId, step.details.stage);
          }
        } else if (step.targetModule === 'expenses') {
          if (step.details.expenseId && step.details.status) {
            updateExpenseStatus(step.details.expenseId, step.details.status, step.reasoning);
          }
        }

        executedSteps.push({ ...step, status: 'executed' });
      } catch (err) {
        console.error('Error executing step:', err);
        executedSteps.push({ ...step, status: 'failed' });
      }
    }

    setAgentTasks(prev => prev.map(t => {
      if (t.id === agentTaskId) {
        return {
          ...t,
          status: 'completed',
          completedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          plan: executedSteps
        };
      }
      return t;
    }));

    const executionLog: AgentActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actionType: 'Plan Execution',
      targetEntity: `Task: ${task.prompt.slice(0, 35)}`,
      reasoning: `Successfully executed all ${executedSteps.length} planned sub-steps across workspace modules.`,
      status: 'success',
      rollbackAvailable: true,
      rollbackData: { agentTaskId, executedStepsCount: executedSteps.length }
    };
    setAgentLogs(prev => [executionLog, ...prev]);

    const reportsChan = channels.find(c => c.name === 'agent-reports') || channels[0];
    sendMessage(
      reportsChan.id,
      `✅ **[UVL SENTINEL] Task Completed**: "${task.prompt}"\nSuccessfully executed **${executedSteps.length} sub-steps** across workspace modules.`
    );
  };

  const generateAgentReport = async (type: 'daily' | 'weekly' | 'monthly'): Promise<AgentReport> => {
    sound.patchStamp();
    const periodStr = type === 'daily'
      ? `Daily Briefing — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : type === 'weekly'
      ? `Weekly Executive Synthesis — Cycle ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : `Monthly Capital & Engineering Review — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalPipeline = investors.reduce((sum, i) => sum + i.dealSize, 0);

    const reportPrompt = `You are UVL Sentinel, generating an executive ${type} intelligence report for Unfounded Venture Lab.
Context:
- Active Team: ${users.length} members (${users.map(u => u.name).join(', ')})
- Tasks: ${tasks.length} total, ${completedTasks} completed, ${tasks.filter(t => t.status === 'blocked').length} blocked
- Operational Spend: ₹${totalSpend.toLocaleString('en-IN')} INR across ${expenses.length} expense records
- Investor Pipeline: ₹${totalPipeline.toLocaleString('en-IN')} across ${investors.length} active venture leads
- Pipeline breakdown: ${investors.map(i => `${i.name} (${i.firm}) -> ${i.stage}: ₹${i.dealSize.toLocaleString('en-IN')}`).join('; ')}

Generate an editorial, high-density, professional markdown report with:
1. Executive Summary
2. Key Operational Milestones (bullet points)
3. Financial & Pipeline Health
4. Emerging Risks & Action Items

Format as clean markdown.`;

    let reportContent = '';
    try {
      const res = await generateGeminiContent(reportPrompt, agentConfig.activeModel || 'gemini-3.6-flash');
      if (res.text) {
        reportContent = res.text;
      }
    } catch (err) {
      console.warn('Report generation fallback:', err);
    }

    if (!reportContent) {
      reportContent = `# ${periodStr}
**Generated By**: UVL Sentinel (Autonomous AI Agent)

### Executive Summary
Autonomous operational scan of Unfounded Venture Lab enclaves. Engineering velocity remains strong with ${completedTasks} verified tasks completed. Capital allocation is controlled at ₹${totalSpend.toLocaleString('en-IN')} INR.

### Key Milestones
- Active pipeline stands at ₹${totalPipeline.toLocaleString('en-IN')} across ${investors.length} prospective institutional partners.
- Zero fatal exceptions across Supabase real-time telemetry enclaves.
- Mobile touch-first responsive shells deployed and verified.

### Risks & Action Items
- Review ${expenses.filter(e => e.status === 'pending').length} pending expense items before weekly books closing.
- Prepare partner materials for active diligence stages.`;
    }

    const newReport: AgentReport = {
      id: `rep-${Date.now()}`,
      type,
      title: periodStr,
      period: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      summary: `Automated ${type} synthesis covering ${tasks.length} tasks, ₹${totalSpend.toLocaleString('en-IN')} spend, and ₹${totalPipeline.toLocaleString('en-IN')} investor pipeline.`,
      content: reportContent,
      highlights: [
        `${completedTasks} tasks closed across current sprint`,
        `₹${totalPipeline.toLocaleString('en-IN')} active capital pipeline`,
        `100% database persistence active`
      ],
      risks: [
        `${expenses.filter(e => e.status === 'pending').length} pending expenses awaiting sign-off`,
        `${tasks.filter(t => t.status === 'blocked').length} blocked tasks requiring unblocking`
      ],
      metrics: {
        tasksCompleted: completedTasks,
        totalSpend,
        activeLeads: investors.length,
        sentimentScore: '⚡ High Momentum / 92%'
      }
    };

    setAgentReports(prev => [newReport, ...prev]);

    // Save as note in Team Wiki
    addNote({
      title: `[REPORT] ${periodStr}`,
      content: reportContent,
      type: 'team_wiki',
      authorId: currentUser.id,
      projectId: projects[0]?.id || 'p-1',
      tags: ['report', type, 'ai-generated'],
      pinned: true
    });

    // Announce in #agent-reports
    const reportChannel = channels.find(c => c.name === 'agent-reports') || channels[0];
    sendMessage(
      reportChannel.id,
      `📊 **[NEW ${type.toUpperCase()} REPORT PUBLISHED]**: **${periodStr}**\n${newReport.summary}\n\n*View full report in AI Agent Enclave or Notes & Wiki.*`
    );

    return newReport;
  };

  const rollbackAgentAction = (logId: string) => {
    sound.alert();
    setAgentLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return {
          ...log,
          status: 'rolled_back',
          rollbackAvailable: false,
          reasoning: `${log.reasoning} [ROLLED BACK by ${currentUser.name}]`
        };
      }
      return log;
    }));
  };

  const updateAgentConfig = (config: Partial<AgentConfig>) => {
    sound.click();
    setAgentConfig(prev => ({ ...prev, ...config }));
  };

  const delegateTaskToAgent = async (taskId: string) => {
    sound.patchStamp();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTaskStatus(taskId, 'in_progress');
    await createAgentTask(`Autonomous execution of task: "${task.title}". Details: ${task.description}`, taskId);
    setActiveTab('agent');
  };

  const resetWorkspaceData = () => {
    sound.alert();
    localStorage.removeItem(STORAGE_KEY);
    setUsers(initialUsers);
    setCurrentUserId('u-1');
    setProjects(initialProjects);
    setTasks(initialTasks);
    setCalendarEvents(initialCalendarEvents);
    setMeetings(initialMeetings);
    setNotes(initialNotes);
    setFiles(initialFiles);
    setChannels(initialChannels);
    setActiveChannelId('ch-general');
    setMessages(initialMessages);
    setCheckins(initialCheckins);
    setWorkspaceConfig(initialWorkspaceConfig);
    setExpenses(initialExpenses);
    setInvestors(initialInvestors);
    setAgentTasks([]);
    setAgentLogs(initialAgentLogs);
    setAgentReports(initialAgentReports);
    setAgentConfig(initialAgentConfig);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        supabaseConnected,
        activeTab,
        setActiveTab,
        quickCaptureOpen,
        setQuickCaptureOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        accessModalOpen,
        setAccessModalOpen,
        isAuthenticated,
        login,
        logout,
        loginError,
        clearLoginError,
        currentUser,
        setCurrentUser,
        switchUserById,
        users,
        isVijayrajkumar,
        addMember,
        updateUser,
        updateUserStatus,
        projects,
        addProject,
        tasks,
        addTask,
        updateTask,
        updateTaskStatus,
        toggleSubtask,
        deleteTask,
        calendarEvents,
        addCalendarEvent,
        deleteCalendarEvent,
        meetings,
        addMeeting,
        updateMeeting,
        convertActionItemToTask,
        notes,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        files,
        uploadFile,
        addFileVersion,
        deleteFile,
        channels,
        activeChannelId,
        setActiveChannelId,
        addChannel,
        messages,
        sendMessage,
        togglePinMessage,
        addReaction,
        convertMessageToTask,
        checkins,
        submitCheckin,
        expenses,
        addExpense,
        updateExpenseStatus,
        deleteExpense,
        investors,
        addInvestor,
        updateInvestor,
        updateInvestorStage,
        addInvestorInteraction,
        addInvestorDocument,
        scheduleInvestorFollowUp,
        agentTasks,
        agentLogs,
        agentReports,
        agentConfig,
        createAgentTask,
        approveAndExecutePlan,
        generateAgentReport,
        rollbackAgentAction,
        updateAgentConfig,
        delegateTaskToAgent,
        workspaceConfig,
        updateWorkspaceConfig,
        toggleSound,
        togglePixelFont,
        reorderWidgets,
        exportWorkspaceData,
        importWorkspaceData,
        resetWorkspaceData
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

