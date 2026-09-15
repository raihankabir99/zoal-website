import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initializeAnalytics } from './analytics';
import { initializeGoogleTagManager, watchGoogleTagManagerConsent } from './analytics/GoogleTagManager';

// Defer non-critical startup analytics to run in browser idle time to optimize initial FCP/LCP.
// GTM is consent-aware and only loads when a valid VITE_GTM_CONTAINER_ID is configured
// and the visitor has granted analytics or marketing consent.
if (typeof window !== 'undefined') {
  const initializeTracking = () => {
    initializeAnalytics();
    initializeGoogleTagManager();
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initializeTracking);
  } else {
    setTimeout(initializeTracking, 1000);
  }

  watchGoogleTagManagerConsent();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
