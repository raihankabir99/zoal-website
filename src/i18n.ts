import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files are large. I will inline some core strings here.
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

function getInitialLanguage(): 'ar' | 'en' {
  if (typeof window !== 'undefined') {
    try {
      // 1. Existing persisted user language preference
      const saved =
        localStorage.getItem('zoal_language') ||
        localStorage.getItem('i18nextLng') ||
        sessionStorage.getItem('zoal_language') ||
        sessionStorage.getItem('i18nextLng');

      if (saved) {
        const normalizedSaved = saved.trim().toLowerCase();
        if (normalizedSaved === 'ar' || normalizedSaved.startsWith('ar-')) {
          return 'ar';
        }
        if (normalizedSaved === 'en' || normalizedSaved.startsWith('en-')) {
          return 'en';
        }
      }

      // 2. Browser language preference fallback
      const navLangs: readonly string[] =
        navigator.languages && navigator.languages.length > 0
          ? navigator.languages
          : navigator.language
          ? [navigator.language]
          : [];

      for (const lang of navLangs) {
        if (!lang) continue;
        const normalized = lang.trim().toLowerCase();
        if (normalized === 'ar' || normalized.startsWith('ar-')) {
          return 'ar';
        }
        if (normalized === 'en' || normalized.startsWith('en-')) {
          return 'en';
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }

  // 3. Existing application default
  return 'en';
}

const initialLng = getInitialLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      ar: {
        translation: arTranslations,
      },
    },
    lng: initialLng,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'sessionStorage', 'navigator'],
      lookupLocalStorage: 'zoal_language',
      lookupSessionStorage: 'zoal_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

/**
 * Load only published CMS-managed global strings.
 * Existing JSON resources remain the authoritative fallback when the API is unavailable.
 * Product/blog/page/hero/branding content is intentionally excluded from this resolver.
 */
async function loadPublishedGlobalStrings(locale: 'en' | 'ar'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch(`/api/texts?locale=${encodeURIComponent(locale)}&status=published`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return;

    const payload = await response.json();
    const rows = Array.isArray(payload?.texts) ? payload.texts : [];
    if (rows.length === 0) return;

    const registry: Record<string, string> = {};
    for (const row of rows) {
      if (!row || typeof row.key !== 'string' || typeof row.value !== 'string') continue;
      registry[row.key] = row.value;
    }

    if (Object.keys(registry).length > 0) {
      i18n.addResourceBundle(locale, 'translation', registry, false, true);
    }
  } catch {
    // Cloud registry is an additive enhancement; preserve static i18n fallback on failure.
  }
}

// Load cloud-managed published strings without delaying application startup.
if (typeof window !== 'undefined') {
  void loadPublishedGlobalStrings(initialLng);
}

// Handle RTL direction when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  if (lng === 'ar' || lng === 'en') {
    void loadPublishedGlobalStrings(lng);
  }
});

// Set initial direction based on detected language
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language || 'en';

export default i18n;
