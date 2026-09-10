# UNFOUNDED VENTURE LAB (UVL) — MASTER BUILD SPECIFICATION
**Version**: 2.0.0 — Production Architecture Document  
**Target Environment**: Web / PWA / Mobile-Optimized Client  
**Primary Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS (v4) + Supabase (PostgreSQL & Object Storage) + Google Gemini 3.6 Flash Engine  
**Design System**: High-Density Monochrome Editorial Portfolio (Pure Black `#000000`, Pure White `#FFFFFF`, Refined Silver `#A1A1AA`, 0px Border Radius, Hairline 1px Dividers, Inter Modern Grotesk Typography)

---

## 1. SYSTEM ARCHITECTURE & CORE PHILOSOPHY

### 1.1 Architectural Tenets
1. **Speed, Clarity & Zero Fluff**: Low-latency, high-frequency operator workspace. Zero bloated animations, zero multi-step onboarding friction, instantaneous keyboard shortcuts (`Ctrl+K`, `Ctrl+Shift+N`).
2. **Zero Mock Fallback**: All core workflows (member provisioning, multimedia chat attachments, receipts, pitch decks, voice memos, and AI reports) interact with live cloud storage (**Supabase Storage**) and database persistence (**PostgreSQL**).
3. **Editorial Brand Identity**: Follows the tight sentence-case grotesk visual identity ("Unfounded" white bold over "Venture Lab." silver `#A1A1AA` with period) with sharp square containers (`border-radius: 0 !important`).
4. **Autonomous AI Amplification**: Uses Google Gemini 3.6 Flash as an active executor — formulating structured cross-module plans, executing tasks, scheduling calendar events, and generating periodic executive synthesis reports.

---

## 2. IDENTITY, CLEARANCE & ACCESS CONTROL

### 2.1 Enclave Founding Roster
The platform ships with 5 core operator profiles with individual callsigns, custom avatars, and secure 4-digit PINs:
1. **Vijayrajkumar** (`VIJAY-01`) — Lead Operator & Enclave Founder (`u-1`)
2. **Saai** (`SAAI-02`) — Core Engine Operator (`u-2`)
3. **Harish** (`HARISH-03`) — Deep Tech Systems Operator (`u-3`)
4. **Subanesh** (`SUBA-04`) — Telemetry & Prototyping Operator (`u-4`)
5. **Vinayak** (`VINA-05`) — Hardware & Operations Operator (`u-5`)

### 2.2 Security Guarantees & Clearance Rules
- **Founder Exclusivity**: Only Vijayrajkumar (`isVijayrajkumar = currentUser.id === 'u-1' || currentUser.name.toLowerCase().includes('vijay')`) possesses clearance to:
  - Add, invite, and provision new members into the database.
  - View and manage sensitive **Investor Tracking** data (cap table allocations, valuations, and term sheets). Non-admins see an Enclave Security Level 1 clearance badge.
  - Approve, reject, or mark reimbursed in the **Expense Tracker** approval workflow.
- **Biometric / PIN Auth**: Login portal features instant profile selection with a 6-digit virtual keypad and PIN verification.

---

## 3. COMPLETE MODULE SPECIFICATIONS

### MODULE 1: Dashboard & Telemetry (`DashboardView.tsx`)
- **Brand Hero Header**: Typographic badge with live UTC and Indian Standard Time clocks and operator session badge.
- **Metric Cards**: Active tasks, unread chat mentions, upcoming calendar commitments, and team pulse status.
- **Customizable Widgets**: Reorderable editorial grid with drag or pin controls.
- **Marquee Ticker Strip**: Hairline text-only ticker showing database sync telemetry and protocol status.

### MODULE 2: Tasks & Kanban Engine (`TasksView.tsx`)
- **Multi-Stage Kanban Columns**: `To Do`, `In Progress`, `Blocked`, `Done` with drag or 1-click status shift.
- **Task Attributes**: Priority (`Low`, `Medium`, `High`, `Urgent`), assignee, project code, due date, tags, checklist subtasks, and dependency blockers.
- **Mobile Optimization**: Mobile segmented filter tabs (`[All | To Do | In Progress | Blocked | Done]`) preventing horizontal document scroll.
- **AI Task Delegation**: Each card features an **"Assign to AI Agent"** action which delegates the objective to the autonomous AI executor.

### MODULE 3: Calendar & Scheduling (`CalendarView.tsx`)
- **Multi-Layer Filtering**: Filter events by Team, Personal, War Rooms, or Task Deadlines.
- **Timeline & Month Views**: Fast navigation with date pickers, meeting links, and attendee avatars.

### MODULE 4: Meetings & War Rooms (`MeetingsView.tsx`)
- **Agenda & Notes**: Structured minutes documentation with participant rosters.
- **Action Item Converter**: 1-click conversion of meeting action items into formal Kanban tasks with due dates and assignees.

### MODULE 5: Notes & Team Wiki (`NotesView.tsx`)
- **Three Note Types**: Personal, Team Wiki, and Quick Capture brain dumps.
- **Search & Tagging**: Full-text searching with pinned document priorities and auto-save timestamps.

