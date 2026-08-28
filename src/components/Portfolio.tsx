import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalProducts, resolveProductImage, normalizeCategory } from '../imageRegistry';
import { formatCurrency } from '../utils';
import { Product } from '../types';

interface PortfolioProps {
  setCurrentPage?: (page: string) => void;
  setSelectedCategoryFilter?: (cat: string) => void;
  onProductSelect?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, option?: string) => void;
  onToggleWishlist?: (productId: string) => void;
  wishlist?: string[];
}

const SECTIONS_CONFIG = [
  {
    id: 'coffee',
    category: 'coffee',
    tagKey: 'coffee_tag',
    titleKey: 'coffee_title',
    descKey: 'coffee_desc',
    ctaLabel: 'Explore Coffee',
    ctaLabelAr: 'استكشف دار القهوة',
    defaultImg: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'bakery',
    category: 'bakery',
    tagKey: 'bakery_tag',
    titleKey: 'bakery_title',
    descKey: 'bakery_desc',
    ctaLabel: 'Explore Bakery',
    ctaLabelAr: 'استكشف المخبز والمأكولات الخفيفة',
    defaultImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 'premium',
    category: 'fashion',
    tagKey: 'fashion_tag',
    titleKey: 'fashion_title',
    descKey: 'fashion_desc',
    ctaLabel: 'Explore Premium',
    ctaLabelAr: 'استكشف المجموعات الفاخرة',
    defaultImg: '/images/collections/premium.jpeg'
  },
  {
    id: 'market',
    category: 'market',
    tagKey: 'market_tag',
    titleKey: 'market_title',
    descKey: 'market_desc',
    ctaLabel: 'Explore Market',
    ctaLabelAr: 'استكشف سوق المواد الغذائية',
    defaultImg: '/images/collections/market.jpeg'
  },
  {
    id: 'thobes',
    category: 'thobes',
    tagKey: 'thobes_tag',
    titleKey: 'thobes_title',
    descKey: 'thobes_desc',
    ctaLabel: 'Explore Collection',
    ctaLabelAr: 'استكشف التشكيلة',
    defaultImg: '/images/collections/thobes.jpeg'
  }
];

