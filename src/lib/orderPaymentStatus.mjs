export function paymentStatusForOrderStatus(status) {
  if (status === 'refunded' || status === 'Refund Completed') return 'refunded';
  return undefined;
}
