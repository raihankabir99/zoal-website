import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Cleans the SUPABASE_URL by stripping trailing slashes or /rest/v1 suffixes.
 */
export function getCleanSupabaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  url = url.trim();
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8); // length of '/rest/v1'
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

/**
 * Checks if Supabase credentials are configured in the environment variables.
 */
export function isSupabaseConfigured(): boolean {
  const url = getCleanSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  return !!(url && key && url.trim() !== '' && key.trim() !== '' && (url.startsWith('http://') || url.startsWith('https://')));
}

/**
 * Lazily retrieves the Supabase client instance.
 * Returns null if the keys are not yet configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const url = getCleanSupabaseUrl();
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!;
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
      console.log('✅ Supabase Client initialized successfully with URL:', url);
    } catch (err) {
      console.error('❌ Error initializing Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

/**
 * SQL SCHEMA NOTICE:
 * The database schema (tables, indexes, RLS) has been moved to the /migrations directory
 * to ensure a production-safe migration architecture.
 * Use 'npm run migrate' to apply schema changes.
 */
export const SUPABASE_SQL_SCHEMA = `-- SCHEMA MOVED TO /migrations/001_core_schema.sql`;
export const SUPABASE_STORAGE_SQL_SCHEMA = `-- SCHEMA MOVED TO /migrations/003_storage_setup.sql`;

