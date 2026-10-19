export type Role =
  | 'Chief Operating Officer'
  | 'Chief Marketing Officer'
  | 'Chief Product Officer'
  | 'Chief Executive Officer'
  | 'Chief Financial Officer'
  | 'admin'
  | 'member'
  | string;

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
  assigneeIds?: string[]; // Multiple assignees support
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
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | 'audio';
  attachmentName?: string;
  attachmentSize?: string;
  audioDuration?: string;
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
  hoursWorked?: number;
  minutesWorked?: number;
  startTime?: string;
  endTime?: string;
}

export interface HorizonTelemetry {
  totalMinutes: number;
  hours: number;
  minutes: number;
  seconds?: number;
  formatted: string;
}

export interface TimeTelemetry {
  today: HorizonTelemetry;
  week: HorizonTelemetry;
  month: HorizonTelemetry;
  year: HorizonTelemetry;
  activeSessionDuration: string;
  isCheckedIn: boolean;
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

// ==========================================
// MONEY TRACKER & TREASURY TYPES (EARNINGS & EXPENSES)
// ==========================================
export type MoneyTransactionType = 'expense' | 'earning';

export type ExpenseCategory =
  | 'Software'
  | 'Travel'
  | 'Legal'
  | 'Marketing'
  | 'Payroll'
  | 'Hardware'
  | 'Office'
  | 'Misc';

export type EarningCategory =
  | 'Client Retainer'
  | 'Pilot Project'
  | 'SaaS Subscription'
  | 'Government Grant'
  | 'Consulting'
  | 'Angel / SAFE'
  | 'Product Sales'
  | 'Licensing'
  | 'Misc Inflow';

export type MoneyCategory = ExpenseCategory | EarningCategory;

export type ExpenseStatus = 'pending' | 'approved' | 'reimbursed' | 'rejected';

export type PaymentMethod =
  | 'Corporate Card'
  | 'Bank Wire'
  | 'UPI'
  | 'Personal Card'
  | 'Cash'
  | 'Reimbursement'
  | 'Cheque / Draft';

export interface Expense {
  id: string;
  type?: MoneyTransactionType; // 'expense' (default) | 'earning'
  amount: number;
  currency: string;
  category: string; // ExpenseCategory | EarningCategory
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  vendor: string; // Payee for expense, Client / Payer / Source for earning
  description: string;
  submittedBy: string; // user ID
  receiptUrl?: string; // invoice or receipt
  receiptName?: string;
  status: ExpenseStatus;
  approverComment?: string;
  approvedBy?: string; // user ID
  approvedAt?: string;
  createdAt: string;
}

export type MoneyTransaction = Expense;

// ==========================================
// INVESTOR TRACKING TYPES
// ==========================================
export type InvestorStage =
  | 'contacted'
  | 'meeting_scheduled'
  | 'pitched'
  | 'due_diligence'
  | 'term_sheet'
  | 'committed'
  | 'closed'
  | 'passed';

export type InvestorRoundType =
  | 'Pre-Seed'
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'SAFE'
  | 'Convertible Note';

export interface InvestorInteraction {
  id: string;
  date: string;
  type: 'Email' | 'Video Call' | 'In-Person' | 'Pitch' | 'Due Diligence';
  summary: string;
  authorId: string;
  timestamp: string;
}

export interface InvestorDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Investor {
  id: string;
  name: string;
  firm: string;
  email: string;
  phone?: string;
  website?: string;
  avatarUrl?: string;
  relationshipOwnerId: string; // user ID
  stage: InvestorStage;
  dealSize: number; // e.g. 250000
  valuation?: number; // e.g. 5000000
  roundType: InvestorRoundType;
  targetCloseDate?: string;
  lastInteractionDate: string;
  nextFollowUpDate?: string;
  notes: string;
  remarks?: string;
  interactions: InvestorInteraction[];
  documents: InvestorDocument[];
  createdAt: string;
}

// ==========================================
// AGENTIC AI TASK EXECUTOR TYPES
// ==========================================
export type AgentTaskStatus =
  | 'planning'
  | 'pending_approval'
  | 'executing'
  | 'completed'
  | 'failed';

export interface AgentActionStep {
  id: string;
  stepNumber: number;
  title: string;
  targetModule: 'tasks' | 'calendar' | 'notes' | 'files' | 'chat' | 'investors' | 'expenses';
  actionType: string;
  details: Record<string, any>;
  reasoning: string;
  status: 'pending' | 'approved' | 'executed' | 'skipped' | 'failed';
  requiresHumanApproval: boolean;
}

export interface AgentTask {
  id: string;
  prompt: string;
  status: AgentTaskStatus;
  createdAt: string;
  completedAt?: string;
  sourceTaskId?: string;
  plan: AgentActionStep[];
  resultSummary?: string;
}

export interface AgentActivityLog {
  id: string;
  timestamp: string;
  actionType: string;
  targetEntity: string;
  reasoning: string;
  status: 'success' | 'warning' | 'rolled_back';
  rollbackAvailable: boolean;
  rollbackData?: Record<string, any>;
}

export interface AgentReport {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  title: string;
  period: string;
  generatedAt: string;
  summary: string;
  content: string; // Markdown formatted report
  highlights: string[];
  risks: string[];
  metrics: {
    tasksCompleted: number;
    totalSpend: number;
    activeLeads: number;
    sentimentScore: string;
  };
}

export interface AgentConfig {
  name: string;
  callsign: string;
  autonomousMode: boolean; // true = execute non-destructive steps automatically
  requireApprovalForSensitive: boolean; // false = direct execution, zero approval required
  announcementsChannelId: string;
  activeModel: string;
}

export interface AgentExecutedAction {
  id: string;
  module: 'tasks' | 'calendar' | 'notes' | 'chat' | 'investors' | 'expenses';
  action: string;
  summary: string;
}

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  executedActions?: AgentExecutedAction[];
}

