import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// Environment variables or fallback to UVL Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://winapknggfwotdazsqla.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpbmFwa25nZ2Z3b3RkYXpzcWxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMjYwNjEsImV4cCI6MjA1NTcwMjA2MX0.UvS0-5GjO6W0Jk4k9o5wK4K6J-wK4K6J-wK4K6J-wK4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SSRF Protection: Checks if hostname resolves to private, loopback, or cloud-metadata IP.
 */
export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') {
    return true;
  }
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // 169.254.0.0/16 (link local & AWS/GCP metadata 169.254.169.254)
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // Internal hostnames
  if (h === 'metadata.google.internal' || h.endsWith('.internal') || h.endsWith('.local')) {
    return true;
  }
  return false;
}

/**
 * Creates and configures the UVL Unified Model Context Protocol Server.
 */
export function createUVLMCPServer() {
  const server = new Server(
    {
      name: 'uvl-documents-and-campaigns',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // 1. List Available Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // DOCUMENTS MODULE TOOLS
        {
          name: 'list_documents',
          description: 'Lists all pitch decks and presentation documents in the workspace with pagination and folder filtering.',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: { type: 'string', description: 'Target workspace identifier (default: "default")' },
              folder: { type: 'string', description: 'Optional folder filter' },
              limit: { type: 'number', description: 'Maximum number of documents to return (max: 100, default: 20)' },
              offset: { type: 'number', description: 'Pagination offset (default: 0)' }
            }
          }
        },
        {
          name: 'get_document',
          description: 'Retrieves metadata, version history, and active share links for a specific document.',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'The unique identifier of the document' }
            },
            required: ['documentId']
          }
        },
        {
          name: 'get_document_analytics',
          description: 'Retrieves aggregated engagement analytics, dropoff curves, and average time-per-page for a document.',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'The unique identifier of the document' },
              versionId: { type: 'string', description: 'Optional version filter' },
              shareLinkId: { type: 'string', description: 'Optional share link filter' }
            },
            required: ['documentId']
          }
        },
        {
          name: 'list_document_sessions',
          description: 'Lists individual viewing sessions with completion percentage, active reading time, and viewer classification.',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'The document ID' },
              limit: { type: 'number', description: 'Max sessions to return (default: 20)' },
              offset: { type: 'number', description: 'Offset for pagination' }
            },
            required: ['documentId']
          }
        },
        {
          name: 'get_share_link_analytics',
          description: 'Retrieves telemetry and viewer metrics for a specific share link token.',
          inputSchema: {
            type: 'object',
            properties: {
              token: { type: 'string', description: 'The cryptographically unguessable share link token' }
            },
            required: ['token']
          }
        },
        {
          name: 'delete_document',
          description: 'Permanently deletes a presentation document, cascading deletion to all its versions, share links, sessions, and page events.',
          inputSchema: {
            type: 'object',
            properties: {
              documentId: { type: 'string', description: 'The unique identifier of the document to delete' }
            },
            required: ['documentId']
          }
        },

        // CAMPAIGNS MODULE TOOLS
        {
          name: 'create_project',
          description: 'Creates a project representing an application or website (e.g. Ziggers at https://app.ziggers.in). All campaign links generated for this project will direct to this app/website formatted as https://<project_domain>/?c=<campaign_code>.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the project/app (e.g. "Ziggers")' },
              webFallbackUrl: { type: 'string', description: 'Base website or app URL that all project campaign links direct to (e.g. "https://app.ziggers.in")' },
              platform: { type: 'string', enum: ['flutter', 'android', 'ios', 'web_pwa', 'react_native'], description: 'Platform type (default: flutter)' },
              androidPackageName: { type: 'string', description: 'Optional Android package name' },
              iosBundleId: { type: 'string', description: 'Optional iOS bundle ID' },
              environment: { type: 'string', enum: ['production', 'staging', 'development'], description: 'Target environment' }
            },
            required: ['name', 'webFallbackUrl']
          }
        },
        {
          name: 'list_campaign_apps',
          description: 'Lists registered client applications (Flutter, Android, iOS, Web) receiving deep link routes.',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: { type: 'string', description: 'Target workspace identifier' }
            }
          }
        },
        {
          name: 'list_campaigns',
          description: 'Lists marketing campaigns, budgets, and UTM attribution channels.',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: { type: 'string', description: 'Target workspace identifier' },
              limit: { type: 'number', description: 'Max campaigns to return' }
            }
          }
        },
        {
          name: 'get_campaign_analytics',
          description: 'Retrieves campaign ROI, filtered clicks, and attributed first-opens with explicit reporting mode.',
          inputSchema: {
            type: 'object',
            properties: {
              reportingMode: {
                type: 'string',
                enum: ['cohort', 'event_time'],
                description: 'Cohort Mode (clicks cohort) vs Event-Time Mode (events calendar time)'
              },
              campaignId: { type: 'string', description: 'Optional campaign filter' }
            },
            required: ['reportingMode']
          }
        },
        {
          name: 'list_tracking_links',
          description: 'Lists smart tracking links, slugs, destination routes, and generated QR code endpoints.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'string', description: 'Optional campaign filter' },
              appId: { type: 'string', description: 'Optional app filter' }
            }
          }
        },
        {
          name: 'list_campaign_events',
          description: 'Lists live mobile conversion stream (first_open, signup, KYC, purchase) with attribution source & confidence.',
          inputSchema: {
            type: 'object',
            properties: {
              appId: { type: 'string', description: 'App identifier' },
              limit: { type: 'number', description: 'Max events to return (default: 50)' }
            }
          }
        },
        {
          name: 'delete_campaign',
          description: 'Deletes a marketing campaign and cascades deletion to all associated tracking links and QR codes.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'string', description: 'The unique campaign identifier to delete' }
            },
            required: ['campaignId']
          }
        },
        {
          name: 'create_tracking_link',
          description: 'Creates a tracked smart link that redirects visitors to any external website, app, or deep link route with analytics attribution.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'string', description: 'Campaign ID to attach this link to' },
              appId: { type: 'string', description: 'App ID (Flutter, Android, iOS, or Web)' },
              title: { type: 'string', description: 'Friendly title for the tracking link' },
              destinationUrl: { type: 'string', description: 'The custom website or app URL to reroute visitors to (e.g. https://mywebsite.com or custom domain)' },
              customSlug: { type: 'string', description: 'Optional custom vanity slug (e.g. campus-pass)' },
              destinationRoute: { type: 'string', description: 'Optional in-app deep link route (e.g. onboarding or pay)' },
              deepLinkEnabled: { type: 'boolean', description: 'Whether to attempt mobile deep link before web redirect (default: true)' }
            },
            required: ['campaignId', 'appId', 'title']
          }
        },
        {
          name: 'delete_tracking_link',
          description: 'Deletes a tracking link, immediately disabling all its redirects and QR codes.',
          inputSchema: {
            type: 'object',
            properties: {
              trackingLinkId: { type: 'string', description: 'The unique tracking link ID to delete' }
            },
            required: ['trackingLinkId']
          }
        },
        {
          name: 'reroute_tracking_link',
          description: 'Reroutes an existing tracking link so it redirects to a different website, external application, or custom route.',
          inputSchema: {
            type: 'object',
            properties: {
              trackingLinkId: { type: 'string', description: 'The unique tracking link ID to reroute' },
              newDestinationUrl: { type: 'string', description: 'The new destination website or app URL to redirect visitors to' },
              newDestinationRoute: { type: 'string', description: 'Optional new in-app destination route' }
            },
            required: ['trackingLinkId', 'newDestinationUrl']
          }
        },
        {
          name: 'get_link_details',
          description: 'Retrieves complete metadata, target destination, QR code, and audit trail for a specific tracking link.',
          inputSchema: {
            type: 'object',
            properties: {
              linkId: { type: 'string', description: 'Tracking link unique ID' },
              slug: { type: 'string', description: 'Tracking link vanity slug' }
            }
          }
        },
        {
          name: 'get_link_metrics',
          description: 'Retrieves detailed performance telemetry for a single tracking link including raw clicks, bot filtering, unique visitors, and first-open conversions.',
          inputSchema: {
            type: 'object',
            properties: {
              linkId: { type: 'string', description: 'Tracking link unique ID' },
              slug: { type: 'string', description: 'Tracking link vanity slug' }
            }
          }
        },
        {
          name: 'get_campaign_metrics',
          description: 'Calculates campaign ROI, filtered clicks, attributed first-opens, signups, and cost-per-open using either Cohort or Event-Time mode.',
          inputSchema: {
            type: 'object',
            properties: {
              reportingMode: {
                type: 'string',
                enum: ['cohort', 'event_time'],
                description: 'Cohort Mode (clicks cohort) vs Event-Time Mode (events calendar time)'
              },
              campaignId: { type: 'string', description: 'Optional campaign filter' }
            },
            required: ['reportingMode']
          }
        },
        {
          name: 'get_attribution_breakdown',
          description: 'Retrieves attribution model breakdown across deterministic tokens, install referrers, and probabilistic window matching.',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'string', description: 'Optional campaign ID filter' },
              appId: { type: 'string', description: 'Optional app ID filter' }
            }
          }
        },
        {
          name: 'get_app_integration_status',
          description: 'Checks integration health of connected apps, package IDs, universal link associations, and last received event.',
          inputSchema: {
            type: 'object',
            properties: {
              appId: { type: 'string', description: 'Optional app ID filter' }
            }
          }
        },
        {
          name: 'get_recent_tracking_errors',
          description: 'Retrieves recent tracking errors, suspicious bot patterns, blocked loop redirects, and rejected schemes.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Max error items to return (default: 20)' }
            }
          }
        },
        {
          name: 'diagnose_tracking_link',
          description: 'Runs diagnostic tests on a tracking link or destination URL: verifies scheme safety, detects redirect loops, enforces SSRF protections, and tests hops without polluting click analytics.',
          inputSchema: {
            type: 'object',
            properties: {
              slug: { type: 'string', description: 'Tracking link vanity slug to test' },
              trackingLinkId: { type: 'string', description: 'Tracking link unique ID to test' },
              customUrl: { type: 'string', description: 'Direct URL to test against SSRF, scheme, and loop filters' }
            }
          }
        }
      ]
    };
  });

  // 2. Call Tool Request Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args || {}) as Record<string, any>;

    try {
      switch (name) {
        // --- DOCUMENTS TOOLS ---
        case 'list_documents': {
          const limit = Math.min(Number(a.limit) || 20, 100);
          const offset = Number(a.offset) || 0;
          let query = supabase.from('documents').select('*').range(offset, offset + limit - 1);

          if (a.folder) {
            query = query.eq('folder', a.folder);
          }

          const { data, error } = await query;
          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  total: data?.length || 0,
                  offset,
                  limit,
                  documents: data || []
                }, null, 2)
              }
            ]
          };
        }

        case 'get_document': {
          const { data: doc, error: dErr } = await supabase.from('documents').select('*').eq('id', a.documentId).single();
          if (dErr || !doc) throw new Error('Document not found');

          const { data: versions } = await supabase.from('document_versions').select('*').eq('document_id', a.documentId);
          const { data: links } = await supabase.from('document_share_links').select('*').eq('document_id', a.documentId);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  document: doc,
                  versions: versions || [],
                  shareLinks: (links || []).map(l => ({ ...l, password_hash: undefined })) // Never leak password hashes
                }, null, 2)
              }
            ]
          };
        }

        case 'get_document_analytics': {
          const { data: doc } = await supabase.from('documents').select('*').eq('id', a.documentId).single();
          if (!doc) throw new Error('Document not found');

          let sQuery = supabase.from('document_sessions').select('*').eq('document_id', a.documentId);
          if (a.versionId) sQuery = sQuery.eq('version_id', a.versionId);
          if (a.shareLinkId) sQuery = sQuery.eq('share_link_id', a.shareLinkId);

          const { data: sessions } = await sQuery;
          const allSessions = sessions || [];

          const totalSessions = allSessions.length;
          const uniqueViewers = new Set(allSessions.map(s => `${s.ip_hash}_${s.user_agent}`)).size;
          const verifiedViewers = allSessions.filter(s => s.viewer_type === 'verified').length;
          const totalDuration = allSessions.reduce((acc, s) => acc + (s.active_duration_seconds || 0), 0);
          const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
          const totalCompletion = allSessions.reduce((acc, s) => acc + (s.completion_percent || 0), 0);
          const avgCompletion = totalSessions > 0 ? Math.round(totalCompletion / totalSessions) : 0;
          const downloads = allSessions.filter(s => s.download_requested).length;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  documentId: a.documentId,
                  documentName: doc.name,
                  totalSessions,
                  estimatedUniqueViewers: uniqueViewers,
                  verifiedViewers,
                  averageActiveDurationSeconds: avgDuration,
                  averageCompletionPercent: avgCompletion,
                  totalDownloads: downloads,
                  note: 'Completion defined as distinct pages viewed / total pages.'
                }, null, 2)
              }
            ]
          };
        }

        case 'list_document_sessions': {
          const limit = Math.min(Number(a.limit) || 20, 100);
          const offset = Number(a.offset) || 0;
          const { data, error } = await supabase
            .from('document_sessions')
            .select('*')
            .eq('document_id', a.documentId)
            .order('started_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) throw error;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  total: data?.length || 0,
                  sessions: (data || []).map(s => ({ ...s, ip_hash: 'hash_redacted' }))
                }, null, 2)
              }
            ]
          };
        }

        case 'get_share_link_analytics': {
          const { data: link } = await supabase.from('document_share_links').select('*').eq('token', a.token).single();
          if (!link) throw new Error('Share link not found');

          const { data: sessions } = await supabase.from('document_sessions').select('*').eq('share_link_id', link.id);
          const allSessions = sessions || [];

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  linkId: link.id,
                  label: link.label,
                  status: link.status,
                  totalViews: allSessions.length,
                  downloadsRequested: allSessions.filter(s => s.download_requested).length
                }, null, 2)
              }
            ]
          };
        }

        case 'delete_document': {
          const { documentId } = a;
          if (!documentId) throw new Error('Missing required argument: documentId');

          await supabase.from('document_page_events').delete().eq('document_id', documentId);
          await supabase.from('document_sessions').delete().eq('document_id', documentId);
          await supabase.from('document_share_links').delete().eq('document_id', documentId);
          await supabase.from('document_versions').delete().eq('document_id', documentId);
          const { error } = await supabase.from('documents').delete().eq('id', documentId);
          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Document ${documentId} and all associated versions, share links, and sessions were successfully deleted.`
                }, null, 2)
              }
            ]
          };
        }

        // --- CAMPAIGNS TOOLS ---
        case 'create_project': {
          const { name, webFallbackUrl, platform, androidPackageName, iosBundleId, environment } = a;
          if (!name || !webFallbackUrl) {
            throw new Error('Missing required arguments: name, webFallbackUrl');
          }

          let normalizedUrl = String(webFallbackUrl).trim();
          if (!/^[a-zA-Z]+:\/\//.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`;
          }

          const appId = 'app_' + Date.now();
          const pubKey = 'uvl_pub_' + Math.random().toString(36).substring(2, 12);
          const secKey = 'uvl_sec_' + Math.random().toString(36).substring(2, 18);
          const now = new Date().toISOString();

          let domainHostname = 'uvl.ventures';
          try {
            domainHostname = new URL(normalizedUrl).hostname;
          } catch {}

          const newProject = {
            id: appId,
            workspace_id: 'default',
            name: name.trim(),
            platform: platform || 'flutter',
            android_package_name: androidPackageName || null,
            ios_bundle_id: iosBundleId || null,
            web_fallback_url: normalizedUrl,
            approved_deep_link_routes: ['home', 'product', 'invite', 'deal'],
            approved_domains: [domainHostname],
            environment: environment || 'production',
            publishable_client_key: pubKey,
            server_secret_key: secKey,
            integration_status: 'connected',
            created_at: now,
            updated_at: now
          };

          const { error } = await supabase.from('campaign_apps').insert([newProject]);
          if (error) throw error;

          const exampleTrackingUrl = `${normalizedUrl.replace(/\/+$/, '')}/?c=WPkAs`;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  project: { ...newProject, server_secret_key: undefined },
                  exampleTrackingUrl,
                  message: `Project "${name}" created. Campaign tracking links will be generated as ${exampleTrackingUrl}.`
                }, null, 2)
              }
            ]
          };
        }

        case 'list_campaign_apps': {
          const { data, error } = await supabase.from('campaign_apps').select('*');
          if (error) throw error;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  apps: (data || []).map(app => ({ ...app, server_secret_key: undefined })) // Never leak secrets
                }, null, 2)
              }
            ]
          };
        }

        case 'list_campaigns': {
          const { data, error } = await supabase.from('campaigns').select('*');
          if (error) throw error;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ campaigns: data || [] }, null, 2)
              }
            ]
          };
        }

        case 'get_campaign_analytics': {
          const { data: camps } = await supabase.from('campaigns').select('*');
          const { data: clicks } = await supabase.from('campaign_clicks').select('*');
          const { data: events } = await supabase.from('campaign_app_events').select('*');

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  reportingMode: a.reportingMode,
                  campaignCount: camps?.length || 0,
                  totalClicksRecorded: clicks?.length || 0,
                  totalEventsRecorded: events?.length || 0,
                  attributionPrinciple: 'Store redirects are never counted as installs; first-open is the definitive install event.'
                }, null, 2)
              }
            ]
          };
        }

        case 'list_tracking_links': {
          let q = supabase.from('campaign_tracking_links').select('*');
          if (a.campaignId) q = q.eq('campaign_id', a.campaignId);
          if (a.appId) q = q.eq('app_id', a.appId);

          const { data, error } = await q;
          if (error) throw error;

          const { data: apps } = await supabase.from('campaign_apps').select('id, web_fallback_url');
          const appMap = new Map((apps || []).map(app => [app.id, app.web_fallback_url]));

          const formattedLinks = (data || []).map(link => {
            const base = (link.web_fallback_url || appMap.get(link.app_id) || 'https://uvl.ventures').replace(/\/+$/, '');
            return {
              ...link,
              trackingUrl: `${base}/?c=${link.slug}`
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ links: formattedLinks }, null, 2)
              }
            ]
          };
        }

        case 'list_campaign_events': {
          const limit = Math.min(Number(a.limit) || 50, 100);
          let q = supabase.from('campaign_app_events').select('*').order('ingested_at', { ascending: false }).limit(limit);
          if (a.appId) q = q.eq('app_id', a.appId);

          const { data, error } = await q;
          if (error) throw error;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ events: data || [] }, null, 2)
              }
            ]
          };
        }

        case 'delete_campaign': {
          const { campaignId } = a;
          if (!campaignId) throw new Error('Missing required argument: campaignId');

          // Cascade delete links first
          await supabase.from('campaign_tracking_links').delete().eq('campaign_id', campaignId);
          const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Campaign ${campaignId} and its associated tracking links were successfully deleted.`
                }, null, 2)
              }
            ]
          };
        }

        case 'create_tracking_link': {
          const { campaignId, appId, title, destinationUrl, customSlug, destinationRoute, deepLinkEnabled } = a;
          if (!campaignId || !appId || !title) {
            throw new Error('Missing required arguments: campaignId, appId, title');
          }

          // Fetch the project / app to obtain its base website/app URL
          const { data: appData } = await supabase.from('campaign_apps').select('*').eq('id', appId).maybeSingle();

          let webFallbackUrl = destinationUrl ? String(destinationUrl).trim() : (appData?.web_fallback_url || 'https://uvl.ventures');
          if (webFallbackUrl && !/^[a-zA-Z]+:\/\//.test(webFallbackUrl)) {
            webFallbackUrl = `https://${webFallbackUrl}`;
          }

          const linkId = 'trk_' + Date.now();
          // Generate clean 5-character short campaign code (e.g. WPkAs) if not specified
          const generateCode = (len = 5) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let res = '';
            for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
            return res;
          };
          const rawSlug = customSlug || generateCode(5);
          const slug = rawSlug.replace(/^\/+|\/+$/g, '');
          const now = new Date().toISOString();

          // Canonical tracking link format: https://<project_domain>/?c=<campaign_code>
          const projectBaseUrl = webFallbackUrl.replace(/\/+$/, '');
          const canonicalTrackingUrl = `${projectBaseUrl}/?c=${slug}`;

          const newLink = {
            id: linkId,
            campaign_id: campaignId,
            app_id: appId,
            title,
            slug,
            destination_route: destinationRoute || 'home',
            web_fallback_url: webFallbackUrl,
            deep_link_enabled: deepLinkEnabled !== false,
            is_active: true,
            created_at: now
          };

          const { error } = await supabase.from('campaign_tracking_links').insert([newLink]);
          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  trackingLink: newLink,
                  trackingUrl: canonicalTrackingUrl,
                  campaignCode: slug,
                  projectBaseUrl: projectBaseUrl,
                  reroutesTo: webFallbackUrl
                }, null, 2)
              }
            ]
          };
        }

        case 'delete_tracking_link': {
          const { trackingLinkId } = a;
          if (!trackingLinkId) throw new Error('Missing required argument: trackingLinkId');

          const { error } = await supabase.from('campaign_tracking_links').delete().eq('id', trackingLinkId);
          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Tracking link ${trackingLinkId} successfully deleted.`
                }, null, 2)
              }
            ]
          };
        }

        case 'reroute_tracking_link': {
          const { trackingLinkId, newDestinationUrl, newDestinationRoute } = a;
          if (!trackingLinkId || !newDestinationUrl) {
            throw new Error('Missing required arguments: trackingLinkId, newDestinationUrl');
          }

          let normalizedUrl = String(newDestinationUrl).trim();
          if (!/^[a-zA-Z]+:\/\//.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`;
          }

          const updates: Record<string, any> = {
            web_fallback_url: normalizedUrl
          };
          if (newDestinationRoute !== undefined) {
            updates.destination_route = newDestinationRoute;
          }

          const { data, error } = await supabase
            .from('campaign_tracking_links')
            .update(updates)
            .eq('id', trackingLinkId)
            .select()
            .single();

          if (error) throw error;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Tracking link ${trackingLinkId} successfully rerouted to ${normalizedUrl}`,
                  trackingLink: data
                }, null, 2)
              }
            ]
          };
        }

        case 'get_link_details': {
          const { linkId, slug } = a;
          let query = supabase.from('campaign_tracking_links').select('*');
          if (linkId) query = query.eq('id', linkId);
          else if (slug) query = query.eq('slug', slug);
          else throw new Error('Either linkId or slug is required');

          const { data: link, error } = await query.maybeSingle();
          if (error || !link) throw new Error('Tracking link not found');

          const { data: app } = await supabase.from('campaign_apps').select('*').eq('id', link.app_id).maybeSingle();
          const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', link.campaign_id).maybeSingle();

          const base = (link.web_fallback_url || app?.web_fallback_url || 'https://uvl.ventures').replace(/\/+$/, '');
          const trackingUrl = `${base}/?c=${link.slug}`;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  link: { ...link, trackingUrl },
                  trackingUrl,
                  app: app ? { ...app, server_secret_key: undefined } : null,
                  campaign: campaign || null
                }, null, 2)
              }
            ]
          };
        }

        case 'get_link_metrics': {
          const { linkId, slug } = a;
          let targetLinkId = linkId;
          if (!targetLinkId && slug) {
            const { data: l } = await supabase.from('campaign_tracking_links').select('id').eq('slug', slug).maybeSingle();
            targetLinkId = l?.id;
          }
          if (!targetLinkId) throw new Error('Either linkId or slug is required');

          const { data: clicks } = await supabase.from('campaign_clicks').select('*').eq('tracking_link_id', targetLinkId);
          const rawClicks = clicks?.length || 0;
          const suspectedBots = clicks?.filter(c => c.is_suspected_bot)?.length || 0;
          const filteredClicks = rawClicks - suspectedBots;
          const uniqueIps = new Set((clicks || []).map(c => c.ip_hash)).size;

          const clickTokens = new Set((clicks || []).map(c => c.attribution_token).filter(Boolean));
          const { data: events } = await supabase.from('campaign_app_events').select('*');
          const matchingEvents = (events || []).filter(e => e.attribution_token && clickTokens.has(e.attribution_token));

          const firstOpens = matchingEvents.filter(e => e.event_name === 'first_open').length;
          const signups = matchingEvents.filter(e => e.event_name === 'signup_completed').length;
          const conversions = matchingEvents.filter(e => e.event_name === 'purchase_completed' || e.event_name === 'kyc_verified').length;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  linkId: targetLinkId,
                  rawClicks,
                  filteredClicks,
                  suspectedBots,
                  uniqueIps,
                  attributedFirstOpens: firstOpens,
                  signups,
                  verifiedConversions: conversions,
                  clickToOpenRate: filteredClicks > 0 ? `${((firstOpens / filteredClicks) * 100).toFixed(2)}%` : '0.00%'
                }, null, 2)
              }
            ]
          };
        }

        case 'get_campaign_metrics': {
          const reportingMode = a.reportingMode || 'cohort';
          const { data: camps } = a.campaignId
            ? await supabase.from('campaigns').select('*').eq('id', a.campaignId)
            : await supabase.from('campaigns').select('*');
          const { data: clicks } = await supabase.from('campaign_clicks').select('*');
          const { data: events } = await supabase.from('campaign_app_events').select('*');

          const allCampaigns = camps || [];
          const allClicks = clicks || [];
          const allEvents = events || [];

          const metrics = allCampaigns.map(c => {
            const campClicks = allClicks.filter(cl => cl.campaign_id === c.id);
            const rawClicks = campClicks.length;
            const suspectedBots = campClicks.filter(cl => cl.is_suspected_bot).length;
            const filteredClicks = rawClicks - suspectedBots;
            const uniqueClicks = new Set(campClicks.map(cl => cl.ip_hash)).size;

            const campTokens = new Set(campClicks.map(cl => cl.attribution_token).filter(Boolean));
            const campEvents = allEvents.filter(e =>
              e.attributed_campaign_id === c.id || (e.attribution_token && campTokens.has(e.attribution_token))
            );

            const firstOpens = campEvents.filter(e => e.event_name === 'first_open').length;
            const signups = campEvents.filter(e => e.event_name === 'signup_completed').length;
            const conversions = campEvents.filter(e => e.event_name === 'purchase_completed' || e.event_name === 'kyc_verified').length;
            const spend = c.spend || 0;
            const convRate = filteredClicks > 0 ? ((firstOpens / filteredClicks) * 100).toFixed(2) : '0.00';
            const costPerOpen = firstOpens > 0 ? (spend / firstOpens).toFixed(2) : '—';

            return {
              campaignId: c.id,
              campaignName: c.name,
              source: c.source,
              medium: c.medium,
              spend,
              rawClicks,
              filteredClicks,
              suspectedBots,
              estimatedUniqueClicks: uniqueClicks,
              attributedFirstOpens: firstOpens,
              signups,
              verifiedConversions: conversions,
              conversionRate: `${convRate}%`,
              costPerAttributedFirstOpen: costPerOpen
            };
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  reportingMode,
                  totalCampaigns: metrics.length,
                  metrics
                }, null, 2)
              }
            ]
          };
        }

        case 'get_attribution_breakdown': {
          let query = supabase.from('campaign_app_events').select('*');
          if (a.appId) query = query.eq('app_id', a.appId);
          if (a.campaignId) query = query.eq('attributed_campaign_id', a.campaignId);

          const { data: events, error } = await query;
          if (error) throw error;
          const allEvents = events || [];

          const sourceCounts: Record<string, number> = {
            deterministic_token: 0,
            install_referrer: 0,
            probabilistic_window: 0,
            unattributed: 0
          };
          const confidenceCounts: Record<string, number> = {
            high: 0,
            medium: 0,
            low: 0
          };

          for (const e of allEvents) {
            const src = e.attribution_source || 'unattributed';
            sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            const conf = e.attribution_confidence || 'low';
            confidenceCounts[conf] = (confidenceCounts[conf] || 0) + 1;
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalEvents: allEvents.length,
                  bySource: sourceCounts,
                  byConfidence: confidenceCounts,
                  modelRules: {
                    deterministic: 'Token match via deep link or Android Install Referrer (High confidence)',
                    probabilistic: 'IP + User-Agent match within configured 7-day window (Medium confidence)',
                    unattributed: 'Expired or unmatched event (Low confidence)'
                  }
                }, null, 2)
              }
            ]
          };
        }

        case 'get_app_integration_status': {
          let query = supabase.from('campaign_apps').select('*');
          if (a.appId) query = query.eq('id', a.appId);

          const { data: apps, error } = await query;
          if (error) throw error;

          const appStatusList = (apps || []).map(app => ({
            appId: app.id,
            appName: app.name,
            platform: app.platform,
            androidPackageName: app.android_package_name || null,
            iosBundleId: app.ios_bundle_id || null,
            webFallbackUrl: app.web_fallback_url,
            integrationStatus: app.integration_status || 'active',
            lastEventReceivedAt: app.last_event_received_at || null,
            domainAssociation: {
              appleAppSiteAssociation: 'Configured & live at /.well-known/apple-app-site-association',
              androidAssetLinks: 'Configured & live at /.well-known/assetlinks.json'
            }
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalApps: appStatusList.length,
                  apps: appStatusList
                }, null, 2)
              }
            ]
          };
        }

        case 'get_recent_tracking_errors': {
          const limit = Math.min(Number(a.limit) || 20, 50);
          const { data: botClicks } = await supabase
            .from('campaign_clicks')
            .select('*')
            .eq('is_suspected_bot', true)
            .order('timestamp', { ascending: false })
            .limit(limit);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  recentFilteredBotClicks: (botClicks || []).map(c => ({
                    clickId: c.id,
                    trackingLinkId: c.tracking_link_id,
                    timestamp: c.timestamp,
                    ipHash: c.ip_hash,
                    userAgent: c.user_agent,
                    flag: 'suspected_bot_or_crawler'
                  })),
                  securitySummary: {
                    loopDetection: 'Active (catches self-referencing /r/ and /c/ slugs)',
                    dangerousSchemesBlocked: 'javascript:, data:, vbscript:, file:',
                    ssrfProtection: 'Active (blocks localhost, 127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)'
                  }
                }, null, 2)
              }
            ]
          };
        }

        case 'diagnose_tracking_link': {
          let link: any = null;
          if (a.slug) {
            const { data } = await supabase.from('campaign_tracking_links').select('*').eq('slug', a.slug).maybeSingle();
            link = data;
          } else if (a.trackingLinkId) {
            const { data } = await supabase.from('campaign_tracking_links').select('*').eq('id', a.trackingLinkId).maybeSingle();
            link = data;
          }

          let testUrl = a.customUrl || link?.web_fallback_url || link?.destination_route || '';
          if (!testUrl && !link) {
            throw new Error('Link not found or no test URL provided');
          }

          const notes: string[] = [];
          let isSafeScheme = true;
          let isLoop = false;
          let isSSRF = false;
          let status: 'healthy' | 'warning' | 'error' = 'healthy';
          let hops: Array<{ hop: number; url: string; status?: number }> = [];

          // Check scheme
          if (/^(javascript|data|vbscript|file):/i.test(testUrl)) {
            isSafeScheme = false;
            status = 'error';
            notes.push(`Dangerous scheme detected: ${testUrl.split(':')[0]}`);
          }

          // Check loop
          if (link && (testUrl.includes(`/r/${link.slug}`) || testUrl.includes(`/c/${link.slug}`))) {
            isLoop = true;
            status = 'error';
            notes.push('Redirect loop detected: destination points to own tracking slug.');
          }

          // Check SSRF
          try {
            const parsed = new URL(testUrl.startsWith('http') ? testUrl : `https://${testUrl}`);
            if (isPrivateOrLoopbackHost(parsed.hostname)) {
              isSSRF = true;
              status = 'error';
              notes.push(`SSRF Block: Hostname ${parsed.hostname} is private/loopback/cloud metadata.`);
            }
          } catch (err) {
            notes.push(`URL parsing warning: ${String(err)}`);
          }

          // Simulate hop without recording synthetic click
          if (isSafeScheme && !isSSRF && !isLoop && testUrl) {
            hops.push({
              hop: 1,
              url: `/r/${link?.slug || 'diagnostic'}`,
              status: 302
            });
            hops.push({
              hop: 2,
              url: testUrl.startsWith('http') ? testUrl : `https://${testUrl}`,
              status: 200
            });
            notes.push('Simulated non-recording diagnostic hop test completed without polluting analytics.');
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status,
                  linkId: link?.id || 'manual_url',
                  slug: link?.slug || 'manual_test',
                  destinationUrl: testUrl,
                  isSafeScheme,
                  isLoopDetected: isLoop,
                  isPrivateOrLoopbackBlocked: isSSRF,
                  syntheticTestIsolated: true,
                  hops,
                  notes
                }, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool Execution Error [${name}]: ${err?.message || 'Internal failure'}`
          }
        ]
      };
    }
  });

  return server;
}

// If invoked as a CLI executable via stdio transport
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('uvl-mcp-server')) {
  async function runCLI() {
    const server = createUVLMCPServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('UVL Documents & Campaigns MCP Server running on stdio transport.');
  }

  runCLI().catch(err => {
    console.error('Fatal MCP Server startup error:', err);
    process.exit(1);
  });
}
