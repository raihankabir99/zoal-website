const TRANSITIONS = Object.freeze({
  pending: new Set(['pending', 'processing', 'cancelled']),
  processing: new Set(['processing', 'shipped']),
  shipped: new Set(['shipped', 'delivered']),
  delivered: new Set(['delivered', 'refunded']),
  cancelled: new Set(['cancelled']),
  refunded: new Set(['refunded']),
  failed: new Set(['failed', 'pending']),
  draft: new Set(['draft', 'pending']),
  pending_payment: new Set(['pending_payment', 'pending', 'cancelled']),
  paid: new Set(['paid', 'processing']),
  partially_refunded: new Set(['partially_refunded', 'refunded'])
});

export function canTransitionOrderStatus(currentStatus, nextStatus) {
  if (typeof currentStatus !== 'string' || typeof nextStatus !== 'string') return false;
  const current = currentStatus.trim().toLowerCase();
  const next = nextStatus.trim().toLowerCase();
  return TRANSITIONS[current]?.has(next) ?? false;
}
