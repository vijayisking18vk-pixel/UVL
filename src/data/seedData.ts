import { User, Project, Task, CalendarEvent, Meeting, Note, FileItem, ChatChannel, ChatMessage, Checkin, WorkspaceConfig } from '../types';

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Vijayrajkumar',
    handle: '@vijayrajkumar',
    role: 'member',
    avatarUrl: '/avatars/vijayrajkumar.png',
    avatarEmblem: 'crosshair',
    avatarBg: '#1C2128',
    avatarStitch: '#A1A1AA',
    callsign: 'VIJAY-01',
    pin: '1001',
    status: 'active',
    statusMessage: '',
    lastActive: 'Just now'
  },
  {
    id: 'u-2',
    name: 'Saai',
    handle: '@saai',
    role: 'member',
    avatarUrl: '/avatars/saai.jpg',
    avatarEmblem: 'chip',
    avatarBg: '#182229',
    avatarStitch: '#4EC5D4',
    callsign: 'SAAI-02',
    pin: '1002',
    status: 'active',
    statusMessage: '',
    lastActive: '5m ago'
  },
  {
    id: 'u-3',
    name: 'Harish',
    handle: '@harish',
    role: 'member',
    avatarUrl: '/avatars/harish.png',
    avatarEmblem: 'radar',
    avatarBg: '#211C28',
    avatarStitch: '#9D7BFF',
    callsign: 'HARISH-03',
    pin: '1003',
    status: 'active',
    statusMessage: '',
    lastActive: '12m ago'
  },
  {
    id: 'u-4',
    name: 'Subanesh',
    handle: '@subanesh',
    role: 'member',
    avatarUrl: '/avatars/subanesh.png',
    avatarEmblem: 'bolt',
    avatarBg: '#17241C',
    avatarStitch: '#5EBA7D',
    callsign: 'SUBA-04',
    pin: '1004',
    status: 'active',
    statusMessage: '',
    lastActive: '25m ago'
  },
  {
    id: 'u-5',
    name: 'Vinayak',
    handle: '@vinayak',
    role: 'member',
    avatarUrl: '/avatars/vinayak.png',
    avatarEmblem: 'dagger',
    avatarBg: '#291818',
    avatarStitch: '#E05A47',
    callsign: 'VINA-05',
    pin: '1005',
    status: 'active',
    statusMessage: '',
    lastActive: '40m ago'
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
  },
  {
    id: 'ch-agent-reports',
    name: 'agent-reports',
    description: 'Autonomous AI task executor logs, audits, and periodic reports',
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

export const initialExpenses: import('../types').Expense[] = [];

export const initialInvestors: import('../types').Investor[] = [];

export const initialHackathons: import('../types').HackathonEvent[] = [];

export const initialAgentLogs: import('../types').AgentActivityLog[] = [];

export const initialAgentReports: import('../types').AgentReport[] = [];

export const initialAgentConfig: import('../types').AgentConfig = {
  name: 'Unfoundy',
  callsign: 'UNFOUNDY-AI',
  autonomousMode: true,
  requireApprovalForSensitive: false,
  announcementsChannelId: 'ch-agent-reports',
  activeModel: 'gemini-2.5-flash'
};

export const initialAgentChatMessages: import('../types').AgentChatMessage[] = [
  {
    id: 'msg-agent-init',
    sender: 'assistant',
    text: `Hello, I'm **Unfoundy**, the autonomous AI execution engine for Unfounded Venture Lab.

I operate with **full direct authority** across all UVL enclaves — **zero admin approval required**.

Give me any directive and I will execute it directly:
- **Tasks**: *"Create a task to review motor telemetry with urgent priority"*
- **Calendar**: *"Schedule investor sync tomorrow at 3 PM"*
- **Treasury**: *"Record expense of ₹15,000 for AWS cloud"* or *"Log earning of ₹5,00,000 from client Alpha Corp"*
- **Notes & Wiki**: *"Write a note on Delaware compliance"*
- **Intelligence**: *"What is our treasury balance and sprint status?"*

How can I assist you right now?`,
    timestamp: 'Online'
  }
];

