import { getServiceSupabaseClient } from '../backend/supabase.ts';
import { syncSupabaseUser } from '../backend/security.ts';
import { getMoyasarPayment, refundMoyasarPayment } from '../server/moyasar.ts';

type VercelRequest = any;
type VercelResponse = any;

function send(res: VercelResponse, status: number, body: any) {
  return res.status(status).json(body);
}

function pathName(req: VercelRequest) {
  return String(req.url || '').split('?')[0].replace(/\/+$/, '') || '/api/payments';
}

async function getUser(req: VercelRequest) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const supabase = getServiceSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return syncSupabaseUser(data.user);
}

async function requireOrderAccess(req: VercelRequest, supabase: any, orderId: string) {
  const user = await getUser(req);
  if (!user) return { user: null, order: null, status: 401, error: 'Authentication required.' };
  const order = await getOrder(supabase, orderId);
  if (!order) return { user, order: null, status: 404, error: 'Order not found.' };
  const privileged = ['owner', 'admin', 'manager', 'staff'].includes(String(user.role));
  if (!privileged && String(order.customer_id) !== String(user.id)) {
    return { user, order: null, status: 403, error: 'Forbidden: order does not belong to the authenticated customer.' };
  }
  return { user, order, status: 200, error: null };
}

async function getOrder(supabase: any, orderId: string) {
  const { data, error } = await supabase.from('zoal_orders').select('*').eq('id', orderId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function expectedMinor(order: any) {
  return Math.round(Number(order?.total_amount || 0) * 100);
}

function verifyGatewayPayment(payment: any, order: any) {
  const amountMatches = Number(payment?.amount) === expectedMinor(order);
  const currencyMatches = String(payment?.currency || '').toUpperCase() === String(order?.currency || 'SAR').toUpperCase();
  const metadataOrderId = String(payment?.metadata?.order_id ?? '');
  const orderMatches = metadataOrderId === String(order.id);
  if (!amountMatches || !currencyMatches || !orderMatches) {
    throw new Error('Gateway payment does not match the authoritative order amount, currency, or order correlation.');
  }
}

async function recordPayment(req: VercelRequest, res: VercelResponse) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });
  const { paymentId, orderId } = req.body || {};
  if (!paymentId || !orderId) return send(res, 400, { error: 'Missing paymentId or orderId.' });
  const access = await requireOrderAccess(req, supabase, String(orderId));
  if (access.status !== 200) return send(res, access.status, { error: access.error });
  const order = access.order;
  const payment = await getMoyasarPayment(String(paymentId));
  verifyGatewayPayment(payment, order);
  const { error } = await supabase.from('zoal_payment_transactions').update({ gateway_payment_id: payment.id, gateway_response: payment, updated_at: new Date().toISOString() }).eq('order_id', order.id).in('payment_status', ['initiated', 'pending', 'unpaid']);
  if (error) return send(res, 500, { error: error.message });
  return send(res, 200, { recorded: true, paymentId: payment.id, status: payment.status });
}

async function verifyPayment(req: VercelRequest, res: VercelResponse) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });
  const { paymentId, orderId } = req.body || {};
  if (!paymentId || !orderId) return send(res, 400, { error: 'Missing paymentId or orderId.' });
  const access = await requireOrderAccess(req, supabase, String(orderId));
  if (access.status !== 200) return send(res, access.status, { error: access.error });
  const order = access.order;
  const payment = await getMoyasarPayment(String(paymentId));
  verifyGatewayPayment(payment, order);
  if (order.payment_status === 'paid') return send(res, 200, { success: true, verified: true, orderId: order.id, paymentStatus: 'paid', amount: Number(order.total_amount) });
  if (['paid', 'captured'].includes(String(payment.status))) {
    const { error: txError } = await supabase.from('zoal_payment_transactions').update({ payment_status: 'paid', gateway_payment_id: payment.id, gateway_response: payment, updated_at: new Date().toISOString() }).eq('order_id', order.id).in('payment_status', ['initiated', 'pending', 'unpaid']);
    if (txError) return send(res, 500, { error: txError.message });
    const { error: orderError } = await supabase.from('zoal_orders').update({ payment_status: 'paid', status: 'processing', updated_at: new Date().toISOString() }).eq('id', order.id).neq('payment_status', 'paid');
    if (orderError) return send(res, 500, { error: orderError.message });
    return send(res, 200, { success: true, verified: true, orderId: order.id, paymentStatus: 'paid', amount: Number(order.total_amount), gatewayPaymentId: payment.id });
  }
  if (String(payment.status) === 'failed') {
    await supabase.from('zoal_payment_transactions').update({ payment_status: 'failed', gateway_payment_id: payment.id, gateway_response: payment, updated_at: new Date().toISOString() }).eq('order_id', order.id).in('payment_status', ['initiated', 'pending', 'unpaid']);
    await supabase.from('zoal_orders').update({ payment_status: 'failed', status: 'failed', updated_at: new Date().toISOString() }).eq('id', order.id);
    return send(res, 200, { success: false, verified: true, orderId: order.id, paymentStatus: 'failed', message: 'Payment authorization failed.' });
  }
  return send(res, 202, { success: false, verified: true, orderId: order.id, paymentStatus: payment.status, message: 'Payment is not final yet.' });
}

