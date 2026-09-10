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

export const initialExpenses: import('../types').Expense[] = [
  {
    id: 'exp-1',
    amount: 1420.00,
    currency: 'USD',
    category: 'Software',
    date: '2026-09-02',
    paymentMethod: 'Corporate Card',
    vendor: 'Amazon Web Services (AWS)',
    description: 'Dedicated GPU clusters & high-throughput compute infrastructure',
    submittedBy: 'u-1',
    receiptName: 'aws-invoice-sep2026.pdf',
    status: 'approved',
    approvedBy: 'u-1',
    approvedAt: '2026-09-03 10:15',
    createdAt: '2026-09-02 18:30'
  },
  {
    id: 'exp-2',
    amount: 450.00,
    currency: 'USD',
    category: 'Legal',
    date: '2026-09-05',
    paymentMethod: 'Bank Wire',
    vendor: 'Delaware Division of Corporations',
    description: 'Annual corporate franchise franchise tax & legal compliance filing',
    submittedBy: 'u-1',
    receiptName: 'delaware-state-filing.pdf',
    status: 'approved',
    approvedBy: 'u-1',
    approvedAt: '2026-09-05 14:00',
    createdAt: '2026-09-05 11:20'
  },
  {
    id: 'exp-3',
    amount: 280.00,
    currency: 'USD',
    category: 'Travel',
    date: '2026-09-07',
    paymentMethod: 'Personal Card',
    vendor: 'Delta Air Lines',
    description: 'Founder investor roadshow round-trip flight tickets',
    submittedBy: 'u-1',
    receiptName: 'delta-boarding-pass.pdf',
    status: 'pending',
    createdAt: '2026-09-07 09:40'
  },
  {
    id: 'exp-4',
    amount: 199.00,
    currency: 'USD',
    category: 'Software',
    date: '2026-09-08',
    paymentMethod: 'Corporate Card',
    vendor: 'GitHub Enterprise',
    description: '2026 seat licenses & CI/CD deployment runner minutes',
    submittedBy: 'u-2',
    receiptName: 'github-sub-invoice.pdf',
    status: 'approved',
    approvedBy: 'u-1',
    approvedAt: '2026-09-08 16:45',
    createdAt: '2026-09-08 12:10'
  },
  {
    id: 'exp-5',
    amount: 650.00,
    currency: 'USD',
    category: 'Hardware',
    date: '2026-09-09',
    paymentMethod: 'Reimbursement',
    vendor: 'DigiKey Electronics',
    description: 'Microcontroller units, FPGA prototyping boards & sensor test kits',
    submittedBy: 'u-3',
    receiptName: 'digikey-parts-receipt.jpg',
    status: 'pending',
    createdAt: '2026-09-09 17:05'
  }
];

export const initialInvestors: import('../types').Investor[] = [
  {
    id: 'inv-1',
    name: 'Elena Rostova',
    firm: 'Apex Frontier Capital',
    email: 'elena@apexfrontier.vc',
    phone: '+1 (415) 890-3412',
    website: 'https://apexfrontier.vc',
    relationshipOwnerId: 'u-1',
    stage: 'term_sheet',
    dealSize: 750000,
    valuation: 6500000,
    roundType: 'Seed',
    targetCloseDate: '2026-09-30',
    lastInteractionDate: '2026-09-08',
    nextFollowUpDate: '2026-09-12',
    notes: 'Strong alignment with autonomous systems architecture. Issued non-binding Term Sheet with favorable liquidation terms.',
    interactions: [
      {
        id: 'int-1',
        date: '2026-08-20',
        type: 'Video Call',
        summary: 'Introductory partner meeting covering product architecture and team clearances.',
        authorId: 'u-1',
        timestamp: '2026-08-20 16:00'
      },
      {
        id: 'int-2',
        date: '2026-09-04',
        type: 'Pitch',
        summary: 'Full partner presentation. Discussed defensibility and autonomous agentic workflows.',
        authorId: 'u-1',
        timestamp: '2026-09-04 11:30'
      },
      {
        id: 'int-3',
        date: '2026-09-08',
        type: 'Due Diligence',
        summary: 'Reviewed data room, engineering telemetry, and Delaware corporate structure.',
        authorId: 'u-1',
        timestamp: '2026-09-08 14:20'
      }
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'UVL_Seed_Term_Sheet_Apex_Draft.pdf',
        url: '',
        type: 'application/pdf',
        version: 2,
        uploadedAt: '2026-09-08',
        uploadedBy: 'u-1'
      }
    ],
    createdAt: '2026-08-15'
  },
  {
    id: 'inv-2',
    name: 'Marcus Vance',
    firm: 'Horizon Deep Tech Partners',
    email: 'm.vance@horizondeeptech.com',
    phone: '+1 (650) 412-9901',
    website: 'https://horizondeeptech.com',
    relationshipOwnerId: 'u-1',
    stage: 'due_diligence',
    dealSize: 500000,
    valuation: 6000000,
    roundType: 'Seed',
    targetCloseDate: '2026-10-15',
    lastInteractionDate: '2026-09-07',
    nextFollowUpDate: '2026-09-14',
    notes: 'Technical due diligence ongoing. Deeply interested in Supabase-backed event-driven architecture.',
    interactions: [
      {
        id: 'int-4',
        date: '2026-09-01',
        type: 'Video Call',
        summary: 'Technical architecture deep dive with Saai and Harish.',
        authorId: 'u-1',
        timestamp: '2026-09-01 15:00'
      },
      {
        id: 'int-5',
        date: '2026-09-07',
        type: 'Email',
        summary: 'Requested access to code obfuscation audit and security guarantees.',
        authorId: 'u-1',
        timestamp: '2026-09-07 10:45'
      }
    ],
    documents: [],
    createdAt: '2026-08-28'
  },
  {
    id: 'inv-3',
    name: 'Sarah Lin',
    firm: 'Beacon Syndicate',
    email: 'sarah@beaconsyndicate.io',
    phone: '+1 (212) 773-1029',
    relationshipOwnerId: 'u-2',
    stage: 'meeting_scheduled',
    dealSize: 250000,
    valuation: 5500000,
    roundType: 'SAFE',
    targetCloseDate: '2026-10-30',
    lastInteractionDate: '2026-09-06',
    nextFollowUpDate: '2026-09-15',
    notes: 'Intro from campus network. Scheduled preliminary demo for upcoming sprint cycle.',
    interactions: [
      {
        id: 'int-6',
        date: '2026-09-06',
        type: 'Email',
        summary: 'Initial connection via AngelList. Confirmed demo call time.',
        authorId: 'u-2',
        timestamp: '2026-09-06 18:10'
      }
    ],
    documents: [],
    createdAt: '2026-09-05'
  }
];

