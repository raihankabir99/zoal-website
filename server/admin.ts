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

    const mapped = (sessions || []).map((s: any) => {
      // Use standard SHA-256 to hash the token into a secure opaque ID
      const opaqueId = crypto.createHash('sha256').update(s.token).digest('hex');
      return {
        id: opaqueId,
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

/**
 * DELETE /api/admin/sessions/:token
 * Revokes a specific session.
 */
export async function revokeSession(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const { token: sessionId } = req.params; // It's passed as the opaque sessionId hash
  const actor = (req as any).user;

  try {
    // Retrieve active sessions to match the hashed token safely on the server
    const { data: sessions, error: fetchErr } = await supabase
      .from('zoal_sessions')
      .select('token');

    if (fetchErr) throw fetchErr;

    const targetSession = (sessions || []).find(
      (s: any) => crypto.createHash('sha256').update(s.token).digest('hex') === sessionId
    );

    if (!targetSession) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found or already revoked.' });
    }

    const { error: deleteErr } = await supabase
      .from('zoal_sessions')
      .delete()
      .eq('token', targetSession.token);

    if (deleteErr) throw deleteErr;

    // Never log or print the raw token - log the masked sessionId hash instead
    const maskedToken = sessionId.substring(0, 10) + '...';
    await logAdminAction(actor, 'REVOKE_SESSION', req.ip || '', req.headers['user-agent'] || '', maskedToken);

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
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Database unavailable' });

  const actor = (req as any).user;
  if (!actor) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }

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
  const allowedAdminRoles = ['staff', 'editor', 'manager', 'admin', 'owner'];
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
