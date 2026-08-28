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

// Handle RTL direction when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Set initial direction based on detected language
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = i18n.language || 'en';

export default i18n;
