declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

let isClarityInitialized = false;

export function initializeClarity(projectId?: string): void {
  if (isClarityInitialized) return;

  const activeId = projectId || import.meta.env.VITE_CLARITY_ID;
  if (!activeId) {
    console.info('Microsoft Clarity Project ID is not configured. Future ready initialization is available once an ID is provided.');
    return;
  }

  try {
    /* eslint-disable */
    (function(c: any, l: Document, a: string, r: string, i: string, t?: any, y?: any) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments) };
      t = l.createElement(r);
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      if (y && y.parentNode) {
        y.parentNode.insertBefore(t, y);
      } else {
        l.head.appendChild(t);
      }
    })(window, document, "clarity", "script", activeId);
    /* eslint-enable */

    isClarityInitialized = true;
  } catch (error) {
    console.error('Error initializing Microsoft Clarity:', error);
  }
}
