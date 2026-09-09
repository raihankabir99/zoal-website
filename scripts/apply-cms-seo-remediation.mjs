import fs from 'node:fs';

const root = process.cwd();
const read = (p) => fs.readFileSync(`${root}/${p}`, 'utf8');
const write = (p, s) => fs.writeFileSync(`${root}/${p}`, s, 'utf8');

const panel = `import React, { useEffect, useState } from 'react';

const DEFAULTS = { title: '', title_ar: '', description: '', description_ar: '', keywords: '', canonical: '', ogImage: '', twitterImage: '', twitterCard: 'summary_large_image', robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', jsonLd: '' };
const ROLES = new Set(['owner', 'admin', 'manager', 'staff']);

export default function CmsGlobalSeoPanel({ currentUser, addLog }: { currentUser: any; addLog?: (action: string, target?: string) => void }) {
  const [value, setValue] = useState<any>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const canManage = ROLES.has(String(currentUser?.role || '').toLowerCase());
  useEffect(() => { let cancelled = false; fetch('/api/cms/settings').then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(records => { if (cancelled) return; const row = Array.isArray(records) ? records.find(x => x?.setting_key === 'seo.global') : null; setValue({ ...DEFAULTS, ...(row?.setting_value && typeof row.setting_value === 'object' ? row.setting_value : {}) }); }).catch(e => { if (!cancelled) setMessage(`Unable to load SEO settings: ${e.message}`); }).finally(() => { if (!cancelled) setLoaded(true); }); return () => { cancelled = true; }; }, []);
  const update = (key: string, next: string) => setValue((prev: any) => ({ ...prev, [key]: next }));
  const save = async () => { if (!canManage) return; if (value.canonical && !/^https?:\/\//i.test(value.canonical)) { setMessage('Canonical URL must be an absolute http(s) URL.'); return; } if (value.jsonLd.trim()) { try { JSON.parse(value.jsonLd); } catch { setMessage('JSON-LD must contain valid JSON.'); return; } } setSaving(true); setMessage(''); try { const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token'); const res = await fetch('/api/cms/settings/seo.global', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ value }) }); if (!res.ok) throw new Error(`HTTP ${res.status}`); setMessage('Global SEO settings saved.'); addLog?.('Updated global SEO settings', 'seo.global'); } catch (e: any) { setMessage(`Save failed: ${e.message}`); } finally { setSaving(false); } };
  if (!loaded) return <div className="p-6 text-zinc-400">Loading authoritative SEO settings…</div>;
  const fields = [['title','Meta Title (English)'],['title_ar','Meta Title (Arabic)'],['description','Meta Description (English)'],['description_ar','Meta Description (Arabic)'],['keywords','Keywords'],['canonical','Canonical URL'],['ogImage','Open Graph Image URL'],['twitterImage','Twitter Image URL'],['twitterCard','Twitter Card'],['robots','Robots']];
  return <div className="space-y-5 rounded-xl border border-white/10 bg-black/20 p-6"><div><h2 className="text-xl font-semibold text-white">Global SEO</h2><p className="mt-1 text-sm text-zinc-400">Authoritative public metadata. Page/product/article-specific SEO may override these defaults.</p></div>{!canManage && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Your role cannot edit global SEO settings.</div>}<div className="grid gap-4 md:grid-cols-2">{fields.map(([key,label]) => <label key={key} className="space-y-2"><span className="text-sm text-zinc-300">{label}</span><input disabled={!canManage} value={value[key] || ''} onChange={e => update(key,e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-yellow-500" /></label>)}</div><label className="space-y-2 block"><span className="text-sm text-zinc-300">JSON-LD (optional)</span><textarea disabled={!canManage} rows={10} value={value.jsonLd || ''} onChange={e => update('jsonLd',e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white outline-none focus:border-yellow-500" /></label><div className="flex items-center justify-between gap-4"><span className="text-sm text-zinc-400">{message}</span><button disabled={!canManage || saving} onClick={save} className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black disabled:opacity-50">{saving ? 'Saving…' : 'Save Global SEO'}</button></div></div>;
}
`;
write('src/components/CmsGlobalSeoPanel.tsx', panel);

