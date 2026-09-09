import { User, Project, Task, CalendarEvent, Meeting, Note, FileItem, ChatChannel, ChatMessage, Checkin, WorkspaceConfig } from '../types';

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Jax Vance',
    handle: '@jax',
    role: 'admin',
    avatarEmblem: 'crosshair',
    avatarBg: '#1B1E23',
    avatarStitch: '#E5B869',
    callsign: 'VANCE-01',
    status: 'active',
    statusMessage: 'Reviewing Series-Seed term sheet for NeuralMesh',
    lastActive: 'Just now'
  },
  {
    id: 'u-2',
    name: 'Maya Lin',
    handle: '@maya',
    role: 'admin',
    avatarEmblem: 'chip',
    avatarBg: '#181E27',
    avatarStitch: '#4EC5D4',
    callsign: 'LIN-SYS',
    status: 'focus',
    statusMessage: 'Refactoring distributed consensus engine',
    lastActive: '5m ago'
  },
  {
    id: 'u-3',
    name: 'Alex Chen',
    handle: '@alex',
    role: 'member',
    avatarEmblem: 'radar',
    avatarBg: '#211C28',
    avatarStitch: '#9D7BFF',
    callsign: 'SCOUT-X',
    status: 'active',
    statusMessage: 'Scouting Tokyo AI hardware founders',
    lastActive: '12m ago'
  },
  {
    id: 'u-4',
    name: 'Priya Patel',
    handle: '@priya',
    role: 'member',
    avatarEmblem: 'bolt',
    avatarBg: '#17221C',
    avatarStitch: '#5EBA7D',
    callsign: 'PRIYA-P',
    status: 'reviewing',
    statusMessage: 'Auditing smart contract invariants for v2',
    lastActive: '30m ago'
  },
  {
    id: 'u-5',
    name: 'Marcus Cole',
    handle: '@marcus',
    role: 'member',
    avatarEmblem: 'dagger',
    avatarBg: '#281919',
    avatarStitch: '#E05A47',
    callsign: 'COLE-SEC',
    status: 'away',
    statusMessage: 'Offline: Airgapped key generation ceremony',
    lastActive: '2h ago'
  }
];

export const initialProjects: Project[] = [
  {
    id: 'p-1',
    name: 'Project Chimera',
    code: 'UVL-01',
    color: '#4EC5D4',
    description: 'Autonomous AI venture intelligence and market screening engine.'
  },
  {
    id: 'p-2',
    name: 'Blackbox Zero',
    code: 'UVL-02',
    color: '#E5B869',
    description: 'Tamper-resistant cryptographic hardware enclave for physical verification.'
  },
  {
    id: 'p-3',
    name: 'Venture Scout Q3',
    code: 'UVL-03',
    color: '#9D7BFF',
    description: 'Pipeline of deep-tech startups across robotics and next-gen silicon.'
  },
  {
    id: 'p-4',
    name: 'Patch Protocol',
    code: 'UVL-04',
    color: '#5EBA7D',
    description: 'Cryptographic NFC-embedded embroidered morale patches for physical access.'
  }
];

