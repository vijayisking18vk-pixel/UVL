import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ExternalLink, Compass, ShieldAlert, ArrowRight } from 'lucide-react';

interface CampaignClickRedirectProps {
  slug: string;
}

export const CampaignClickRedirect: React.FC<CampaignClickRedirectProps> = ({ slug }) => {
  const { ingestClick, trackingLinks } = useWorkspace();
  const [status, setStatus] = useState<'routing' | 'redirecting' | 'not_found'>('routing');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [deepLink, setDeepLink] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function handleRouting() {
      try {
        const link = trackingLinks.find(l => l.slug === slug);
        if (!link) {
          setStatus('not_found');
          return;
        }

        const result = await ingestClick(slug, {
          userAgent: navigator.userAgent,
          referrer: document.referrer
        });

        if (!mounted) return;

        setTargetUrl(result.redirectUrl);
        setDeepLink(result.deepLinkUrl);
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
          }, 250);
        }
      } catch (err) {
        console.error('Click routing error:', err);
        setStatus('not_found');
      }
    }

    handleRouting();

    return () => {
      mounted = false;
    };
  }, [slug, ingestClick, trackingLinks]);

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5E7] text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-[#6E6E73] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={22} />
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Campaign Link Inactive</h2>
          <p className="text-sm text-[#6E6E73] mb-6">
            This tracking link is expired, disabled, or does not exist.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-all shadow-md"
          >
            Return to UVL Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
          <Compass size={22} />
        </div>
        <h2 className="text-lg font-semibold text-black">Redirecting you securely...</h2>
        <p className="text-xs text-[#6E6E73]">
          Connecting through Unfounded Venture Lab campaign attribution router.
        </p>

        {targetUrl && (
          <div className="pt-2">
            <a
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-800 font-medium hover:underline"
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
