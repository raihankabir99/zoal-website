import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cookie, 
  X, 
  Settings, 
  ShieldCheck, 
  BarChart2, 
  Sparkles, 
  Sliders, 
  Lock,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CookieConsent() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Custom preference toggle states
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    // Check if user has already stored consent
    const stored = localStorage.getItem('zoal_cookie_preferences');
    if (!stored) {
      // Show banner on first visit
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.accepted) {
          setIsVisible(true);
        } else {
          // Sync internal toggle states
          setAnalytics(parsed.analytics !== false);
          setMarketing(parsed.marketing !== false);
          setPreferences(parsed.preferences !== false);
        }
      } catch (e) {
        setIsVisible(true);
      }
    }

    // Listen to external events (e.g. from footer link or policy page to re-open settings)
    const handleOpenSettings = () => {
      const current = localStorage.getItem('zoal_cookie_preferences');
      if (current) {
        try {
          const parsed = JSON.parse(current);
          setAnalytics(parsed.analytics !== false);
          setMarketing(parsed.marketing !== false);
          setPreferences(parsed.preferences !== false);
        } catch (e) {
          // ignore
        }
      }
      setShowModal(true);
    };

    const handlePreferencesChange = () => {
      const updated = localStorage.getItem('zoal_cookie_preferences');
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          if (parsed.accepted) {
            setIsVisible(false);
            setAnalytics(parsed.analytics !== false);
            setMarketing(parsed.marketing !== false);
            setPreferences(parsed.preferences !== false);
          }
        } catch (e) {
          // ignore
        }
      }
    };

    window.addEventListener('zoal-open-cookie-settings', handleOpenSettings);
    window.addEventListener('zoal-cookie-preferences-changed', handlePreferencesChange);

    return () => {
      window.removeEventListener('zoal-open-cookie-settings', handleOpenSettings);
      window.removeEventListener('zoal-cookie-preferences-changed', handlePreferencesChange);
    };
  }, []);

  const savePreferences = (analyticsVal: boolean, marketingVal: boolean, preferencesVal: boolean) => {
    const prefs = {
      accepted: true,
      essential: true,
      analytics: analyticsVal,
      marketing: marketingVal,
      preferences: preferencesVal,
      timestamp: Date.now()
    };
    localStorage.setItem('zoal_cookie_preferences', JSON.stringify(prefs));
    setIsVisible(false);
    setShowModal(false);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('zoal-cookie-preferences-changed'));
  };

  const handleAcceptAll = () => {
    savePreferences(true, true, true);
  };

  const handleEssentialOnly = () => {
    savePreferences(false, false, false);
  };

  const handleSaveModalPreferences = () => {
    savePreferences(analytics, marketing, preferences);
  };

  return (
    <>
      {/* 1. LUXURY BOTTOM COOKIE BANNER */}
      <AnimatePresence>
        {isVisible && !showModal && (
          <motion.div
            id="zoal-cookie-consent-banner"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md md:left-6 md:bottom-6 md:translate-x-0 md:w-full z-[100] bg-[#030303] text-white border border-[#D4AF37] p-5 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.1)] overflow-hidden"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Top gold accent thread line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] shrink-0 border border-[#D4AF37]/20">
                  <Cookie className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                  {isAr ? 'الخصوصية وملفات تعريف الارتباط' : 'Privacy & Cookies'}
                </h3>
              </div>
              <button 
                onClick={handleEssentialOnly}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-sm shrink-0"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-zinc-300 text-xs leading-relaxed mb-4 font-sans text-left rtl:text-right">
              {isAr 
                ? 'نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح الخاصة بك، وتخصيص المحتوى، وتحليل حركة مرور الموقع، وتوفير تجربة تسوق أفضل.'
                : 'We use cookies to improve your browsing experience, personalise content, analyse website traffic, and provide a better shopping experience.'
              }
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs font-mono text-zinc-400 hover:text-[#D4AF37] underline transition-colors cursor-pointer self-start sm:self-center"
              >
                {isAr ? 'إعدادات الكوكيز' : 'Cookie Settings'}
              </button>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 rounded-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'الأساسية فقط' : 'Essential Only'}
                </button>
                <button
                  type="button"
                  onClick={handleEssentialOnly}
                  className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900 border border-white/10 hover:border-white/20 rounded-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {isAr ? 'رفض الكل' : 'Reject All'}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-black font-semibold bg-[#D4AF37] hover:bg-[#e0b83e] rounded-md transition-all cursor-pointer shadow-md shadow-[#D4AF37]/10 whitespace-nowrap"
                >
                  {isAr ? 'قبول الكل' : 'Accept All'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. LIGHTWEIGHT PREFERENCES MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-lg bg-[#0a0a0a] text-white border border-[#D4AF37] p-6 rounded-lg shadow-2xl overflow-hidden"
            >
              {/* Top gold bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37]">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold uppercase tracking-wider text-white">
                      {isAr ? 'تفضيلات ملفات تعريف الارتباط' : 'Privacy & Cookie Preferences'}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">AL ZOAL AL RAQI Sovereign Experience</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Toggles List */}
              <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. Essential Cookies */}
                <div className="p-3.5 rounded-md bg-zinc-900/80 border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                        {isAr ? 'ملفات تعريف الارتباط الأساسية' : 'Essential Cookies'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {isAr 
                        ? 'ضرورية لعمل الموقع بشكل صحيح، بما في ذلك الأمان والسلة وتسجيل الدخول.'
                        : 'Necessary for the website to function properly, including security, shopping cart, and authentication.'
                      }
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded border border-[#D4AF37]/20 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {isAr ? 'مُفعّلة دائماً' : 'Always Enabled'}
                  </span>
                </div>

                {/* 2. Analytics Cookies */}
                <div className="p-3.5 rounded-md bg-zinc-900/50 border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                        {isAr ? 'ملفات تحليلات الأداء' : 'Analytics Cookies'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {isAr 
                        ? 'تساعدنا في فهم كيفية استخدام الزوار للموقع لتحسين الأداء والخدمة.'
                        : 'Help us understand how visitors interact with the website to improve user experience and performance.'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnalytics(!analytics)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center"
                    style={{ backgroundColor: analytics ? '#D4AF37' : '#27272a' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                      style={{ transform: analytics ? (isAr ? 'translateX(-1rem)' : 'translateX(1rem)') : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {/* 3. Marketing Cookies */}
                <div className="p-3.5 rounded-md bg-zinc-900/50 border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                        {isAr ? 'ملفات التسويق' : 'Marketing Cookies'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {isAr 
                        ? 'تُستخدم لتقديم إعلانات وعروض مخصصة تتناسب مع اهتماماتك.'
                        : 'Used to deliver tailored advertisements and offer luxury recommendations based on your preferences.'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMarketing(!marketing)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center"
                    style={{ backgroundColor: marketing ? '#D4AF37' : '#27272a' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                      style={{ transform: marketing ? (isAr ? 'translateX(-1rem)' : 'translateX(1rem)') : 'translateX(0)' }}
                    />
                  </button>
                </div>

                {/* 4. Preference Cookies */}
                <div className="p-3.5 rounded-md bg-zinc-900/50 border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                        {isAr ? 'ملفات التفضيلات الشخصية' : 'Preference Cookies'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      {isAr 
                        ? 'تسمح للموقع بتذكر خياراتك مثل اللغة والعملة والنسق المفضل.'
                        : 'Allow the website to remember choices you make such as language, currency, and theme preferences.'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferences(!preferences)}
                    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-center"
                    style={{ backgroundColor: preferences ? '#D4AF37' : '#27272a' }}
                  >
                    <span
                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                      style={{ transform: preferences ? (isAr ? 'translateX(-1rem)' : 'translateX(1rem)') : 'translateX(0)' }}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSaveModalPreferences}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900 border border-white/15 hover:border-white/30 rounded-md transition-all cursor-pointer text-center"
                >
                  {isAr ? 'حفظ التفضيلات' : 'Save Preferences'}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-black font-semibold bg-[#D4AF37] hover:bg-[#e0b83e] rounded-md transition-all cursor-pointer shadow-md shadow-[#D4AF37]/10 text-center"
                >
                  {isAr ? 'قبول الكل' : 'Accept All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