export const initialTasks: Task[] = [
  {
    id: 't-101',
    title: 'Finalize Zero-Knowledge audit report for Blackbox enclave',
    description: 'Complete formal verification of secure enclave bootloader. Ensure all tamper-detection hardware triggers wipe keys.',
    status: 'in_progress',
    priority: 'urgent',
    assigneeId: 'u-5',
    projectId: 'p-2',
    dueDate: '2026-09-12',
    createdAt: '2026-09-07',
    subtasks: [
      { id: 'st-1', title: 'Verify side-channel power analysis resistance', completed: true },
      { id: 'st-2', title: 'Review physical mesh tamper sensor triggers', completed: true },
      { id: 'st-3', title: 'Sign off on cryptographic erasure routine', completed: false }
    ],
    dependencies: [],
    tags: ['security', 'hardware', 'audit']
  },
  {
    id: 't-102',
    title: 'Deploy Chimera Agent v2.4 to testnet nodes',
    description: 'Migrate crawler clustering to low-latency edge nodes and benchmark transaction throughput.',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u-2',
    projectId: 'p-1',
    dueDate: '2026-09-14',
    createdAt: '2026-09-06',
    subtasks: [
      { id: 'st-4', title: 'Docker containerization and multi-arch build', completed: true },
      { id: 'st-5', title: 'Spin up 5 distributed validator nodes', completed: false },
      { id: 'st-6', title: 'Run stress test with 10k synthetic pitch decks', completed: false }
    ],
    dependencies: [],
    tags: ['ai', 'deployment', 'infra']
  },
  {
    id: 't-103',
    title: 'Compile Tokyo DeepTech founder dealflow pipeline',
    description: 'Organize notes from 14 founder meetings during Tokyo summit. Rank by defensibility and IP moat.',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u-3',
    projectId: 'p-3',
    dueDate: '2026-09-16',
    createdAt: '2026-09-08',
    subtasks: [
      { id: 'st-7', title: 'Transcribe audio memos into meeting summaries', completed: true },
      { id: 'st-8', title: 'Verify patent filings via JPO database', completed: false },
      { id: 'st-9', title: 'Draft top 3 investment memos for partner sync', completed: false }
    ],
    dependencies: [],
    tags: ['scouting', 'tokyo', 'dealflow']
  },
  {
    id: 't-104',
    title: 'Physical patch embroidery sample approval',
    description: 'Review physical textile proof of the Unfounded Venture Lab tactical patch with NFC chip embedded.',
    status: 'blocked',
    priority: 'high',
    assigneeId: 'u-4',
    projectId: 'p-4',
    dueDate: '2026-09-11',
    createdAt: '2026-09-05',
    subtasks: [
      { id: 'st-10', title: 'Confirm bone-cream thread match to Pantone #EDE8DB', completed: true },
      { id: 'st-11', title: 'Test NFC antenna resonance through 2mm cordura patch backing', completed: false }
    ],
    dependencies: ['t-101'],
    tags: ['merch', 'hardware', 'nfc']
  },
  {
    id: 't-105',
    title: 'Q3 LP Investor Update memo & capital deployment',
    description: 'Summarize deployment metrics, portfolio IRR, follow-on reserves, and new lab incubations.',
    status: 'done',
    priority: 'high',
    assigneeId: 'u-1',
    projectId: 'p-3',
    dueDate: '2026-09-08',
    createdAt: '2026-09-01',
    subtasks: [
      { id: 'st-12', title: 'Aggregate portfolio cash runways', completed: true },
      { id: 'st-13', title: 'Export cap table analytics', completed: true },
      { id: 'st-14', title: 'Send encrypted memo via Signal/DocSend', completed: true }
    ],
    dependencies: [],
    tags: ['investor', 'finance']
  }
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'ce-1',
    title: 'UVL All-Hands & Weekly Deal Flow War Room',
    description: 'Tactical alignment, pitch deck reviews, and hardware milestone check-ins.',
    date: '2026-09-10',
    startTime: '10:00',
    endTime: '11:30',
    category: 'meeting',
    projectId: 'p-3',
    attendeeIds: ['u-1', 'u-2', 'u-3', 'u-4', 'u-5'],
    location: 'Lab Room 01 / Secure Jitsi',
    sourceMeetingId: 'm-1'
  },
  {
    id: 'ce-2',
    title: 'Deep Architecture Sync: Chimera Node Clustering',
    description: 'Technical deep-dive on agent consensus with Maya and Marcus.',
    date: '2026-09-11',
    startTime: '14:00',
    endTime: '15:30',
    category: 'team',
    projectId: 'p-1',
    attendeeIds: ['u-2', 'u-5'],
    location: 'Engineering Pod 2'
  },
  {
    id: 'ce-3',
    title: 'Personal: Airgap Key Sign-off',
    description: 'Marcus personal task: Hardware verification and key burning ceremony.',
    date: '2026-09-12',
    startTime: '09:00',
    endTime: '12:00',
    category: 'personal',
    memberId: 'u-5',
    location: 'Vault Room B'
  },
  {
    id: 'ce-4',
    title: 'Deadline: Patch Embroidery Sample Sign-off',
    description: 'Task deadline auto-synced from Task Board.',
    date: '2026-09-11',
    startTime: '17:00',
    endTime: '18:00',
    category: 'task_deadline',
    projectId: 'p-4',
    sourceTaskId: 't-104'
  },
  {
    id: 'ce-5',
    title: 'Founder Pitch: Silicon Photonics Node (Stealth)',
    description: 'Pitch session with MIT spinout founders building optical AI interconnects.',
    date: '2026-09-14',
    startTime: '16:00',
    endTime: '17:00',
    category: 'meeting',
    projectId: 'p-3',
    attendeeIds: ['u-1', 'u-3'],
    location: 'Boardroom / Zoom',
    sourceMeetingId: 'm-2'
  }
];

