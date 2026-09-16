import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../server/crm.ts', import.meta.url), 'utf8');

test('CRM database client must use the service-role client without anon fallback', () => {
  assert.match(source, /function getClient\(\)[\s\S]*?return getServiceSupabaseClient\(\);/);
  assert.doesNotMatch(source, /getServiceSupabaseClient\(\)\s*\|\|\s*getSupabaseClient\(\)/);
});
