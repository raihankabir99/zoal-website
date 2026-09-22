import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/components/EnterpriseAiExecutiveBriefing.tsx', import.meta.url), 'utf8');

test('AI briefing markdown renderer must escape HTML before formatting markdown', () => {
  const fnStart = source.indexOf('const renderMarkdown =');
  assert.notEqual(fnStart, -1);
  const fnEnd = source.indexOf('\n  };', fnStart);
  assert.notEqual(fnEnd, -1);
  const fn = source.slice(fnStart, fnEnd);
  assert.match(fn, /escape|sanitize|DOMPurify|createElement|textContent/);
});