export const initialMeetings: Meeting[] = [
  {
    id: 'm-1',
    title: 'UVL All-Hands & Weekly Deal Flow War Room',
    date: '2026-09-10',
    time: '10:00 AM',
    duration: '90 min',
    attendeeIds: ['u-1', 'u-2', 'u-3', 'u-4', 'u-5'],
    agenda: [
      'Tokyo DeepTech founder pipeline review (Alex)',
      'Blackbox Zero cryptographic verification timeline (Marcus)',
      'Chimera agent latency benchmarks (Maya)',
      'Patch protocol physical delivery dates (Priya)',
      'Allocation of $2.5M reserve for Q4'
    ],
    notes: `### Tactical Summary
- Alex reviewed 14 startups in Tokyo. Top contender: **PhotonMatrix** (optics interconnects).
- Marcus confirmed the enclave bootloader passes static analysis; physical tamper tests scheduled for Vault B.
- Maya demonstrated Chimera Agent v2.4 screening 500 whitepapers in under 4 minutes.
- Priya received first batch of tactical embroidered patches; NFC antenna tuning is underway.

### Recorded Action Items
1. Alex to draft investment memo for PhotonMatrix by Friday
2. Marcus to verify side-channel analysis report
3. Maya to deploy Chimera v2.4 to testnet cluster
4. Priya to confirm NFC antenna resonance through patch fabric`,
    actionItems: [
      { id: 'ai-1', text: 'Draft investment memo for PhotonMatrix', assignedTo: 'u-3', dueDate: '2026-09-13', convertedToTaskId: undefined },
      { id: 'ai-2', text: 'Verify side-channel analysis report for enclave', assignedTo: 'u-5', dueDate: '2026-09-12', convertedToTaskId: 't-101' },
      { id: 'ai-3', text: 'Deploy Chimera v2.4 to testnet cluster', assignedTo: 'u-2', dueDate: '2026-09-14', convertedToTaskId: 't-102' },
      { id: 'ai-4', text: 'Confirm NFC antenna resonance through patch fabric', assignedTo: 'u-4', dueDate: '2026-09-11', convertedToTaskId: 't-104' }
    ],
    link: 'https://meet.unfoundedlab.internal/room/all-hands'
  },
  {
    id: 'm-2',
    title: 'Founder Pitch: Silicon Photonics Node (Stealth)',
    date: '2026-09-14',
    time: '4:00 PM',
    duration: '60 min',
    attendeeIds: ['u-1', 'u-3'],
    agenda: [
      'Team background & IP transfer from university',
      'Demonstration of sub-picosecond optical waveguide switching',
      'Cap table review and valuation expectations ($18M pre)',
      'Lab testing access & verification protocols'
    ],
    notes: `Pre-meeting dossier:
- Founders previously authored key IEEE papers on silicon photonics.
- Prototype operating at 800 Gbps with 10x lower thermal dissipation than copper.
- Next steps: Review technical data room before term sheet submission.`,
    actionItems: [
      { id: 'ai-5', text: 'Obtain data room access and assign Maya to technical due diligence', assignedTo: 'u-1', dueDate: '2026-09-15' }
    ]
  }
];

