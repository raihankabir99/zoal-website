import React, { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';

interface ActivityRow {
  id: string;
  user_id?: string;
  email?: string;
  action?: string;
  timestamp?: string;
  resource_id?: string;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  changed_fields?: string[] | null;
  metadata?: Record<string, any> | null;
  result?: string;
  severity?: string;
  source?: string;
}

interface Props {
  currentUser: { role?: string; email?: string } | null;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AuthoritativeInventoryActivityPanel({ currentUser }: Props) {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/inventory?view=logs&limit=250', {
        headers: authHeaders(),
        credentials: 'include'
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Unable to load the authoritative inventory ledger.');
      setRows(Array.isArray(result?.data) ? result.data : []);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || 'Unable to load the authoritative inventory ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const successful = rows.filter(row => row.result === 'success').length;
    const adjustments = rows.filter(row => String(row.action || '').includes('ADJUST')).length;
    return { successful, adjustments };
  }, [rows]);

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">INVENTORY MANAGEMENT</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold-pure" /> AUTHORITATIVE ACTIVITY LEDGER
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-2">Server-authoritative records from zoal_activity_logs. No localStorage transaction history is used here.</p>
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 border border-white/10 hover:border-gold-pure text-zinc-300 hover:text-gold-pure font-mono text-[9px] uppercase flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Ledger
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs">
          <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Ledger Rows</span>
          <span className="text-xl font-bold font-mono text-white block mt-1">{rows.length}</span>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs">
          <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Successful Mutations</span>
          <span className="text-xl font-bold font-mono text-emerald-400 block mt-1">{summary.successful}</span>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs">
          <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Adjust Operations</span>
          <span className="text-xl font-bold font-mono text-gold-pure block mt-1">{summary.adjustments}</span>
        </div>
        <div className="bg-zinc-950/60 border border-white/5 p-4 rounded-xs">
          <span className="text-[8px] tracking-widest text-zinc-500 font-mono uppercase">Viewer Role</span>
          <span className="text-xl font-bold font-mono text-white block mt-1">{currentUser?.role || 'unknown'}</span>
        </div>
      </div>

      {error && (
        <div className="border border-rose-500/20 bg-rose-950/20 p-4 text-rose-300 text-xs font-mono flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div><strong>Ledger unavailable:</strong> {error}</div>
        </div>
      )}

      <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Server-authoritative inventory events
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] font-mono">
            <thead className="bg-white/[0.02] text-zinc-500 uppercase tracking-widest">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Product</th>
                <th className="p-3">Warehouse</th>
                <th className="p-3">Before → After</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Reason / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Loading authoritative ledger…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No authoritative inventory events found.</td></tr>
              ) : rows.map(row => {
                const before = Number(row.before_state?.quantity ?? 0);
                const after = Number(row.after_state?.quantity ?? 0);
                return (
                  <tr key={row.id} className="hover:bg-white/[0.02]">
                    <td className="p-3 whitespace-nowrap">{formatDate(row.timestamp)}</td>
                    <td className="p-3 text-gold-pure">{row.action || '—'}</td>
                    <td className="p-3">{row.metadata?.product_id || row.resource_id || '—'}</td>
                    <td className="p-3">{row.metadata?.warehouse_id || '—'}</td>
                    <td className="p-3">{before} → {after}</td>
                    <td className="p-3">{row.email || row.user_id || '—'}</td>
                    <td className="p-3">{row.metadata?.reason || '—'}{row.metadata?.reference_id ? ` / ${row.metadata.reference_id}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function InventoryDataNotProvisionedPanel({ title }: { title: string }) {
  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      <div className="border border-amber-500/20 bg-amber-950/10 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-widest">{title}</h2>
            <p className="text-xs text-zinc-400 font-mono mt-3 leading-6">This inventory subsection is intentionally blocked from showing fabricated records. No authoritative production schema for this subsection was found during the current audit. Existing localStorage/demo records are not treated as operational data.</p>
            <p className="text-[10px] text-amber-300 font-mono mt-3 uppercase">Status: NOT PROVISIONED — REQUIRES AUTHORITATIVE DATA MODEL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
