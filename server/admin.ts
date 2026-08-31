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
      .select('opaque_session_id, expires_at, zoal_users(first_name, last_name, email, role)')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });
    if (error) throw error;

    const mapped = (sessions || []).map((s: any) => {
      return {
        id: s.opaque_session_id,
        user: `${s.zoal_users?.first_name || ''} ${s.zoal_users?.last_name || ''}`.trim() || s.zoal_users?.email || 'Unknown',
        email: s.zoal_users?.email || 'N/A',
        role: s.zoal_users?.role || 'customer',
        ip: 'N/A', // zoal_sessions doesn't track IP yet
        device: 'Browser',
        lastActive: s.expires_at, // approximation
        isCurrent: false // will be checked client side
      };
    });

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

  const { token: sessionId } = req.params;
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid session identifier structure' });
  }

  try {
    // 1. Retrieve sessions directly by its secure opaque_session_id to prevent any raw token exposure
    const { data: targetSession, error: fetchErr } = await supabase
      .from('zoal_sessions')
      .select('opaque_session_id, user_id, zoal_users(role)')
      .eq('opaque_session_id', sessionId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!targetSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const targetUserRole = (targetSession.zoal_users as any)?.role || 'customer';

    // 2. Prevent IDOR / Hierarchy Violation
    const actorLevel = ROLE_HIERARCHY[actor.role] || 0;
    const targetLevel = ROLE_HIERARCHY[targetUserRole] || 0;
    
    if (targetLevel > actorLevel && actor.role !== 'owner') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot revoke session of a higher-privileged user.' });
    }

    if (targetUserRole === 'owner' && actor.role !== 'owner') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only an owner can revoke an owner\'s session.' });
    }

    // 3. Delete the session directly by its opaque_session_id
    const { error: deleteError } = await supabase
      .from('zoal_sessions')
      .delete()
      .eq('opaque_session_id', sessionId);

    if (deleteError) throw deleteError;

    // 4. Log the action securely using only the opaque session ID hash/mask
    const maskedLogToken = sessionId.substring(0, 10) + '...';
    await logAdminAction(actor, 'REVOKE_SESSION', req.ip || '', req.headers['user-agent'] || '', maskedLogToken);

    return res.json({ success: true, message: 'Session revoked' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/invite
 * Invites a new administrator.
 */
export async function inviteAdmin(req: Request, res: Response) {
  const actor = requireSecurityAdmin(req, res);
  if (!actor) return;

  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { name, email, role } = req.body;

  // 1. Strict Name Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 100) {
    return res.status(400).json({ error: 'INVALID_NAME', message: 'Name is required (max 100 characters).' });
  }

  // 2. Strict Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'INVALID_EMAIL', message: 'A valid email address is required.' });
  }
  const cleanEmail = email.trim().toLowerCase();

  // 3. Strict Role Validation
  const allowedAdminRoles = ['staff', 'manager', 'admin', 'owner'];
  if (!role || !allowedAdminRoles.includes(role)) {
    return res.status(400).json({ error: 'INVALID_ROLE', message: 'A valid privileged administrative role is required.' });
  }

  // 4. Prevent invalid privilege escalation
  const actorLevel = ROLE_HIERARCHY[actor.role] || 0;
  const targetLevel = ROLE_HIERARCHY[role] || 0;
  if (targetLevel > actorLevel && actor.role !== 'owner') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot escalate role above your own level.' });
  }

  if (role === 'owner' && actor.role !== 'owner') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Only an owner can invite another owner.' });
  }

  try {
    // 5. Prevent duplicate/inconsistent accounts
    const { data: existingUser } = await supabase
      .from('zoal_users')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'An account with this email address already exists.' });
    }

    // Split name
    const nameParts = name.trim().split(' ').filter(Boolean);
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const newUserId = crypto.randomUUID();
    const tempPasswordHash = crypto.randomBytes(32).toString('hex');
    const inviteToken = crypto.randomBytes(32).toString('hex');

    const { error: insertError } = await supabase
      .from('zoal_users')
      .insert({
        id: newUserId,
        first_name: firstName,
        last_name: lastName,
        email: cleanEmail,
        phone: 'N/A',
        password_hash: tempPasswordHash,
        role: role,
        is_verified: false,
        verification_code: inviteToken
      });

    if (insertError) throw insertError;

    // 6. Write authoritative audit event
    await logAdminAction(actor, `INVITE_ADMIN: ${role} (${cleanEmail})`, req.ip || '', req.headers['user-agent'] || '', newUserId);

    // 7. Return only safe response metadata
    return res.json({
      success: true,
      message: 'Admin invitation completed successfully.',
      invitee: {
        id: newUserId,
        email: cleanEmail,
        role: role
      }
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
