import i18n from './i18n';

export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number') return amount;
  const isAr = i18n.language === 'ar';
  return new Intl.NumberFormat(isAr ? 'ar-SA' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

