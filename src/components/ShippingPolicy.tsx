import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Truck, 
  DollarSign, 
  Clock, 
  Send, 
  Table, 
  AlertCircle, 
  Navigation, 
  Search, 
  MessageSquare,
  Sparkles,
  Printer,
  ArrowUp,
  ChevronDown,
  BookOpen,
  Copy,
  Check,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Shield,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getShippingConfig, ShippingConfig } from '../data/shippingData';
import { contactDetails } from '../data/termsData';
import { useBranding } from './BrandingContext';

interface PolicySection {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  icon: string;
}

const policySections: PolicySection[] = [
  { id: 'shipping-coverage', title: { en: '1. Shipping Coverage', ar: '1. تغطية الشحن والتوصيل' }, icon: 'MapPin' },
  { id: 'delivery-options', title: { en: '2. Delivery Options', ar: '2. خيارات التوصيل' }, icon: 'Truck' },
  { id: 'shipping-charges', title: { en: '3. Shipping Charges', ar: '3. رسوم الشحن والتوصيل' }, icon: 'DollarSign' },
  { id: 'order-processing', title: { en: '4. Order Processing', ar: '4. معالجة وتجهيز الطلب' }, icon: 'Clock' },
  { id: 'dispatch-time', title: { en: '5. Dispatch Time', ar: '5. وقت تسليم الشحنة للمندوب' }, icon: 'Send' },
  { id: 'estimated-delivery-time', title: { en: '6. Estimated Delivery Time', ar: '6. الفترات المتوقعة للوصول' }, icon: 'Table' },
  { id: 'delivery-delays', title: { en: '7. Delivery Delays', ar: '7. حالات التأخير الخارجة عن الإرادة' }, icon: 'AlertCircle' },
  { id: 'delivery-address', title: { en: '8. Delivery Address Accuracy', ar: '8. دقة وصحة عنوان التوصيل' }, icon: 'Navigation' },
  { id: 'order-tracking', title: { en: '9. Order Tracking', ar: '9. تتبع الشحنات والطلبات' }, icon: 'Search' },
  { id: 'contact-support', title: { en: '10. Contact Support', ar: '10. التواصل مع الدعم الفني' }, icon: 'MessageSquare' }
];

