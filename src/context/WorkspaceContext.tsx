import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User, Project, Task, CalendarEvent, Meeting, Note, FileItem,
  ChatChannel, ChatMessage, Checkin, WorkspaceConfig, TaskStatus
} from '../types';
import {
  initialUsers, initialProjects, initialTasks, initialCalendarEvents,
  initialMeetings, initialNotes, initialFiles, initialChannels,
  initialMessages, initialCheckins, initialWorkspaceConfig
} from '../data/seedData';
import { sound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface WorkspaceContextType {
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
  uploadFile: (file: { name: string; size: string; type: string; projectId: string; folder: string; notes?: string }) => void;
  addFileVersion: (fileId: string, versionData: { size: string; notes: string }) => void;
  deleteFile: (id: string) => void;

  // Chat
  channels: ChatChannel[];
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  addChannel: (c: Omit<ChatChannel, 'id'>) => void;
  messages: ChatMessage[];
  sendMessage: (channelId: string, text: string, parentId?: string) => void;
  togglePinMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  convertMessageToTask: (messageId: string) => void;

  // Checkins & Pulse
  checkins: Checkin[];
  submitCheckin: (data: Omit<Checkin, 'id' | 'userId' | 'timestamp'>) => void;

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

const STORAGE_KEY = 'UVL_WORKSPACE_STATE_MEMBERS_V5';
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

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

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
        workspaceConfig
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage error
    }
  }, [users, currentUserId, projects, tasks, calendarEvents, meetings, notes, files, channels, activeChannelId, messages, checkins, workspaceConfig]);

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

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const updateUserStatus = (status: User['status'], message: string) => {
    sound.click();
    setUsers(prev => prev.map(u => u.id === currentUserId ? { ...u, status, statusMessage: message, lastActive: 'Just now' } : u));
  };

  const addProject = (p: Omit<Project, 'id'>) => {
    sound.click();
    const newProject: Project = {
      ...p,
      id: `p-${Date.now()}`
    };
    setProjects(prev => [...prev, newProject]);
  };

  const addTask = (t: Omit<Task, 'id' | 'createdAt'>): Task => {
    sound.patchStamp();
    const newTask: Task = {
      ...t,
      id: `t-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);

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
    }

    return newTask;
  };

  const updateTask = (updated: Task) => {
    sound.click();
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

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
        colors: ['#EDE8DB', '#E5B869', '#5EBA7D']
      });
    } else {
      sound.click();
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    sound.click();
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed);
        return {
          ...task,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'done' : task.status
        };
      }
      return task;
    }));
  };

  const deleteTask = (taskId: string) => {
    sound.click();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCalendarEvents(prev => prev.filter(ev => ev.sourceTaskId !== taskId));
  };

  const addCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
    sound.patchStamp();
    const newEvent: CalendarEvent = {
      ...event,
      id: `ce-${Date.now().toString().slice(-4)}`
    };
    setCalendarEvents(prev => [...prev, newEvent]);
  };

  const deleteCalendarEvent = (id: string) => {
    sound.click();
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  };

  const addMeeting = (m: Omit<Meeting, 'id'>): Meeting => {
    sound.patchStamp();
    const newMeeting: Meeting = {
      ...m,
      id: `m-${Date.now().toString().slice(-4)}`
    };
    setMeetings(prev => [newMeeting, ...prev]);

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

    return newMeeting;
  };

  const updateMeeting = (updated: Meeting) => {
    sound.click();
    setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
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

    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        return {
          ...m,
          actionItems: m.actionItems.map(ai =>
            ai.id === actionItemId ? { ...ai, convertedToTaskId: spawnedTask.id } : ai
          )
        };
      }
      return m;
    }));
  };

  const addNote = (n: Omit<Note, 'id' | 'updatedAt'>): Note => {
    sound.patchStamp();
    const newNote: Note = {
      ...n,
      id: `n-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (updated: Note) => {
    sound.click();
    setNotes(prev => prev.map(n => n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString().split('T')[0] } : n));
  };

  const deleteNote = (id: string) => {
    sound.click();
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePinNote = (id: string) => {
    sound.click();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const uploadFile = (fileData: { name: string; size: string; type: string; projectId: string; folder: string; notes?: string }) => {
    sound.patchStamp();
    const newFile: FileItem = {
      id: `f-${Date.now().toString().slice(-4)}`,
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      projectId: fileData.projectId,
      folder: fileData.folder || 'General',
      uploadedBy: currentUserId,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      version: 1,
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
        return {
          ...f,
          version: nextVer,
          size: versionData.size,
          uploadedAt: newRev.uploadedAt,
          versions: [newRev, ...f.versions]
        };
      }
      return f;
    }));
  };

  const deleteFile = (id: string) => {
    sound.click();
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addChannel = (c: Omit<ChatChannel, 'id'>) => {
    sound.click();
    const newChannel: ChatChannel = {
      ...c,
      id: `ch-${Date.now().toString().slice(-4)}`
    };
    setChannels(prev => [...prev, newChannel]);
    setActiveChannelId(newChannel.id);
  };

  const sendMessage = (channelId: string, text: string, parentId?: string) => {
    sound.click();
    // Detect mentions like @jax, @maya
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
        if (existing) {
          if (existing.userIds.includes(currentUserId)) {
            // Remove user
            const filteredUsers = existing.userIds.filter(id => id !== currentUserId);
            return {
              ...m,
              reactions: filteredUsers.length > 0
                ? m.reactions.map(r => r.emoji === emoji ? { ...r, userIds: filteredUsers } : r)
                : m.reactions.filter(r => r.emoji !== emoji)
            };
          } else {
            return {
              ...m,
              reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, userIds: [...r.userIds, currentUserId] } : r)
            };
          }
        } else {
          return {
            ...m,
            reactions: [...m.reactions, { emoji, userIds: [currentUserId] }]
          };
        }
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
      colors: ['#5EBA7D', '#EDE8DB', '#E5B869']
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newCheckin: Checkin = {
      ...data,
      id: `chk-${Date.now()}`,
      userId: currentUserId,
      timestamp: nowTime
    };

    setCheckins(prev => [newCheckin, ...prev.filter(c => !(c.userId === currentUserId && c.date === data.date))]);

    // Update user status
    let newStatus: User['status'] = 'active';
    if (data.blockers && data.blockers.toLowerCase() !== 'none' && data.blockers.trim().length > 0) {
      newStatus = 'active';
    }
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
  };

  return (
    <WorkspaceContext.Provider
      value={{
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
