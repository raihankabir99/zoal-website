import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Coffee, 
  RefreshCw, 
  MessageCircle, 
  Mail, 
  Phone, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBranding } from './BrandingContext';
import { faqCategories, faqData, FAQItem } from '../data/faqData';

// Dynamic helper to resolve icons from strings securely
const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'ShoppingBag': return <ShoppingBag className="w-5 h-5" />;
    case 'CreditCard': return <CreditCard className="w-5 h-5" />;
    case 'Truck': return <Truck className="w-5 h-5" />;
    case 'Coffee': return <Coffee className="w-5 h-5" />;
    case 'RefreshCw': return <RefreshCw className="w-5 h-5" />;
    default: return <HelpCircle className="w-5 h-5" />;
  }
};

interface FAQProps {
  setCurrentPage: (page: string) => void;
}

export default function FAQ({ setCurrentPage }: FAQProps) {
  const { i18n } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // SEO Optimization & Structured FAQ Schema (JSON-LD) Injection
  useEffect(() => {
    // 1. Store original metadata
    const originalTitle = document.title;
    const originalMetaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // 2. Set premium SEO Title and Description
    const seoTitle = isAr 
      ? 'الأسئلة الشائعة | زول - فخامة الضيافة والأناقة' 
      : 'Frequently Asked Questions | ZOAL - Curated Luxury & Heritage';
    const seoDescription = isAr
      ? 'اعثر على إجابات لجميع الأسئلة الشائعة حول الشراء، الدفع الإلكتروني، التوصيل السريع للمدن، سياسة الاسترجاع والطلبات الخاصة من متجر زول الفاخر.'
      : 'Find answers to your questions about shopping, payments, shipping, returns, and custom tailoring requests at ZOAL.';
    
    document.title = seoTitle;

    // Find or create standard meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', seoDescription);

    // Find or create Open Graph meta tags
    const ogTags = [
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'ZOAL' }
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

    // 3. Inject Structured FAQ Schema JSON-LD
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map((item) => ({
        "@type": "Question",
        "name": isAr ? item.question.ar : item.question.en,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": isAr ? item.answer.ar : item.answer.en
        }
      }))
    };

    const scriptElement = document.createElement('script');
    scriptElement.type = 'application/ld+json';
    scriptElement.id = 'zoal-faq-schema-json';
    scriptElement.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(scriptElement);

    // Clean up on unmounting to avoid leak
    return () => {
      document.title = originalTitle;
      if (descMeta) {
        descMeta.setAttribute('content', originalMetaDesc);
      }
      createdOgElements.forEach(el => el.remove());
      document.getElementById('zoal-faq-schema-json')?.remove();
    };
  }, [isAr]);

  // Filtering questions instantly based on search query AND active category
  const filteredFAQs = useMemo(() => {
    return faqData.filter((item) => {
      // Category filter
      const matchesCategory = activeCategoryId === 'all' || item.category === activeCategoryId;

      // Search query filter (matching both en and ar)
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const qEn = item.question.en.toLowerCase();
      const qAr = item.question.ar.toLowerCase();
      const aEn = item.answer.en.toLowerCase();
      const aAr = item.answer.ar.toLowerCase();

      const matchesSearch = 
        qEn.includes(query) || 
        qAr.includes(query) || 
        aEn.includes(query) || 
        aAr.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategoryId]);

  // Handle Accordion Toggle (ensure only one remains expanded at a time)
  const handleToggleItem = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  // Dynamic helper to format and clean text (replacing placeholders or hardcoded strings)
  const formatText = (text: string) => {
    return text
      .replace(/\+966 56 769 9315/g, settings.phone)
      .replace(/966567699315/g, settings.phone.replace(/\+/g, '').replace(/\s+/g, ''))
      .replace(/alzoal3003@gmail.com/g, settings.email);
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="bg-black text-white min-h-screen pt-24 sm:pt-32 pb-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative">
      
      {/* Decorative Premium Glow Background elements */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#D4AF37] opacity-[0.03] blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.02] blur-[180px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Luxury Badge Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-display font-semibold text-gold-pure">
              {isAr ? 'مركز المساعدة الفاخر' : 'Luxury Support Center'}
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
            {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-5" />
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto"
          >
            {isAr 
              ? 'اعثر على إجابات وافية لأكثر الأسئلة تكراراً حول طريقتنا الفاخرة في التسوق، المدفوعات الآمنة، سياسات التوصيل، الإرجاع، وتفاصيل حسابك في زول.' 
              : 'Find answers to the most common questions about shopping, payments, delivery, returns, and your ZOAL account.'
            }
          </motion.p>
        </div>

        {/* Search Bar Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-10 max-w-xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-gold-pure transition-colors">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن سؤالك...' : 'Search your question...'}
              className="w-full pl-11 pr-5 py-3.5 bg-[#050505] border border-white/5 hover:border-white/10 focus:border-[#D4AF37]/50 focus:outline-none rounded-sm text-xs sm:text-sm text-white placeholder-zinc-500 font-sans tracking-wide transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 inset-y-0 text-zinc-500 hover:text-white text-xs tracking-widest uppercase transition-colors"
              >
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
        </motion.div>

        {/* Categories Navigation Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 border-b border-white/5 pb-6"
        >
          <button
            onClick={() => {
              setActiveCategoryId('all');
              setExpandedItemId(null);
            }}
            className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-mono transition-all duration-300 border cursor-pointer select-none ${
              activeCategoryId === 'all' 
                ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-semibold shadow-[0_4px_12px_rgba(212,175,55,0.2)]' 
                : 'bg-zinc-950/40 text-zinc-400 border-white/5 hover:text-white hover:border-white/20'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>

          {faqCategories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setExpandedItemId(null); // Close active accordion
                }}
                className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-mono transition-all duration-300 border flex items-center gap-1.5 cursor-pointer select-none ${
                  isActive 
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] font-semibold shadow-[0_4px_12px_rgba(212,175,55,0.2)]' 
                    : 'bg-zinc-950/40 text-zinc-400 border-white/5 hover:text-white hover:border-white/20'
                }`}
              >
                {getCategoryIcon(cat.icon)}
                <span>{isAr ? cat.name.ar : cat.name.en}</span>
              </button>
            );
          })}
        </motion.div>

        {/* FAQ Accordion Lists Container */}
        <div className="space-y-4 mb-16 min-h-[250px]">
          <AnimatePresence mode="popLayout">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item, index) => {
                const isExpanded = expandedItemId === item.id;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
                    className={`bg-zinc-950/50 backdrop-blur-sm border rounded-sm overflow-hidden transition-all duration-300 ${
                      isExpanded 
                        ? 'border-[#D4AF37]/50 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_15px_rgba(212,175,55,0.05)]' 
                        : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Header trigger button */}
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      className="w-full p-4 sm:p-5 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/35 cursor-pointer select-none"
                      aria-expanded={isExpanded}
                      id={`faq-btn-${item.id}`}
                    >
                      <span className={`text-xs sm:text-sm font-display uppercase tracking-wider font-semibold transition-colors duration-300 text-left ${
                        isExpanded ? 'text-gold-pure' : 'text-zinc-200 hover:text-white'
                      }`}>
                        {isAr ? item.question.ar : item.question.en}
                      </span>
                      
                      <div className={`p-1.5 rounded-full border transition-all duration-300 shrink-0 ${
                        isExpanded 
                          ? 'border-gold-pure/30 bg-gold-pure/5 text-gold-pure rotate-180' 
                          : 'border-white/5 text-zinc-500'
                      }`}>
                        {isExpanded ? (
                          <Minus className="w-3.5 h-3.5 sm:w-4 h-4" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 sm:w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Smooth height-animation answer body */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <div className="px-4 sm:px-5 pb-5 pt-1 text-zinc-400 text-xs sm:text-[13px] leading-relaxed border-t border-white/5 bg-zinc-950/20 font-sans">
                            {formatText(isAr ? item.answer.ar : item.answer.en)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              /* Empty filtered results */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 border border-white/5 rounded-sm bg-zinc-950/10"
              >
                <HelpCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3 animate-bounce" />
                <h3 className="text-zinc-300 font-display uppercase tracking-widest text-xs mb-1 font-semibold">
                  {isAr ? 'لا توجد نتائج مطابقة' : 'No matching questions found'}
                </h3>
                <p className="text-zinc-500 text-[11px] max-w-xs mx-auto">
                  {isAr 
                    ? 'حاول إعادة صياغة البحث أو تصفح الأقسام للعثور على الإجابة.' 
                    : 'Try clarifying your search terms or exploring the category filters above.'
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contact Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-b from-zinc-950/80 to-black border border-[#D4AF37]/25 p-6 sm:p-10 rounded-sm text-center relative overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.8)] mb-12"
        >
          {/* Subtle gold frames */}
          <div className="absolute inset-1 pointer-events-none border border-[#D4AF37]/5 rounded-xs"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent"></div>

          <h3 className="text-sm sm:text-base font-display font-semibold uppercase tracking-widest text-white mb-2">
            {isAr ? 'هل ما زلت بحاجة إلى مساعدة؟' : 'Still need help?'}
          </h3>
          <p className="text-zinc-400 text-xs max-w-md mx-auto mb-8 leading-relaxed">
            {isAr 
              ? 'إذا لم تتمكن من العثور على إجابتك هنا، يسعدنا جداً تقديم مساعدة مخصصة عبر قنوات الدعم الرسمية لدينا.' 
              : "If you couldn't find your answer, our support team is happy to assist you."
            }
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto">
            {/* Contact page routing trigger */}
            <button
              onClick={() => {
                setCurrentPage('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-3 px-4 bg-[#D4AF37] hover:bg-white text-black font-display font-semibold uppercase tracking-widest text-[10px] rounded-sm transition-all duration-300 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{isAr ? 'تواصل معنا' : 'Contact Us'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
            </button>

            {/* WhatsApp trigger */}
            <a
              href={`https://wa.me/${settings.phone.replace(/\+/g, '').replace(/\s+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-zinc-900/40 text-[#D4AF37] rounded-sm transition-all duration-300 active:scale-98 flex items-center justify-center"
              title="WhatsApp"
            >
              <svg className="w-4 h-4 shrink-0 text-gold-pure fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.71 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>

            {/* Email trigger */}
            <a
              href={`mailto:${settings.email}`}
              className="py-3 px-4 border border-white/5 hover:border-white/15 bg-[#050505] hover:bg-zinc-900/30 text-zinc-300 hover:text-white font-display uppercase tracking-widest text-[10px] rounded-sm transition-all duration-300 active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Mail className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>{isAr ? 'الدعم البريدي' : 'Email Support'}</span>
            </a>
          </div>
        </motion.div>

        {/* Footer CTA Banner section */}
        <div className="text-center pt-4 border-t border-white/5 mt-12">
          <p className="text-zinc-500 text-[10.5px] leading-relaxed max-w-md mx-auto">
            {isAr 
              ? 'هل تحتاج لمزيد من المساعدة؟ تواصل مع فريق العناية بالعملاء الفاخر للحصول على استشارات مخصصة لطلبك.' 
              : 'Need more assistance? Contact our customer support team for personalized help.'
            }
          </p>
          <div className="flex items-center justify-center gap-2.5 mt-3 text-zinc-400 font-mono text-[10px]">
            <Phone className="w-3.5 h-3.5 text-gold-pure" />
            <span dir="ltr">{settings.phone}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-gold-pure uppercase tracking-widest">{isAr ? 'متاح 24/7' : 'Available 24/7'}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
