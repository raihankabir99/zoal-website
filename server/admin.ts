import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import crypto from 'crypto';
import { ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../backend/security';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

/**
 * GET /api/admin/rbac-matrix
 * Fetches the authoritative RBAC matrix from backend/security.ts
 */
export async function getRbacMatrix(req: Request, res: Response) {
  return res.json({
    hierarchy: ROLE_HIERARCHY,
    permissions: ROLE_PERMISSIONS
  });
}

/**
 * Audit Logging Helper
 */
async function logAdminAction(actor: any, action: string, ip: string, userAgent: string, targetId?: string) {
  const supabase = getClient();
  if (!supabase) return;
  try {
    await supabase.from('zoal_activity_logs').insert({
      id: crypto.randomUUID(),
      user_id: actor.id,
      email: actor.email,
      action: targetId ? `${action} (Target: ${targetId})` : action,
      ip: ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error logging admin action:', err);
  }
}

/**
 * GET /api/admin/roster
 * Fetches all privileged users (staff, manager, admin, owner).
 */
export async function getAdminRoster(req: Request, res: Response) {
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
      lastActive: new Date().toISOString() // Placeholder, ideally from zoal_sessions or activity_logs
    }));

    return res.json(roster);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/roster/:id
 * Updates admin role.
 */
export async function updateAdminRole(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { id } = req.params;
  const { role } = req.body;
  const actor = (req as any).user;

  if (!['staff', 'manager', 'admin', 'owner'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  // Prevent role escalation: cannot grant a role higher than your own
  const actorLevel = ROLE_HIERARCHY[actor.role] || 0;
  const targetLevel = ROLE_HIERARCHY[role] || 0;
  if (targetLevel > actorLevel && actor.role !== 'owner') {
    return res.status(403).json({ error: 'Cannot escalate role above your own level' });
  }

  try {
    const { error } = await supabase
      .from('zoal_users')
      .update({ role })
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(actor, `UPDATE_ROLE: ${role}`, req.ip || '', req.headers['user-agent'] || '', id);

    return res.json({ success: true, message: 'Role updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/roster/:id
 * Revokes admin access by downgrading to customer or deactivating.
 */
export async function revokeAdminAccess(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { id } = req.params;
  const actor = (req as any).user;

  if (id === actor.id) {
    return res.status(400).json({ error: 'Cannot revoke your own access' });
  }

  try {
    // Check target role first
    const { data: target } = await supabase.from('zoal_users').select('role').eq('id', id).single();
    if (target?.role === 'owner' && actor.role !== 'owner') {
      return res.status(403).json({ error: 'Only an owner can revoke another owner' });
    }

    const { error } = await supabase
      .from('zoal_users')
      .update({ role: 'customer' }) // Downgrade to customer instead of hard delete
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(actor, 'REVOKE_ACCESS', req.ip || '', req.headers['user-agent'] || '', id);

    return res.json({ success: true, message: 'Admin access revoked' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/audit-logs
 * Fetches canonical activity logs.
 */
export async function getAuditLogs(req: Request, res: Response) {
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

/**
 * GET /api/admin/active-sessions
 * Fetches real sessions from zoal_sessions.
 */
export async function getActiveSessions(req: Request, res: Response) {
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
      user: `${s.zoal_users.first_name} ${s.zoal_users.last_name}`.trim(),
      email: s.zoal_users.email,
      role: s.zoal_users.role,
      ip: 'N/A', // zoal_sessions doesn't track IP yet
      device: 'Browser',
      lastActive: s.expires_at, // approximation
      isCurrent: false // will be checked client side
    }));

    return res.json(mapped);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/sessions/:token
 * Revokes a specific session.
 */
export async function revokeSession(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { token } = req.params;
  const actor = (req as any).user;

  try {
    const { error } = await supabase
      .from('zoal_sessions')
      .delete()
      .eq('token', token);

    if (error) throw error;

    await logAdminAction(actor, 'REVOKE_SESSION', req.ip || '', req.headers['user-agent'] || '', token);

    return res.json({ success: true, message: 'Session revoked' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