export const initialNotes: Note[] = [
  {
    id: 'n-1',
    title: 'Unfounded Venture Lab: Operating Principles & Manifesto',
    content: `# Unfounded Venture Lab — Doctrine

1. **Hostile Environment Software**: We assume the environment is always hostile, observing, and adversarial. Systems must be self-verifying.
2. **Speed Over Bureaucracy**: Fast, high-frequency, low-latency execution. No multi-layer corporate approval chains.
3. **Physical-Digital Convergence**: High-tech software paired with tangible tactical morale patches. Wear your access.
4. **Autonomous Leverage**: Use AI agents (Chimera) to automate 90% of manual data gathering, reserving human bandwidth for high-conviction decisions.`,
    type: 'team_wiki',
    authorId: 'u-1',
    projectId: 'p-1',
    tags: ['doctrine', 'manifesto', 'culture'],
    pinned: true,
    updatedAt: '2026-09-08'
  },
  {
    id: 'n-2',
    title: 'Blackbox Zero: Enclave Bootloader Spec',
    content: `## Architecture Overview
- RISC-V customized core with hardware PUF (Physically Unclonable Function).
- Zero plain-text secrets in RAM; hardware AES-256-GCM memory encryption engine.
- Tamper switches trigger instant charge-dump capacitor to fry secret key registers within 12 nanoseconds.`,
    type: 'team_wiki',
    authorId: 'u-5',
    projectId: 'p-2',
    tags: ['spec', 'crypto', 'hardware'],
    pinned: true,
    updatedAt: '2026-09-07'
  },
  {
    id: 'n-3',
    title: 'Scout Memo: Optical Computing Landscape Q3',
    content: `Brief thoughts from Tokyo meetings:
- Traditional GPU clusters are hitting thermal wall at 1000W per board.
- Optical interconnects (silicon photonics) are 24-36 months away from mainstream enterprise adoption.
- Recommend putting down lead checks in 2 foundational hardware teams before end of year.`,
    type: 'personal',
    authorId: 'u-3',
    projectId: 'p-3',
    tags: ['dealflow', 'hardware', 'tokyo'],
    pinned: false,
    updatedAt: '2026-09-09'
  },
  {
    id: 'n-4',
    title: 'Brain Dump: Patch V2 Antenna Geometry',
    content: `Quick thought: The 45-degree chamfered corners on our patch badge leave ~3mm dead-zone at the edges.
We can route the spiral NFC coil along the overlock stitched border so the whole patch acts as a directional antenna!`,
    type: 'quick_capture',
    authorId: 'u-4',
    projectId: 'p-4',
    tags: ['rfid', 'antenna', 'ideas'],
    pinned: false,
    updatedAt: '2026-09-09'
  }
];

