import { NextRequest } from 'next/server';
import { supabase, checkRateLimit, apiResponse, apiError, validateFields } from '../helpers';

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

      // Simple password hashing mockup (in production, use bcrypt/scrypt or Supabase native Auth.signUp)
      const mockHash = Buffer.from(body.password).toString('base64');
      const userId = 'USR-' + Math.floor(100000 + Math.random() * 900000);

      const { data: newUser, error } = await supabase
        .from('zoal_users')
        .insert({
          id: userId,
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          password_hash: mockHash,
          role: 'customer',
          is_verified: true
        })
        .select('id, first_name, last_name, email, role')
        .single();

      if (error) return apiError(error.message, 400);

      // Create Session
      const sessionToken = 'TOK-' + Math.floor(100000000 + Math.random() * 900000000);
      await supabase.from('zoal_sessions').insert({
        token: sessionToken,
        user_id: userId,
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30 days
      });

      return apiResponse({ user: newUser, token: sessionToken }, 201);
    } 
    
    if (action === 'login') {
      const validationErr = validateFields(body, ['email', 'password']);
      if (validationErr) return apiError(validationErr, 400);

      const mockHash = Buffer.from(body.password).toString('base64');

      const { data: user, error } = await supabase
        .from('zoal_users')
        .select('*')
        .eq('email', body.email)
        .maybeSingle();

      if (error || !user) {
        return apiError('Invalid email or password credentials', 401);
      }

      if (user.password_hash !== mockHash) {
        return apiError('Invalid email or password credentials', 401);
      }

      // Create Session Token
      const sessionToken = 'TOK-' + Math.floor(100000000 + Math.random() * 900000000);
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
