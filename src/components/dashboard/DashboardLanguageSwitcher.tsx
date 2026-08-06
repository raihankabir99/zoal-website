import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';

export default function DashboardLanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAr = i18n.language === 'ar';

  const selectLanguage = (lang: 'en' | 'ar') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('zoal_language', lang);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-[26px] lg:h-[34px] px-2 lg:px-3.5 bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/50 active:border-[#D4AF37] text-zinc-300 hover:text-white rounded-xs text-[8.5px] lg:text-[10px] font-mono uppercase tracking-wide lg:tracking-[0.25em] font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1 lg:gap-2 select-none shadow-[0_2px_8px_rgba(0,0,0,0.5),0_0_8px_rgba(212,175,55,0.03)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.6),0_0_12px_rgba(212,175,55,0.08)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
        title={isAr ? 'تغيير اللغة' : 'Switch Language'}
        aria-expanded={isOpen}
      >
        <span className="text-[#D4AF37]">
          {isAr ? 'العربية' : 'English'}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#D4AF37] transition-transform duration-300 ease-out ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-950/95 backdrop-blur-xl border border-[#D4AF37]/30 shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.08)] rounded-xs p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => selectLanguage('en')}
            className={`w-full text-left px-2.5 py-2 rounded-xs text-xs font-mono tracking-wider flex items-center justify-between transition-all cursor-pointer ${
              !isAr
                ? 'bg-gradient-to-r from-[#D4AF37]/18 to-transparent border border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.15)] text-[#D4AF37] font-semibold'
                : 'text-zinc-300 hover:bg-zinc-900 border border-transparent hover:border-white/10'
            }`}
          >
            <span>English</span>
            {!isAr && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </button>

          <button
            type="button"
            onClick={() => selectLanguage('ar')}
            className={`w-full text-left px-2.5 py-2 rounded-xs text-xs font-mono tracking-wider flex items-center justify-between transition-all cursor-pointer mt-0.5 ${
              isAr
                ? 'bg-gradient-to-r from-[#D4AF37]/18 to-transparent border border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.15)] text-[#D4AF37] font-semibold'
                : 'text-zinc-300 hover:bg-zinc-900 border border-transparent hover:border-white/10'
            }`}
          >
            <span>العربية</span>
            {isAr && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
          </button>
        </div>
      )}
    </div>
  );
}
