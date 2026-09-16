import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../server/products_crud.ts', import.meta.url), 'utf8');

test('privileged product CRUD must not fall back to anon Supabase client', () => {
  assert.doesNotMatch(
    source,
    /function getSupabase\(\)\s*\{[\s\S]*?getServiceSupabaseClient\(\)\s*\|\|\s*getSupabaseClient\(\)/,
    'server-side product CRUD must fail closed when the service-role client is unavailable'
  );
});
