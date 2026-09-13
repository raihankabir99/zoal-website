import { Request, Response } from 'express';
import { getSupabaseClient, getServiceSupabaseClient } from '../backend/supabase.ts';

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

interface ServiceHealth {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  monitored: boolean;
}

interface HealthMetrics {
  backendProcessingMs: number;
  processUptimeSeconds: number;
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
}

interface SystemHealthResponse {
  overallStatus: HealthStatus;
  checkedAt: string;
  services: {
    database: ServiceHealth;
    backend: ServiceHealth;
    runtime: ServiceHealth;
    storage: ServiceHealth;
    authentication: ServiceHealth;
  };
  metrics: HealthMetrics;
  history?: Array<Record<string, unknown>>;
  activeIncident?: Record<string, unknown> | null;
}

const DB_DEGRADED_LATENCY_MS = 500;
const API_DEGRADED_LATENCY_MS = 500;
const MEMORY_DEGRADED_MB = 1024;
const MONITOR_INTERVAL_MS = 60_000;
const HISTORY_DEFAULT_LIMIT = 24;
const HISTORY_MAX_LIMIT = 100;

function toMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function aggregateStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('UNHEALTHY')) return 'UNHEALTHY';
  if (statuses.includes('UNKNOWN')) return 'UNKNOWN';
  if (statuses.includes('DEGRADED')) return 'DEGRADED';
  return 'HEALTHY';
}

export async function collectSystemHealth(): Promise<SystemHealthResponse> {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const supabase = getSupabaseClient();

  let database: ServiceHealth = { status: 'UNKNOWN', monitored: true };

  if (!supabase) {
    database = { status: 'UNKNOWN', monitored: true, error: 'Database monitoring is not configured' };
  } else {
    const dbStartedAt = Date.now();
    try {
      const { error } = await supabase.from('zoal_products').select('id', { head: true }).limit(1);
      const latencyMs = Date.now() - dbStartedAt;
      database = error
        ? { status: 'UNHEALTHY', monitored: true, latencyMs, error: 'Database health check failed' }
        : { status: latencyMs > DB_DEGRADED_LATENCY_MS ? 'DEGRADED' : 'HEALTHY', monitored: true, latencyMs };
    } catch {
      database = { status: 'UNHEALTHY', monitored: true, latencyMs: Date.now() - dbStartedAt, error: 'Database health check failed' };
    }
  }

  const memory = process.memoryUsage();
  const rssMb = toMb(memory.rss);
  const heapUsedMb = toMb(memory.heapUsed);
  const heapTotalMb = toMb(memory.heapTotal);
  const runtimeStatus: HealthStatus = rssMb > MEMORY_DEGRADED_MB ? 'DEGRADED' : 'HEALTHY';
  const processingMs = Date.now() - startedAt;
  const backend: ServiceHealth = {
    status: processingMs > API_DEGRADED_LATENCY_MS ? 'DEGRADED' : 'HEALTHY',
    monitored: true,
    latencyMs: processingMs
  };
  const runtime: ServiceHealth = { status: runtimeStatus, monitored: true };
  const storage: ServiceHealth = { status: 'UNKNOWN', monitored: false };
  const authentication: ServiceHealth = { status: 'UNKNOWN', monitored: false };

  return {
    overallStatus: aggregateStatus([database.status, backend.status, runtime.status]),
    checkedAt,
    services: { database, backend, runtime, storage, authentication },
    metrics: { backendProcessingMs: processingMs, processUptimeSeconds: Math.floor(process.uptime()), rssMb, heapUsedMb, heapTotalMb }
  };
}

async function attachObservabilityState(health: SystemHealthResponse, limit: number) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return health;

  try {
    const [{ data: history }, { data: activeIncident }] = await Promise.all([
      supabase.from('zoal_health_monitor_snapshots')
        .select('checked_at,overall_status,database_status,database_latency_ms,backend_status,backend_processing_ms,runtime_status,rss_mb,heap_used_mb,heap_total_mb,error_message')
        .order('checked_at', { ascending: false }).limit(limit),
      supabase.from('zoal_health_monitor_incidents')
        .select('id,fingerprint,severity,status,first_seen,last_seen,resolved_at,occurrence_count,last_message')
        .eq('fingerprint', 'system-health').eq('status', 'open').maybeSingle()
    ]);

    return { ...health, history: history ?? [], activeIncident: activeIncident ?? null };
  } catch {
    // Migration may be pending. Never take the live diagnostic endpoint offline because history is unavailable.
    return { ...health, history: [], activeIncident: null };
  }
}

export async function getHealthMetrics(_req: Request, res: Response) {
  try {
    const health = await collectSystemHealth();
    res.json({ status: health.overallStatus, checkedAt: health.checkedAt, runtime: health.metrics });
  } catch {
    res.status(503).json({ error: 'Health monitoring unavailable' });
  }
}

