export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
