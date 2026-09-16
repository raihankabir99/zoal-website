import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let serviceSupabaseClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://jglveforpqhioxpambbq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_usAlnI8l2JjcgwOIiWbgRw_ZUKVJ2C3';

/**
 * Cleans the SUPABASE_URL by stripping trailing slashes or /rest/v1 suffixes.
 */
export function getCleanSupabaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  url = url.trim();
  if (url.endsWith('/')) url = url.slice(0, -1);
  if (url.endsWith('/rest/v1')) url = url.slice(0, -8);
  if (url.endsWith('/')) url = url.slice(0, -1);
  return url;
}

/**
 * Checks if public Supabase credentials are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = getCleanSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
              process.env.SUPABASE_ANON_KEY ||
              DEFAULT_SUPABASE_ANON_KEY;
  return !!(url && key && url.trim() !== '' && key.trim() !== '' && (url.startsWith('http://') || url.startsWith('https://')));
}

/**
 * Lazily retrieves the public/anon Supabase client.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!supabaseClient) {
    const url = getCleanSupabaseUrl();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                process.env.SUPABASE_ANON_KEY ||
                DEFAULT_SUPABASE_ANON_KEY;
    try {
      supabaseClient = createClient(url, key, { auth: { persistSession: false } });
      console.log('✅ Supabase Client initialized successfully with URL:', url);
    } catch (err) {
      console.error('❌ Error initializing Supabase client:', err);
      return null;
    }
  }
  return supabaseClient;
}

/**
 * Lazily retrieves the privileged Supabase service-role client.
 * IMPORTANT: never falls back to an anon/publishable key. Callers performing
 * server-side administrative writes must fail closed when the service key is absent.
 */
export function getServiceSupabaseClient(): SupabaseClient | null {
  const url = getCleanSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    console.error('❌ Supabase service-role client unavailable: SUPABASE_SERVICE_ROLE_KEY is not configured.');
    return null;
  }

  if (!serviceSupabaseClient) {
    try {
      serviceSupabaseClient = createClient(url, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('✅ Service Role Supabase Client initialized successfully.');
    } catch (err) {
      console.error('❌ Error initializing service role Supabase client:', err);
      return null;
    }
  }

  return serviceSupabaseClient;
}

/**
 * SQL SCHEMA NOTICE:
 * The database schema (tables, indexes, RLS) has been moved to the /migrations directory
 * to ensure a production-safe migration architecture.
 * Use 'npm run migrate' to apply schema changes.
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA MOVED TO /migrations/001_core_schema.sql`;
export const SUPABASE_STORAGE_SQL_SCHEMA = `-- SCHEMA MOVED TO /migrations/003_storage_setup.sql`;
