import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/staff
 * Retrieve staff operations panel resources.
 * RBAC: Staff or Admin privilege.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin', 'owner', 'manager']);
    if (auth.error) return auth.error;

    const { data: staffMembers, error } = await supabase
      .from('zoal_users')
      .select('id, first_name, last_name, email, role')
      .in('role', ['staff', 'admin', 'owner', 'manager']);

    if (error) return apiError(error.message, 500);
    return apiResponse(staffMembers);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PUT /api/staff
 * Persist staff order operations. At least one mutable field is required.
 * RBAC: Staff/Admin/Owner/Manager.
 */
export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin', 'owner', 'manager']);
    if (auth.error) return auth.error;

    const body = await req.json();
    const validationErr = validateFields(body, ['orderId']);
    if (validationErr) return apiError(validationErr, 400);

    const statusMap: Record<string, string> = {
      pending: 'pending', 'Pending': 'pending',
      confirmed: 'processing', 'Confirmed': 'processing',
      processing: 'processing', 'Processing': 'processing', 'Preparing': 'processing',
      packed: 'processing', 'Packed': 'processing',
      'ready for shipping': 'processing', 'Ready for Shipping': 'processing',
      shipped: 'shipped', 'Shipped': 'shipped',
      'out for delivery': 'shipped', 'Out for Delivery': 'shipped',
      delivered: 'delivered', 'Delivered': 'delivered', 'Completed': 'delivered',
      cancelled: 'cancelled', 'Cancelled': 'cancelled',
      refunded: 'refunded', 'Refund Completed': 'refunded',
      'partially refunded': 'partially_refunded', 'Partially Refunded': 'partially_refunded',
      failed: 'failed', 'Failed': 'failed'
    };

    const updateFields: Record<string, any> = {};
    if (typeof body.status === 'string' && body.status.trim()) {
      const normalizedStatus = statusMap[body.status.trim()] || statusMap[body.status.trim().toLowerCase()];
      if (!normalizedStatus) return apiError('Invalid status value.', 400);
      updateFields.status = normalizedStatus;
      if (normalizedStatus === 'delivered') updateFields.payment_status = 'paid';
      if (normalizedStatus === 'refunded') updateFields.payment_status = 'refunded';
    }

    if (typeof body.trackingNumber === 'string') {
      updateFields.tracking_number = body.trackingNumber.trim() || null;
    }
    if (typeof body.assignedStaffId === 'string') {
      const staffId = body.assignedStaffId.trim();
      const { data: staffMember, error: staffError } = await supabase
        .from('zoal_users')
        .select('id, first_name, last_name, email, role')
        .eq('id', staffId)
        .in('role', ['staff', 'admin', 'owner', 'manager'])
        .maybeSingle();
      if (staffError) return apiError(staffError.message, 500);
      if (!staffMember) return apiError('Assigned staff member not found or not authorized.', 400);
      updateFields.assigned_staff_id = staffMember.id;
      updateFields.assigned_staff_name = [staffMember.first_name, staffMember.last_name].filter(Boolean).join(' ') || staffMember.email;
    }
    if (typeof body.assignedStaffName === 'string' && !updateFields.assigned_staff_id) {
      const name = body.assignedStaffName.trim();
      if (name) {
        const { data: staffMembers, error: staffError } = await supabase
          .from('zoal_users')
          .select('id, first_name, last_name, email, role')
          .in('role', ['staff', 'admin', 'owner', 'manager']);
        if (staffError) return apiError(staffError.message, 500);
        const match = (staffMembers || []).find((member: any) => {
          const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
          return fullName.toLowerCase() === name.toLowerCase() || member.email?.toLowerCase() === name.toLowerCase();
        });
        if (!match) return apiError('Assigned staff member not found.', 400);
        updateFields.assigned_staff_id = match.id;
        updateFields.assigned_staff_name = [match.first_name, match.last_name].filter(Boolean).join(' ') || match.email;
      } else {
        updateFields.assigned_staff_id = null;
        updateFields.assigned_staff_name = null;
      }
    }

    for (const field of ['adminNotes', 'staffNotes', 'customerNotes'] as const) {
      if (typeof body[field] === 'string') updateFields[field.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)] = body[field];
    }

    if (Object.keys(updateFields).length === 0) return apiError('No mutable order fields supplied.', 400);
    updateFields.updated_at = new Date().toISOString();

    const { data: updatedOrder, error } = await supabase
      .from('zoal_orders')
      .update(updateFields)
      .eq('id', body.orderId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    await supabase.from('zoal_activity_logs').insert({
      id: randomUUID(),
      user_id: auth.user.id,
      email: auth.user.email,
      action: `Updated order ${body.orderId}: ${Object.keys(updateFields).filter(k => k !== 'updated_at').join(', ')}`,
      resource_type: 'order',
      resource_id: body.orderId,
      metadata: { fields: Object.keys(updateFields).filter(k => k !== 'updated_at') }
    });

    return apiResponse(updatedOrder);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}