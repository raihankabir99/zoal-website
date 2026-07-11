import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ArrowLeft, 
  Home, 
  ShoppingBag, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight, 
  Compass, 
  Package, 
  Heart,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalProducts } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface NotFoundProps {
  setCurrentPage: (page: string) => void;
  onProductSelect: (product: any) => void;
  setSelectedCategoryFilter?: (category: string) => void;
}

export default function NotFound({ setCurrentPage, onProductSelect, setSelectedCategoryFilter }: NotFoundProps) {
  const { i18n, t } = useTranslation();
  const isAr = i18n.language === 'ar';
  const allProducts = useGlobalProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Translations object tailored to the 404 experience
  const localT = {
    header: '404',
    title: isAr ? 'عذراً! الصفحة غير موجودة' : 'Oops! Page Not Found',
    description: isAr 
      ? 'يبدو أن الصفحة التي تبحث عنها غير موجودة، أو ربما تم نقلها إلى عنوان آخر.' 
      : "The page you're looking for doesn't exist or may have been moved.",
    searchPlaceholder: isAr ? 'ابحث عن منتجات فاخرة...' : 'Search bespoke collections...',
    searchResultsTitle: isAr ? 'النتائج المقترحة' : 'Suggested Results',
    goHome: isAr ? 'الرئيسية' : 'Go Home',
    continueShopping: isAr ? 'مواصلة التسوق' : 'Continue Shopping',
    back: isAr ? 'الرجوع للخلف' : 'Go Back',
    popularCategories: isAr ? 'الأقسام الأكثر طلباً' : 'Popular Collections',
    recentlyViewed: isAr ? 'شوهد مؤخراً' : 'Recently Viewed',
    recommended: isAr ? 'توصيات حصرية' : 'Exquisite Recommendations',
    noResults: isAr ? 'لم نجد أي نتائج تطابق بحثك' : 'No exquisite collections match your search.',
    examine: isAr ? 'تفاصيل' : 'Examine',
    sar: isAr ? 'ر.س' : 'SAR',
    categoryNames: {
      coffee: isAr ? 'القهوة المختصة' : 'Specialty Coffee',
      bakery: isAr ? 'المخبوزات الفاخرة' : 'Artisan Bakery',
      market: isAr ? 'سوق زول التراثي' : 'Curated Heritage Market',
      fashion: isAr ? 'الأزياء الراقية' : 'Haute Couture',
      thobes: isAr ? 'الثياب الفاخرة' : 'Imperial Thobes'
    } as Record<string, string>
  };

  // Prevent indexing via noindex robots meta tag
  useEffect(() => {
    // Add noindex to the head
    let robotsMeta = document.querySelector('meta[name="robots"]');
    const existed = !!robotsMeta;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    const originalContent = robotsMeta.getAttribute('content') || '';
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    // Sync browser tab title
    const originalTitle = document.title;
    document.title = isAr ? '٤٠٤ - الصفحة غير موجودة | زول' : '404 - Page Not Found | ZOAL';

    return () => {
      document.title = originalTitle;
      if (existed) {
        robotsMeta?.setAttribute('content', originalContent);
      } else {
        robotsMeta?.remove();
      }
    };
  }, [isAr]);

  // Read recently viewed products from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zoal_recently_viewed');
      if (stored) {
        const parsedIds = JSON.parse(stored);
        if (Array.isArray(parsedIds)) {
          // Filter products matching those ids
          const matched = parsedIds
            .map(id => allProducts.find(p => p.id === id))
            .filter(Boolean)
            .slice(0, 4);
          setRecentlyViewed(matched);
        }
      }
    } catch (error) {
      console.error('Error reading recently viewed items:', error);
    }
  }, [allProducts]);

  // Live product search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, allProducts]);

  // Highly-curated recommended products
  const recommendedProducts = useMemo(() => {
    return allProducts.filter(p => p.popular).slice(0, 4);
  }, [allProducts]);

  const handleCategoryClick = (catId: string) => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter(catId);
      setCurrentPage('store');
    } else {
      // Directing to the store page with the selected category filter
      const event = new CustomEvent('zoal-route-change', { detail: 'store' });
      window.dispatchEvent(event);
      
      // Set category state in global context if possible, or trigger it via local storage
      localStorage.setItem('zoal_selected_category_filter', catId);
      // Dispatch custom event to sync with store filter
      window.dispatchEvent(new Event('zoal-sync-category-filter'));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (product: any) => {
    onProductSelect(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    window.history.back();
  };

  // Floating particle coordinates
  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }));
  }, []);

  return (
    <div 
      className="bg-black text-white min-h-screen pt-28 sm:pt-36 pb-24 px-4 sm:px-6 lg:px-8 font-sans selection:bg-gold-pure selection:text-black relative overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Immersive Cosmic Gold Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-pure/5 blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-gold-pure/[0.02] blur-[200px] rounded-full pointer-events-none z-0" />

      {/* Interactive Floating Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gold-pure/20"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.1, 0.7, 0.1]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Cinematic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: LUXURY ILLUSTRATION (Cinematic Pedestal Concept) */}
          <div className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[340px] aspect-square"
            >
              {/* Premium Interactive SVG Concept */}
              <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_35px_rgba(212,175,55,0.15)]">
                {/* Background Concentric Golden Rings */}
                <motion.circle 
                  cx="200" cy="180" r="140" 
                  fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" strokeDasharray="5 5" opacity="0.3" 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                />
                <motion.circle 
                  cx="200" cy="180" r="110" 
                  fill="none" stroke="url(#goldGradient)" strokeWidth="0.75" opacity="0.4"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />

                {/* Floating Geometric Orbs / Gems */}
                <motion.g
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  {/* Holographic Glowing Pyramids representing the missing masterpiece */}
                  <polygon points="200,80 235,140 200,165 165,140" fill="url(#gemGradient)" opacity="0.25" stroke="url(#goldGradient)" strokeWidth="1" />
                  <line x1="200" y1="80" x2="200" y2="165" stroke="url(#goldGradient)" strokeWidth="0.75" opacity="0.6" />
                  <line x1="165" y1="140" x2="235" y2="140" stroke="url(#goldGradient)" strokeWidth="0.75" opacity="0.6" />
                  
                  {/* Floating particles around gem */}
                  <circle cx="150" cy="110" r="2" fill="#D4AF37" opacity="0.8" />
                  <circle cx="255" cy="100" r="1.5" fill="#D4AF37" opacity="0.6" />
                  <circle cx="210" cy="70" r="2.5" fill="#ffffff" opacity="0.7" className="animate-ping" />
                </motion.g>

                {/* Highly-styled Luxury Exhibition Pedestal (Velvet/Metallic) */}
                <g transform="translate(0, 10)">
                  {/* Glass pedestal bell jar container dome */}
                  <path d="M 120,250 C 120,130 280,130 280,250" fill="none" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.2" />
                  
                  {/* Metallic top band */}
                  <ellipse cx="200" cy="250" rx="80" ry="15" fill="url(#metallicGradient)" stroke="url(#goldGradient)" strokeWidth="1.5" />
                  
                  {/* Pedestal pillars */}
                  <path d="M 125,251 L 140,320 L 260,320 L 275,251 Z" fill="url(#velvetGradient)" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.95" />
                  
                  {/* Pedestal Shadow and Ground reflection */}
                  <ellipse cx="200" cy="335" rx="100" ry="20" fill="url(#shadowGradient)" />
                  <ellipse cx="200" cy="320" rx="120" ry="12" fill="none" stroke="url(#goldGradient)" strokeWidth="1" opacity="0.2" />
                </g>

                {/* SVG Definitions */}
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8a7322" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#f9e7a9" />
                  </linearGradient>
                  <linearGradient id="gemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="velvetGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#080808" />
                    <stop offset="50%" stopColor="#151515" />
                    <stop offset="100%" stopColor="#080808" />
                  </linearGradient>
                  <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3a3010" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#121005" />
                  </linearGradient>
                  <radialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Glowing Ambient Halo behind pedestal */}
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold-pure/10 rounded-full blur-3xl -z-10 animate-pulse" />
            </motion.div>
          </div>

          {/* RIGHT: TEXT CONTENT, SEARCH BAR & NAVIGATION */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1 text-center lg:text-left rtl:lg:text-right">
            
            {/* Header Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-gold-pure/5 border border-gold-pure/20 backdrop-blur-md"
            >
              <span className="text-[14px] font-mono tracking-[0.3em] font-bold text-gold-pure leading-none">
                {localT.header}
              </span>
            </motion.div>

            {/* Title & Description */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-5xl font-display font-light text-white tracking-wider leading-tight uppercase"
              >
                {localT.title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                {localT.description}
              </motion.p>
            </div>

            {/* REAL-TIME PRODUCT SEARCH BAR */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative max-w-xl mx-auto lg:mx-0"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-gold-pure transition-colors duration-300" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={localT.searchPlaceholder}
                  className="w-full bg-zinc-950/80 backdrop-blur-md border border-white/5 group-hover:border-white/10 focus:border-gold-pure/50 rounded-sm pl-12 pr-4 py-4 text-xs sm:text-sm text-white focus:outline-none transition-all duration-300 shadow-xl"
                />
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              <AnimatePresence>
                {searchQuery.trim().length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-sm overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                  >
                    <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                        {localT.searchResultsTitle}
                      </span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                      {searchResults.length > 0 ? (
                        searchResults.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => handleProductClick(prod)}
                            className="w-full text-left rtl:text-right p-3.5 hover:bg-white/[0.03] transition-colors duration-300 flex items-center gap-3 group/item cursor-pointer"
                          >
                            <div className="relative w-10 h-10 rounded-xs overflow-hidden border border-white/5 bg-neutral-900 shrink-0">
                              <SafeImage src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <h4 className="text-xs font-semibold text-white group-hover/item:text-gold-pure transition-colors truncate">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{prod.description}</p>
                            </div>
                            <span className="text-xs text-gold-pure font-mono whitespace-nowrap shrink-0">
                              {formatCurrency(prod.price)} <span className="text-[9px] text-zinc-500">{localT.sar}</span>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-center text-zinc-500 text-xs">
                          {localT.noResults}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* BUTTON MATRIX */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start items-center"
            >
              {/* Back Button */}
              <button 
                onClick={handleBack}
                className="px-5 py-3.5 border border-white/5 hover:border-white/20 bg-zinc-950/40 hover:bg-white/5 text-zinc-300 hover:text-white transition-all duration-300 text-[10px] sm:text-xs font-mono uppercase tracking-widest rounded-sm cursor-pointer flex items-center gap-2 select-none group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                <span>{localT.back}</span>
              </button>

              {/* Go Home Button */}
              <button 
                onClick={() => setCurrentPage('home')}
                className="px-6 py-3.5 bg-gradient-to-r from-gold-dark to-gold-pure hover:from-white hover:to-white text-black font-display font-semibold uppercase tracking-widest text-[10px] sm:text-xs rounded-sm transition-all duration-300 cursor-pointer flex items-center gap-2 shadow-lg shadow-gold-pure/5 select-none"
              >
                <Home className="w-4 h-4" />
                <span>{localT.goHome}</span>
              </button>

              {/* Continue Shopping */}
              <button 
                onClick={() => setCurrentPage('store')}
                className="px-5 py-3.5 border border-gold-pure/15 hover:border-white bg-[#D4AF37]/5 hover:bg-white/5 text-gold-pure hover:text-white transition-all duration-300 text-[10px] sm:text-xs font-mono uppercase tracking-widest rounded-sm cursor-pointer flex items-center gap-2 select-none"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{localT.continueShopping}</span>
              </button>
            </motion.div>

          </div>

        </div>

        {/* POPULAR CATEGORIES GRID */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mt-20 pt-12 border-t border-white/5"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Compass className="w-4.5 h-4.5 text-gold-pure" />
              <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-widest font-semibold">
                {localT.popularCategories}
              </h3>
            </div>
            <div className="w-1/3 h-[1px] bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'coffee', icon: <Package className="w-4 h-4" /> },
              { id: 'bakery', icon: <Package className="w-4 h-4" /> },
              { id: 'market', icon: <Package className="w-4 h-4" /> },
              { id: 'fashion', icon: <Package className="w-4 h-4" /> },
              { id: 'thobes', icon: <Package className="w-4 h-4" /> }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="p-4 bg-zinc-950/60 hover:bg-gold-pure/5 border border-white/5 hover:border-gold-pure/30 rounded-xs transition-all duration-300 flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="p-2 rounded-full bg-white/5 text-zinc-400 group-hover:text-gold-pure transition-colors mb-2">
                  {cat.icon}
                </div>
                <span className="text-[10px] sm:text-xs font-display uppercase tracking-wider text-zinc-400 group-hover:text-white transition-colors">
                  {localT.categoryNames[cat.id]}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* EXQUISITE RECOMMENDATIONS OR RECENTLY VIEWED ROW */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* RECOMMENDED */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Sparkles className="w-4.5 h-4.5 text-gold-pure animate-pulse" />
              <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-widest font-semibold">
                {localT.recommended}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedProducts.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="p-3 bg-zinc-950/40 hover:bg-white/[0.02] border border-white/5 hover:border-gold-pure/20 rounded-xs transition-all duration-500 cursor-pointer flex gap-3 group"
                >
                  <div className="relative w-16 h-16 rounded-xs overflow-hidden border border-white/5 bg-neutral-900 shrink-0">
                    <SafeImage src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 duration-700 transition-transform" />
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-gold-pure transition-colors line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">{prod.description}</p>
                    </div>
                    <span className="text-[11px] text-gold-pure font-mono font-bold">
                      {formatCurrency(prod.price)} <span className="text-[8px] text-zinc-500">{localT.sar}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* RECENTLY VIEWED (If available, otherwise shows another popular row) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Compass className="w-4.5 h-4.5 text-gold-pure" />
              <h3 className="text-white text-xs sm:text-sm font-display uppercase tracking-widest font-semibold">
                {recentlyViewed.length > 0 ? localT.recentlyViewed : (isAr ? 'روائع حصرية أخرى' : 'Other Exclusive Masterpieces')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(recentlyViewed.length > 0 ? recentlyViewed : allProducts.filter(p => !p.popular).slice(0, 4)).map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="p-3 bg-zinc-950/40 hover:bg-white/[0.02] border border-white/5 hover:border-gold-pure/20 rounded-xs transition-all duration-500 cursor-pointer flex gap-3 group"
                >
                  <div className="relative w-16 h-16 rounded-xs overflow-hidden border border-white/5 bg-neutral-900 shrink-0">
                    <SafeImage src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 duration-700 transition-transform" />
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-gold-pure transition-colors line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">{prod.description}</p>
                    </div>
                    <span className="text-[11px] text-gold-pure font-mono font-bold">
                      {formatCurrency(prod.price)} <span className="text-[8px] text-zinc-500">{localT.sar}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
