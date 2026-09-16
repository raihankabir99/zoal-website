import { getServiceSupabaseClient } from '../backend/supabase.ts';
import { syncSupabaseUser } from '../backend/security.ts';

type VercelRequest = any;
type VercelResponse = any;

function send(res: VercelResponse, status: number, body: any) {
  return res.status(status).json(body);
}

async function getUser(req: VercelRequest) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!String(header).startsWith('Bearer ')) return null;
  const token = String(header).slice(7).trim();
  if (!token) return null;

  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return syncSupabaseUser(data.user);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });

    const user = await getUser(req);
    if (!user) return send(res, 401, { error: 'Authentication required.' });

    const supabase = getServiceSupabaseClient();
    if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });

    const limitRaw = Number(req.query?.limit || 100);
    const pageRaw = Number(req.query?.page || 1);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 100, 1), 100);
    const page = Math.max(Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1, 1);
    const offset = (page - 1) * limit;

    const { data: orders, error: ordersError, count } = await supabase
      .from('zoal_orders')
      .select('*', { count: 'exact' })
      .eq('customer_id', String(user.id))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ordersError) return send(res, 500, { error: ordersError.message });

    const orderRows = orders || [];
    const orderIds = orderRows.map((order: any) => String(order.id));
    const itemsByOrder = new Map<string, any[]>();

    if (orderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('zoal_order_items')
        .select('id,order_id,product_id,quantity,unit_price,total_price')
        .in('order_id', orderIds);

      if (itemsError) return send(res, 500, { error: itemsError.message });

      for (const item of items || []) {
        const key = String(item.order_id);
        const list = itemsByOrder.get(key) || [];
        list.push(item);
        itemsByOrder.set(key, list);
      }
    }

    const customerOrders = orderRows.map((order: any) => ({
      ...order,
      items: itemsByOrder.get(String(order.id)) || [],
    }));

    return send(res, 200, {
      success: true,
      orders: customerOrders,
      pagination: {
        page,
        limit,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Customer orders API error:', error);
    return send(res, 500, { error: error?.message || 'Failed to load customer orders.' });
  }
}
