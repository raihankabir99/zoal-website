import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare,
  UserCheck, 
  User, 
  ShoppingBag, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Truck, 
  RefreshCcw, 
  XCircle, 
  Award, 
  ShieldAlert, 
  AlertTriangle, 
  Shield, 
  Scale, 
  RefreshCw, 
  Mail, 
  Copy, 
  Check, 
  Printer, 
  ArrowUp, 
  ChevronDown, 
  BookOpen,
  Sparkles,
  Phone,
  MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { termsSections, contactDetails, TermsSection } from '../data/termsData';

import { useBranding } from './BrandingContext';

// Secure Dynamic Icon Resolver
const getSectionIcon = (iconName: string, className = "w-5 h-5 text-gold-pure") => {
  switch (iconName) {
    case 'CheckSquare': return <CheckSquare className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'User': return <User className={className} />;
    case 'ShoppingBag': return <ShoppingBag className={className} />;
    case 'DollarSign': return <DollarSign className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'RefreshCcw': return <RefreshCcw className={className} />;
    case 'XCircle': return <XCircle className={className} />;
    case 'Award': return <Award className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'AlertTriangle': return <AlertTriangle className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Scale': return <Scale className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'Mail': return <Mail className={className} />;
    default: return <Scale className={className} />;
  }
};

