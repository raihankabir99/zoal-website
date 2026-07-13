import React from 'react';
import { Award, Compass, Heart, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollZoomImage from './ScrollZoomImage';
import BranchLocation from './BranchLocation';
import { useTranslation } from 'react-i18next';
import logoImg from '../assets/images/zoal_logo_fixed_1780848794781.png';

export default function About() {
  const { t } = useTranslation();
  
  const values = [
    {
      title: t('about.mission'),
      desc: t('about.mission_text'),
      icon: Compass
    },
    {
      title: t('about.vision'),
      desc: t('about.vision_text'),
      icon: Eye
    },
    {
      title: t('about.history'),
      desc: t('about.history_text'),
      icon: Award
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 overflow-hidden relative">
      
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
          <div className="w-24 h-24 sm:w-28 sm:h-28 mb-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold-pure/20 bg-black">
            <img
              src={logoImg}
              alt="ZOAL Crest"
              className="w-[145%] h-[145%] max-w-[145%] object-cover select-none animate-pulse pointer-events-none"
            />
          </div>
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Our Heritage
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display">
            {t('about.title', { defaultValue: 'The Story of ZOAL' })}
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
            <h3 className="text-gold-pure text-lg sm:text-xl font-display uppercase tracking-widest leading-snug">
              {t('about.subtitle', { defaultValue: 'Bridging Tradition with Contemporary Elegance' })}
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              Nestled in the heart of Al Hofuf, Saudi Arabia, ZOAL was founded on a singular, profound belief: commerce must transcend mere transactions, becoming a meaningful dialogue between culture, heritage, and uncompromising craftsmanship.
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              Inspired by the rich, interwoven traditions of Sudan and the Arabian region, ZOAL has blossomed into a premier lifestyle destination. Here, the essence of authentic cultural identity and modern elegance converge to create a sanctuary of community and refined taste under one roof.
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify mb-2">
              Across our curated spaces, visitors are invited to explore a tapestry of elevated experiences:
            </p>
            <ul className="text-zinc-300 text-[11px] leading-relaxed tracking-wider space-y-3 list-none pl-1 font-sans">
              <li className="flex items-start"><span className="text-gold-pure mr-2 text-[10px] leading-none mt-1">✦</span> <span>A <strong className="text-white font-medium">Specialty Coffee House</strong> serving nuanced Arabic, Sudanese, and regional coffees that honor the ancient rituals of roasting.</span></li>
              <li className="flex items-start"><span className="text-gold-pure mr-2 text-[10px] leading-none mt-1">✦</span> <span>A <strong className="text-white font-medium">Grocery Market</strong> offering a carefully sourced selection of Sudanese essentials, heritage ingredients, and premium international goods.</span></li>
              <li className="flex items-start"><span className="text-gold-pure mr-2 text-[10px] leading-none mt-1">✦</span> <span>A <strong className="text-white font-medium">Modern Café</strong> presenting thoughtfully prepared fresh meals, beverages, and daily culinary specialties.</span></li>
              <li className="flex items-start"><span className="text-gold-pure mr-2 text-[10px] leading-none mt-1">✦</span> <span>A <strong className="text-white font-medium">Traditional Bakery</strong> preserving age-old recipes through artisanal breads, delicate sweets, biscuits, and pastries.</span></li>
              <li className="flex items-start"><span className="text-gold-pure mr-2 text-[10px] leading-none mt-1">✦</span> <span>A <strong className="text-white font-medium">Clothing & Tailoring Store</strong> celebrating sartorial elegance with bespoke thobes, Sudanese garments, women's wear, children's clothing, fabrics, hijabs, scarves, and traditional attire.</span></li>
            </ul>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify mt-4">
              Every facet of ZOAL is united by an unwavering commitment to authenticity, absolute transparency, and meticulous attention to detail. We champion pure ingredients, masterful artisanship, and products that deeply honor their origins.
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-wider text-justify">
              Far beyond a retail destination, ZOAL is a vibrant expression of hospitality, culture, and contemporary lifestyle. We seamlessly weave the timeless traditions of yesterday with the elevated aspirations of tomorrow, ensuring that community, craftsmanship, and heritage continue to thrive beautifully in the heart of Al Hofuf.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 rounded-sm overflow-hidden border border-white/5 bg-zinc-950/40 p-4 relative aspect-video"
          >
            <ScrollZoomImage
              src="/src/assets/images/about-hq.jpg"
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
            Business Highlights
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
              <span className="text-3xl sm:text-4xl font-mono text-gold-pure font-bold block">2025</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">Foundation of ZOAL</h4>
              <p className="text-zinc-500 text-[10px] mt-1">ZOAL began in Al Hofuf with a vision of bringing authentic Sudanese and Arabian products to the local community through a clothing store and grocery market focused on quality, heritage, and everyday essentials.</p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 bg-zinc-950/20 border border-white/5 rounded-xs"
            >
              <span className="text-3xl sm:text-4xl font-mono text-gold-pure font-bold block">Late 2025</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">Coffee & Bakery Launch</h4>
              <p className="text-zinc-500 text-[10px] mt-1">Expanded into hospitality with the introduction of a specialty coffee café and traditional bakery, serving Arabic coffee, Sudanese favorites, fresh breads, pastries, and handcrafted baked goods.</p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 40 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              className="p-6 bg-zinc-950/20 border border-white/5 rounded-xs"
            >
              <span className="text-3xl sm:text-4xl font-mono text-gold-pure font-bold block">2026</span>
              <h4 className="text-white text-[11px] font-display uppercase font-semibold mt-2">Hospitality Expansion</h4>
              <p className="text-zinc-500 text-[10px] mt-1">Extended the ZOAL experience into accommodation and guest services, creating welcoming spaces that combine comfort, culture, and traditional Arabian hospitality.</p>
            </motion.div>

          </motion.div>
        </div>
        
        <BranchLocation />

      </div>
    </div>
  );
}
