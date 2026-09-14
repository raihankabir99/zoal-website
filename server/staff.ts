import { Request, Response } from 'express';
import crypto from 'crypto';
import { getServiceSupabaseClient, getSupabaseClient } from './supabase';

const getClient = () => getServiceSupabaseClient() || getSupabaseClient();
const VALID_DUTY_STATUSES = new Set(['active', 'break', 'offline']);

export async function getDutyStatus(req: any, res: Response) {
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

export async function updateDutyStatus(req: any, res: Response) {
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

export async function getStaffLogs(req: any, res: Response) {
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

export async function createStaffLog(req: any, res: Response) {
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

/**
 * GET /api/staff
 * Retrieves the staff roster for the dashboard.
 */
export async function getStaffRoster(req: Request, res: Response) {
  try {
    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database unavailable' });

    const { data: staff, error } = await client
      .from('zoal_staff_details')
      .select(`
        *,
        zoal_activity_logs (
          action,
          timestamp
        )
      `)
      .order('duty_status', { ascending: true });

    if (error) throw error;

    return res.json({ success: true, staff: staff || [] });
  } catch (err: any) {
    console.error('[getStaffRoster] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve staff roster.' });
  }
}

/**
 * PUT /api/staff
 * Authoritatively updates order status and handles inventory lifecycle (release on cancel).
 */
export async function updateStaffOrder(req: Request, res: Response) {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing orderId or status.' });
    }

    const client = getClient();
    if (!client) return res.status(503).json({ error: 'Database unavailable' });

    // 1. Fetch current order state to check for status transitions
    const { data: order, error: fetchErr } = await client
      .from('zoal_orders')
      .select('status, payment_status')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const oldStatus = (order.status || '').toLowerCase();
    const newStatus = status.toLowerCase();

    // 2. Perform the update
    const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
    
    // Auto-update payment status for certain transitions
    if (newStatus === 'delivered' && order.payment_status === 'unpaid') {
      updateData.payment_status = 'paid';
    }

    const { error: updateErr } = await client
      .from('zoal_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateErr) throw updateErr;

    // 3. INVENTORY-SAFE CANCELLATION/REFUND LIFECYCLE
    // If transitioning TO cancelled/refunded/returned from a state that likely had reserved stock
    const isReleasing = ['cancelled', 'refunded', 'returned'].includes(newStatus);
    const wasActive = !['cancelled', 'refunded', 'returned', 'failed'].includes(oldStatus);

    if (isReleasing && wasActive) {
      console.log(`[Inventory] Releasing reserved stock for order ${orderId} (Status: ${oldStatus} -> ${newStatus})`);
      
      const { data: items } = await client
        .from('zoal_order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (items && items.length > 0) {
        for (const item of items) {
          // Atomic release using GREATEST to prevent negative reserved_quantity
          // Note: In Supabase client we can't easily do "SET x = GREATEST(0, x - n)" 
          // without an RPC. We'll use a fetch-and-update with a small race window, 
          // but since this is an admin action, concurrency is lower than checkout.
          // Ideally, we'd call an RPC.
          
          const { data: inv } = await client
            .from('zoal_inventory')
            .select('reserved_quantity')
            .eq('product_id', item.product_id)
            .maybeSingle();
            
          if (inv) {
            const currentReserved = Number(inv.reserved_quantity || 0);
            const newReserved = Math.max(0, currentReserved - Number(item.quantity || 0));
            
            await client
              .from('zoal_inventory')
              .update({ reserved_quantity: newReserved, updated_at: new Date().toISOString() })
              .eq('product_id', item.product_id);
          }
        }
      }
    }

    return res.json({ success: true, message: `Order ${orderId} updated to ${newStatus}.` });
  } catch (err: any) {
    console.error('[updateStaffOrder] Error:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}
