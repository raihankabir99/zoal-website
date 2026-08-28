import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Database, 
  Eye, 
  CreditCard, 
  Cookie, 
  Megaphone, 
  Share2, 
  Lock, 
  Clock, 
  UserCheck, 
  HeartHandshake, 
  ExternalLink, 
  Globe, 
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
  MessageCircle,
  Calendar,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReadingProgressBar } from './ReadingProgressBar';
import { scrollToLegalSection } from '../utils/legalScroll';
import { contactDetails, PrivacySection } from '../data/privacyData';
import { useBranding } from './BrandingContext';

// Dynamic helper to resolve icons securely
const getSectionIcon = (iconName: string, className = "w-5 h-5 text-gold-pure") => {
  switch (iconName) {
    case 'Shield': return <Shield className={className} />;
    case 'Database': return <Database className={className} />;
    case 'Eye': return <Eye className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'Cookie': return <Cookie className={className} />;
    case 'Megaphone': return <Megaphone className={className} />;
    case 'Share2': return <Share2 className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'HeartHandshake': return <HeartHandshake className={className} />;
    case 'ExternalLink': return <ExternalLink className={className} />;
    case 'Globe': return <Globe className={className} />;
    case 'RefreshCw': return <RefreshCw className={className} />;
    case 'Mail': return <Mail className={className} />;
    default: return <Shield className={className} />;
  }
};

