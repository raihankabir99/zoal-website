declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

let isMetaPixelInitialized = false;

export function initializeMetaPixel(pixelId?: string): void {
  if (isMetaPixelInitialized) return;

  const activeId = pixelId || import.meta.env.VITE_META_PIXEL_ID;
  if (!activeId) {
    console.info('Meta Pixel ID is not configured. Future ready initialization is available once an ID is provided.');
    return;
  }

  try {
    /* eslint-disable */
    (function(f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    if (window.fbq) {
      window.fbq('init', activeId);
      window.fbq('track', 'PageView');
      isMetaPixelInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing Meta Pixel:', error);
  }
}
