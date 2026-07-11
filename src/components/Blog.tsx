import React, { useState } from 'react';
import { Calendar, User, Clock, ArrowLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { ARTICLES } from '../data';
import { Article } from '../types';
import ScrollZoomImage from './ScrollZoomImage';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  if (selectedArticle) {
    return (
      <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <button
            onClick={() => {
              setSelectedArticle(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center space-x-2 rtl:space-x-reverse text-xs uppercase tracking-widest text-zinc-500 hover:text-gold-pure transition-colors duration-300 mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('blog.back', { defaultValue: 'Back to Editorials' })}</span>
          </button>

          {/* Core Content */}
          <article className="space-y-6">
            
            <div className="space-y-3">
              <span className="text-[10px] tracking-[0.25em] text-gold-pure font-display block uppercase">{selectedArticle.category}</span>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-wider font-display uppercase leading-tight">{i18n.language === 'ar' ? t(`articles.${selectedArticle.id}.title`, { defaultValue: selectedArticle.title }) : selectedArticle.title}</h1>
              
              <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-zinc-500 font-mono pt-3 border-b border-white/5 pb-4">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {selectedArticle.date}</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {t('blog.by', { defaultValue: 'By' })} {selectedArticle.author}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedArticle.readTime}</span>
              </div>
            </div>

            <div className="aspect-video leading-none overflow-hidden rounded-sm bg-zinc-950 border border-white/5">
              <SafeImage src={selectedArticle.image} alt={selectedArticle.title} className="w-full h-full object-cover" containerClassName="w-full h-full relative" />
            </div>

            <p className="text-zinc-300 text-xs sm:text-sm tracking-wider leading-relaxed whitespace-pre-wrap text-justify border-t border-white/5 pt-6 font-sans">
              {i18n.language === 'ar' ? t(`articles.${selectedArticle.id}.content`, { defaultValue: selectedArticle.content }) : selectedArticle.content}
            </p>

          </article>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-3">
            {t('blog.subtitle', { defaultValue: 'Editorial Curations' })}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-[0.25em] uppercase font-display">
            {t('blog.title', { defaultValue: 'The Journal' })}
          </h1>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
        </div>

        {/* Editorial Feed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ARTICLES.map((art) => (
            <div
              key={art.id}
              onClick={() => {
                setSelectedArticle(art);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-[#050505] p-5 border border-white/5 hover:border-gold-pure/20 rounded-sm flex flex-col justify-between cursor-pointer group transition-all duration-300"
            >
              
              <div className="space-y-4">
                <div className="aspect-[4/3] rounded-xs overflow-hidden bg-black h-48 relative">
                  <ScrollZoomImage
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                    containerClassName="w-full h-full overflow-hidden relative"
                  />
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-[#D4AF37] font-mono">{art.category}</span>
                  <h3 className="text-white text-xs font-display uppercase tracking-wider font-semibold mt-1 group-hover:text-gold-pure duration-300 leading-snug line-clamp-2">
                    {i18n.language === 'ar' ? t(`articles.${art.id}.title`, { defaultValue: art.title }) : art.title}
                  </h3>
                  <p className="text-zinc-500 text-[10.5px] mt-2 line-clamp-3">
                    {i18n.language === 'ar' ? t(`articles.${art.id}.excerpt`, { defaultValue: art.excerpt }) : art.excerpt}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center">
                <span className="text-zinc-650 text-[10px] font-mono">{art.readTime}</span>
                <span className="text-[9px] uppercase tracking-widest text-gold-pure group-hover:translate-x-1 rtl:group-hover:-translate-x-1 duration-300 flex items-center gap-1 font-display">
                  {t('blog.read_more', { defaultValue: 'Read Article' })} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
