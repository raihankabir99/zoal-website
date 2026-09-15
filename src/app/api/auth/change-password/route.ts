import { NextRequest } from 'next/server';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { checkRateLimit, apiResponse, apiError, verifyAuthAndRole, supabase } from '../../helpers';

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;

function hashPassword(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_BYTES);
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string): { valid: boolean; needsUpgrade: boolean } {
  if (storedHash.startsWith('scrypt$')) {
    const [, salt, keyHex] = storedHash.split('$');
    if (!salt || !keyHex) return { valid: false, needsUpgrade: false };
    try {
      const expected = Buffer.from(keyHex, 'hex');
      const actual = scryptSync(password, salt, expected.length);
      return {
        valid: expected.length === actual.length && timingSafeEqual(expected, actual),
        needsUpgrade: false
      };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Preserve compatibility with legacy accounts while allowing the password
  // change itself to migrate the account to the hardened scrypt format.
  const legacyHash = Buffer.from(password).toString('base64');
  return { valid: storedHash === legacyHash, needsUpgrade: storedHash === legacyHash };
}

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

    const passwordCheck = verifyPassword(currentPassword, user.password_hash || '');
    if (!passwordCheck.valid) return apiError('Current password is incorrect.', 401);

    const nextHash = hashPassword(newPassword);
    const { error: updateError } = await supabase.from('zoal_users').update({ password_hash: nextHash }).eq('id', auth.user.id);
    if (updateError) return apiError('Failed to update password.', 500);
    return apiResponse({ message: 'Password updated successfully.' });
  } catch {
    return apiError('Password change failed.', 500);
  }
}