const LookbookProductCard = React.memo(({ product, onProductSelect, onAddToCart, wishlist, onToggleWishlist, formatCurrency, t, i18n }: {
  product: Product;
  onProductSelect?: (p: Product) => void;
  onAddToCart?: (p: Product, qty: number) => void;
  wishlist?: string[];
  onToggleWishlist?: (id: string) => void;
  formatCurrency: (p: number) => string;
  t: any;
  i18n: any;
}) => {
  const isWishlisted = wishlist?.includes(product.id);
  const title = i18n.language === 'ar' ? (product.title_ar || product.nameAr || t(`products.${product.id}.name`, { defaultValue: product.name })) : (product.nameEn || product.name);
  
  return (
    <div className="group flex flex-col bg-[#030303] p-1 sm:p-1.5 rounded-sm transition-all duration-300">
      <div 
        className={`relative overflow-hidden rounded-xs cursor-pointer bg-black/40 ${
          product.category === 'market' ? 'aspect-[16/9]' : 'aspect-square'
        }`}
        onClick={() => onProductSelect?.(product)}
      >
        <ScrollZoomImage
          src={resolveProductImage(product)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          containerClassName="w-full h-full overflow-hidden absolute inset-0"
          category={product.category}
          priority={false}
        />
        {/* Quick Wishlist Icon */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-gold-pure transition-all z-10 cursor-pointer"
            title={t('nav.wishlist')}
          >
            <Heart className={`w-3 h-3 ${isWishlisted ? 'fill-gold-pure text-gold-pure' : ''}`} />
          </button>
        )}
      </div>

      <div className="pt-1 flex flex-col">
        <div>
          <h4 
            className="text-white text-[10px] sm:text-xs font-display uppercase tracking-wider font-semibold cursor-pointer group-hover:text-gold-pure transition-colors line-clamp-1"
            onClick={() => onProductSelect?.(product)}
          >
            {title}
          </h4>
          <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-zinc-500 font-mono mt-0.5 block">
            {t(`store.category.${product.category}`, { defaultValue: product.category })}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
          <span className="text-gold-pure font-sans font-medium text-[9px] sm:text-[11px] tracking-wide leading-none tabular-nums-fix">
            {formatCurrency(product.price)} <span className="text-[6.5px] sm:text-[9.5px]">{t('app.sar')}</span>
          </span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product, 1)}
              className="p-1 sm:p-1.5 rounded-xs border border-white/5 hover:border-gold-pure/30 hover:bg-gold-pure/5 hover:text-gold-pure transition-all text-zinc-400 cursor-pointer flex items-center justify-center"
              title={t('product_detail.quick_add')}
            >
              <ShoppingBag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

LookbookProductCard.displayName = 'LookbookProductCard';

export default function Portfolio({
  setCurrentPage,
  setSelectedCategoryFilter,
  onProductSelect,
  onAddToCart,
  onToggleWishlist,
  wishlist
}: PortfolioProps) {
  const { t, i18n } = useTranslation();
  const allProducts = useGlobalProducts();
  const [cmsBlocks, setCmsBlocks] = useState<any[]>([]);
  const firstSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/homepage-editorial')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Offline or missing endpoint');
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCmsBlocks(data.filter(b => b && b.status === 'published'));
        }
      })
      .catch(err => {
        console.warn('[Collection] Offline CMS fallback active:', err);
      });
  }, []);

  const handleExploreCollections = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleExploreCategory = (category: string) => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter(category);
    }
    if (setCurrentPage) {
      setCurrentPage('store');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExploreStore = () => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter('all');
    }
    if (setCurrentPage) {
      setCurrentPage('store');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCmsContent = (category: string) => {
    const target = normalizeCategory(category);
    const block = cmsBlocks.find(b => normalizeCategory(b.category) === target);
    
    const tKey = target === 'fashion' ? 'fashion' : target;
    
    const defaultTitle = t(`home.scroll.${tKey}_title`, { defaultValue: '' });
    const defaultDesc = t(`home.scroll.${tKey}_desc`, { defaultValue: '' });
    const defaultTag = t(`home.scroll.${tKey}_tag`, { defaultValue: category.toUpperCase() });
    
    if (block) {
      const title = i18n.language === 'ar' ? (block.title_ar || block.title) : block.title;
      const description = i18n.language === 'ar' ? (block.description_ar || block.description) : block.description;
      const tag = i18n.language === 'ar' ? (block.subtitle_ar || block.subtitle || defaultTag) : (block.subtitle || defaultTag);
      const image = block.desktop_image || block.mobile_image;
      return { title, description, tag, image };
    }
    
    const defaultImages: Record<string, string> = {
      coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1200',
      bakery: '/images/collections/bakery.jpeg',
      market: '/images/collections/market.jpeg',
      fashion: '/images/collections/premium.jpeg',
      thobes: '/images/collections/thobes.jpeg',
    };

    return {
      title: defaultTitle,
      description: defaultDesc,
      tag: defaultTag,
      image: defaultImages[target] || '/images/collections/collection.png'
    };
  };

  const getCategoryProducts = (categoryName: string) => {
    const normTarget = normalizeCategory(categoryName);
    const filtered = allProducts.filter(p => p && p.category && normalizeCategory(p.category) === normTarget);
    
    const sorted = [...filtered].sort((a, b) => {
      const aFeatured = (a.isFeatured || a.isPopular || a.popular || a.is_featured) ? 1 : 0;
      const bFeatured = (b.isFeatured || b.isPopular || b.popular || b.is_featured) ? 1 : 0;
      return bFeatured - aFeatured;
    });
    return sorted.slice(0, 3); // Return up to 3 featured highlights for compact spacing
  };

  return (
    <div className="bg-black text-white min-h-screen">
      
      {/* 1. HERO HEADER */}
      <section className="relative min-h-[70vh] flex flex-col justify-center items-center text-center bg-zinc-950 px-4 py-20 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black z-10" />
        <div className="absolute inset-0 z-0 opacity-40">
          <ScrollZoomImage
            src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=1600"
            alt="The Zoal Collections Background"
            className="w-full h-full object-cover scale-105 filter blur-[1px]"
            priority={true}
          />
        </div>

        <div className="relative z-20 max-w-4xl mx-auto space-y-6">
          <motion.span 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs tracking-[0.4em] text-gold-pure uppercase font-mono block"
          >
            {i18n.language === 'ar' ? 'مجموعات زوال الفاخرة' : 'THE ZOAL COLLECTIONS'}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl md:text-6xl font-bold tracking-[0.15em] uppercase font-display text-white leading-tight"
          >
            {i18n.language === 'ar' ? 'مجموعات مُنسَّقة بعناية' : 'Curated experiences by ZOAL'}
          </motion.h1>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="pt-8"
          >
            <button
              onClick={handleExploreCollections}
              className="inline-flex flex-col items-center gap-3 text-[#D4AF37] hover:text-white transition-colors duration-300 text-xs tracking-[0.25em] uppercase font-bold cursor-pointer"
            >
              <span>{i18n.language === 'ar' ? 'اكتشف المجموعات' : 'Explore Collections'}</span>
              <ChevronDown className="w-4 h-4 animate-bounce text-[#D4AF37]" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. ALTERNATING EDITORIAL SECTIONS */}
      <section className="bg-black">
        {SECTIONS_CONFIG.map((sec, idx) => {
          const isEven = idx % 2 === 0;
          const cmsContent = getCmsContent(sec.category);
          const products = getCategoryProducts(sec.category);
          
          return (
            <div
              key={sec.id}
              ref={idx === 0 ? firstSectionRef : undefined}
              className="py-5 sm:py-8 border-b border-white/5"
            >
              <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-10 items-center">
                  
                  {/* Image Container with existing zoom on scroll/hover movement effects */}
                  <div className={`col-span-1 lg:col-span-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                    <div className="relative aspect-[16/9] overflow-hidden sm:rounded-xs border-y sm:border border-white/5 group bg-[#020202]">
                      <ScrollZoomImage
                        src={cmsContent.image}
                        alt={cmsContent.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                        containerClassName="w-full h-full overflow-hidden absolute inset-0"
                        category={sec.category as any}
                        priority={idx === 0}
                      />
                      <div className="absolute inset-0 bg-black/10 mix-blend-overlay group-hover:bg-transparent duration-500" />
                    </div>
                  </div>
                  
                  {/* Content & Featured Highlights */}
                  <div className={`col-span-1 lg:col-span-7 flex flex-col justify-center px-2 sm:px-0 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                    <span className="text-[8.5px] md:text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase font-mono mb-1 sm:mb-1.5 block">
                      {cmsContent.tag}
                    </span>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide uppercase font-display text-white mb-1.5 sm:mb-2 leading-tight">
                      {cmsContent.title}
                    </h2>
                    <p className="text-zinc-400 text-xs md:text-sm font-sans leading-relaxed mb-3 sm:mb-4 max-w-2xl font-light">
                      {cmsContent.description}
                    </p>
                    
                    {/* Featured highlights dynamically loaded from products registry */}
                    {products.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <span className="text-[8px] tracking-[0.25em] text-zinc-500 uppercase font-mono block mb-2">
                          {i18n.language === 'ar' ? 'المنتجات المميزة' : 'FEATURED HIGHLIGHTS'}
                        </span>
                        <div className="relative">
                          <div className="flex sm:grid sm:grid-cols-3 gap-3 md:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none pb-2 sm:pb-0 scroll-smooth overscroll-x-contain -mx-2 px-2 sm:mx-0 sm:px-0">
                            {products.map((prod, idx) => (
                              <div key={prod.id} className={`min-w-[55%] w-[55%] sm:min-w-0 sm:w-auto flex-shrink-0 snap-center flex flex-col ${idx > 0 ? 'opacity-95 scale-[0.98] sm:opacity-100 sm:scale-100 transition-transform' : ''}`}>
                                <LookbookProductCard
                                  product={prod}
                                  onProductSelect={onProductSelect}
                                  onAddToCart={onAddToCart}
                                  wishlist={wishlist}
                                  onToggleWishlist={onToggleWishlist}
                                  formatCurrency={formatCurrency}
                                  t={t}
                                  i18n={i18n}
                                />
                              </div>
                            ))}
                          </div>
                          {/* Subtle right swipe indicator on mobile */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none sm:hidden flex items-center pr-1 bg-gradient-to-l from-black/80 via-black/30 to-transparent pl-4 py-6 text-[#D4AF37]/80 animate-pulse">
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action navigation CTA */}
                    <div>
                      <button
                        onClick={() => handleExploreCategory(sec.category)}
                        className="inline-flex items-center gap-2 group text-[#D4AF37] hover:text-white transition-colors duration-300 text-xs tracking-[0.2em] uppercase font-semibold cursor-pointer rtl:flex-row-reverse"
                      >
                        <span>
                          {i18n.language === 'ar' 
                            ? sec.ctaLabelAr 
                            : ((sec.category === 'thobes' || sec.id === 'thobes' || (sec.ctaLabel && sec.ctaLabel.toUpperCase().includes('THOBES')))
                                ? 'EXPLORE COLLECTION'
                                : sec.ctaLabel)}
                        </span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* 3. FINAL CALL TO ACTION */}
      <section className="relative py-20 sm:py-32 bg-zinc-950 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 z-10" />
        <div className="absolute inset-0 z-0 opacity-15">
          <ScrollZoomImage
            src="/images/collections/collection.png"
            alt="ZOAL Store Collection Background"
            className="w-full h-full object-cover filter blur-[2px]"
          />
        </div>

        <div className="relative z-20 max-w-2xl mx-auto space-y-6">
          <span className="text-[8.5px] md:text-[10px] tracking-[0.3em] text-[#D4AF37] uppercase font-mono block">
            {i18n.language === 'ar' ? 'استكشف عالم زوال بالكامل' : 'EXPLORE THE COMPLETE UNIVERSE'}
          </span>
          <h2 className="text-2xl md:text-5xl font-bold tracking-wide uppercase font-display text-white">
            {i18n.language === 'ar' ? 'تسوق من متجر زوال بالكامل' : 'SHOP THE FULL ZOAL STORE'}
          </h2>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto my-6" />
          
          <button
            onClick={handleExploreStore}
            className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 border border-gold-pure/40 text-gold-pure hover:text-black hover:bg-[#D4AF37] hover:border-gold-pure duration-300 text-xs font-bold tracking-[0.25em] uppercase rounded-xs cursor-pointer"
          >
            {i18n.language === 'ar' ? 'تصفح المتجر بالكامل' : 'Explore Store'}
          </button>
        </div>
      </section>

    </div>
  );
}
