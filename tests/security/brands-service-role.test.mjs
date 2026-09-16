import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../server/brands.ts', import.meta.url), 'utf8');

test('brands CRUD must use the service-role client without anon fallback', () => {
  assert.match(source, /function getClient\(\)[\s\S]*?return getServiceSupabaseClient\(\);/);
  assert.doesNotMatch(source, /getServiceSupabaseClient\(\)\s*\|\|\s*getSupabaseClient\(\)/);
});
