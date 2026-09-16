import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import crypto from 'crypto';
import { Request } from 'express';

export interface AuditEventParams {
  actor?: { id?: string; email?: string; role?: string } | null;
  userId?: string;
  email?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  changedFields?: string[];
  metadata?: Record<string, any>;
  result?: 'SUCCESS' | 'FAILED' | 'DENIED' | string;
  severity?: 'INFO' | 'WARN' | 'CRITICAL' | string;
  requestId?: string;
  correlationId?: string;
  source?: string;
  ip?: string;
  userAgent?: string;
  req?: Request;
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /password_hash/i,
  /passwordhash/i,
  /secret/i,
  /token/i,
  /cookie/i,
  /authorization/i,
  /api[_-]?key/i,
  /card[_-]?number/i,
  /cvv/i,
  /private[_-]?key/i,
  /service[_-]?role/i,
  /verification[_-]?code/i,
  /reset[_-]?code/i
];

/**
 * Recursively sanitize state and metadata objects to prevent leaking secrets into audit logs.
 */
export function sanitizeAuditData(data: any, depth = 0): any {
  if (data === null || data === undefined) return data;
  if (depth > 4) return '[MAX_DEPTH]';

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.slice(0, 50).map(item => sanitizeAuditData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Calculates changed field names between before and after states.
 */
function computeChangedFields(before: any, after: any): string[] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return [];
  }
  const changed = new Set<string>();
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.add(key);
    }
  }
  return Array.from(changed);
}

/**
 * Centralized, authoritative server-side audit logger.
 * Writes immutable, structured audit records directly into zoal_activity_logs.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = getServiceSupabaseClient() || getSupabaseClient();
    if (!supabase) {
      console.warn('⚠️ Audit logger: Supabase client unavailable for activity log write.');
      return;
    }

    const req = params.req;
    const reqActor = (req as any)?.user;

    const actorId = params.actor?.id || reqActor?.id || params.userId || 'system';
    const actorEmail = params.actor?.email || reqActor?.email || params.email || 'system@alzoal.com';
    const ip = params.ip || (req ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || req.ip : '127.0.0.1') || '127.0.0.1';
    const userAgent = params.userAgent || (req ? (req.headers['user-agent'] as string) : 'ZOAL-Authoritative-Server') || 'ZOAL-Authoritative-Server';

    const cleanBefore = params.beforeState ? sanitizeAuditData(params.beforeState) : null;
    const cleanAfter = params.afterState ? sanitizeAuditData(params.afterState) : null;
    const cleanMeta = params.metadata ? sanitizeAuditData(params.metadata) : {};

    const changedFields = params.changedFields && params.changedFields.length > 0
      ? params.changedFields
      : (cleanBefore && cleanAfter ? computeChangedFields(cleanBefore, cleanAfter) : null);

    const logRecord = {
      id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      user_id: actorId,
      email: actorEmail,
      action: params.action,
      timestamp: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      before_state: cleanBefore,
      after_state: cleanAfter,
      changed_fields: changedFields,
      metadata: cleanMeta,
      result: params.result || 'SUCCESS',
      severity: params.severity || 'INFO',
      request_id: params.requestId || (req ? (req.headers['x-request-id'] as string) : null) || null,
      correlation_id: params.correlationId || null,
      source: params.source || 'server'
    };

    const { error } = await supabase
      .from('zoal_activity_logs')
      .insert(logRecord);

    if (error) {
      console.error('❌ Failed to insert audit log record into zoal_activity_logs:', error.message);
    }
  } catch (err: any) {
    console.error('❌ Exception during audit log recording:', err?.message || err);
  }
}

/**
 * Backward compatibility wrapper for legacy logActivityAsync callers.
 */
export async function logActivityAsync(
  userId: string,
  email: string,
  action: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    userId,
    email,
    action,
    ip: ip || '127.0.0.1',
    userAgent: userAgent || 'ZOAL-Authoritative-Server',
    source: 'legacy_bridge'
  });
}
