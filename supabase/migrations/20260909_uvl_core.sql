-- ==============================================================================
-- UNFOUNDED VENTURE LAB (UVL) — CORE DATABASE SCHEMA
-- ==============================================================================

-- 1. USERS & MEMBERS
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  avatar_emblem TEXT DEFAULT 'crosshair',
  avatar_bg TEXT DEFAULT '#000000',
  avatar_stitch TEXT DEFAULT '#FFFFFF',
  callsign TEXT,
  pin TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  status_message TEXT DEFAULT '',
  last_active TEXT DEFAULT 'Just now',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  lead_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT DEFAULT '#0055FF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TEXT,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  subtasks JSONB NOT NULL DEFAULT '[]'::JSONB,
  blocked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- 4. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'team',
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  meeting_id TEXT,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_date ON public.calendar_events(date);

-- 5. WAR ROOM MEETINGS
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  attendees TEXT[] NOT NULL DEFAULT '{}',
  agenda TEXT,
  notes TEXT DEFAULT '',
  action_items JSONB NOT NULL DEFAULT '[]'::JSONB,
  meeting_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. NOTES & VAULT
CREATE TABLE IF NOT EXISTS public.notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'team-wiki',
  tags TEXT[] NOT NULL DEFAULT '{}',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_author ON public.notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON public.notes(type);

-- 7. REPOSITORY FILES
CREATE TABLE IF NOT EXISTS public.files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  uploaded_by TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  folder TEXT NOT NULL DEFAULT 'Brand & Merch',
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  version TEXT NOT NULL DEFAULT 'v1.0',
  file_url TEXT,
  version_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CHAT CHANNELS
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  members TEXT[] NOT NULL DEFAULT '{}',
  pinned_message_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id TEXT,
  reactions JSONB NOT NULL DEFAULT '[]'::JSONB,
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.chat_messages(channel_id);

-- 10. CHECK-INS & PULSE
CREATE TABLE IF NOT EXISTS public.checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  worked_on TEXT NOT NULL,
  next_up TEXT NOT NULL,
  blockers TEXT DEFAULT '',
  velocity TEXT NOT NULL DEFAULT 'good',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user ON public.checkins(user_id);

-- 11. WORKSPACE CONFIG
CREATE TABLE IF NOT EXISTS public.workspace_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Unfounded Venture Lab',
  invite_code TEXT NOT NULL,
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  widget_order TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_config ENABLE ROW LEVEL SECURITY;

-- Allow full read/write access for workspace operations via anon and authenticated roles
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- ==============================================================================
-- SEED INITIAL 5 REAL TEAM MEMBERS
-- ==============================================================================
INSERT INTO public.users (id, name, handle, role, avatar_url, avatar_emblem, avatar_bg, avatar_stitch, callsign, pin, status, status_message)
VALUES
  ('u-1', 'Vijayrajkumar', '@vijayrajkumar', 'member', '/avatars/vijayrajkumar.png', 'crosshair', '#000000', '#FFFFFF', 'VIJAY-01', '1001', 'active', ''),
  ('u-2', 'Saai', '@saai', 'member', '/avatars/saai.jpg', 'chip', '#000000', '#FFFFFF', 'SAAI-02', '1002', 'active', ''),
  ('u-3', 'Harish', '@harish', 'member', '/avatars/harish.png', 'radar', '#000000', '#FFFFFF', 'HARISH-03', '1003', 'active', ''),
  ('u-4', 'Subanesh', '@subanesh', 'member', '/avatars/subanesh.png', 'bolt', '#000000', '#FFFFFF', 'SUBA-04', '1004', 'active', ''),
  ('u-5', 'Vinayak', '@vinayak', 'member', '/avatars/vinayak.png', 'dagger', '#000000', '#FFFFFF', 'VINA-05', '1005', 'active', '')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  handle = EXCLUDED.handle,
  avatar_url = EXCLUDED.avatar_url,
  callsign = EXCLUDED.callsign,
  pin = EXCLUDED.pin,
  status_message = EXCLUDED.status_message;

-- SEED INITIAL DEFAULT WORKSPACE CONFIG
INSERT INTO public.workspace_config (id, name, invite_code, sound_enabled, widget_order)
VALUES ('default', 'Unfounded Venture Lab', 'UVL-OPS-9902', TRUE, ARRAY['tasks', 'calendar', 'pulse', 'scratchpad', 'mentions'])
ON CONFLICT (id) DO NOTHING;

-- SEED INITIAL CHANNELS
INSERT INTO public.chat_channels (id, name, description, type)
VALUES
  ('c-1', 'general-command', 'Primary mission briefing and lab dispatch', 'public'),
  ('c-2', 'deal-flow-scout', 'Venture intelligence, scouting, analysis', 'public'),
  ('c-3', 'hardware-vault', 'Zero-knowledge circuits and airgapped telemetry', 'public')
ON CONFLICT (id) DO NOTHING;
