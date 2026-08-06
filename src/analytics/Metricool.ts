declare global {
  interface Window {
    beTracker?: {
      t: (config: { hash: string }) => void;
    };
  }
}

let isMetricoolInitialized = false;

export function initializeMetricool(): void {
  if (isMetricoolInitialized) {
    return;
  }

  const hash = '480823f215e78b547cfc037137c22a28';
  if (!hash) {
    console.warn('Metricool hash is missing. Tracking will not be initialized.');
    return;
  }

  // Prevent duplicate script tag loading
  const existingScript = document.querySelector('script[src*="tracker.metricool.com"]');
  if (existingScript) {
    isMetricoolInitialized = true;
    return;
  }

  try {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://tracker.metricool.com/resources/be.js';
    
    script.addEventListener('load', () => {
      if (window.beTracker && typeof window.beTracker.t === 'function') {
        window.beTracker.t({ hash });
        isMetricoolInitialized = true;
      } else {
        console.warn('Metricool script loaded, but window.beTracker.t is not defined.');
      }
    });

    script.addEventListener('error', (err) => {
      console.warn('Failed to load Metricool script:', err);
    });

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error('Error initializing Metricool analytics:', error);
  }
}
