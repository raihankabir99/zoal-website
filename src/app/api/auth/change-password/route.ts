import { NextRequest } from 'next/server';
import { checkRateLimit, apiResponse, apiError, verifyAuthAndRole, supabase } from '../../helpers';

export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);
  const auth = await verifyAuthAndRole(req, ['staff', 'admin', 'owner', 'manager', 'customer']);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
    if (!currentPassword || !newPassword) return apiError('Current and new password are required.', 400);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return apiError('New password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.', 400);
    }
    const { data: user, error: userError } = await supabase.from('zoal_users').select('id,password_hash').eq('id', auth.user.id).single();
    if (userError || !user) return apiError('Unable to verify account credentials.', 401);
    const currentHash = Buffer.from(currentPassword).toString('base64');
    if (user.password_hash !== currentHash) return apiError('Current password is incorrect.', 401);
    const nextHash = Buffer.from(newPassword).toString('base64');
    const { error: updateError } = await supabase.from('zoal_users').update({ password_hash: nextHash }).eq('id', auth.user.id);
    if (updateError) return apiError('Failed to update password.', 500);
    return apiResponse({ message: 'Password updated successfully.' });
  } catch {
    return apiError('Password change failed.', 500);
  }
}
