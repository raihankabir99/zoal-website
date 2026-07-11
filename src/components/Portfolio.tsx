import React, { useState, useMemo } from 'react';
import { Camera, Layers, X, ChevronRight, ChevronLeft, ArrowUpRight } from 'lucide-react';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalImages } from '../imageRegistry';

interface PortfolioItem {
  id: string | number;
  theme: 'coffee' | 'bakery' | 'market' | 'fashion' | 'thobes';
  title: string;
  location: string;
  img: string;
  productId?: string;
}

export default function Portfolio() {
  const { t, i18n } = useTranslation();
  const [activeTheme, setActiveTheme] = useState<'all' | 'coffee' | 'bakery' | 'market' | 'fashion' | 'thobes'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Isolate thobe images directly at the hook level to prevent visual cross-contamination
  const filteredTheme = activeTheme === 'thobes' ? 'thobes' : undefined;
  const globalImages = useGlobalImages(filteredTheme);

  const galleryItems = useMemo<PortfolioItem[]>(() => {
    return globalImages.map((img) => {
      // Check if it's associated with a static product or custom upload
      const isProductImage = img.id.startsWith('product-') || img.id.startsWith('upload-');
      const productId = isProductImage 
        ? (img.id.startsWith('product-') ? img.id.split('-').slice(1, -1).join('-') || img.id.split('-')[1] : `custom-prod-${img.id}`) 
        : undefined;

      const themeName = img.category;

      return {
        id: img.id,
        theme: themeName,
        title: img.title || 'ZOAL Heritage Exhibit',
        location: isProductImage 
          ? `Store Premium ${themeName.toUpperCase()} Collection` 
          : (img.source === 'store upload' ? 'Store Custom Asset' : 'Flagship Brand Exhibit'),
        img: img.url,
        productId: productId
      };
    });
  }, [globalImages]);

  const filteredItems = useMemo(() => {
    const rawFiltered = activeTheme === 'all' ? galleryItems : galleryItems.filter(i => i.theme === activeTheme);
    
    // Strict Filtering Rule & Debug log requirement for Portfolio/Lookbook thobes
    if (activeTheme === 'thobes') {
      const strictlyThobes = rawFiltered.filter(item => {
        const lower = item.img ? item.img.toLowerCase() : '';
        return (
          lower.includes('thobe') || 
          lower.includes('p1') || 
          lower.includes('p2') || 
          lower.includes('photo-1528459801416') || 
          lower.includes('photo-1620799140408') || 
          lower.includes('photo-1593030761757')
        );
      });
      console.log(`[Portfolio Lookbook Debug] Confirmed loading isolated Thobes category. Found ${strictlyThobes.length} thobe portfolio items:`, strictlyThobes.map(item => ({ id: item.id, title: item.title, url: item.img })));
      return strictlyThobes.filter(item => item && item.img && typeof item.img === 'string' && item.img.trim() !== '');
    }

    // Extra safety: Filter out any entries that might have completely blank/missing images, to prevent empty cards from rendering.
    return rawFiltered.filter(item => item && item.img && typeof item.img === 'string' && item.img.trim() !== '');
  }, [activeTheme, galleryItems]);

  const handleNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            {t('portfolio.subtitle', { defaultValue: 'Ophthalmic Galleries' })}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display text-white text-wrap">
            {t('portfolio.title', { defaultValue: 'Sensory Curation Lookbook' })}
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-4 max-w-xl mx-auto">
            {t('portfolio.desc', { defaultValue: 'A visual journey through our coffee house, bakery, grocery market, clothing store, and community spaces.' })}
          </p>
        </div>

        {/* Theme select controls */}
        <div className="flex flex-nowrap sm:flex-wrap items-center sm:justify-center gap-2 mb-6 sm:mb-12 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-hide sticky top-[60px] sm:static sm:top-auto z-40 bg-[#030303] sm:bg-transparent pt-2 sm:pt-0">
          {[
            { id: 'all', label: t('portfolio.filter_all', { defaultValue: 'All Lookbook' }) },
            { id: 'coffee', label: t('portfolio.filter_coffee', { defaultValue: 'COFFEE HOUSE Gallery' }) },
            { id: 'bakery', label: t('portfolio.filter_bakery', { defaultValue: 'BAKERY & SNACKS Gallery' }) },
            { id: 'market', label: t('portfolio.filter_market', { defaultValue: 'MARKET & GROCERY Gallery' }) },
            { id: 'fashion', label: t('portfolio.filter_fashion', { defaultValue: 'PREMIUM COLLECTIONS Gallery' }) },
            { id: 'thobes', label: t('portfolio.filter_thobes', { defaultValue: "THOBES & MEN'S WEAR Gallery" }) }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => {
                setActiveTheme(theme.id as any);
                setLightboxIndex(null);
              }}
              className={`py-2 px-4 shrink-0 rounded-sm text-[9.5px] uppercase font-display tracking-widest transition-all cursor-pointer ${
                activeTheme === theme.id
                  ? 'border-b border-gold-pure text-gold-pure font-bold bg-white/5'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>

        {/* Stable Grid Layout Portfolio Grid */}
        <div key={activeTheme} className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-[480px]:gap-4 sm:gap-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (idx % 3) * 0.05 }}
              onClick={() => setLightboxIndex(idx)}
              className={`relative rounded-xs sm:rounded-sm overflow-hidden border border-white/5 bg-[#000000] group cursor-pointer transition-all duration-500 hover:border-gold-pure/30 w-full ${
                item.theme === 'market'
                  ? 'col-span-2 aspect-[16/9] min-h-[150px]'
                  : 'aspect-square sm:aspect-[4/5]'
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-zinc-950/10">
                <ScrollZoomImage
                  src={item.img}
                  alt={item.title}
                  className={item.theme === 'market' ? 'w-full h-full object-contain' : 'w-full h-full object-cover'}
                  containerClassName="w-full h-full overflow-hidden relative flex items-center justify-center bg-[#000000]"
                  category={item.theme}
                />
              </div>

              {/* Text Hover Glass Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2 sm:p-6 flex flex-col justify-end transition-all duration-300 md:opacity-0 md:group-hover:opacity-100">
                <span className="hidden sm:block text-[8px] uppercase tracking-widest text-[#D4AF37] font-mono">
                  {i18n.language === 'ar' ? t(`portfolio_themes.${item.theme}`, { defaultValue: item.theme }) : item.theme} {t('portfolio.series', { defaultValue: 'series' })}
                </span>
                <h3 className="text-white text-[9px] sm:text-sm leading-snug sm:leading-normal font-display uppercase tracking-widest font-semibold mt-1 flex items-center justify-between rtl:flex-row-reverse">
                  <span className="rtl:text-right block max-w-full sm:max-w-[85%] line-clamp-2 sm:truncate">
                    {item.productId ? (i18n.language === 'ar' ? t(`products.${item.productId}.name`, { defaultValue: item.title }) : item.title) : (i18n.language === 'ar' ? t(`portfolio_items.${item.id}.title`, { defaultValue: item.title }) : item.title)}
                  </span>
                  <ArrowUpRight className="hidden sm:block w-4 h-4 text-gold-pure shrink-0 ml-2 rtl:mr-2 rtl:ml-0 rtl:-scale-x-100" />
                </h3>
                <p className="hidden sm:block text-zinc-400 text-[10px] mt-1 font-sans rtl:text-right truncate max-w-full">
                  {item.productId ? (i18n.language === 'ar' ? t(`products.${item.productId}.description`, { defaultValue: item.location }) : item.location) : (i18n.language === 'ar' ? t(`portfolio_items.${item.id}.location`, { defaultValue: item.location }) : item.location)}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>

      {/* Lightbox Slider popup */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (() => {
        const currentItem = filteredItems[lightboxIndex];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
            
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1.5 cursor-pointer z-50"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left Arrow */}
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 text-zinc-500 hover:text-gold-pure p-2 cursor-pointer z-50"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div className="max-w-4xl max-h-[80vh] flex flex-col justify-center items-center relative p-6">
              <div className="w-full aspect-[4/3] max-h-[60vh] relative bg-zinc-950/40 rounded-xs border border-white/10 flex items-center justify-center overflow-hidden">
                <SafeImage
                  src={currentItem.img || undefined}
                  alt={currentItem.theme === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : currentItem.title}
                  className="max-w-full max-h-full object-contain"
                  containerClassName="w-full h-full relative flex items-center justify-center"
                  category={currentItem.theme}
                />
              </div>
              <div className="text-center mt-6 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">
                  {i18n.language === 'ar' ? t(`portfolio_themes.${currentItem.theme}`, { defaultValue: currentItem.theme }) : currentItem.theme} {t('portfolio.segment', { defaultValue: 'segment' })}
                </span>
                <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest font-medium">
                  {currentItem.productId ? (i18n.language === 'ar' ? t(`products.${currentItem.productId}.name`, { defaultValue: currentItem.title }) : currentItem.title) : (i18n.language === 'ar' ? t(`portfolio_items.${currentItem.id}.title`, { defaultValue: currentItem.title }) : currentItem.title)}
                </h3>
                <p className="text-zinc-500 text-xs font-sans">
                  {currentItem.productId ? (i18n.language === 'ar' ? t(`products.${currentItem.productId}.description`, { defaultValue: currentItem.location }) : currentItem.location) : (i18n.language === 'ar' ? t(`portfolio_items.${currentItem.id}.location`, { defaultValue: currentItem.location }) : currentItem.location)}
                </p>
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 text-zinc-500 hover:text-gold-pure p-2 cursor-pointer z-50"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

          </div>
        );
      })()}

    </div>
  );
}
