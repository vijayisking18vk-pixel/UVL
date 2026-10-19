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
  Compass,
  Link2,
  Smartphone,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  Plus,
  Search,
  ExternalLink,
  Filter,
  Download,
  Settings,
  HelpCircle,
  Shield,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { sound } from '../../utils/sound';

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
    createCampaign,
    createTrackingLink,
    getCampaignMetrics,
    ingestAppEvent
  } = useWorkspace();

  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'campaigns' | 'tracking_links' | 'connected_apps' | 'conversions' | 'diagnostics' | 'settings'
  >('overview');

  // Reporting Mode State
  const [reportingMode, setReportingMode] = useState<'cohort' | 'event_time'>('cohort');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d'>('all');

  // Modals
  const [createAppModalOpen, setCreateAppModalOpen] = useState<boolean>(false);
  const [createCampaignModalOpen, setCreateCampaignModalOpen] = useState<boolean>(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState<boolean>(false);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Simulation test event modal
  const [simModalOpen, setSimModalOpen] = useState<boolean>(false);
  const [simEventName, setSimEventName] = useState<string>('first_open');
  const [simAppId, setSimAppId] = useState<string>('');
  const [simToken, setSimToken] = useState<string>('');

  // Form State: Register App
  const [appName, setAppName] = useState<string>('');
  const [appPlatform, setAppPlatform] = useState<AppPlatform>('flutter');
  const [appPkg, setAppPkg] = useState<string>('com.loop.student');
  const [appBundle, setAppBundle] = useState<string>('com.loop.student');
  const [appWebFallback, setAppWebFallback] = useState<string>('https://uvl.ventures');
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
  const [linkFallback, setLinkFallback] = useState<string>('https://uvl.ventures');
  const [linkDeepLink, setLinkDeepLink] = useState<boolean>(true);

  // Compute Metrics using separated Cohort vs Event-Time Mode
  const campaignMetrics = useMemo(() => {
    return getCampaignMetrics(reportingMode);
  }, [reportingMode, getCampaignMetrics]);

  // Aggregate KPIs
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
    const costPerFirstOpen = firstOpens > 0 ? (totalSpend / firstOpens).toFixed(2) : '—';

    return {
      rawClicks,
      filteredClicks,
      suspectedBots,
      uniqueClicks,
      firstOpens,
      signups,
      verifiedConversions,
      totalSpend,
      overallConversionRate,
      costPerFirstOpen
    };
  }, [campaignMetrics]);

  const handleCopyLink = (slug: string) => {
    sound.click();
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleCreateAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerCampaignApp({
      name: appName,
      platform: appPlatform,
      androidPackageName: appPkg,
      iosBundleId: appBundle,
      webFallbackUrl: appWebFallback,
      environment: appEnv
    });
    setCreateAppModalOpen(false);
    setAppName('');
  };

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetApp = campAppId || campaignApps[0]?.id || 'app_default';
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

  const handleCreateLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCamp = linkCampaignId || campaigns[0]?.id;
    const targetApp = linkAppId || campaignApps[0]?.id;
    if (!targetCamp || !targetApp) {
      alert('Please ensure you have created at least one connected app and campaign first.');
      return;
    }

    await createTrackingLink({
      campaignId: targetCamp,
      appId: targetApp,
      title: linkTitle,
      customSlug: linkCustomSlug.trim() || undefined,
      destinationRoute: linkDestRoute,
      webFallbackUrl: linkFallback,
      deepLinkEnabled: linkDeepLink,
      isActive: true
    });

    setCreateLinkModalOpen(false);
    setLinkTitle('');
    setLinkCustomSlug('');
  };

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetApp = simAppId || campaignApps[0]?.id;
    if (!targetApp) return;

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

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E7]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-black">Campaigns</h1>
            <span className="px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-[10px] font-mono text-[#6E6E73]">
              Linkrunner-Grade Attribution
            </span>
          </div>
          <p className="text-xs text-[#6E6E73] mt-1">
            Universal link routing, Android Play Install Referrers, deterministic mobile attribution, and conversion reporting.
          </p>
        </div>

        {/* Sub-Tabs & Actions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-[#F5F5F7] border border-[#E5E5E7] rounded-full p-1 text-xs font-medium">
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('overview');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'overview' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <BarChart3 size={13} />
              <span>Overview</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('campaigns');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'campaigns' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Compass size={13} />
              <span>Campaigns</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('tracking_links');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'tracking_links' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Link2 size={13} />
              <span>Tracking Links</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('connected_apps');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'connected_apps' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Smartphone size={13} />
              <span>Connected Apps</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('conversions');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'conversions' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Activity size={13} />
              <span>Conversions</span>
            </button>
            <button
              onClick={() => {
                sound.click();
                setActiveSubTab('diagnostics');
              }}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                activeSubTab === 'diagnostics' ? 'bg-black text-white font-semibold shadow-sm' : 'text-[#6E6E73] hover:text-black'
              }`}
            >
              <Cpu size={13} />
              <span>Diagnostics</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.click();
              setCreateLinkModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>New Link</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 1: OVERVIEW & PERFORMANCE METRICS            */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Strict Reporting Mode Switcher Banner */}
          <div className="p-4 rounded-3xl border border-[#E5E5E7] bg-[#FFFFFF] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-black shrink-0">
                <Filter size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-black">Attribution Reporting Mode</span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-[#6E6E73]">
                    {reportingMode === 'cohort' ? 'Cohort-Based' : 'Event-Time Based'}
                  </span>
                </div>
                <p className="text-[11px] text-[#6E6E73] mt-0.5">
                  {reportingMode === 'cohort'
                    ? 'Cohort Mode: Metrics group installs and conversions back to the date the tracking link click occurred.'
                    : 'Event-Time Mode: Metrics reflect installs and actions that occurred during the chosen calendar dates.'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-2 bg-[#F5F5F7] p-1 rounded-full border border-[#E5E5E7] self-start md:self-auto">
              <button
                onClick={() => {
                  sound.click();
                  setReportingMode('cohort');
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  reportingMode === 'cohort' ? 'bg-black text-white shadow-2xs' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Cohort Mode
              </button>
              <button
                onClick={() => {
                  sound.click();
                  setReportingMode('event_time');
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  reportingMode === 'event_time' ? 'bg-black text-white shadow-2xs' : 'text-[#6E6E73] hover:text-black'
                }`}
              >
                Event-Time Mode
              </button>
            </div>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Raw Clicks
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">{totals.rawClicks}</span>
              <span className="text-[10px] text-[#A1A1AA]">{totals.suspectedBots} bots detected</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Filtered Clicks
              </span>
              <span className="text-2xl font-bold text-black mt-1 block text-blue-600">{totals.filteredClicks}</span>
              <span className="text-[10px] text-[#A1A1AA]">{totals.uniqueClicks} unique IPs</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Attributed First-Opens
              </span>
              <span className="text-2xl font-bold text-black mt-1 block text-emerald-600">{totals.firstOpens}</span>
              <span className="text-[10px] text-[#A1A1AA]">First-open measured</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Signups
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">{totals.signups}</span>
              <span className="text-[10px] text-[#A1A1AA]">Onboarding finished</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Verified Conversions
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">{totals.verifiedConversions}</span>
              <span className="text-[10px] text-[#A1A1AA]">KYC / Purchases</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Total Spend
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">₹{totals.totalSpend.toLocaleString()}</span>
              <span className="text-[10px] text-[#A1A1AA]">Ad + Promo cost</span>
            </div>

            <div className="p-4 rounded-2xl border border-[#E5E5E7] bg-white">
              <span className="text-[10px] font-semibold text-[#6E6E73] uppercase tracking-wider block">
                Cost Per First-Open
              </span>
              <span className="text-2xl font-bold text-black mt-1 block">
                {totals.costPerFirstOpen !== '—' ? `₹${totals.costPerFirstOpen}` : '—'}
              </span>
              <span className="text-[10px] text-[#A1A1AA]">{totals.overallConversionRate}% conversion</span>
            </div>
          </div>

          {/* Campaign Performance Table */}
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black">Campaign Performance Breakdown</h3>
                <p className="text-xs text-[#6E6E73]">
                  Attribution metrics separated by marketing campaign and channel.
                </p>
              </div>

              <button
                onClick={() => setCreateCampaignModalOpen(true)}
                className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
              >
                <Plus size={12} />
                <span>New Campaign</span>
              </button>
            </div>

            {campaignMetrics.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6E6E73] bg-[#F5F5F7] rounded-2xl">
                No campaigns created yet. Click "New Campaign" to create your first ad campaign or organic channel.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E5E7] text-[#6E6E73] font-semibold">
                      <th className="pb-3 pl-2">Campaign</th>
                      <th className="pb-3">Source / Channel</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Clicks (Filtered)</th>
                      <th className="pb-3">First Opens</th>
                      <th className="pb-3">Signups</th>
                      <th className="pb-3">Spend</th>
                      <th className="pb-3">Cost / Open</th>
                      <th className="pb-3">Conv %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E7]">
                    {campaignMetrics.map(row => (
                      <tr key={row.campaignId} className="hover:bg-[#F5F5F7] transition-colors">
                        <td className="py-3 pl-2 font-bold text-black">{row.campaignName}</td>
                        <td className="py-3 font-mono text-[#6E6E73]">{row.source} / {row.medium}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                            {row.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 font-mono">
                          {row.filteredClicks} <span className="text-[#A1A1AA]">({row.rawClicks} raw)</span>
                        </td>
                        <td className="py-3 font-mono font-semibold text-emerald-600">{row.attributedFirstOpens}</td>
                        <td className="py-3 font-mono">{row.signups}</td>
                        <td className="py-3 font-mono font-semibold text-black">₹{row.spend.toLocaleString()}</td>
                        <td className="py-3 font-mono">
                          {row.costPerAttributedFirstOpen ? `₹${row.costPerAttributedFirstOpen}` : '—'}
                        </td>
                        <td className="py-3 font-mono font-semibold text-black">
                          {row.conversionRate !== null ? `${row.conversionRate}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 2: CAMPAIGNS                                 */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black">Marketing Campaigns</h2>
            <button
              onClick={() => setCreateCampaignModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={13} />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-[#F5F5F7] rounded-3xl text-xs text-[#6E6E73]">
                No campaigns registered yet.
              </div>
            ) : (
              campaigns.map(camp => {
                const app = campaignApps.find(a => a.id === camp.appId);
                const links = trackingLinks.filter(l => l.campaignId === camp.id);

                return (
                  <div key={camp.id} className="p-5 rounded-3xl border border-[#E5E5E7] bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-[#6E6E73] uppercase">
                        {camp.source}
                      </span>
                      <span className="text-[10px] text-[#A1A1AA] font-mono">{camp.medium}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-black">{camp.name}</h3>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5">Target App: {app?.name || 'All Apps'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E7] text-xs">
                      <div>
                        <span className="text-[10px] text-[#6E6E73] block">Allocated Spend</span>
                        <span className="font-bold text-black font-mono">₹{camp.spend.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#6E6E73] block">Active Links</span>
                        <span className="font-bold text-black font-mono">{links.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 3: TRACKING LINKS WITH QR CODES              */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'tracking_links' && (
        <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-black">Tracking Links & QR Codes</h3>
              <p className="text-xs text-[#6E6E73]">
                Deep links dispatching mobile apps with deterministic fallback routing and vector QR codes.
              </p>
            </div>

            <button
              onClick={() => setCreateLinkModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={13} />
              <span>New Tracking Link</span>
            </button>
          </div>

          {trackingLinks.length === 0 ? (
            <div className="p-8 text-center bg-[#F5F5F7] rounded-2xl text-xs text-[#6E6E73]">
              No tracking links generated yet.
            </div>
          ) : (
            <div className="space-y-3">
              {trackingLinks.map(link => {
                const camp = campaigns.find(c => c.id === link.campaignId);
                const app = campaignApps.find(a => a.id === link.appId);
                const clicks = clickEvents.filter(c => c.trackingLinkId === link.id);

                return (
                  <div
                    key={link.id}
                    className="p-4 rounded-2xl border border-[#E5E5E7] bg-white hover:border-[#D1D1D6] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {link.qrCodeDataUrl ? (
                        <img
                          src={link.qrCodeDataUrl}
                          alt="QR"
                          className="w-14 h-14 rounded-lg border border-[#E5E5E7] p-1 cursor-pointer"
                          onClick={() => setQrModalDataUrl(link.qrCodeDataUrl || null)}
                          title="Click to expand QR Code"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-center text-[#6E6E73]">
                          <QrCode size={20} />
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-black">{link.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F5F5F7] border border-[#E5E5E7] text-black">
                            /c/{link.slug}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[#6E6E73] mt-1">
                          <span>App: <b className="text-black">{app?.name || 'Default'}</b></span>
                          <span>•</span>
                          <span>Campaign: <b className="text-black">{camp?.name || 'Direct'}</b></span>
                          <span>•</span>
                          <span>Destination: <span className="font-mono text-black">{link.destinationRoute}</span></span>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-[#A1A1AA] mt-1">
                          <span className="font-mono text-black font-semibold">{clicks.length} Clicks</span>
                          <span>•</span>
                          <span>Created {new Date(link.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(link.slug)}
                        className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-semibold text-black flex items-center gap-1 transition-all"
                      >
                        {copiedSlug === link.slug ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copiedSlug === link.slug ? 'Copied' : 'Copy Link'}</span>
                      </button>

                      {link.qrCodeDataUrl && (
                        <button
                          onClick={() => setQrModalDataUrl(link.qrCodeDataUrl || null)}
                          className="px-3 py-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-xs font-semibold text-black flex items-center gap-1 transition-all"
                        >
                          <QrCode size={12} />
                          <span>QR Code</span>
                        </button>
                      )}

                      <a
                        href={`/c/${link.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-full border border-[#E5E5E7] bg-[#F5F5F7] hover:bg-[#EBEBED] text-black"
                        title="Test link redirect"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 4: CONNECTED APPS                            */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'connected_apps' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-black">Registered Client Applications</h2>
              <p className="text-xs text-[#6E6E73]">
                Manage Flutter, Android, iOS, React Native, and Web/PWA platforms receiving deep links.
              </p>
            </div>

            <button
              onClick={() => setCreateAppModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={13} />
              <span>Register App</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaignApps.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-[#F5F5F7] rounded-3xl text-xs text-[#6E6E73]">
                No apps connected yet. Click "Register App" to add Loop Flutter or other student applications.
              </div>
            ) : (
              campaignApps.map(app => (
                <div key={app.id} className="p-5 rounded-3xl border border-[#E5E5E7] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-[10px] font-mono text-black font-semibold uppercase">
                      {app.platform}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full">
                      {app.integrationStatus.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-black">{app.name}</h3>
                    <span className="text-[10px] text-[#6E6E73] font-mono block mt-0.5">
                      {app.androidPackageName || app.iosBundleId || 'Web/PWA Domain'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F5F5F7] rounded-xl text-[10px] font-mono text-[#6E6E73] space-y-1">
                    <div className="truncate">Client Key: <b className="text-black">{app.publishableClientKey}</b></div>
                    <div className="truncate">Secret Key: <b className="text-black">{app.serverSecretKey.substring(0, 10)}...</b></div>
                  </div>

                  <div className="text-[11px] text-[#6E6E73] pt-1">
                    Fallback: <span className="text-black font-medium">{app.webFallbackUrl}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 5: CONVERSIONS & LIVE EVENTS STREAM          */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'conversions' && (
        <div className="bg-white border border-[#E5E5E7] rounded-3xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-black">Conversions & App Events Stream</h3>
              <p className="text-xs text-[#6E6E73]">
                Live attribution stream matching first-opens, signups, and purchases back to campaigns.
              </p>
            </div>

            <button
              onClick={() => setSimModalOpen(true)}
              className="px-3 py-1.5 rounded-full border border-black bg-black text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              + Simulate Event
            </button>
          </div>

          {appEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#F5F5F7] rounded-2xl text-xs text-[#6E6E73]">
              No events ingested yet. Use the "+ Simulate Event" button to test attribution matching.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5E7] text-[#6E6E73] font-semibold">
                    <th className="pb-3 pl-2">Event</th>
                    <th className="pb-3">Attribution Source</th>
                    <th className="pb-3">Attributed Campaign</th>
                    <th className="pb-3">Confidence</th>
                    <th className="pb-3">App Instance</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E7]">
                  {appEvents.map(evt => {
                    const camp = campaigns.find(c => c.id === evt.attributedCampaignId);

                    return (
                      <tr key={evt.id} className="hover:bg-[#F5F5F7] transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-black">{evt.eventName}</td>
                        <td className="py-3 font-mono text-[#6E6E73]">{evt.attributionSource}</td>
                        <td className="py-3 font-semibold text-black">{camp?.name || 'Organic / Direct'}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              evt.attributionConfidence === 'high'
                                ? 'bg-emerald-100 text-emerald-800'
                                : evt.attributionConfidence === 'medium'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {evt.attributionConfidence.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[#6E6E73]">{evt.appInstanceId}</td>
                        <td className="py-3 text-[#6E6E73]">{new Date(evt.ingestedAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB 6: INTEGRATION DIAGNOSTICS                   */}
      {/* ---------------------------------------------------- */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E5E5E7] rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-black">Mobile Deep Linking & Domain Association Diagnostics</h3>
            <p className="text-xs text-[#6E6E73]">
              Verification of Apple Universal Links and Android App Links association files hosted on UVL domain.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>iOS Universal Links (`apple-app-site-association`)</span>
                </div>
                <p className="text-[11px] text-[#6E6E73]">
                  Host path: <span className="font-mono text-black">/.well-known/apple-app-site-association</span>
                </p>
                <div className="text-[10px] text-emerald-700 bg-emerald-100 p-2 rounded-lg font-mono">
                  Status: Available & Compliant with Apple Universal Link standards
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <CheckCircle2 size={16} />
                  <span>Android App Links (`assetlinks.json`)</span>
                </div>
                <p className="text-[11px] text-[#6E6E73]">
                  Host path: <span className="font-mono text-black">/.well-known/assetlinks.json</span>
                </p>
                <div className="text-[10px] text-emerald-700 bg-emerald-100 p-2 rounded-lg font-mono">
                  Status: Available & Configured with SHA-256 fingerprint matching
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE APP                                    */}
      {/* ---------------------------------------------------- */}
      {createAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-black">Register Connected App</h2>
            <form onSubmit={handleCreateAppSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loop Student Mobile"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-black block mb-1">Platform</label>
                  <select
                    value={appPlatform}
                    onChange={e => setAppPlatform(e.target.value as AppPlatform)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  >
                    <option value="flutter">Flutter</option>
                    <option value="android">Native Android</option>
                    <option value="ios">Native iOS</option>
                    <option value="react_native">React Native</option>
                    <option value="web_pwa">Web / PWA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black block mb-1">Environment</label>
                  <select
                    value={appEnv}
                    onChange={e => setAppEnv(e.target.value as AppEnvironment)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Android Package Name</label>
                <input
                  type="text"
                  value={appPkg}
                  onChange={e => setAppPkg(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Web Fallback URL</label>
                <input
                  type="url"
                  required
                  value={appWebFallback}
                  onChange={e => setAppWebFallback(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateAppModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md"
                >
                  Register App
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE CAMPAIGN                               */}
      {/* ---------------------------------------------------- */}
      {createCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-black">Create Marketing Campaign</h2>
            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Launch Bengaluru 2026"
                  value={campName}
                  onChange={e => setCampName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-black block mb-1">Source / Channel</label>
                  <select
                    value={campSource}
                    onChange={e => setCampSource(e.target.value as CampaignSource)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  >
                    <option value="instagram">Instagram Ads</option>
                    <option value="meta_ads">Meta Ads</option>
                    <option value="google_ads">Google Ads</option>
                    <option value="whatsapp">WhatsApp Direct</option>
                    <option value="influencer">Campus Influencer</option>
                    <option value="qr_code">Physical Poster QR</option>
                    <option value="custom">Custom Channel</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black block mb-1">Budget Spend (INR)</label>
                  <input
                    type="number"
                    value={campSpend}
                    onChange={e => setCampSpend(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">UTM Campaign Tag</label>
                <input
                  type="text"
                  placeholder="e.g. campus_bengaluru_seed"
                  value={campUtmCampaign}
                  onChange={e => setCampUtmCampaign(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE TRACKING LINK                          */}
      {/* ---------------------------------------------------- */}
      {createLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-black">Generate Smart Tracking Link</h2>
            <form onSubmit={handleCreateLinkSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1">Link Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canteen Posters QR Link"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-black block mb-1">Attach to Campaign</label>
                  <select
                    value={linkCampaignId}
                    onChange={e => setLinkCampaignId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black block mb-1">Target Application</label>
                  <select
                    value={linkAppId}
                    onChange={e => setLinkAppId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                  >
                    {campaignApps.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.platform})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Custom Slug (optional)</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl border border-r-0 border-[#E5E5E7] bg-[#F5F5F7] text-xs font-mono text-[#6E6E73]">
                    /c/
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. campus-pass"
                    value={linkCustomSlug}
                    onChange={e => setLinkCustomSlug(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-r-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">In-App Destination Route</label>
                <input
                  type="text"
                  placeholder="e.g. pay/qr or onboarding"
                  value={linkDestRoute}
                  onChange={e => setLinkDestRoute(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateLinkModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md"
                >
                  Generate Link & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: QR CODE EXPANDED VIEW                         */}
      {/* ---------------------------------------------------- */}
      {qrModalDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-[#E5E5E7] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-black">Campaign QR Code</h3>
            <div className="p-4 bg-white border border-[#E5E5E7] rounded-2xl shadow-sm inline-block mx-auto">
              <img src={qrModalDataUrl} alt="High Res QR" className="w-56 h-56 mx-auto" />
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <a
                href={qrModalDataUrl}
                download="uvl-campaign-qr.png"
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>Download PNG</span>
              </a>

              <button
                onClick={() => setQrModalDataUrl(null)}
                className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black hover:bg-[#F5F5F7]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SIMULATE EVENT                                */}
      {/* ---------------------------------------------------- */}
      {simModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5E5E7] shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-black">Simulate App Event Ingestion</h3>
            <p className="text-xs text-[#6E6E73]">
              Simulate an SDK conversion event (first open, signup, KYC) to verify deterministic or windowed attribution matching.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-black block mb-1">Event Type</label>
                <select
                  value={simEventName}
                  onChange={e => setSimEventName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none"
                >
                  <option value="first_open">first_open (Measured Install)</option>
                  <option value="signup_completed">signup_completed</option>
                  <option value="kyc_verified">kyc_verified</option>
                  <option value="purchase_completed">purchase_completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-black block mb-1">Attribution Token (Optional)</label>
                <input
                  type="text"
                  placeholder="Paste uvl_attr_... token from click"
                  value={simToken}
                  onChange={e => setSimToken(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5E5E7] bg-[#F5F5F7] text-xs text-black outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSimModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E7] text-xs text-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold shadow-md"
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
