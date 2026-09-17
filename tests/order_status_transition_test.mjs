import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionOrderStatus } from '../src/lib/orderStatusTransition.mjs';

test('pending can move to processing or cancelled', () => {
  assert.equal(canTransitionOrderStatus('pending', 'processing'), true);
  assert.equal(canTransitionOrderStatus('pending', 'cancelled'), true);
});

test('processing can move forward to shipped or remain processing', () => {
  assert.equal(canTransitionOrderStatus('processing', 'processing'), true);
  assert.equal(canTransitionOrderStatus('processing', 'shipped'), true);
});

test('shipped can move to delivered but not backwards', () => {
  assert.equal(canTransitionOrderStatus('shipped', 'delivered'), true);
  assert.equal(canTransitionOrderStatus('shipped', 'processing'), false);
});

test('delivered cannot become paid through a status transition', () => {
  assert.equal(canTransitionOrderStatus('delivered', 'delivered'), true);
  assert.equal(canTransitionOrderStatus('delivered', 'processing'), false);
});

test('terminal statuses cannot transition', () => {
  assert.equal(canTransitionOrderStatus('cancelled', 'processing'), false);
  assert.equal(canTransitionOrderStatus('refunded', 'delivered'), false);
});
