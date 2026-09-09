export type Role = 'admin' | 'member';

export type UserStatus = 'active' | 'focus' | 'reviewing' | 'away' | 'leave';

export interface User {
  id: string;
  name: string;
  handle: string;
  role: Role;
  avatarEmblem: 'skull' | 'radar' | 'chip' | 'bolt' | 'compass' | 'crosshair' | 'dagger';
  avatarBg: string;
  avatarStitch: string;
  avatarUrl?: string;
  callsign: string;
  pin?: string;
  status: UserStatus;
  statusMessage: string;
  lastActive: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  projectId: string;
  dueDate: string;
  createdAt: string;
  subtasks: Subtask[];
  dependencies: string[]; // task IDs
  tags: string[];
  originMeetingId?: string;
  originChatId?: string;
}

export type CalendarLayer = 'team' | 'personal' | 'meeting' | 'task_deadline';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: CalendarLayer;
  projectId?: string;
  memberId?: string;
  attendeeIds?: string[];
  location?: string;
  sourceTaskId?: string;
  sourceMeetingId?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignedTo: string;
  dueDate: string;
  convertedToTaskId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  attendeeIds: string[];
  agenda: string[];
  notes: string;
  actionItems: ActionItem[];
  link?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'personal' | 'team_wiki' | 'quick_capture';
  authorId: string;
  projectId?: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
}

export interface FileVersion {
  version: number;
  uploadedAt: string;
  size: string;
  notes: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  projectId: string;
  folder: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  versions: FileVersion[];
  downloadUrl?: string;
}

export interface ChatReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  timestamp: string;
  pinned: boolean;
  parentId?: string;
  replyCount: number;
  mentions: string[];
  reactions: ChatReaction[];
  convertedToTaskId?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  isDm: boolean;
  memberIds?: string[];
}

export interface Checkin {
  id: string;
  userId: string;
  date: string;
  completedToday: string;
  workingOnNext: string;
  blockers: string;
  mood: '⚡ Hyper' | '🟢 Good' | '🟡 Grinding' | '🔴 Blocked';
  timestamp: string;
}

export interface WorkspaceConfig {
  workspaceName: string;
  inviteCode: string;
  secretKey: string;
  restrictedMode: boolean;
  soundEnabled: boolean;
  pixelFontActive: boolean;
  dashboardWidgets: string[];
}
