import { Request, Response, NextFunction } from 'express';
import performance from 'perf_hooks';

export interface TelemetryEvent {
  timestamp: string;
  type: 'http' | 'db' | 'storage' | 'error' | 'system';
  name: string;
  durationMs?: number;
  status?: number | string;
  metadata?: Record<string, any>;
  requestId?: string;
  correlationId?: string;
}

class EnterpriseTelemetry {
  private events: TelemetryEvent[] = [];
  private maxEvents = 1000;
  private metrics = {
    totalRequests: 0,
    errorCount: 0,
    slowRequests: 0,
    totalLatencyMs: 0,
    dbLatencyMs: 0,
    dbQueriesCount: 0,
    storageOpsCount: 0,
    storageLatencyMs: 0,
  };

  public recordEvent(event: Omit<TelemetryEvent, 'timestamp'>) {
    const fullEvent: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    if (event.type === 'http' && event.durationMs !== undefined) {
      this.metrics.totalRequests++;
      this.metrics.totalLatencyMs += event.durationMs;
      if (typeof event.status === 'number' && event.status >= 400) {
        this.metrics.errorCount++;
      }
      if (event.durationMs > 500) {
        this.metrics.slowRequests++;
      }
    } else if (event.type === 'db' && event.durationMs !== undefined) {
      this.metrics.dbQueriesCount++;
      this.metrics.dbLatencyMs += event.durationMs;
    } else if (event.type === 'storage' && event.durationMs !== undefined) {
      this.metrics.storageOpsCount++;
      this.metrics.storageLatencyMs += event.durationMs;
    } else if (event.type === 'error') {
      this.metrics.errorCount++;
    }
  }

  public getMetrics() {
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    return {
      uptimeSeconds: process.uptime(),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100,
        externalMb: Math.round(mem.external / 1024 / 1024 * 100) / 100,
      },
      cpu: {
        userMicros: cpu.user,
        systemMicros: cpu.system,
      },
      http: {
        totalRequests: this.metrics.totalRequests,
        errorCount: this.metrics.errorCount,
        slowRequests: this.metrics.slowRequests,
        avgLatencyMs: this.metrics.totalRequests ? Math.round(this.metrics.totalLatencyMs / this.metrics.totalRequests * 100) / 100 : 0,
      },
      db: {
        queriesCount: this.metrics.dbQueriesCount,
        avgLatencyMs: this.metrics.dbQueriesCount ? Math.round(this.metrics.dbLatencyMs / this.metrics.dbQueriesCount * 100) / 100 : 0,
      },
      storage: {
        opsCount: this.metrics.storageOpsCount,
        avgLatencyMs: this.metrics.storageOpsCount ? Math.round(this.metrics.storageLatencyMs / this.metrics.storageOpsCount * 100) / 100 : 0,
      },
      recentEventsCount: this.events.length,
    };
  }

  public getRecentEvents(limit: number = 50) {
    return this.events.slice(-limit);
  }
}

export const telemetry = new EnterpriseTelemetry();

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = performance.performance.now();
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const correlationId = (req.headers['x-correlation-id'] as string) || requestId;

  req.headers['x-request-id'] = requestId;
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  res.on('finish', () => {
    const durationMs = Math.round((performance.performance.now() - start) * 100) / 100;
    telemetry.recordEvent({
      type: 'http',
      name: `${req.method} ${req.baseUrl}${req.path}`,
      durationMs,
      status: res.statusCode,
      requestId,
      correlationId,
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });
  });

  next();
}
