import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../backend/supabase.ts', import.meta.url), 'utf8');

test('service Supabase client must require the service-role key', () => {
  assert.match(source, /const serviceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY\?\.trim\(\)/);
  assert.match(source, /if \(!url \|\| !serviceKey\)/);
  assert.doesNotMatch(source, /getServiceSupabaseClient[\s\S]{0,1800}NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(source, /getServiceSupabaseClient[\s\S]{0,1800}DEFAULT_SUPABASE_ANON_KEY/);
});
