import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jglveforpqhioxpambbq.supabase.co';
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

function cleanUrl(url: string): string {
  let cleaned = (url || '').trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (cleaned.endsWith('/rest/v1')) {
    cleaned = cleaned.slice(0, -8);
  }
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

const supabaseUrl = cleanUrl(rawUrl);

let client: any;
try {
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.error('Failed to initialize Supabase client:', err);
  // Fallback dummy structure to prevent import crashes
  client = {
    auth: {
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase is not configured') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase is not configured') }),
      signOut: async () => ({ error: new Error('Supabase is not configured') }),
      signInWithOAuth: async () => ({ error: new Error('Supabase is not configured') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
    }
  };
}

export const supabaseClient = client;