export const initialFiles: FileItem[] = [
  {
    id: 'f-1',
    name: 'UVL_Tactical_Patch_Master_Vector.svg',
    size: '1.4 MB',
    type: 'image/svg+xml',
    projectId: 'p-4',
    folder: 'Brand & Merch',
    uploadedBy: 'u-4',
    uploadedAt: '2026-09-05 14:22',
    version: 3,
    versions: [
      { version: 1, uploadedAt: '2026-08-20 11:10', size: '1.1 MB', notes: 'Initial rectangle badge concept' },
      { version: 2, uploadedAt: '2026-08-28 16:45', size: '1.3 MB', notes: 'Added 45-degree chamfered corners' },
      { version: 3, uploadedAt: '2026-09-05 14:22', size: '1.4 MB', notes: 'Matched exact blocky pixel serif typography and stitched outline' }
    ]
  },
  {
    id: 'f-2',
    name: 'Blackbox_Zero_Cryptographic_Audit_v1.pdf',
    size: '4.8 MB',
    type: 'application/pdf',
    projectId: 'p-2',
    folder: 'Security Audits',
    uploadedBy: 'u-5',
    uploadedAt: '2026-09-07 09:15',
    version: 2,
    versions: [
      { version: 1, uploadedAt: '2026-09-01 10:00', size: '3.9 MB', notes: 'Preliminary static analysis' },
      { version: 2, uploadedAt: '2026-09-07 09:15', size: '4.8 MB', notes: 'Added PUF fuzzing and tamper-response trace logs' }
    ]
  },
  {
    id: 'f-3',
    name: 'Chimera_Agent_Benchmarking_Telemetry.csv',
    size: '820 KB',
    type: 'text/csv',
    projectId: 'p-1',
    folder: 'Telemetry',
    uploadedBy: 'u-2',
    uploadedAt: '2026-09-08 19:30',
    version: 1,
    versions: [
      { version: 1, uploadedAt: '2026-09-08 19:30', size: '820 KB', notes: 'Latency distribution across 5k documents' }
    ]
  },
  {
    id: 'f-4',
    name: 'UVL_Fund_I_Quarterly_Memo_Q3.pdf',
    size: '2.2 MB',
    type: 'application/pdf',
    projectId: 'p-3',
    folder: 'LP Relations',
    uploadedBy: 'u-1',
    uploadedAt: '2026-09-08 11:00',
    version: 1,
    versions: [
      { version: 1, uploadedAt: '2026-09-08 11:00', size: '2.2 MB', notes: 'Final sign-off by partners' }
    ]
  }
];

export const initialChannels: ChatChannel[] = [
  {
    id: 'ch-general',
    name: 'general-command',
    description: 'Workspace-wide tactical updates, check-ins, and announcements.',
    isPrivate: false,
    isDm: false
  },
  {
    id: 'ch-chimera',
    name: 'chimera-ai-lab',
    description: 'Autonomous research agents, node telemetry, model weights.',
    isPrivate: false,
    isDm: false
  },
  {
    id: 'ch-dealflow',
    name: 'deal-flow-scout',
    description: 'Pitch decks, founder notes, market sizing, investment memos.',
    isPrivate: false,
    isDm: false
  },
  {
    id: 'ch-hardware',
    name: 'hardware-vault',
    description: 'Blackbox Zero enclave, PCB gerbers, silicon fab notes.',
    isPrivate: true,
    isDm: false
  },
  {
    id: 'dm-jax-maya',
    name: 'Jax & Maya (DM)',
    description: 'Direct communication between Jax Vance and Maya Lin.',
    isPrivate: true,
    isDm: true,
    memberIds: ['u-1', 'u-2']
  }
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-general',
    senderId: 'u-1',
    text: 'Good morning lab team. Remember All-Hands war room is at 10:00 AM. Review the agenda beforehand in the Meetings module.',
    timestamp: 'Today at 08:45',
    pinned: true,
    replyCount: 2,
    mentions: [],
    reactions: [
      { emoji: '⚡', userIds: ['u-2', 'u-3', 'u-4'] }
    ]
  },
  {
    id: 'msg-2',
    channelId: 'ch-general',
    senderId: 'u-2',
    text: '@jax Chimera v2.4 cluster is passing 99.4% of synthetic investment memo tests. Benchmarks look stellar.',
    timestamp: 'Today at 09:12',
    pinned: false,
    replyCount: 0,
    mentions: ['@jax'],
    reactions: [
      { emoji: '🚀', userIds: ['u-1'] }
    ]
  },
  {
    id: 'msg-3',
    channelId: 'ch-general',
    senderId: 'u-4',
    text: 'Physical patch proof samples just arrived from the Tokyo embroidery mill! Bone-cream thread on charcoal twill looks insanely sharp.',
    timestamp: 'Today at 09:25',
    pinned: true,
    replyCount: 1,
    mentions: [],
    reactions: [
      { emoji: '🔥', userIds: ['u-1', 'u-3', 'u-5'] }
    ]
  },
  {
    id: 'msg-4',
    channelId: 'ch-dealflow',
    senderId: 'u-3',
    text: '@priya Can you review the token economics section of the PhotonMatrix whitepaper when free? They claim 0 transaction overhead.',
    timestamp: 'Today at 09:30',
    pinned: false,
    replyCount: 0,
    mentions: ['@priya'],
    reactions: []
  },
  {
    id: 'msg-5',
    channelId: 'ch-hardware',
    senderId: 'u-5',
    text: 'Zero-knowledge audit tests passed. Marcus is entering airgap room for key ceremony.',
    timestamp: 'Today at 09:40',
    pinned: false,
    replyCount: 0,
    mentions: [],
    reactions: [
      { emoji: '🔒', userIds: ['u-1', 'u-2'] }
    ]
  }
];

