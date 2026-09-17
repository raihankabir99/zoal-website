import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentStatusForOrderStatus } from '../src/lib/orderPaymentStatus.mjs';

test('delivering an order does not mark payment as paid', () => {
  assert.equal(paymentStatusForOrderStatus('delivered'), undefined);
});

test('completing an order does not mark payment as paid', () => {
  assert.equal(paymentStatusForOrderStatus('Completed'), undefined);
});

test('refund completion marks payment as refunded', () => {
  assert.equal(paymentStatusForOrderStatus('Refund Completed'), 'refunded');
});
