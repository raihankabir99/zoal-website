import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, MapPin, Coffee, Shirt, Home, Cookie, Cake, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalImages } from '../imageRegistry';
import { BusinessCategory } from '../types';

const ThobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 2h10l3 7h-3v13H7V9H4z" />
    <path d="M12 2v6" />
  </svg>
);

interface HeroProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategoryFilter?: (cat: string) => void;
}

export default function Hero({ setCurrentPage, setSelectedCategoryFilter }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t } = useTranslation();

  const slides = [
    {
      line1: t('hero.slide1.line1'),
      line2: t('hero.slide1.line2'),
      line3: t('hero.slide1.line3'),
      tag: t('hero.slide1.tag'),
      subtitle: t('hero.slide1.subtitle'),
      img: '/src/assets/images/hero-fashion.jpg',
    },
    {
      line1: t('hero.slide2.line1'),
      line2: t('hero.slide2.line2'),
      line3: t('hero.slide2.line3'),
      tag: t('hero.slide2.tag'),
      subtitle: t('hero.slide2.subtitle'),
      img: '/src/assets/images/hero-coffee-beans.jpg',
    },
    {
      line1: t('hero.slide3.line1'),
      line2: t('hero.slide3.line2'),
      line3: t('hero.slide3.line3'),
      line4: t('hero.slide3.line4', { defaultValue: '' }),
      tag: t('hero.slide3.tag'),
      subtitle: t('hero.slide3.subtitle'),
      img: '/src/assets/images/hero-interior.jpg',
    },
  ];


  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const globalImages = useGlobalImages();

  const dynamicPillarImages = React.useMemo(() => {
    const getLatestForCategory = (cat: string, fallback: string) => {
      const filtered = globalImages.filter(img => img.category === cat);
      // prioritize custom uploaded ones, then brand defaults
      const custom = filtered.find(img => img.source === 'store upload');
      if (custom) return custom.url;
      // if no custom, try latest default or use fallback
      const defaultImg = filtered.find(img => img.source === 'brand default');
      return defaultImg ? defaultImg.url : fallback;
    };

    return {
      coffee: getLatestForCategory('coffee', '/src/assets/images/pillar-coffee.jpg'),
      bakery: getLatestForCategory('bakery', '/src/assets/images/pillar-bakery.jpg'),
      market: getLatestForCategory('market', '/images/market_grocery_official_1781633042972.jpg'),
      fashion: getLatestForCategory('fashion', '/src/assets/images/pillar-fashion.jpg'),
      thobes: getLatestForCategory('thobes', '/src/assets/images/thobes.jpg'),
    };
  }, [globalImages]);

  const pillars = [
    { id: 'coffee', name: 'COFFEE HOUSE', desc: 'Saffron espresso, tea & fresh cold brew', icon: Coffee, img: dynamicPillarImages.coffee },
    { id: 'bakery', name: 'BAKERY & SNACKS', desc: 'Freshly Baked Bread, Traditional Sudanese Snacks, Biscuits, Sweets and Daily Bakery Specialties.', icon: Cookie, img: dynamicPillarImages.bakery },
    { id: 'market', name: 'MARKET & GROCERY', desc: 'Organic Karkadeh, gum arabic & grains', icon: ShoppingBag, img: dynamicPillarImages.market },
    { id: 'fashion', name: 'PREMIUM COLLECTIONS', desc: 'Imported traditional Toob dress & abayas', icon: Shirt, img: dynamicPillarImages.fashion },
    { id: 'thobes', name: "THOBES & MEN'S WEAR", desc: 'Premium Sudanese men\'s traditional wear', icon: ThobeIcon, img: dynamicPillarImages.thobes },
  ];

  return (
    <div 
      className="relative min-h-screen bg-black overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      
      {/* Background cinematic fading images */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? 'opacity-65' : 'opacity-0'
            }`}
          >
            {/* Cinematic top-and-bottom gradient plus a soft-light blend mask for rich presence */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-[#000000]/40 to-black z-10" />
            <div className="absolute inset-0 bg-[#0c0c0c]/15 mix-blend-soft-light z-10 pointer-events-none" />
            <SafeImage
              src={slide.img}
              alt="ZOAL Luxury Background"
              containerClassName="absolute inset-0 w-full h-full z-0"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        ))}
      </div>

      {/* Floating Gold Flare Particles Layer */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-screen opacity-50">
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[60%] left-[80%] w-1 h-1 rounded-full bg-amber-200/40 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[80%] left-[30%] w-1.5 h-1.5 rounded-full bg-[#D4AF37]/20 animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[40%] left-[70%] w-1.5 h-1.5 bg-amber-100 rounded-full opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Hero Editorial Divided Grid */}
      <div className="relative z-20 flex-grow flex items-center px-4 sm:px-8 lg:px-16 pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Hero Typography (60% equivalent: col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-6">
            
            {/* Tagline Indicator - Fade in and slide slightly */}
            <motion.div 
              key={`tag-${activeSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#D4AF37] text-xs tracking-[0.45em] uppercase font-display select-none flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              {slides[activeSlide].tag}
            </motion.div>

            {/* Majestic Main Heading with hollow stroke effect - Title rises from bottom! */}
            <h1 className="w-[85%] sm:w-auto text-3xl sm:text-5xl md:text-6xl lg:text-[3.25rem] xl:text-7xl font-extrabold tracking-tighter uppercase leading-[0.85] font-display h-[180px] sm:h-[250px] md:h-[290px] flex flex-col justify-center overflow-visible">
              <span className="block pb-1">
                <motion.span 
                  key={`l1-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block whitespace-nowrap"
                >
                  {slides[activeSlide].line1}
                </motion.span>
              </span>
              <span className="block py-1">
                <motion.span 
                  key={`l2-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="text-stroke-white select-none block hover:text-[#D4AF37]/10 transition-colors duration-500 whitespace-nowrap"
                >
                  {slides[activeSlide].line2}
                </motion.span>
              </span>
              <span className="block pt-1">
                <motion.span 
                  key={`l3-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#D4AF37] block whitespace-nowrap"
                >
                  {slides[activeSlide].line3}
                </motion.span>
              </span>
              {slides[activeSlide].line4 && (
                <span className="block pt-1">
                  <motion.span 
                    key={`l4-${activeSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[#D4AF37] block whitespace-nowrap"
                  >
                    {slides[activeSlide].line4}
                  </motion.span>
                </span>
              )}
            </h1>

            {/* Subtitle description - Fades in gently */}
            <div className="h-[48px] sm:h-[60px]">
              <motion.p 
                key={`sub-${activeSlide}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-zinc-300 w-[90%] sm:w-auto text-[11px] sm:text-sm tracking-wide max-w-lg leading-relaxed font-sans text-justify bg-black/10 backdrop-blur-xs p-1 rounded-sm"
              >
                {slides[activeSlide].subtitle}
              </motion.p>
            </div>

            {/* CTA action buttons - Fixed across all slides */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-1 sm:pt-4 sm:mt-auto"
            >
              <button
                onClick={() => {
                  if (setSelectedCategoryFilter) setSelectedCategoryFilter('all');
                  setCurrentPage('store');
                }}
                className="w-full sm:w-auto px-10 py-3.5 sm:py-4 bg-[#D4AF37] text-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                {t('hero.shop_button')}
              </button>
            </motion.div>

            {/* Localized geographic registration details */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-mono mt-8 sm:mt-0 pt-2 sm:pt-6 select-none pb-4 sm:pb-0"
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]/60" />
              <span>Al Hofuf</span>
            </motion.div>

          </div>

          {/* Right Column: Visual Experience Grid as the interactive Pillars (40% equivalent: col-span-5) */}
          <div className="lg:col-span-5 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-6 font-display text-center lg:text-left"
            >
              Our Spaces
            </motion.div>
            
            {/* Staggered container for pillars */}
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4 h-full"
            >
              {pillars.map((p, idx) => {
                const IconComp = p.icon;
                
                // If there's an odd number of pillars (e.g. 5), the last one spans 2 columns
                const isLastAndOdd = idx === pillars.length - 1 && pillars.length % 2 !== 0;
                const gridClass = isLastAndOdd ? "col-span-2 md:col-span-2" : "";
                
                return (
                  <motion.button
                    variants={{
                      hidden: { opacity: 0, y: 35 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    key={p.id}
                    onClick={() => {
                      if (setSelectedCategoryFilter) {
                        setSelectedCategoryFilter(p.id);
                      }
                      setCurrentPage('store');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`group relative h-[85px] min-[375px]:h-[95px] sm:min-h-[160px] md:h-44 rounded-sm overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-2 sm:p-5 md:p-6 text-left transition-all duration-400 hover:border-[#D4AF37]/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${gridClass}`}
                  >
                    {/* Background image matrix with custom opacity controls */}
                    <SafeImage
                      src={p.img}
                      alt={p.name}
                      containerClassName="absolute inset-0 z-0 overflow-hidden"
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-all duration-400 scale-100 group-hover:scale-[1.03] group-hover:brightness-110 select-none pointer-events-none"
                      category={p.id as BusinessCategory}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

                    <div className="relative z-20 flex justify-between items-start w-full">
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-[#D4AF37]/80 font-bold group-hover:text-[#D4AF37] transition-colors mt-0.5 sm:mt-1">
                        0{idx + 1}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="opacity-0 translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-400 text-[#D4AF37] text-[8px] sm:text-[9px] uppercase tracking-widest font-mono hidden sm:inline-block mt-0.5">
                          Explore &rarr;
                        </span>
                        <div className="p-1 sm:p-2 rounded-full bg-black/40 border border-white/10 group-hover:border-[#D4AF37]/50 backdrop-blur-sm transition-all duration-400 group-hover:bg-[#D4AF37]/10 flex items-center justify-center">
                          <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300 group-hover:text-[#D4AF37] transition-colors" />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-20 mt-auto pt-1 sm:pt-4">
                      <h3 className="text-white text-[9.5px] min-[375px]:text-[10.5px] sm:text-[13px] md:text-sm font-display uppercase tracking-widest font-bold group-hover:text-[#D4AF37] duration-400 leading-tight block line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="hidden sm:block text-zinc-400 text-[10px] md:text-[11px] font-sans truncate mt-1.5 group-hover:text-zinc-300 transition-colors w-full">
                        {p.desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

        </div>
      </div>

      {/* Decorative vertical spacer / scroll prompt */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col items-center"
      >
        {/* Scroll indicator with bounce animation */}
        <div className="flex flex-col items-center justify-center text-zinc-500 hover:text-[#D4AF37] transition-all duration-300">
          <span className="text-[9px] uppercase tracking-[0.3em] mb-2 pointer-events-none select-none">
            Deepen The Experience
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#D4AF37]" />
        </div>
      </motion.div>

    </div>
  );
}
