import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * POST /api/payments
 * Secure mockup integration for Credit Card/Mada payments.
 * Updates order payment status to paid upon success and registers activity/analytics.
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();
    const validationErr = validateFields(body, ['orderId', 'paymentMethod', 'cardNumber']);
    if (validationErr) return apiError(validationErr, 400);

    // Verify order exists and matches customer
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

    // Process mock gateway payment validation
    const isSuccess = !body.cardNumber.startsWith('4000000000000002'); // Mock failure card

    if (!isSuccess) {
      // Mark as failed
      await supabase
        .from('zoal_orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', body.orderId);

      return apiError('Payment transaction was declined by bank gateway', 402);
    }

    // Mark as paid
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

    // Register analytics event for purchase
    await supabase.from('zoal_analytics').insert({
      event_name: 'purchase',
      user_id: user.id,
      metadata: { orderId: body.orderId, amount: Number(order.total_amount) }
    });

    return apiResponse({
      transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000),
      order: updatedOrder
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
