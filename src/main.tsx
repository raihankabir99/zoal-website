import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { initializeAnalytics } from './analytics';
import { watchGoogleTagManagerConsent } from './analytics/GoogleTagManager';
import RouteErrorBoundary from './components/common/RouteErrorBoundary';

// Remove a browser's empty hash fragment without changing the current pathname/query.
// This is intentionally limited to an empty hash so real hash state is never touched.
if (typeof window !== 'undefined' && window.location.hash === '') {
  const url = window.location.href;
  if (url.endsWith('#')) {
    window.history.replaceState(window.history.state, document.title, url.slice(0, -1));
  }
}

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
    <RouteErrorBoundary fallbackTitle="ZOAL">
      <App />
    </RouteErrorBoundary>
  </StrictMode>,
);