export default function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<string>('introduction');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [publishedDateStr, setPublishedDateStr] = useState<string>('');
  const [privacySections, setPrivacySections] = useState<PrivacySection[]>([]);

  // Collapsible Accordion sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // References for scroll tracking
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Fetch Published Privacy Document from Legal API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setApiError(null);

    fetch('/api/legal/documents/privacy')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load legal privacy document (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((doc) => {
        if (!isMounted) return;

        const versions = doc.zoal_legal_document_versions || [];
        const currentVersion = doc.current_version || versions.find((v: any) => v.id === doc.current_version_id || v.status === 'Published');

        if (!currentVersion || currentVersion.status !== 'Published') {
          setApiError(isAr ? 'وثيقة سياسة الخصوصية غير متاحة حالياً.' : 'The Privacy Policy document is currently unavailable.');
          setIsLoading(false);
          return;
        }

        setDocumentTitle(doc.title || 'Digital Privacy Policy');

        // Extract published date from DB timestamp
        const rawDate = currentVersion.created_at || doc.updated_at || doc.created_at;
        if (rawDate) {
          const dateObj = new Date(rawDate);
          setPublishedDateStr(dateObj.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
        }

        // Parse content
        let parsedSections: PrivacySection[] = [];
        if (typeof currentVersion.content === 'string' && currentVersion.content.trim().startsWith('[')) {
          try {
            parsedSections = JSON.parse(currentVersion.content);
          } catch (e) {
            parsedSections = [];
          }
        }

        if (parsedSections.length === 0 && currentVersion.content) {
          parsedSections = [
            {
              id: 'privacy-body',
              title: {
                en: doc.title || 'Privacy Policy',
                ar: doc.title || 'سياسة الخصوصية'
              },
              icon: 'Shield',
              content: {
                en: currentVersion.content,
                ar: currentVersion.content
              }
            }
          ];
        }

        setPrivacySections(parsedSections);

        const initialExpanded: Record<string, boolean> = {};
        parsedSections.forEach((s, idx) => {
          initialExpanded[s.id] = idx === 0;
        });
        setExpandedSections(initialExpanded);

        if (parsedSections.length > 0) {
          setActiveSectionId(parsedSections[0].id);
        }

        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching privacy document:', err);
        setApiError(isAr ? 'عذراً، حدث خطأ أثناء تحميل وثيقة سياسة الخصوصية.' : 'Sorry, an error occurred while loading the Privacy Policy document.');
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [isAr]);

  // SEO Optimization & Structured Data (JSON-LD) Injection
  useEffect(() => {
    // 1. Store original metadata
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // 2. Set premium SEO Metadata
    const seoTitle = isAr 
      ? 'سياسة الخصوصية | زول - فخامة الضيافة والأناقة العربية' 
      : 'Privacy Policy | ZOAL - Timeless Luxury & Heritage';
    const seoDescription = isAr
      ? 'اطلع على سياسة خصوصية زول. نوضح بكل أمانة ودقة كيفية جمع وحفظ وحماية بياناتك الشخصية ومعاملاتك المالية وفقاً للأنظمة الرقمية في المملكة العربية السعودية.'
      : 'Review the ZOAL Privacy Policy. Learn how we respect, process, encrypt, and secure your personal details and digital transactions in full compliance with Saudi eCommerce guidelines.';
    
    // document.title = seoTitle;

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
      { property: 'og:site_name', content: 'ZOAL' },
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

    // 3. Inject Structured Schema JSON-LD for Privacy Policy
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
        "name": "Privacy Policy"
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-privacy-schema-json';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    // Cleanup metadata on unmount
    return () => {
      // document.title = originalTitle;
      if (descMeta) {
        descMeta.setAttribute('content', originalMetaDesc);
      }
      createdOgElements.forEach(el => el.remove());
      document.getElementById('zoal-privacy-schema-json')?.remove();
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
      
      let currentActiveSection = 'introduction';
      for (const section of privacySections) {
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
    scrollToLegalSection({
      id,
      element: sectionsRef.current[id],
      onExpand: (targetId) => {
        setExpandedSections(prev => ({ ...prev, [targetId]: true }));
      },
      onSelect: setActiveSectionId,
      closeMobileMenu: () => setMobileTOCExpanded(false),
    });
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
      className="bg-black text-white min-h-screen pt-20 sm:pt-32 pb-12 sm:pb-20 px-2 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative"
      id="zoal-privacy-page"
    >
      {/* Absolute Decorative Grid Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Reading Progress Indicator Bar */}
      <ReadingProgressBar progress={scrollProgress} />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Luxury Badge Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-3 sm:mb-4 print:hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse shrink-0" />
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-display font-semibold text-gold-pure text-center">
              {isAr ? 'حماية البيانات السيادية' : 'Data Governance'}
            </span>
          </div>
        </motion.div>

        {/* Page Header Section */}
        <div className="text-center mb-6 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl sm:text-4xl font-display font-medium text-white tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-3 sm:mb-4"
          >
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-3 sm:mb-5" />
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-sans px-2 sm:px-0"
          >
            {isAr 
              ? 'إن خصوصيتك تهمنا للغاية في زول. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وتخزين وحماية معلوماتك الشخصية عند استخدام موقعنا الإلكتروني وخدماتنا الفاخرة.' 
              : 'Your privacy is important to us. This Privacy Policy explains how ZOAL collects, uses, stores, and protects your personal information when you use our website and services.'
            }
          </motion.p>

          {/* Last Updated badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            {publishedDateStr && (
              <>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold-pure/80" />
                  {isAr ? `آخر مراجعة موثقة: ${publishedDateStr}` : `Official Version Published: ${publishedDateStr}`}
                </span>
                <span className="text-zinc-800 hidden sm:inline">|</span>
              </>
            )}
            <button 
              onClick={handlePrint}
              className="flex items-center gap-1.5 hover:text-gold-pure transition-colors duration-300 print:hidden cursor-pointer bg-white/5 hover:bg-gold-pure/10 px-2.5 py-1 rounded-sm border border-white/5"
              title={isAr ? 'طباعة هذه الصفحة' : 'Print this page'}
            >
              <Printer className="w-3 h-3 text-gold-pure/80" />
              <span className="text-[9px] sm:text-[10px] font-mono">{isAr ? 'تحميل PDF / طباعة' : 'Save PDF / Print'}</span>
            </button>
          </motion.div>
        </div>

        {/* Loading Spinner State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-gold-pure animate-spin" />
            <p className="text-xs font-mono tracking-widest uppercase text-zinc-400">
              {isAr ? 'جاري التحقق من سياسة الخصوصية الرسمية...' : 'Verifying Official Privacy Policy...'}
            </p>
          </div>
        )}

        {/* Error / Unavailable State */}
        {!isLoading && apiError && (
          <div className="p-8 bg-zinc-950 border border-amber-500/30 rounded-sm text-center space-y-4 max-w-xl mx-auto shadow-2xl">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-display font-semibold uppercase tracking-widest text-white">
              {isAr ? 'تنبيه النظام القانوني' : 'Legal Compliance Notice'}
            </h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {apiError}
            </p>
          </div>
        )}

        {/* Master Content Grid when loaded without error */}
        {!isLoading && !apiError && privacySections.length > 0 && (
          <>
            {/* Mobile Sticky Table of Contents (TOC) Trigger */}
        <div className="md:hidden sticky top-16 sm:top-20 z-40 mb-4 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-zinc-300 hover:text-white focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-gold-pure" />
                <span className="text-[10px] sm:text-xs uppercase font-mono tracking-wider">
                  {isAr ? 'فهرس السياسة' : 'Policy Table of Contents'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: mobileTOCExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
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
                    {privacySections.map((sect) => {
                      const isActive = activeSectionId === sect.id;
                      return (
                        <button
                          key={sect.id}
                          onClick={() => scrollToSection(sect.id)}
                          className={`text-start px-3 py-2 rounded-xs text-[11px] font-mono uppercase tracking-wider flex items-center justify-between transition-all ${
                            isActive 
                              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-s-2 border-[#D4AF37] ps-2 font-semibold' 
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
          <div className="hidden md:block md:col-span-4 sticky top-28 max-h-[calc(100vh-160px)] overflow-y-auto pe-2 pb-6 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent print:hidden">
            <div className="bg-[#050505]/60 border border-white/5 rounded-sm p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
              
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <h3 className="text-white text-xs uppercase tracking-widest font-semibold font-display">
                  {isAr ? 'فهرس المحتويات' : 'Table of Contents'}
                </h3>
              </div>

              <div className="space-y-1">
                {privacySections.map((sect) => {
                  const isActive = activeSectionId === sect.id;
                  return (
                    <button
                      key={sect.id}
                      onClick={() => scrollToSection(sect.id)}
                      className={`w-full text-start px-3 py-2.5 rounded-sm text-[10.5px] font-mono uppercase tracking-wider flex items-center justify-between transition-all duration-300 border border-transparent ${
                        isActive 
                          ? 'bg-[#D4AF37]/5 text-[#D4AF37] border-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] font-semibold' 
                          : 'text-zinc-400 hover:text-white hover:border-white/5'
                      }`}
                    >
                      <span className="truncate pe-2">{isAr ? sect.title.ar : sect.title.en}</span>
                      {getSectionIcon(sect.icon, `w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'text-gold-pure scale-110' : 'text-zinc-600'}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PRIVACY CONTENT BLOCKS */}
          <div className="md:col-span-8 space-y-3.5 sm:space-y-6 md:space-y-8 print:w-full">
            {privacySections.map((section, idx) => {
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
                    className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
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
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setExpandedSections(prev => ({
                          ...prev,
                          [section.id]: !prev[section.id]
                        }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedSections(prev => ({
                            ...prev,
                            [section.id]: !prev[section.id]
                          }));
                        }
                      }}
                      className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                        expandedSections[section.id] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                          isActive 
                            ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                            : 'bg-white/5 border-transparent text-zinc-400'
                        }`}>
                          {getSectionIcon(section.icon, "w-3.5 h-3.5 sm:w-4.5 sm:h-4.5")}
                        </div>
                        <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                          isActive ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                        }`}>
                          {isAr ? section.title.ar : section.title.en}
                        </h2>
                      </div>

                      {/* Right side controls */}
                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 print:hidden">
                        <button
                          onClick={(e) => copySectionLink(section.id, e)}
                          className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer relative group shrink-0"
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

                        <motion.div
                          animate={{ rotate: expandedSections[section.id] ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                        >
                          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {expandedSections[section.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          {/* Section Text Content */}
                          <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 font-sans">
                            {isAr ? section.content.ar : section.content.en}
                          </p>

                          {/* Section Bullet Points List (If any) */}
                          {hasList && section.list && (
                            <div className="space-y-3 ps-4 sm:ps-6 border-s border-white/5 border-gold-pure/20">
                              {(isAr ? section.list.ar : section.list.en).map((item, bulletIdx) => (
                                <div key={bulletIdx} className="flex items-start gap-3 text-xs sm:text-[12.5px] text-zinc-300 font-sans leading-relaxed">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 mt-1.5" />
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* CUSTOM DESIGN: Detailed inline layouts for specific sections */}
                          {section.id === 'cookies' && (
                            <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap gap-3 print:hidden">
                              <button 
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-zinc-300 hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer"
                              >
                                {isAr ? 'تفضيلات ملفات الكوكيز' : 'Cookie Preferences'}
                              </button>
                              <a 
                                href="#cookie-policy" 
                                className="px-4 py-2 text-[#D4AF37] hover:text-white rounded-sm text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300"
                              >
                                <span>{isAr ? 'سياسة ملفات الارتباط الكاملة' : 'Read Cookie Policy'}</span>
                                <ExternalLink className="w-3 h-3" />
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
                                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'البريد الإلكتروني الكوني' : 'Official Email'}</span>
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
                                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'مواعيد دعم العملاء' : 'Support Availability'}</span>
                                  <span className="text-xs text-zinc-200 block font-semibold">{isAr ? contactDetails.supportHours.ar : contactDetails.supportHours.en}</span>
                                  <span className="text-[11px] text-zinc-400 block font-sans leading-relaxed">
                                    {isAr ? `العنوان: ${settings.address}` : `Address: ${settings.address}`}
                                  </span>
                                </div>
                              </div>

                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                </section>
              );
            })}
          </div>

        </div>
          </>
        )}

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
              ? 'نهتم بأدق التفاصيل لضمان راحتكم وثقتكم المطلقة. جميع عمليات حماية البيانات الشخصية مسجلة ومرخصة وفقاً لهيئة الاتصالات والفضاء والتقنية وأنظمة وزارة التجارة في المملكة العربية السعودية.' 
              : 'Our commitment is your peace of mind. All personal data practices are maintained to be strictly compliant under the Communications, Space and Technology Commission, and Ministry of Commerce regulations of the Kingdom of Saudi Arabia.'
            }
          </p>
        </motion.div>

      </div>
    </div>
  );
}