export default function ShippingPolicy() {
  const { i18n } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<string>('shipping-coverage');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Live configurable parameters
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(getShippingConfig());
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);

  // Ref for sections tracking
  const sectionsRef = useRef<{ [key: string]: HTMLElement | null }>({});

  // Fetch configs and listen to changes
  const fetchLiveConfigs = () => {
    setShippingConfig(getShippingConfig());
    try {
      const savedZones = localStorage.getItem('zoal_delivery_zones');
      if (savedZones) {
        setDeliveryZones(JSON.parse(savedZones));
      } else {
        setDeliveryZones([
          { id: '1', city: 'Hofuf', fee: 0, method: 'Local Delivery', region: 'Al Hofuf & Nearby Areas' },
          { id: '2', city: 'Dammam', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
          { id: '3', city: 'Khobar', fee: 25, method: 'Regional Delivery', region: 'Eastern Province' },
          { id: '4', city: 'Riyadh', fee: 45, method: 'Regional Delivery', region: 'Central Region' },
          { id: '5', city: 'Jeddah', fee: 50, method: 'Regional Delivery', region: 'Western Region' },
        ]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLiveConfigs();
    window.addEventListener('zoal-shipping-config-changed', fetchLiveConfigs);
    window.addEventListener('storage', fetchLiveConfigs);
    return () => {
      window.removeEventListener('zoal-shipping-config-changed', fetchLiveConfigs);
      window.removeEventListener('storage', fetchLiveConfigs);
    };
  }, []);

  // Format today's date dynamically for "Last Updated"
  const lastUpdatedDate = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', options);
  }, [isAr]);

  // SEO Configurations
  useEffect(() => {
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    const seoTitle = isAr 
      ? 'سياسة الشحن والتوصيل | زول لمنتجات الفخامة والموضة' 
      : 'Shipping & Delivery Policy | ZOAL - Premium Boutique';
    const seoDescription = isAr
      ? 'اطلع على سياسة الشحن في متجر زول الفاخر. نوفر خيارات شحن قياسي وسريع وتوصيل بنفس اليوم في الهفوف والمملكة العربية السعودية مع تفاصيل الرسوم ومواعيد التجهيز.'
      : 'Learn about ZOAL Premium Shipping Policy across Saudi Arabia. Discover Standard, Express, and Same-Day delivery in Al Hofuf, delivery timelines, and free shipping conditions.';
    
    document.title = seoTitle;

    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoDescription);

    // Open Graph
    const ogTags = [
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:type', content: 'website' },
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

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', window.location.href);

    // Schema Structured JSON-LD
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
      "mainEntity": {
        "@type": "ShippingDeliveryTime",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "15",
          "currency": "SAR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": "1",
            "maxValue": "2",
            "unitCode": "DAY"
          }
        }
      }
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-shipping-schema-json';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    return () => {
      document.title = originalTitle;
      if (descMeta) descMeta.setAttribute('content', originalMetaDesc);
      createdOgElements.forEach(el => el.remove());
      document.getElementById('zoal-shipping-schema-json')?.remove();
    };
  }, [isAr]);

  // Track Reading Progress and Active Section Scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      setShowScrollTop(scrollTop > 400);

      const scrollPosition = scrollTop + 160;
      let currentActiveSection = 'shipping-coverage';

      for (const section of policySections) {
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
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getSectionIcon = (iconName: string, className = "w-4 h-4 text-gold-pure") => {
    switch (iconName) {
      case 'MapPin': return <MapPin className={className} />;
      case 'Truck': return <Truck className={className} />;
      case 'DollarSign': return <DollarSign className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Send': return <Send className={className} />;
      case 'Table': return <Table className={className} />;
      case 'AlertCircle': return <AlertCircle className={className} />;
      case 'Navigation': return <Navigation className={className} />;
      case 'Search': return <Search className={className} />;
      case 'MessageSquare': return <MessageSquare className={className} />;
      default: return <Truck className={className} />;
    }
  };

  const dispatchPage = (page: string) => {
    const event = new CustomEvent('zoal-route-change', { detail: page });
    window.dispatchEvent(event);
  };

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className="bg-black text-white min-h-screen pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative"
      id="zoal-shipping-page"
    >
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-12 left-1/3 w-[450px] h-[450px] bg-[#D4AF37] opacity-[0.025] blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-12 right-1/3 w-[550px] h-[550px] bg-[#D4AF37] opacity-[0.015] blur-[180px] rounded-full pointer-events-none z-0" />

      {/* Reading Progress Bar */}
      <div className="fixed top-[64px] sm:top-[72px] left-0 right-0 h-[3px] bg-white/5 z-50 print:hidden">
        <div 
          className="h-full bg-gradient-to-r from-gold-dark via-gold-pure to-white transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Luxury Badge Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4 print:hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-display font-semibold text-gold-pure">
              {isAr ? 'بروتوكول الشحن الفاخر' : 'Premium Shipping Logistics'}
            </span>
          </div>
        </motion.div>

        {/* Page Title & Subtitle */}
        <div className="text-center mb-12 sm:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-4xl font-display font-medium text-white tracking-[0.2em] uppercase mb-4"
          >
            {isAr ? 'سياسة الشحن والتوصيل' : 'Shipping Policy'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mb-5" />
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-sans"
          >
            {isAr 
              ? 'تعرف على خيارات التوصيل الفاخرة، ومناطق التغطية، ورسوم الشحن، وفترات معالجة الطلبات وإجراءات تتبع الشحنات الراقية في جميع مدن ومناطق المملكة العربية السعودية.' 
              : 'Learn about our delivery coverage, shipping options, processing times, estimated delivery schedules, and shipping charges across the Kingdom of Saudi Arabia.'
            }
          </motion.p>

          {/* Timestamp and Printing Trigger */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            <span>{isAr ? `آخر تحديث: ${lastUpdatedDate}` : `Last Updated: ${lastUpdatedDate}`}</span>
            <span className="text-zinc-800">|</span>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-1.5 hover:text-gold-pure transition-colors duration-300 print:hidden cursor-pointer"
              title={isAr ? 'طباعة السياسة' : 'Print this policy'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ بصيغة PDF / طباعة' : 'Save PDF / Print'}</span>
            </button>
          </motion.div>
        </div>

        {/* Collapsible Table of Contents (Mobile Only) */}
        <div className="md:hidden sticky top-20 z-40 mb-6 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-zinc-300 hover:text-white"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <span className="text-xs uppercase font-mono tracking-wider">
                  {isAr ? 'بنود سياسة الشحن' : 'Shipping Policy Outline'}
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
                    {policySections.map((sect) => {
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
                          {getSectionIcon(sect.icon, "w-3.5 h-3.5 text-gold-pure/60 shrink-0")}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Layout - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Sidebar Navigation - Sticky (Desktop Only) */}
          <div className="hidden md:block md:col-span-4 sticky top-28 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 pb-6 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent print:hidden">
            <div className="bg-zinc-950/20 border border-white/5 rounded-sm p-5 space-y-4 shadow-xl backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent" />
              
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <BookOpen className="w-4 h-4 text-gold-pure" />
                <h3 className="text-white text-xs uppercase tracking-widest font-semibold font-display">
                  {isAr ? 'أقسام السياسة' : 'Policy Sections'}
                </h3>
              </div>

              <div className="space-y-1">
                {policySections.map((sect) => {
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

          {/* Right Column: Policy Details Content */}
          <div className="md:col-span-8 space-y-8 print:w-full">
            
            {/* 1. SHIPPING COVERAGE */}
            <section
              id="shipping-coverage"
              ref={(el) => { sectionsRef.current['shipping-coverage'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'shipping-coverage' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '1. التغطية ومناطق التوصيل' : '1. Shipping Coverage'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('shipping-coverage', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'shipping-coverage' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'تفخر علامة زول بتقديم خدمات الشحن والتوصيل الفاخرة التي تغطي كافة مناطق ومدن المملكة العربية السعودية الشاسعة. يسعدنا وصول شحنات الضيافة والملابس الأنيقة إلى عتبات بيوتكم بعناية تامة وأعلى مستويات الاحترافية.'
                      : 'ZOAL takes profound pride in catering its boutique services and luxury shipments across the entire Kingdom of Saudi Arabia. We partner with elite premium regional couriers to ensure that your parcels arrive safely and in immaculate, pristine conditions.'
                    }
                  </p>
                  
                  <div className="pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gold-pure block mb-2">
                      {isAr ? 'المدن الرئيسية المشمولة بالتغطية المباشرة:' : 'Major Cities with Direct Premium Coverage:'}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono uppercase text-zinc-300">
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'الهفوف والأحساء' : 'Al Hofuf / Al Ahsa'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'الرياض' : 'Riyadh'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'الدمام' : 'Dammam'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'الخبر والظهران' : 'Al Khobar / Dhahran'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'جدة' : 'Jeddah'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'مكة المكرمة' : 'Makkah'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xs border border-white/5">
                        <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full shrink-0" />
                        <span>{isAr ? 'المدينة المنورة' : 'Madinah'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="pt-2 text-[11px] text-zinc-500 italic">
                    {isAr 
                      ? '* تتم مراجعة وتوسيع شبكة توصيل زول اللوجستية باستمرار لإدراج مدن ومحافظات إضافية جديدة بشكل مستمر تلبية لمتطلبات عملائنا الكرام.'
                      : '* Additional remote cities and local governorates within KSA are constantly added and reviewed to fulfill our esteemed customers requests.'
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* 2. DELIVERY OPTIONS */}
            <section
              id="delivery-options"
              ref={(el) => { sectionsRef.current['delivery-options'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'delivery-options' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Truck className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '2. خيارات التوصيل الفاخرة' : '2. Premium Delivery Options'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('delivery-options', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'delivery-options' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-6 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'نحن نقدر وقتكم الثمين، ولذلك نقدم ثلاثة مستويات مختلفة من خيارات التوصيل لتلائم تطلعاتكم للسرعة والرفاهية:'
                      : 'Recognizing that speed and elegance must go hand in hand, ZOAL outlines three distinct, structured delivery tiers tailored for your convenience:'
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Standard */}
                    <div className="p-4 border border-white/5 bg-black/40 rounded-xs space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block">
                        {isAr ? 'الشحن القياسي' : 'Standard Delivery'}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {isAr 
                          ? 'متوفر لجميع مدن ومحافظات المملكة. شحن آمن ومعبأ بعناية فائقة لضمان الحفاظ على سلامة شحنتكم.'
                          : 'Available for all urban and regional locations within Saudi Arabia. Exceptional security packing guaranteed.'
                        }
                      </p>
                    </div>

                    {/* Express */}
                    <div className="p-4 border border-white/5 bg-black/40 rounded-xs space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white block">
                        {isAr ? 'الشحن السريع' : 'Express Delivery'}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {isAr 
                          ? 'أولوية شحن ومعالجة عاجلة. متاح في المدن الكبرى (الرياض، الدمام، الخبر، جدة) لشحنات أسرع.'
                          : 'Priority handling and air courier routes. Dispatched to major cities for ultra-fast, urgent arrivals.'
                        }
                      </p>
                    </div>

                    {/* Same Day */}
                    <div className="p-4 border border-[#D4AF37]/20 bg-[#D4AF37]/5 rounded-xs space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure block flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold-pure animate-ping" />
                        {isAr ? 'توصيل بنفس اليوم' : 'Same-Day Delivery'}
                      </span>
                      <p className="text-[11px] text-zinc-300 leading-normal">
                        {isAr 
                          ? 'متاح حصرياً داخل الهفوف والقرى المحيطة المؤهلة للأغذية الطازجة والمخبوزات والقهوة الساخنة عند الطلب قبل فترة قطع الخدمة.'
                          : 'Exclusively available inside Al Hofuf & eligible surrounding areas. Highly recommended for fresh pastries & warm coffee.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. SHIPPING CHARGES */}
            <section
              id="shipping-charges"
              ref={(el) => { sectionsRef.current['shipping-charges'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'shipping-charges' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '3. رسوم الشحن والتوصيل' : '3. Shipping Charges'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('shipping-charges', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'shipping-charges' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'يتم احتساب تكاليف التوصيل وتحديثها بشكل دقيق وتلقائي بالكامل عند صفحة إتمام الدفع بالاعتماد على معايير لوجستية واضحة تشمل المدينة، والمسافة، ووزن الطرد الإجمالي، وطريقة التوصيل المختارة.'
                      : 'To ensure fairness, ZOAL calculates exact shipping costs dynamically at checkout based on clear logistic factors including delivery city, travel distance, package gross weight, and your selected delivery method.'
                    }
                  </p>

                  {/* Free shipping banner */}
                  <div className="p-4 border border-[#D4AF37]/25 bg-gold-pure/5 rounded-xs flex items-center gap-3.5">
                    <Sparkles className="w-5 h-5 text-gold-pure shrink-0" />
                    <div>
                      <span className="text-xs text-white block font-semibold uppercase tracking-wider">
                        {isAr ? `خدمة الشحن المجاني` : `Complimentary Shipping`}
                      </span>
                      <span className="text-[11px] text-zinc-300 block leading-relaxed mt-0.5">
                        {isAr 
                          ? `استمتع بشحن مجاني تماماً على كافة طلباتك التي تتجاوز قيمتها ${shippingConfig.freeShippingThreshold} ريال سعودي.`
                          : `Savor completely complimentary priority shipping on all orders exceeding ${shippingConfig.freeShippingThreshold} SAR.`
                        }
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500">
                    {isAr 
                      ? '* يمكن لمدير المتجر تعديل وتعديل حد الشحن المجاني ورسوم المناطق من لوحة التحكم لتناسب العروض الموسمية.'
                      : '* Note: Free shipping thresholds and specific regional flat rates are managed in real-time from the ZOAL Administrator Portal.'
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* 4. ORDER PROCESSING */}
            <section
              id="order-processing"
              ref={(el) => { sectionsRef.current['order-processing'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'order-processing' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '4. معالجة وتجهيز الطلبات' : '4. Order Processing'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('order-processing', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'order-processing' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'تبدأ عملية المعالجة الفائقة فور تلقي إشعار الدفع البنكي بنجاح. إن التزامنا بدقة الجودة يتطلب فحصاً دقيقاً لجميع تفاصيل السلع والتحضيرات اليدوية للأغذية والقهوة.'
                      : 'The culinary prep and thobe tailoring inspection commence immediately following payment confirmation. Every order undergoes a precise quality checklist prior to shipping.'
                    }
                  </p>

                  <div className="border border-white/5 bg-black/50 p-4 rounded-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      <span className="font-mono text-xs text-white uppercase tracking-wider font-semibold">
                        {isAr ? 'مواعيد تجهيز الطلبات القياسية:' : 'Dynamic Processing Timeline:'}
                      </span>
                    </div>
                    
                    <div className="text-white text-xs font-semibold pl-6 rtl:pl-0 rtl:pr-6">
                      {isAr 
                        ? `يستغرق التجهيز: ${shippingConfig.processingTimeAr}`
                        : `Current Processing Window: ${shippingConfig.processingTimeEn}`
                      }
                    </div>

                    <div className="text-[11px] text-zinc-500 pl-6 rtl:pl-0 rtl:pr-6 leading-relaxed">
                      {isAr 
                        ? 'يشمل التجهيز: التحقق من المقاسات، والتحميص اليدوي، والتعبئة الفاخرة المقاومة للصدمات والحرارة.'
                        : 'Processing comprises: strict measurement auditing (for premium thobes), fresh artisanal roasting, and climate-controlled secure vacuum sealing.'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. DISPATCH TIME */}
            <section
              id="dispatch-time"
              ref={(el) => { sectionsRef.current['dispatch-time'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'dispatch-time' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Send className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '5. وقت تسليم الشحنات للمندوب' : '5. Dispatch Protocol'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('dispatch-time', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'dispatch-time' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'بمجرد اكتمال تعبئة وتغليف طلبك الفاخر، نقوم بتسليم الشحنة على الفور لشريك الشحن اللوجستي المعتمد لهذه المنطقة. يتم إرسال تفاصيل الشحنة والرموز التتبعية إليك مباشرة.'
                      : 'As soon as your luxury box passes quality verification, it is formally logged and handed over to our high-priority logistics partners for dispatch. Customers are notified instantly.'
                    }
                  </p>

                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white block">
                      {isAr ? 'المعلومات التي تتلقاها فور شحن طلبك:' : 'Transactional Details Provided Upon Dispatch:'}
                    </span>
                    <ul className="space-y-2 text-[11.5px] pl-4 rtl:pl-0 rtl:pr-4 border-l border-white/5 rtl:border-l-0 rtl:border-r border-gold-pure/20">
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gold-pure rounded-full" />
                        <span>{isAr ? 'رسالة تأكيد الشحن الإلكترونية' : 'Formal Dispatch Confirmation Email'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gold-pure rounded-full" />
                        <span>{isAr ? 'رقم تتبع الشحنة الفوري ورابط التتبع المباشر' : 'Live Tracking Number with direct courier portal links'}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gold-pure rounded-full" />
                        <span>{isAr ? 'رسالة عبر واتساب للتنسيق مع المندوب' : 'WhatsApp notification (if enabled) to coordinate the delivery'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. ESTIMATED DELIVERY TIME */}
            <section
              id="estimated-delivery-time"
              ref={(el) => { sectionsRef.current['estimated-delivery-time'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'estimated-delivery-time' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Table className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '6. الفترات الزمنية المتوقعة للوصول' : '6. Estimated Delivery Time'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('estimated-delivery-time', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'estimated-delivery-time' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'لتحقيق تجربة تسوق راقية وشفافة تماماً، نقدم مقارنة تفصيلية لمواعيد تسليم الشحنات لمختلف الفئات المتوفرة، والتي تتم إدارتها وتحديثها ديناميكياً لتفادي فترات الازدحام:'
                      : 'To preserve complete transparency, here is an elegant comparison table illustrating the standard expected delivery timelines across various premium shipment classes:'
                    }
                  </p>

                  {/* Elegant Comparison Table */}
                  <div className="overflow-x-auto border border-white/5 rounded-xs mt-4">
                    <table className="w-full text-left rtl:text-right border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white border-b border-white/10">
                          <th className="p-3 sm:p-4 font-semibold">{isAr ? 'نوع خيار التوصيل' : 'Delivery Class'}</th>
                          <th className="p-3 sm:p-4 font-semibold">{isAr ? 'المناطق والمدن المشمولة' : 'Eligible Territory'}</th>
                          <th className="p-3 sm:p-4 font-semibold text-gold-pure">{isAr ? 'الفترة المتوقعة للوصول' : 'Estimated Arrival'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-zinc-300">
                        <tr className="hover:bg-white/2 transition-colors">
                          <td className="p-3 sm:p-4 font-medium text-white">{isAr ? 'توصيل بنفس اليوم' : 'Same-Day Delivery'}</td>
                          <td className="p-3 sm:p-4 text-zinc-400">{isAr ? 'داخل مدينة الهفوف ومحيطها' : 'Al Hofuf City & Nearby Outlines'}</td>
                          <td className="p-3 sm:p-4 text-[#D4AF37] font-mono font-semibold">{isAr ? shippingConfig.sameDayDaysAr : shippingConfig.sameDayDaysEn}</td>
                        </tr>
                        <tr className="hover:bg-white/2 transition-colors">
                          <td className="p-3 sm:p-4 font-medium text-white">{isAr ? 'شحن سريع وأولوية' : 'Express Delivery'}</td>
                          <td className="p-3 sm:p-4 text-zinc-400">{isAr ? 'الرياض، الدمام، الخبر، جدة والمطارات الكبرى' : 'Riyadh, Dammam, Khobar, Jeddah Hubs'}</td>
                          <td className="p-3 sm:p-4 text-[#D4AF37] font-mono font-semibold">{isAr ? shippingConfig.expressDaysAr : shippingConfig.expressDaysEn}</td>
                        </tr>
                        <tr className="hover:bg-white/2 transition-colors">
                          <td className="p-3 sm:p-4 font-medium text-white">{isAr ? 'شحن قياسي عادي' : 'Standard Delivery'}</td>
                          <td className="p-3 sm:p-4 text-zinc-400">{isAr ? 'كافة مدن ومحافظات المملكة العربية السعودية' : 'All urban & regional areas across KSA'}</td>
                          <td className="p-3 sm:p-4 text-[#D4AF37] font-mono font-semibold">{isAr ? shippingConfig.standardDaysAr : shippingConfig.standardDaysEn}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10.5px] text-zinc-500 italic mt-3">
                    {isAr 
                      ? '* يرجى العلم بأن هذه المواعيد تُحسب كأيام عمل ولا تشمل عطلات نهاية الأسبوع الرسمية والوطنية.'
                      : '* TIMELINES represent business days and exclude official weekend breaks or government-mandated holidays.'
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* 7. DELIVERY DELAYS */}
            <section
              id="delivery-delays"
              ref={(el) => { sectionsRef.current['delivery-delays'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'delivery-delays' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '7. مسببات التأخير الاستثنائية' : '7. Delivery Delays'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('delivery-delays', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'delivery-delays' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'رغم حرصنا الشديد والتزام شركائنا في الخدمات اللوجستية بالسرعة والمواعيد المحددة، قد تنشأ حالات استثنائية تؤدي إلى تأخير بعض الشحنات خارجة عن إرادة زول.'
                      : 'While we hold ourselves to rigorous punctuality metrics, certain external variables can occasionally impact logistics networks causing unavoidable adjustments.'
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-zinc-300">
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xs flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-pure shrink-0" />
                      <span>{isAr ? 'الوزارات والأعياد والعطلات الرسمية' : 'Public & National Holidays'}</span>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xs flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-pure shrink-0" />
                      <span>{isAr ? 'الظروف الجوية الاستثنائية والعواصف' : 'Severe Weather & Storm disruptions'}</span>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xs flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-pure shrink-0" />
                      <span>{isAr ? 'فترات الضغط العالي والمناسبات الوطنية' : 'Exceptional campaign loads & national events'}</span>
                    </div>
                    <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-xs flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-pure shrink-0 animate-pulse" />
                      <span>{isAr ? 'تزويدنا بعناوين توصيل غير دقيقة' : 'Incorrect or incomplete address details'}</span>
                    </div>
                  </div>

                  <p>
                    {isAr 
                      ? 'سيتواصل معك فريق خدمة العملاء الفاخرة فوراً لإشعارك بأي تغير قد يطرأ على موعد وصول الشحنة وتقديم البدائل المريحة لكم.'
                      : 'Under any anomalous delay window, the ZOAL Customer Support guarantees active communication to provide real-time updates and helpful alternatives.'
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* 8. DELIVERY ADDRESS ACCURACY */}
            <section
              id="delivery-address"
              ref={(el) => { sectionsRef.current['delivery-address'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'delivery-address' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '8. دقة وصحة عنوان التوصيل' : '8. Delivery Address Accuracy'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('delivery-address', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'delivery-address' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'يتحمل العميل الكريم المسؤولية الكاملة عن صحة ودقة البيانات والمعلومات المدخلة في استمارة الدفع. يرجى تزويدنا بالتفاصيل الكاملة لضمان التوصيل السريع دون معوقات:'
                      : 'Customers are strictly responsible for providing complete, up-to-date, and precise geographic coordinates at checkout. An accurate address avoids delivery detours.'
                    }
                  </p>

                  <div className="bg-black/50 border border-white/5 rounded-xs p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">{isAr ? 'المعلومات المطلوبة:' : 'Mandatory Address Elements:'}</span>
                      <ul className="space-y-1.5 text-[11px] text-zinc-300 list-disc list-inside">
                        <li>{isAr ? 'رقم الهاتف الفعال للتنسيق' : 'Active Mobile Phone Number'}</li>
                        <li>{isAr ? 'اسم المدينة والحي السكني' : 'City and neighborhood name'}</li>
                        <li>{isAr ? 'اسم الشارع ورقم المبنى' : 'Street name & building number'}</li>
                        <li>{isAr ? 'الرمز البريدي (إن وجد)' : 'Postal Code (where applicable)'}</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-red-950/10 border border-red-500/10 text-[11px] text-zinc-400 leading-relaxed rounded-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>
                        {isAr 
                          ? 'تنبيه: إن العناوين الخاطئة أو عدم الاستجابة لرسائل واتصالات مندوبي الشحن قد تسبب إرجاع الشحنة لمقرنا، وتتحمل الشحنة رسوم إعادة شحن إضافية.'
                          : 'Advisory: Failing to answer courier calls or providing incorrect addresses may result in the parcel returning to base, incurring additional return shipping fees.'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. ORDER TRACKING */}
            <section
              id="order-tracking"
              ref={(el) => { sectionsRef.current['order-tracking'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'order-tracking' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <Search className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '9. تتبع الشحنات والطلبات' : '9. Order Tracking'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('order-tracking', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'order-tracking' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-4 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'تمتع بمراقبة مسار شحنتك خطوة بخطوة من مستودعاتنا الفاخرة حتى باب منزلك مع آليات تتبع زول الفعالة:'
                      : 'Customers can maintain total situational awareness over their packages from preparation to destination utilizing our dynamic tools:'
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white block">
                        {isAr ? 'تتبع عبر الحساب الشخصي' : 'Customer Account'}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {isAr 
                          ? 'يمكنك التوجه لصفحة حسابك الشخصي لمتابعة مراحل تجهيز ثوبك المخصص أو البن المختار.'
                          : 'Log in to your private customer dashboard to inspect thobe cutting, roasting cycles, or dispatch times.'
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white block">
                        {isAr ? 'تنبيهات البريد والواتساب المباشرة' : 'WhatsApp & Email Alerts'}
                      </span>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {isAr 
                          ? 'تتلقى تحديثاً فورياً عند خروج الشحنة مع المندوب متضمناً رقم هاتف مندوب التوصيل المباشر.'
                          : 'Receive real-time automated progress notes when the courier picks up the parcel containing direct contact phone links.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 10. CONTACT SUPPORT */}
            <section
              id="contact-support"
              ref={(el) => { sectionsRef.current['contact-support'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <div className={`p-6 sm:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                activeSectionId === 'contact-support' ? 'border-[#D4AF37]/35 bg-[#050505]/80' : 'border-white/5'
              }`}>
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gold-pure/5 text-gold-pure">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm sm:text-base font-display uppercase tracking-widest font-semibold">
                      {isAr ? '10. قنوات الدعم والمساعدة' : '10. Contact Support'}
                    </h2>
                  </div>
                  <button onClick={(e) => copySectionLink('contact-support', e)} className="text-zinc-500 hover:text-gold-pure p-1 relative group print:hidden cursor-pointer">
                    {copiedId === 'contact-support' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-6 text-xs sm:text-[13px] text-zinc-400 font-sans leading-relaxed">
                  <p>
                    {isAr 
                      ? 'هل تواجه أي إشكالات في استلام شحنتك؟ أو ترغب بتغيير تفاصيل التسليم قبل خروج المندوب؟ يتواجد فريق العناية بالعملاء الفاخر لمساعدتك على مدار الساعة عبر القنوات الرسمية التالية:'
                      : 'Require assistance with an active shipment? Need to coordinate delivery hours with our dispatcher? The ZOAL Customer Support is fully available 24/7 to cater to your requests:'
                    }
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <a 
                      href={`mailto:${contactDetails.email}`}
                      className="p-4 rounded-xs border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 flex items-start gap-3.5"
                    >
                      <div className="p-2 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'البريد الإلكتروني' : 'Official Email'}</span>
                        <span className="text-xs text-white group-hover:text-gold-pure font-semibold break-all transition-colors">{contactDetails.email}</span>
                      </div>
                    </a>

                    {/* WhatsApp */}
                    <a 
                      href="https://wa.me/966567699315"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xs border border-white/5 bg-black/40 hover:border-gold-pure/30 group transition-all duration-300 flex items-start gap-3.5"
                    >
                      <div className="p-2 rounded-full bg-white/5 group-hover:bg-gold-pure/10 text-zinc-400 group-hover:text-gold-pure transition-all">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'دعم الواتساب المباشر' : 'Support WhatsApp'}</span>
                        <span className="text-xs text-white group-hover:text-gold-pure font-semibold transition-colors">{contactDetails.phone}</span>
                      </div>
                    </a>

                    {/* Support Hours */}
                    <div className="p-4 rounded-xs border border-white/5 bg-black/40 flex items-start gap-3.5 sm:col-span-2">
                      <div className="p-2 rounded-full bg-white/5 text-zinc-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest block">{isAr ? 'خدمة الضيافة ومواعيد الدعم' : 'Support Availability'}</span>
                        <span className="text-xs text-zinc-200 block font-semibold">{isAr ? contactDetails.supportHours.ar : contactDetails.supportHours.en}</span>
                        <span className="text-[11px] text-zinc-400 block font-sans leading-relaxed">
                          {isAr ? `العنوان الفاخر: ${contactDetails.address.ar}` : `Boutique Address: ${contactDetails.address.en}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 print:hidden">
                    <button 
                      onClick={() => dispatchPage('dashboard')}
                      className="px-5 py-2.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black rounded-xs text-[10px] font-mono uppercase tracking-widest font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-lg"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تتبع طلبي الفوري' : 'Track My Active Order'}</span>
                    </button>
                    
                    <button 
                      onClick={() => dispatchPage('contact')}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xs text-[10px] font-mono uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-gold-pure" />
                      <span>{isAr ? 'تواصل مع العناية بالعملاء' : 'Contact Support Desk'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

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
              className="fixed bottom-6 right-6 p-3 bg-gold-pure hover:bg-white text-black rounded-full shadow-2xl transition-all duration-300 cursor-pointer print:hidden z-50 hover:scale-105 active:scale-95 animate-bounce"
              title={isAr ? 'الرجوع للأعلى' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Dynamic Legal Footer Navigation Links block */}
        <div className="mt-16 pt-8 border-t border-white/5 print:hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            
            <button 
              onClick={() => dispatchPage('faq')} 
              className="p-3 border border-white/5 bg-zinc-950/30 hover:border-[#D4AF37]/30 hover:bg-black/60 rounded-sm text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              {isAr ? 'الأسئلة الشائعة' : 'FAQ Help Desk'}
            </button>

            <button 
              onClick={() => dispatchPage('privacy')} 
              className="p-3 border border-white/5 bg-zinc-950/30 hover:border-[#D4AF37]/30 hover:bg-black/60 rounded-sm text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              {isAr ? 'سياسة الخصوصية' : 'Privacy Protection'}
            </button>

            <button 
              onClick={() => dispatchPage('terms')} 
              className="p-3 border border-white/5 bg-zinc-950/30 hover:border-[#D4AF37]/30 hover:bg-black/60 rounded-sm text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </button>

            <button 
              onClick={() => dispatchPage('contact')} 
              className="p-3 border border-white/5 bg-zinc-950/30 hover:border-[#D4AF37]/30 hover:bg-black/60 rounded-sm text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              {isAr ? 'اتصل بنا' : 'Contact Us'}
            </button>

            <button 
              onClick={() => {
                // Trigger Returns Modal dynamically by executing footer click 
                const btn = document.querySelector('button[onClick*="returns"]') as HTMLButtonElement;
                if (btn) btn.click();
              }} 
              className="p-3 border border-white/5 bg-zinc-950/30 hover:border-[#D4AF37]/30 hover:bg-black/60 rounded-sm text-[10px] font-mono uppercase tracking-widest col-span-2 sm:col-span-1 text-zinc-400 hover:text-white transition-all duration-300 cursor-pointer"
            >
              {isAr ? 'سياسة الاسترجاع' : 'Returns & Refunds'}
            </button>

          </div>

          <div className="mt-12 text-center">
            <p className="text-zinc-600 text-[10px] max-w-md mx-auto leading-relaxed">
              {isAr 
                ? 'إن كافة خدمات الشحن والتوصيل ومعالجة البيانات تلتزم التزاماً كاملاً بنظام التجارة الإلكترونية المعمول به بموجب قرارات وزارة التجارة في المملكة العربية السعودية.'
                : 'All logistics operations, delivery handling, and commercial transactions adhere fully to the Electronic Commerce Law of the Kingdom of Saudi Arabia.'
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
