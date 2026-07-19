export interface ReturnsConfig {
  returnWindowDays: number;
  returnWindowDaysPromo: number;
  inspectionDaysEn: string;
  inspectionDaysAr: string;
  refundProcessingDaysEn: string;
  refundProcessingDaysAr: string;
  supportWhatsApp: string;
  supportEmail: string;
  supportPhone: string;
  supportAddressEn: string;
  supportAddressAr: string;
  supportHoursEn: string;
  supportHoursAr: string;
  exchangeOptionsEn: string[];
  exchangeOptionsAr: string[];
  nonReturnableEn: string[];
  nonReturnableAr: string[];
}

export const DEFAULT_RETURNS_CONFIG: ReturnsConfig = {
  returnWindowDays: 7,
  returnWindowDaysPromo: 14,
  inspectionDaysEn: "1–3 Business Days",
  inspectionDaysAr: "1-3 أيام عمل",
  refundProcessingDaysEn: "3–10 Business Days",
  refundProcessingDaysAr: "3-10 أيام عمل",
  supportWhatsApp: "+966 56 769 9315",
  supportEmail: "alzoal3003@gmail.com",
  supportPhone: "+966 56 769 9315",
  supportAddressEn: "Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia",
  supportAddressAr: "طريق أبو بكر الصديق، المعلمين، الهفوف 36361، المملكة العربية السعودية",
  supportHoursEn: "Daily: 9:00 AM – 11:00 PM (AST)",
  supportHoursAr: "يومياً: 9:00 صباحاً – 11:00 مساءً",
  exchangeOptionsEn: [
    "Different Size",
    "Different Color",
    "Replacement Item (subject to stock availability)"
  ],
  exchangeOptionsAr: [
    "مقاس مختلف",
    "لون مختلف",
    "منتج بديل (خاضع لتوفر المخزون)"
  ],
  nonReturnableEn: [
    "Food & Beverage (Fresh bakery, bread, cakes, pastries, cookies, opened coffee or tea)",
    "Cosmetics & Personal Care (Opened beauty, skincare, makeup, perfumes)",
    "Personalized or Custom-Tailored Thobes and altered items",
    "Digital Gift Cards & Final Clearance/Sale items",
    "Hygiene-sensitive items"
  ],
  nonReturnableAr: [
    "المأكولات والمشروبات (المخبوزات الطازجة، الخبز، الكعك، الحلويات، القهوة والشاي المفتوحة)",
    "مستحضرات التجميل والعناية الشخصية المفتوحة (منتجات العناية بالبشرة والمكياج والعطور المفتوحة)",
    "الثياب الفاخرة المفصلة خصيصاً بمقاسات معينة أو الملابس المعدلة",
    "بطاقات الهدايا الرقمية والمنتجات المشتراة في التصفية النهائية والخصومات",
    "المنتجات الحساسة لداعي الصحة والسلامة العامة والتعقيم"
  ]
};

export function getReturnsConfig(): ReturnsConfig {
  try {
    const saved = localStorage.getItem('zoal_returns_config');
    if (saved) {
      return { ...DEFAULT_RETURNS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading zoal_returns_config from localStorage", e);
  }
  return DEFAULT_RETURNS_CONFIG;
}

export function saveReturnsConfig(config: ReturnsConfig): void {
  try {
    localStorage.setItem('zoal_returns_config', JSON.stringify(config));
    window.dispatchEvent(new Event('zoal-returns-config-changed'));
  } catch (e) {
    console.error("Error writing zoal_returns_config to localStorage", e);
  }
}