export default function TermsAndConditions() {
  const { i18n } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const brandName = settings.businessName.split(' ')[0];

  const [activeSectionId, setActiveSectionId] = useState<string>('acceptance');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // References for scroll tracking
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Dynamic automatic last updated date
  const lastUpdatedDate = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', options);
  }, [isAr]);

  // SEO Optimization & Structured Data (JSON-LD) Injection
  useEffect(() => {
    // 1. Store original metadata
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // 2. Set premium SEO Metadata
    const seoTitle = isAr 
      ? `الشروط والأحكام | ${brandName} - الفخامة والأناقة العربية` 
      : `Terms & Conditions | ${brandName} - Timeless Luxury & Heritage`;
    const seoDescription = isAr
      ? `اقرأ الشروط والأحكام الخاصة بمنصة ${brandName} الفاخرة. توضح التزامات الشراء والدفع والتفصيل الآمن وضمان الملكية الفكرية وحقوق المستهلك في المملكة العربية السعودية.`
      : `Review the ${brandName} Terms & Conditions. Understand the billing, ordering, premium shipping policies, custom tailoring agreements, and consumer rights under Saudi regulations.`;
    
    document.title = seoTitle;

    // Find or create description tag
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoDescription);

    // Open Graph Metadata
    const ogTags = [
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: brandName },
      { property: 'og:url', content: window.location.href }
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

    // 3. Inject Structured Schema JSON-LD for Terms & Conditions
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
      "mainEntityOfPage": window.location.href,
      "about": {
        "@type": "Thing",
        "name": "Terms and Conditions"
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-terms-schema-json';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    // Cleanup metadata on unmount
    return () => {
      document.title = originalTitle;
      if (descMeta) {
        descMeta.setAttribute('content', originalMetaDesc);
      }
      createdOgElements.forEach(el => el.remove());
      document.getElementById('zoal-terms-schema-json')?.remove();
    };
  }, [isAr]);

  // Track Reading Progress and Scroll Activations
  useEffect(() => {
    const handleScroll = () => {
      // 1. Reading Progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      // 2. Scroll to top button visibility
      setShowScrollTop(scrollTop > 400);

      // 3. Detect Active Section by scrolling position
      const scrollPosition = scrollTop + 160; // offset for headers
      
      let currentActiveSection = 'acceptance';
      for (const section of termsSections) {
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

  // Handle section scrolling smoothly
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

  // Copy Section Link functionality
  const copySectionLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // Trigger page print action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className="bg-black text-white min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative"
      id="zoal-terms-page"
    >
      {/* Absolute Decorative Grid Backdrops */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-display font-semibold text-gold-pure">
              {isAr ? 'الاتفاقية والالتزام الفاخر' : 'Luxury Agreement'}
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
            {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-5" />
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto"
          >
            {isAr 
              ? 'يرجى قراءة الشروط والأحكام بعناية قبل استخدام موقع زول أو تقديم طلب شراء. من خلال تصفح موقعنا أو استخدام خدماتنا، فإنك توافق التزاماً كاملاً بهذه الشروط والأنظمة.' 
              : 'Please read these Terms & Conditions carefully before using the ZOAL website or placing an order. By accessing or using our services, you agree to these terms.'
            }
          </motion.p>

          {/* Last Updated badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            <span>{isAr ? `آخر مراجعة: ${lastUpdatedDate}` : `Last Updated: ${lastUpdatedDate}`}</span>
            <span className="text-zinc-800">|</span>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-gold-pure transition-colors duration-300 print:hidden cursor-pointer"
              title={isAr ? 'طباعة الوثيقة' : 'Print this document'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'تحميل كملف PDF / طباعة' : 'Save PDF / Print'}</span>
            </button>
          </motion.div>
        </div>

        {/* Mobile Sticky Table of Contents (TOC) Trigger */}
        <div className="md:hidden sticky top-20 z-40 mb-6 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-zinc-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <span className="text-xs uppercase font-mono tracking-wider">
                  {isAr ? 'فهرس البنود' : 'Terms Table of Contents'}
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
                    {termsSections.map((sect) => {
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
            <div className="bg-zinc-950/20 border border-white/5 rounded-sm p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
              
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <h3 className="text-white text-xs uppercase tracking-widest font-semibold font-display">
                  {isAr ? 'فهرس الشروط' : 'Terms of Service'}
                </h3>
              </div>

              <div className="space-y-1">
                {termsSections.map((sect) => {
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

          {/* RIGHT COLUMN: TERMS CONTENT BLOCKS */}
          <div className="md:col-span-8 space-y-8 print:w-full">
            {termsSections.map((section, idx) => {
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

                      {/* Print and share icons */}
                      <div className="flex items-center gap-1.5 print:hidden">
                        <button
                          onClick={(e) => copySectionLink(section.id, e)}
                          className="p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer relative group"
                          title={isAr ? 'نسخ رابط البند' : 'Copy section link'}
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
                          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[9px] px-2 py-1 rounded-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                            {isAr ? 'نسخ الرابط' : 'Copy Link'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Section Text Content */}
                    <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-sans">
                      {isAr ? section.content.ar : section.content.en}
                    </p>

                    {/* Section Bullet Points List (If any) */}
                    {hasList && section.list && (
                      <div className="space-y-3 pl-4 sm:pl-6 border-l border-white/5 rtl:pl-0 rtl:pr-4 sm:rtl:pr-6 rtl:border-l-0 rtl:border-r border-gold-pure/20">
                        {(isAr ? section.list.ar : section.list.en).map((item, bulletIdx) => (
                          <div key={bulletIdx} className="flex items-start gap-3 text-xs sm:text-[12.5px] text-zinc-300 font-sans leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CUSTOM DESIGN: Custom actionable triggers inside specific sections */}
                    {section.id === 'shipping-delivery' && (
                      <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 print:hidden">
                        <button 
                          onClick={() => {
                            // Dispatch custom event to trigger footer shipping modal or print
                            const btn = document.querySelector('button[onClick*="shipping"]') as HTMLButtonElement;
                            if (btn) btn.click();
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer"
                        >
                          {isAr ? 'الشحن والتوصيل الفاخر' : 'Detailed Shipping Policy'}
                        </button>
                      </div>
                    )}

                    {section.id === 'returns-refunds' && (
                      <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 print:hidden">
                        <button 
                          onClick={() => {
                            const btn = document.querySelector('button[onClick*="returns"]') as HTMLButtonElement;
                            if (btn) btn.click();
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer"
                        >
                          {isAr ? 'سياسة الاسترجاع الكاملة' : 'Detailed Returns & Refunds'}
                        </button>
                      </div>
                    )}

                    {section.id === 'privacy' && (
                      <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 print:hidden">
                        <a 
                          href="#privacy-policy"
                          onClick={(e) => {
                            e.preventDefault();
                            // Scroll to top and set page state
                            const event = new CustomEvent('zoal-route-change', { detail: 'privacy' });
                            window.dispatchEvent(event);
                          }}
                          className="px-4 py-2 text-[#D4AF37] hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300"
                        >
                          <span>{isAr ? 'سياسة الخصوصية الكاملة' : 'View Full Privacy Policy'}</span>
                          <Shield className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {/* Render detailed Cards for Contact Info */}
                    {section.id === 'contact-info' && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Email box */}
                        <a 
                          href={`mailto:${settings.email}`}
                          className="p-4 rounded-xs border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 flex items-start gap-3.5"
                        >
                          <div className="p-2 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'البريد الإلكتروني' : 'Official Email'}</span>
                            <span className="text-xs text-white group-hover:text-gold-pure font-semibold break-all transition-colors">{settings.email}</span>
                          </div>
                        </a>

                        {/* WhatsApp box */}
                        <a 
                          href={`https://wa.me/${settings.phone.replace(/\+/g, '').replace(/\s+/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 rounded-xs border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 flex items-start gap-3.5"
                        >
                          <div className="p-2 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'دعم الواتساب الفوري' : 'Support WhatsApp'}</span>
                            <span className="text-xs text-white group-hover:text-gold-pure font-semibold transition-colors">{settings.phone}</span>
                          </div>
                        </a>

                        {/* Telephone box */}
                        <div className="p-4 rounded-xs border border-white/5 bg-black/40 flex items-start gap-3.5 sm:col-span-2">
                          <div className="p-2 rounded-full bg-white/5 text-zinc-400">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'أوقات العمل واستقبال الاستفسارات' : 'Inquiry Support Hours'}</span>
                            <span className="text-xs text-zinc-200 block font-semibold">{isAr ? contactDetails.supportHours.ar : contactDetails.supportHours.en}</span>
                            <span className="text-[11px] text-zinc-400 block font-sans leading-relaxed">
                              {isAr ? `العنوان الفاخر: ${settings.address}` : `Boutique Address: ${settings.address}`}
                            </span>
                          </div>
                        </div>

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
          <p className="text-zinc-500 text-[10.5px] leading-relaxed max-w-lg mx-auto">
            {isAr 
              ? 'إن جميع المعاملات وشروط وأحكام البيع والتفصيل والخياطة مصممة ومسجلة بما يتوافق تماماً مع أنظمة وزارة التجارة وقوانين حماية حقوق المستهلك في التجارة الإلكترونية في المملكة العربية السعودية.' 
              : 'All commercial terms, tailoring agreements, and boutique service guidelines are designed and registered in total alignment with the Ministry of Commerce and consumer protection guidelines in Saudi Arabia.'
            }
          </p>
        </motion.div>

      </div>
    </div>
  );
}