export const initialCheckins: Checkin[] = [
  {
    id: 'chk-1',
    userId: 'u-1',
    date: '2026-09-09',
    completedToday: 'Sent Q3 LP update memo. Prepared partner review for Tokyo startups.',
    workingOnNext: 'Host war room meeting and finalize allocation limits.',
    blockers: 'None right now. Ready for deal closure.',
    mood: '⚡ Hyper',
    timestamp: '09:00'
  },
  {
    id: 'chk-2',
    userId: 'u-2',
    date: '2026-09-09',
    completedToday: 'Ran 10k document stress test on Chimera agent testnet.',
    workingOnNext: 'Tune vector index recall accuracy and deploy v2.4 image.',
    blockers: 'Awaiting AWS GPU cluster quota increase for validator cluster.',
    mood: '🟢 Good',
    timestamp: '09:15'
  },
  {
    id: 'chk-3',
    userId: 'u-3',
    date: '2026-09-09',
    completedToday: 'Interviewed 3 robotics founders in Akihabara. Logged deal memos.',
    workingOnNext: 'Compile comparative matrix of optical vs quantum AI accelerators.',
    blockers: 'None.',
    mood: '🟢 Good',
    timestamp: '09:20'
  },
  {
    id: 'chk-4',
    userId: 'u-4',
    date: '2026-09-09',
    completedToday: 'Inspected physical embroidery patches from sample mill.',
    workingOnNext: 'Calibrate NFC loop antenna impedance matching with analyzer.',
    blockers: 'Waiting on Marcus to supply airgapped key chip for embedded demo.',
    mood: '🟡 Grinding',
    timestamp: '09:35'
  },
  {
    id: 'chk-5',
    userId: 'u-5',
    date: '2026-09-09',
    completedToday: 'Executed tamper-response capacitor tests on Blackbox Zero board.',
    workingOnNext: 'Enter Vault B for airgapped root-of-trust key burning ceremony.',
    blockers: 'Requires two admin physical keys present (Jax and Marcus).',
    mood: '🔴 Blocked',
    timestamp: '09:45'
  }
];

export const initialWorkspaceConfig: WorkspaceConfig = {
  workspaceName: 'Unfounded Venture Lab',
  inviteCode: 'UVL-ALPHA-7702-SEC',
  secretKey: 'uvl_sec_9934f8e71b2a90021c7d82b4',
  restrictedMode: true,
  soundEnabled: true,
  pixelFontActive: true,
  dashboardWidgets: ['tasks', 'calendar', 'notes', 'mentions', 'pulse']
};