// ==========================================
// HACKATHONS & COMPETITIVE EVENTS TYPES
// ==========================================
export type HackathonStatus =
  | 'Upcoming'
  | 'Registered'
  | 'In Progress'
  | 'Submitted'
  | 'Finalist'
  | 'Winner'
  | 'Completed';

export type EventType =
  | 'Hackathon'
  | 'Demo Day'
  | 'Pitch Competition'
  | 'Conference'
  | 'Grant Program'
  | 'Accelerator';

export interface EventAttachment {
  id: string;
  name: string;
  url: string;
  type: string; // 'document' | 'link' | 'image' | 'certificate'
  uploadedAt: string;
  uploadedBy: string;
}

export type HackathonAttachment = EventAttachment;

export interface HackathonEvent {
  id: string;
  title: string;
  type: EventType;
  organizer: string;
  location: string;
  startDate: string;
  endDate: string;
  status: HackathonStatus;
  projectName: string;
  projectDescription: string;
  demoUrl?: string;
  repoUrl?: string;
  presentationUrl?: string;
  awardPrize?: string;
  participantIds: string[];
  remarks: string;
  attachments: EventAttachment[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// UVL DOCUMENTS (DOCSEND-INSPIRED) TYPES
// ==========================================
export type DocumentStatus = 'processing' | 'ready' | 'failed' | 'archived';

export interface UVLDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storagePath: string;
  fileName: string;
  fileSize: number;
  totalPages: number;
  pageDimensions?: { width: number; height: number }[];
  uploadedBy: string;
  changelog?: string;
  createdAt: string;
}

export interface UVLShareLink {
  id: string;
  documentId: string;
  token: string;
  label: string;
  status: 'active' | 'revoked' | 'expired';
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  passwordProtected: boolean;
  passwordHash?: string;
  requireEmail: boolean;
  requireVerifiedEmail: boolean;
  allowlistDomains: string[];
  allowlistEmails: string[];
  allowDownload: boolean;
  watermarkEnabled: boolean;
  watermarkText?: string;
  createdBy: string;
  createdAt: string;
}

export type ViewerType = 'anonymous' | 'self_reported' | 'verified';

export interface UVLDocumentSession {
  id: string;
  documentId: string;
  versionId: string;
  shareLinkId: string;
  viewerType: ViewerType;
  viewerEmail?: string;
  ipHash: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  city?: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  totalDurationSeconds: number;
  activeDurationSeconds: number;
  pagesViewed: number[];
  completionPercent: number;
  downloadRequested: boolean;
  isSuspectedBot: boolean;
}

export interface UVLDocumentPageEvent {
  id: string;
  sessionId: string;
  documentId: string;
  versionId: string;
  pageNumber: number;
  activeSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface UVLDocument {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  folder: string;
  status: DocumentStatus;
  currentVersionNumber: number;
  totalPages: number;
  fileSize: number;
  fileType: string;
  storagePath: string;
  thumbnailUrl?: string;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  versions?: UVLDocumentVersion[];
  shareLinks?: UVLShareLink[];
}

export interface DocumentAnalyticsSummary {
  documentId: string;
  totalSessions: number;
  estimatedUniqueViewers: number;
  verifiedViewers: number;
  returningSessions: number;
  averageActiveDurationSeconds: number;
  averageCompletionPercent: number;
  totalDownloads: number;
  pagePerformance: { pageNumber: number; averageActiveSeconds: number; viewCount: number }[];
  dropoffCurve: { pageNumber: number; viewersReached: number; percentReached: number }[];
  versionBreakdown: { versionNumber: number; sessionsCount: number; averageDurationSeconds: number }[];
  linkBreakdown: { linkId: string; label: string; token: string; sessionsCount: number; activeSeconds: number }[];
  recentSessions: UVLDocumentSession[];
}

// ==========================================
// UVL CAMPAIGNS (LINKRUNNER-INSPIRED) TYPES
// ==========================================
export type AppPlatform = 'android' | 'ios' | 'react_native' | 'flutter' | 'web_pwa';
export type AppEnvironment = 'development' | 'staging' | 'production';
export type CampaignSource =
  | 'instagram'
  | 'meta_ads'
  | 'google_ads'
  | 'whatsapp'
  | 'influencer'
  | 'qr_code'
  | 'email'
  | 'custom';

export interface UVLCampaignApp {
  id: string;
  workspaceId: string;
  name: string;
  platform: AppPlatform;
  androidPackageName?: string;
  iosBundleId?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  webFallbackUrl: string;
  approvedDeepLinkRoutes: string[];
  approvedDomains: string[];
  environment: AppEnvironment;
  publishableClientKey: string;
  serverSecretKey: string;
  integrationStatus: 'connected' | 'pending' | 'error';
  lastEventReceivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UVLCampaign {
  id: string;
  workspaceId: string;
  appId: string;
  name: string;
  source: CampaignSource;
  medium: string;
  status: 'active' | 'paused' | 'archived';
  spend: number;
  currency: string;
  reportingPeriod: string;
  startDate?: string;
  endDate?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  creativeLabel?: string;
  placementLabel?: string;
  influencerLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UVLTrackingLink {
  id: string;
  campaignId: string;
  appId: string;
  slug: string;
  title: string;
  destinationRoute: string;
  webFallbackUrl: string;
  deepLinkEnabled: boolean;
  isActive: boolean;
  expiresAt?: string;
  qrCodeDataUrl?: string;
  auditHistory: { timestamp: string; modifiedBy: string; change: string }[];
  createdAt: string;
}

export interface UVLClickEvent {
  id: string;
  trackingLinkId: string;
  campaignId: string;
  appId: string;
  attributionToken: string;
  timestamp: string;
  ipHash: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  platform?: string;
  referrer?: string;
  coarseGeo?: string;
  isSuspectedBot: boolean;
}

export type AttributionSourceType =
  | 'deterministic_token'
  | 'play_install_referrer'
  | 'universal_link'
  | 'organic'
  | 'unattributed';

export interface UVLAppEvent {
  id: string;
  appId: string;
  eventName: 'first_open' | 'app_open' | 'signup_completed' | 'purchase_completed' | 'kyc_verified' | 'custom' | string;
  environment: AppEnvironment;
  appInstanceId: string;
  userId?: string;
  occurredAt: string;
  ingestedAt: string;
  attributionToken?: string;
  attributedCampaignId?: string;
  attributedLinkId?: string;
  attributionSource: AttributionSourceType;
  attributionConfidence: 'high' | 'medium' | 'unattributed';
  properties: Record<string, any>;
  sdkVersion: string;
}

export interface UVLAttributionPolicy {
  windowDays: number; // default 7
  model: 'last_touch' | 'first_touch';
  separateReengagement: boolean;
  policyVersion: string;
}

export interface CampaignMetricsRow {
  campaignId: string;
  campaignName: string;
  source: string;
  medium: string;
  status: string;
  rawClicks: number;
  filteredClicks: number;
  estimatedUniqueClicks: number;
  suspectedBots: number;
  attributedFirstOpens: number;
  signups: number;
  verifiedConversions: number;
  spend: number;
  currency: string;
  costPerAttributedFirstOpen: number | null;
  conversionRate: number | null;
}

export interface UVLAuditLog {
  id: string;
  workspaceId: string;
  actorId?: string;
  module: 'documents' | 'campaigns' | 'access' | 'system';
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: string;
}


