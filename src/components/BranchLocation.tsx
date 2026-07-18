import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export default function BranchLocation() {
  return (
    <section className="py-20 bg-[#050505] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-[0.2em] text-white">Our Branch & Location</h2>
          <div className="w-16 h-[1px] bg-gold-pure mx-auto mt-4" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full h-96 lg:h-full rounded-sm overflow-hidden border border-white/5"
          >
            <iframe
              src="https://maps.google.com/maps?q=%D9%85%D8%AE%D8%A8%D8%B2%20%D9%88%D8%AD%D9%84%D9%88%D9%8A%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B2%D9%88%D9%84%209H9F%2B57J,%20Abu%20Bakr%20As%20Siddiq%20Rd,%20Almuallimeen,%20Al%20Hofuf%2036361&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ZOAL Store Location"
            />
          </motion.div>

          {/* Location Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="border border-white/5 bg-zinc-950/40 backdrop-blur-sm p-8 rounded-sm shadow-xl flex flex-col justify-center space-y-6"
          >
            <h3 className="text-xl font-display uppercase tracking-wider text-white">ZOAL Store</h3>
            <div className="space-y-4 text-zinc-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-pure shrink-0 mt-0.5" />
                <p className="text-sm font-sans tracking-wide">Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia</p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gold-pure shrink-0" />
                <p className="text-sm font-sans tracking-wide">9:00 AM – 1:00 PM</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-pure shrink-0" />
                <p className="text-sm font-sans tracking-wide" dir="ltr">+966 56 769 9315</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
