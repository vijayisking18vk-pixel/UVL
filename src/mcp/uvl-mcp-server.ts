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

        // CAMPAIGNS MODULE TOOLS
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

        // --- CAMPAIGNS TOOLS ---
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
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ links: data || [] }, null, 2)
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

          let webFallbackUrl = destinationUrl ? String(destinationUrl).trim() : 'https://uvl.ventures';
          if (webFallbackUrl && !/^[a-zA-Z]+:\/\//.test(webFallbackUrl)) {
            webFallbackUrl = `https://${webFallbackUrl}`;
          }

          const linkId = 'trk_' + Date.now();
          const rawSlug = customSlug || `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
          const slug = rawSlug.replace(/^\/+|\/+$/g, '');
          const now = new Date().toISOString();

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
                  trackingUrl: `/c/${slug}`,
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
