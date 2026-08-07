import React from 'react';

interface PremiumBrandedLoaderProps {
  message?: string;
  fullScreen?: boolean;
  inline?: boolean;
}

export const PremiumBrandedLoader: React.FC<PremiumBrandedLoaderProps> = ({
  message = 'AL ZOAL PREPARING YOUR EXPERIENCE...',
  fullScreen = false,
  inline = false,
}) => {
  const content = (
    <div 
      className={`flex flex-col items-center justify-center p-6 space-y-5 animate-fade-in font-sans text-center select-none ${
        inline ? 'py-6' : fullScreen ? 'min-h-screen' : 'min-h-[50vh] py-16'
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Central Branded Ring Container */}
      <div className="relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20">
        {/* Outer subtle glow */}
        <div className="absolute inset-0 rounded-full bg-[#D4AF37]/10 blur-md animate-pulse"></div>
        
        {/* Outer spinning gold ring */}
        <div className="absolute inset-0 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] border-r-[#D4AF37]/60 rounded-full animate-spin"></div>
        
        {/* Inner spinning accent ring */}
        <div className="absolute inset-2 border border-[#D4AF37]/15 border-b-[#D4AF37] rounded-full animate-spin"></div>
        
        {/* Center ZOAL Logo Mark */}
        <div className="relative z-10 flex items-center justify-center">
          <span className="font-serif text-lg sm:text-xl font-bold tracking-widest text-[#D4AF37]">
            Z
          </span>
        </div>
      </div>

      {/* Branded Text & Message */}
      <div className="flex flex-col items-center space-y-1.5 max-w-xs sm:max-w-md">
        <span className="text-[11px] sm:text-[12px] font-serif tracking-[0.45em] text-white/90 uppercase font-semibold">
          AL ZOAL
        </span>
        <span className="text-[9px] sm:text-[10px] tracking-[0.35em] text-[#D4AF37]/90 uppercase font-mono animate-pulse">
          {message}
        </span>
      </div>

      {/* Subtle Bottom Gold Shimmer Bar */}
      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent animate-pulse mt-2"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 text-white backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};

export default PremiumBrandedLoader;
