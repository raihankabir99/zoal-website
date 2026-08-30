import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../backend/security';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

/**
 * Defense-in-depth authorization for Security Center APIs.
 * These handlers use the service-role client, so route-level auth must never be
 * the only protection. Every handler verifies the server-derived actor here.
 */
function requireSecurityAdmin(req: Request, res: Response) {
  const actor = (req as any).user;
  if (!actor?.id || !actor?.role) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  if (!['owner', 'admin'].includes(actor.role)) {
    res.status(403).json({ error: 'Security Center access requires owner or admin role' });
    return null;
  }

  return actor;
}

/**
 * GET /api/admin/rbac-matrix
 * Fetches the authoritative RBAC matrix from backend/security.ts.
 */
export async function getRbacMatrix(req: Request, res: Response) {
  if (!requireSecurityAdmin(req, res)) return;
  return res.json({
    hierarchy: ROLE_HIERARCHY,
    permissions: ROLE_PERMISSIONS
  });
}

/** Audit Logging Helper */
async function logAdminAction(actor: any, action: string, ip: string, userAgent: string, targetId?: string) {
  const supabase = getClient();
  if (!supabase) return;
  try {
    await supabase.from('zoal_activity_logs').insert({
      id: crypto.randomUUID(),
      user_id: actor.id,
      email: actor.email,
      action: targetId ? `${action} (Target: ${targetId})` : action,
      ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
}

/** GET /api/admin/roster */
export async function getAdminRoster(req: Request, res: Response) {
  if (!requireSecurityAdmin(req, res)) return;
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  try {
    const { data: users, error } = await supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, role, is_verified, created_at')
      .in('role', ['staff', 'manager', 'admin', 'owner'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    const roster = (users || []).map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`.trim() || u.email,
      email: u.email,
      role: u.role,
      status: u.is_verified ? 'Active' : 'Pending',
      joinedAt: u.created_at,
      lastActive: null
    }));

    return res.json(roster);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/** PATCH /api/admin/roster/:id */
export async function updateAdminRole(req: Request, res: Response) {
  const actor = requireSecurityAdmin(req, res);
  if (!actor) return;

  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { id } = req.params;
  const { role } = req.body;

  if (!['staff', 'manager', 'admin', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (id === actor.id) {
    return res.status(400).json({ error: 'Cannot change your own administrative role' });
  }

  try {
    const { data: target, error: targetError } = await supabase
      .from('zoal_users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) return res.status(404).json({ error: 'Target administrator not found' });

    if (target.role === 'owner' && actor.role !== 'owner') {
      return res.status(403).json({ error: 'Only an owner can modify another owner' });
    }
    if (role === 'owner' && actor.role !== 'owner') {
      return res.status(403).json({ error: 'Only an owner can grant owner role' });
    }

    const actorLevel = ROLE_HIERARCHY[actor.role] || 0;
    const targetLevel = ROLE_HIERARCHY[role] || 0;
    if (targetLevel > actorLevel) {
      return res.status(403).json({ error: 'Cannot grant a role above your own level' });
    }

    const { error } = await supabase.from('zoal_users').update({ role }).eq('id', id);
    if (error) throw error;

    await logAdminAction(actor, `UPDATE_ROLE: ${role}`, req.ip || '', req.headers['user-agent'] || '', id);
    return res.json({ success: true, message: 'Role updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/admin/roster/:id */
export async function revokeAdminAccess(req: Request, res: Response) {
  const actor = requireSecurityAdmin(req, res);
  if (!actor) return;

  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { id } = req.params;
  if (id === actor.id) return res.status(400).json({ error: 'Cannot revoke your own access' });

  try {
    const { data: target, error: targetError } = await supabase
      .from('zoal_users')
      .select('id, role')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return res.status(404).json({ error: 'Target administrator not found' });

    if (target.role === 'owner' && actor.role !== 'owner') {
      return res.status(403).json({ error: 'Only an owner can revoke another owner' });
    }

    const { error } = await supabase
      .from('zoal_users')
      .update({ role: 'customer' })
      .eq('id', id);
    if (error) throw error;

    await logAdminAction(actor, 'REVOKE_ACCESS', req.ip || '', req.headers['user-agent'] || '', id);
    return res.json({ success: true, message: 'Admin access revoked' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/admin/audit-logs */
export async function getAuditLogs(req: Request, res: Response) {
  if (!requireSecurityAdmin(req, res)) return;
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  try {
    const { data: logs, error } = await supabase
      .from('zoal_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(200);
    if (error) throw error;
    return res.json(logs || []);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/** GET /api/admin/active-sessions */
export async function getActiveSessions(req: Request, res: Response) {
  if (!requireSecurityAdmin(req, res)) return;
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  try {
    const { data: sessions, error } = await supabase
      .from('zoal_sessions')
      .select('*, zoal_users(first_name, last_name, email, role)')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });
    if (error) throw error;

    const mapped = (sessions || []).map((s: any) => ({
      id: s.token,
      user: `${s.zoal_users?.first_name || ''} ${s.zoal_users?.last_name || ''}`.trim() || s.zoal_users?.email,
      email: s.zoal_users?.email,
      role: s.zoal_users?.role,
      ip: 'N/A',
      device: 'Browser',
      lastActive: null,
      isCurrent: false
    }));

    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/** DELETE /api/admin/sessions/:token */
export async function revokeSession(req: Request, res: Response) {
  const actor = requireSecurityAdmin(req, res);
  if (!actor) return;

  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { token } = req.params;
  if (!token || token.length < 16 || token.length > 512) {
    return res.status(400).json({ error: 'Invalid session identifier' });
  }

  try {
    const { data: session, error: lookupError } = await supabase
      .from('zoal_sessions')
      .select('token, user_id')
      .eq('token', token)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { error } = await supabase.from('zoal_sessions').delete().eq('token', token);
    if (error) throw error;

    // Do not place the raw session token in the audit ledger.
    await logAdminAction(actor, 'REVOKE_SESSION', req.ip || '', req.headers['user-agent'] || '', session.user_id);
    return res.json({ success: true, message: 'Session revoked' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}