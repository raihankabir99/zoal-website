import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Activity, BellRing } from 'lucide-react';

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

interface ServiceHealth {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  monitored: boolean;
}

interface HealthSnapshot {
  checked_at: string;
  overall_status: HealthStatus;
  database_status: HealthStatus;
  database_latency_ms?: number | null;
  backend_status: HealthStatus;
  backend_processing_ms?: number | null;
  runtime_status: HealthStatus;
  rss_mb?: number | null;
  heap_used_mb?: number | null;
  heap_total_mb?: number | null;
  error_message?: string | null;
}

interface ActiveIncident {
  id: string;
  severity: 'DEGRADED' | 'UNHEALTHY';
  status: 'open' | 'resolved';
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  last_message?: string | null;
}

interface HealthResponse {
  overallStatus: HealthStatus;
  checkedAt: string;
  services: {
    database: ServiceHealth;
    backend: ServiceHealth;
    runtime: ServiceHealth;
    storage: ServiceHealth;
    authentication: ServiceHealth;
  };
  metrics: {
    backendProcessingMs: number;
    processUptimeSeconds: number;
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  history?: HealthSnapshot[];
  activeIncident?: ActiveIncident | null;
}

const statusClass: Record<HealthStatus, string> = {
  HEALTHY: 'text-emerald-400 bg-emerald-500/10',
  DEGRADED: 'text-amber-400 bg-amber-500/10',
  UNHEALTHY: 'text-red-400 bg-red-500/10',
  UNKNOWN: 'text-zinc-400 bg-zinc-500/10'
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function EnterpriseHealthMonitor() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHealth = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const token = localStorage.getItem('auth_token') || '';
      const response = await fetch('/api/admin/health?limit=24', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Health monitoring request failed');
      const payload = await response.json() as HealthResponse;
      setData(payload);
      setError('');
    } catch {
      setError('Monitoring Unavailable');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    const interval = window.setInterval(() => loadHealth(), 15000);
    return () => window.clearInterval(interval);
  }, [loadHealth]);

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 font-mono text-xs uppercase">Loading live system telemetry...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-xs text-center">
        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-3" />
        <div className="text-red-400 font-mono text-xs uppercase tracking-widest">{error || 'Monitoring Unavailable'}</div>
        <button onClick={() => loadHealth(true)} className="mt-4 px-4 py-2 border border-white/10 text-white text-[10px] font-mono uppercase flex items-center gap-2 mx-auto">
          <RefreshCw className={refreshing ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} /> Retry
        </button>
      </div>
    );
  }

  const cards = [
    ['Overall System', data.overallStatus, 'Current monitored status'],
    ['Database', data.services.database.status, data.services.database.latencyMs !== undefined ? `${data.services.database.latencyMs}ms query check` : 'No latency available'],
    ['Backend Runtime', data.services.backend.status, `${data.metrics.backendProcessingMs}ms processing`],
    ['Node.js Memory', data.services.runtime.status, `${data.metrics.rssMb} MB RSS`]
  ] as const;

  const history = data.history ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[9px] text-zinc-500 font-mono uppercase">Last checked: {new Date(data.checkedAt).toLocaleString()}</div>
        <button onClick={() => loadHealth(true)} disabled={refreshing} className="px-3 py-2 border border-white/10 text-zinc-300 hover:text-white text-[9px] font-mono uppercase flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={refreshing ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} /> Refresh
        </button>
      </div>

      {data.activeIncident && (
        <div className="p-4 border border-red-500/20 bg-red-500/5 flex items-start gap-3">
          <BellRing className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-red-300 font-mono font-bold uppercase">Active incident: {data.activeIncident.severity}</div>
            <div className="text-xs text-zinc-300 mt-1">{data.activeIncident.last_message || 'System health requires attention.'}</div>
            <div className="text-[9px] text-zinc-500 font-mono uppercase mt-2">Occurrences: {data.activeIncident.occurrence_count} · First seen: {new Date(data.activeIncident.first_seen).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center font-mono">
        {cards.map(([metric, status, detail]) => (
          <div key={metric} className="p-5 bg-zinc-950 border border-white/5 rounded-xs space-y-2">
            <span className="text-zinc-500 text-[9px] block uppercase leading-none">{metric}</span>
            <span className={`text-[10px] font-bold uppercase inline-block px-2 py-1 rounded-full ${statusClass[status]}`}>{status}</span>
            <span className="text-xs text-white block">{detail}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px] font-mono text-zinc-500">
        <div>Process uptime: <span className="text-zinc-200">{formatUptime(data.metrics.processUptimeSeconds)}</span></div>
        <div>Heap used: <span className="text-zinc-200">{data.metrics.heapUsedMb} MB</span></div>
        <div>Storage/Auth: <span className="text-zinc-400">Not independently monitored</span></div>
      </div>

      <div className="border border-white/5 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-4">
          <Activity className="w-3.5 h-3.5" /> Historical monitoring · last {history.length} checks
        </div>
        {history.length === 0 ? (
          <div className="text-[10px] text-zinc-600 font-mono uppercase">No persisted history yet. The autonomous monitor will populate this timeline after migration 053 is applied.</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto">
            {history.map((snapshot) => (
              <div key={snapshot.checked_at} className="grid grid-cols-[110px_90px_1fr] md:grid-cols-[160px_100px_120px_120px_1fr] gap-3 items-center py-2 border-b border-white/5 text-[9px] font-mono">
                <span className="text-zinc-500">{new Date(snapshot.checked_at).toLocaleString()}</span>
                <span className={`px-2 py-1 rounded-full text-center font-bold ${statusClass[snapshot.overall_status]}`}>{snapshot.overall_status}</span>
                <span className="text-zinc-400">DB {snapshot.database_latency_ms ?? '—'}ms</span>
                <span className="text-zinc-400">API {snapshot.backend_processing_ms ?? '—'}ms</span>
                <span className="text-zinc-500 hidden md:block">RSS {snapshot.rss_mb ?? '—'} MB{snapshot.error_message ? ` · ${snapshot.error_message}` : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
