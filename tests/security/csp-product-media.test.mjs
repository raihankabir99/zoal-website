import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../server/security.ts', import.meta.url), 'utf8');

test('CSP explicitly permits Supabase media and does not require Unsplash for product authority', () => {
  const imgDirective = source.match(/"img-src [^"]+"/);
  assert.ok(imgDirective, 'img-src directive must exist');
  assert.match(imgDirective[0], /https:\/\/\*\.supabase\.co/);
});
