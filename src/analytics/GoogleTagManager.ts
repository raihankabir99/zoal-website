declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

let isGoogleTagManagerLoaded = false;

const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{5,10}$/;

function getGtmContainerId(): string {
  const value = import.meta.env.VITE_GTM_CONTAINER_ID;
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

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

export function initializeGoogleTagManager(): void {
  if (typeof window === 'undefined' || isGoogleTagManagerLoaded) return;

  const containerId = getGtmContainerId();
  if (!containerId || !GTM_ID_PATTERN.test(containerId)) {
    return;
  }

  if (!hasAnalyticsOrMarketingConsent()) {
    return;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js',
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    script.dataset.zoalGtm = containerId;

    script.addEventListener('error', () => {
      console.warn('Failed to load Google Tag Manager container:', containerId);
    });

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    isGoogleTagManagerLoaded = true;
  } catch (error) {
    console.error('Error initializing Google Tag Manager:', error);
  }
}

export function watchGoogleTagManagerConsent(): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const handleConsentChange = () => initializeGoogleTagManager();
  window.addEventListener('zoal-cookie-preferences-changed', handleConsentChange);

  return () => {
    window.removeEventListener('zoal-cookie-preferences-changed', handleConsentChange);
  };
}
