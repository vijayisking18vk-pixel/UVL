import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  UVLDocument,
  UVLDocumentVersion,
  UVLShareLink,
  UVLDocumentSession,
  UVLDocumentPageEvent,
  DocumentAnalyticsSummary,
  UVLCampaignApp,
  UVLCampaign,
  UVLTrackingLink,
  UVLClickEvent,
  UVLAppEvent,
  UVLAttributionPolicy,
  CampaignMetricsRow,
  UVLAuditLog
} from '../types';
import { inspectAndProcessPDF } from '../lib/pdfHelper';
import {
  uploadDocumentStorage,
  hashDocumentPassword,
  generateSecureShareToken
} from '../lib/documentStorage';
import {
  isLikelyBotOrPreview,
  generateAttributionToken,
  hashIpAddress,
  matchEventAttribution,
  computeCampaignMetrics
} from '../lib/campaignAttribution';
import { generateQRCodeDataUrl } from '../lib/qrCodeHelper';
import { sound } from '../utils/sound';

const DOCS_STORAGE_KEY = 'UVL_DOCUMENTS_STATE_V1';
const CAMPAIGNS_STORAGE_KEY = 'UVL_CAMPAIGNS_STATE_V1';

export function useDocumentsAndCampaigns(currentUserId: string, isVijayrajkumar: boolean) {
  // ----------------------------------------------------
  // DOCUMENTS MODULE STATE
  // ----------------------------------------------------
  const [documents, setDocuments] = useState<UVLDocument[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY + '_DOCS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [documentVersions, setDocumentVersions] = useState<UVLDocumentVersion[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY + '_VERSIONS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [shareLinks, setShareLinks] = useState<UVLShareLink[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY + '_LINKS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [documentSessions, setDocumentSessions] = useState<UVLDocumentSession[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY + '_SESSIONS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [documentPageEvents, setDocumentPageEvents] = useState<UVLDocumentPageEvent[]>(() => {
    try {
      const saved = localStorage.getItem(DOCS_STORAGE_KEY + '_PAGE_EVENTS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // ----------------------------------------------------
  // CAMPAIGNS MODULE STATE
  // ----------------------------------------------------
  const [campaignApps, setCampaignApps] = useState<UVLCampaignApp[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_APPS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [campaigns, setCampaigns] = useState<UVLCampaign[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_CAMPAIGNS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [trackingLinks, setTrackingLinks] = useState<UVLTrackingLink[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_LINKS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clickEvents, setClickEvents] = useState<UVLClickEvent[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_CLICKS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appEvents, setAppEvents] = useState<UVLAppEvent[]>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_EVENTS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [attributionPolicy, setAttributionPolicy] = useState<UVLAttributionPolicy>(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_STORAGE_KEY + '_POLICY');
      return saved
        ? JSON.parse(saved)
        : {
            windowDays: 7,
            model: 'last_touch',
            separateReengagement: true,
            policyVersion: '1.0'
          };
    } catch {
      return {
        windowDays: 7,
        model: 'last_touch',
        separateReengagement: true,
        policyVersion: '1.0'
      };
    }
  });

  const [auditLogs, setAuditLogs] = useState<UVLAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('UVL_AUDIT_LOGS_V1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ----------------------------------------------------
  // LOCAL CACHE PERSISTENCE
  // ----------------------------------------------------
  useEffect(() => {
    try {
      localStorage.setItem(DOCS_STORAGE_KEY + '_DOCS', JSON.stringify(documents));
      localStorage.setItem(DOCS_STORAGE_KEY + '_VERSIONS', JSON.stringify(documentVersions));
      localStorage.setItem(DOCS_STORAGE_KEY + '_LINKS', JSON.stringify(shareLinks));
      localStorage.setItem(DOCS_STORAGE_KEY + '_SESSIONS', JSON.stringify(documentSessions));
      localStorage.setItem(DOCS_STORAGE_KEY + '_PAGE_EVENTS', JSON.stringify(documentPageEvents));
    } catch {}
  }, [documents, documentVersions, shareLinks, documentSessions, documentPageEvents]);

  useEffect(() => {
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_APPS', JSON.stringify(campaignApps));
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_CAMPAIGNS', JSON.stringify(campaigns));
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_LINKS', JSON.stringify(trackingLinks));
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_CLICKS', JSON.stringify(clickEvents));
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_EVENTS', JSON.stringify(appEvents));
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY + '_POLICY', JSON.stringify(attributionPolicy));
      localStorage.setItem('UVL_AUDIT_LOGS_V1', JSON.stringify(auditLogs));
    } catch {}
  }, [campaignApps, campaigns, trackingLinks, clickEvents, appEvents, attributionPolicy, auditLogs]);

  // ----------------------------------------------------
  // INITIAL SUPABASE SYNC
  // ----------------------------------------------------
  useEffect(() => {
    let mounted = true;
    async function fetchFromSupabase() {
      try {
        // Sync Documents
        const { data: dbDocs } = await supabase.from('documents').select('*');
        if (mounted && dbDocs && dbDocs.length > 0) {
          setDocuments(
            dbDocs.map(d => ({
              id: d.id,
              workspaceId: d.workspace_id,
              name: d.name,
              description: d.description || '',
              folder: d.folder || 'Default',
              status: d.status,
              currentVersionNumber: d.current_version_number,
              totalPages: d.total_pages,
              fileSize: d.file_size,
              fileType: d.file_type,
              storagePath: d.storage_path,
              thumbnailUrl: d.thumbnail_url,
              isArchived: d.is_archived,
              createdBy: d.created_by,
              createdAt: d.created_at,
              updatedAt: d.updated_at,
              tags: d.tags || []
            }))
          );
        }

        // Sync Versions
        const { data: dbVers } = await supabase.from('document_versions').select('*');
        if (mounted && dbVers && dbVers.length > 0) {
          setDocumentVersions(
            dbVers.map(v => ({
              id: v.id,
              documentId: v.document_id,
              versionNumber: v.version_number,
              storagePath: v.storage_path,
              fileName: v.file_name,
              fileSize: v.file_size,
              totalPages: v.total_pages,
              uploadedBy: v.uploaded_by,
              changelog: v.changelog,
              createdAt: v.created_at
            }))
          );
        }

        // Sync Share Links
        const { data: dbLinks } = await supabase.from('document_share_links').select('*');
        if (mounted && dbLinks && dbLinks.length > 0) {
          setShareLinks(
            dbLinks.map(l => ({
              id: l.id,
              documentId: l.document_id,
              token: l.token,
              label: l.label,
              status: l.status,
              expiresAt: l.expires_at,
              revokedAt: l.revoked_at,
              revokedBy: l.revoked_by,
              passwordProtected: l.password_protected,
              passwordHash: l.password_hash,
              requireEmail: l.require_email,
              requireVerifiedEmail: l.require_verified_email,
              allowlistDomains: l.allowlist_domains || [],
              allowlistEmails: l.allowlist_emails || [],
              allowDownload: l.allow_download,
              watermarkEnabled: l.watermark_enabled,
              watermarkText: l.watermark_text,
              createdBy: l.created_by,
              createdAt: l.created_at
            }))
          );
        }

        // Sync Sessions
        const { data: dbSessions } = await supabase.from('document_sessions').select('*');
        if (mounted && dbSessions && dbSessions.length > 0) {
          setDocumentSessions(
            dbSessions.map(s => ({
              id: s.id,
              documentId: s.document_id,
              versionId: s.version_id,
              shareLinkId: s.share_link_id,
              viewerType: s.viewer_type,
              viewerEmail: s.viewer_email,
              ipHash: s.ip_hash,
              userAgent: s.user_agent,
              browser: s.browser,
              os: s.os,
              deviceType: s.device_type,
              country: s.country,
              city: s.city,
              startedAt: s.started_at,
              lastActiveAt: s.last_active_at,
              endedAt: s.ended_at,
              totalDurationSeconds: s.total_duration_seconds,
              activeDurationSeconds: s.active_duration_seconds,
              pagesViewed: s.pages_viewed || [],
              completionPercent: s.completion_percent,
              downloadRequested: s.download_requested,
              isSuspectedBot: s.is_suspected_bot
            }))
          );
        }

        // Sync Page Events
        const { data: dbPageEvents } = await supabase.from('document_page_events').select('*');
        if (mounted && dbPageEvents && dbPageEvents.length > 0) {
          setDocumentPageEvents(
            dbPageEvents.map(pe => ({
              id: pe.id,
              sessionId: pe.session_id,
              documentId: pe.document_id,
              versionId: pe.version_id,
              pageNumber: pe.page_number,
              activeSeconds: pe.active_seconds,
              createdAt: pe.created_at,
              updatedAt: pe.updated_at
            }))
          );
        }

        // Sync Campaign Apps
        const { data: dbApps } = await supabase.from('campaign_apps').select('*');
        if (mounted && dbApps && dbApps.length > 0) {
          setCampaignApps(
            dbApps.map(a => ({
              id: a.id,
              workspaceId: a.workspace_id,
              name: a.name,
              platform: a.platform,
              androidPackageName: a.android_package_name,
              iosBundleId: a.ios_bundle_id,
              playStoreUrl: a.play_store_url,
              appStoreUrl: a.app_store_url,
              webFallbackUrl: a.web_fallback_url,
              approvedDeepLinkRoutes: a.approved_deep_link_routes || [],
              approvedDomains: a.approved_domains || [],
              environment: a.environment,
              publishableClientKey: a.publishable_client_key,
              serverSecretKey: a.server_secret_key,
              integrationStatus: a.integration_status,
              lastEventReceivedAt: a.last_event_received_at,
              createdAt: a.created_at,
              updatedAt: a.updated_at
            }))
          );
        }

        // Sync Campaigns
        const { data: dbCamps } = await supabase.from('campaigns').select('*');
        if (mounted && dbCamps && dbCamps.length > 0) {
          setCampaigns(
            dbCamps.map(c => ({
              id: c.id,
              workspaceId: c.workspace_id,
              appId: c.app_id,
              name: c.name,
              source: c.source,
              medium: c.medium,
              status: c.status,
              spend: Number(c.spend || 0),
              currency: c.currency || 'INR',
              reportingPeriod: c.reporting_period || 'all',
              startDate: c.start_date,
              endDate: c.end_date,
              utmCampaign: c.utm_campaign,
              utmContent: c.utm_content,
              utmTerm: c.utm_term,
              creativeLabel: c.creative_label,
              placementLabel: c.placement_label,
              influencerLabel: c.influencer_label,
              createdAt: c.created_at,
              updatedAt: c.updated_at
            }))
          );
        }

        // Sync Tracking Links
        const { data: dbTrackLinks } = await supabase.from('campaign_tracking_links').select('*');
        if (mounted && dbTrackLinks && dbTrackLinks.length > 0) {
          setTrackingLinks(
            dbTrackLinks.map(tl => ({
              id: tl.id,
              campaignId: tl.campaign_id,
              appId: tl.app_id,
              slug: tl.slug,
              title: tl.title,
              destinationRoute: tl.destination_route,
              webFallbackUrl: tl.web_fallback_url,
              deepLinkEnabled: tl.deep_link_enabled,
              isActive: tl.is_active,
              expiresAt: tl.expires_at,
              qrCodeDataUrl: tl.qr_code_data_url,
              auditHistory: tl.audit_history || [],
              createdAt: tl.created_at
            }))
          );
        }

        // Sync Clicks
        const { data: dbClicks } = await supabase.from('campaign_clicks').select('*');
        if (mounted && dbClicks && dbClicks.length > 0) {
          setClickEvents(
            dbClicks.map(ck => ({
              id: ck.id,
              trackingLinkId: ck.tracking_link_id,
              campaignId: ck.campaign_id,
              appId: ck.app_id,
              attributionToken: ck.attribution_token,
              timestamp: ck.timestamp,
              ipHash: ck.ip_hash,
              userAgent: ck.user_agent,
              browser: ck.browser,
              os: ck.os,
              platform: ck.platform,
              referrer: ck.referrer,
              coarseGeo: ck.coarse_geo,
              isSuspectedBot: ck.is_suspected_bot
            }))
          );
        }

        // Sync App Events
        const { data: dbAppEvents } = await supabase.from('campaign_app_events').select('*');
        if (mounted && dbAppEvents && dbAppEvents.length > 0) {
          setAppEvents(
            dbAppEvents.map(ae => ({
              id: ae.id,
              appId: ae.app_id,
              eventName: ae.event_name,
              environment: ae.environment,
              appInstanceId: ae.app_instance_id,
              userId: ae.user_id,
              occurredAt: ae.occurred_at,
              ingestedAt: ae.ingested_at,
              attributionToken: ae.attribution_token,
              attributedCampaignId: ae.attributed_campaign_id,
              attributedLinkId: ae.attributed_link_id,
              attributionSource: ae.attribution_source,
              attributionConfidence: ae.attribution_confidence,
              properties: ae.properties || {},
              sdkVersion: ae.sdk_version || '1.0.0'
            }))
          );
        }
      } catch (err) {
        console.warn('Initial Supabase fetch completed with fallback to local state:', err);
      }
    }

    fetchFromSupabase();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: Append Audit Log
  const logAudit = useCallback(
    async (
      module: 'documents' | 'campaigns' | 'access' | 'system',
      action: string,
      entityType: string,
      entityId: string,
      metadata: Record<string, any> = {}
    ) => {
      const entry: UVLAuditLog = {
        id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        workspaceId: 'default',
        actorId: currentUserId,
        module,
        action,
        entityType,
        entityId,
        metadata,
        createdAt: new Date().toISOString()
      };

      setAuditLogs(prev => [entry, ...prev]);

      try {
        await supabase.from('audit_logs').insert([
          {
            id: entry.id,
            workspace_id: entry.workspaceId,
            actor_id: entry.actorId,
            module: entry.module,
            action: entry.action,
            entity_type: entry.entityType,
            entity_id: entry.entityId,
            metadata: entry.metadata,
            created_at: entry.createdAt
          }
        ]);
      } catch {}
    },
    [currentUserId]
  );

  // ----------------------------------------------------
  // DOCUMENTS MODULE ACTIONS
  // ----------------------------------------------------

  /**
   * Uploads and registers a new PDF document and its initial version (v1)
   */
  const uploadDocument = useCallback(
    async (
      file: File,
      name: string,
      description: string,
      folder: string = 'General',
      tags: string[] = []
    ): Promise<UVLDocument> => {
      // 1. Process & validate PDF
      const inspection = await inspectAndProcessPDF(file);
      if (!inspection.valid) {
        throw new Error(inspection.error || 'Invalid PDF file');
      }

      const docId = 'doc_' + Date.now();
      const versionId = 'ver_' + Date.now() + '_1';
      const now = new Date().toISOString();

      // 2. Upload storage
      const { storagePath } = await uploadDocumentStorage('default', docId, 1, file);

      // 3. Create document record
      const newDoc: UVLDocument = {
        id: docId,
        workspaceId: 'default',
        name: name.trim() || file.name.replace(/\.pdf$/i, ''),
        description: description.trim(),
        folder: folder.trim() || 'General',
        status: 'ready',
        currentVersionNumber: 1,
        totalPages: inspection.totalPages,
        fileSize: file.size,
        fileType: 'application/pdf',
        storagePath,
        thumbnailUrl: inspection.thumbnailDataUrl,
        isArchived: false,
        createdBy: currentUserId,
        createdAt: now,
        updatedAt: now,
        tags
      };

      // 4. Create version record
      const newVersion: UVLDocumentVersion = {
        id: versionId,
        documentId: docId,
        versionNumber: 1,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        totalPages: inspection.totalPages,
        uploadedBy: currentUserId,
        changelog: 'Initial version upload',
        createdAt: now
      };

      setDocuments(prev => [newDoc, ...prev]);
      setDocumentVersions(prev => [newVersion, ...prev]);

      // Sync Supabase
      try {
        await supabase.from('documents').insert([
          {
            id: newDoc.id,
            workspace_id: newDoc.workspaceId,
            name: newDoc.name,
            description: newDoc.description,
            folder: newDoc.folder,
            status: newDoc.status,
            current_version_number: newDoc.currentVersionNumber,
            total_pages: newDoc.totalPages,
            file_size: newDoc.fileSize,
            file_type: newDoc.fileType,
            storage_path: newDoc.storagePath,
            thumbnail_url: newDoc.thumbnailUrl,
            is_archived: newDoc.isArchived,
            created_by: newDoc.createdBy,
            created_at: newDoc.createdAt,
            updated_at: newDoc.updatedAt,
            tags: newDoc.tags
          }
        ]);

        await supabase.from('document_versions').insert([
          {
            id: newVersion.id,
            document_id: newVersion.documentId,
            version_number: newVersion.versionNumber,
            storage_path: newVersion.storagePath,
            file_name: newVersion.fileName,
            file_size: newVersion.fileSize,
            total_pages: newVersion.totalPages,
            uploaded_by: newVersion.uploadedBy,
            changelog: newVersion.changelog,
            created_at: newVersion.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Document Supabase insert error, persisted locally:', err);
      }

      await logAudit('documents', 'document_created', 'document', newDoc.id, {
        name: newDoc.name,
        pages: newDoc.totalPages,
        fileSize: newDoc.fileSize
      });

      sound.patchStamp();
      return newDoc;
    },
    [currentUserId, logAudit]
  );

  /**
   * Uploads a replacement version for an existing document.
   * Existing share links continue working and preserve historical analytics.
   */
  const uploadDocumentVersion = useCallback(
    async (documentId: string, file: File, changelog: string = ''): Promise<UVLDocumentVersion> => {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) throw new Error('Document not found');

      const inspection = await inspectAndProcessPDF(file);
      if (!inspection.valid) {
        throw new Error(inspection.error || 'Invalid PDF file');
      }

      const nextVersionNum = doc.currentVersionNumber + 1;
      const versionId = `ver_${Date.now()}_${nextVersionNum}`;
      const now = new Date().toISOString();

      const { storagePath } = await uploadDocumentStorage('default', documentId, nextVersionNum, file);

      const newVersion: UVLDocumentVersion = {
        id: versionId,
        documentId,
        versionNumber: nextVersionNum,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        totalPages: inspection.totalPages,
        uploadedBy: currentUserId,
        changelog: changelog.trim() || `Version ${nextVersionNum}`,
        createdAt: now
      };

      // Update document's current version and total pages
      setDocuments(prev =>
        prev.map(d =>
          d.id === documentId
            ? {
                ...d,
                currentVersionNumber: nextVersionNum,
                totalPages: inspection.totalPages,
                fileSize: file.size,
                storagePath,
                thumbnailUrl: inspection.thumbnailDataUrl || d.thumbnailUrl,
                updatedAt: now
              }
            : d
        )
      );

      setDocumentVersions(prev => [newVersion, ...prev]);

      try {
        await supabase
          .from('documents')
          .update({
            current_version_number: nextVersionNum,
            total_pages: inspection.totalPages,
            file_size: file.size,
            storage_path: storagePath,
            thumbnail_url: inspection.thumbnailDataUrl || doc.thumbnailUrl,
            updated_at: now
          })
          .eq('id', documentId);

        await supabase.from('document_versions').insert([
          {
            id: newVersion.id,
            document_id: newVersion.documentId,
            version_number: newVersion.versionNumber,
            storage_path: newVersion.storagePath,
            file_name: newVersion.fileName,
            file_size: newVersion.fileSize,
            total_pages: newVersion.totalPages,
            uploaded_by: newVersion.uploadedBy,
            changelog: newVersion.changelog,
            created_at: newVersion.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Document version sync error:', err);
      }

      await logAudit('documents', 'version_uploaded', 'document', documentId, {
        versionNumber: nextVersionNum,
        changelog: newVersion.changelog
      });

      sound.patchStamp();
      return newVersion;
    },
    [documents, currentUserId, logAudit]
  );

  /**
   * Creates an independent secure share link for a document.
   */
  const createShareLink = useCallback(
    async (linkData: {
      documentId: string;
      label: string;
      expiresAt?: string;
      password?: string;
      requireEmail?: boolean;
      requireVerifiedEmail?: boolean;
      allowlistDomains?: string[];
      allowlistEmails?: string[];
      allowDownload?: boolean;
      watermarkEnabled?: boolean;
      watermarkText?: string;
    }): Promise<UVLShareLink> => {
      const linkId = 'lnk_' + Date.now();
      const token = generateSecureShareToken();
      const now = new Date().toISOString();

      let passwordProtected = false;
      let passwordHash: string | undefined = undefined;

      if (linkData.password && linkData.password.trim().length > 0) {
        passwordProtected = true;
        passwordHash = await hashDocumentPassword(linkData.password.trim());
      }

      const newLink: UVLShareLink = {
        id: linkId,
        documentId: linkData.documentId,
        token,
        label: linkData.label.trim() || 'Default Share Link',
        status: 'active',
        expiresAt: linkData.expiresAt,
        passwordProtected,
        passwordHash,
        requireEmail: !!linkData.requireEmail,
        requireVerifiedEmail: !!linkData.requireVerifiedEmail,
        allowlistDomains: linkData.allowlistDomains || [],
        allowlistEmails: linkData.allowlistEmails || [],
        allowDownload: !!linkData.allowDownload,
        watermarkEnabled: !!linkData.watermarkEnabled,
        watermarkText: linkData.watermarkText,
        createdBy: currentUserId,
        createdAt: now
      };

      setShareLinks(prev => [newLink, ...prev]);

      try {
        await supabase.from('document_share_links').insert([
          {
            id: newLink.id,
            document_id: newLink.documentId,
            token: newLink.token,
            label: newLink.label,
            status: newLink.status,
            expires_at: newLink.expiresAt,
            password_protected: newLink.passwordProtected,
            password_hash: newLink.passwordHash,
            require_email: newLink.requireEmail,
            require_verified_email: newLink.requireVerifiedEmail,
            allowlist_domains: newLink.allowlistDomains,
            allowlist_emails: newLink.allowlistEmails,
            allow_download: newLink.allowDownload,
            watermark_enabled: newLink.watermarkEnabled,
            watermark_text: newLink.watermarkText,
            created_by: newLink.createdBy,
            created_at: newLink.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Share link Supabase insert error:', err);
      }

      await logAudit('documents', 'share_link_created', 'document_share_link', newLink.id, {
        documentId: newLink.documentId,
        label: newLink.label,
        allowDownload: newLink.allowDownload,
        passwordProtected: newLink.passwordProtected
      });

      sound.click();
      return newLink;
    },
    [currentUserId, logAudit]
  );

  /**
   * Updates an existing share link configuration
   */
  const updateShareLink = useCallback(
    async (
      linkId: string,
      updates: Partial<UVLShareLink> & { newPassword?: string }
    ): Promise<void> => {
      let passwordUpdates: Partial<UVLShareLink> = {};
      if (updates.newPassword !== undefined) {
        if (updates.newPassword.trim().length > 0) {
          const hash = await hashDocumentPassword(updates.newPassword.trim());
          passwordUpdates = { passwordProtected: true, passwordHash: hash };
        } else {
          passwordUpdates = { passwordProtected: false, passwordHash: undefined };
        }
      }

      const mergedUpdates = { ...updates, ...passwordUpdates };
      delete (mergedUpdates as any).newPassword;

      setShareLinks(prev => prev.map(l => (l.id === linkId ? { ...l, ...mergedUpdates } : l)));

      try {
        const dbPayload: any = {};
        if (mergedUpdates.label !== undefined) dbPayload.label = mergedUpdates.label;
        if (mergedUpdates.expiresAt !== undefined) dbPayload.expires_at = mergedUpdates.expiresAt;
        if (mergedUpdates.status !== undefined) dbPayload.status = mergedUpdates.status;
        if (mergedUpdates.passwordProtected !== undefined)
          dbPayload.password_protected = mergedUpdates.passwordProtected;
        if (mergedUpdates.passwordHash !== undefined) dbPayload.password_hash = mergedUpdates.passwordHash;
        if (mergedUpdates.requireEmail !== undefined) dbPayload.require_email = mergedUpdates.requireEmail;
        if (mergedUpdates.requireVerifiedEmail !== undefined)
          dbPayload.require_verified_email = mergedUpdates.requireVerifiedEmail;
        if (mergedUpdates.allowlistDomains !== undefined)
          dbPayload.allowlist_domains = mergedUpdates.allowlistDomains;
        if (mergedUpdates.allowlistEmails !== undefined)
          dbPayload.allowlist_emails = mergedUpdates.allowlistEmails;
        if (mergedUpdates.allowDownload !== undefined) dbPayload.allow_download = mergedUpdates.allowDownload;
        if (mergedUpdates.watermarkEnabled !== undefined)
          dbPayload.watermark_enabled = mergedUpdates.watermarkEnabled;
        if (mergedUpdates.watermarkText !== undefined) dbPayload.watermark_text = mergedUpdates.watermarkText;

        await supabase.from('document_share_links').update(dbPayload).eq('id', linkId);
      } catch (err) {
        console.warn('Share link update error:', err);
      }

      await logAudit('documents', 'share_link_updated', 'document_share_link', linkId, mergedUpdates);
      sound.click();
    },
    [logAudit]
  );

  /**
   * Revokes a share link immediately
   */
  const revokeShareLink = useCallback(
    async (linkId: string): Promise<void> => {
      const now = new Date().toISOString();
      setShareLinks(prev =>
        prev.map(l =>
          l.id === linkId
            ? { ...l, status: 'revoked', revokedAt: now, revokedBy: currentUserId }
            : l
        )
      );

      try {
        await supabase
          .from('document_share_links')
          .update({ status: 'revoked', revoked_at: now, revoked_by: currentUserId })
          .eq('id', linkId);
      } catch (err) {
        console.warn('Revoke link Supabase error:', err);
      }

      await logAudit('documents', 'share_link_revoked', 'document_share_link', linkId);
      sound.alert();
    },
    [currentUserId, logAudit]
  );

  /**
   * Deletes a document and archives associated links
   */
  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setDocumentVersions(prev => prev.filter(v => v.documentId !== documentId));
      setShareLinks(prev => prev.filter(l => l.documentId !== documentId));

      try {
        await supabase.from('documents').delete().eq('id', documentId);
      } catch (err) {
        console.warn('Delete document Supabase error:', err);
      }

      await logAudit('documents', 'document_deleted', 'document', documentId);
      sound.alert();
    },
    [logAudit]
  );

  /**
   * Calculates comprehensive Document Analytics with distinct page completion formula
   */
  const getDocumentAnalytics = useCallback(
    (documentId: string, versionId?: string, linkId?: string): DocumentAnalyticsSummary => {
      const doc = documents.find(d => d.id === documentId);
      const totalPages = doc?.totalPages || 1;

      // Filter sessions
      let relevantSessions = documentSessions.filter(s => s.documentId === documentId);
      if (versionId) {
        relevantSessions = relevantSessions.filter(s => s.versionId === versionId);
      }
      if (linkId) {
        relevantSessions = relevantSessions.filter(s => s.shareLinkId === linkId);
      }

      const totalSessions = relevantSessions.length;

      // Deduplicate unique viewers by IP hash + User-Agent
      const uniqueViewersSet = new Set(
        relevantSessions.map(s => `${s.ipHash}_${s.userAgent || 'unknown'}`)
      );
      const estimatedUniqueViewers = uniqueViewersSet.size;

      const verifiedViewers = relevantSessions.filter(s => s.viewerType === 'verified').length;

      // Calculate returning sessions (viewers who appeared > 1 time)
      const viewerCounts: Record<string, number> = {};
      relevantSessions.forEach(s => {
        const key = `${s.ipHash}_${s.userAgent || 'unknown'}`;
        viewerCounts[key] = (viewerCounts[key] || 0) + 1;
      });
      const returningSessions = Object.values(viewerCounts).filter(c => c > 1).length;

      // Durations & completions
      const totalActiveDuration = relevantSessions.reduce((acc, s) => acc + (s.activeDurationSeconds || 0), 0);
      const averageActiveDurationSeconds = totalSessions > 0 ? Math.round(totalActiveDuration / totalSessions) : 0;

      // Completion is defined strictly as distinct pages viewed / total pages
      const totalCompletion = relevantSessions.reduce((acc, s) => acc + (s.completionPercent || 0), 0);
      const averageCompletionPercent = totalSessions > 0 ? Math.round(totalCompletion / totalSessions) : 0;

      const totalDownloads = relevantSessions.filter(s => s.downloadRequested).length;

      // Page-by-page engagement
      const relevantPageEvents = documentPageEvents.filter(pe => pe.documentId === documentId);
      const pagePerformance: { pageNumber: number; averageActiveSeconds: number; viewCount: number }[] = [];
      const dropoffCurve: { pageNumber: number; viewersReached: number; percentReached: number }[] = [];

      for (let p = 1; p <= totalPages; p++) {
        const eventsForPage = relevantPageEvents.filter(pe => pe.pageNumber === p);
        const count = eventsForPage.length;
        const totalSecs = eventsForPage.reduce((acc, pe) => acc + pe.activeSeconds, 0);
        const avgSecs = count > 0 ? Math.round(totalSecs / count) : 0;

        pagePerformance.push({
          pageNumber: p,
          averageActiveSeconds: avgSecs,
          viewCount: count
        });

        // Dropoff: sessions that viewed page >= p
        const sessionsReachingPage = relevantSessions.filter(s => (s.pagesViewed || []).includes(p)).length;
        dropoffCurve.push({
          pageNumber: p,
          viewersReached: sessionsReachingPage,
          percentReached: totalSessions > 0 ? Math.round((sessionsReachingPage / totalSessions) * 100) : 0
        });
      }

      // Version breakdown
      const docVersions = documentVersions.filter(v => v.documentId === documentId);
      const versionBreakdown = docVersions.map(v => {
        const vSessions = relevantSessions.filter(s => s.versionId === v.id);
        const vDuration = vSessions.reduce((acc, s) => acc + (s.activeDurationSeconds || 0), 0);
        return {
          versionNumber: v.versionNumber,
          sessionsCount: vSessions.length,
          averageDurationSeconds: vSessions.length > 0 ? Math.round(vDuration / vSessions.length) : 0
        };
      });

      // Link breakdown
      const docLinks = shareLinks.filter(l => l.documentId === documentId);
      const linkBreakdown = docLinks.map(l => {
        const lSessions = relevantSessions.filter(s => s.shareLinkId === l.id);
        const lDuration = lSessions.reduce((acc, s) => acc + (s.activeDurationSeconds || 0), 0);
        return {
          linkId: l.id,
          label: l.label,
          token: l.token,
          sessionsCount: lSessions.length,
          activeSeconds: lDuration
        };
      });

      return {
        documentId,
        totalSessions,
        estimatedUniqueViewers,
        verifiedViewers,
        returningSessions,
        averageActiveDurationSeconds,
        averageCompletionPercent,
        totalDownloads,
        pagePerformance,
        dropoffCurve,
        versionBreakdown,
        linkBreakdown,
        recentSessions: relevantSessions.slice(0, 50)
      };
    },
    [documents, documentSessions, documentPageEvents, documentVersions, shareLinks]
  );

  /**
   * Public/Viewer session creator
   */
  const recordDocumentSession = useCallback(
    async (
      sessionData: Omit<UVLDocumentSession, 'id' | 'startedAt' | 'lastActiveAt'>
    ): Promise<UVLDocumentSession> => {
      const sessionId = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      const newSession: UVLDocumentSession = {
        ...sessionData,
        id: sessionId,
        startedAt: now,
        lastActiveAt: now
      };

      setDocumentSessions(prev => [newSession, ...prev]);

      try {
        await supabase.from('document_sessions').insert([
          {
            id: newSession.id,
            document_id: newSession.documentId,
            version_id: newSession.versionId,
            share_link_id: newSession.shareLinkId,
            viewer_type: newSession.viewerType,
            viewer_email: newSession.viewerEmail,
            ip_hash: newSession.ipHash,
            user_agent: newSession.userAgent,
            browser: newSession.browser,
            os: newSession.os,
            device_type: newSession.deviceType,
            country: newSession.country,
            city: newSession.city,
            started_at: newSession.startedAt,
            last_active_at: newSession.lastActiveAt,
            total_duration_seconds: newSession.totalDurationSeconds,
            active_duration_seconds: newSession.activeDurationSeconds,
            pages_viewed: newSession.pagesViewed,
            completion_percent: newSession.completionPercent,
            download_requested: newSession.downloadRequested,
            is_suspected_bot: newSession.isSuspectedBot
          }
        ]);
      } catch (err) {
        console.warn('Session Supabase insert error:', err);
      }

      return newSession;
    },
    []
  );

  /**
   * Ingests a bounded active reading heartbeat for a specific page.
   * Caps credit to a maximum of 10s per heartbeat to prevent idle time accumulation.
   */
  const ingestDocumentHeartbeat = useCallback(
    async (sessionId: string, pageNumber: number, durationSeconds: number): Promise<void> => {
      // 1. Cap duration credit
      const cappedDuration = Math.min(Math.max(1, durationSeconds), 10);
      const now = new Date().toISOString();

      // Find session to get totalPages for completion calculation
      const session = documentSessions.find(s => s.id === sessionId);
      if (!session) return;

      const doc = documents.find(d => d.id === session.documentId);
      const totalPages = doc?.totalPages || 1;

      // Update pagesViewed set
      const pagesSet = new Set(session.pagesViewed || []);
      pagesSet.add(pageNumber);
      const updatedPages = Array.from(pagesSet).sort((a, b) => a - b);
      const newCompletion = Math.min(100, Math.round((updatedPages.length / totalPages) * 100));

      // Update session state
      setDocumentSessions(prev =>
        prev.map(s =>
          s.id === sessionId
            ? {
                ...s,
                lastActiveAt: now,
                activeDurationSeconds: s.activeDurationSeconds + cappedDuration,
                pagesViewed: updatedPages,
                completionPercent: newCompletion
              }
            : s
        )
      );

      // Upsert page event
      setDocumentPageEvents(prev => {
        const existingIndex = prev.findIndex(
          pe => pe.sessionId === sessionId && pe.pageNumber === pageNumber
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            activeSeconds: updated[existingIndex].activeSeconds + cappedDuration,
            updatedAt: now
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: 'pe_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              sessionId,
              documentId: session.documentId,
              versionId: session.versionId,
              pageNumber,
              activeSeconds: cappedDuration,
              createdAt: now,
              updatedAt: now
            }
          ];
        }
      });

      // Async write to Supabase
      try {
        await supabase
          .from('document_sessions')
          .update({
            last_active_at: now,
            active_duration_seconds: session.activeDurationSeconds + cappedDuration,
            pages_viewed: updatedPages,
            completion_percent: newCompletion
          })
          .eq('id', sessionId);

        await supabase.from('document_page_events').upsert([
          {
            session_id: sessionId,
            document_id: session.documentId,
            version_id: session.versionId,
            page_number: pageNumber,
            active_seconds: cappedDuration,
            updated_at: now
          }
        ]);
      } catch {}
    },
    [documentSessions, documents]
  );

  /**
   * Records a download request for a viewer session
   */
  const recordDocumentDownload = useCallback(
    async (sessionId: string): Promise<void> => {
      setDocumentSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, downloadRequested: true } : s))
      );

      try {
        await supabase
          .from('document_sessions')
          .update({ download_requested: true })
          .eq('id', sessionId);
      } catch {}

      await logAudit('documents', 'document_download_requested', 'document_session', sessionId);
    },
    [logAudit]
  );

  // ----------------------------------------------------
  // CAMPAIGNS MODULE ACTIONS
  // ----------------------------------------------------

  /**
   * Registers a new connected mobile or web application
   */
  const registerCampaignApp = useCallback(
    async (appData: {
      name: string;
      platform: 'android' | 'ios' | 'react_native' | 'flutter' | 'web_pwa';
      androidPackageName?: string;
      iosBundleId?: string;
      playStoreUrl?: string;
      appStoreUrl?: string;
      webFallbackUrl: string;
      approvedDeepLinkRoutes?: string[];
      approvedDomains?: string[];
      environment: 'development' | 'staging' | 'production';
    }): Promise<UVLCampaignApp> => {
      const appId = 'app_' + Date.now();
      const pubKey = 'uvl_pub_' + Math.random().toString(36).substring(2, 12);
      const secKey = 'uvl_sec_' + Math.random().toString(36).substring(2, 18);
      const now = new Date().toISOString();

      const newApp: UVLCampaignApp = {
        ...appData,
        id: appId,
        workspaceId: 'default',
        publishableClientKey: pubKey,
        serverSecretKey: secKey,
        approvedDeepLinkRoutes: appData.approvedDeepLinkRoutes || ['home', 'product', 'invite', 'deal'],
        approvedDomains: appData.approvedDomains || ['uvl.ventures', 'app.uvl.ventures'],
        integrationStatus: 'connected',
        createdAt: now,
        updatedAt: now
      };

      setCampaignApps(prev => [newApp, ...prev]);

      try {
        await supabase.from('campaign_apps').insert([
          {
            id: newApp.id,
            workspace_id: newApp.workspaceId,
            name: newApp.name,
            platform: newApp.platform,
            android_package_name: newApp.androidPackageName,
            ios_bundle_id: newApp.iosBundleId,
            play_store_url: newApp.playStoreUrl,
            app_store_url: newApp.appStoreUrl,
            web_fallback_url: newApp.webFallbackUrl,
            approved_deep_link_routes: newApp.approvedDeepLinkRoutes,
            approved_domains: newApp.approvedDomains,
            environment: newApp.environment,
            publishable_client_key: newApp.publishableClientKey,
            server_secret_key: newApp.serverSecretKey,
            integration_status: newApp.integrationStatus,
            created_at: newApp.createdAt,
            updated_at: newApp.updatedAt
          }
        ]);
      } catch (err) {
        console.warn('Register app Supabase error:', err);
      }

      await logAudit('campaigns', 'app_registered', 'campaign_app', newApp.id, {
        name: newApp.name,
        platform: newApp.platform
      });

      sound.patchStamp();
      return newApp;
    },
    [logAudit]
  );

  const updateCampaignApp = useCallback(
    async (id: string, updates: Partial<UVLCampaignApp>): Promise<void> => {
      setCampaignApps(prev => prev.map(a => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)));
      try {
        await supabase.from('campaign_apps').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      } catch {}
      await logAudit('campaigns', 'app_updated', 'campaign_app', id, updates);
      sound.click();
    },
    [logAudit]
  );

  const deleteCampaignApp = useCallback(
    async (id: string): Promise<void> => {
      setCampaignApps(prev => prev.filter(a => a.id !== id));
      try {
        await supabase.from('campaign_apps').delete().eq('id', id);
      } catch {}
      await logAudit('campaigns', 'app_deleted', 'campaign_app', id);
      sound.alert();
    },
    [logAudit]
  );

  /**
   * Creates a new marketing campaign
   */
  const createCampaign = useCallback(
    async (campaignData: Omit<UVLCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<UVLCampaign> => {
      const campId = 'cmp_' + Date.now();
      const now = new Date().toISOString();

      const newCampaign: UVLCampaign = {
        ...campaignData,
        id: campId,
        createdAt: now,
        updatedAt: now
      };

      setCampaigns(prev => [newCampaign, ...prev]);

      try {
        await supabase.from('campaigns').insert([
          {
            id: newCampaign.id,
            workspace_id: newCampaign.workspaceId,
            app_id: newCampaign.appId,
            name: newCampaign.name,
            source: newCampaign.source,
            medium: newCampaign.medium,
            status: newCampaign.status,
            spend: newCampaign.spend,
            currency: newCampaign.currency,
            reporting_period: newCampaign.reportingPeriod,
            start_date: newCampaign.startDate,
            end_date: newCampaign.endDate,
            utm_campaign: newCampaign.utmCampaign,
            utm_content: newCampaign.utmContent,
            utm_term: newCampaign.utmTerm,
            creative_label: newCampaign.creativeLabel,
            placement_label: newCampaign.placementLabel,
            influencer_label: newCampaign.influencerLabel,
            created_at: newCampaign.createdAt,
            updated_at: newCampaign.updatedAt
          }
        ]);
      } catch (err) {
        console.warn('Campaign insert error:', err);
      }

      await logAudit('campaigns', 'campaign_created', 'campaign', newCampaign.id, {
        name: newCampaign.name,
        source: newCampaign.source,
        spend: newCampaign.spend
      });

      sound.patchStamp();
      return newCampaign;
    },
    [logAudit]
  );

  const updateCampaign = useCallback(
    async (id: string, updates: Partial<UVLCampaign>): Promise<void> => {
      setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));
      try {
        await supabase.from('campaigns').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      } catch {}
      await logAudit('campaigns', 'campaign_updated', 'campaign', id, updates);
      sound.click();
    },
    [logAudit]
  );

  const deleteCampaign = useCallback(
    async (id: string): Promise<void> => {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      try {
        await supabase.from('campaigns').delete().eq('id', id);
      } catch {}
      await logAudit('campaigns', 'campaign_deleted', 'campaign', id);
      sound.alert();
    },
    [logAudit]
  );

  /**
   * Generates a smart campaign tracking link with high-res QR code
   */
  const createTrackingLink = useCallback(
    async (
      linkData: Omit<UVLTrackingLink, 'id' | 'slug' | 'auditHistory' | 'createdAt'> & {
        customSlug?: string;
      }
    ): Promise<UVLTrackingLink> => {
      const linkId = 'trk_' + Date.now();
      const rawSlug = linkData.customSlug || `${linkData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
      const slug = rawSlug.replace(/^\/+|\/+$/g, '');
      const now = new Date().toISOString();

      // Generate QR Code targeting the public redirect URL
      const fullUrl = `${window.location.origin}/c/${slug}`;
      const qrCodeDataUrl = await generateQRCodeDataUrl(fullUrl);

      const newLink: UVLTrackingLink = {
        ...linkData,
        id: linkId,
        slug,
        qrCodeDataUrl,
        auditHistory: [
          {
            timestamp: now,
            modifiedBy: currentUserId,
            change: 'Tracking link created'
          }
        ],
        createdAt: now
      };

      setTrackingLinks(prev => [newLink, ...prev]);

      try {
        await supabase.from('campaign_tracking_links').insert([
          {
            id: newLink.id,
            campaign_id: newLink.campaignId,
            app_id: newLink.appId,
            slug: newLink.slug,
            title: newLink.title,
            destination_route: newLink.destinationRoute,
            web_fallback_url: newLink.webFallbackUrl,
            deep_link_enabled: newLink.deepLinkEnabled,
            is_active: newLink.isActive,
            expires_at: newLink.expiresAt,
            qr_code_data_url: newLink.qrCodeDataUrl,
            audit_history: newLink.auditHistory,
            created_at: newLink.createdAt
          }
        ]);
      } catch (err) {
        console.warn('Tracking link insert error:', err);
      }

      await logAudit('campaigns', 'tracking_link_created', 'campaign_tracking_link', newLink.id, {
        slug: newLink.slug,
        destination: newLink.destinationRoute
      });

      sound.click();
      return newLink;
    },
    [currentUserId, logAudit]
  );

  const updateTrackingLink = useCallback(
    async (id: string, updates: Partial<UVLTrackingLink>): Promise<void> => {
      const now = new Date().toISOString();
      setTrackingLinks(prev =>
        prev.map(l =>
          l.id === id
            ? {
                ...l,
                ...updates,
                auditHistory: [
                  ...(l.auditHistory || []),
                  { timestamp: now, modifiedBy: currentUserId, change: 'Updated settings' }
                ]
              }
            : l
        )
      );

      try {
        await supabase.from('campaign_tracking_links').update(updates).eq('id', id);
      } catch {}

      await logAudit('campaigns', 'tracking_link_updated', 'campaign_tracking_link', id, updates);
      sound.click();
    },
    [currentUserId, logAudit]
  );

  /**
   * Public click ingestion: records click, filters bots, generates attribution token, and returns redirect targets
   */
  const ingestClick = useCallback(
    async (
      slug: string,
      meta: { userAgent?: string; ip?: string; referrer?: string }
    ): Promise<{ redirectUrl: string; attributionToken: string; deepLinkUrl?: string }> => {
      const link = trackingLinks.find(l => l.slug === slug && l.isActive);
      if (!link) {
        return {
          redirectUrl: window.location.origin,
          attributionToken: ''
        };
      }

      const app = campaignApps.find(a => a.id === link.appId);
      const isBot = isLikelyBotOrPreview(meta.userAgent);
      const token = generateAttributionToken();
      const ipHash = hashIpAddress(meta.ip || 'anonymous_ip');
      const now = new Date().toISOString();

      const clickRecord: UVLClickEvent = {
        id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        trackingLinkId: link.id,
        campaignId: link.campaignId,
        appId: link.appId,
        attributionToken: token,
        timestamp: now,
        ipHash,
        userAgent: meta.userAgent,
        referrer: meta.referrer,
        isSuspectedBot: isBot
      };

      setClickEvents(prev => [clickRecord, ...prev]);

      try {
        await supabase.from('campaign_clicks').insert([
          {
            id: clickRecord.id,
            tracking_link_id: clickRecord.trackingLinkId,
            campaign_id: clickRecord.campaignId,
            app_id: clickRecord.appId,
            attribution_token: clickRecord.attributionToken,
            timestamp: clickRecord.timestamp,
            ip_hash: clickRecord.ipHash,
            user_agent: clickRecord.userAgent,
            referrer: clickRecord.referrer,
            is_suspected_bot: clickRecord.isSuspectedBot
          }
        ]);
      } catch {}

      // Resolve redirect targets
      let deepLinkUrl: string | undefined = undefined;
      let redirectUrl = link.webFallbackUrl || (app ? app.webFallbackUrl : window.location.origin);

      if (link.deepLinkEnabled && app) {
        // Compose deep link with attribution token and destination route
        const route = link.destinationRoute ? link.destinationRoute.replace(/^\/+/, '') : '';
        if (app.platform === 'android' && app.androidPackageName) {
          deepLinkUrl = `${app.androidPackageName}://${route}?uvl_token=${token}`;
        } else if (app.platform === 'ios' && app.iosBundleId) {
          deepLinkUrl = `${app.iosBundleId}://${route}?uvl_token=${token}`;
        } else {
          deepLinkUrl = `uvl://${route}?uvl_token=${token}`;
        }
      }

      return {
        redirectUrl,
        attributionToken: token,
        deepLinkUrl
      };
    },
    [trackingLinks, campaignApps]
  );

  /**
   * Ingests a conversion / mobile app event and resolves attribution
   */
  const ingestAppEvent = useCallback(
    async (
      eventData: Omit<UVLAppEvent, 'id' | 'ingestedAt' | 'attributionConfidence' | 'attributionSource'>
    ): Promise<UVLAppEvent> => {
      const match = matchEventAttribution(eventData, clickEvents, attributionPolicy);
      const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      const newEvent: UVLAppEvent = {
        ...eventData,
        id: eventId,
        ingestedAt: now,
        attributedCampaignId: match.campaignId || eventData.attributedCampaignId,
        attributedLinkId: match.linkId || eventData.attributedLinkId,
        attributionSource: match.attributionSource,
        attributionConfidence: match.attributionConfidence
      };

      setAppEvents(prev => [newEvent, ...prev]);

      try {
        await supabase.from('campaign_app_events').insert([
          {
            id: newEvent.id,
            app_id: newEvent.appId,
            event_name: newEvent.eventName,
            environment: newEvent.environment,
            app_instance_id: newEvent.appInstanceId,
            user_id: newEvent.userId,
            occurred_at: newEvent.occurredAt,
            ingested_at: newEvent.ingestedAt,
            attribution_token: newEvent.attributionToken,
            attributed_campaign_id: newEvent.attributedCampaignId,
            attributed_link_id: newEvent.attributedLinkId,
            attribution_source: newEvent.attributionSource,
            attribution_confidence: newEvent.attributionConfidence,
            properties: newEvent.properties,
            sdk_version: newEvent.sdkVersion
          }
        ]);
      } catch {}

      return newEvent;
    },
    [clickEvents, attributionPolicy]
  );

  /**
   * Computes campaign metrics with strict separation of Cohort vs Event-Time modes
   */
  const getCampaignMetrics = useCallback(
    (reportingMode: 'cohort' | 'event_time', dateRange?: { start: string; end: string }): CampaignMetricsRow[] => {
      return computeCampaignMetrics(campaigns, clickEvents, appEvents, reportingMode, dateRange);
    },
    [campaigns, clickEvents, appEvents]
  );

  const updateAttributionPolicy = useCallback(
    (policy: Partial<UVLAttributionPolicy>) => {
      setAttributionPolicy(prev => ({ ...prev, ...policy }));
      sound.click();
    },
    []
  );

  return {
    // Documents
    documents,
    documentVersions,
    shareLinks,
    documentSessions,
    documentPageEvents,
    activeDocumentId,
    setActiveDocumentId,
    uploadDocument,
    uploadDocumentVersion,
    createShareLink,
    updateShareLink,
    revokeShareLink,
    deleteDocument,
    getDocumentAnalytics,
    recordDocumentSession,
    ingestDocumentHeartbeat,
    recordDocumentDownload,

    // Campaigns
    campaignApps,
    campaigns,
    trackingLinks,
    clickEvents,
    appEvents,
    attributionPolicy,
    updateAttributionPolicy,
    registerCampaignApp,
    updateCampaignApp,
    deleteCampaignApp,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    createTrackingLink,
    updateTrackingLink,
    ingestClick,
    ingestAppEvent,
    getCampaignMetrics,

    // Audit
    auditLogs
  };
}