async function refundPayment(req: VercelRequest, res: VercelResponse) {
  const user = await getUser(req);
  if (!user || !(user.permissions || []).includes('can_issue_refund')) return send(res, 403, { error: 'Forbidden: can_issue_refund permission required.' });
  const supabase = getServiceSupabaseClient();
  if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });
  const { orderId, amount, reason } = req.body || {};
  if (!orderId) return send(res, 400, { error: 'Missing orderId.' });
  const order = await getOrder(supabase, String(orderId));
  if (!order) return send(res, 404, { error: 'Order not found.' });
  const { data: tx, error: txLookupError } = await supabase.from('zoal_payment_transactions').select('*').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (txLookupError) return send(res, 500, { error: txLookupError.message });
  if (!tx?.gateway_payment_id) return send(res, 409, { error: 'No real Moyasar payment is linked to this order.' });
  const original = Number(tx.amount);
  const alreadyRefunded = Number(tx.refund_amount || 0);
  const requested = amount == null ? original - alreadyRefunded : Number(amount);
  if (!Number.isFinite(requested) || requested <= 0 || requested > original - alreadyRefunded) return send(res, 400, { error: 'Invalid refund amount.' });
  const gateway = await getMoyasarPayment(String(tx.gateway_payment_id));
  if (!['paid', 'captured'].includes(String(gateway?.status))) return send(res, 409, { error: `Payment is not refundable in status ${gateway?.status}.` });
  const refund = await refundMoyasarPayment(String(tx.gateway_payment_id), Math.round(requested * 100));
  const totalRefunded = alreadyRefunded + requested;
  const newStatus = totalRefunded >= original ? 'refunded' : 'partially_refunded';
  const { error: updateTxError } = await supabase.from('zoal_payment_transactions').update({ payment_status: newStatus, refund_amount: totalRefunded, refund_reason: reason || null, gateway_response: refund, updated_at: new Date().toISOString() }).eq('id', tx.id);
  if (updateTxError) return send(res, 500, { error: updateTxError.message });
  const { error: updateOrderError } = await supabase.from('zoal_orders').update({ payment_status: newStatus, status: newStatus, updated_at: new Date().toISOString() }).eq('id', order.id);
  if (updateOrderError) return send(res, 500, { error: updateOrderError.message });
  return send(res, 200, { success: true, orderId: order.id, paymentStatus: newStatus, refundAmount: requested, gatewayPaymentId: tx.gateway_payment_id, refund });
}

async function webhook(req: VercelRequest, res: VercelResponse) {
  const expectedSecret = process.env.MOYASAR_WEBHOOK_SECRET?.trim();
  if (!expectedSecret) return send(res, 503, { error: 'Moyasar webhook secret is not configured.' });
  const payload = req.body || {};
  if (String(payload.secret_token || '') !== expectedSecret) return send(res, 401, { error: 'Invalid webhook secret.' });
  const supabase = getServiceSupabaseClient();
  if (!supabase) return send(res, 503, { error: 'Database connection unavailable.' });
  const eventId = String(payload.id || '');
  const paymentId = String(payload.data?.id || '');
  if (!eventId || !paymentId) return send(res, 400, { error: 'Invalid webhook payload.' });
  const { error: logError } = await supabase.from('zoal_payment_webhook_logs').insert({ gateway_event_id: eventId, event_type: payload.type || null, payload, processed_status: 'pending' });
  if (logError && !String(logError.message).toLowerCase().includes('duplicate')) return send(res, 500, { error: logError.message });
  if (logError && String(logError.message).toLowerCase().includes('duplicate')) return send(res, 200, { received: true, duplicate: true });
  const payment = await getMoyasarPayment(paymentId);
  const { data: tx } = await supabase.from('zoal_payment_transactions').select('*').eq('gateway_payment_id', paymentId).maybeSingle();
  if (tx) {
    const status = String(payment.status);
    const mapped = status === 'refunded' ? 'refunded' : status === 'captured' || status === 'paid' ? 'paid' : status === 'failed' ? 'failed' : tx.payment_status;
    await supabase.from('zoal_payment_transactions').update({ payment_status: mapped, refund_amount: Number(payment.refunded || tx.refund_amount || 0) / 100, gateway_response: payment, updated_at: new Date().toISOString() }).eq('id', tx.id);
    if (mapped === 'paid') await supabase.from('zoal_orders').update({ payment_status: 'paid', status: 'processing', updated_at: new Date().toISOString() }).eq('id', tx.order_id);
    if (mapped === 'refunded') await supabase.from('zoal_orders').update({ payment_status: 'refunded', status: 'refunded', updated_at: new Date().toISOString() }).eq('id', tx.order_id);
    if (mapped === 'failed') await supabase.from('zoal_orders').update({ payment_status: 'failed', status: 'failed', updated_at: new Date().toISOString() }).eq('id', tx.order_id);
  }
  await supabase.from('zoal_payment_webhook_logs').update({ processed_status: 'processed', updated_at: new Date().toISOString() }).eq('gateway_event_id', eventId);
  return send(res, 200, { received: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const path = pathName(req);
    if (req.method === 'GET' && path === '/api/payments/config') {
      const publishableKey = process.env.MOYASAR_PUBLISHABLE_KEY?.trim();
      if (!publishableKey) return send(res, 503, { error: 'Moyasar payment gateway is not configured.' });
      return send(res, 200, { publishableKey });
    }
    if (req.method === 'POST' && path === '/api/payments/record') return recordPayment(req, res);
    if (req.method === 'POST' && path === '/api/payments/verify') return verifyPayment(req, res);
    if (req.method === 'POST' && path === '/api/payments/refund') return refundPayment(req, res);
    if (req.method === 'POST' && path === '/api/payments/webhook') return webhook(req, res);
    return send(res, 404, { error: 'Payment endpoint not found.' });
  } catch (err: any) {
    console.error('Moyasar payment API error:', err);
    return send(res, Number(err?.status) >= 400 ? Number(err.status) : 500, { error: err?.message || 'Payment gateway error.' });
  }
}
