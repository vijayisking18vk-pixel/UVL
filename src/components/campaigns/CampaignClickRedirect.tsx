import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Compass, ShieldAlert, ArrowRight, AlertTriangle, Clock, Link2Off } from 'lucide-react';
import { UVLTrackingLink } from '../../types';

interface CampaignClickRedirectProps {
  slug: string;
  incomingQuery?: string;
}

export const CampaignClickRedirect: React.FC<CampaignClickRedirectProps> = ({ slug, incomingQuery }) => {
  const { ingestClick } = useWorkspace();
  const [status, setStatus] = useState<
    'routing' | 'redirecting' | 'not_found' | 'disabled' | 'expired' | 'loop_detected' | 'invalid_scheme' | 'no_destination'
  >('routing');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [resolvedLink, setResolvedLink] = useState<UVLTrackingLink | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function handleRouting() {
      try {
        const result = await ingestClick(
          slug,
          {
            userAgent: navigator.userAgent,
            referrer: document.referrer
          },
          incomingQuery || window.location.search
        );

        if (!mounted) return;

        if (result.trackingLink) {
          setResolvedLink(result.trackingLink);
        }

        if (result.error) {
          setStatus(result.error);
          return;
        }

        if (!result.redirectUrl) {
          setStatus('no_destination');
          return;
        }

        setTargetUrl(result.redirectUrl);
        setStatus('redirecting');

        // Check if on mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile && result.deepLinkUrl) {
          // Attempt app deep link dispatch
          window.location.href = result.deepLinkUrl;

          // Fallback to external website or app store after 1.2s if app doesn't intercept
          setTimeout(() => {
            if (mounted && result.redirectUrl) {
              window.location.replace(result.redirectUrl);
            }
          }, 1200);
        } else {
          // Snappy direct external web redirect
          setTimeout(() => {
            if (mounted && result.redirectUrl) {
              window.location.replace(result.redirectUrl);
            }
          }, 150);
        }
      } catch (err) {
        console.error('Click routing error:', err);
        if (mounted) {
          setStatus('not_found');
        }
      }
    }

    handleRouting();

    return () => {
      mounted = false;
    };
  }, [slug, incomingQuery, ingestClick]);

  // ----------------------------------------------------
  // PUBLIC ERROR SCREENS (NO SILENT UVL FALLBACK / NO LOGIN TRAP)
  // ----------------------------------------------------
  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-[#6E6E73] flex items-center justify-center mx-auto mb-4">
            <Link2Off size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Tracking Link Not Found</h2>
          <p className="text-sm text-[#6E6E73] mb-4">
            The tracking link <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-black text-xs">/r/{slug}</code> does not exist or has been removed.
          </p>
          <span className="text-xs text-[#A1A1AA] font-mono block">Status: 404 Not Found</span>
        </div>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Campaign Link Inactive</h2>
          <p className="text-sm text-[#6E6E73] mb-4">
            This campaign tracking link has been disabled by its administrator.
          </p>
          {resolvedLink && (
            <span className="text-xs text-[#A1A1AA] font-mono block">Campaign: {resolvedLink.title}</span>
          )}
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-[#6E6E73] flex items-center justify-center mx-auto mb-4">
            <Clock size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Campaign Link Expired</h2>
          <p className="text-sm text-[#6E6E73] mb-4">
            This tracking link has expired and is no longer accepting visitor traffic.
          </p>
          {resolvedLink?.expiresAt && (
            <span className="text-xs text-[#A1A1AA] font-mono block">
              Expired: {new Date(resolvedLink.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (status === 'loop_detected') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Redirect Loop Detected</h2>
          <p className="text-sm text-[#6E6E73] mb-4">
            The configured destination for this link points back to itself. Redirection was halted to prevent an infinite loop.
          </p>
          <span className="text-xs text-red-500 font-mono block">Error: ERR_TOO_MANY_REDIRECTS</span>
        </div>
      </div>
    );
  }

  if (status === 'invalid_scheme' || status === 'no_destination') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Invalid Destination URL</h2>
          <p className="text-sm text-[#6E6E73] mb-4">
            {status === 'invalid_scheme'
              ? 'This link specifies an unsafe or unsupported URL scheme.'
              : 'No destination website or mobile app route was configured for this tracking link.'}
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // INTERSTITIAL REDIRECTING SCREEN
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
          <Compass size={22} />
        </div>
        <h2 className="text-lg font-semibold text-black">Redirecting you securely...</h2>
        <p className="text-xs text-[#6E6E73]">
          Connecting through campaign attribution router.
        </p>

        {targetUrl && (
          <div className="pt-2">
            <a
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:underline"
            >
              <span>Click here if not redirected automatically</span>
              <ArrowRight size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
