(() => {
  const ADMIN_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);
  const DETAIL_PATH = /^\/blog\/[^/]+|^\/store$/;
  const DETAIL_QUERY = new URLSearchParams(window.location.search).has('product');
  let seo = null;
  let observerStarted = false;

  const token = () => localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
  const isAdminPage = () => /^\/admin(?:\/|$)/.test(window.location.pathname);
  const isPublicGeneralPage = () => !isAdminPage() && !DETAIL_QUERY && !/^\/blog\/[^/]+/.test(window.location.pathname);

  function setMeta(selector, attr, value) {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, selector.match(/\[name="([^"]+)"\]/)?.[1] || selector.match(/\[property="([^"]+)"\]/)?.[1] || '');
      document.head.appendChild(el);
    }
    el.setAttribute('content', String(value));
  }

  function setCanonical(url) {
    if (!url) return;
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = 'canonical';
      document.head.appendChild(el);
    }
    el.href = url;
  }

  function applyPublicSeo() {
    if (!seo || !isPublicGeneralPage()) return;
    const ar = document.documentElement.lang === 'ar';
    const title = ar ? (seo.title_ar || seo.title) : seo.title;
    const description = ar ? (seo.description_ar || seo.description) : seo.description;
    if (title) document.title = title;
    setMeta('meta[name="description"]', 'name', description);
    setMeta('meta[name="keywords"]', 'name', seo.keywords);
    setMeta('meta[name="robots"]', 'name', seo.robots);
    setMeta('meta[property="og:title"]', 'property', title);
    setMeta('meta[property="og:description"]', 'property', description);
    setMeta('meta[property="og:image"]', 'property', seo.ogImage);
    setMeta('meta[name="twitter:title"]', 'name', title);
    setMeta('meta[name="twitter:description"]', 'name', description);
    setMeta('meta[name="twitter:image"]', 'name', seo.twitterImage || seo.ogImage);
    setMeta('meta[name="twitter:card"]', 'name', seo.twitterCard || 'summary_large_image');
    setCanonical(seo.canonical);

    if (seo.jsonLd) {
      try {
        const parsed = typeof seo.jsonLd === 'string' ? JSON.parse(seo.jsonLd) : seo.jsonLd;
        const old = document.getElementById('cms-global-seo-jsonld');
        if (old) old.remove();
        const script = document.createElement('script');
        script.id = 'cms-global-seo-jsonld';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(parsed);
        document.head.appendChild(script);
      } catch (_) {
        // Invalid optional JSON-LD never blocks normal page metadata.
      }
    }
  }

  async function loadSeo() {
    try {
      const response = await fetch('/api/cms-seo', { credentials: 'same-origin' });
      if (!response.ok) return;
      const data = await response.json();
      seo = data?.setting_value && typeof data.setting_value === 'object' ? data.setting_value : null;
      applyPublicSeo();
      startObserver();
    } catch (_) {
      // Preserve existing application SEO if the optional global registry is unavailable.
    }
  }

  function startObserver() {
    if (observerStarted) return;
    observerStarted = true;
    const observer = new MutationObserver(() => {
      if (isPublicGeneralPage()) applyPublicSeo();
      if (isAdminPage()) mountAdminButton();
    });
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ['content', 'href'] });
  }

  function style(el, styles) {
    Object.assign(el.style, styles);
  }

  function mountAdminButton() {
    if (!isAdminPage() || document.getElementById('zoal-global-seo-launcher')) return;
    const button = document.createElement('button');
    button.id = 'zoal-global-seo-launcher';
    button.type = 'button';
    button.textContent = 'CMS Global SEO';
    style(button, { position: 'fixed', right: '24px', bottom: '24px', zIndex: '2147483000', padding: '11px 16px', border: '1px solid rgba(212,175,55,.45)', borderRadius: '999px', background: 'rgba(0,0,0,.92)', color: '#f5d76e', font: '600 13px Inter, sans-serif', boxShadow: '0 12px 35px rgba(0,0,0,.35)', cursor: 'pointer' });
    button.onclick = openEditor;
    document.body.appendChild(button);
  }

  function openEditor() {
    if (document.getElementById('zoal-global-seo-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'zoal-global-seo-modal';
    style(overlay, { position: 'fixed', inset: '0', zIndex: '2147483001', background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(8px)', overflow: 'auto', padding: '24px' });

    const box = document.createElement('div');
    style(box, { maxWidth: '900px', margin: '24px auto', background: '#08090f', color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '14px', padding: '24px', fontFamily: 'Inter, sans-serif' });

    const fields = [
      ['title', 'Meta Title (English)'], ['title_ar', 'Meta Title (Arabic)'],
      ['description', 'Meta Description (English)'], ['description_ar', 'Meta Description (Arabic)'],
      ['keywords', 'Keywords'], ['canonical', 'Canonical URL'], ['ogImage', 'Open Graph Image URL'],
      ['twitterImage', 'Twitter Image URL'], ['twitterCard', 'Twitter Card'], ['robots', 'Robots']
    ];

    const values = Object.assign({ title:'', title_ar:'', description:'', description_ar:'', keywords:'', canonical:'', ogImage:'', twitterImage:'', twitterCard:'summary_large_image', robots:'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', jsonLd:'' }, seo || {});
    const inputs = {};

    const heading = document.createElement('div');
    heading.innerHTML = '<h2 style="margin:0 0 6px;font-size:22px">Global SEO</h2><p style="margin:0;color:#a1a1aa;font-size:13px">Authoritative public metadata. Detail-page SEO remains application-specific.</p>';
    box.appendChild(heading);

    const grid = document.createElement('div');
    style(grid, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '14px', marginTop: '20px' });
    fields.forEach(([key, label]) => {
      const wrap = document.createElement('label');
      wrap.innerHTML = `<span style="display:block;color:#d4d4d8;font-size:12px;margin-bottom:6px">${label}</span>`;
      const input = document.createElement(key.includes('description') ? 'textarea' : 'input');
      if (input.tagName === 'TEXTAREA') input.rows = 4;
      input.value = values[key] || '';
      style(input, { width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: '#111217', color: '#fff', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', outline: 'none', font: '13px Inter, sans-serif' });
      inputs[key] = input;
      wrap.appendChild(input);
      grid.appendChild(wrap);
    });
    box.appendChild(grid);

    const jsonWrap = document.createElement('label');
    jsonWrap.innerHTML = '<span style="display:block;color:#d4d4d8;font-size:12px;margin:18px 0 6px">JSON-LD (optional, valid JSON only)</span>';
    const json = document.createElement('textarea');
    json.rows = 9; json.value = values.jsonLd || '';
    style(json, { width: '100%', boxSizing: 'border-box', padding: '10px', background: '#111217', color: '#93c5fd', border: '1px solid rgba(255,255,255,.12)', borderRadius: '8px', font: '12px ui-monospace, monospace' });
    jsonWrap.appendChild(json); box.appendChild(jsonWrap);

    const status = document.createElement('div');
    style(status, { minHeight: '20px', marginTop: '14px', color: '#a1a1aa', fontSize: '12px' });
    box.appendChild(status);

    const actions = document.createElement('div');
    style(actions, { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' });
    const close = document.createElement('button'); close.textContent = 'Close';
    const save = document.createElement('button'); save.textContent = 'Save Global SEO';
    [close, save].forEach((b) => style(b, { padding: '9px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }));
    style(close, { ...close.style, background: '#111217', color: '#fff', border: '1px solid rgba(255,255,255,.12)' });
    style(save, { ...save.style, background: '#d4af37', color: '#050505', border: '0' });
    close.onclick = () => overlay.remove();
    save.onclick = async () => {
      const value = {};
      Object.keys(inputs).forEach((key) => value[key] = inputs[key].value.trim());
      value.jsonLd = json.value.trim();
      if (value.canonical && !/^https?:\\/\\//i.test(value.canonical)) { status.textContent = 'Canonical URL must be an absolute http(s) URL.'; return; }
      if (value.jsonLd) { try { JSON.parse(value.jsonLd); } catch (_) { status.textContent = 'JSON-LD is invalid JSON.'; return; } }
      save.disabled = true; status.textContent = 'Saving…';
      try {
        const response = await fetch('/api/cms-seo', { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}) }, body: JSON.stringify({ value }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        seo = value; applyPublicSeo(); status.textContent = 'Saved successfully.';
      } catch (e) { status.textContent = `Save failed: ${e.message}`; } finally { save.disabled = false; }
    };
    actions.append(close, save); box.appendChild(actions); overlay.appendChild(box); document.body.appendChild(overlay);
  }

  function boot() {
    mountAdminButton();
    loadSeo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
