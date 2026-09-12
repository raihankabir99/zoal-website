import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole } from '../../helpers';

const ALLOWED_DUTY_STATUS = new Set(['active', 'break', 'offline']);

async function resolveStaffDetailsUser(userId: string) {
  return supabase
    .from('zoal_staff_details')
    .select('id, user_id, duty_status')
    .eq('user_id', userId)
    .maybeSingle();
}

export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin']);
    if (auth.error) return auth.error;
    if (!['staff', 'admin', 'owner', 'manager'].includes(auth.user?.role)) {
      return apiError('Forbidden: Insufficient privileges for this operation', 403);
    }

    const { data: staffDetails, error } = await resolveStaffDetailsUser(auth.user.id);
    if (error) return apiError(error.message, 500);
    if (!staffDetails) return apiError('Staff details record not found for authenticated user', 404);

    const dutyStatus = staffDetails.duty_status;
    if (!ALLOWED_DUTY_STATUS.has(dutyStatus)) {
      return apiError('Invalid duty status stored for staff member', 500);
    }

    return apiResponse({ dutyStatus });
  } catch (err: any) {
    return apiError(err.message || 'Duty status unavailable', 500);
  }
}

export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['staff', 'admin']);
    if (auth.error) return auth.error;
    if (!['staff', 'admin', 'owner', 'manager'].includes(auth.user?.role)) {
      return apiError('Forbidden: Insufficient privileges for this operation', 403);
    }

    const body = await req.json();
    const dutyStatus = typeof body?.dutyStatus === 'string' ? body.dutyStatus.trim().toLowerCase() : '';
    if (!ALLOWED_DUTY_STATUS.has(dutyStatus)) {
      return apiError('dutyStatus must be one of: active, break, offline', 400);
    }

    const { data: staffDetails, error: lookupError } = await resolveStaffDetailsUser(auth.user.id);
    if (lookupError) return apiError(lookupError.message, 500);
    if (!staffDetails) return apiError('Staff details record not found for authenticated user', 404);

    const previousDutyStatus = staffDetails.duty_status;
    const { data: updated, error: updateError } = await supabase
      .from('zoal_staff_details')
      .update({ duty_status: dutyStatus })
      .eq('user_id', auth.user.id)
      .select('id, user_id, duty_status')
      .single();

    if (updateError) return apiError(updateError.message, 500);

    if (previousDutyStatus !== dutyStatus) {
      const { error: logError } = await supabase.from('zoal_activity_logs').insert({
        id: crypto.randomUUID(),
        user_id: auth.user.id,
        email: auth.user.email,
        action: `Duty status changed: ${previousDutyStatus || 'unknown'} -> ${dutyStatus}`
      });
      if (logError) console.error('Failed to record duty-status activity:', logError.message);
    }

    return apiResponse({ dutyStatus: updated.duty_status });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update duty status', 500);
  }
}