### MODULE 6: Central File Repo & Vault (`FilesView.tsx`)
- **Cloud Object Storage**: Backed directly by Supabase Storage `files` bucket.
- **Folder Enclaves**: `Specs`, `Pitch Decks`, `Expenses`, `Investor Relations`, `Voice Memos`.
- **Drag-and-Drop Ingestion**: Drop files directly onto the vault drop zone to upload and index.
- **Lossless In-Browser Voice Memos**: Microphone recording via `MediaRecorder` API, uploaded as `.webm` audio files and cataloged in the database.
- **Immutable Version Audit**: Track revisions (`v1.0`, `v2.0`, `v3.0`) with author timestamps and notes.

### MODULE 7: Team Chat & Tactical Rooms (`ChatView.tsx`)
- **Channels**: `#general`, `#agent-reports`, and direct messaging rooms.
- **Multimedia Uploads**: Support for images (`.png, .jpg`), documents (`.pdf, .doc, .zip`), and voice audio notes.
- **Interactive Voice Player**: Inline custom audio player for recorded voice messages.
- **Convert to Task**: Convert any chat message or instruction directly into a Kanban task.
- **Mobile Single-Pane View**: Channels list and message view toggle cleanly on small viewports.

### MODULE 8: Pulse & Daily Check-in (`CheckinsView.tsx`)
- **Standup Stream**: Log daily updates: Completed Today, Working On Next, Blockers, and Mood Beacon (`⚡ Hyper`, `🟢 Good`, `🟡 Grinding`, `🔴 Blocked`).
- **Team Velocity & Sentiment Index**: Aggregated operational health metrics.

### MODULE 9: Expense Tracker (`ExpenseView.tsx`)
- **Add Expense Entry**:
  - Fields: Amount, Currency, Category (`Software`, `Travel`, `Legal`, `Marketing`, `Payroll`, `Hardware`, `Office`, `Misc`), Date, Payment Method (`Corporate Card`, `Bank Wire`, `UPI`, `Personal Card`, `Cash`, `Reimbursement`), Vendor/Payee, Description, Assigned Operator.
- **Document & Receipt Upload**:
  - Supports PDF, JPG, PNG attachments.
  - Uploads to Supabase Storage `files` bucket under `receipts/` and registers into the Central File Repo under `Expenses`.
  - Lightbox receipt viewer and one-click receipt download.
- **Status Workflow**: `Pending` → `Approved` → `Reimbursed` / `Rejected`.
- **Admin Approval Interface**: Vijayrajkumar can approve/reject with review comments or mark reimbursed.
- **Visual Analytics**:
  - Spend Distribution by Category monochrome chart.
  - Monthly Budget vs Actual gauge ($8,000 default threshold).
  - Lifetime spend and pending approval counters.
- **Accounting CSV Export**: Download verified ledger as standard accounting CSV.
- **Auto-Task Generation**: Pending expenses automatically generate verification tasks for the administrator.

### MODULE 10: Investor Tracking (`InvestorView.tsx`)
- **Security Clearance**: Restricted to Admin/Founder clearance (`isVijayrajkumar`).
- **Status Pipeline (Kanban by Stage)**:
  - Stages: `Contacted` → `Meeting Scheduled` → `Pitched` → `Due Diligence` → `Term Sheet` → `Committed` → `Closed / Passed`.
  - 1-click stage advancement with milestone celebrations (confetti on Term Sheet / Committed).
- **Deal Dossier**:
  - Deal Size, Pre-Money Valuation, Round Type (`Pre-Seed`, `Seed`, `Series A`, `Series B`, `SAFE`, `Convertible Note`), Relationship Lead, Target Close Date.
- **Document Vault per Investor**:
  - Upload pitch decks, cap tables, NDAs, and correspondence with versioning.
  - Uploads to Supabase Storage `files` bucket under `investors/` and syncs to Central File Repo under `Investor Relations`.
- **Interaction Timeline Log**: Chronological log of calls, meetings, pitches, and notes tagged by team member.
- **Follow-up Reminders**: Auto-schedule follow-up dates; automatically generates high-priority linked tasks in `TasksView`.

### MODULE 11: Agentic AI Task Executor (`AgentView.tsx`)
- **Engine**: Powered by Google Generative Language API (`gemini-3.6-flash`).
- **Natural Language & Voice Intake**:
  - Type or dictate directives via in-browser speech recognition.
  - Pre-built executive shortcuts for high-frequency operations.
- **Two-Phase Action Planning**:
  1. *Plan Formulation*: Gemini receives live snapshot context (tasks, expenses, investors, team) and returns a structured JSON execution plan of modular sub-steps.
  2. *Review & Execution*: User reviews proposed plan and reasons; 1-click execution carries out real cross-module updates:
     - Creates tasks in `TasksView`.
     - Creates calendar deadlines in `CalendarView`.
     - Generates documentation notes in `NotesView`.
     - Broadcasts updates to `#agent-reports` in `ChatView`.
     - Updates investor stages or expense approvals.
