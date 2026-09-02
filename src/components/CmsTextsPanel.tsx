import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Edit, Filter, Languages, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';

interface GlobalStringRecord {
  id: string;
  key: string;
  locale: 'en' | 'ar';
  value: string;
  category: 'ui' | 'marketing';
  status: 'draft' | 'published';
  is_html: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface CmsTextsPanelProps {
  currentUser?: any;
  addLog?: (action: string, target?: string) => void;
}

const EMPTY_FORM = {
  key: '',
  en: '',
  ar: '',
  category: 'ui' as 'ui' | 'marketing',
  status: 'draft' as 'draft' | 'published',
};

const canManageTexts = (user: any) => ['owner', 'admin'].includes(String(user?.role || '').toLowerCase());

export default function CmsTextsPanel({ currentUser, addLog }: CmsTextsPanelProps) {
  const [rows, setRows] = useState<GlobalStringRecord[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'ui' | 'marketing'>('all');
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<GlobalStringRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const manager = canManageTexts(currentUser);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      const response = await fetch(`/api/texts${params.toString() ? `?${params.toString()}` : ''}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load global strings.');
      setRows(Array.isArray(payload?.texts) ? payload.texts : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load global strings.');
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      row.key.toLowerCase().includes(needle) ||
      row.value.toLowerCase().includes(needle)
    );
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  };

  const openEdit = (row: GlobalStringRecord) => {
    const pair = rows.filter((item) => item.key === row.key);
    setEditing(row);
    setForm({
      key: row.key,
      en: pair.find((item) => item.locale === 'en')?.value || '',
      ar: pair.find((item) => item.locale === 'ar')?.value || '',
      category: row.category,
      status: row.status,
    });
    setShowForm(true);
    setError('');
  };

  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || 'Request failed.');
    return payload;
  };

  const save = async () => {
    if (!manager) return;
    if (!form.key.trim() || !form.en.trim() || !form.ar.trim()) {
      setError('Key, English value, and Arabic value are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const values = [
        { locale: 'en' as const, value: form.en.trim() },
        { locale: 'ar' as const, value: form.ar.trim() },
      ];

      if (editing) {
        for (const value of values) {
          const existing = rows.find((row) => row.key === editing.key && row.locale === value.locale);
          if (existing) {
            await request(`/api/texts/${existing.id}`, 'PUT', {
              key: form.key.trim(),
              locale: value.locale,
              value: value.value,
              category: form.category,
              status: form.status,
            });
          } else {
            await request('/api/texts', 'POST', {
              key: form.key.trim(),
              locale: value.locale,
              value: value.value,
              category: form.category,
              status: form.status,
            });
          }
        }
        addLog?.(`Updated global string: ${form.key.trim()}`, 'Texts & Translations');
      } else {
        for (const value of values) {
          await request('/api/texts', 'POST', {
            key: form.key.trim(),
            locale: value.locale,
            value: value.value,
            category: form.category,
            status: form.status,
          });
        }
        addLog?.(`Created global string: ${form.key.trim()}`, 'Texts & Translations');
      }

      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to save global string.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: GlobalStringRecord) => {
    if (!manager) return;
    if (!window.confirm(`Delete global string "${row.key}" (${row.locale})?`)) return;
    setError('');
    try {
      await request(`/api/texts/${row.id}`, 'DELETE');
      addLog?.(`Deleted global string: ${row.key} (${row.locale})`, 'Texts & Translations');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete global string.');
    }
  };

  return (
    <div className="space-y-6 text-[10px]">
      <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-3">
          <div>
            <div className="flex items-center gap-2 text-gold-pure font-mono text-[8px] uppercase tracking-[0.2em] font-bold">
              <Languages className="w-3.5 h-3.5" /> Global UI Text Registry
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mt-1">Texts & Translations</h3>
            <p className="text-[8px] text-zinc-500 mt-1 font-sans">English + Arabic global UI and short marketing strings. Product, blog, page, hero and branding content remain in their owning modules.</p>
          </div>
          {manager && (
            <button onClick={openCreate} className="py-2 px-3 bg-white text-black hover:bg-gold-pure rounded-xs text-[8px] uppercase tracking-widest font-bold font-mono flex items-center gap-1.5">
              <Plus className="w-3 h-3" /> New String
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-2 top-2.5 w-3 h-3 text-zinc-600" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search key or text..." className="w-full bg-black border border-white/10 text-white pl-7 pr-2 py-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[9px]" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="bg-black border border-white/10 text-zinc-300 p-2 rounded-xs outline-none font-mono text-[9px]">
            <option value="all">All Categories</option>
            <option value="ui">UI</option>
            <option value="marketing">Marketing</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="bg-black border border-white/10 text-zinc-300 p-2 rounded-xs outline-none font-mono text-[9px]">
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
          <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> {filteredRows.length} registry records</span>
          <button onClick={() => void load()} className="px-2 py-1 border border-white/5 hover:border-white/10 text-zinc-300 rounded-xs flex items-center gap-1 uppercase">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {error && <div className="border border-rose-500/20 bg-rose-500/5 text-rose-300 p-2 rounded-xs text-[8px] font-mono">{error}</div>}

        {showForm && manager && (
          <div className="border border-gold-pure/20 bg-black p-4 rounded-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[8px] uppercase tracking-widest text-gold-pure font-mono font-bold">{editing ? 'Edit Global String' : 'Create Global String'}</span>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-zinc-500 uppercase font-mono text-[8px] mb-1">Stable i18next Key</label>
                <input value={form.key} onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))} disabled={!!editing} placeholder="nav.home" className="w-full bg-zinc-950 border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure font-mono text-[9px] disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-zinc-500 uppercase font-mono text-[8px] mb-1">English</label>
                <textarea rows={3} value={form.en} onChange={(e) => setForm((p) => ({ ...p, en: e.target.value }))} className="w-full bg-zinc-950 border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure text-[9px] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-500 uppercase font-mono text-[8px] mb-1">العربية</label>
                <textarea rows={3} dir="rtl" value={form.ar} onChange={(e) => setForm((p) => ({ ...p, ar: e.target.value }))} className="w-full bg-zinc-950 border border-white/10 text-white p-2 rounded-xs outline-none focus:border-gold-pure text-[9px] resize-none" />
              </div>
              <div>
                <label className="block text-zinc-500 uppercase font-mono text-[8px] mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as any }))} className="w-full bg-zinc-950 border border-white/10 text-zinc-300 p-2 rounded-xs outline-none font-mono text-[9px]">
                  <option value="ui">UI</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-500 uppercase font-mono text-[8px] mb-1">Publication</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))} className="w-full bg-zinc-950 border border-white/10 text-zinc-300 p-2 rounded-xs outline-none font-mono text-[9px]">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-white/10 text-zinc-400 rounded-xs uppercase font-mono text-[8px]">Cancel</button>
              <button disabled={saving} onClick={() => void save()} className="px-3 py-1.5 bg-white text-black hover:bg-gold-pure disabled:opacity-50 rounded-xs uppercase font-mono text-[8px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save String'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border border-white/5">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-black border-b border-white/5 text-zinc-500 font-mono uppercase text-[7.5px] tracking-wider">
              <tr><th className="p-2.5">Key</th><th className="p-2.5">Locale</th><th className="p-2.5">Value</th><th className="p-2.5">Category</th><th className="p-2.5">Status</th><th className="p-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((row) => (
                <tr key={row.id} className="bg-zinc-950/50 hover:bg-zinc-900/60">
                  <td className="p-2.5 font-mono text-gold-pure text-[8px] align-top">{row.key}</td>
                  <td className="p-2.5 font-mono text-zinc-400 uppercase text-[8px] align-top">{row.locale}</td>
                  <td className="p-2.5 text-zinc-300 text-[9px] max-w-[360px] whitespace-pre-wrap">{row.value}</td>
                  <td className="p-2.5 text-zinc-500 font-mono uppercase text-[8px] align-top">{row.category}</td>
                  <td className="p-2.5 align-top"><span className={`px-1.5 py-0.5 rounded-full border font-mono uppercase text-[7px] ${row.status === 'published' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/20 text-amber-400 bg-amber-500/5'}`}>{row.status}</span></td>
                  <td className="p-2.5 align-top text-right">
                    {manager && <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(row)} title="Edit" className="p-1.5 border border-white/5 text-zinc-400 hover:text-white rounded-xs"><Edit className="w-3 h-3" /></button>
                      <button onClick={() => void remove(row)} title="Delete" className="p-1.5 border border-white/5 text-zinc-400 hover:text-rose-400 rounded-xs"><Trash2 className="w-3 h-3" /></button>
                    </div>}
                  </td>
                </tr>
              ))}
              {!loading && filteredRows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-zinc-600 font-mono text-[8px] uppercase">No global strings found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
