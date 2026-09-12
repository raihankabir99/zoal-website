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
    let logQuery = client.from('zoal_activity_logs')
      .select('id,user_id,action,timestamp,resource_type,resource_id,result,severity,source')
      .eq('resource_type', 'staff')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (req.user?.role === 'staff') logQuery = logQuery.eq('user_id', req.user.id);
    const { data: logs, error } = await logQuery;
    if (error) return res.status(500).json({ error: 'Failed to load staff logs' });
    const { count: staffMemberCount } = await client.from('zoal_users').select('id', { count: 'exact', head: true }).in('role', ['staff','manager','admin','owner']);
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


export async function getStaffRoster(req: Request, res: Response) {
  try {
    const client = getClient();
    if (!client || !req.user?.id) return res.status(503).json({ error: 'Staff data service unavailable' });
    const { data, error } = await client
      .from('zoal_users')
      .select('id, first_name, last_name, email, role')
      .in('role', ['staff', 'manager', 'admin', 'owner'])
      .order('first_name', { ascending: true });
    if (error) return res.status(500).json({ error: 'Failed to load staff roster' });
    return res.json({ success: true, data: data || [] });
  } catch {
    return res.status(500).json({ error: 'Failed to load staff roster' });
  }
}

export async function updateStaffOrder(req: Request, res: Response) {
  try {
    const client = getClient();
    if (!client || !req.user?.id) return res.status(503).json({ error: 'Staff data service unavailable' });
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const statusMap: Record<string,string> = {
      pending:'pending', Pending:'pending',
      confirmed:'processing', Confirmed:'processing',
      processing:'processing', Processing:'processing', Preparing:'processing',
      packed:'processing', Packed:'processing',
      'ready for shipping':'processing', 'Ready for Shipping':'processing',
      shipped:'shipped', Shipped:'shipped',
      'out for delivery':'shipped', 'Out for Delivery':'shipped',
      delivered:'delivered', Delivered:'delivered', Completed:'delivered',
      cancelled:'cancelled', Cancelled:'cancelled',
      refunded:'refunded', 'Refund Completed':'refunded',
      'partially refunded':'partially_refunded', 'Partially Refunded':'partially_refunded',
      failed:'failed', Failed:'failed'
    };
    const updateFields: Record<string, any> = {};
    if (typeof req.body?.status === 'string' && req.body.status.trim()) {
      const normalized = statusMap[req.body.status.trim()] || statusMap[req.body.status.trim().toLowerCase()];
      if (!normalized) return res.status(400).json({ error: 'Invalid status value.' });
      updateFields.status = normalized;
      if (normalized === 'delivered') updateFields.payment_status = 'paid';
      if (normalized === 'refunded') updateFields.payment_status = 'refunded';
    }
    if (typeof req.body?.trackingNumber === 'string') updateFields.tracking_number = req.body.trackingNumber.trim() || null;
    if (typeof req.body?.assignedStaffId === 'string') {
      const id = req.body.assignedStaffId.trim();
      const { data: staff, error } = await client.from('zoal_users').select('id,first_name,last_name,email,role').eq('id',id).in('role',['staff','manager','admin','owner']).maybeSingle();
      if (error) return res.status(500).json({ error: 'Failed to validate assigned staff member' });
      if (!staff) return res.status(400).json({ error: 'Assigned staff member not found or not authorized.' });
      updateFields.assigned_staff_id = staff.id;
      updateFields.assigned_staff_name = [staff.first_name,staff.last_name].filter(Boolean).join(' ') || staff.email;
    }
    for (const field of ['adminNotes','staffNotes','customerNotes'] as const) {
      if (typeof req.body?.[field] === 'string') updateFields[field.replace(/[A-Z]/g, m => '_' + m.toLowerCase())] = req.body[field];
    }
    if (!Object.keys(updateFields).length) return res.status(400).json({ error: 'No mutable order fields supplied.' });
    updateFields.updated_at = new Date().toISOString();
    const { data, error } = await client.from('zoal_orders').update(updateFields).eq('id',orderId).select().single();
    if (error) return res.status(500).json({ error: 'Failed to update order' });
    await client.from('zoal_activity_logs').insert({
      id: crypto.randomUUID(), user_id:req.user.id, email:req.user.email,
      action:'Staff order update', timestamp:new Date().toISOString(),
      resource_type:'order', resource_id:orderId, result:'success', severity:'info',
      source:'staff-dashboard', metadata:{ fields:Object.keys(updateFields).filter(k=>k!=='updated_at') }
    });
    return res.json({ success:true, data });
  } catch {
    return res.status(500).json({ error: 'Failed to update staff order' });
  }
}