- **Periodic Intelligence Reports**:
  - Auto-synthesizes **Daily Briefings**, **Weekly Executive Syntheses**, and **Monthly Capital & Engineering Reviews**.
  - Renders markdown analysis of task throughput, financial burn, investor velocity, and sentiment scores.
  - Downloadable as `.md` file; automatically saved to Team Wiki and announced in `#agent-reports`.
- **Transparent Trust & Audit Ledger**:
  - Complete history of every autonomous action with timestamp, reasoning (*"Why did the agent do this?"*), status, and **Rollback / Undo** capability.
- **Configurable Policy & Permissions**:
  - Toggle Autonomous Mode and Enforce Human Sign-Off for sensitive writes.

---

## 4. DATABASE SCHEMAS & STORAGE ARCHITECTURE

### 4.1 PostgreSQL Database Tables (Supabase)

```sql
-- 1. USERS TABLE
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  avatar_emblem TEXT DEFAULT 'crosshair',
  avatar_bg TEXT DEFAULT '#000000',
  avatar_stitch TEXT DEFAULT '#FFFFFF',
  callsign TEXT NOT NULL,
  pin TEXT DEFAULT '1234',
  status TEXT DEFAULT 'active',
  status_message TEXT,
  last_active TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TASKS TABLE
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES public.users(id),
  project_id TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  subtasks JSONB DEFAULT '[]'::jsonb,
  blocked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXPENSES TABLE
CREATE TABLE public.expenses (
  id TEXT PRIMARY KEY,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  vendor TEXT NOT NULL,
  description TEXT,
  submitted_by TEXT REFERENCES public.users(id),
  receipt_url TEXT,
  receipt_name TEXT,
  status TEXT DEFAULT 'pending',
  approver_comment TEXT,
  approved_by TEXT REFERENCES public.users(id),
  approved_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVESTORS TABLE
CREATE TABLE public.investors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  firm TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  avatar_url TEXT,
  relationship_owner_id TEXT REFERENCES public.users(id),
  stage TEXT NOT NULL DEFAULT 'contacted',
  deal_size NUMERIC(12, 2) NOT NULL,
  valuation NUMERIC(14, 2),
  round_type TEXT NOT NULL,
  target_close_date TEXT,
  last_interaction_date TEXT,
  next_follow_up_date TEXT,
  notes TEXT,
  interactions JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FILES REPOSITORY TABLE
CREATE TABLE public.files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT,
  type TEXT,
  project_id TEXT,
  folder TEXT NOT NULL DEFAULT 'General',
  uploaded_by TEXT REFERENCES public.users(id),
  uploaded_at TEXT,
  version INTEGER DEFAULT 1,
  version_history JSONB DEFAULT '[]'::jsonb,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHAT MESSAGES TABLE
CREATE TABLE public.chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  sender_id TEXT REFERENCES public.users(id),
  text TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  parent_id TEXT,
  reply_count INTEGER DEFAULT 0,
  mentions JSONB DEFAULT '[]'::jsonb,
  reactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Supabase Storage Bucket Hierarchy
- **Bucket**: `files` (Public access enabled)
  - `receipts/` — Invoices and expense receipt files.
  - `investors/` — Pitch decks, term sheets, cap tables, NDAs.
  - `chat-images/` — Screenshots and image attachments from team chat.
  - `chat-docs/` — PDF and office document attachments from chat.
  - `voice-notes/` — In-browser recorded voice messages from chat.
  - `vault-audio/` — Enclave audio voice memos.
  - `vault/` — Drag-and-drop uploaded repository documents.

---

## 5. UI/UX EDITORIAL DESIGN TOKENS

- **Background**: `#000000` (Pure deep black)
- **Card / Panel Backgrounds**: `#000000` with `1px solid rgba(255,255,255,0.2)`
- **Hover Borders**: `rgba(255,255,255,0.5)` or `#A1A1AA`
- **Primary Text**: `#FFFFFF` (Pure white)
- **Secondary Accent**: `#A1A1AA` (Silver / refined grey)
- **Borders & Radii**: `0px !important` globally (sharp architectural corners)
- **Typography**: Single Neo-Grotesk Family (`Inter` 100..900)
  - Headings: Bold, sentence-case, tight letter spacing (`-0.025em` to `-0.04em`)
  - Numbers & Metrics: Tabular numerals (`font-variant-numeric: tabular-nums`)
- **Avatar Photos**: Original uploaded photograph colors preserved completely (`filter: none !important`).

---

## 6. ENVIRONMENT CONFIGURATION & DEVELOPER SETUP

### 6.1 Required Environment Variables (`.env`)
```bash
# Supabase Database & Storage Configuration
VITE_SUPABASE_URL=https://winapknggfwotdazsqla.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI Service Layer
VITE_GEMINI_API_KEY=AIzaSyBIUAOor5WDOS8OaX49ZPaC8ZhBEAVy0q4
```

### 6.2 Execution Commands
```bash
# Install dependencies
npm install

# Start local dev server (Host on 0.0.0.0, port 5173)
npm run dev -- --host --port 5173

# Production build verification
npm run build
```

---
*Unfounded Venture Lab — Autonomous Command Center — Est. 2026*
