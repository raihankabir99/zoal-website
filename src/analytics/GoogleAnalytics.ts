declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

let isGoogleAnalyticsInitialized = false;

export function initializeGoogleAnalytics(measurementId?: string): void {
  if (isGoogleAnalyticsInitialized) return;

  const activeId = measurementId || import.meta.env.VITE_GOOGLE_ANALYTICS_ID;
  if (!activeId) {
    console.info('Google Analytics Measurement ID is not configured. Future ready initialization is available once an ID is provided.');
    return;
  }

  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() {
      if (window.dataLayer) {
        window.dataLayer.push(arguments);
      }
    };

    window.gtag('js', new Date());
    window.gtag('config', activeId);

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${activeId}`;
    
    script.addEventListener('error', (err) => {
      console.warn('Failed to load Google Analytics script:', err);
    });

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    isGoogleAnalyticsInitialized = true;
  } catch (error) {
    console.error('Error initializing Google Analytics:', error);
  }
}
