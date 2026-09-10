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

const RETURNS_CONFIG_STORAGE_KEY = 'zoal_returns_config';

function isValidReturnsConfig(value: unknown): value is ReturnsConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<ReturnsConfig>;
  return (
    typeof config.returnWindowDays === 'number' &&
    typeof config.returnWindowDaysPromo === 'number' &&
    typeof config.inspectionDaysEn === 'string' &&
    typeof config.inspectionDaysAr === 'string' &&
    typeof config.refundProcessingDaysEn === 'string' &&
    typeof config.refundProcessingDaysAr === 'string' &&
    typeof config.supportWhatsApp === 'string' &&
    typeof config.supportEmail === 'string' &&
    typeof config.supportPhone === 'string' &&
    typeof config.supportAddressEn === 'string' &&
    typeof config.supportAddressAr === 'string' &&
    typeof config.supportHoursEn === 'string' &&
    typeof config.supportHoursAr === 'string' &&
    Array.isArray(config.exchangeOptionsEn) &&
    Array.isArray(config.exchangeOptionsAr) &&
    Array.isArray(config.nonReturnableEn) &&
    Array.isArray(config.nonReturnableAr)
  );
}

function readCachedReturnsConfig(): ReturnsConfig {
  try {
    const saved = localStorage.getItem(RETURNS_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidReturnsConfig(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading zoal_returns_config from localStorage", e);
  }
  return DEFAULT_RETURNS_CONFIG;
}

export function getReturnsConfig(): ReturnsConfig {
  return readCachedReturnsConfig();
}

export function saveReturnsConfig(config: ReturnsConfig): void {
  try {
    localStorage.setItem(RETURNS_CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('zoal-returns-config-changed'));
  } catch (e) {
    console.error("Error writing zoal_returns_config to localStorage", e);
  }
}

// The Legal CMS is the authoritative source. localStorage remains only as a
// compatibility cache so existing admin screens and the return-request UI do
// not regress while the published Legal document is being fetched.
export async function hydrateReturnsConfigFromLegal(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const response = await fetch('/api/legal/documents/returns', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`Legal returns document request failed (HTTP ${response.status})`);
    }

    const document = await response.json();
    const versions = Array.isArray(document?.zoal_legal_document_versions)
      ? document.zoal_legal_document_versions
      : [];
    const currentVersion = document?.current_version || versions.find(
      (version: { id?: string; status?: string }) =>
        version.id === document?.current_version_id || version.status === 'Published'
    );

    if (!currentVersion || currentVersion.status !== 'Published') {
      throw new Error('Published Legal returns document is unavailable');
    }

    const parsed = typeof currentVersion.content === 'string'
      ? JSON.parse(currentVersion.content)
      : currentVersion.content;

    if (!isValidReturnsConfig(parsed)) {
      throw new Error('Published Legal returns document has an invalid configuration payload');
    }

    saveReturnsConfig(parsed);
    return true;
  } catch (e) {
    // Keep the last known local cache as a compatibility fallback. Never invent
    // new policy values when the authoritative Legal document cannot be read.
    console.error('Error hydrating returns config from Legal CMS:', e);
    return false;
  }
}
