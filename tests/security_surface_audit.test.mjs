import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const repoRoot = new URL('../', import.meta.url);

function read(path) {
  return fs.readFileSync(new URL(path, repoRoot), 'utf8');
}

test('AI executive briefing must not render database content through raw HTML', () => {
  const source = read('src/components/EnterpriseAiExecutiveBriefing.tsx');
  assert.doesNotMatch(
    source,
    /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*renderMarkdown\(/,
    'AI briefing content is rendered through an unsafe HTML sink; replace it with React text nodes or sanitized HTML.'
  );
});

test('payment gateway remains explicitly disabled until configured', () => {
  const source = read('api/payments.ts');
  assert.match(source, /MOYASAR_ENABLED/);
  assert.match(source, /Payment gateway is disabled/);
});

test('legacy app payment endpoints fail closed while gateway is disabled', () => {
  const source = read('app.ts');
  assert.match(source, /Payment gateway is not enabled/);
  assert.doesNotMatch(source, /simulatedStatus\s*\|\|\s*['\"]paid['\"]/);
});

test('legacy order endpoint cannot directly create order rows', () => {
  const source = read('app.ts');
  const start = source.indexOf("app.post('/api/orders/create'");
  assert.notEqual(start, -1);
  const end = source.indexOf('// ==========================================\n// MOYASAR ENTERPRISE PAYMENT ARCHITECTURE API', start);
  assert.notEqual(end, -1);
  const route = source.slice(start, end);
  assert.doesNotMatch(route, /from\(['\"]zoal_orders['\"]\)\.insert/);
  assert.doesNotMatch(route, /from\(['\"]zoal_order_items['\"]\)\.insert/);
  assert.doesNotMatch(route, /from\(['\"]zoal_inventory['\"]\)\.update/);
  assert.match(route, /canonical atomic checkout flow/);
});
