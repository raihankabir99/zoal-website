import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../app.ts', import.meta.url), 'utf8');

function routeBody(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing route marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing route end marker after: ${startMarker}`);
  return source.slice(start, end);
}

test('legacy /api/orders/create is idempotent-only and cannot create non-atomic orders', () => {
  const route = routeBody(
    appSource,
    "app.post('/api/orders/create'",
    "// ==========================================\n// MOYASAR ENTERPRISE PAYMENT ARCHITECTURE API"
  );

  assert.match(route, /existingOrder/);
  assert.match(route, /idempotent:\s*true/);
  assert.match(route, /status\(409\)/);
  assert.doesNotMatch(route, /from\(['"]zoal_orders['"]\)\.insert/);
  assert.doesNotMatch(route, /from\(['"]zoal_order_items['"]\)\.insert/);
  assert.doesNotMatch(route, /zoal_inventory/);
});

test('legacy payment verification cannot mark an order paid without the real gateway', () => {
  const route = routeBody(
    appSource,
    "app.post('/api/payments/verify'",
    "// 3. Moyasar Webhook Receiver"
  );

  assert.doesNotMatch(route, /simulatedStatus/);
  assert.match(route, /Payment gateway integration is not configured|Payment gateway integration is pending/);
  assert.doesNotMatch(route, /paymentStatus\s*=\s*simulated/);
  assert.doesNotMatch(route, /SET status = 'processing', payment_status = 'paid'/);
});

test('legacy payment creation fails closed when Moyasar is not configured', () => {
  const route = routeBody(
    appSource,
    "app.post('/api/payments/create'",
    "// 2. Verify Payment Result"
  );

  assert.match(route, /MOYASAR_PUBLISHABLE_KEY/);
  assert.match(route, /503/);
  assert.doesNotMatch(route, /isSimulation:\s*!moyasarSecretKey/);
});
