import { User, Project, Task, CalendarEvent, Meeting, Note, FileItem, ChatChannel, ChatMessage, Checkin, WorkspaceConfig } from '../types';

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Operator',
    handle: '@operator',
    role: 'admin',
    avatarEmblem: 'crosshair',
    avatarBg: '#14171C',
    avatarStitch: '#E5B869',
    callsign: 'OP-01',
    status: 'active',
    statusMessage: 'Ready for operations',
    lastActive: 'Just now'
  }
];

export const initialProjects: Project[] = [];

export const initialTasks: Task[] = [];

export const initialCalendarEvents: CalendarEvent[] = [];

export const initialMeetings: Meeting[] = [];

export const initialNotes: Note[] = [];

export const initialFiles: FileItem[] = [];

export const initialChannels: ChatChannel[] = [
  {
    id: 'ch-general',
    name: 'general',
    description: 'Main team communications and tactical channel',
    isPrivate: false,
    isDm: false
  }
];

export const initialMessages: ChatMessage[] = [];

export const initialCheckins: Checkin[] = [];

export const initialWorkspaceConfig: WorkspaceConfig = {
  workspaceName: 'Unfounded Venture Lab',
  inviteCode: 'UVL-ALPHA-7702-SEC',
  secretKey: 'uvl_sec_9934f8e71b2a90021c7d82b4',
  restrictedMode: true,
  soundEnabled: true,
  pixelFontActive: true,
  dashboardWidgets: ['tasks', 'calendar', 'notes', 'mentions', 'pulse']
};
