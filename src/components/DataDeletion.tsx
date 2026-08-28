import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Calendar, 
  Printer, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Copy, 
  Check, 
  ChevronDown,
  Mail,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ReadingProgressBar } from './ReadingProgressBar';
import { scrollToLegalSection } from '../utils/legalScroll';
import { useBranding } from './BrandingContext';

interface DeletionSection {
  id: string;
  title: { en: string; ar: string };
  icon: string;
}

const deletionSections: DeletionSection[] = [
  { id: 'overview', title: { en: 'Overview', ar: 'نظرة عامة' }, icon: 'Info' },
  { id: 'what-can-be-deleted', title: { en: 'What Can Be Deleted', ar: 'البيانات القابلة للحذف' }, icon: 'Trash2' },
  { id: 'what-retained', title: { en: 'What May Be Retained', ar: 'البيانات التي قد تُحتفظ بها' }, icon: 'Lock' },
  { id: 'how-to-request', title: { en: 'How to Request Deletion', ar: 'كيفية تقديم طلب الحذف' }, icon: 'FileText' },
  { id: 'processing-support', title: { en: 'Processing & Support', ar: 'مدة المعالجة والدعم' }, icon: 'Clock' }
];

const getSectionIcon = (iconName: string, className = "w-5 h-5 text-gold-pure") => {
  switch (iconName) {
    case 'Info': return <Info className={className} />;
    case 'Trash2': return <Trash2 className={className} />;
    case 'Lock': return <Lock className={className} />;
    case 'FileText': return <FileText className={className} />;
    case 'Clock': return <Clock className={className} />;
    default: return <Info className={className} />;
  }
};

