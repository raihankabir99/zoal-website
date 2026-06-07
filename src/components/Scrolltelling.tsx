import React, { useState } from 'react';
import { Coffee, Cookie, Award, Shirt, Home, Sparkles, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Scrolltelling() {
  const [activeTab, setActiveTab] = useState<'coffee' | 'bakery' | 'market' | 'fashion' | 'pots'>('coffee');
  
  // Stages states
  const [coffeeStage, setCoffeeStage] = useState(0); // 0: beans, 1: roasted, 2: espresso, 3: luxury cup
  const [bakeryStage, setBakeryStage] = useState(0); // 0: starter, 1: lamination, 2: oven
  const [marketStage, setMarketStage] = useState(0); // 0: sourcing, 1: gum arabic, 2: curated

  const tabs = [
    { id: 'coffee', name: 'ZOAL Coffee Cafe', icon: Coffee },
    { id: 'bakery', name: 'Sudan Bakery', icon: Cookie },
    { id: 'market', name: 'Sudan Market', icon: Sparkles },
    { id: 'fashion', name: 'Sudan Fashion', icon: Shirt },
    { id: 'pots', name: 'Pots Collection', icon: Home },
  ] as const;

  return (
    <div id="scrollstory-anchor" className="relative bg-black py-24 border-t border-b border-white/5 overflow-hidden">
      
      {/* Decorative large branding backdrop */}
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
          className="text-center mb-16"
        >
          <p className="text-gold-pure text-[10px] tracking-[0.40em] uppercase font-display mb-3">
            Interactive Experience
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase">
            Crafting the Senses
          </h2>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-3">
            Click stages to witness our rigorous preparation standards
          </p>
        </motion.div>

        {/* Storytelling Tabs */}
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-16"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
                }}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-sm border transition-all duration-500 cursor-pointer text-[10px] sm:text-xs font-display uppercase tracking-widest ${
                  activeTab === tab.id
                    ? 'border-gold-pure text-white bg-gold-pure/10 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'border-white/5 text-zinc-500 bg-zinc-950/20 hover:border-gold-pure/40 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.name}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Narrative Interactive Showcase Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-950/30 border border-white/5 rounded-sm p-6 sm:p-12 relative">
          
          <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-500 tracking-widest">
            STORY ENGINE v1.4
          </div>

          {/* Visual Canvas Display (Lefthand Side - columns 1 to 7) */}
          <motion.div 
            initial={{ opacity: 0, x: -70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center items-center min-h-[320px] sm:min-h-[460px] bg-black/40 rounded-sm border border-white/5 p-4 sm:p-8 relative overflow-hidden group"
          >
            
            {/* Ambient Background glow reflecting state */}
            <div className="absolute inset-0 gold-glow-orb-sm opacity-50 pointer-events-none" />

            {/* Render Coffee Story */}
            {activeTab === 'coffee' && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center rounded-full bg-zinc-900/40 p-4 border border-white/5 overflow-hidden shadow-2xl">
                  
                  {coffeeStage === 0 && (
                    <div className="absolute inset-4 rounded-full border border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '30s' }}>
                      <div className="w-4 h-4 rounded-full bg-emerald-500 absolute top-2 left-10 blur-xs" />
                      <div className="w-3 h-3 rounded-full bg-emerald-600/80 absolute bottom-5 right-8" />
                    </div>
                  )}

                  {coffeeStage === 1 && (
                    <div className="absolute inset-4 rounded-full border border-dashed border-amber-800/40 animate-spin" style={{ animationDuration: '20s' }}>
                      <div className="w-4 h-4 rounded-full bg-amber-900 absolute top-4 right-12 blur-xs animate-pulse" />
                      <div className="w-5 h-5 rounded-full bg-yellow-950/90 absolute bottom-10 left-4" />
                    </div>
                  )}

                  {coffeeStage === 2 && (
                    <div className="absolute top-12 bottom-12 left-[50%] -translate-x-[50%] w-0.5 bg-gradient-to-b from-coffee to-transparent animate-pulse" />
                  )}

                  <img
                    src={
                      coffeeStage === 0 ? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=400' : // green beans
                      coffeeStage === 1 ? 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400' : // roasted rich beans
                      coffeeStage === 2 ? 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400' : // espresso pouring
                      'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400' // luxury cup
                    }
                    alt="Coffee Story Stage"
                    className="w-full h-full object-cover rounded-full mix-blend-lighten transition-transform duration-700 max-w-[200px] h-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">Stage {coffeeStage + 1} of 4</span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest">
                    {coffeeStage === 0 && 'I. Organic Mountain Cherries'}
                    {coffeeStage === 1 && 'II. Strict Thermal Crack Roasting'}
                    {coffeeStage === 2 && 'III. High-Pressure Golden Extraction'}
                    {coffeeStage === 3 && 'IV. Edible Saffron Gold Cup'}
                  </h3>
                  <p className="text-zinc-500 text-xs max-w-md mx-auto">
                    {coffeeStage === 0 && 'Handpicked at 2200m slopes in Yemen, only raw beans meeting our size 19 density index are signed and imported.'}
                    {coffeeStage === 1 && 'Fired using low nitrogen roasting air signature, neutralizing sour notes while caramelizing complex core fruit sugars.'}
                    {coffeeStage === 2 && 'Extracted at 93.5°C with pressure lines that pull maximum herbal essences into thick espresso oil.'}
                    {coffeeStage === 3 && 'Finished with premium organic saffron stems and 24-karat gold embellishments. Royal hospitality re-envisioned.'}
                  </p>
                </div>

              </div>
            )}

            {/* Render Sudan Bakery Story */}
            {activeTab === 'bakery' && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center rounded-sm bg-zinc-900/20 border border-white/5 p-4 shadow-2xl overflow-hidden animate-fade-in">
                  <img
                    src={
                      bakeryStage === 0 ? 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=400' : // Ghoriba cookies / flour
                      bakeryStage === 1 ? 'https://images.unsplash.com/photo-1548907040-4d42b52125f0?auto=format&fit=crop&q=80&w=400' : // rolling/dough/snack
                      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400' // fresh bread / Hoboz
                    }
                    alt="Bakery Story"
                    className="w-full h-full object-cover rounded-sm transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">Stage {bakeryStage + 1} of 3</span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest">
                    {bakeryStage === 0 && 'I. Natural Wild Ferment Culture'}
                    {bakeryStage === 1 && 'II. Traditional Kneading & Glazing'}
                    {bakeryStage === 2 && 'III. High-Heat Stone Deck Blistering'}
                  </h3>
                  <p className="text-zinc-500 text-xs max-w-sm mx-auto flex flex-col">
                    {bakeryStage === 0 && 'We cultivate our 8-year legacy sourdough strains to generate the distinct traditional aroma and fluffiness.'}
                    {bakeryStage === 1 && 'Each Sudanese Ghoriba cookie and Hoboz dough is kneaded with clarified ghee, spices, and fresh cardamoms.'}
                    {bakeryStage === 2 && 'Stone baking at 420°C triggers quick steam bubbles, generating perfectly blistered, elastic pocket bread.'}
                  </p>
                </div>

              </div>
            )}

            {/* Render Sudan Market Story */}
            {activeTab === 'market' && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center rounded-sm bg-zinc-900/20 border border-white/5 p-4 shadow-2xl overflow-hidden animate-fade-in">
                  <img
                    src={
                      marketStage === 0 ? 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400' : // Hibiscus / Karkadeh
                      marketStage === 1 ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' : // grains/market sorting
                      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=400' // spices/jars pack
                    }
                    alt="Market Story"
                    className="w-full h-full object-cover rounded-sm transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">Stage {marketStage + 1} of 3</span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest">
                    {marketStage === 0 && 'I. Organic Kordofan Calyces'}
                    {marketStage === 1 && 'II. Acacia Senegal Resin Sifting'}
                    {marketStage === 2 && 'III. Air-Tight Heritage Presentation'}
                  </h3>
                  <p className="text-zinc-500 text-xs max-w-sm mx-auto flex flex-col">
                    {marketStage === 0 && 'We select sun-dried burgundy hibiscus calyces prized across traditional hospitality gatherings.'}
                    {marketStage === 1 && 'Prism-like golden Gum Arabic crystals are cleared of bark and impurities to preserve full bio-activity.'}
                    {marketStage === 2 && 'All groceries are sealed inside hermetic containers to lock in complete nutritional excellence.'}
                  </p>
                </div>

              </div>
            )}

            {/* Render Sudan Fashion Story */}
            {activeTab === 'fashion' && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center rounded-sm bg-zinc-900/20 border border-white/5 p-4 shadow-2xl overflow-hidden animate-fade-in">
                  <img
                    src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400"
                    alt="Sudan Traditional Clothing"
                    className="w-full h-full object-cover rounded-sm transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">ZOAL ATELIER FASHION SHOWCASE</span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest">
                    Heritage Custom-Woven Toobs
                  </h3>
                  <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                    Merging fine long-staple cotton and gold silk fibers over slow two-week loom cycles to capture the evening lighting beautifully.
                  </p>
                </div>

              </div>
            )}

            {/* Render Pots Story */}
            {activeTab === 'pots' && (
              <div className="w-full flex flex-col items-center justify-center text-center space-y-6">
                
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center rounded-sm bg-zinc-900/20 border border-white/5 p-4 shadow-2xl overflow-hidden animate-fade-in">
                  <img
                    src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=400"
                    alt="Solid Oasis Sandstone Pots"
                    className="w-full h-full object-cover rounded-sm transition-transform duration-700 hover:scale-105"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-gold-pure font-mono">SANDSTONE & CERAMIC COLLECTION</span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest">
                    Carved Oasis Flower Pots
                  </h3>
                  <p className="text-zinc-500 text-xs max-w-sm mx-auto">
                    Individually carved sandstone containers showcasing organic geologic strata patterns paired with waterproof inner glazes.
                  </p>
                </div>

              </div>
            )}

          </motion.div>

          {/* Interactive Control Deck (Righthand Side - columns 8 to 12) */}
          <motion.div 
            initial={{ opacity: 0, x: 70 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-8 lg:pl-6"
          >
            
            <div>
              <span className="text-gold-pure text-[9px] uppercase tracking-widest block mb-1">ZOAL Standards</span>
              <h3 className="text-white text-xl sm:text-2xl font-display uppercase tracking-widest leading-snug">
                The Heritage Pipeline
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mt-4">
                We believe that true luxury lies in absolute transparency of craft. Select any category pillar, then toggle the sequence buttons below to watch the physical materials assemble into fine consumer art.
              </p>
            </div>

            {/* Interactive Control Toggles */}
            <div className="p-6 bg-black/60 border border-white/5 rounded-sm space-y-6">
              
              {activeTab === 'coffee' && (
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-400">Coffee Craft Controller</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 1, 2, 3].map((step) => (
                      <button
                        key={step}
                        onClick={() => setCoffeeStage(step)}
                        className={`py-3 text-[10px] uppercase tracking-widest font-mono text-center rounded-xs transition-all cursor-pointer ${
                          coffeeStage === step
                            ? 'bg-gold-pure text-black font-bold'
                            : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        S{step + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCoffeeStage((prev) => (prev + 1) % 4)}
                    className="w-full py-3.5 bg-white/5 hover:bg-gold-pure/10 text-white hover:text-gold-pure border border-white/5 hover:border-gold-pure/35 rounded-sm text-[10px] uppercase font-display tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Advance Stage</span>
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {activeTab === 'bakery' && (
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-400">Bakery Craft Controller</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((step) => (
                      <button
                        key={step}
                        onClick={() => setBakeryStage(step)}
                        className={`py-3 text-[10px] uppercase tracking-widest font-mono text-center rounded-xs transition-all cursor-pointer ${
                          bakeryStage === step
                            ? 'bg-gold-pure text-black font-bold'
                            : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        S{step + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setBakeryStage((prev) => (prev + 1) % 3)}
                    className="w-full py-3.5 bg-white/5 hover:bg-gold-pure/10 text-white hover:text-gold-pure border border-white/5 hover:border-gold-pure/35 rounded-sm text-[10px] uppercase font-display tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Blend & Fire</span>
                    <RefreshCw className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {activeTab === 'market' && (
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-widest text-zinc-400">Market Sifting Controller</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((step) => (
                      <button
                        key={step}
                        onClick={() => setMarketStage(step)}
                        className={`py-3 text-[10px] uppercase tracking-widest font-mono text-center rounded-xs transition-all cursor-pointer ${
                          marketStage === step
                            ? 'bg-gold-pure text-[#000000] font-bold'
                            : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        S{step + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setMarketStage((prev) => (prev + 1) % 3)}
                    className="w-full py-3.5 bg-white/5 hover:bg-gold-pure/10 text-white hover:text-gold-pure border border-white/5 hover:border-gold-pure/35 rounded-sm text-[10px] uppercase font-display tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Select Grade</span>
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {['fashion', 'pots'].includes(activeTab) && (
                <div className="p-4 border border-gold-pure/10 rounded-sm bg-gold-pure/5 text-center space-y-2 animate-fade-in">
                  <Sparkles className="w-5 h-5 text-gold-pure mx-auto animate-pulse" />
                  <p className="text-white text-[11px] font-display uppercase tracking-wider">Atelier Assembly Active</p>
                  <p className="text-zinc-500 text-[10px]">These collections are built in highly exclusive capsule counts, undergoing absolute inspection before client dispatch.</p>
                </div>
              )}

            </div>

          </motion.div>

        </div>

      </div>

    </div>
  );
}
