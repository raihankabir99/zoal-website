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

function mapInvoice(order: any, items: any[], transaction: any) {
  return {
    invoiceReference: String(order.id),
    invoiceNumber: null,
    invoiceDate: order.created_at || order.date || null,
    orderId: String(order.id),
    currency: String(order.currency || 'SAR').toUpperCase(),
    status: order.status || null,
    paymentStatus: order.payment_status || null,
    paymentMethod: order.payment_method || transaction?.payment_method || null,
    gatewayPaymentId: transaction?.gateway_payment_id || null,
    transactionId: transaction?.id || null,
    merchantVat: null,
    items: items.map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      name: item.zoal_products?.name || item.product_name || String(item.product_id),
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unit_price || 0),
      total: Number(item.total_price ?? Number(item.unit_price || 0) * Number(item.quantity || 0)),
    })),
    subtotal: Number(order.subtotal || 0),
    discount: Number(order.discount_amount || 0),
    shipping: Number(order.shipping_cost || 0),
    tax: Number(order.tax_amount || 0),
    total: Number(order.total_amount || 0),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
    const user = await getUser(req);
    if (!user) return send(res, 401, { error: 'Authentication required.' });

    const supabase = getServiceSupabaseClient();
    if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });

    const orderId = String(req.query?.orderId || '').trim();
    let orderQuery = supabase
      .from('zoal_orders')
      .select('*')
      .eq('customer_id', String(user.id))
      .order('created_at', { ascending: false });

    if (orderId) orderQuery = orderQuery.eq('id', orderId);

    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) return send(res, 500, { error: orderError.message });

    const invoices = [];
    for (const order of orders || []) {
      const [{ data: items, error: itemsError }, { data: transaction, error: txError }] = await Promise.all([
        supabase.from('zoal_order_items').select('id,order_id,product_id,quantity,unit_price,total_price,zoal_products(name)').eq('order_id', order.id),
        supabase.from('zoal_payment_transactions').select('*').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (itemsError) return send(res, 500, { error: itemsError.message });
      if (txError) return send(res, 500, { error: txError.message });
      invoices.push(mapInvoice(order, items || [], transaction || null));
    }

    return send(res, 200, { success: true, invoices });
  } catch (error: any) {
    console.error('Customer invoice API error:', error);
    return send(res, 500, { error: error?.message || 'Failed to load invoices.' });
  }
}