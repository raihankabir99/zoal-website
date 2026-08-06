import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, verifyAuthAndRole, validateFields } from '../helpers';

/**
 * GET /api/customer
 * Retrieve full customer record along with their default saved addresses.
 */
export async function GET(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    // Fetch saved addresses
    const { data: addresses, error: addrErr } = await supabase
      .from('zoal_addresses')
      .select('*')
      .eq('user_id', user.id);

    if (addrErr) return apiError(addrErr.message, 500);

    return apiResponse({
      profile: user,
      addresses: addresses || []
    });

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}

/**
 * PUT /api/customer
 * Modify specific customer information (names, phone).
 */
export async function PUT(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const auth = await verifyAuthAndRole(req, ['customer', 'staff', 'admin']);
    if (auth.error) return auth.error;
    const user = auth.user!;

    const body = await req.json();

    const updateFields: any = {};
    if (body.firstName) updateFields.first_name = body.firstName;
    if (body.lastName) updateFields.last_name = body.lastName;
    if (body.phone) updateFields.phone = body.phone;

    if (Object.keys(updateFields).length === 0) {
      return apiError('No fields provided to update', 400);
    }

    const { data: updatedUser, error } = await supabase
      .from('zoal_users')
      .update(updateFields)
      .eq('id', user.id)
      .select('id, first_name, last_name, email, phone, role')
      .single();

    if (error) return apiError(error.message, 500);
    return apiResponse(updatedUser);

  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}