export default function DataDeletion() {
  const { i18n, t } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<string>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileTOCExpanded, setMobileTOCExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Accordion Expand / Collapse state per section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'overview': true,
    'what-can-be-deleted': false,
    'what-retained': false,
    'how-to-request': false,
    'processing-support': false
  });

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

  // Handle Scroll Progress and Section Tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);

      setShowScrollTop(scrollTop > 400);

      const scrollPosition = scrollTop + 160;
      
      let currentActiveSection = 'overview';
      for (const section of deletionSections) {
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
    scrollToLegalSection({
      id,
      element: sectionsRef.current[id],
      onSelect: setActiveSectionId,
      closeMobileMenu: () => setMobileTOCExpanded(false),
      onExpand: (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: true })),
    });
  };

  const copySectionLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/data-deletion#${id}`;
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
      className="bg-black text-white min-h-screen pt-20 sm:pt-32 pb-12 sm:pb-20 px-2 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black overflow-hidden relative"
      id="zoal-data-deletion-page"
    >
      {/* Background Decorative Gradients matching the luxury theme */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37] opacity-[0.03] blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[#D4AF37] opacity-[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Reading Progress Indicator Bar */}
      <ReadingProgressBar progress={scrollProgress} />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Privacy Tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-3 sm:mb-4 print:hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1 rounded-full bg-gold-pure/5 border border-gold-pure/15">
            <Sparkles className="w-3 h-3 text-gold-pure animate-pulse shrink-0" />
            <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] font-display font-semibold text-gold-pure text-center">
              {isAr ? 'إطار سيادة البيانات والخصوصية' : 'Digital Privacy Framework'}
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
            {isAr ? 'حذف بيانات المستخدم' : 'User Data Deletion'}
          </motion.h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-3 sm:mb-5" />
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-sans px-2 sm:px-0"
          >
            {isAr 
              ? 'تعرف على كيفية تقديم طلب لحذف حساب "زول" الخاص بك ومعلوماتك الشخصية.' 
              : 'Learn how to request deletion of your ZOAL account and personal information.'
            }
          </motion.p>

          {/* Last Updated & Print Badge */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-zinc-500"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gold-pure/80" />
              {isAr ? `آخر تحديث: ${lastUpdatedDate}` : `Last Updated: ${lastUpdatedDate}`}
            </span>
            <span className="text-zinc-800 hidden sm:inline">|</span>
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

        {/* Mobile Sticky Table of Contents Trigger */}
        <div className="md:hidden sticky top-16 sm:top-20 z-40 mb-4 print:hidden">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-sm shadow-xl overflow-hidden">
            <button 
              onClick={() => setMobileTOCExpanded(!mobileTOCExpanded)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-zinc-300 hover:text-white focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-gold-pure" />
                <span className="text-[10px] sm:text-xs uppercase font-mono tracking-wider">
                  {isAr ? 'أقسام سياسة حذف البيانات' : 'Deletion Policy Sections'}
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
                    {deletionSections.map((sect) => {
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
                {deletionSections.map((sect) => {
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

          {/* RIGHT COLUMN: DATA DELETION SECTIONS */}
          <div className="md:col-span-8 space-y-3.5 sm:space-y-6 md:space-y-8 print:w-full">
            
            {/* Section 1: Overview */}
            <section
              id="overview"
              ref={(el) => { sectionsRef.current['overview'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                  activeSectionId === 'overview' 
                    ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                  activeSectionId === 'overview' ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                }`} />

                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedSections(prev => ({
                      ...prev,
                      'overview': !prev['overview']
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSections(prev => ({
                        ...prev,
                        'overview': !prev['overview']
                      }));
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                    expandedSections['overview'] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                      activeSectionId === 'overview' 
                        ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                        : 'bg-white/5 border-transparent text-zinc-400'
                    }`}>
                      <Info className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </div>
                    <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                      activeSectionId === 'overview' ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                    }`}>
                      {isAr ? 'نظرة عامة' : 'Overview'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0">
                    <button
                      onClick={(e) => copySectionLink('overview', e)}
                      className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
                      title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                    >
                      {copiedId === 'overview' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedSections['overview'] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections['overview'] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-sans">
                        {isAr 
                          ? 'تحترم "زول" خصوصية عملائها وتوفر آلية ميسرة لطلب حذف المعلومات الشخصية المؤهلة، مع الاحتفاظ ببعض السجلات والبيانات عندما يكون ذلك مطلوباً بموجب القوانين واللوائح السارية.'
                          : 'ZOAL respects customer privacy and provides a process for requesting deletion of eligible personal information while retaining records where legally required.'
                        }
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Section 2: What Can Be Deleted */}
            <section
              id="what-can-be-deleted"
              ref={(el) => { sectionsRef.current['what-can-be-deleted'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                  activeSectionId === 'what-can-be-deleted' 
                    ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                  activeSectionId === 'what-can-be-deleted' ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                }`} />

                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedSections(prev => ({
                      ...prev,
                      'what-can-be-deleted': !prev['what-can-be-deleted']
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSections(prev => ({
                        ...prev,
                        'what-can-be-deleted': !prev['what-can-be-deleted']
                      }));
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                    expandedSections['what-can-be-deleted'] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                      activeSectionId === 'what-can-be-deleted' 
                        ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                        : 'bg-white/5 border-transparent text-zinc-400'
                    }`}>
                      <Trash2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </div>
                    <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                      activeSectionId === 'what-can-be-deleted' ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                    }`}>
                      {isAr ? 'البيانات التي يمكن حذفها' : 'What Can Be Deleted'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0">
                    <button
                      onClick={(e) => copySectionLink('what-can-be-deleted', e)}
                      className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
                      title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                    >
                      {copiedId === 'what-can-be-deleted' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedSections['what-can-be-deleted'] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections['what-can-be-deleted'] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-4 sm:mb-6 font-sans">
                        {isAr 
                          ? 'يجوز للعملاء والزوار طلب الحذف الكامل والنهائي لفئات البيانات الشخصية والملفات التالية:'
                          : 'Customers and visitors may request the permanent and complete removal of the following personal data categories and profiles:'
                        }
                      </p>

                      {/* Professional checklist of deletable data */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mt-4 sm:mt-6">
                        {[
                          { en: 'ZOAL Account', ar: 'حساب زول الشخصي' },
                          { en: 'Personal Profile', ar: 'الملف الشخصي والمقاييس' },
                          { en: 'Saved Addresses', ar: 'العناوين المحفوظة' },
                          { en: 'Wishlist', ar: 'قائمة الأمنيات والمفضلات' },
                          { en: 'Marketing Preferences', ar: 'التفضيلات التسويقية والاشتراكات' },
                          { en: 'Stored Personal Information', ar: 'المعلومات الشخصية المخزنة' },
                          { en: 'Notification Preferences', ar: 'تفضيلات الإشعارات والتنبيهات' }
                        ].map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 sm:p-4 rounded-xs border border-white/5 bg-zinc-950/40 hover:border-gold-pure/20 transition-all duration-300 flex items-center gap-2.5 sm:gap-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-pure shrink-0" />
                            <span className="text-zinc-300 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider">
                              {isAr ? item.ar : item.en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Section 3: What May Be Retained */}
            <section
              id="what-retained"
              ref={(el) => { sectionsRef.current['what-retained'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                  activeSectionId === 'what-retained' 
                    ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                  activeSectionId === 'what-retained' ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                }`} />

                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedSections(prev => ({
                      ...prev,
                      'what-retained': !prev['what-retained']
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSections(prev => ({
                        ...prev,
                        'what-retained': !prev['what-retained']
                      }));
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                    expandedSections['what-retained'] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                      activeSectionId === 'what-retained' 
                        ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                        : 'bg-white/5 border-transparent text-zinc-400'
                    }`}>
                      <Lock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </div>
                    <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                      activeSectionId === 'what-retained' ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                    }`}>
                      {isAr ? 'البيانات التي قد يتم الاحتفاظ بها' : 'What May Be Retained'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0">
                    <button
                      onClick={(e) => copySectionLink('what-retained', e)}
                      className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
                      title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                    >
                      {copiedId === 'what-retained' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedSections['what-retained'] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections['what-retained'] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-4 sm:mb-6 font-sans">
                        {isAr 
                          ? 'يرجى العلم أن بعض فئات السجلات لا يمكن حذفها فوراً، وسيتم الاحتفاظ بها بصفة آمنة عند الضرورة للوفاء بالالتزامات الضريبية والمالية والقانونية:'
                          : 'Please be advised that certain log files and transactions cannot be immediately expunged and will be securely retained where necessary for regulatory, financial, or tax compliance:'
                        }
                      </p>

                      {/* Professional layout of retained items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                        {[
                          { en: 'Orders & Purchases', ar: 'الطلبات والمشتريات التاريخية' },
                          { en: 'Tax Invoices & Receipts', ar: 'الفواتير الضريبية والإيصالات' },
                          { en: 'VAT & ZATCA Records', ar: 'سجلات ضريبة القيمة المضافة (هيئة الزكاة)' },
                          { en: 'Financial Transactions', ar: 'المعاملات والتحويلات المالية' },
                          { en: 'Fraud Prevention Logs', ar: 'سجلات كشف ومنع الاحتيال' },
                          { en: 'Security Logs', ar: 'سجلات النظام الأمنية والتدقيق' },
                          { en: 'Legal Compliance Records', ar: 'سجلات الامتثال والدعاوى القانونية' }
                        ].map((item, idx) => (
                          <div 
                            key={idx} 
                            className="p-3 sm:p-4 rounded-xs border border-white/5 bg-zinc-950/40 flex items-center gap-2.5 sm:gap-3"
                          >
                            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37] shrink-0" />
                            <span className="text-zinc-300 text-[10.5px] sm:text-xs font-mono uppercase tracking-wider">
                              {isAr ? item.ar : item.en}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Local jurisdiction alert notice conforming to design standard */}
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xs border border-gold-pure/15 bg-gold-pure/5 flex items-start gap-2.5 sm:gap-3">
                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-pure shrink-0 mt-0.5" />
                        <p className="text-gold-pure text-[10.5px] sm:text-xs leading-relaxed font-sans">
                          {isAr 
                            ? 'تنويه: يتم الاحتفاظ بهذه السجلات فقط عندما يكون ذلك مطلوباً بموجب قوانين المملكة العربية السعودية واللوائح التنظيمية المعمول بها.'
                            : 'Notice: These records are retained only where required under Saudi Arabian laws and applicable regulations.'
                          }
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Section 4: How to Request Deletion */}
            <section
              id="how-to-request"
              ref={(el) => { sectionsRef.current['how-to-request'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                  activeSectionId === 'how-to-request' 
                    ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                  activeSectionId === 'how-to-request' ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                }`} />

                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedSections(prev => ({
                      ...prev,
                      'how-to-request': !prev['how-to-request']
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSections(prev => ({
                        ...prev,
                        'how-to-request': !prev['how-to-request']
                      }));
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                    expandedSections['how-to-request'] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                      activeSectionId === 'how-to-request' 
                        ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                        : 'bg-white/5 border-transparent text-zinc-400'
                    }`}>
                      <FileText className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </div>
                    <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                      activeSectionId === 'how-to-request' ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                    }`}>
                      {isAr ? 'كيفية طلب حذف البيانات' : 'How to Request Deletion'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0">
                    <button
                      onClick={(e) => copySectionLink('how-to-request', e)}
                      className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
                      title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                    >
                      {copiedId === 'how-to-request' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedSections['how-to-request'] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections['how-to-request'] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed mb-6 sm:mb-8 font-sans">
                        {isAr 
                          ? 'يرجى اتباع الخطوات البسيطة والمنظمة التالية لتقديم طلب إزالة البيانات والملفات بشكل صحيح وآمن:'
                          : 'Please follow these structured steps to execute your right to data erasure securely and promptly:'
                        }
                      </p>

                      {/* Steps Timeline conforming to brand style */}
                      <div className="space-y-4 sm:space-y-8 relative before:absolute before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5 before:left-3.5 rtl:before:left-auto rtl:before:right-3.5">
                        
                        {/* Step 1 */}
                        <div className="flex gap-3 sm:gap-4 relative">
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold-pure flex items-center justify-center font-mono text-xs font-bold shrink-0 z-10">1</div>
                          <div className="space-y-2 text-left rtl:text-right flex-1 min-w-0">
                            <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-wider font-semibold">
                              {isAr ? 'تواصل مع فريق الدعم لدينا' : 'Contact our Support Team'}
                            </h3>
                            <p className="text-zinc-400 text-[11px] sm:text-xs font-sans">
                              {isAr ? 'أرسل بريداً إلكترونياً مباشراً بطلبك:' : 'Send an email detailing your request to our compliance department:'}
                            </p>
                            <div className="p-2.5 sm:p-3 bg-zinc-950/80 border border-white/5 rounded-xs space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] w-14 shrink-0">{isAr ? 'البريد:' : 'Email:'}</span>
                                <a href="mailto:alzoal3003@gmail.com" className="text-white hover:text-[#D4AF37] text-[11px] font-mono transition-colors duration-200 truncate">alzoal3003@gmail.com</a>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] w-14 shrink-0">{isAr ? 'العنوان:' : 'Subject:'}</span>
                                <span className="text-zinc-300 text-[11px] font-mono truncate">Delete My Account / حذف حسابي</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-3 sm:gap-4 relative">
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold-pure flex items-center justify-center font-mono text-xs font-bold shrink-0 z-10">2</div>
                          <div className="space-y-2 text-left rtl:text-right flex-1 min-w-0">
                            <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-wider font-semibold">
                              {isAr ? 'تقديم التفاصيل الأساسية للتحقق' : 'Include Required Details'}
                            </h3>
                            <p className="text-zinc-400 text-[11px] sm:text-xs font-sans">
                              {isAr ? 'يرجى تزويدنا بالمعلومات التالية في رسالتك:' : 'To locate your record, please provide the following details in your email:'}
                            </p>
                            <ul className="list-disc pl-4 pr-4 text-[10.5px] sm:text-xs text-zinc-400 space-y-1 font-sans">
                              <li>{isAr ? 'الاسم الكامل للعميل' : 'Full Name'}</li>
                              <li>{isAr ? 'عنوان البريد الإلكتروني المسجل في المنصة' : 'Registered Email Address'}</li>
                              <li>{isAr ? 'رقم الهاتف المحمول (اختياري)' : 'Optional Phone Number'}</li>
                              <li>{isAr ? 'سبب طلب الحذف (اختياري - لمساعدتنا في تحسين خدماتنا)' : 'Reason for Request (Optional)'}</li>
                            </ul>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-3 sm:gap-4 relative">
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold-pure flex items-center justify-center font-mono text-xs font-bold shrink-0 z-10">3</div>
                          <div className="space-y-1 text-left rtl:text-right flex-1 min-w-0">
                            <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-wider font-semibold">
                              {isAr ? 'التحقق من الهوية كإجراء أمان' : 'Identity Verification'}
                            </h3>
                            <p className="text-zinc-400 text-[11px] sm:text-xs font-sans leading-relaxed">
                              {isAr 
                                ? 'لمنع عمليات الاحتيال وحماية خصوصية بياناتك، قد يطلب منك فريق الامتثال التحقق من امتلاكك للبريد الإلكتروني أو رقم الهاتف المسجل لدينا كخطوة تأكيدية ثنائية.'
                                : 'To protect customer identity and prevent fraudulent deletions, our compliance team may request verification of account ownership before proceeding.'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-3 sm:gap-4 relative">
                          <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-gold-pure flex items-center justify-center font-mono text-xs font-bold shrink-0 z-10">4</div>
                          <div className="space-y-1 text-left rtl:text-right flex-1 min-w-0">
                            <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-wider font-semibold">
                              {isAr ? 'التأكيد والإزالة النهائية للبيانات' : 'Final Processing & Erasure'}
                            </h3>
                            <p className="text-zinc-400 text-[11px] sm:text-xs font-sans leading-relaxed">
                              {isAr 
                                ? 'بمجرد انتهاء التحقق بنجاح، سيتم حذف وإزالة جميع البيانات الشخصية والملفات المؤهلة بشكل دائم من خوادمنا النشطة والأنظمة المساندة، وتلقي إشعار نهائي بالإتمام.'
                                : 'Upon successful verification, all eligible personal information will be permanently purged from our active databases and servers. You will receive a final confirmation email.'
                              }
                            </p>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* Section 5: Processing & Support */}
            <section
              id="processing-support"
              ref={(el) => { sectionsRef.current['processing-support'] = el; }}
              className="scroll-mt-28 print:break-inside-avoid"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`p-2.5 sm:p-6 md:p-8 bg-[#050505]/40 backdrop-blur-md border rounded-sm transition-all duration-500 relative overflow-hidden shadow-2xl ${
                  activeSectionId === 'processing-support' 
                    ? 'border-[#D4AF37]/35 bg-[#050505]/80 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_15px_rgba(212,175,55,0.03)]' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[1.5px] transition-all duration-500 ${
                  activeSectionId === 'processing-support' ? 'bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent' : 'bg-transparent'
                }`} />

                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedSections(prev => ({
                      ...prev,
                      'processing-support': !prev['processing-support']
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedSections(prev => ({
                        ...prev,
                        'processing-support': !prev['processing-support']
                      }));
                    }
                  }}
                  className={`flex items-center justify-between gap-1.5 sm:gap-3 pb-2.5 sm:pb-4 border-b border-white/5 cursor-pointer select-none group/hdr focus:outline-none focus-visible:ring-1 focus-visible:ring-gold-pure/50 ${
                    expandedSections['processing-support'] ? 'mb-3.5 sm:mb-6' : 'mb-0'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border shrink-0 transition-all duration-500 ${
                      activeSectionId === 'processing-support' 
                        ? 'bg-gold-pure/5 border-gold-pure/30 text-gold-pure' 
                        : 'bg-white/5 border-transparent text-zinc-400'
                    }`}>
                      <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0" />
                    </div>
                    <h2 className={`text-[11.5px] sm:text-sm md:text-base font-display uppercase tracking-wider sm:tracking-widest font-semibold leading-tight flex-1 min-w-0 transition-colors duration-500 ${
                      activeSectionId === 'processing-support' ? 'text-gold-pure' : 'text-white group-hover/hdr:text-gold-pure'
                    }`}>
                      {isAr ? 'مدة المعالجة والدعم الفني' : 'Processing Time & Support'}
                    </h2>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5 print:hidden shrink-0">
                    <button
                      onClick={(e) => copySectionLink('processing-support', e)}
                      className="p-1 sm:p-1.5 rounded-sm hover:bg-white/5 text-zinc-500 hover:text-gold-pure transition-colors duration-300 cursor-pointer"
                      title={isAr ? 'نسخ رابط القسم' : 'Copy section link'}
                    >
                      {copiedId === 'processing-support' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <motion.div
                      animate={{ rotate: expandedSections['processing-support'] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-zinc-500 group-hover/hdr:text-gold-pure transition-colors p-0.5 sm:p-1 shrink-0"
                    >
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {expandedSections['processing-support'] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6">
                        {/* Processing Time Card */}
                        <div className="p-3.5 sm:p-5 rounded-xs border border-white/5 bg-zinc-950/40 relative overflow-hidden flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-pure shrink-0" />
                              <h4 className="text-white text-xs font-semibold font-display uppercase tracking-wider">
                                {isAr ? 'مدة معالجة الطلبات' : 'Typical Processing Time'}
                              </h4>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                              {isAr 
                                ? 'نعمل بكل طاقة لمعالجة طلبات الإزالة بأسرع وقت ممكن بعد استلام تأكيد الهوية الثنائي لضمان دقة التنفيذ.'
                                : 'We work efficiently to execute deletion requests in a secure manner following full owner verification.'
                              }
                            </p>
                          </div>
                          <span className="text-gold-pure font-mono uppercase tracking-widest text-xs sm:text-[13px] font-bold mt-3 sm:mt-4 block">
                            {isAr ? '• ما يصل إلى 30 يوماً' : '• Up to 30 days'}
                          </span>
                        </div>

                        {/* Private Support Card */}
                        <div className="p-3.5 sm:p-5 rounded-xs border border-[#D4AF37]/20 bg-gold-pure/5 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-pure shrink-0" />
                              <h4 className="text-white text-xs font-semibold font-display uppercase tracking-wider">
                                {isAr ? 'قنوات الامتثال والدعم' : 'Compliance & Helpdesk'}
                              </h4>
                            </div>
                            <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                              {isAr 
                                ? 'إذا كانت لديكم أي استفسارات أو ملاحظات إضافية حول حقوقكم القانونية وإدارة بيانات الهوية الشخصية في زول.'
                                : 'For any questions or clarification regarding your data sovereignty rights or this document.'
                              }
                            </p>
                          </div>
                          <a 
                            href="mailto:alzoal3003@gmail.com" 
                            className="text-gold-pure font-mono text-[11px] mt-3 sm:mt-4 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer truncate"
                          >
                            <span className="truncate">alzoal3003@gmail.com</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                          </a>
                        </div>
                      </div>

                      {/* Navigation and links to related legal documents */}
                      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/5">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-3 sm:mb-4">
                          {isAr ? 'روابط قانونية ذات صلة:' : 'Related Legal Frameworks:'}
                        </span>
                        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-2.5">
                          {[
                            { key: 'privacy', en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
                            { key: 'terms', en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
                            { key: 'cookies', en: 'Cookie Policy', ar: 'سياسة ملفات الارتباط' },
                            { key: 'shipping', en: 'Shipping Policy', ar: 'سياسة الشحن والتوصيل' },
                            { key: 'returns', en: 'Return & Refund Policy', ar: 'سياسة الاسترجاع والاستبدال' },
                            { key: 'contact', en: 'Contact Us', ar: 'اتصل بنا' }
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => navigateToPage(item.key)}
                              className="text-[10.5px] sm:text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-gold-pure transition-colors duration-200 cursor-pointer flex items-center gap-1"
                            >
                              <span>{isAr ? item.ar : item.en}</span>
                              <span className="text-[8px] text-zinc-700 select-none">/</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
