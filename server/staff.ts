import { Request, Response } from 'express';
import { getServiceSupabaseClient, getSupabaseClient } from './supabase';

const getClient = () => getServiceSupabaseClient() || getSupabaseClient();
const VALID_DUTY_STATUSES = new Set(['active', 'break', 'offline']);

export async function getDutyStatus(req: Request, res: Response) {
  try {
    const client = getClient();
    if (!client || !req.user?.id) return res.status(503).json({ error: 'Staff data service unavailable' });
    const { data, error } = await client.from('zoal_staff_details').select('duty_status').eq('user_id', req.user.id).maybeSingle();
    if (error) return res.status(500).json({ error: 'Failed to load staff duty status' });
    return res.json({ status: VALID_DUTY_STATUSES.has(String(data?.duty_status)) ? data.duty_status : 'offline' });
  } catch (error) {
    console.error('getDutyStatus error:', error);
    return res.status(500).json({ error: 'Failed to load staff duty status' });
  }
}

export async function updateDutyStatus(req: Request, res: Response) {
  try {
    const status = String(req.body?.status || '');
    if (!VALID_DUTY_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid duty status' });
    const client = getClient();
    if (!client || !req.user?.id) return res.status(503).json({ error: 'Staff data service unavailable' });
    const { data, error } = await client.from('zoal_staff_details').upsert({ user_id: req.user.id, duty_status: status }, { onConflict: 'user_id' }).select('duty_status').single();
    if (error) return res.status(500).json({ error: 'Failed to update staff duty status' });
    return res.json({ status: data?.duty_status });
  } catch (error) {
    console.error('updateDutyStatus error:', error);
    return res.status(500).json({ error: 'Failed to update staff duty status' });
  }
}

export async function getStaffLogs(req: Request, res: Response) {
  try {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Staff data service unavailable' });
    const { data: logs, error } = await client.from('zoal_activity_logs').select('id,user_id,email,action,timestamp,resource_type,resource_id,result,severity,source,metadata').eq('resource_type', 'staff').order('timestamp', { ascending: false }).limit(100);
    if (error) return res.status(500).json({ error: 'Failed to load staff logs' });
    const { count: staffMemberCount } = await client.from('zoal_staff_details').select('id', { count: 'exact', head: true });
    return res.json({ logs: logs || [], staffMemberCount: staffMemberCount ?? null });
  } catch (error) {
    console.error('getStaffLogs error:', error);
    return res.status(500).json({ error: 'Failed to load staff logs' });
  }
}

export async function createStaffLog(req: Request, res: Response) {
  try {
    const action = String(req.body?.action || '').trim();
    const target = String(req.body?.target || '').trim();
    if (!action) return res.status(400).json({ error: 'Action is required' });
    const client = getClient();
    if (!client || !req.user?.id) return res.status(503).json({ error: 'Staff data service unavailable' });
    const record = { id: crypto.randomUUID(), user_id: req.user.id, email: req.user.email || null, action, timestamp: new Date().toISOString(), resource_type: 'staff', resource_id: target || null, metadata: {}, severity: 'info', source: 'staff-dashboard', result: 'success' };
    const { data, error } = await client.from('zoal_activity_logs').insert(record).select('*').single();
    if (error) return res.status(500).json({ error: 'Failed to create staff log' });
    return res.status(201).json({ log: data });
  } catch (error) {
    console.error('createStaffLog error:', error);
    return res.status(500).json({ error: 'Failed to create staff log' });
  }
}
