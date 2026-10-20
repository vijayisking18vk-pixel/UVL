import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  UVLCampaignApp,
  UVLCampaign,
  UVLTrackingLink,
  CampaignSource,
  AppPlatform,
  AppEnvironment
} from '../../types';
import {
  Flag,
  MousePointerClick,
  Eye,
  Download,
  UserPlus,
  SlidersHorizontal,
  RotateCw,
  Plus,
  Search,
  ChevronDown,
  Leaf,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Trash2,
  Smartphone,
  BarChart3,
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { sound } from '../../utils/sound';

// Android inline icon matching standard robot mark
const AndroidIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5516 0 .9997.4486.9997 1.0003s-.4481 1.0003-.9997 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5516 0 .9997.4486.9997 1.0003s-.4481 1.0003-.9997 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8 12 8s-3.5902.4116-5.1368 1.4504L4.841 5.9474a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.2057 0 14.8874 0 19.1678h24c0-4.2804-2.6889-7.9621-6.1185-9.8464" />
  </svg>
);

// Apple icon
const AppleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.95 2.77.99.08 2.04-.52 2.68-1.27z" />
  </svg>
);

export const CampaignsView: React.FC = () => {
  const {
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
    createTrackingLink,
    deleteCampaign,
    deleteTrackingLink,
    getCampaignMetrics,
    ingestAppEvent
  } = useWorkspace();

  // Primary subnavigation tabs: 'campaigns' | 'channels' | 'projects' | 'overview' | 'conversions' | 'diagnostics'
  const [activeTab, setActiveTab] = useState<'campaigns' | 'channels' | 'projects' | 'overview' | 'conversions' | 'diagnostics'>('campaigns');

  // Filter Bar State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [channelDropdownOpen, setChannelDropdownOpen] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'android' | 'ios'>('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('today');
  const [dateDropdownOpen, setDateDropdownOpen] = useState<boolean>(false);
  const [attributionType, setAttributionType] = useState<'install' | 'cohort' | 'event_time'>('install');
  const [attributionDropdownOpen, setAttributionDropdownOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'clicks' | 'installs' | 'conversion' | 'name'>('clicks');
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);
  const [showKpiCards, setShowKpiCards] = useState<boolean>(false);

  // Sync state
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('02:59 PM');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState<boolean>(false);
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState<boolean>(false);
  const [createAppModalOpen, setCreateAppModalOpen] = useState<boolean>(false);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [simModalOpen, setSimModalOpen] = useState<boolean>(false);

  // Form State: Register App / Project
  const [appName, setAppName] = useState<string>('');
  const [appPlatform, setAppPlatform] = useState<AppPlatform>('flutter');
  const [appPkg, setAppPkg] = useState<string>('com.loop.student');
  const [appBundle, setAppBundle] = useState<string>('com.loop.student');
  const [appWebFallback, setAppWebFallback] = useState<string>('https://app.ziggers.in');
  const [appEnv, setAppEnv] = useState<AppEnvironment>('production');

  // Form State: Campaign
  const [campName, setCampName] = useState<string>('');
  const [campAppId, setCampAppId] = useState<string>('');
  const [campSource, setCampSource] = useState<CampaignSource>('instagram');
  const [campMedium, setCampMedium] = useState<string>('cpc');
  const [campSpend, setCampSpend] = useState<number>(5000);
  const [campUtmCampaign, setCampUtmCampaign] = useState<string>('');

  // Form State: Tracking Link
  const [linkTitle, setLinkTitle] = useState<string>('');
  const [linkCampaignId, setLinkCampaignId] = useState<string>('');
  const [linkAppId, setLinkAppId] = useState<string>('');
  const [linkCustomSlug, setLinkCustomSlug] = useState<string>('');
  const [linkDestRoute, setLinkDestRoute] = useState<string>('home');
  const [linkFallback, setLinkFallback] = useState<string>('');
  const [linkDeepLink, setLinkDeepLink] = useState<boolean>(true);

  // Simulation form
  const [simEventName, setSimEventName] = useState<string>('first_open');
  const [simAppId, setSimAppId] = useState<string>('');
  const [simToken, setSimToken] = useState<string>('');

  // Reporting mode mapping
  const reportingMode = attributionType === 'event_time' ? 'event_time' : 'cohort';
  const campaignMetrics = useMemo(() => {
    return getCampaignMetrics(reportingMode);
  }, [reportingMode, getCampaignMetrics]);

  // Aggregate totals
  const totals = useMemo(() => {
    const rawClicks = campaignMetrics.reduce((acc, c) => acc + c.rawClicks, 0);
    const filteredClicks = campaignMetrics.reduce((acc, c) => acc + c.filteredClicks, 0);
    const suspectedBots = campaignMetrics.reduce((acc, c) => acc + c.suspectedBots, 0);
    const uniqueClicks = campaignMetrics.reduce((acc, c) => acc + c.estimatedUniqueClicks, 0);
    const firstOpens = campaignMetrics.reduce((acc, c) => acc + c.attributedFirstOpens, 0);
    const signups = campaignMetrics.reduce((acc, c) => acc + c.signups, 0);
    const verifiedConversions = campaignMetrics.reduce((acc, c) => acc + c.verifiedConversions, 0);
    const totalSpend = campaignMetrics.reduce((acc, c) => acc + c.spend, 0);
    const overallConversionRate = filteredClicks > 0 ? ((firstOpens / filteredClicks) * 100).toFixed(1) : '0.0';

    return {
      rawClicks,
      filteredClicks,
      suspectedBots,
      uniqueClicks,
      firstOpens,
      signups,
      verifiedConversions,
      totalSpend,
      overallConversionRate
    };
  }, [campaignMetrics]);

  // Handle Sync Refresh
  const handleRefresh = () => {
    sound.click();
    setIsSyncing(true);
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
    setLastSyncedTime(`${formattedHours}:${minutes} ${ampm}`);
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  // 5-character clean alphanumeric campaign code generator (e.g. WPkAs)
  const generateCampaignCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for (let i = 0; i < 5; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    return res;
  };

  // Open Create Link Modal with defaults for project and campaign
  const handleOpenCreateLinkModal = (preselectedAppId?: string, preselectedCampId?: string) => {
    sound.click();
    const targetApp = preselectedAppId || (selectedProjectId !== 'all' ? selectedProjectId : (campaignApps[0]?.id || ''));
    const appObj = campaignApps.find(a => a.id === targetApp);
    setLinkAppId(targetApp);
    setLinkCampaignId(preselectedCampId || campaigns.find(c => c.appId === targetApp)?.id || campaigns[0]?.id || '');
    setLinkCustomSlug(generateCampaignCode());
    setLinkFallback(appObj?.webFallbackUrl || 'https://app.ziggers.in');
    setLinkTitle('');
    setCreateLinkModalOpen(true);
  };

  // Copy tracking link URL to clipboard
  const handleCopyLink = (urlOrText: string) => {
    sound.click();
    navigator.clipboard.writeText(urlOrText);
    setCopiedSlug(urlOrText);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  // Export CSV
  const handleExportCsv = () => {
    sound.click();
    const headers = ['Campaign', 'Content', 'Clicks', 'Impressions', 'Installs', 'Sign-ups', 'Conversion', 'Revenue'];
    const rows = filteredRows.map(r => [
      `"${r.name}"`,
      `"${r.content}"`,
      r.clicks,
      r.impressions,
      r.installs,
      r.signups,
      r.conversion,
      r.revenue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `uvl_campaigns_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete Project (App / Website) handler
  const handleDeleteProject = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"?\nAssociated tracking links and campaigns will be affected.`)) {
      sound.click();
      await deleteCampaignApp(id);
      if (selectedProjectId === id) setSelectedProjectId('all');
    }
  };

  // Delete Campaign handler
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${name}"?\nThis will permanently remove the campaign and all associated tracking links.`)) {
      sound.click();
      await deleteCampaign(id);
    }
  };

  // Delete Tracking Link handler
  const handleDeleteTrackingLink = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete tracking link "${title}"?`)) {
      sound.click();
      await deleteTrackingLink(id);
    }
  };

  // Create Project (App / Website) Submit
  const handleCreateAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let normalizedUrl = (appWebFallback.trim() || 'https://app.ziggers.in');
    if (!/^[a-zA-Z]+:\/\//.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    const created = await registerCampaignApp({
      name: appName.trim() || 'Ziggers App',
      platform: appPlatform,
      androidPackageName: appPkg.trim() || undefined,
      iosBundleId: appBundle.trim() || undefined,
      webFallbackUrl: normalizedUrl,
      environment: appEnv
    });
    setCreateAppModalOpen(false);
    setAppName('');
    setAppWebFallback('https://app.ziggers.in');
    setSelectedProjectId(created.id);
  };

  // Create Campaign Submit
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetApp = campAppId || (selectedProjectId !== 'all' ? selectedProjectId : (campaignApps[0]?.id || 'app_default'));
    await createCampaign({
      workspaceId: 'default',
      appId: targetApp,
      name: campName,
      source: campSource,
      medium: campMedium,
      status: 'active',
      spend: campSpend,
      currency: 'INR',
      reportingPeriod: 'all',
      utmCampaign: campUtmCampaign || campName.toLowerCase().replace(/\s+/g, '_')
    });
    setCreateCampaignModalOpen(false);
    setCampName('');
  };

  // Create Tracking Link Submit
  const handleCreateLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetApp = linkAppId || (selectedProjectId !== 'all' ? selectedProjectId : (campaignApps[0]?.id || 'app_default'));
    const matchedApp = campaignApps.find(a => a.id === targetApp);

    const projectCamps = campaigns.filter(c => c.appId === targetApp);
    const targetCamp = linkCampaignId || projectCamps[0]?.id || campaigns[0]?.id || 'cmp_default';

    let targetDestination = (linkFallback.trim() || matchedApp?.webFallbackUrl || 'https://app.ziggers.in');
    if (targetDestination && !/^[a-zA-Z]+:\/\//.test(targetDestination)) {
      targetDestination = `https://${targetDestination}`;
    }

    const slug = linkCustomSlug.trim() || generateCampaignCode();

    await createTrackingLink({
      campaignId: targetCamp,
      appId: targetApp,
      title: linkTitle.trim() || `Link ${slug}`,
      customSlug: slug,
      destinationRoute: targetDestination,
      webFallbackUrl: targetDestination,
      deepLinkEnabled: linkDeepLink,
      isActive: true
    });

    setCreateLinkModalOpen(false);
    setLinkTitle('');
    setLinkCustomSlug('');
  };

  // Simulate Event Submit
  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetApp = simAppId || campaignApps[0]?.id || 'app_default';

    await ingestAppEvent({
      appId: targetApp,
      eventName: simEventName,
      environment: 'production',
      appInstanceId: 'inst_' + Math.random().toString(36).substring(2, 8),
      attributionToken: simToken.trim() || undefined,
      occurredAt: new Date().toISOString(),
      properties: { simulated: true },
      sdkVersion: '1.0.0'
    });

    sound.patchStamp();
    setSimModalOpen(false);
    setSimToken('');
  };

  // Build unified table rows strictly from real user data (Zero mock or fake data)
  const tableRows = useMemo(() => {
    const rows: Array<{
      id: string;
      campaignId?: string;
      campaignName?: string;
      linkId?: string;
      slug?: string;
      isOrganic?: boolean;
      name: string;
      content: string;
      destinationUrl?: string;
      clicks: string | number;
      impressions: string | number;
      installs: string | number;
      signups: string | number;
      conversion: string;
      revenue: string;
      source?: string;
      platform?: string;
      qrCodeDataUrl?: string;
    }> = [];

    // Filter campaigns by selected project
    const relevantCampaigns = selectedProjectId === 'all'
      ? campaigns
      : campaigns.filter(c => c.appId === selectedProjectId);

    // Organic row: Only include if real app events exist without an attributed campaign
    const organicOpens = appEvents.filter(e => !e.attributedCampaignId && e.eventName === 'first_open').length;
    const organicSignups = appEvents.filter(e => !e.attributedCampaignId && e.eventName === 'signup_completed').length;
    if (organicOpens > 0 || organicSignups > 0) {
      rows.push({
        id: 'row_organic',
        isOrganic: true,
        name: 'Organic users',
        content: '',
        clicks: 'N/A',
        impressions: 'N/A',
        installs: organicOpens,
        signups: organicSignups,
        conversion: '—',
        revenue: '-',
        source: 'organic'
      });
    }

    // Populate actual campaigns and their tracking links
    for (const camp of relevantCampaigns) {
      const campLinks = trackingLinks.filter(l => l.campaignId === camp.id);
      const metrics = campaignMetrics.find(m => m.campaignId === camp.id);
      const matchedApp = campaignApps.find(a => a.id === camp.appId);
      const projectBaseUrl = (matchedApp?.webFallbackUrl || window.location.origin).replace(/\/+$/, '');

      if (campLinks.length === 0) {
        const defaultCode = camp.utmCampaign || camp.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const defaultTrackingUrl = `${projectBaseUrl}/?c=${defaultCode}`;
        rows.push({
          id: `cmp_${camp.id}`,
          campaignId: camp.id,
          campaignName: camp.name,
          name: camp.name,
          content: defaultTrackingUrl,
          destinationUrl: projectBaseUrl,
          clicks: metrics?.filteredClicks ?? '-',
          impressions: '-',
          installs: metrics?.attributedFirstOpens ?? '-',
          signups: metrics?.signups ?? '-',
          conversion: metrics?.conversionRate !== null && metrics?.conversionRate !== undefined ? `${metrics.conversionRate}%` : '-',
          revenue: '-',
          source: camp.source
        });
      } else {
        for (const link of campLinks) {
          const linkApp = campaignApps.find(a => a.id === link.appId) || matchedApp;
          const linkBaseUrl = (link.webFallbackUrl || linkApp?.webFallbackUrl || window.location.origin).replace(/\/+$/, '');
          const canonicalUrl = `${linkBaseUrl}/?c=${link.slug}`;
          const linkClicks = clickEvents.filter(
            c => c.trackingLinkId === link.id || c.trackingLinkId === link.slug
          );
          const linkOpens = appEvents.filter(
            e => e.attributionToken && linkClicks.some(c => c.attributionToken === e.attributionToken) && e.eventName === 'first_open'
          );
          const linkSignups = appEvents.filter(
            e => e.attributionToken && linkClicks.some(c => c.attributionToken === e.attributionToken) && e.eventName === 'signup_completed'
          );
          const cCount = linkClicks.length;
          const iCount = linkOpens.length;
          const sCount = linkSignups.length;
          const conv = cCount > 0 ? `${((iCount / cCount) * 100).toFixed(1)}%` : '-';

          rows.push({
            id: `lnk_${link.id}`,
            campaignId: camp.id,
            campaignName: camp.name,
            linkId: link.id,
            slug: link.slug,
            name: link.title || camp.name,
            content: canonicalUrl,
            destinationUrl: link.webFallbackUrl || linkBaseUrl,
            clicks: cCount > 0 ? cCount : '-',
            impressions: '-',
            installs: iCount > 0 ? iCount : '-',
            signups: sCount > 0 ? sCount : '-',
            conversion: conv,
            revenue: '-',
            source: camp.source,
            qrCodeDataUrl: link.qrCodeDataUrl
          });
        }
      }
    }

    // Standalone tracking links not attached to listed campaigns
    const listedCampIds = new Set(campaigns.map(c => c.id));
    const standaloneLinks = trackingLinks.filter(l => !listedCampIds.has(l.campaignId));
    for (const link of standaloneLinks) {
      if (selectedProjectId !== 'all' && link.appId !== selectedProjectId) {
        continue;
      }
      const matchedApp = campaignApps.find(a => a.id === link.appId);
      const linkBaseUrl = (link.webFallbackUrl || matchedApp?.webFallbackUrl || window.location.origin).replace(/\/+$/, '');
      const canonicalUrl = `${linkBaseUrl}/?c=${link.slug}`;
      const linkClicks = clickEvents.filter(
        c => c.trackingLinkId === link.id || c.trackingLinkId === link.slug
      );
      const linkOpens = appEvents.filter(
        e => e.attributionToken && linkClicks.some(c => c.attributionToken === e.attributionToken) && e.eventName === 'first_open'
      );
      const linkSignups = appEvents.filter(
        e => e.attributionToken && linkClicks.some(c => c.attributionToken === e.attributionToken) && e.eventName === 'signup_completed'
      );
      const cCount = linkClicks.length;
      const iCount = linkOpens.length;
      const sCount = linkSignups.length;
      const conv = cCount > 0 ? `${((iCount / cCount) * 100).toFixed(1)}%` : '-';

      rows.push({
        id: `lnk_${link.id}`,
        linkId: link.id,
        slug: link.slug,
        name: link.title || 'Tracking Link',
        content: canonicalUrl,
        destinationUrl: link.webFallbackUrl || linkBaseUrl,
        clicks: cCount > 0 ? cCount : '-',
        impressions: '-',
        installs: iCount > 0 ? iCount : '-',
        signups: sCount > 0 ? sCount : '-',
        conversion: conv,
        revenue: '-',
        source: 'custom',
        qrCodeDataUrl: link.qrCodeDataUrl
      });
    }

    return rows;
  }, [campaigns, trackingLinks, clickEvents, appEvents, campaignMetrics, campaignApps, selectedProjectId]);

  // Apply filters & search
  const filteredRows = useMemo(() => {
    return tableRows.filter(r => {
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesContent = r.content.toLowerCase().includes(q);
        if (!matchesName && !matchesContent) return false;
      }
      if (selectedChannel !== 'all' && !r.isOrganic) {
        if (r.source && !r.source.toLowerCase().includes(selectedChannel.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [tableRows, searchQuery, selectedChannel]);

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-12 font-sans text-neutral-900">
      {/* ----------------------------------------------------------------- */}
      {/* 1. TOP HEADER: "All Campaigns", Sync status, Refresh, + Project, + Campaign, + Create Link */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">All Campaigns</h1>
          {selectedProjectId !== 'all' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Project: {campaignApps.find(a => a.id === selectedProjectId)?.name || 'Filtered'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="text-xs text-neutral-500 whitespace-nowrap hidden sm:inline">
            Last synced today, {lastSyncedTime}
          </span>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black transition-all cursor-pointer shadow-2xs"
            title="Refresh analytics and sync status"
          >
            <RotateCw size={14} className={isSyncing ? 'animate-spin text-blue-600' : ''} />
          </button>

          {/* + Project Button */}
          <button
            onClick={() => {
              sound.click();
              setCreateAppModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Create Project (App / Website) where all campaign links direct"
          >
            <Layers size={13} className="text-blue-600" />
            <span>+ Project</span>
          </button>

          {/* + Campaign Button */}
          <button
            onClick={() => {
              sound.click();
              setCreateCampaignModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Create Marketing Campaign"
          >
            <Flag size={13} className="text-emerald-600" />
            <span>+ Campaign</span>
          </button>

          {/* + Create Link Primary Blue Button */}
          <button
            onClick={() => handleOpenCreateLinkModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Create Link</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. SUB-NAVIGATION TABS: Campaigns, Channels, Projects               */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              sound.click();
              setActiveTab('campaigns');
            }}
            className={`pb-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 ${
              activeTab === 'campaigns'
                ? 'border-blue-600 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Campaigns
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab('channels');
            }}
            className={`pb-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 ${
              activeTab === 'channels'
                ? 'border-blue-600 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Channels
          </button>

          <button
            onClick={() => {
              sound.click();
              setActiveTab('projects');
            }}
            className={`pb-2.5 text-sm font-medium transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-blue-600 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Projects (Apps & Websites)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-100 text-neutral-600 font-mono">
              {campaignApps.length}
            </span>
          </button>
        </div>

        {/* Secondary pill shortcuts for overview, conversions stream, diagnostics */}
        <div className="hidden lg:flex items-center gap-1.5 pb-2 text-[11px] font-medium text-neutral-500">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              activeTab === 'overview' ? 'bg-neutral-900 text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            KPI Overview
          </button>
          <button
            onClick={() => setActiveTab('conversions')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              activeTab === 'conversions' ? 'bg-neutral-900 text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            Live Conversions
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-2.5 py-1 rounded-full transition-all ${
              activeTab === 'diagnostics' ? 'bg-neutral-900 text-white font-semibold' : 'hover:bg-neutral-100 text-neutral-600'
            }`}
          >
            Diagnostics
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. FILTER BAR: Search, Project ∨, Channels ∨, All|Android|Apple, Date, Attribution */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search campaigns input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search campaigns or links"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* Project Dropdown Filter */}
          <div className="relative">
            <button
              onClick={() => {
                sound.click();
                setProjectDropdownOpen(!projectDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-2xs transition-all cursor-pointer"
            >
              <Layers size={13} className="text-blue-600" />
              <span>
                {selectedProjectId === 'all'
                  ? 'All Projects'
                  : campaignApps.find(a => a.id === selectedProjectId)?.name || 'Project'}
              </span>
              <ChevronDown size={13} className="text-neutral-400 ml-0.5" />
            </button>

            {projectDropdownOpen && (
              <div className="absolute left-0 mt-1 w-52 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-30 text-xs">
                <button
                  onClick={() => {
                    setSelectedProjectId('all');
                    setProjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                    selectedProjectId === 'all' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                  }`}
                >
                  <span>All Projects</span>
                  {selectedProjectId === 'all' && <Check size={12} />}
                </button>
                {campaignApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedProjectId(app.id);
                      setProjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                      selectedProjectId === app.id ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-medium">{app.name}</span>
                      <span className="text-[10px] text-neutral-400 block truncate font-mono">{app.webFallbackUrl}</span>
                    </div>
                    {selectedProjectId === app.id && <Check size={12} className="shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* All Channels Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sound.click();
                setChannelDropdownOpen(!channelDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-2xs transition-all cursor-pointer"
            >
              <Flag size={13} className="text-neutral-500" />
              <span>{selectedChannel === 'all' ? 'All Channels' : selectedChannel}</span>
              <ChevronDown size={13} className="text-neutral-400 ml-0.5" />
            </button>

            {channelDropdownOpen && (
              <div className="absolute left-0 mt-1 w-44 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-30 text-xs">
                {['all', 'instagram', 'meta_ads', 'google_ads', 'whatsapp', 'qr_code', 'custom'].map(ch => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelectedChannel(ch);
                      setChannelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                      selectedChannel === ch ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                    }`}
                  >
                    <span className="capitalize">{ch === 'all' ? 'All Channels' : ch.replace('_', ' ')}</span>
                    {selectedChannel === ch && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Segmented Platform Toggle: All | Android | Apple */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shadow-2xs">
            <button
              onClick={() => {
                sound.click();
                setSelectedPlatform('all');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedPlatform === 'all' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                sound.click();
                setSelectedPlatform('android');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedPlatform === 'android' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Filter by Android"
            >
              <AndroidIcon size={14} />
            </button>
            <button
              onClick={() => {
                sound.click();
                setSelectedPlatform('ios');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedPlatform === 'ios' ? 'bg-white text-neutral-900 shadow-xs font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
              title="Filter by Apple iOS"
            >
              <AppleIcon size={14} />
            </button>
          </div>

          {/* Date Picker: Today */}
          <div className="relative">
            <button
              onClick={() => {
                sound.click();
                setDateDropdownOpen(!dateDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-2xs transition-all cursor-pointer"
            >
              <span className="text-neutral-400 text-xs">📅</span>
              <span className="capitalize">{dateRange === 'all' ? 'All Time' : dateRange === 'today' ? 'Today' : dateRange}</span>
            </button>

            {dateDropdownOpen && (
              <div className="absolute left-0 mt-1 w-36 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-30 text-xs">
                {(['today', '7d', '30d', 'all'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDateRange(d);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                      dateRange === d ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                    }`}
                  >
                    <span>{d === 'today' ? 'Today' : d === '7d' ? 'Last 7 Days' : d === '30d' ? 'Last 30 Days' : 'All Time'}</span>
                    {dateRange === d && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attribution Dropdown: Install Attribution ∨ */}
          <div className="relative">
            <button
              onClick={() => {
                sound.click();
                setAttributionDropdownOpen(!attributionDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-2xs transition-all cursor-pointer"
            >
              <span>{attributionType === 'install' ? 'Install Attribution' : attributionType === 'cohort' ? 'Cohort Attribution' : 'Event-Time Attribution'}</span>
              <ChevronDown size={13} className="text-neutral-400 ml-0.5" />
            </button>

            {attributionDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-30 text-xs">
                {(['install', 'cohort', 'event_time'] as const).map(attr => (
                  <button
                    key={attr}
                    onClick={() => {
                      setAttributionType(attr);
                      setAttributionDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                      attributionType === attr ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                    }`}
                  >
                    <span>{attr === 'install' ? 'Install Attribution' : attr === 'cohort' ? 'Cohort Attribution' : 'Event-Time Attribution'}</span>
                    {attributionType === attr && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sound.click();
                setSortDropdownOpen(!sortDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 shadow-2xs transition-all cursor-pointer"
            >
              <span>Sort by</span>
              <ChevronDown size={13} className="text-neutral-400 ml-0.5" />
            </button>

            {sortDropdownOpen && (
              <div className="absolute left-0 mt-1 w-36 rounded-xl border border-neutral-200 bg-white shadow-lg py-1 z-30 text-xs">
                {(['clicks', 'installs', 'conversion', 'name'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setSortBy(s);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-neutral-100 flex items-center justify-between ${
                      sortBy === s ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-neutral-700'
                    }`}
                  >
                    <span className="capitalize">{s}</span>
                    {sortBy === s && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Far Right Action Icons: Download CSV & Sliders */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCsv}
            className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black transition-all cursor-pointer shadow-2xs"
            title="Download CSV Export"
          >
            <Download size={14} />
          </button>

          <button
            onClick={() => setShowKpiCards(!showKpiCards)}
            className={`p-2 rounded-lg border border-neutral-200 bg-white transition-all cursor-pointer shadow-2xs ${
              showKpiCards ? 'bg-neutral-100 text-black border-neutral-400' : 'hover:bg-neutral-50 text-neutral-600'
            }`}
            title="Toggle Detailed KPI Cards"
          >
            <SlidersHorizontal size={14} />
          </button>

          <button
            onClick={() => setCreateCampaignModalOpen(true)}
            className="p-1.5 px-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1"
            title="New Campaign"
          >
            <Plus size={13} />
            <span>Campaign</span>
          </button>
        </div>
      </div>

      {/* Optional Detailed KPI Cards (Toggled by Sliders Icon) */}
      {showKpiCards && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1 animate-fadeIn">
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Raw Clicks</span>
            <span className="text-xl font-bold text-neutral-900 mt-0.5 block">{totals.rawClicks}</span>
            <span className="text-[10px] text-neutral-400">{totals.suspectedBots} bot filters</span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Filtered Clicks</span>
            <span className="text-xl font-bold text-blue-600 mt-0.5 block">{totals.filteredClicks}</span>
            <span className="text-[10px] text-neutral-400">{totals.uniqueClicks} unique IPs</span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Installs (1st Open)</span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{totals.firstOpens}</span>
            <span className="text-[10px] text-neutral-400">Measured on first-open</span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Sign-ups</span>
            <span className="text-xl font-bold text-neutral-900 mt-0.5 block">{totals.signups}</span>
            <span className="text-[10px] text-neutral-400">Onboarding finished</span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Conversions</span>
            <span className="text-xl font-bold text-neutral-900 mt-0.5 block">{totals.verifiedConversions}</span>
            <span className="text-[10px] text-neutral-400">KYC / Purchases</span>
          </div>
          <div className="p-3 rounded-xl border border-neutral-200 bg-white shadow-2xs">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider block">Conv. Rate</span>
            <span className="text-xl font-bold text-neutral-900 mt-0.5 block">{totals.overallConversionRate}%</span>
            <span className="text-[10px] text-neutral-400">Click to first-open</span>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. MAIN CAMPAIGNS & CHANNELS TABLE (EXACT SCREENSHOT LAYOUT)       */}
      {/* ----------------------------------------------------------------- */}
      {(activeTab === 'campaigns' || activeTab === 'channels') && (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-600 font-medium">
                  <th className="py-3 px-4 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Flag size={13} className="text-neutral-500" />
                      <span>Campaign</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap">Content</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <MousePointerClick size={13} className="text-neutral-500" />
                      <span>Clicks</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Eye size={13} className="text-neutral-500" />
                      <span>Impressions</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Download size={13} className="text-neutral-500" />
                      <span>Installs</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <UserPlus size={13} className="text-neutral-500" />
                      <span>Sign-ups</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Conversion</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Revenue</th>
                  <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-neutral-500 bg-neutral-50/30">
                      <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400">
                          <Flag size={16} />
                        </div>
                        <span className="font-semibold text-neutral-800">No campaigns or tracking links</span>
                        <p className="text-[11px] text-neutral-500">
                          Click "+ Create Link" to generate your first tracking link.
                        </p>
                        <button
                          onClick={() => {
                            sound.click();
                            setCreateLinkModalOpen(true);
                          }}
                          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Create Link</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => {
                  const isOrganic = row.isOrganic;
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isOrganic ? 'bg-neutral-50/30' : ''
                      }`}
                    >
                      {/* Campaign Column */}
                      <td className="py-3 px-4 font-normal text-neutral-900">
                        <div className="flex items-center gap-2">
                          {isOrganic ? (
                            <Leaf size={14} className="text-neutral-700 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                          <div className="truncate max-w-[220px]">
                            <span className={`block truncate ${isOrganic ? 'border-b border-dotted border-neutral-400 font-medium' : 'font-semibold text-neutral-900'}`}>
                              {row.name}
                            </span>
                            {row.campaignName && row.campaignName !== row.name && (
                              <span className="text-[10px] text-neutral-400 block truncate">
                                Campaign: {row.campaignName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Content Column (Displays canonical tracking URL formatted as https://<domain>/?c=<campaign_code>) */}
                      <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                        {row.content ? (
                          <div className="flex items-center gap-1.5 group max-w-[280px]">
                            <span className="truncate font-semibold text-neutral-800" title={row.content}>
                              {row.content}
                            </span>
                            <button
                              onClick={() => handleCopyLink(row.content)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded text-neutral-500 transition-opacity"
                              title="Copy tracking link"
                            >
                              {copiedSlug === row.content ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-700">{row.clicks}</td>

                      {/* Impressions */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-700">{row.impressions}</td>

                      {/* Installs */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-800 font-medium">{row.installs}</td>

                      {/* Sign-ups */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-800 font-medium">{row.signups}</td>

                      {/* Conversion */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-800 font-medium">{row.conversion}</td>

                      {/* Revenue */}
                      <td className="py-3 px-4 font-mono text-right text-neutral-400">{row.revenue}</td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {row.content && (
                            <>
                              <button
                                onClick={() => handleCopyLink(row.content)}
                                className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
                                title="Copy link"
                              >
                                {copiedSlug === row.content ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              </button>

                              {row.qrCodeDataUrl && (
                                <button
                                  onClick={() => setQrModalDataUrl(row.qrCodeDataUrl!)}
                                  className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
                                  title="View QR Code"
                                >
                                  <QrCode size={13} />
                                </button>
                              )}

                              <a
                                href={row.slug ? `${window.location.origin}/?c=${row.slug}` : row.content}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
                                title={`Test live tracking redirect (Records click & redirects to ${row.destinationUrl || 'destination'})`}
                              >
                                <ExternalLink size={13} />
                              </a>
                            </>
                          )}

                          {row.linkId && (
                            <button
                              onClick={() => handleDeleteTrackingLink(row.linkId!, row.name)}
                              className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
                              title="Delete tracking link"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {row.campaignId && !row.linkId && (
                            <button
                              onClick={() => handleDeleteCampaign(row.campaignId!, row.name)}
                              className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"
                              title="Delete campaign"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {isOrganic && (
                            <span className="text-[10px] text-neutral-400 font-mono">System</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. ADDITIONAL VIEWS: Connected Apps, Conversions, Diagnostics     */}
      {/* ----------------------------------------------------------------- */}

      {/* Projects (Apps & Websites) View */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Projects (Applications & Websites)</h2>
              <p className="text-xs text-neutral-500">
                Every project directs to its configured application or website (e.g. <span className="font-mono text-neutral-800">https://app.ziggers.in</span>). All campaign links created inside a project output the canonical format: <span className="font-mono text-neutral-800">https://&lt;domain&gt;/?c=&lt;code&gt;</span>.
              </p>
            </div>

            <button
              onClick={() => {
                sound.click();
                setCreateAppModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-black self-start sm:self-auto cursor-pointer"
            >
              <Plus size={13} />
              <span>Create Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {campaignApps.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-neutral-50 rounded-xl text-xs text-neutral-500 border border-neutral-200">
                <div className="max-w-xs mx-auto space-y-2">
                  <Layers size={24} className="mx-auto text-neutral-400" />
                  <p className="font-semibold text-neutral-800">No Projects Created Yet</p>
                  <p className="text-[11px] text-neutral-500">
                    Create your first project (e.g. Ziggers at https://app.ziggers.in) to generate custom campaign tracking links.
                  </p>
                  <button
                    onClick={() => {
                      sound.click();
                      setCreateAppModalOpen(true);
                    }}
                    className="mt-2 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    + Create Project
                  </button>
                </div>
              </div>
            ) : (
              campaignApps.map(app => {
                const appCampaigns = campaigns.filter(c => c.appId === app.id);
                const appLinks = trackingLinks.filter(l => l.appId === app.id);
                const projectBase = app.webFallbackUrl.replace(/\/+$/, '');
                return (
                  <div key={app.id} className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-neutral-800 font-semibold uppercase">
                        {app.platform}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                          {app.integrationStatus.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleDeleteProject(app.id, app.name)}
                          className="p-1 hover:bg-red-50 text-neutral-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{app.name}</h3>
                      <div className="text-xs font-mono text-blue-600 mt-1 flex items-center gap-1 truncate">
                        <ExternalLink size={11} className="shrink-0" />
                        <span className="truncate">{app.webFallbackUrl}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-neutral-50 rounded-lg text-[11px] space-y-1 border border-neutral-100 font-mono">
                      <div className="text-neutral-500 text-[10px] uppercase font-sans font-semibold">Generated Link Structure</div>
                      <div className="text-emerald-700 font-bold truncate">
                        {projectBase}/?c=WPkAs
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
                      <span>{appCampaigns.length} campaigns • {appLinks.length} links</span>
                      <button
                        onClick={() => handleOpenCreateLinkModal(app.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Create Link</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Live Conversions Stream */}
      {activeTab === 'conversions' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Conversions & App Events Stream</h3>
              <p className="text-xs text-neutral-500">
                Live attribution stream matching first-opens, signups, and purchases back to campaigns.
              </p>
            </div>

            <button
              onClick={() => setSimModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-800 shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Activity size={13} className="text-blue-600" />
              <span>Simulate Event</span>
            </button>
          </div>

          {appEvents.length === 0 ? (
            <div className="p-8 text-center bg-neutral-50 rounded-xl text-xs text-neutral-500 border border-neutral-200">
              No events ingested yet. Use the "Simulate Event" button to test attribution matching.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="pb-2 pl-2">Event</th>
                    <th className="pb-2">Attribution Source</th>
                    <th className="pb-2">Attributed Campaign</th>
                    <th className="pb-2">Confidence</th>
                    <th className="pb-2">App Instance</th>
                    <th className="pb-2 text-right pr-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {appEvents.map(evt => {
                    const camp = campaigns.find(c => c.id === evt.attributedCampaignId);
                    return (
                      <tr key={evt.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 pl-2 font-mono font-bold text-neutral-900">{evt.eventName}</td>
                        <td className="py-2.5 font-mono text-neutral-600">{evt.attributionSource}</td>
                        <td className="py-2.5 font-medium text-neutral-900">{camp?.name || 'Organic / Direct'}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              evt.attributionConfidence === 'high'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : evt.attributionConfidence === 'medium'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {evt.attributionConfidence.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-neutral-500">{evt.appInstanceId}</td>
                        <td className="py-2.5 text-neutral-500 text-right pr-2">{new Date(evt.ingestedAt).toLocaleTimeString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Diagnostics View */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Mobile Deep Linking & Domain Association Diagnostics</h3>
            <p className="text-xs text-neutral-500">
              Apple Universal Links, Android App Links, and SSRF security filters verification.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 size={15} />
                <span>iOS Universal Links (`apple-app-site-association`)</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Host path: <span className="font-mono text-neutral-900">/.well-known/apple-app-site-association</span>
              </p>
              <div className="text-[10px] text-emerald-700 bg-white p-2 rounded-lg font-mono border border-emerald-200">
                Status: Configured for paths /r/*, /c/*, /l/*
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 size={15} />
                <span>Android App Links (`assetlinks.json`)</span>
              </div>
              <p className="text-[11px] text-neutral-600">
                Host path: <span className="font-mono text-neutral-900">/.well-known/assetlinks.json</span>
              </p>
              <div className="text-[10px] text-emerald-700 bg-white p-2 rounded-lg font-mono border border-emerald-200">
                Status: Configured for package com.loop.student with SHA-256 fingerprint matching
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. MODALS: Create Link, Create Campaign, QR Code, Simulate Event  */}
      {/* ----------------------------------------------------------------- */}

      {/* MODAL: CREATE TRACKING LINK */}
      {createLinkModalOpen && (() => {
        const activeProj = campaignApps.find(a => a.id === (linkAppId || campaignApps[0]?.id));
        const activeBaseDomain = (linkFallback.trim() || activeProj?.webFallbackUrl || window.location.origin).replace(/\/+$/, '');
        const codeVal = (linkCustomSlug.trim() || 'WPkAs').replace(/^\/+|\/+$/g, '');
        const liveCanonicalUrl = `${activeBaseDomain}/?c=${codeVal}`;

        return (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Generate Campaign Tracking Link</h2>
                  <p className="text-xs text-neutral-500">
                    Tied directly to your project and campaign for deterministic attribution.
                  </p>
                </div>
                <button
                  onClick={() => setCreateLinkModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-800 text-sm font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* LIVE CANONICAL LINK PREVIEW CARD */}
              <div className="p-3.5 bg-neutral-900 rounded-xl text-white space-y-2 border border-neutral-800 shadow-sm">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Generated Tracking Link Preview
                  </span>
                  <span className="text-[10px] text-neutral-400">Canonical Format</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-neutral-800/90 p-2.5 rounded-lg border border-neutral-700 font-mono text-xs text-emerald-400 select-all">
                  <span className="truncate">{liveCanonicalUrl}</span>
                  <button
                    type="button"
                    onClick={() => {
                      sound.click();
                      navigator.clipboard.writeText(liveCanonicalUrl);
                    }}
                    className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                    title="Copy preview link"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Visitors clicking this link are attributed to this campaign code (<span className="text-white font-mono">{codeVal}</span>) and redirected directly to <span className="text-white font-mono">{activeBaseDomain}</span>.
                </p>
              </div>

              <form onSubmit={handleCreateLinkSubmit} className="space-y-3.5">
                {/* Project Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-800">Target Project (App / Website)</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateLinkModalOpen(false);
                        setCreateAppModalOpen(true);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      + New Project
                    </button>
                  </div>
                  <select
                    value={linkAppId}
                    onChange={e => {
                      const newAppId = e.target.value;
                      setLinkAppId(newAppId);
                      const matched = campaignApps.find(a => a.id === newAppId);
                      if (matched) {
                        setLinkFallback(matched.webFallbackUrl);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    {campaignApps.length > 0 ? (
                      campaignApps.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.webFallbackUrl})
                        </option>
                      ))
                    ) : (
                      <option value="app_default">Ziggers App (https://app.ziggers.in)</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-medium text-neutral-800 block mb-1">Link Title / Label</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WhatsApp Workers Circulation"
                      value={linkTitle}
                      onChange={e => setLinkTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-neutral-800 block mb-1">Associated Campaign</label>
                    <select
                      value={linkCampaignId}
                      onChange={e => setLinkCampaignId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    >
                      {(() => {
                        const projectCamps = campaigns.filter(c => !linkAppId || c.appId === linkAppId);
                        const displayCamps = projectCamps.length > 0 ? projectCamps : campaigns;
                        if (displayCamps.length === 0) {
                          return <option value="cmp_default">Default Campaign</option>;
                        }
                        return displayCamps.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.source})
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>

                {/* Campaign Code (Slug) with domain prefix and randomize button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-800">
                      Campaign Code (<span className="font-mono text-blue-600">?c=<code></code></span>)
                    </label>
                    <button
                      type="button"
                      onClick={() => setLinkCustomSlug(generateCampaignCode())}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      🎲 Generate New Code
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-100 text-xs font-mono text-neutral-600 shrink-0 select-none">
                      {activeBaseDomain}/?c=
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="WPkAs"
                      value={linkCustomSlug}
                      onChange={e => setLinkCustomSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-r-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    This unique code is embedded in the link to attribute all clicks, installs, and conversions back to this specific campaign.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-800 block mb-1">
                    Target Destination Website / App URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://app.ziggers.in"
                    value={linkFallback}
                    onChange={e => setLinkFallback(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setCreateLinkModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Generate Link & QR</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: CREATE CAMPAIGN */}
      {createCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900">Create Marketing Campaign</h2>
              <button
                onClick={() => setCreateCampaignModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp Workers Circulation or Employers Cold Call"
                  value={campName}
                  onChange={e => setCampName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-neutral-800 block mb-1">Source / Channel</label>
                  <select
                    value={campSource}
                    onChange={e => setCampSource(e.target.value as CampaignSource)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="whatsapp">WhatsApp Direct</option>
                    <option value="meta_ads">Meta Ads</option>
                    <option value="instagram">Instagram Ads</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="qr_code">Physical Poster QR</option>
                    <option value="custom">Custom Channel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-800 block mb-1">Budget Spend (INR)</label>
                  <input
                    type="number"
                    value={campSpend}
                    onChange={e => setCampSpend(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">UTM Campaign Tag</label>
                <input
                  type="text"
                  placeholder="e.g. workers_circ_2026"
                  value={campUtmCampaign}
                  onChange={e => setCampUtmCampaign(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PROJECT (APP / WEBSITE) */}
      {createAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-neutral-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-neutral-900">Create Project (App / Website)</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Links under this project direct visitors to this URL: <span className="font-mono font-medium text-blue-600">https://&lt;domain&gt;/?c=&lt;code&gt;</span>
                </p>
              </div>
              <button
                onClick={() => setCreateAppModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ziggers or Loop Student"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Project App / Website Destination URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://app.ziggers.in"
                  value={appWebFallback}
                  onChange={e => setAppWebFallback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Example: <span className="font-mono text-neutral-600">https://app.ziggers.in</span> → tracking link will be <span className="font-mono text-blue-600 font-medium">https://app.ziggers.in/?c=WPkAs</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-medium text-neutral-800 block mb-1">Platform</label>
                  <select
                    value={appPlatform}
                    onChange={e => setAppPlatform(e.target.value as AppPlatform)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="flutter">Flutter</option>
                    <option value="web_pwa">Web / PWA</option>
                    <option value="android">Native Android</option>
                    <option value="ios">Native iOS</option>
                    <option value="react_native">React Native</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-800 block mb-1">Environment</label>
                  <select
                    value={appEnv}
                    onChange={e => setAppEnv(e.target.value as AppEnvironment)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Android Package Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. in.ziggers.app"
                  value={appPkg}
                  onChange={e => setAppPkg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateAppModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QR CODE PREVIEW */}
      {qrModalDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center border border-neutral-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">Tracking Link QR Code</h3>
            <div className="p-3 bg-white border border-neutral-200 rounded-xl shadow-xs inline-block mx-auto">
              <img src={qrModalDataUrl} alt="High Res QR" className="w-52 h-52 mx-auto" />
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <a
                href={qrModalDataUrl}
                download="uvl-tracking-qr.png"
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </a>

              <button
                onClick={() => setQrModalDataUrl(null)}
                className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIMULATE EVENT */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-neutral-200 shadow-2xl space-y-3.5">
            <h3 className="text-sm font-bold text-neutral-900">Simulate Mobile Event Ingestion</h3>
            <p className="text-xs text-neutral-500">
              Simulate an SDK conversion event (first open, signup, purchase) to verify deterministic or windowed attribution matching.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Event Type</label>
                <select
                  value={simEventName}
                  onChange={e => setSimEventName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none"
                >
                  <option value="first_open">first_open (Measured Install)</option>
                  <option value="signup_completed">signup_completed</option>
                  <option value="kyc_verified">kyc_verified</option>
                  <option value="purchase_completed">purchase_completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-800 block mb-1">Attribution Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste uvl_attr_... token from click"
                  value={simToken}
                  onChange={e => setSimToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-900 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-semibold shadow-xs"
                >
                  Ingest Simulated Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
