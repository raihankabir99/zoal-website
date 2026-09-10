import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * POST /api/payments
 * Development-only mock payment endpoint.
 * Real gateway integration is intentionally not enabled yet.
 * Production must never settle an order as paid through this mock flow.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    // Never allow the mock gateway to settle real production orders.
    if (process.env.NODE_ENV === 'production') {
      return apiError('Payment gateway is not configured. Real payment processing is unavailable.', 503);
    }

    const body = await req.json();
    const validationErr = validateFields(body, ['orderId', 'paymentMethod', 'cardNumber']);
    if (validationErr) return apiError(validationErr, 400);

    // Verify order exists and matches customer.
    const { data: order, error: orderErr } = await supabase
      .from('zoal_orders')
      .select('*')
      .eq('id', body.orderId)
      .single();

    if (orderErr || !order) {
      return apiError('Order not found', 404);
    }

    if (order.customer_id !== user.id && user.role === 'customer') {
      return apiError('Forbidden: Unauthorized order payment', 403);
    }

    // Development-only simulated gateway response.
    const isSuccess = !body.cardNumber.startsWith('4000000000000002');

    if (!isSuccess) {
      await supabase
        .from('zoal_orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', body.orderId);

      return apiError('Development mock payment declined', 402);
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('zoal_orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', body.orderId)
      .select()
      .single();

    if (updateErr) return apiError(updateErr.message, 500);

    await supabase.from('zoal_analytics').insert({
      event_name: 'purchase',
      user_id: user.id,
      metadata: { orderId: body.orderId, amount: Number(order.total_amount), source: 'development_mock_payment' }
    });

    return apiResponse({
      transactionId: 'DEV-MOCK-' + Math.floor(10000000 + Math.random() * 90000000),
      paymentStatus: 'paid',
      mode: 'development_mock',
      order: updatedOrder
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
