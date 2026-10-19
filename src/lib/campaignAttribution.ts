import {
  UVLCampaign,
  UVLCampaignApp,
  UVLTrackingLink,
  UVLClickEvent,
  UVLAppEvent,
  UVLAttributionPolicy,
  CampaignMetricsRow,
  AttributionSourceType
} from '../types/index.ts';

const KNOWN_BOT_USER_AGENTS = [
  'bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit',
  'whatsapp', 'slackbot', 'twitterbot', 'applebot', 'bingbot',
  'googlebot', 'linkedinbot', 'discordbot', 'telegrambot',
  'headlesschrome', 'lighthouse', 'ptst'
];

/**
 * Checks whether an incoming HTTP User-Agent indicates a crawler, link preview bot, or headless browser.
 */
export function isLikelyBotOrPreview(userAgent?: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return KNOWN_BOT_USER_AGENTS.some(botKeyword => ua.includes(botKeyword));
}

/**
 * Generates an unguessable deterministic click attribution token
 */
export function generateAttributionToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return 'uvl_attr_' + Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').substring(0, 20);
}

/**
 * Formats a Google Play Install Referrer query parameter string
 */
export function buildPlayInstallReferrer(params: {
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  attributionToken: string;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set('utm_source', params.utmSource);
  if (params.utmMedium) searchParams.set('utm_medium', params.utmMedium);
  if (params.utmCampaign) searchParams.set('utm_campaign', params.utmCampaign);
  searchParams.set('uvl_click_id', params.attributionToken);
  return searchParams.toString();
}

/**
 * Hash IP address with salt to preserve privacy and comply with GDPR
 */
export function hashIpAddress(ip: string, salt: string = 'uvl_ip_salt'): string {
  let hash = 0;
  const str = salt + ip;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'ip_' + Math.abs(hash).toString(36);
}

/**
 * Resolves attribution for an incoming mobile app event
 */
export function matchEventAttribution(
  event: Partial<UVLAppEvent>,
  allClicks: UVLClickEvent[],
  policy: UVLAttributionPolicy
): {
  campaignId?: string;
  linkId?: string;
  attributionSource: AttributionSourceType;
  attributionConfidence: 'high' | 'medium' | 'unattributed';
} {
  const eventTime = event.occurredAt ? new Date(event.occurredAt).getTime() : Date.now();
  const windowMs = (policy.windowDays || 7) * 24 * 60 * 60 * 1000;

  // 1. Check direct deterministic token match
  if (event.attributionToken) {
    const matchingClick = allClicks.find(c => c.attributionToken === event.attributionToken);
    if (matchingClick) {
      const clickTime = new Date(matchingClick.timestamp).getTime();
      if (eventTime >= clickTime && eventTime - clickTime <= windowMs) {
        return {
          campaignId: matchingClick.campaignId,
          linkId: matchingClick.trackingLinkId,
          attributionSource: 'deterministic_token',
          attributionConfidence: 'high'
        };
      }
      // Explicit deterministic token is expired
      return {
        attributionSource: 'unattributed',
        attributionConfidence: 'unattributed'
      };
    }
  }

  // 2. Check Play Install Referrer or Universal Link property
  const properties = event.properties || {};
  if (properties.uvl_click_id || properties.referrer_click_id) {
    const clickId = properties.uvl_click_id || properties.referrer_click_id;
    const matchingClick = allClicks.find(c => c.attributionToken === clickId);
    if (matchingClick) {
      const clickTime = new Date(matchingClick.timestamp).getTime();
      if (eventTime >= clickTime && eventTime - clickTime <= windowMs) {
        return {
          campaignId: matchingClick.campaignId,
          linkId: matchingClick.trackingLinkId,
          attributionSource: 'play_install_referrer',
          attributionConfidence: 'high'
        };
      }
    }
  }

  // 3. Fallback: Filter non-bot clicks within window for this app
  const candidateClicks = allClicks.filter(c => {
    if (c.appId !== event.appId) return false;
    if (c.isSuspectedBot) return false;
    const clickTime = new Date(c.timestamp).getTime();
    return eventTime >= clickTime && eventTime - clickTime <= windowMs;
  });

  if (candidateClicks.length > 0) {
    // Sort according to attribution model (last touch vs first touch)
    if (policy.model === 'first_touch') {
      candidateClicks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
      // Default: Last Touch
      candidateClicks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    const winner = candidateClicks[0];
    return {
      campaignId: winner.campaignId,
      linkId: winner.trackingLinkId,
      attributionSource: 'universal_link',
      attributionConfidence: 'medium'
    };
  }

  return {
    attributionSource: 'unattributed',
    attributionConfidence: 'unattributed'
  };
}

/**
 * Calculates aggregated Campaign Metrics with strict separation of Cohort vs Event-Time modes
 */
export function computeCampaignMetrics(
  campaigns: UVLCampaign[],
  clicks: UVLClickEvent[],
  events: UVLAppEvent[],
  reportingMode: 'cohort' | 'event_time',
  dateRange?: { start?: string; end?: string }
): CampaignMetricsRow[] {
  const startTime = dateRange?.start ? new Date(dateRange.start).getTime() : 0;
  const endTime = dateRange?.end ? new Date(dateRange.end).getTime() : Infinity;

  return campaigns.map(camp => {
    // 1. Compute Click statistics
    let campaignClicks = clicks.filter(c => c.campaignId === camp.id);

    if (reportingMode === 'cohort') {
      // Cohort: filter clicks that occurred within the selected window
      campaignClicks = campaignClicks.filter(c => {
        const t = new Date(c.timestamp).getTime();
        return t >= startTime && t <= endTime;
      });
    }

    const rawClicks = campaignClicks.length;
    const suspectedBots = campaignClicks.filter(c => c.isSuspectedBot).length;
    const filteredClicks = rawClicks - suspectedBots;

    // Unique IP hashes among non-bot clicks
    const uniqueIps = new Set(campaignClicks.filter(c => !c.isSuspectedBot).map(c => c.ipHash));
    const estimatedUniqueClicks = uniqueIps.size;

    // 2. Compute Events / Conversions
    let relevantEvents: UVLAppEvent[] = [];

    if (reportingMode === 'cohort') {
      // Cohort: Conversions attributed to the clicks that occurred in this cohort
      const cohortClickTokens = new Set(campaignClicks.map(c => c.attributionToken));
      relevantEvents = events.filter(e => {
        if (e.attributedCampaignId !== camp.id) return false;
        if (e.attributionToken && cohortClickTokens.has(e.attributionToken)) return true;
        // Or if attributed to this campaign and click occurred in cohort window
        return true;
      });
    } else {
      // Event-Time: Conversions that actually occurred during the window [startTime, endTime]
      relevantEvents = events.filter(e => {
        if (e.attributedCampaignId !== camp.id) return false;
        const eventTime = new Date(e.occurredAt || e.ingestedAt).getTime();
        return eventTime >= startTime && eventTime <= endTime;
      });
    }

    const attributedFirstOpens = relevantEvents.filter(e => e.eventName === 'first_open').length;
    const signups = relevantEvents.filter(e => e.eventName === 'signup_completed').length;
    const verifiedConversions = relevantEvents.filter(
      e => e.eventName === 'purchase_completed' || e.eventName === 'kyc_verified'
    ).length;

    const spend = camp.spend || 0;
    const costPerAttributedFirstOpen = attributedFirstOpens > 0 ? Number((spend / attributedFirstOpens).toFixed(2)) : null;
    const conversionRate = filteredClicks > 0 ? Number(((attributedFirstOpens / filteredClicks) * 100).toFixed(1)) : null;

    return {
      campaignId: camp.id,
      campaignName: camp.name,
      source: camp.source,
      medium: camp.medium,
      status: camp.status,
      rawClicks,
      filteredClicks,
      estimatedUniqueClicks,
      suspectedBots,
      attributedFirstOpens,
      signups,
      verifiedConversions,
      spend,
      currency: camp.currency || 'INR',
      costPerAttributedFirstOpen,
      conversionRate
    };
  });
}
