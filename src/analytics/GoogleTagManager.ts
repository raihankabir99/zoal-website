import { supabaseClient } from '../lib/supabaseClient';

declare global {
  interface Window {
    dataLayer?: any[];
    __zoalGtmContainerId?: string;
  }
}

let isGoogleTagManagerLoaded = false;
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{5,10}$/;

function hasAnalyticsOrMarketingConsent(): boolean {
  try {
    const raw = localStorage.getItem('zoal_cookie_preferences');
    if (!raw) return false;
    const preferences = JSON.parse(raw);
    return preferences?.accepted === true && (
      preferences?.analytics === true || preferences?.marketing === true
    );
  } catch {
    return false;
  }
}

async function getPersistedGtmContainerId(): Promise<string> {
  try {
    const { data, error } = await supabaseClient
      .from('zoal_gtm_settings')
      .select('container_id, enabled, consent_required')
      .eq('enabled', true)
      .limit(1)
      .maybeSingle();

    if (error || !data?.enabled) return '';
    if (data.consent_required !== false && !hasAnalyticsOrMarketingConsent()) return '';

    const value = typeof data.container_id === 'string' ? data.container_id.trim().toUpperCase() : '';
    return GTM_ID_PATTERN.test(value) ? value : '';
  } catch {
    return '';
  }
}

export async function initializeGoogleTagManager(): Promise<void> {
  if (typeof window === 'undefined' || isGoogleTagManagerLoaded) return;
  if (!hasAnalyticsOrMarketingConsent()) return;

  const containerId = await getPersistedGtmContainerId();
  if (!containerId || document.getElementById('zoal-gtm-loader')) return;

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

    const script = document.createElement('script');
    script.id = 'zoal-gtm-loader';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    script.dataset.zoalGtm = containerId;

    script.addEventListener('load', () => {
      isGoogleTagManagerLoaded = true;
      window.__zoalGtmContainerId = containerId;
    });
    script.addEventListener('error', () => {
      console.warn('[GTM] Failed to load configured container:', containerId);
    });

    document.head.appendChild(script);
  } catch (error) {
    console.error('[GTM] Initialization failed:', error);
  }
}

export function watchGoogleTagManagerConsent(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handleConsentChange = () => { void initializeGoogleTagManager(); };
  window.addEventListener('zoal-cookie-preferences-changed', handleConsentChange);
  return () => window.removeEventListener('zoal-cookie-preferences-changed', handleConsentChange);
}