export async function getSystemHealth(req: Request, res: Response) {
  try {
    const health = await collectSystemHealth();
    const requested = Number.parseInt(String(req.query.limit ?? HISTORY_DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), HISTORY_MAX_LIMIT) : HISTORY_DEFAULT_LIMIT;
    res.json(await attachObservabilityState(health, limit));
  } catch {
    res.status(503).json({ error: 'Health monitoring unavailable' });
  }
}

export async function getHealthHistory(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(503).json({ error: 'Health history unavailable' });
  const requested = Number.parseInt(String(req.query.limit ?? HISTORY_DEFAULT_LIMIT), 10);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), HISTORY_MAX_LIMIT) : HISTORY_DEFAULT_LIMIT;
  const { data, error } = await supabase.from('zoal_health_monitor_snapshots')
    .select('checked_at,overall_status,database_status,database_latency_ms,backend_status,backend_processing_ms,runtime_status,rss_mb,heap_used_mb,heap_total_mb,error_message')
    .order('checked_at', { ascending: false }).limit(limit);
  if (error) return res.status(503).json({ error: 'Health history unavailable' });
  res.json({ snapshots: data ?? [] });
}

async function emitHealthAlert(health: SystemHealthResponse) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return;
  const { data: recipients, error: recipientError } = await supabase.from('zoal_users').select('id,role').in('role', ['owner', 'admin']);
  if (recipientError || !recipients?.length) return;

  const primaryFailure = health.services.database.error ||
    (health.services.database.status !== 'HEALTHY' ? `Database ${health.services.database.status.toLowerCase()}` : null) ||
    (health.services.runtime.status !== 'HEALTHY' ? `Runtime ${health.services.runtime.status.toLowerCase()}` : null) ||
    (health.services.backend.status !== 'HEALTHY' ? `Backend ${health.services.backend.status.toLowerCase()}` : null) ||
    'System health degraded';
  const title = health.overallStatus === 'UNHEALTHY' ? 'ZOAL System Health Critical' : 'ZOAL System Health Degraded';
  const message = `${primaryFailure}. Detected ${health.checkedAt}. DB ${health.services.database.latencyMs ?? 'n/a'}ms, backend ${health.metrics.backendProcessingMs}ms.`;

  const rows = recipients.map((recipient: { id: string; role: string }) => ({
    user_id: recipient.id, title, message,
    type: health.overallStatus === 'UNHEALTHY' ? 'error' : 'warning',
    priority: health.overallStatus === 'UNHEALTHY' ? 'high' : 'medium',
    category: 'system_health', target_role: recipient.role, action_url: '/admin?tab=health',
    metadata: { overallStatus: health.overallStatus, checkedAt: health.checkedAt, databaseLatencyMs: health.services.database.latencyMs, backendProcessingMs: health.metrics.backendProcessingMs }
  }));
  const { error } = await supabase.from('zoal_notifications').insert(rows);
  if (error) console.error('[Health Monitor] Alert notification insert failed:', error.message);
}

let monitorRunning = false;
export async function runAutonomousHealthCheck() {
  if (monitorRunning) return;
  monitorRunning = true;
  try {
    const health = await collectSystemHealth();
    const supabase = getServiceSupabaseClient();
    if (!supabase) return;
    const { data: result, error } = await supabase.rpc('record_health_observation', {
      p_checked_at: health.checkedAt,
      p_overall_status: health.overallStatus,
      p_database_status: health.services.database.status,
      p_database_latency_ms: health.services.database.latencyMs ?? null,
      p_backend_status: health.services.backend.status,
      p_backend_processing_ms: health.metrics.backendProcessingMs,
      p_runtime_status: health.services.runtime.status,
      p_rss_mb: health.metrics.rssMb,
      p_heap_used_mb: health.metrics.heapUsedMb,
      p_heap_total_mb: health.metrics.heapTotalMb,
      p_error_message: health.services.database.error ?? null
    });
    if (error) {
      console.warn('[Health Monitor] Persistence unavailable; migration 053 may not be applied.');
      return;
    }
    if (result?.should_alert) await emitHealthAlert(health);
  } catch (error) {
    console.error('[Health Monitor] Autonomous check failed:', error);
  } finally {
    monitorRunning = false;
  }
}

const globalMonitor = globalThis as typeof globalThis & { __zoalHealthMonitorStarted?: boolean };
if (!globalMonitor.__zoalHealthMonitorStarted) {
  globalMonitor.__zoalHealthMonitorStarted = true;
  setTimeout(() => void runAutonomousHealthCheck(), 10_000);
  setInterval(() => void runAutonomousHealthCheck(), MONITOR_INTERVAL_MS);
}
