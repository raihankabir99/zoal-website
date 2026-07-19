import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { SafeImage, useGlobalImages } from '../imageRegistry';
import { BusinessCategory } from '../types';

interface ScrolltellingProps {
  setCurrentPage?: (page: string) => void;
  setSelectedCategoryFilter?: (category: string) => void;
}

export default function Scrolltelling({ setCurrentPage, setSelectedCategoryFilter }: ScrolltellingProps) {
  const { t } = useTranslation();
  const globalImages = useGlobalImages();
  
  const dynamicCategoryImages = React.useMemo(() => {
    const getLatestForCategory = (cat: string, fallback: string) => {
      const filtered = globalImages.filter((img) => img.category === cat);
      // Prioritize store custom uploaded ones, then brand defaults
      const custom = filtered.find((img) => img.source === 'store upload');
      if (custom) return custom.url;
      const defaultImg = filtered.find((img) => img.source === 'brand default');
      return defaultImg ? defaultImg.url : fallback;
    };

    return {
      coffee: getLatestForCategory('coffee', '/src/assets/images/scroll-coffee-stage-3.jpg'),
      bakery: getLatestForCategory('bakery', '/src/assets/images/scroll-bakery.jpg'),
      market: getLatestForCategory('market', '/images/market_grocery_official_1781633042972.jpg'),
      fashion: getLatestForCategory('fashion', '/src/assets/images/scroll-fashion.jpg'),
      thobes: getLatestForCategory('thobes', '/src/assets/images/thobes.jpg'),
    };
  }, [globalImages]);

  const handleCategoryClick = (id: string) => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter(id);
    }
    if (setCurrentPage) {
      setCurrentPage('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const categories = [
    {
      id: 'coffee',
      tag: t('scroll.c_t_sub', { defaultValue: 'COFFEE HOUSE' }),
      title: t('scroll.c_t', { defaultValue: 'Crafted for Every Moment' }),
      desc: t('scroll.c_d', { defaultValue: 'Premium specialty coffee made from carefully selected beans, delivering rich flavor, refined quality, and the true spirit of Arabian hospitality in every cup.' }),
      img: dynamicCategoryImages.coffee,
      cta: t('scroll.cta_coffee', { defaultValue: 'EXPLORE COFFEE HOUSE' })
    },
    {
      id: 'bakery',
      tag: t('scroll.b_t_sub', { defaultValue: 'BAKERY & SNACKS' }),
      title: t('scroll.b_t', { defaultValue: 'Crafted with Heritage Baked to Perfection' }),
      desc: t('scroll.b_d', { defaultValue: 'From authentic Hoboz bread to handcrafted pastries, premium biscuits, and traditional sweets—every creation reflects timeless recipes and exceptional quality.' }),
      img: dynamicCategoryImages.bakery,
      cta: t('scroll.cta_bakery', { defaultValue: 'EXPLORE BAKERY' })
    },
    {
      id: 'market',
      tag: t('scroll.m_t_sub', { defaultValue: 'MARKET & GROCERY' }),
      title: t('scroll.m_t', { defaultValue: 'Fresh Essentials Every Day' }),
      desc: t('scroll.m_d', { defaultValue: 'Discover premium groceries, fresh ingredients, daily essentials, beverages, snacks, and household products carefully selected for quality and convenience.' }),
      img: dynamicCategoryImages.market,
      cta: t('scroll.cta_market', { defaultValue: 'EXPLORE MARKET' })
    },
    {
      id: 'fashion',
      tag: t('scroll.f_t_sub', { defaultValue: 'PREMIUM COLLECTIONS' }),
      title: t('scroll.f_t', { defaultValue: 'Fashion & Beauty' }),
      desc: t('scroll.f_d', { defaultValue: "Discover Sudanese fashion, elegant women's wear, abayas, modest wear, traditional men's attire, cosmetics, perfumes, and carefully selected beauty essentials for every occasion." }),
      img: dynamicCategoryImages.fashion,
      cta: t('scroll.cta_fashion', { defaultValue: 'EXPLORE COLLECTION' })
    },
    {
      id: 'thobes',
      tag: t('scroll.t_t_sub', { defaultValue: "THOBES & MEN'S WEAR" }),
      title: t('scroll.t_t', { defaultValue: 'Timeless Sudanese Style' }),
      desc: t('scroll.t_d', { defaultValue: "Discover authentic Sudanese thobes and traditional men's attire, carefully selected for comfort, quality, and timeless elegance." }),
      img: dynamicCategoryImages.thobes,
      cta: t('scroll.cta_thobes', { defaultValue: 'SHOP THOBES' })
    }
  ];

  return (
    <div id="scrollstory-anchor" className="relative bg-black py-24 border-t border-b border-white/5 overflow-hidden">
      
      {/* Decorative large branding backdrops */}
      <div className="absolute right-[-10%] top-[10%] text-[15vw] font-display font-extrabold text-white/[0.01] pointer-events-none select-none tracking-widest">
        HERITAGE
      </div>
      <div className="absolute left-[-5%] bottom-[5%] text-[15vw] font-display font-extrabold text-gold-pure/[0.01] pointer-events-none select-none tracking-widest">
        ZOAL
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <motion.div 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 sm:mb-24"
        >
          <p className="text-gold-pure text-[10px] tracking-[0.40em] uppercase font-display mb-3">
            {t('scroll.subtitle', { defaultValue: 'EDITORIAL LOOKBOOK' })}
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase font-semibold">
            {t('scroll.title', { defaultValue: 'Crafting the Senses' })}
          </h2>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-3">
            {t('scroll.desc', { defaultValue: 'Explore our rigorous preparation standards and premium collections' })}
          </p>
        </motion.div>

        {/* Categories Single Scroll Stack with Generous Editorial Spacing */}
        <div className="space-y-[120px] md:space-y-[180px] max-w-6xl mx-auto">
          {categories.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={item.id}
                id={`editorial-${item.id}`}
                initial={{ opacity: 0, y: 60, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 lg:gap-24 items-center"
              >
                {/* Image Showcase Box */}
                <div className={`md:col-span-7 ${!isEven ? 'md:order-last' : ''}`}>
                  <div className={`relative w-full rounded-sm overflow-hidden border border-white/5 bg-[#000] group ${
                    item.id === 'market'
                      ? 'aspect-[16/9]'
                      : 'aspect-[16/10] sm:aspect-[4/3]'
                  }`}>
                    <SafeImage
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      category={item.id as BusinessCategory}
                      forceCover={true}
                    />
                    {/* Shadow overlay vignette */}
                    <div className={`absolute inset-0 pointer-events-none ${
                      item.id === 'market'
                        ? 'bg-gradient-to-t from-black/20 via-transparent to-transparent'
                        : 'bg-gradient-to-t from-black/50 via-transparent to-transparent'
                    }`} />
                  </div>
                </div>

                {/* Text Editorial Box */}
                <div className="md:col-span-5 flex flex-col justify-center space-y-4 text-center md:text-left">
                  <span className="text-gold-pure text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase block">
                    {item.tag}
                  </span>
                  
                  <h3 className="text-white text-xl sm:text-2xl lg:text-3xl font-display uppercase tracking-widest font-semibold leading-tight">
                    {item.title}
                  </h3>
                  
                  <p className="text-zinc-400 text-xs sm:text-sm font-sans font-light leading-relaxed tracking-wider max-w-md mx-auto md:mx-0">
                    {item.desc}
                  </p>

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02, borderColor: '#D4AF37' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategoryClick(item.id)}
                      className="cursor-pointer inline-flex items-center space-x-2 border border-white/10 hover:text-gold-pure text-white text-[10px] uppercase font-mono tracking-widest px-6 py-3.5 transition-all duration-300 rounded-xs group bg-[#040404] hover:bg-black"
                    >
                      <span>{item.cta}</span>
                      <span className="transform transition-transform duration-300 group-hover:translate-x-1 font-sans">→</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
