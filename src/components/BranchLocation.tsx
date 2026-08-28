import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useBranding } from './BrandingContext';
import { useTranslation } from 'react-i18next';

export default function BranchLocation() {
  const { settings } = useBranding();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <section className="py-10 sm:py-20 bg-[#050505] border-y border-white/5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 sm:mb-16"
        >
          <h2 className="text-[15px] sm:text-lg md:text-3xl font-display uppercase leading-tight tracking-[0.08em] text-white">
            {isAr ? 'فرعنا وموقعنا' : 'Our Branch & Location'}
          </h2>
          <div className="w-16 h-[1px] bg-gold-pure mx-auto mt-2 sm:mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? 30 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full relative aspect-video md:aspect-auto md:h-[420px] lg:h-[450px] overflow-hidden rounded-none sm:rounded-sm border-x-0 sm:border border-white/5 -mx-2 sm:mx-0"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d587.1944766980803!2d49.573297570384995!3d25.367673688217213!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e379700698a0eb9%3A0x227ddfa1f5371cd0!2z2YXYrtio2LIg2YjYrdmE2YjZitin2KfYqiDYp9mE2LLZiNmE!5e1!3m2!1sen!2ssa!4v1785509449924!5m2!1sen!2ssa"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title={isAr ? "موقع الفرع على الخريطة" : "ZOAL Store Location"}
            />
          </motion.div>

          {/* Location Info */}
          <motion.div
            initial={{ opacity: 0, x: isAr ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="border-x-0 sm:border border-white/5 bg-zinc-950/40 backdrop-blur-sm p-4 sm:p-8 rounded-none sm:rounded-sm shadow-xl flex flex-col justify-center space-y-4 sm:space-y-6 text-start -mx-2 sm:mx-0"
          >
            <h3 className="text-lg md:text-xl font-display uppercase tracking-wider text-white whitespace-nowrap">
              {isAr ? `معرض ${isAr ? 'زول' : 'ZOAL'}` : 'AL ZOAL STORE'}
            </h3>
            <div className="space-y-4 text-zinc-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-pure shrink-0 mt-0.5" />
                <p className="text-sm font-sans tracking-wide">{settings.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold-pure shrink-0" />
                <p className="text-sm font-sans tracking-wide">
                  {isAr ? '٠٩:٠٠ صباحاً – ٠١:٠٠ مساءً' : '9:00 AM – 1:00 PM'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-pure shrink-0" />
                <p className="text-sm font-sans tracking-wide" dir="ltr">{settings.phone}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
