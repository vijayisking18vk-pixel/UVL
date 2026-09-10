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

export const initialAgentLogs: import('../types').AgentActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-10 09:00:15',
    actionType: 'System Diagnostics',
    targetEntity: 'Command Enclaves',
    reasoning: 'Autonomous scan initialized: Telemetry online, currency standardized to INR (₹), enclaves awaiting operator input.',
    status: 'success',
    rollbackAvailable: false
  }
];

export const initialAgentReports: import('../types').AgentReport[] = [
  {
    id: 'rep-1',
    type: 'weekly',
    title: 'Executive Weekly Synthesis — System Baseline',
    period: 'Current Sprint Cycle',
    generatedAt: '2026-09-10 08:30:00',
    summary: 'Command center initialized with zero expense burn and clean investor deal pipeline ready for live operations.',
    content: `# Executive Weekly Synthesis — System Baseline
**Period**: Current Sprint Cycle  
**Author**: UVL Sentinel AI Agent (Gemini 3.6 Flash Engine)

### Key Milestones & Accomplishments
1. **Core Development**: Enforced uniform Grotesk typography system, mobile responsive navigation shell, and live Supabase multimedia storage enclaves.
2. **Infrastructure**: Supabase database connected and operational.
3. **Financial Tracking**: Expense tracker and Investor CRM active in Indian Rupees (₹ INR).

### Active Status
- Operational spend: **₹0.00 INR**.
- Active pipeline: **₹0.00 INR**. Ready to log new institutional leads and expense vouchers.`,
    highlights: [
      'Supabase multimedia storage and vault enclaves verified live',
      'Mobile touch-optimized navigation shell deployed',
      'Financial systems configured in Indian Rupees (₹ INR)'
    ],
    risks: [],
    metrics: {
      tasksCompleted: 14,
      totalSpend: 0,
      activeLeads: 0,
      sentimentScore: '⚡ Operational / 100%'
    }
  }
];

export const initialAgentConfig: import('../types').AgentConfig = {
  name: 'UVL Sentinel',
  callsign: 'SENTINEL-AI',
  autonomousMode: true,
  requireApprovalForSensitive: true,
  announcementsChannelId: 'ch-agent-reports',
  activeModel: 'gemini-3.6-flash'
};

