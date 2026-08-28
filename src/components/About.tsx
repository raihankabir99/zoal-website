import React from 'react';
import { 
  Compass, 
  Eye, 
  Award, 
  Coffee, 
  ShoppingBag, 
  Utensils, 
  ChefHat, 
  Scissors, 
  Shield, 
  Users, 
  Lightbulb, 
  Sparkles, 
  CheckCircle2,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import ScrollZoomImage from './ScrollZoomImage';
import BranchLocation from './BranchLocation';
import { useTranslation } from 'react-i18next';

import { useBranding } from './BrandingContext';
import { BRANDING } from '../constants';

export default function About() {
  const { t, i18n } = useTranslation();
  const { settings } = useBranding();
  const isAr = i18n.language === 'ar';

  const brandName = isAr ? 'زول' : 'ZOAL';

  // Core content translation mapping for absolute reliability
  const content = {
    badge: t('about.badge'),
    title: t('about.title', { brandName }),
    subtitle: t('about.subtitle'),
    
    intro_1: t('about.intro_1', { brandName }),
    
    intro_2: t('about.intro_2', { brandName }),

    destinations_title: t('about.destinations_title'),
    destinations_desc: t('about.destinations_desc', { brandName }),

    commitment_title: t('about.commitment_title'),
    commitment_subtitle: t('about.commitment_subtitle'),
    commitment_footer: t('about.commitment_footer'),

    more_title: t('about.more_title'),
    more_desc1: t('about.more_desc1', { brandName }),
    more_desc2: t('about.more_desc2'),
    more_desc3: t('about.more_desc3', { brandName }),

    mission_title: t('about.mission_title'),
    mission_text: t('about.mission_text'),

    vision_title: t('about.vision_title'),
    vision_text: t('about.vision_text'),

    values_title: t('about.values_title'),
    closing_title: t('about.closing_title'),
    closing_text: t('about.closing_text', { brandName })
  };

  const destinations = [
    {
      title: t('about.destinations.coffee_title'),
      desc: t('about.destinations.coffee_desc'),
      icon: Coffee
    },
    {
      title: t('about.destinations.grocery_title'),
      desc: t('about.destinations.grocery_desc'),
      icon: ShoppingBag
    },
    {
      title: t('about.destinations.cafe_title'),
      desc: t('about.destinations.cafe_desc'),
      icon: Utensils
    },
    {
      title: t('about.destinations.bakery_title'),
      desc: t('about.destinations.bakery_desc'),
      icon: ChefHat
    },
    {
      title: t('about.destinations.fashion_title'),
      desc: t('about.destinations.fashion_desc'),
      icon: Scissors
    }
  ];

  const commitments = [
    { title: t('about.commitments.heritage'), color: 'border-gold-pure/20' },
    { title: t('about.commitments.quality'), color: 'border-white/10' },
    { title: t('about.commitments.craftsmanship'), color: 'border-gold-pure/20' },
    { title: t('about.commitments.hospitality'), color: 'border-white/10' },
    { title: t('about.commitments.trust'), color: 'border-gold-pure/20' },
    { title: t('about.commitments.innovation'), color: 'border-white/10' }
  ];

  const myValues = [
    {
      title: t('about.values.authenticity_title'),
      desc: t('about.values.authenticity_desc'),
      icon: Compass
    },
    {
      title: t('about.values.quality_title'),
      desc: t('about.values.quality_desc'),
      icon: Shield
    },
    {
      title: t('about.values.hospitality_title'),
      desc: t('about.values.hospitality_desc'),
      icon: Heart
    },
    {
      title: t('about.values.craftsmanship_title'),
      desc: t('about.values.craftsmanship_desc'),
      icon: Award
    },
    {
      title: t('about.values.community_title'),
      desc: t('about.values.community_desc'),
      icon: Users
    },
    {
      title: t('about.values.innovation_title'),
      desc: t('about.values.innovation_desc'),
      icon: Lightbulb
    }
  ];

  return (
    <div className="bg-black text-white min-h-screen pt-16 md:pt-[88px] lg:pt-[92px] pb-10 md:pb-20 overflow-hidden relative font-sans">
      
      {/* Background elegant golden radial glow */}
      <div className="absolute top-[10%] right-[-15%] w-[500px] h-[500px] bg-gold-pure/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[500px] h-[500px] bg-gold-pure/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* SECTION 1: Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 md:mb-16 flex flex-col items-center justify-center"
        >
          {/* Logo Badge Container */}
          <div className="w-16 h-16 md:w-28 md:h-28 mb-3 md:mb-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold-pure/20 bg-black">
            <img
              src={settings.businessLogo || BRANDING.LOGO}
              alt={t('about.badge_alt', { name: settings.businessName })}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = BRANDING.LOGO;
              }}
              className="w-[145%] h-[145%] max-w-[145%] object-cover select-none pointer-events-none shrink-0"
            />
          </div>
          
          <span className="text-[10px] sm:text-xs tracking-[0.45em] text-gold-pure uppercase font-display block mb-1.5 md:mb-3 font-semibold">
            {content.badge}
          </span>
          <h1 className="text-2xl md:text-5xl font-bold tracking-[0.15em] md:tracking-[0.2em] uppercase font-display text-white">
            {content.title}
          </h1>
          <p className="text-[11px] md:text-sm text-zinc-400 mt-2 md:mt-4 max-w-2xl mx-auto tracking-wider md:tracking-widest font-display uppercase border-t border-b border-white/5 py-2 md:py-3">
            {content.subtitle}
          </p>
        </motion.div>

        {/* SECTION 2: Heritage Story Narrative & Graphic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 lg:gap-16 items-center mb-10 md:mb-28">
          
          <motion.div 
            initial={{ opacity: 0, x: isAr ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 space-y-4 md:space-y-6"
          >
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-normal md:tracking-wider text-start">
              {content.intro_1}
            </p>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-normal md:tracking-wider text-start">
              {content.intro_2}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: isAr ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 -mx-2 sm:mx-0 rounded-none sm:rounded-xs overflow-hidden border-x-0 sm:border border-white/5 bg-zinc-950/40 p-0 sm:p-4 aspect-video relative group"
          >
            <ScrollZoomImage
              src="/images/about/zoal-office.jpeg"
              alt={t('about.boardroom_alt')}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              containerClassName="w-full h-full overflow-hidden relative rounded-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>

        </div>

        {/* SECTION 3: A Destination of Distinction */}
        <div className="mb-10 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10 md:mb-16"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1.5 md:mb-2">
              {t('about.spaces_eyebrow')}
            </span>
            <h2 className="text-xl md:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.destinations_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-2 md:mt-3 mb-3 md:mb-4" />
            <p className="text-zinc-400 text-xs max-w-xl mx-auto leading-relaxed">
              {content.destinations_desc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {destinations.map((dest, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="p-3.5 md:p-8 border border-white/5 bg-[#050505] hover:border-gold-pure/20 transition-all rounded-xs flex flex-col justify-between group hover:shadow-[0_4px_30px_rgba(212,175,55,0.03)]"
              >
                <div className="space-y-2 md:space-y-4">
                  <div className="flex flex-row items-center gap-2.5 md:block md:space-y-4">
                    <div className="p-1.5 md:p-3 bg-white/5 rounded-xs w-fit text-gold-pure group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <dest.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h3 
                      className="text-[#ddddb4] text-[11px] sm:text-sm font-display uppercase tracking-wider md:tracking-widest font-semibold"
                      style={idx === 0 ? { fontFamily: 'Syncopate' } : undefined}
                    >
                      {dest.title}
                    </h3>
                  </div>
                  <p className="text-zinc-300 text-xs leading-snug md:leading-relaxed tracking-normal md:tracking-wide text-start">
                    {dest.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Our Commitment */}
        <div className="mb-10 md:mb-28">
          <div className="p-3 md:p-12 border border-white/5 bg-[#050505]/80 rounded-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-pure/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-center">
              <div className="lg:col-span-5 space-y-2 md:space-y-4">
                <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
                  {t('about.promise_eyebrow')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
                  {content.commitment_title}
                </h2>
                <div className="w-12 h-[1px] bg-gold-pure my-2 md:my-3" />
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed text-start">
                  {content.commitment_subtitle}
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-3 md:grid-cols-2 gap-1.5 md:gap-4">
                  {commitments.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 md:p-4 border ${item.color} rounded-xs bg-black/40 text-center flex items-center justify-center`}
                    >
                      <span className="text-[#ddddb4] text-[8px] sm:text-xs tracking-normal md:tracking-wider font-display uppercase font-semibold">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-white/5 text-center">
              <p className="text-zinc-500 text-[10px] md:text-[11px] italic tracking-wide">
                {content.commitment_footer}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: More Than a Marketplace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 items-center mb-6 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-3 md:space-y-6"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
              {t('about.beyond_retail_eyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.more_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure my-2 md:my-3" />
            <p className="text-zinc-300 text-xs leading-relaxed tracking-normal md:tracking-wider text-start">
              {content.more_desc1}
            </p>
            <p className="text-zinc-300 text-xs leading-relaxed tracking-normal md:tracking-wider text-start">
              {content.more_desc2}
            </p>
          </motion.div>

          <div className="p-3 md:p-8 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3 md:space-y-4">
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-normal md:tracking-wider text-start font-sans">
              {content.more_desc3}
            </p>
            <div className="flex justify-end pt-1 md:pt-2">
              <Sparkles className="w-5 h-5 text-gold-pure animate-pulse" />
            </div>
          </div>
        </div>

        {/* SECTION 6: Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-10 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-3 md:p-8 border border-gold-pure/10 bg-[#050505] rounded-xs space-y-3 md:space-y-4 hover:border-gold-pure/30 transition-all shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
          >
            <div className="flex flex-row items-center gap-2.5 md:block md:space-y-4">
              <div className="p-1.5 md:p-3 bg-gold-pure/5 rounded-xs w-fit text-gold-pure shrink-0">
                <Compass className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h3 className="text-white text-xs md:text-sm font-display uppercase tracking-widest font-semibold">
                {content.mission_title}
              </h3>
            </div>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed text-start">
              {content.mission_text}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-3 md:p-8 border border-gold-pure/10 bg-[#050505] rounded-xs space-y-3 md:space-y-4 hover:border-gold-pure/30 transition-all shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
          >
            <div className="flex flex-row items-center gap-2.5 md:block md:space-y-4">
              <div className="p-1.5 md:p-3 bg-gold-pure/5 rounded-xs w-fit text-gold-pure shrink-0">
                <Eye className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <h3 className="text-white text-xs md:text-sm font-display uppercase tracking-widest font-semibold">
                {content.vision_title}
              </h3>
            </div>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed text-start">
              {content.vision_text}
            </p>
          </motion.div>
        </div>

        {/* SECTION 7: Our Values */}
        <div className="mb-10 md:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 md:mb-16"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1.5 md:mb-2">
              {t('about.pillars_eyebrow')}
            </span>
            <h2 className="text-xl md:text-3xl font-display font-semibold tracking-widest uppercase text-white">
              {content.values_title}
            </h2>
            <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-2 md:mt-3" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {myValues.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="p-3 md:p-6 border border-white/5 bg-[#050505]/60 hover:border-gold-pure/20 transition-all rounded-xs space-y-2 md:space-y-3 hover:shadow-[0_4px_30px_rgba(212,175,55,0.02)]"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-1.5 md:p-2 bg-white/5 rounded-xs text-gold-pure shrink-0">
                    <val.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </div>
                  <h4 className="text-[#989835] text-xs font-display uppercase tracking-wider font-semibold">
                    {val.title}
                  </h4>
                </div>
                <p className="text-zinc-300 text-xs leading-snug md:leading-relaxed tracking-normal md:tracking-wide text-start">
                  {val.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SECTION 8: Closing Statement */}
        <div className="mb-10 md:mb-28 border-t border-white/5 pt-10 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center space-y-3 md:space-y-6"
          >
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">
              {content.closing_title}
            </span>
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed tracking-normal md:tracking-wider text-start sm:text-center italic font-sans px-4">
              "{content.closing_text}"
            </p>
            <div className="pt-2 md:pt-4 flex justify-center">
              <div className="w-8 h-8 rounded-full border border-gold-pure/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-gold-pure" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION 9: Branch Location & Interactive Protocol */}
        <BranchLocation />

      </div>
    </div>
  );
}
