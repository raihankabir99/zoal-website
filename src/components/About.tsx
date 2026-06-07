import React from 'react';
import { Award, Compass, Heart, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollZoomImage from './ScrollZoomImage';

export default function About() {
  const values = [
    {
      title: 'Our Sovereign Mission',
      desc: 'To reinvent Arabian hospitality through modern, meticulous minimalist engineering guidelines, ensuring every physical asset carries storytelling depth.',
      icon: Compass
    },
    {
      title: 'Design Aesthetics',
      desc: 'Treating food, fragrance, and couture fabrics as architectural elements, balancing raw materials (sandstone, suede, unroasted Geisha seeds) with clean math.',
      icon: Eye
    },
    {
      title: 'Heritage Integrity',
      desc: 'Deeply committed to Saudi Arabian high culture, generating growth pathways for local artists, roasters, and weavers at Al Hofuf and Dammam centers.',
      icon: Award
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 overflow-hidden relative">
      
      {/* Dynamic Glow orb */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] gold-glow-orb opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 flex flex-col items-center justify-center"
        >
          <img
            src="/src/assets/images/zoal_logo_cropped.png"
            alt="ZOAL Crest"
            className="w-24 h-24 sm:w-28 sm:h-28 mb-6 select-none animate-pulse pointer-events-none"
            style={{
              objectFit: 'contain',
              background: 'transparent',
              overflow: 'visible',
            }}
            referrerPolicy="no-referrer"
          />
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Atelier Foundations
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display">
            The Story of ZOAL
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
        </motion.div>

        {/* Story Block Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6"
          >
            <h3 className="text-white text-lg sm:text-xl font-display uppercase tracking-widest leading-snug">
              Bridging Millennial Tradition with Minimalist Symmetries
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              Established in Al Shati, Dammam, ZOAL Group started with a simple belief: commerce is generic, while luxury is a narrative connection to origin. We treat single-origin Yemen coffee, organic Taif rose water creams, and hand-embroidered Italian suede vests under uniform design parameters.
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              Our spaces are built with absolute glass transparency, enabling consumers to witness roasting cracks or dough fermentation matrices firsthand. We reject synthetic dyes, artificial sugars, and mass manufacturing, preserving physical weight and micro-fidelity.
            </p>
            <div className="p-4 border border-gold-pure/10 bg-gold-pure/5 rounded-xs">
              <span className="text-[9px] uppercase tracking-widest font-mono text-gold-pure font-bold block mb-1">Corporate Standard</span>
              <p className="text-zinc-400 text-[10.5px]">ISO 22000, SFDA Certified, and SASO hospitality rankings matched.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 rounded-sm overflow-hidden border border-white/5 bg-zinc-950/40 p-4 relative aspect-video"
          >
            <ScrollZoomImage
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
              alt="ZOAL Design Boardroom"
              className="w-full h-full object-cover"
              containerClassName="w-full h-full overflow-hidden relative rounded-xs"
            />
          </motion.div>

        </div>

        {/* Corporate Values */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
        >
          {values.map((val, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 35 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 border border-white/5 bg-[#050505] hover:border-gold-pure/20 transition-all rounded-sm text-center space-y-4 shadow-sm hover:shadow-[0_4px_30px_rgba(212,175,55,0.04)]"
            >
              <div className="p-3 bg-white/5 rounded-full w-fit mx-auto text-gold-pure">
                <val.icon className="w-5 h-5" />
              </div>
              <h3 className="text-white text-xs font-display uppercase tracking-wider font-semibold">{val.title}</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievements Timeline */}
        <div className="border-t border-white/5 pt-16">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-white text-sm font-display uppercase tracking-widest block text-center mb-12"
          >
            ATELIER ACHIEVEMENTS
          </motion.h3>
          
          <motion.div 
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
          >
            
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 bg-zinc-950/20 border border-white/5 rounded-xs"
            >
              <span className="text-4xl font-mono text-gold-pure font-bold block">2023</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">Dammam Foundation</h4>
              <p className="text-zinc-500 text-[10px] mt-1">Acquired our whole-bean roasting laboratory license in the Eastern Province.</p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 bg-zinc-950/20 border border-white/5 rounded-xs"
            >
              <span className="text-4xl font-mono text-gold-pure font-bold block">2024</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">SASO Quality Award</h4>
              <p className="text-zinc-500 text-[10px] mt-1">Awarded Best Boutique Roastery and Luxury Culinary Standard in Dammam.</p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 bg-zinc-950/20 border border-white/5 rounded-xs"
            >
              <span className="text-4xl font-mono text-gold-pure font-bold block">2025</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">Couture Expansion</h4>
              <p className="text-zinc-500 text-[10px] mt-1">Inaugurated Al Hofuf Flagship Lounge at Abu Bakr As Siddiq Rd and launched Suede embroidery lines.</p>
            </motion.div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
