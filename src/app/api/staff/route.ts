import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/staff
 * Retrieve staff operations panel resources.
 * RBAC: Staff or Admin privilege.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin']);
    if (auth.error) return auth.error;

    const { data: staffMembers, error } = await supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, role')
      .in('role', ['staff', 'admin']);

    if (error) return apiError(error.message, 500);
    return apiResponse(staffMembers);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PUT /api/staff
 * Update an order's fulfilment / tracking status.
 * RBAC: Staff or Admin.
 */
export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin']);
    if (auth.error) return auth.error;

    const body = await req.json();
    const validationErr = validateFields(body, ['orderId', 'status']);
    if (validationErr) return apiError(validationErr, 400);

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(body.status)) {
      return apiError(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const updateFields: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    if (body.trackingNumber) {
      updateFields.tracking_number = body.trackingNumber;
    }

    const { data: updatedOrder, error } = await supabase
      .from('zoal_orders')
      .update(updateFields)
      .eq('id', body.orderId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    // Add activity log
    await supabase.from('zoal_activity_logs').insert({
      id: 'ACT-' + Math.floor(100000 + Math.random() * 900000),
      user_id: auth.user.id,
      email: auth.user.email,
      action: `Updated order ${body.orderId} status to ${body.status}`
    });

    return apiResponse(updatedOrder);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
