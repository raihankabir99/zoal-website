import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, MapPin, Coffee, Shirt, Home, Cookie, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategoryFilter?: (cat: string) => void;
}

export default function Hero({ setCurrentPage, setSelectedCategoryFilter }: HeroProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      line1: 'SUDANESE',
      line2: 'HERITAGE',
      line3: 'REDEFINED.',
      title: 'ZOAL GROUP COOPERATIVES',
      subtitle: 'Authentic Sudanese Products, Fresh Bakery, Premium Coffee and Traditional Fashion Under One Brand.',
      tag: 'THE APEX OF LUXURY',
      img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600',
    },
    {
      line1: 'GEISHA ROAST',
      line2: 'FRESH',
      line3: 'HOBOZ BREAD.',
      title: 'COFFEE & TRADITIONAL BAKERY',
      subtitle: 'Freshly roasted specialty coffee coupled with traditional Hoboz bread and premium Sudanese sweets.',
      tag: 'ARTISAN STONE HEARTHS',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1600',
    },
    {
      line1: 'WESTERN COTTON',
      line2: 'TERRACOTTA',
      line3: 'SPICE DEPOT.',
      title: 'TEXTILES, MARKET & CLAY',
      subtitle: 'Exquisite hand-woven fabrics, traditional ladies dresses, spice imports, and carved sandstone pots.',
      tag: 'SECURED ORGANIC SOURCING',
      img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1600',
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const pillars = [
    { id: 'coffee', name: 'ZOAL Coffee Cafe', desc: 'Saffron espresso, tea & fresh cold brew', icon: Coffee, img: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400' },
    { id: 'bakery', name: 'Sudan Bakery', desc: 'Fresh Hoboz, biscuits & sweets', icon: Cookie, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' },
    { id: 'market', name: 'Sudan Market', desc: 'Organic Karkadeh, gum arabic & grains', icon: Sparkles, img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' },
    { id: 'fashion', name: 'Sudan Fashion', desc: 'Hand-woven traditional Toob dress & abayas', icon: Shirt, img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400' },
    { id: 'pots', name: 'Pots Collection', desc: 'Oasis flower pots & terracotta containers', icon: Home, img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400' },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col justify-between">
      
      {/* Background cinematic fading images */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === activeSlide ? 'opacity-65 scale-102' : 'opacity-0 scale-100'
            } transform duration-[6000ms]`}
          >
            {/* Cinematic top-and-bottom gradient plus a soft-light blend mask for rich presence */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-[#000000]/40 to-black z-10" />
            <div className="absolute inset-0 bg-[#0c0c0c]/15 mix-blend-soft-light z-10 pointer-events-none" />
            <img
              src={slide.img}
              alt="ZOAL Luxury Background"
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
      <div className="relative z-20 flex-grow flex items-center px-4 sm:px-8 lg:px-16 pt-32 pb-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Hero Typography (60% equivalent: col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left space-y-6">
            
            {/* Tagline Indicator - Fade in and slide slightly */}
            <motion.div 
              key={`tag-${activeSlide}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#D4AF37] text-xs tracking-[0.45em] uppercase font-display select-none flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              {slides[activeSlide].tag}
            </motion.div>

            {/* Majestic Main Heading with hollow stroke effect - Title rises from bottom! */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter uppercase leading-[0.85] font-display min-h-[180px] sm:min-h-[290px] flex flex-col justify-center overflow-hidden">
              <span className="block overflow-hidden pb-1">
                <motion.span 
                  key={`l1-${activeSlide}`}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  {slides[activeSlide].line1}
                </motion.span>
              </span>
              <span className="block overflow-hidden py-1">
                <motion.span 
                  key={`l2-${activeSlide}`}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="text-stroke-white select-none block hover:text-[#D4AF37]/10 transition-colors duration-500"
                >
                  {slides[activeSlide].line2}
                </motion.span>
              </span>
              <span className="block overflow-hidden pt-1">
                <motion.span 
                  key={`l3-${activeSlide}`}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#D4AF37] block"
                >
                  {slides[activeSlide].line3}
                </motion.span>
              </span>
            </h1>

            {/* Subtitle description - Fades in after title with slight upward motion */}
            <motion.p 
              key={`sub-${activeSlide}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-zinc-300 text-xs sm:text-sm tracking-wide max-w-lg leading-relaxed font-sans text-justify bg-black/10 backdrop-blur-xs p-1 rounded-sm"
            >
              {slides[activeSlide].subtitle} A comprehensive multisensory Saudi hospitality model shaping first-rate artisanal products and premium home decor within our Flagship Atelier.
            </motion.p>

            {/* CTA action buttons - Fade in and scale from 0.95 to 1, appearing last with soft glow */}
            <motion.div 
              key={`btn-${activeSlide}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              <button
                onClick={() => {
                  if (setSelectedCategoryFilter) setSelectedCategoryFilter('all');
                  setCurrentPage('store');
                }}
                className="w-full sm:w-auto px-10 py-4 bg-[#D4AF37] text-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                Shop The Collection
              </button>
            </motion.div>

            {/* Localized geographic registration details */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex items-center gap-2 text-zinc-500 text-[9px] uppercase tracking-[0.25em] font-mono pt-4 select-none"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]/60" />
              <span>Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361</span>
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
              The Atelier Pillars
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
              className="grid grid-cols-2 gap-4 h-full"
            >
              {pillars.map((p, idx) => {
                const IconComp = p.icon;
                
                // Offset layout elements precisely
                let offsetClass = "";
                if (idx === 1) offsetClass = "lg:mt-8"; // item 2 offset down
                if (idx === 2) offsetClass = "lg:-mt-8"; // item 3 offset up
                if (idx === 4) offsetClass = "col-span-2 lg:-mt-4"; // item 5 span full row
                
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
                    className={`group relative h-28 sm:h-36 rounded-sm overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-4 text-left transition-all duration-500 hover:border-[#D4AF37]/50 hover:shadow-[0_0_25px_rgba(212,175,55,0.12)] cursor-pointer flex flex-col justify-between ${offsetClass}`}
                  >
                    {/* Background image matrix with custom opacity controls */}
                    <div 
                      className="absolute inset-0 opacity-20 group-hover:opacity-45 transition-opacity duration-700 bg-cover bg-center z-0 scale-102 group-hover:scale-100" 
                      style={{ backgroundImage: `url(${p.img})` }} 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-transparent z-10" />

                    <div className="relative z-20 flex justify-between items-start w-full">
                      <span className="text-[10px] font-mono tracking-widest text-[#D4AF37]/80 font-bold">
                        0{idx + 1}
                      </span>
                      <div className="p-1.5 rounded-full bg-white/5 border border-white/10 group-hover:border-[#D4AF37]/40 transition-all duration-300">
                        <IconComp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#D4AF37] transition-colors" />
                      </div>
                    </div>

                    <div className="relative z-20 mt-auto">
                      <h3 className="text-white text-[11px] font-display uppercase tracking-widest font-bold group-hover:text-[#D4AF37] duration-300">
                        {p.name}
                      </h3>
                      <p className="text-zinc-500 text-[9px] font-sans truncate group-hover:text-zinc-400 mt-0.5">
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
