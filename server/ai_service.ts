export async function generateExecutiveBriefing(stats: any) {
  return `Executive Summary:\n- Total Orders: ${stats.totalOrders || 0}\n- Total Revenue: SAR ${stats.totalRevenue || 0}\n- Active Patrons: ${stats.activeCustomers || 0}\n\nStrategic Outlook:\nBusiness performance remains strong across coffee and bespoke luxury retail segments with steady organic expansion.`;
}
