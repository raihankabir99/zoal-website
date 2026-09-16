import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initializeAnalytics } from './analytics';
import { watchGoogleTagManagerConsent } from './analytics/GoogleTagManager';

// Defer non-critical startup analytics to run in browser idle time to optimize initial FCP/LCP.
// GTM configuration is resolved from the persisted Supabase setting and remains blocked until consent.
if (typeof window !== 'undefined') {
  watchGoogleTagManagerConsent();
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initializeAnalytics());
  } else {
    setTimeout(() => initializeAnalytics(), 1000);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
