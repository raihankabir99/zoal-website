export interface ShippingConfig {
  freeShippingThreshold: number;
  processingTimeEn: string;
  processingTimeAr: string;
  standardDaysEn: string;
  standardDaysAr: string;
  expressDaysEn: string;
  expressDaysAr: string;
  sameDayDaysEn: string;
  sameDayDaysAr: string;
  sameDayCutoffEn: string;
  sameDayCutoffAr: string;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeShippingThreshold: 150,
  processingTimeEn: "1–2 Business Days",
  processingTimeAr: "1-2 أيام عمل",
  standardDaysEn: "3–5 Business Days",
  standardDaysAr: "3-5 أيام عمل",
  expressDaysEn: "1–2 Business Days",
  expressDaysAr: "1-2 أيام عمل",
  sameDayDaysEn: "Same Day (Order before 1:00 PM)",
  sameDayDaysAr: "نفس اليوم (للطلبات قبل الساعة 1:00 مساءً)",
  sameDayCutoffEn: "1:00 PM",
  sameDayCutoffAr: "1:00 مساءً"
};

// Helper to retrieve live shipping configuration with secure fallback
export function getShippingConfig(): ShippingConfig {
  try {
    const saved = localStorage.getItem('zoal_shipping_config');
    if (saved) {
      return { ...DEFAULT_SHIPPING_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading zoal_shipping_config from localStorage", e);
  }
  return DEFAULT_SHIPPING_CONFIG;
}

// Helper to commit shipping configuration to persistence
export function saveShippingConfig(config: ShippingConfig): void {
  try {
    localStorage.setItem('zoal_shipping_config', JSON.stringify(config));
    // Dispatch custom event to notify other mounted components in the single-page app
    window.dispatchEvent(new Event('zoal-shipping-config-changed'));
  } catch (e) {
    console.error("Error writing zoal_shipping_config to localStorage", e);
  }
}