let cms = read('server/cms.ts');
cms = cms.replace("const PUBLIC_CMS_SETTING_KEYS = new Set(['navigation.menu', 'footer.settings', 'announcement.settings', 'popup.settings']);", "const PUBLIC_CMS_SETTING_KEYS = new Set(['navigation.menu', 'footer.settings', 'announcement.settings', 'popup.settings', 'seo.global']);");
write('server/cms.ts', cms);

let manager = read('src/components/EnterpriseCmsManager.tsx');
manager = manager.replace("import CmsTextsPanel from './CmsTextsPanel';", "import CmsTextsPanel from './CmsTextsPanel';\nimport CmsGlobalSeoPanel from './CmsGlobalSeoPanel';");
const anchor = "  const [cmsTab, setCmsTab] = useState<string>('dashboard');";
manager = manager.replace(anchor, `${anchor}\n  const [showGlobalSeo, setShowGlobalSeo] = useState(false);`);
const seoButton = `<button type="button" onClick={() => setShowGlobalSeo(true)} className="fixed bottom-6 right-6 z-[70] rounded-full border border-yellow-500/40 bg-black/90 px-4 py-3 text-sm font-semibold text-yellow-300 shadow-xl backdrop-blur" aria-label="Open Global SEO settings">Global SEO</button>`;
manager = manager.replace('<div className="space-y-', seoButton + '\n      <div className="space-y-');
manager = manager.replace('</div>\n\nexport default', '</div>\n      {showGlobalSeo && <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><div className="mx-auto mt-8 max-w-5xl"><div className="mb-3 flex justify-end"><button type="button" onClick={() => setShowGlobalSeo(false)} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white">Close</button></div><CmsGlobalSeoPanel currentUser={currentUser} addLog={addLog} /></div></div>}\n    </div>\n\nexport default');
write('src/components/EnterpriseCmsManager.tsx', manager);

let seo = read('src/components/SEO.tsx');
seo = seo.replace("import { useEffect } from 'react';", "import { useEffect, useState } from 'react';");
seo = seo.replace("  const brandName = 'ZOAL';", "  const brandName = 'ZOAL';\n  const [cmsGlobalSeo, setCmsGlobalSeo] = useState<any>(null);\n  useEffect(() => { let cancelled = false; fetch('/api/cms/settings').then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).then(records => { if (cancelled) return; const row = Array.isArray(records) ? records.find((x:any) => x?.setting_key === 'seo.global') : null; if (row?.setting_value && typeof row.setting_value === 'object') setCmsGlobalSeo(row.setting_value); }).catch(() => {}).finally(() => {}); return () => { cancelled = true; }; }, []);");
seo = seo.replace("    let ogImage = settings.businessLogo; // Use business logo as default OG image", "    let ogImage = settings.businessLogo; // Use business logo as default OG image\n    if (!selectedPost && !selectedProduct && cmsGlobalSeo) {\n      if (cmsGlobalSeo.title || cmsGlobalSeo.title_ar) title = i18n.language === 'ar' && cmsGlobalSeo.title_ar ? cmsGlobalSeo.title_ar : (cmsGlobalSeo.title || title);\n      if (cmsGlobalSeo.description || cmsGlobalSeo.description_ar) description = i18n.language === 'ar' && cmsGlobalSeo.description_ar ? cmsGlobalSeo.description_ar : (cmsGlobalSeo.description || description);\n      if (cmsGlobalSeo.keywords) keywords = String(cmsGlobalSeo.keywords);\n      if (cmsGlobalSeo.canonical) canonical = String(cmsGlobalSeo.canonical);\n      if (cmsGlobalSeo.ogImage) ogImage = String(cmsGlobalSeo.ogImage);\n    }");
seo = seo.replace("          'priceValidUntil': '2030-12-31',\n", '');
seo = seo.replace("          'reviewCount': '15',\n", '');
write('src/components/SEO.tsx', seo);

console.log('CMS SEO remediation source patch applied.');