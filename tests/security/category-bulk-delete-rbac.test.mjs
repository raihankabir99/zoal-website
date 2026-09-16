import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../../api/categories.ts', import.meta.url), 'utf8');

test('category bulk delete must require admin or owner, matching single-delete RBAC', () => {
  assert.match(
    source,
    /if \(operation === 'bulk-update'\)[\s\S]*?if \(action === 'delete'\)[\s\S]*?auth\.role !== 'admin' && auth\.role !== 'owner'/
  );
});
