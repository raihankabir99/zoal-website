import React, { useState } from 'react';
import { MapPin, Clock, Phone, Sparkles, Navigation, Globe } from 'lucide-react';
import { BRANCHES } from '../data';

export default function Branches() {
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            Physical Showrooms
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display">
            The Hub Network
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Branch list (columns 1 to 5) */}
          <div className="lg:col-span-5 space-y-4">
            {BRANCHES.map((branch) => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranch(branch)}
                className={`w-full text-left p-6 border rounded-sm transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  selectedBranch.id === branch.id
                    ? 'border-gold-pure bg-gold-pure/5 shadow-[0_0_15px_rgba(212,175,55,0.08)]'
                    : 'border-white/5 bg-[#050505] hover:border-white/10'
                }`}
              >
                <div>
                  <h3 className="text-white text-xs font-display uppercase tracking-wider font-semibold">
                    {branch.name}
                  </h3>
                  <p className="text-zinc-500 text-[10.5px] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gold-pure" /> {branch.address}
                  </p>
                </div>

                <div className="border-t border-white/5 pt-4 mt-4 space-y-2 text-xs font-sans">
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gold-pure/60" /> {branch.phone}
                  </p>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gold-pure/60" /> {branch.hours}
                  </p>
                </div>

              </button>
            ))}
          </div>

          {/* Map Viewer Platform (columns 6 to 12) */}
          <div className="lg:col-span-7 bg-zinc-950 border border-white/5 rounded-sm overflow-hidden p-6 space-y-6">
            
            {/* Simulation of a top-tier luxury GIS map */}
            <div className="relative aspect-video rounded-sm overflow-hidden border border-white/10 bg-[#0c0c0c] flex items-center justify-center p-4">
              
              {/* Complex Vector representation for luxury cartography */}
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 text-center space-y-3">
                <MapPin className="w-8 h-8 text-gold-pure animate-bounce mx-auto" />
                <h4 className="text-white text-xs font-display uppercase tracking-widest">{selectedBranch.name} Maps Position</h4>
                <p className="text-zinc-500 text-[10.5px] max-w-sm font-sans mx-auto">
                  Latitude: {selectedBranch.coordinates.lat} · Longitude: {selectedBranch.coordinates.lng} <br />
                  Al Hofuf Oasis Precinct, Al Ahsa, Saudi Arabia
                </p>
                
                <button
                  onClick={() => {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${selectedBranch.coordinates.lat},${selectedBranch.coordinates.lng}`, '_blank');
                  }}
                  className="px-6 py-2.5 bg-[#0a0a0a] border border-gold-pure/25 hover:border-gold-pure text-gold-pure font-display font-medium text-[9px] uppercase tracking-widest rounded-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate on Google Maps
                </button>
              </div>

              {/* Decorative side coordinates details */}
              <div className="absolute bottom-3 left-3 text-[8px] font-mono text-zinc-500 tracking-widest uppercase">
                GIS COORDINATES SYSTEMS v1.0
              </div>

            </div>

            <div className="space-y-4">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-display block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Outfitting Particulars
              </span>
              <p className="text-zinc-400 text-xs leading-relaxed">
                {selectedBranch.description}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
