-- ==============================================================================
-- UNFOUNDED VENTURE LAB (UVL) — DOCUMENTS & CAMPAIGNS MIGRATION
-- Production-ready schema for Document Tracking (DocSend-inspired)
-- and Mobile Campaign Attribution (Linkrunner-inspired)
-- ==============================================================================

-- 1. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'ready', -- 'processing' | 'ready' | 'failed' | 'archived'
  current_version_number INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER NOT NULL DEFAULT 1,
  file_size INTEGER NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT 'application/pdf',
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_documents_workspace ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON public.documents(folder);

-- 2. DOCUMENT VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  total_pages INTEGER NOT NULL,
  page_dimensions JSONB DEFAULT '[]'::JSONB,
  uploaded_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  changelog TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_document ON public.document_versions(document_id);

-- 3. DOCUMENT SHARE LINKS TABLE
CREATE TABLE IF NOT EXISTS public.document_share_links (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked' | 'expired'
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  password_hash TEXT,
  require_email BOOLEAN NOT NULL DEFAULT FALSE,
  require_verified_email BOOLEAN NOT NULL DEFAULT FALSE,
  allowlist_domains TEXT[] NOT NULL DEFAULT '{}',
  allowlist_emails TEXT[] NOT NULL DEFAULT '{}',
  allow_download BOOLEAN NOT NULL DEFAULT FALSE,
  watermark_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  watermark_text TEXT,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.document_share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_document ON public.document_share_links(document_id);

-- 4. DOCUMENT SESSIONS (VIEWER SESSIONS) TABLE
CREATE TABLE IF NOT EXISTS public.document_sessions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  share_link_id TEXT NOT NULL REFERENCES public.document_share_links(id) ON DELETE CASCADE,
  viewer_type TEXT NOT NULL DEFAULT 'anonymous', -- 'anonymous' | 'self_reported' | 'verified'
  viewer_email TEXT,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT DEFAULT 'desktop',
  country TEXT,
  city TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_duration_seconds INTEGER NOT NULL DEFAULT 0,
  active_duration_seconds INTEGER NOT NULL DEFAULT 0,
  pages_viewed INTEGER[] NOT NULL DEFAULT '{}',
  completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  download_requested BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspected_bot BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_doc_sessions_link ON public.document_sessions(share_link_id);
CREATE INDEX IF NOT EXISTS idx_doc_sessions_doc ON public.document_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_sessions_started ON public.document_sessions(started_at);

-- 5. DOCUMENT PAGE READING TELEMETRY EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.document_page_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.document_sessions(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id TEXT NOT NULL REFERENCES public.document_versions(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_events_session ON public.document_page_events(session_id);
CREATE INDEX IF NOT EXISTS idx_page_events_doc ON public.document_page_events(document_id);

-- 6. CAMPAIGN APPS (REGISTERED APPS) TABLE
CREATE TABLE IF NOT EXISTS public.campaign_apps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'android' | 'ios' | 'react_native' | 'flutter' | 'web_pwa'
  android_package_name TEXT,
  ios_bundle_id TEXT,
  play_store_url TEXT,
  app_store_url TEXT,
  web_fallback_url TEXT NOT NULL,
  approved_deep_link_routes TEXT[] NOT NULL DEFAULT '{}',
  approved_domains TEXT[] NOT NULL DEFAULT '{}',
  environment TEXT NOT NULL DEFAULT 'production', -- 'development' | 'staging' | 'production'
  publishable_client_key TEXT NOT NULL UNIQUE,
  server_secret_key TEXT NOT NULL,
  integration_status TEXT NOT NULL DEFAULT 'connected', -- 'connected' | 'pending' | 'error'
  last_event_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_apps_workspace ON public.campaign_apps(workspace_id);

-- 7. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  app_id TEXT NOT NULL REFERENCES public.campaign_apps(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL, -- 'instagram' | 'meta_ads' | 'google_ads' | 'whatsapp' | 'influencer' | 'qr_code' | 'email' | 'custom'
  medium TEXT NOT NULL DEFAULT 'referral',
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'archived'
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  reporting_period TEXT NOT NULL DEFAULT '2026-Q4',
  start_date DATE,
  end_date DATE,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  creative_label TEXT,
  placement_label TEXT,
  influencer_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_app ON public.campaigns(app_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- 8. CAMPAIGN TRACKING LINKS TABLE
CREATE TABLE IF NOT EXISTS public.campaign_tracking_links (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES public.campaign_apps(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  destination_route TEXT NOT NULL DEFAULT '/',
  web_fallback_url TEXT NOT NULL,
  deep_link_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  audit_history JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_links_slug ON public.campaign_tracking_links(slug);
CREATE INDEX IF NOT EXISTS idx_tracking_links_campaign ON public.campaign_tracking_links(campaign_id);

-- 9. CAMPAIGN CLICKS (LOW-LATENCY CLICK INGESTION) TABLE
CREATE TABLE IF NOT EXISTS public.campaign_clicks (
  id TEXT PRIMARY KEY,
  tracking_link_id TEXT NOT NULL REFERENCES public.campaign_tracking_links(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL REFERENCES public.campaign_apps(id) ON DELETE CASCADE,
  attribution_token TEXT NOT NULL UNIQUE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  platform TEXT DEFAULT 'web',
  referrer TEXT,
  coarse_geo TEXT,
  is_suspected_bot BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_token ON public.campaign_clicks(attribution_token);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign ON public.campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_time ON public.campaign_clicks(timestamp);

-- 10. CAMPAIGN APP EVENTS (CONVERSIONS & FIRST-OPENS) TABLE
CREATE TABLE IF NOT EXISTS public.campaign_app_events (
  id TEXT PRIMARY KEY,
  app_id TEXT NOT NULL REFERENCES public.campaign_apps(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- 'first_open' | 'app_open' | 'signup_completed' | 'purchase_completed' | 'custom'
  environment TEXT NOT NULL DEFAULT 'production',
  app_instance_id TEXT NOT NULL,
  user_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attribution_token TEXT,
  attributed_campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
  attributed_link_id TEXT REFERENCES public.campaign_tracking_links(id) ON DELETE SET NULL,
  attribution_source TEXT NOT NULL DEFAULT 'unattributed', -- 'deterministic_token' | 'play_install_referrer' | 'universal_link' | 'organic' | 'unattributed'
  attribution_confidence TEXT NOT NULL DEFAULT 'unattributed', -- 'high' | 'medium' | 'unattributed'
  properties JSONB NOT NULL DEFAULT '{}'::JSONB,
  sdk_version TEXT DEFAULT 'uvl-sdk-1.0.0'
);

CREATE INDEX IF NOT EXISTS idx_app_events_app ON public.campaign_app_events(app_id);
CREATE INDEX IF NOT EXISTS idx_app_events_attributed_campaign ON public.campaign_app_events(attributed_campaign_id);
CREATE INDEX IF NOT EXISTS idx_app_events_token ON public.campaign_app_events(attribution_token);
CREATE INDEX IF NOT EXISTS idx_app_events_name ON public.campaign_app_events(event_name);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'default',
  actor_id TEXT,
  module TEXT NOT NULL, -- 'documents' | 'campaigns' | 'access' | 'system'
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);

-- ==============================================================================
-- RLS POLICIES FOR DOCUMENTS & CAMPAIGNS
-- ==============================================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_page_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables_to_permit TEXT[] := ARRAY[
    'documents',
    'document_versions',
    'document_share_links',
    'document_sessions',
    'document_page_events',
    'campaign_apps',
    'campaigns',
    'campaign_tracking_links',
    'campaign_clicks',
    'campaign_app_events',
    'audit_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_permit LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public access on %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;
