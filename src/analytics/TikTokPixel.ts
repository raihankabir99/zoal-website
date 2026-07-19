declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: any;
  }
}

let isTikTokPixelInitialized = false;

export function initializeTikTokPixel(pixelId?: string): void {
  if (isTikTokPixelInitialized) return;

  const activeId = pixelId || import.meta.env.VITE_TIKTOK_PIXEL_ID;
  if (!activeId) {
    console.info('TikTok Pixel ID is not configured. Future ready initialization is available once an ID is provided.');
    return;
  }

  try {
    /* eslint-disable */
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      var ttq = w[t] = w[t] || [];
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "setAndRegister", "instance"];
      ttq.setAndRegister = function (e: any, t: any) { ttq.instance(e).setAndRegister(t) };
      ttq.instance = function (e: any) {
        for (var t = ttq._i[e] || [], n = 0; n < ttq.methods.length; n++) {
          ttq.set(t, ttq.methods[n]);
        }
        return t;
      };
      ttq.set = function (e: any, t: any) {
        e[t] = function () {
          e.push([t].concat(Array.prototype.slice.call(arguments, 0)))
        }
      };
      ttq.load = function (e: any, t: any) {
        var n = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {};
        ttq._i[e] = [];
        ttq._i[e]._u = n;
        ttq._t = ttq._t || +new Date();
        ttq._o = ttq._o || {};
        ttq._o[e] = t || {};
        var o = d.createElement("script");
        o.type = "text/javascript";
        o.async = !0;
        o.src = n + "?sdkid=" + e + "&lib=" + t;
        var a = d.getElementsByTagName("script")[0];
        if (a && a.parentNode) {
          a.parentNode.insertBefore(o, a);
        } else {
          d.head.appendChild(o);
        }
      };
    })(window, document, 'ttq');
    /* eslint-enable */

    if (window.ttq) {
      window.ttq.load(activeId);
      window.ttq.page();
      isTikTokPixelInitialized = true;
    }
  } catch (error) {
    console.error('Error initializing TikTok Pixel:', error);
  }
}
