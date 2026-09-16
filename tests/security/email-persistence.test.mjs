import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../app.ts', import.meta.url), 'utf8');

test('email history has a Supabase-backed production path', () => {
  assert.match(source, /async function readEmailDbAsync\(\)/);
  assert.match(source, /from\('zoal_email_logs'\)\.select\('\*'\)/);
  assert.match(source, /async function writeEmailDbAsync\(logs: EmailLog\[\]\)/);
  assert.match(source, /from\('zoal_email_logs'\)\.upsert\(dbLogs\)/);
});
