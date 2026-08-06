import React, { useState, useMemo } from 'react';
import { Camera, Layers, X, ChevronRight, ChevronLeft, ArrowUpRight } from 'lucide-react';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalProducts, getFallbackImage, resolveProductImage, normalizeCategory } from '../imageRegistry';

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

  // Pipeline B: Fetch live Products from the unified CMS / Supabase Database source
  const allProducts = useGlobalProducts();

  const galleryItems = useMemo<PortfolioItem[]>(() => {
    return allProducts.map((p) => {
      const mainImg = resolveProductImage(p);
      return {
        id: p.id,
        theme: normalizeCategory(p.category),
        title: p.name,
        location: p.subDescription || p.description || `Store Premium ${p.category.toUpperCase()} Collection`,
        img: mainImg,
        productId: p.id
      };
    });
  }, [allProducts]);

  const filteredItems = useMemo(() => {
    const rawFiltered = activeTheme === 'all' ? galleryItems : galleryItems.filter(i => normalizeCategory(i.theme) === normalizeCategory(activeTheme));
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
    <div className="bg-black text-white min-h-screen pt-[64px] md:pt-[88px] pb-10 md:pb-20">
      <div className="max-w-7xl mx-auto px-2 md:px-8">
        
        {/* Title */}
        <div className="text-center mb-5 md:mb-12">
          <span className="text-[8px] md:text-[10px] tracking-[0.25em] md:tracking-[0.4em] text-gold-pure uppercase font-display block mb-1.5 md:mb-3">
            {t('collection.hero.subtitle', { defaultValue: 'OUR COLLECTIONS' })}
          </span>
          <h1 className="text-2xl md:text-5xl font-bold tracking-wide md:tracking-[0.25em] leading-tight uppercase font-display text-white text-wrap">
            {t('collection.hero.title', { defaultValue: 'THE ZOAL LOOKBOOK' })}
          </h1>
          <div className="w-6 md:w-12 h-[1px] bg-gold-pure mx-auto mt-2 md:mt-4" />
          <p className="text-zinc-500 text-[10px] md:text-xs tracking-wider uppercase mt-2 md:mt-4 max-w-xl mx-auto px-2">
            <span className="block md:hidden">
              {i18n.language === 'ar' ? 'اكتشف تشكيلة زوال.' : 'Explore the ZOAL Collection.'}
            </span>
            <span className="hidden md:block">
              {t('collection.hero.desc', { defaultValue: 'A visual journey through our coffee house, bakery, grocery market, clothing store, and community spaces.' })}
            </span>
          </p>
        </div>

        {/* Theme select controls */}
        <div className="sticky top-[50px] md:sticky md:top-[60px] z-40 bg-[#030303] md:bg-transparent pt-1 md:pt-0 mb-4 md:mb-12">
          <div className="flex flex-nowrap md:flex-wrap items-center md:justify-center gap-1.5 md:gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 category-scroll-indicator snap-x snap-mandatory touch-pan-x">
            {[
              { id: 'all', label: t('collection.filter.all', { defaultValue: 'All Collections' }) },
              { id: 'coffee', label: t('collection.filter.coffee', { defaultValue: 'COFFEE HOUSE Gallery' }) },
              { id: 'bakery', label: t('collection.filter.bakery', { defaultValue: 'BAKERY & SNACKS Gallery' }) },
              { id: 'market', label: t('collection.filter.market', { defaultValue: 'MARKET & GROCERY Gallery' }) },
              { id: 'fashion', label: t('collection.filter.fashion', { defaultValue: 'PREMIUM COLLECTIONS Gallery' }) },
              { id: 'thobes', label: t('collection.filter.thobes', { defaultValue: "THOBES & MEN'S WEAR Gallery" }) }
            ].map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setActiveTheme(theme.id as any);
                  setLightboxIndex(null);
                }}
                className={`py-1 px-2.5 h-8 md:h-auto md:py-2 md:px-4 shrink-0 snap-start rounded-sm text-[8.5px] md:text-[9.5px] uppercase font-display tracking-wide md:tracking-widest transition-all cursor-pointer ${
                  activeTheme === theme.id
                    ? 'border-b border-gold-pure text-gold-pure font-bold bg-white/5'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stable Grid Layout Product Grid */}
        <div key={activeTheme} className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={idx < 6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              whileInView={idx < 6 ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={idx < 6 ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: (idx % 3) * 0.05 }}
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
                  priority={idx < 6}
                />
              </div>

              {/* Text Hover Glass Overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-1.5 md:p-6 flex flex-col justify-end transition-all duration-300 md:opacity-0 md:group-hover:opacity-100">
                <span className="hidden md:block text-[8px] uppercase tracking-widest text-[#D4AF37] font-mono">
                  {i18n.language === 'ar' ? t(`portfolio_themes.${item.theme}`, { defaultValue: item.theme }) : item.theme} {t('portfolio.series', { defaultValue: 'series' })}
                </span>
                <h3 className="text-white text-[8px] md:text-sm leading-tight md:leading-normal font-display uppercase tracking-wide md:tracking-widest font-semibold mt-0.5 md:mt-1 flex items-center justify-between rtl:flex-row-reverse">
                  <span className="rtl:text-right block max-w-full sm:max-w-[85%] line-clamp-2 sm:truncate">
                    {item.productId ? (i18n.language === 'ar' ? t(`products.${item.productId}.name`, { defaultValue: item.title }) : item.title) : (i18n.language === 'ar' ? t(`portfolio_items.${item.id}.title`, { defaultValue: item.title }) : item.title)}
                  </span>
                  <ArrowUpRight className="hidden md:block w-4 h-4 text-gold-pure shrink-0 ml-2 rtl:mr-2 rtl:ml-0 rtl:-scale-x-100" />
                </h3>
                <p className="hidden md:block text-zinc-400 text-[10px] mt-1 font-sans rtl:text-right truncate max-w-full">
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
