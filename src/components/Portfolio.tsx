import React, { useState, useMemo } from 'react';
import { Camera, Layers, X, ChevronRight, ChevronLeft, ArrowUpRight } from 'lucide-react';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';

export default function Portfolio() {
  const [activeTheme, setActiveTheme] = useState<'all' | 'coffee' | 'bakery' | 'market' | 'fashion' | 'pots'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryItems = [
    {
      id: 1,
      theme: 'coffee',
      title: 'Geisha Extraction Ritual',
      location: 'ZOAL Coffee Cafe Flagship Espresso Bar',
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 2,
      theme: 'bakery',
      title: 'Sudanese Traditional Hoboz Bread',
      location: 'Central Bakery Hearth Chambers',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 3,
      theme: 'fashion',
      title: 'Royal Handwoven Silk Toob',
      location: 'ZOAL Atelier Suitability Suite',
      img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 4,
      theme: 'pots',
      title: 'Sandstone Oasis Pots Curation',
      location: 'Exclusive Pots Artisan Chambers',
      img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 5,
      theme: 'market',
      title: 'Kordofan Hibiscus Calyces Selection',
      location: 'Sudan Market Sifting Workspace',
      img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 6,
      theme: 'coffee',
      title: 'Nitrogen Cold-Brew Canning Ritual',
      location: 'ZOAL Coffee Cafe Canning Workspace',
      img: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 7,
      theme: 'bakery',
      title: 'Handcrafted Sudanese Sweets & Ghoriba',
      location: 'Central Bakery Patisserie Suite',
      img: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 8,
      theme: 'market',
      title: 'Golden Hasab Gum Arabic Selection',
      location: 'Sudan Market Purification Center',
      img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
    }
  ];

  const filteredItems = useMemo(() => {
    return activeTheme === 'all' ? galleryItems : galleryItems.filter(i => i.theme === activeTheme);
  }, [activeTheme]);

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
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Ophthalmic Galleries
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display text-white text-wrap">
            Sensory Curation Lookbook
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
          <p className="text-zinc-500 text-xs tracking-wider uppercase mt-4 max-w-xl mx-auto">
            A comprehensive visual record of our production facilities, tailored fabric trims, and culinary architecture.
          </p>
        </div>

        {/* Theme select controls */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {[
            { id: 'all', label: 'All Lookbook' },
            { id: 'coffee', label: 'Coffee Gallery' },
            { id: 'bakery', label: 'Bakery Gallery' },
            { id: 'market', label: 'Sudan Market Gallery' },
            { id: 'fashion', label: 'Fashion & Textiles' },
            { id: 'pots', label: 'Pots Collection' }
          ].map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id as any)}
              className={`py-2 px-4 rounded-sm text-[9.5px] uppercase font-display tracking-widest transition-all cursor-pointer ${
                activeTheme === theme.id
                  ? 'border-b border-gold-pure text-gold-pure font-bold bg-white/5'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {theme.label}
            </button>
          ))}
        </div>

        {/* Masonry Layout Portfolio Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -100 : 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-35px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setLightboxIndex(idx)}
              className="break-inside-avoid relative rounded-sm overflow-hidden border border-white/5 bg-zinc-950 group cursor-pointer transition-all duration-500 hover:border-gold-pure/30 inline-block w-full"
            >
              
              <ScrollZoomImage
                src={item.img}
                alt={item.title}
                className="w-full h-auto object-cover"
                containerClassName="w-full h-full overflow-hidden relative"
              />

              {/* Text Hover Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <span className="text-[8px] uppercase tracking-widest text-[#D4AF37] font-mono">{item.theme} series</span>
                <h3 className="text-white text-sm font-display uppercase tracking-widest font-semibold mt-1 flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-gold-pure" />
                </h3>
                <p className="text-zinc-400 text-[10px] mt-1 font-sans">{item.location}</p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>

      {/* Lightbox Slider popup */}
      {lightboxIndex !== null && (
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
            <img
              src={filteredItems[lightboxIndex].img}
              alt={filteredItems[lightboxIndex].title}
              className="max-w-full max-h-[60vh] object-contain rounded-xs border border-white/10"
            />
            <div className="text-center mt-6 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">{filteredItems[lightboxIndex].theme} segment</span>
              <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest font-medium">
                {filteredItems[lightboxIndex].title}
              </h3>
              <p className="text-zinc-500 text-xs font-sans">{filteredItems[lightboxIndex].location}</p>
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
      )}

    </div>
  );
}
