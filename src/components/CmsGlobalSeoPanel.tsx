import React, { useEffect, useMemo, useState } from 'react';
import { Check, RefreshCw, Shield, AlertTriangle } from 'lucide-react';

interface GlobalSeoSettings {
  seoTitle: string;
  seoTitleAr: string;
  seoDesc: string;
  seoDescAr: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  twitterTitle: string;
  twitterDesc: string;
  twitterImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  robots: string;
  schemaMarkup: string;
}

const EMPTY: GlobalSeoSettings = {
  seoTitle: '', seoTitleAr: '', seoDesc: '', seoDescAr: '', keywords: '', canonicalUrl: '',
  ogTitle: '', ogDesc: '', ogImage: '', twitterTitle: '', twitterDesc: '', twitterImage: '',
  twitterCard: 'summary_large_image',
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  schemaMarkup: ''
};

function validateCanonical(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function CmsGlobalSeoPanel({ currentUser, addLog }: { currentUser: any; addLog: (action: string, target?: string) => void }) {
  const [form, setForm] = useState<GlobalSeoSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canEdit = ['owner', 'admin', 'manager', 'staff'].includes(String(currentUser?.role || '').toLowerCase());
  const schemaError = useMemo(() => {
    if (!form.schemaMarkup.trim()) return null;
    try { JSON.parse(form.schemaMarkup); return null; } catch { return 'JSON-LD must be valid JSON before saving.'; }
  }, [form.schemaMarkup]);

  const load = async () => {
    setError(null);
    try {
      const response = await fetch('/api/cms/settings');
      if (!response.ok) throw new Error(`SEO settings API returned HTTP ${response.status}`);
      const records = await response.json();
      const value = Array.isArray(records) ? records.find((item: any) => item.setting_key === 'seo.global')?.setting_value : null;
      if (value && typeof value === 'object') setForm({ ...EMPTY, ...value });
      else setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message || 'Unable to load authoritative SEO settings.');
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void load(); }, []);

  const save = async () => {
    if (!canEdit) return;
    if (!validateCanonical(form.canonicalUrl)) {
      setError('Canonical URL must be a valid absolute HTTP(S) URL.');
      return;
    }
    if (schemaError) {
      setError(schemaError);
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
      const response = await fetch('/api/cms/settings/seo.global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ value: form })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Save failed with HTTP ${response.status}`);
      setNotice('Authoritative global SEO settings saved.');
      addLog('Updated authoritative global SEO settings', 'CMS / SEO');
    } catch (err: any) {
      setError(err?.message || 'Unable to save SEO settings.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof GlobalSeoSettings, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const input = (label: string, key: keyof GlobalSeoSettings, dir?: 'rtl' | 'ltr') => (
    <div className="space-y-1">
      <label className="block text-[8px] font-mono uppercase text-zinc-400">{label}</label>
      <input value={String(form[key] ?? '')} onChange={e => update(key, e.target.value)} dir={dir} className="w-full bg-zinc-900 border border-white/10 rounded-xs p-2 text-white outline-none focus:border-gold-pure font-mono text-[9px]" />
    </div>
  );

  return (
    <div className="space-y-6 text-[10px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div>
          <span className="text-[8.5px] font-mono uppercase text-gold-pure tracking-widest block font-bold">Authoritative Global SEO</span>
          <p className="text-[8px] text-zinc-500 font-sans mt-1">Stored in Supabase through <code>/api/cms/settings/seo.global</code>. No localStorage SEO state.</p>
        </div>
        <button onClick={() => void load()} disabled={!loaded || saving} className="p-2 bg-zinc-900 border border-white/10 rounded-xs text-zinc-400 hover:text-white disabled:opacity-40" title="Reload SEO settings">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && <div className="p-3 bg-rose-950/30 border border-rose-500/30 text-rose-300 rounded-xs font-mono text-[8.5px]">{error}</div>}
      {notice && <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 rounded-xs font-mono text-[8.5px]">{notice}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {input('Meta Title (English)', 'seoTitle')}
        {input('Meta Title (Arabic)', 'seoTitleAr', 'rtl')}
        {input('Meta Description (English)', 'seoDesc')}
        {input('Meta Description (Arabic)', 'seoDescAr', 'rtl')}
        {input('Keywords (CSV)', 'keywords')}
        {input('Canonical URL', 'canonicalUrl', 'ltr')}
        {input('OpenGraph Title', 'ogTitle')}
        {input('OpenGraph Description', 'ogDesc')}
        {input('OpenGraph Image URL', 'ogImage', 'ltr')}
        {input('Twitter Title', 'twitterTitle')}
        {input('Twitter Description', 'twitterDesc')}
        {input('Twitter Image URL', 'twitterImage', 'ltr')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[8px] font-mono uppercase text-zinc-400">Twitter Card</label>
          <select value={form.twitterCard} onChange={e => update('twitterCard', e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xs p-2 text-white outline-none focus:border-gold-pure font-mono text-[9px]">
            <option value="summary_large_image">summary_large_image</option>
            <option value="summary">summary</option>
          </select>
        </div>
        {input('Robots Directives', 'robots')}
      </div>

      <div className="space-y-1">
        <label className="block text-[8px] font-mono uppercase text-zinc-400">Schema.org JSON-LD</label>
        <textarea rows={9} value={form.schemaMarkup} onChange={e => update('schemaMarkup', e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xs p-2 text-sky-300 outline-none focus:border-gold-pure font-mono text-[9px] leading-relaxed" placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Organization"\n}'} />
        {schemaError && <span className="text-[8px] text-rose-400 font-mono">{schemaError}</span>}
      </div>

      <div className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xs">
        <div className="flex items-center gap-2 text-zinc-400 font-sans">
          <Shield className="w-3.5 h-3.5 text-gold-pure" />
          <span>Server-authorized role: <strong className="text-white">{String(currentUser?.role || 'unknown').toUpperCase()}</strong></span>
        </div>
        <button onClick={() => void save()} disabled={!canEdit || saving || !loaded} className="py-2 px-5 bg-gold-pure text-black rounded-xs text-[9px] uppercase tracking-widest font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving...' : 'Save Global SEO'}
        </button>
      </div>

      <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xs text-[8px] text-amber-300 font-sans flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>Global SEO is intentionally blank until an authorized operator provisions real business metadata. The panel never seeds fabricated URLs, reviews, schema, or social profiles.</span>
      </div>
    </div>
  );
}
