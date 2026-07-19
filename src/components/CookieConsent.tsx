import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cookie, 
  X, 
  Settings, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Check, 
  Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CookieConsent() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Toggles inside custom banner settings
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    // Check if user has already set cookie preferences
    const stored = localStorage.getItem('zoal_cookie_preferences');
    if (!stored) {
      // Delay entrance slightly for ultra-smooth luxury effect
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.accepted) {
          setIsVisible(true);
        } else {
          // Sync internal toggles
          setAnalytics(parsed.analytics !== false);
          setMarketing(parsed.marketing !== false);
          setPreferences(parsed.preferences !== false);
        }
      } catch (e) {
        setIsVisible(true);
      }
    }

    // Listen to changes to hide the banner instantly if saved from the Policy page
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
      setIsVisible(true);
      setShowSettings(true);
    };

    window.addEventListener('zoal-cookie-preferences-changed', handlePreferencesChange);
    window.addEventListener('zoal-open-cookie-settings', handleOpenSettings);
    
    return () => {
      window.removeEventListener('zoal-cookie-preferences-changed', handlePreferencesChange);
      window.removeEventListener('zoal-open-cookie-settings', handleOpenSettings);
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
    
    // Notify other components (like the CookiePolicy page to sync its toggles)
    window.dispatchEvent(new Event('zoal-cookie-preferences-changed'));
  };

  const handleAcceptAll = () => {
    savePreferences(true, true, true);
  };

  const handleRejectOptional = () => {
    savePreferences(false, false, false);
  };

  const handleSaveSelected = () => {
    savePreferences(analytics, marketing, preferences);
  };

  const navigateToPolicy = () => {
    const event = new CustomEvent('zoal-route-change', { detail: 'cookies' });
    window.dispatchEvent(event);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="zoal-cookie-consent-banner"
          initial={{ opacity: 0, y: 100, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[100] bg-[#030303]/95 backdrop-blur-md border border-[#D4AF37]/35 p-5 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_20px_rgba(212,175,55,0.06)] overflow-hidden"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top subtle golden decoration bar */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          {/* Double border inside frame */}
          <div className="absolute inset-1 pointer-events-none border border-white/5 rounded-xs" />

          <div className="relative z-10">
            {/* Header / Dismiss row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-gold-pure/5 border border-gold-pure/15 text-gold-pure shrink-0">
                  <Cookie className="w-4 h-4 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.25em] font-display font-semibold text-white">
                  {isAr ? 'خصوصية كوكيز زول' : 'ZOAL Cookies & Privacy'}
                </span>
              </div>
              <button 
                onClick={handleRejectOptional}
                className="text-zinc-500 hover:text-white transition-colors p-1 shrink-0"
                title={isAr ? 'إغلاق وحظر الاختيارية' : 'Close and reject optional'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Message */}
            <p className="text-zinc-400 text-[11px] leading-relaxed mb-4 font-sans text-left rtl:text-right">
              {isAr 
                ? 'نحن نستخدم ملفات تعريف الارتباط الآمنة لتحسين تجربة التسوق الخاصة بك، وتعزيز أداء الموقع وتخصيص المحتوى. يمكنك إدارة تفضيلاتك في أي وقت.' 
                : 'We use cookies to improve your shopping experience, enhance website performance, and personalize content. You can manage your cookie preferences at any time.'
              }
            </p>

            {/* EXPANDABLE QUICK SETTINGS VIEW */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-white/5 mb-4 pt-3.5 space-y-2.5"
                >
                  <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-mono block pb-1">
                    {isAr ? 'تخصيص ملفات الارتباط' : 'Customize Preferences'}
                  </span>
                  
                  {/* Toggle: Essential (always enabled) */}
                  <div className="flex items-center justify-between p-2 rounded-xs bg-white/5 text-[10.5px]">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-gold-pure" />
                      {isAr ? 'الأساسية (مطلوبة)' : 'Essential (Required)'}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-gold-pure/70">
                      {isAr ? 'نشطة دائماً' : 'Always Active'}
                    </span>
                  </div>

                  {/* Toggle: Analytics */}
                  <div className="flex items-center justify-between p-2 rounded-xs bg-black/40 border border-white/5 text-[10.5px]">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-zinc-500" />
                      {isAr ? 'التحليلات والأداء' : 'Analytics & Performance'}
                    </span>
                    <button
                      onClick={() => setAnalytics(!analytics)}
                      className="relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: analytics ? '#D4AF37' : '#1f1f23' }}
                    >
                      <span
                        className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                        style={{ transform: isAr ? (analytics ? 'translateX(-1rem)' : 'translateX(0)') : (analytics ? 'translateX(1rem)' : 'translateX(0)') }}
                      />
                    </button>
                  </div>

                  {/* Toggle: Marketing */}
                  <div className="flex items-center justify-between p-2 rounded-xs bg-black/40 border border-white/5 text-[10.5px]">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                      {isAr ? 'التسويق والتتبع' : 'Marketing & Ads'}
                    </span>
                    <button
                      onClick={() => setMarketing(!marketing)}
                      className="relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: marketing ? '#D4AF37' : '#1f1f23' }}
                    >
                      <span
                        className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                        style={{ transform: isAr ? (marketing ? 'translateX(-1rem)' : 'translateX(0)') : (marketing ? 'translateX(1rem)' : 'translateX(0)') }}
                      />
                    </button>
                  </div>

                  {/* Toggle: Preference */}
                  <div className="flex items-center justify-between p-2 rounded-xs bg-black/40 border border-white/5 text-[10.5px]">
                    <span className="text-zinc-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-zinc-500" />
                      {isAr ? 'حفظ التفضيلات' : 'Save Layout Choices'}
                    </span>
                    <button
                      onClick={() => setPreferences(!preferences)}
                      className="relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      style={{ backgroundColor: preferences ? '#D4AF37' : '#1f1f23' }}
                    >
                      <span
                        className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-black shadow-lg ring-0 transition duration-200 ease-in-out"
                        style={{ transform: isAr ? (preferences ? 'translateX(-1rem)' : 'translateX(0)') : (preferences ? 'translateX(1rem)' : 'translateX(0)') }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={navigateToPolicy}
                      className="text-[9px] font-mono text-zinc-500 hover:text-gold-pure underline"
                    >
                      {isAr ? 'عرض السياسة الكاملة' : 'View Full Policy Details'}
                    </button>
                    <button
                      onClick={handleSaveSelected}
                      className="px-3.5 py-1.5 text-[9px] font-mono uppercase tracking-widest text-black bg-gold-pure hover:bg-white transition-colors rounded-xs"
                    >
                      {isAr ? 'حفظ التفضيلات' : 'Save Selection'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-3 py-2 text-[9.5px] font-mono uppercase tracking-widest border border-white/5 hover:border-white/15 bg-zinc-950/40 text-zinc-400 hover:text-white rounded-xs cursor-pointer flex items-center gap-1.5 select-none"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-gold-pure" />
                <span>{isAr ? 'إعدادات الكوكيز' : 'Cookie Settings'}</span>
              </button>

              <button
                onClick={handleRejectOptional}
                className="px-3 py-2 text-[9.5px] font-mono uppercase tracking-widest border border-white/5 hover:border-white/15 bg-zinc-950/40 text-zinc-400 hover:text-white rounded-xs cursor-pointer select-none"
              >
                {isAr ? 'رفض الاختيارية' : 'Reject Optional'}
              </button>

              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-[9.5px] font-mono uppercase tracking-widest text-black font-semibold bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white transition-all duration-300 rounded-xs cursor-pointer shadow-md shadow-gold-pure/5 select-none"
              >
                {isAr ? 'قبول الكل' : 'Accept All'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