export const initialAgentLogs: import('../types').AgentActivityLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-09-10 09:00:15',
    actionType: 'Cross-Module Synthesis',
    targetEntity: 'Tasks & Notes Enclave',
    reasoning: 'Autonomous morning scan: Identified 2 upcoming investor follow-up deadlines and 2 unreviewed expense receipts.',
    status: 'success',
    rollbackAvailable: false
  },
  {
    id: 'log-2',
    timestamp: '2026-09-10 11:30:42',
    actionType: 'Task Auto-Generation',
    targetEntity: 'Tasks Kanban / Apex Term Sheet',
    reasoning: 'Scheduled follow-up reminder for Elena Rostova term sheet review; created linked priority task for Vijayrajkumar.',
    status: 'success',
    rollbackAvailable: true,
    rollbackData: { type: 'task', title: 'Review Apex Term Sheet draft' }
  }
];

export const initialAgentReports: import('../types').AgentReport[] = [
  {
    id: 'rep-1',
    type: 'weekly',
    title: 'Executive Weekly Synthesis — Sprint Cycle 36',
    period: 'Sep 03, 2026 – Sep 10, 2026',
    generatedAt: '2026-09-10 08:30:00',
    summary: 'High operational velocity across hardware and cloud infrastructure. $1.5M in active investor pipeline with Apex Term Sheet in final review.',
    content: `# Executive Weekly Synthesis — Sprint Cycle 36
**Period**: Sep 03 – Sep 10, 2026  
**Author**: UVL Sentinel AI Agent (Gemini 3.6 Flash Engine)

### Key Milestones & Accomplishments
1. **Investor Pipeline Velocity**: Advanced **Apex Frontier Capital** to *Term Sheet* ($750K commitment at $6.5M pre-money valuation). Horizon Deep Tech initiated technical audit.
2. **Infrastructure & Burn**: Total operational spend for period: **$2,999.00 USD**. 3 items approved, 2 pending reimbursement review.
3. **Core Development**: Enforced uniform Grotesk typography system, mobile responsive navigation shell, and live Supabase multimedia storage enclaves.

### Active Risks & Blockers
- **Hardware Sourcing**: DigiKey parts order pending reimbursement verification ($650.00).
- **Investor Inactivity**: Sarah Lin demo scheduled; follow-up prep required by relationship owner (Saai).

### Recommendations
- Close legal review of Apex Seed Term Sheet before Friday close.
- Audit monthly cloud spend to prepare for expanded student beta.`,
    highlights: [
      'Apex Frontier Capital issued $750K Seed Term Sheet',
      'Supabase multimedia storage and vault enclaves verified live',
      'Mobile touch-optimized navigation shell deployed'
    ],
    risks: [
      'DigiKey hardware receipt awaiting expense sign-off ($650.00)',
      'Follow-up due in 48h with Horizon Deep Tech on code obfuscation'
    ],
    metrics: {
      tasksCompleted: 14,
      totalSpend: 2999.00,
      activeLeads: 3,
      sentimentScore: '⚡ Hyper / 94%'
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

