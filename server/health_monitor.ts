import { Request, Response } from 'express';
import { getSupabaseClient } from '../backend/supabase.ts';

type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

interface ServiceHealth {
  status: HealthStatus;
  latencyMs?: number;
  error?: string;
  monitored: boolean;
}

const DB_DEGRADED_LATENCY_MS = 500;
const API_DEGRADED_LATENCY_MS = 500;
const MEMORY_DEGRADED_MB = 1024;

function toMb(bytes: number) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function aggregateStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('UNHEALTHY')) return 'UNHEALTHY';
  if (statuses.includes('UNKNOWN')) return 'UNKNOWN';
  if (statuses.includes('DEGRADED')) return 'DEGRADED';
  return 'HEALTHY';
}

export async function getHealthMetrics(req: Request, res: Response) {
  const memory = process.memoryUsage();
  res.json({
    status: 'HEALTHY',
    checkedAt: new Date().toISOString(),
    runtime: {
      processUptimeSeconds: Math.floor(process.uptime()),
      rssMb: toMb(memory.rss),
      heapUsedMb: toMb(memory.heapUsed),
      heapTotalMb: toMb(memory.heapTotal)
    }
  });
}

export async function getSystemHealth(req: Request, res: Response) {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const supabase = getSupabaseClient();

  let database: ServiceHealth = {
    status: 'UNKNOWN',
    monitored: true
  };

  if (!supabase) {
    database = {
      status: 'UNKNOWN',
      monitored: true,
      error: 'Database monitoring is not configured'
    };
  } else {
    const dbStartedAt = Date.now();
    try {
      // Lightweight existence probe: requests at most one row and avoids exact counts/scans.
      const { error } = await supabase
        .from('zoal_products')
        .select('id', { head: true })
        .limit(1);

      const latencyMs = Date.now() - dbStartedAt;

      if (error) {
        database = {
          status: 'UNHEALTHY',
          monitored: true,
          latencyMs,
          error: 'Database health check failed'
        };
      } else {
        database = {
          status: latencyMs > DB_DEGRADED_LATENCY_MS ? 'DEGRADED' : 'HEALTHY',
          monitored: true,
          latencyMs
        };
      }
    } catch {
      database = {
        status: 'UNHEALTHY',
        monitored: true,
        latencyMs: Date.now() - dbStartedAt,
        error: 'Database health check failed'
      };
    }
  }

  const memory = process.memoryUsage();
  const rssMb = toMb(memory.rss);
  const runtimeStatus: HealthStatus =
    rssMb > MEMORY_DEGRADED_MB ? 'DEGRADED' : 'HEALTHY';

  const processingMs = Date.now() - startedAt;
  const backend: ServiceHealth = {
    status: processingMs > API_DEGRADED_LATENCY_MS ? 'DEGRADED' : 'HEALTHY',
    monitored: true,
    latencyMs: processingMs
  };

  const runtime: ServiceHealth = {
    status: runtimeStatus,
    monitored: true
  };

  // Storage/Auth are intentionally not reported as healthy without independent probes.
  const storage: ServiceHealth = { status: 'UNKNOWN', monitored: false };
  const authentication: ServiceHealth = { status: 'UNKNOWN', monitored: false };

  const overallStatus = aggregateStatus([
    database.status,
    backend.status,
    runtime.status
  ]);

  res.json({
    overallStatus,
    checkedAt,
    services: {
      database,
      backend,
      runtime,
      storage,
      authentication
    },
    metrics: {
      backendProcessingMs: processingMs,
      processUptimeSeconds: Math.floor(process.uptime()),
      rssMb,
      heapUsedMb: toMb(memory.heapUsed),
      heapTotalMb: toMb(memory.heapTotal)
    }
  });
}
