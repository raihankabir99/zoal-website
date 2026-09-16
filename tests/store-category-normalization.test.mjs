import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/lib/categoryApi.ts', import.meta.url), 'utf8');

test('category API normalizes snake_case image_url for Store cards', () => {
  assert.match(source, /imageUrl:\s*row\.imageUrl\s*\|\|\s*row\.image_url/);
});
