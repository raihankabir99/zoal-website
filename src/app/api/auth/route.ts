import { NextRequest } from 'next/server';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { supabase, checkRateLimit, apiResponse, apiError, validateFields } from '../helpers';

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const SESSION_TOKEN_BYTES = 32;

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

  // Backward-compatible verification for existing accounts. Successful legacy
  // authentication is upgraded to scrypt immediately without changing the schema.
  const legacyHash = Buffer.from(password).toString('base64');
  return { valid: storedHash === legacyHash, needsUpgrade: storedHash === legacyHash };
}

function createSessionToken(): string {
  return `TOK-${randomBytes(SESSION_TOKEN_BYTES).toString('hex')}`;
}

/**
 * POST /api/auth
 * Handles credentials registration or session logins.
 * Methods supported in body.action: 'login', 'register', 'logout'
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req)) return apiError('Too many requests', 429);

  try {
    const body = await req.json();
    const action = body.action || 'login';

    if (action === 'register') {
      const validationErr = validateFields(body, ['firstName', 'lastName', 'email', 'phone', 'password']);
      if (validationErr) return apiError(validationErr, 400);

      const passwordHash = hashPassword(body.password);
      const userId = `USR-${randomBytes(8).toString('hex')}`;

      const { data: newUser, error } = await supabase
        .from('zoal_users')
        .insert({
          id: userId,
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          password_hash: passwordHash,
          role: 'customer',
          is_verified: true
        })
        .select('id, first_name, last_name, email, role')
        .single();

      if (error) return apiError(error.message, 400);

      const sessionToken = createSessionToken();
      const { error: sessionError } = await supabase.from('zoal_sessions').insert({
        token: sessionToken,
        user_id: userId,
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      });

      if (sessionError) return apiError(sessionError.message, 500);

      return apiResponse({ user: newUser, token: sessionToken }, 201);
    }

    if (action === 'login') {
      const validationErr = validateFields(body, ['email', 'password']);
      if (validationErr) return apiError(validationErr, 400);

      const { data: user, error } = await supabase
        .from('zoal_users')
        .select('*')
        .eq('email', body.email)
        .maybeSingle();

      if (error || !user) {
        return apiError('Invalid email or password credentials', 401);
      }

      const passwordCheck = verifyPassword(body.password, user.password_hash || '');
      if (!passwordCheck.valid) {
        return apiError('Invalid email or password credentials', 401);
      }

      if (passwordCheck.needsUpgrade) {
        const upgradedHash = hashPassword(body.password);
        const { error: upgradeError } = await supabase
          .from('zoal_users')
          .update({ password_hash: upgradedHash })
          .eq('id', user.id);
        if (upgradeError) return apiError('Unable to secure account credentials', 500);
      }

      const sessionToken = createSessionToken();
      const { error: sessErr } = await supabase.from('zoal_sessions').insert({
        token: sessionToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      });

      if (sessErr) return apiError(sessErr.message, 500);

      return apiResponse({
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone,
          role: user.role
        },
        token: sessionToken
      });
    }

    if (action === 'logout') {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        await supabase.from('zoal_sessions').delete().eq('token', token);
      }
      return apiResponse({ message: 'Session logged out successfully' });
    }

    return apiError('Unsupported action', 400);
  } catch (err: any) {
    return apiError(err.message || 'Server error', 500);
  }
}