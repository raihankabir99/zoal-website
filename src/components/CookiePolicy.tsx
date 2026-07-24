import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cookie, 
  Eye, 
  Shield, 
  Check, 
  Database, 
  Lock, 
  Sparkles, 
  Printer, 
  ArrowUp, 
  ChevronDown, 
  BookOpen, 
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Settings,
  Info,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cookiesSections, CookieSection } from '../data/cookiesData';
import { contactDetails } from '../data/privacyData';
import { useBranding } from './BrandingContext';

const getSectionIcon = (iconName: string, className = "w-5 h-5 text-gold-pure") => {
  switch (iconName) {
    case 'Cookie': return <Cookie className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Check': return <Check className={className} />;
    case 'Database': return <Database className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Mail': return <Mail className={className} />;
    default: return <Cookie className={className} />;
  }
};

export default function CookiePolicy() {
  const { i18n, t } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<string>('what-are-cookies');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Cookie Preference States
  const [prefAnalytics, setPrefAnalytics] = useState(true);
  const [prefMarketing, setPrefMarketing] = useState(true);
  const [prefPreferences, setPrefPreferences] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  const getBrowserName = () => {
    if (typeof window === 'undefined' || !navigator) return "Secure Browser";
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Edg")) return "Apple Safari";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Edg")) return "Microsoft Edge";
    return "Secure Browser";
  };

  const updateLastSaved = () => {
    const stored = localStorage.getItem('zoal_cookie_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp) {
          const date = new Date(parsed.timestamp);
          setLastSavedTime(
            date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }) + ' ' + 
            date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          );
          return;
        }
      } catch (e) {
        // ignore
      }
    }
    setLastSavedTime(isAr ? 'لم يُحفظ بعد' : 'Not Saved Yet');
  };

  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  const lastUpdatedDate = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', options);
  }, [isAr]);

  // Load saved cookie preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zoal_cookie_preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPrefAnalytics(parsed.analytics !== false);
        setPrefMarketing(parsed.marketing !== false);
        setPrefPreferences(parsed.preferences !== false);
      } catch (e) {
        console.error('Error parsing cookie preferences:', e);
      }
    }
    updateLastSaved();

    // Sync state if localStorage changes from elsewhere (e.g. cookie consent banner)
    const handleSync = () => {
      const updated = localStorage.getItem('zoal_cookie_preferences');
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          setPrefAnalytics(parsed.analytics !== false);
          setPrefMarketing(parsed.marketing !== false);
          setPrefPreferences(parsed.preferences !== false);
        } catch (e) {
          // ignore
        }
      }
      updateLastSaved();
    };

    window.addEventListener('zoal-cookie-preferences-changed', handleSync);
    return () => window.removeEventListener('zoal-cookie-preferences-changed', handleSync);
  }, [isAr]);

  // Save Cookie Preferences
  const handleSavePreferences = (analytics: boolean, marketing: boolean, preferences: boolean) => {
    const prefs = {
      accepted: true,
      essential: true,
      analytics,
      marketing,
      preferences,
      timestamp: Date.now()
    };
    localStorage.setItem('zoal_cookie_preferences', JSON.stringify(prefs));
    setPrefAnalytics(analytics);
    setPrefMarketing(marketing);
    setPrefPreferences(preferences);
    
    // Dispatch synchronization event
    window.dispatchEvent(new Event('zoal-cookie-preferences-changed'));

    // Trigger visual success state
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAcceptAll = () => {
    handleSavePreferences(true, true, true);
  };

  const handleRejectOptional = () => {
    handleSavePreferences(false, false, false);
  };

  const handleSaveSelected = () => {
    handleSavePreferences(prefAnalytics, prefMarketing, prefPreferences);
  };

  // SEO Optimization & Structured Data Injection
  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const seoTitle = isAr 
      ? 'سياسة ملفات تعريف الارتباط | زول - الفخامة والأناقة' 
      : 'Cookie Policy | ZOAL - Curated Heritage & Luxury';
    const seoDescription = isAr
      ? 'اقرأ سياسة ملفات تعريف الارتباط لمتجر زول الفاخر. نوضح كيف نقوم بتخصيص وتحسين سرعة وأمان تصفحك باستخدام ملفات الكوكيز والخيارات المتاحة لك.'
      : 'Understand the ZOAL Cookie Policy. Learn about our use of secure cookies to enrich page speeds, recall preference settings, and safeguard login and shopping sessions.';
    
    document.title = seoTitle;

    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoDescription);

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/cookie-policy`);

    // Open Graph Metadata
    const ogTags = [
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'ZOAL' },
      { property: 'og:url', content: `${window.location.origin}/cookie-policy` }
    ];

    const createdOgElements: HTMLMetaElement[] = [];
    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
        createdOgElements.push(element as HTMLMetaElement);
      }
      element.setAttribute('content', tag.content);
    });

    // Schema Structured Data
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": seoTitle,
      "description": seoDescription,
      "publisher": {
        "@type": "Organization",
        "name": settings.businessName,
        "logo": {
          "@type": "ImageObject",
          "url": settings.businessLogo.startsWith('http') ? settings.businessLogo : window.location.origin + settings.businessLogo
        }
      },
      "mainEntityOfPage": `${window.location.origin}/cookie-policy`,
      "about": {
        "@type": "Thing",
        "name": "Cookie Policy"
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-cookies-schema-json';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    return () => {
      document.title = originalTitle;
      if (descMeta) {
        descMeta.setAttribute('content', originalMetaDesc);
      }
      createdOgElements.forEach(el => el.remove());
      document.getElementById('zoal-cookies-schema-json')?.remove();
    };
  }, [isAr]);

  // Handle Scroll Progress and Section Tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      setShowScrollTop(scrollTop > 400);

      const scrollPosition = scrollTop + 160;
      
      let currentActiveSection = 'what-are-cookies';
      for (const section of cookiesSections) {
        const element = sectionsRef.current[section.id];
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActiveSection = section.id;
            break;
          }
        }
      }
      setActiveSectionId(currentActiveSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = sectionsRef.current[id];
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth'
      });
      setActiveSectionId(id);
      setMobileTOCExpanded(false);
    }
  };

  const copySectionLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/cookie-policy#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const navigateToPage = (pageName: string) => {
    const event = new CustomEvent('zoal-route-change', { detail: pageName });
    window.dispatchEvent(event);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className="bg-black text-white min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative"
      id="zoal-cookies-page"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Reading Progress Indicator Bar */}
      <div className="fixed top-[64px] sm:top-[72px] left-0 right-0 h-[3px] bg-white/5 z-50 print:hidden">
        <div 
          className="h-full bg-gradient-to-r from-gold-dark via-[#D4AF37] to-white transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Luxury Badge Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-4 print:hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-display font-semibold text-gold-pure">
              {isAr ? 'حماية سيادة البيانات والخصوصية الكوكيز' : 'Digital Privacy Framework'}
            </span>
          </div>
        </motion.div>

        {/* Page Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-4xl font-display font-medium text-white tracking-[0.2em] uppercase mb-4"
          >
            {isAr ? 'سياسة ملفات تعريف الارتباط' : 'Cookie Policy'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-5" />
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-sans"
          >
            {isAr 
              ? 'توضح سياسة ملفات تعريف الارتباط هذه كيف نستخدم الكوكيز والتقنيات المشابهة لتعزيز تجربتكم وتسهيل عمليات الشراء والتحميل وحفظ خيارات العرض المعتمدة.' 
              : 'This Cookie Policy explains how ZOAL uses cookies and similar technologies to improve your browsing experience, provide essential website functionality, and personalize our services.'
            }
          </motion.p>

          {/* Last Updated badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold-pure/80" />
              {isAr ? `آخر تحديث: ${lastUpdatedDate}` : `Last Updated: ${lastUpdatedDate}`}
            </span>
            <span className="text-zinc-800">|</span>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-gold-pure transition-colors duration-300 print:hidden cursor-pointer"
              title={isAr ? 'طباعة هذه الصفحة' : 'Print this page'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل كملف PDF / طباعة' : 'Save PDF / Print'}</span>
            </button>
          </motion.div>
        </div>

        {/* Mobile Sticky Table of Contents Trigger */}
        <div className="md:hidden sticky top-20 z-40 mb-6 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-zinc-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <span className="text-xs uppercase font-mono tracking-wider">
                  {isAr ? 'أقسام ملفات الارتباط' : 'Cookie Policy Sections'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: mobileTOCExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </motion.div>
            </button>

            <AnimatePresence>
              {mobileTOCExpanded && (
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-white/5 max-h-[300px] overflow-y-auto"
                >
                  <div className="p-3 grid grid-cols-1 gap-2 bg-black/40">
                    {cookiesSections.map((sect) => {
                      const isActive = activeSectionId === sect.id;
                      return (
                        <button
                          key={sect.id}
                          onClick={() => scrollToSection(sect.id)}
                          className={`text-left px-3 py-2 rounded-xs text-[11px] font-mono uppercase tracking-wider flex items-center justify-between transition-all ${
                            isActive 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-l-2 border-[#D4AF37] pl-2 font-semibold' 
                              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{isAr ? sect.title.ar : sect.title.en}</span>
                          {getSectionIcon(sect.icon, "w-3 h-3 text-gold-pure/60 shrink-0")}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Master Content Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT SIDEBAR: STICKY TABLE OF CONTENTS (Desktop Only) */}
          <div className="hidden md:block md:col-span-4 sticky top-28 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent print:hidden">
            <div className="bg-[#050505]/60 border border-white/5 rounded-sm p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
              
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <h3 className="text-white text-xs uppercase tracking-widest font-semibold font-display">
                  {isAr ? 'فهرس المحتويات' : 'Table of Contents'}
                </h3>
              </div>

              <div className="space-y-1">
                {cookiesSections.map((sect) => {
                  const isActive = activeSectionId === sect.id;
                  return (
                    <button
                      key={sect.id}
                      onClick={() => scrollToSection(sect.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-sm text-[10.5px] font-mono uppercase tracking-wider flex items-center justify-between transition-all duration-300 border border-transparent ${
                        isActive 
                          ? 'bg-[#D4AF37]/5 text-[#D4AF37] border-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] font-semibold' 
                          : 'text-zinc-400 hover:text-white hover:border-white/5'
                      }`}
                    >
                      <span className="truncate pr-2">{isAr ? sect.title.ar : sect.title.en}</span>
                      {getSectionIcon(sect.icon, `w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'text-gold-pure scale-110' : 'text-zinc-600'}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: POLICY CONTENT BLOCKS */}
          <div className="md:col-span-8 space-y-8 print:w-full">
            {cookiesSections.map((section, idx) => {
              const isActive = activeSectionId === section.id;
              const hasList = section.list && (isAr ? section.list.ar : section.list.en);

              return (
                <section
                  key={section.id}
                  id={section.id}
                  ref={(el) => { sectionsRef.current[section.id] = el; }}
                  className="scroll-mt-28 print:break-inside-avoid"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: Math.min(idx * 0.05, 0.3) }}
                    className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                      isActive 
                        ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Top glowing bar on active section */}
                    <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                      isActive ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                    }`} />

                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full border transition-all duration-500 ${
                          isActive 
                            ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                            : 'bg-white/5 border-transparent text-zinc-400'
                        }`}>
                          {getSectionIcon(section.icon, "w-4 h-4 sm:w-5 h-5")}
                        </div>
                        <h2 className={`text-sm sm:text-base font-display uppercase tracking-widest font-semibold transition-colors duration-500 ${
                          isActive ? 'text-gold-pure' : 'text-white'
                        }`}>
                          {isAr ? section.title.ar : section.title.en}
                        </h2>
                      </div>

                      {/* Share link button */}
                      <div className="flex items-center gap-1.5 print:hidden">
                        <button
                          onClick={(e) => copySectionLink(section.id, e)}
                          className="p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer relative group"
                          title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                        >
                          <AnimatePresence mode="wait">
                            {copiedId === section.id ? (
                              <motion.div
                                key="copied"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </div>

                    {/* Section Text Content */}
                    <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-sans">
                      {isAr ? section.content.ar : section.content.en}
                    </p>

                    {/* SPECIAL IMPLEMENTATIONS FOR SPECIFIC SECTIONS */}
                    
                    {/* SECTION 2: Types of Cookies Card Grid */}
                    {section.id === 'types-we-use' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {[
                          {
                            title: isAr ? 'ملفات الارتباط الأساسية' : 'Essential Cookies',
                            status: isAr ? 'دائماً نشطة (مطلوبة)' : 'Always Active (Required)',
                            statusColor: 'text-[#D4AF37]',
                            bgColor: 'bg-[#D4AF37]/5',
                            borderStyle: 'border-gold-pure/20',
                            desc: isAr 
                              ? 'حيوية لأمان الجلسة وتعبئة السلة وإتمام عمليات الدفع.' 
                              : 'Crucial for secure user sessions, cart management, and seamless payments.',
                            icon: <Shield className="w-4 h-4 text-[#D4AF37]" />
                          },
                          {
                            title: isAr ? 'ملفات الارتباط التحليلية' : 'Analytics Cookies',
                            status: isAr ? 'اختيارية' : 'Optional',
                            statusColor: 'text-zinc-400',
                            bgColor: 'bg-white/5',
                            borderStyle: 'border-white/5',
                            desc: isAr 
                              ? 'لقياس حركة التصفح واكتشاف مشكلات التحميل ورفع الأداء.' 
                              : 'Measures visitor flow, loading bugs, and page speeds to improve layouts.',
                            icon: <Database className="w-4 h-4 text-zinc-400" />
                          },
                          {
                            title: isAr ? 'ملفات الارتباط التسويقية' : 'Marketing Cookies',
                            status: isAr ? 'اختيارية' : 'Optional',
                            statusColor: 'text-zinc-400',
                            bgColor: 'bg-white/5',
                            borderStyle: 'border-white/5',
                            desc: isAr 
                              ? 'إعلانات وحملات ترويجية مخصصة وموجهة تناسب اهتماماتكم.' 
                              : 'Tracks ad campaign performance to serve tailored social and search promotions.',
                            icon: <Sparkles className="w-4 h-4 text-zinc-400" />
                          },
                          {
                            title: isAr ? 'ملفات الارتباط للتفضيلات' : 'Preference Cookies',
                            status: isAr ? 'اختيارية' : 'Optional',
                            statusColor: 'text-zinc-400',
                            bgColor: 'bg-white/5',
                            borderStyle: 'border-white/5',
                            desc: isAr 
                              ? 'تتذكر لغتكم المختارة وعملتكم والوضع المعتمد تلقائياً.' 
                              : 'Recalls user preferred language, local currency, and layout states.',
                            icon: <Check className="w-4 h-4 text-zinc-400" />
                          }
                        ].map((card, cardIdx) => (
                          <div 
                            key={cardIdx} 
                            className={`p-5 rounded-xs border ${card.borderStyle} ${card.bgColor} backdrop-blur-sm shadow-md flex flex-col justify-between`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-full bg-white/5 text-zinc-300">
                                  {card.icon}
                                </div>
                                <h4 className="text-white text-xs font-semibold font-display uppercase tracking-wider">{card.title}</h4>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">{card.desc}</p>
                            </div>
                            <span className={`text-[9px] font-mono uppercase tracking-widest mt-4 block ${card.statusColor}`}>
                              • {card.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SECTION 7: INTERACTIVE PREFERENCE CONTROL DASHBOARD */}
                    {section.id === 'managing-preferences' && (
                      <div className="mt-8 space-y-8">
                        {/* Premium Section Title */}
                        <div className="p-6 sm:p-8 rounded-sm border border-gold-pure/15 bg-zinc-950/40 relative overflow-hidden text-center space-y-3">
                          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-gold-pure/30 to-transparent" />
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
                            <Settings className="w-3.5 h-3.5 text-gold-pure animate-spin-slow" />
                            <span className="text-[9px] font-mono tracking-[0.2em] font-bold text-gold-pure uppercase">
                              {isAr ? 'مركز التحكم بالخصوصية' : 'Privacy Control'}
                            </span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-display font-light text-white tracking-widest uppercase">
                            {isAr ? 'مركز تفضيلات ملفات تعريف الارتباط' : 'Cookie Preference Center'}
                          </h3>
                          <p className="text-zinc-500 text-[11px] max-w-xl mx-auto font-sans leading-relaxed">
                            {isAr 
                              ? 'تحكّم في هويتك الرقمية ومستويات الخصوصية في متجر زول. اختر بحرية نوع البيانات التي ترغب في تمكين تتبعها وحفظها.' 
                              : 'Exercise sovereignty over your digital imprint. Configure and lock down your preferred cookie permission parameters.'
                            }
                          </p>
                        </div>

                        {/* Four Preference Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Card 1: Essential Cookies */}
                          <div className="bg-zinc-950/60 border border-gold-pure/20 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden group hover:border-gold-pure/40 transition-all duration-300 text-left rtl:text-right">
                            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-gold-pure/20 to-transparent" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-gold-pure/5 border border-gold-pure/20 text-gold-pure">
                                  <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-display font-semibold tracking-wider text-white uppercase">
                                  {isAr ? 'ملفات الارتباط الأساسية' : 'Essential Cookies'}
                                </h4>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                                {isAr 
                                  ? 'ملفات تعريف ارتباط أساسية ضرورية لتشغيل الموقع الإلكتروني، وإدارة الجلسات وحماية الأمان.' 
                                  : 'Required for core site performance, transaction safety, and structural integrity. Cannot be deactivated.'
                                }
                              </p>

                              {/* Checklist */}
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-mono text-zinc-400 border-t border-white/5 pt-3">
                                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>{isAr ? 'تسجيل دخول آمن' : 'Secure Login'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>{isAr ? 'عربة التسوق' : 'Shopping Cart'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>{isAr ? 'إتمام الدفع' : 'Checkout'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#D4AF37]">
                                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>{isAr ? 'الأمان' : 'Security'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#D4AF37] col-span-2">
                                  <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                                  <span>{isAr ? 'حماية من الاحتيال' : 'Fraud Protection'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] bg-gold-pure/10 border border-gold-pure/20 px-2.5 py-1 rounded-full">
                                {isAr ? 'نشطة دائماً' : 'Always Active'}
                              </span>
                              {/* Disabled toggle (locked) */}
                              <div className="relative inline-flex h-5 w-10 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gold-pure/30 transition-colors opacity-50">
                                <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-200" style={{ transform: isAr ? 'translateX(-1.25rem)' : 'translateX(1.25rem)' }} />
                              </div>
                            </div>
                          </div>

                          {/* Card 2: Analytics Cookies */}
                          <div className="bg-zinc-950/60 border border-white/5 hover:border-gold-pure/30 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden group transition-all duration-300 text-left rtl:text-right">
                            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-400 group-hover:text-gold-pure transition-colors">
                                  <Database className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-display font-semibold tracking-wider text-white uppercase">
                                  {isAr ? 'ملفات الارتباط التحليلية' : 'Analytics Cookies'}
                                </h4>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                                {isAr 
                                  ? 'تساعدنا على قياس وتحسين أداء الموقع الإلكتروني وفهم سلوك الزوار المجهولين بشكل عام.' 
                                  : 'Improve website performance and understand anonymous visitor behavior.'
                                }
                              </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                              <span className={`text-[9px] font-mono uppercase tracking-widest ${prefAnalytics ? 'text-gold-pure font-semibold' : 'text-zinc-600'}`}>
                                {prefAnalytics ? (isAr ? 'نشطة (مسموح)' : 'Active (ON)') : (isAr ? 'غير نشطة (محظور)' : 'Inactive (OFF)')}
                              </span>
                              {/* Toggle switch */}
                              <button
                                onClick={() => setPrefAnalytics(!prefAnalytics)}
                                className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none"
                                style={{ backgroundColor: prefAnalytics ? '#D4AF37' : '#18181b' }}
                              >
                                <span
                                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-300 ease-in-out"
                                  style={{ transform: isAr ? (prefAnalytics ? 'translateX(-1.25rem)' : 'translateX(0)') : (prefAnalytics ? 'translateX(1.25rem)' : 'translateX(0)') }}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Card 3: Marketing Cookies */}
                          <div className="bg-zinc-950/60 border border-white/5 hover:border-gold-pure/30 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden group transition-all duration-300 text-left rtl:text-right">
                            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-400 group-hover:text-gold-pure transition-colors">
                                  <Sparkles className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-display font-semibold tracking-wider text-white uppercase">
                                  {isAr ? 'ملفات الارتباط التسويقية' : 'Marketing Cookies'}
                                </h4>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                                {isAr 
                                  ? 'تُستخدم لتقديم حملات إعلانية مخصصة، وربط Meta Pixel وتتبع حملات Google Ads وTikTok Pixel.' 
                                  : 'Personalized promotions, Meta Pixel, TikTok Pixel and Google Ads.'
                                }
                              </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                              <span className={`text-[9px] font-mono uppercase tracking-widest ${prefMarketing ? 'text-gold-pure font-semibold' : 'text-zinc-600'}`}>
                                {prefMarketing ? (isAr ? 'نشطة (مسموح)' : 'Active (ON)') : (isAr ? 'غير نشطة (محظور)' : 'Inactive (OFF)')}
                              </span>
                              {/* Toggle switch */}
                              <button
                                onClick={() => setPrefMarketing(!prefMarketing)}
                                className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none"
                                style={{ backgroundColor: prefMarketing ? '#D4AF37' : '#18181b' }}
                              >
                                <span
                                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-300 ease-in-out"
                                  style={{ transform: isAr ? (prefMarketing ? 'translateX(-1.25rem)' : 'translateX(0)') : (prefMarketing ? 'translateX(1.25rem)' : 'translateX(0)') }}
                                />
                              </button>
                            </div>
                          </div>

                          {/* Card 4: Preference Cookies */}
                          <div className="bg-zinc-950/60 border border-white/5 hover:border-gold-pure/30 rounded-sm p-6 relative flex flex-col justify-between overflow-hidden group transition-all duration-300 text-left rtl:text-right">
                            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-white/5 border border-white/5 text-zinc-400 group-hover:text-gold-pure transition-colors">
                                  <Check className="w-5 h-5" />
                                </div>
                                <h4 className="text-xs font-display font-semibold tracking-wider text-white uppercase">
                                  {isAr ? 'ملفات الارتباط للتفضيلات' : 'Preference Cookies'}
                                </h4>
                              </div>
                              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                                {isAr 
                                  ? 'تتذكر الخيارات التي تحددها مثل لغتك المفضلة، وتفضيلات العملة وتخطيط الواجهة لرفع السلاسة.' 
                                  : 'Remember language, currency and layout preferences.'
                                }
                              </p>
                            </div>

                            <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                              <span className={`text-[9px] font-mono uppercase tracking-widest ${prefPreferences ? 'text-gold-pure font-semibold' : 'text-zinc-600'}`}>
                                {prefPreferences ? (isAr ? 'نشطة (مسموح)' : 'Active (ON)') : (isAr ? 'غير نشطة (محظور)' : 'Inactive (OFF)')}
                              </span>
                              {/* Toggle switch */}
                              <button
                                onClick={() => setPrefPreferences(!prefPreferences)}
                                className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none"
                                style={{ backgroundColor: prefPreferences ? '#D4AF37' : '#18181b' }}
                              >
                                <span
                                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow-lg ring-0 transition duration-300 ease-in-out"
                                  style={{ transform: isAr ? (prefPreferences ? 'translateX(-1.25rem)' : 'translateX(0)') : (prefPreferences ? 'translateX(1.25rem)' : 'translateX(0)') }}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Cookie Action Buttons */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 border-t border-white/5">
                          {/* Accept All */}
                          <button
                            onClick={handleAcceptAll}
                            className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest font-semibold text-black bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white transition-all duration-300 rounded-sm cursor-pointer shadow-lg shadow-gold-pure/5 hover:shadow-white/5 select-none text-center"
                          >
                            {isAr ? 'قبول الكل' : 'Accept All'}
                          </button>

                          {/* Reject Optional */}
                          <button
                            onClick={handleRejectOptional}
                            className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300 rounded-sm cursor-pointer select-none text-center"
                          >
                            {isAr ? 'رفض الاختيارية' : 'Reject Optional'}
                          </button>

                          {/* Save Preferences */}
                          <button
                            onClick={handleSaveSelected}
                            className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 hover:border-white bg-[#D4AF37]/5 hover:bg-white/5 transition-all duration-300 rounded-sm cursor-pointer select-none text-center"
                          >
                            {isAr ? 'حفظ التفضيلات' : 'Save Preferences'}
                          </button>

                          {/* Reset to Default */}
                          <button
                            onClick={() => {
                              handleSavePreferences(true, true, true);
                            }}
                            className="px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300 rounded-sm cursor-pointer select-none text-center"
                          >
                            {isAr ? 'إعادة الافتراضي' : 'Reset to Default'}
                          </button>
                        </div>

                        {/* Save Success Toast inside the Dashboard */}
                        <AnimatePresence>
                          {saveSuccess && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-3.5 rounded-sm bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                              <span>
                                {isAr 
                                  ? 'تم حفظ وتأمين خيارات كوكيز زول بنجاح.' 
                                  : 'ZOAL Secure Cookie Preferences saved successfully.'
                                }
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Live Status Metadata Panel */}
                        <div className="p-5 rounded-sm bg-[#050505]/80 border border-white/5 shadow-xl relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                          <h4 className="text-[10px] font-display font-medium uppercase tracking-[0.2em] text-zinc-400 mb-4 pb-2 border-b border-white/5 flex items-center gap-2 text-left rtl:text-right">
                            <Info className="w-3.5 h-3.5 text-gold-pure" />
                            <span>{isAr ? 'حالة البث المباشر للخصوصية' : 'Live Security & Consent Metadata'}</span>
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                            {/* Current Cookie Status */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'حالة ملفات الارتباط' : 'Current Cookie Status'}</span>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[9px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>{isAr ? 'متوافق وآمن' : 'Compliant'}</span>
                              </div>
                            </div>

                            {/* Last Updated */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'آخر تحديث للسياسة' : 'Last Updated'}</span>
                              <span className="text-zinc-300 font-semibold text-[10.5px] flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gold-pure/70" />
                                {lastUpdatedDate}
                              </span>
                            </div>

                            {/* Consent Version */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'نسخة الموافقة' : 'Consent Version'}</span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-zinc-900 border border-white/5 text-zinc-300 text-[9px] font-mono font-bold">
                                <Shield className="w-3.5 h-3.5 text-gold-pure/70" />
                                v1.0 (Enterprise)
                              </span>
                            </div>

                            {/* Last Saved */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'تاريخ الحفظ الأخير' : 'Last Saved'}</span>
                              <span className="text-zinc-300 font-semibold text-[10.5px] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gold-pure/70" />
                                {lastSavedTime}
                              </span>
                            </div>

                            {/* Browser */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'متصفح العميل' : 'Browser'}</span>
                              <span className="text-zinc-300 font-semibold text-[10.5px] flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-gold-pure/70" />
                                {getBrowserName()}
                              </span>
                            </div>

                            {/* Storage */}
                            <div className="space-y-1.5 text-left rtl:text-right">
                              <span className="text-[9px] text-zinc-500 block">{isAr ? 'مستودع التخزين' : 'Storage'}</span>
                              <span className="text-[#D4AF37] font-semibold text-[10.5px] flex items-center gap-1.5">
                                <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                                Local Storage & Cookie
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 10: CONTACT DETAILS & REDIRECTS */}
                    {section.id === 'contact-support' && (
                      <div className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Business Address */}
                          <div className="p-4 border border-white/5 bg-black/40 rounded-xs flex items-start gap-3">
                            <MapPin className="w-4.5 h-4.5 text-gold-pure shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'العنوان الرئيسي للعلامة' : 'Boutique Headquarter'}</span>
                              <span className="text-xs text-zinc-300 leading-relaxed font-sans block mt-1">
                                {isAr ? contactDetails.address.ar : contactDetails.address.en}
                              </span>
                            </div>
                          </div>

                          {/* Support Hours */}
                          <div className="p-4 border border-white/5 bg-black/40 rounded-xs flex items-start gap-3">
                            <Clock className="w-4.5 h-4.5 text-gold-pure shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'ساعات العمل الرسمية' : 'Support Hours'}</span>
                              <span className="text-xs text-zinc-300 leading-relaxed font-sans block mt-1">
                                {isAr ? contactDetails.supportHours.ar : contactDetails.supportHours.en}
                              </span>
                            </div>
                          </div>

                          {/* Support Email */}
                          <a 
                            href={`mailto:${contactDetails.email}`}
                            className="p-4 border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 rounded-xs flex items-start gap-3.5"
                          >
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'البريد الإلكتروني المعتمد' : 'Verified Customer Email'}</span>
                              <span className="text-xs text-white group-hover:text-gold-pure font-semibold break-all transition-colors mt-1 block">{contactDetails.email}</span>
                            </div>
                          </a>

                          {/* Whatsapp Support */}
                          <a 
                            href={`https://wa.me/966567699315?text=${encodeURIComponent(isAr ? 'مرحباً زول، أود الاستفسار حول سياسة كوكيز الموقع والخصوصية' : 'Hello ZOAL, I would like to inquire about your privacy and cookie policies.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 rounded-xs flex items-start gap-3.5"
                          >
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'الواتساب الملكي الفوري' : 'Support WhatsApp'}</span>
                              <span className="text-xs text-white group-hover:text-gold-pure font-semibold transition-colors mt-1 block">{contactDetails.phone}</span>
                            </div>
                          </a>
                        </div>

                        {/* Custom Buttons */}
                        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 print:hidden">
                          <button
                            onClick={() => navigateToPage('contact')}
                            className="px-6 py-3 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white transition-all duration-350 text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-gold-pure/5 select-none"
                          >
                            <span>{isAr ? 'تواصل مع الدعم الفني' : 'Contact Support Office'}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>

                          <button
                            onClick={() => navigateToPage('privacy')}
                            className="px-6 py-3 border border-white/5 hover:border-white/20 bg-zinc-950/40 text-zinc-300 hover:text-white transition-all duration-300 text-[10px] font-mono uppercase tracking-widest rounded-xs cursor-pointer select-none"
                          >
                            {isAr ? 'سياسة الخصوصية الشاملة' : 'Privacy Policy Page'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Section Bullet Points List (If any) */}
                    {hasList && section.list && (
                      <div className="space-y-3 pl-4 sm:pl-6 border-l border-white/5 id-border rtl:pl-0 rtl:pr-4 sm:rtl:pr-6 rtl:border-l-0 rtl:border-r border-gold-pure/20 mt-5">
                        {(isAr ? section.list.ar : section.list.en).map((item, bulletIdx) => (
                          <div key={bulletIdx} className="flex items-start gap-3 text-xs sm:text-[12.5px] text-zinc-300 font-sans leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </motion.div>
                </section>
              );
            })}
          </div>

        </div>

        {/* Scroll back to top button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 p-3 bg-[#D4AF37] hover:bg-white text-black rounded-full shadow-2xl transition-all duration-300 cursor-pointer print:hidden z-50 hover:scale-105 active:scale-95"
              title={isAr ? 'الرجوع للأعلى' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Dynamic bottom declaration footer banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-white/5 text-center"
        >
          <p className="text-zinc-500 text-[10.5px] leading-relaxed max-w-lg mx-auto font-sans">
            {isAr 
              ? 'نهتم بأدق التفاصيل لضمان راحتكم وثقتكم المطلقة. جميع عمليات حماية البيانات الشخصية وملفات الارتباط آمنة ومحمية وفقاً للأنظمة الرقمية بالملكة العربية السعودية.' 
              : 'Our commitment is your peace of mind. All personal data practices are maintained to be strictly compliant under the Communications, Space and Technology Commission, and Ministry of Commerce regulations of the Kingdom of Saudi Arabia.'
            }
          </p>
        </motion.div>

      </div>
    </div>
  );
}
