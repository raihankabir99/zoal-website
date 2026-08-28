import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { SafeImage } from '../imageRegistry';
import { BusinessCategory } from '../types';

interface ScrolltellingProps {
  setCurrentPage?: (page: string) => void;
  setSelectedCategoryFilter?: (category: string) => void;
}

const DEFAULT_EDITORIAL_BLOCKS = [
  {
    id: 'edit-1',
    slug: 'coffee-ritual',
    title: 'The Coffee Sanctuary',
    title_ar: 'ملاذ القهوة المختصة',
    subtitle: 'Specialty Roasts & Golden Saffron',
    subtitle_ar: 'محامص مختصة وزعفران ذهبي',
    description: 'Immerse in single-origin infusions and slow-dripped master extractions.',
    description_ar: 'انغمس في نقع حبوب البن أحادية المصدر وعمليات الاستخلاص البطيئة المتقنة.',
    desktop_image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1200',
    category: 'coffee',
    category_ar: 'القهوة',
    status: 'published',
    animation_type: 'fade-up',
    button_text: 'Explore Collection',
    button_text_ar: 'اكتشف المجموعة'
  },
  {
    id: 'edit-2',
    slug: 'artisan-bakery',
    title: 'Artisanal Bakery & Heritage',
    title_ar: 'مخبزنا الحرفي العريق',
    subtitle: 'Fresh Hoboz & Ghoriba',
    subtitle_ar: 'خبز طازج وغريبة هشة',
    description: 'Stone-fired flatbreads and delicate sand-melt butter cookies.',
    description_ar: 'مخبوزات مستوية على الحجر وحلويات تذوب في الفم بلطف الرمل والزبدة.',
    desktop_image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200',
    category: 'bakery',
    category_ar: 'المخبوزات',
    status: 'published',
    animation_type: 'slide-left',
    button_text: 'Explore Collection',
    button_text_ar: 'اكتشف المجموعة'
  },
  {
    id: 'edit-3',
    slug: 'mens-thobes',
    title: 'Royal Thobes & Attire',
    title_ar: 'أثواب الأزياء الملكية',
    subtitle: 'Crafted Elegance',
    subtitle_ar: 'أناقة الأثواب الفاخرة',
    description: 'Traditional Sudanese tailoring with modern luxury silhouettes.',
    description_ar: 'التفصيل السوداني التقليدي الفاخر بلمسات وتصاميم عصرية راقية.',
    desktop_image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=1200',
    category: 'thobes',
    category_ar: 'أثواب',
    status: 'published',
    animation_type: 'zoom-in',
    button_text: 'EXPLORE COLLECTION',
    button_text_ar: 'اكتشف المجموعة'
  }
];

// Memory cache for current session to avoid repeated fallback rendering on navigation
let IN_MEMORY_EDITORIAL_CACHE: any[] | null = null;
let ACTIVE_EDITORIAL_FETCH_PROMISE: Promise<any[]> | null = null;

const getInitialEditorialBlocks = (): any[] => {
  // Priority 1: Session memory cache
  if (IN_MEMORY_EDITORIAL_CACHE && IN_MEMORY_EDITORIAL_CACHE.length > 0) {
    return IN_MEMORY_EDITORIAL_CACHE;
  }
  
  // Priority 2: Local storage with schema validation
  try {
    const cached = localStorage.getItem('zoal_offline_editorial_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated = parsed.filter((b: any) => b && b.status === 'published' && b.desktop_image);
        if (validated.length > 0) {
          IN_MEMORY_EDITORIAL_CACHE = validated;
          return validated;
        }
      }
    }
  } catch (e) {
    console.warn('[Scrolltelling] Failed parsing local storage cache:', e);
  }

  // Priority 3: Fallback hardcoded defaults
  return DEFAULT_EDITORIAL_BLOCKS;
};

const isEditorialDataEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    const a = arr1[i];
    const b = arr2[i];
    if (!a || !b) return false;
    if (
      a.id !== b.id ||
      a.slug !== b.slug ||
      a.title !== b.title ||
      a.title_ar !== b.title_ar ||
      a.subtitle !== b.subtitle ||
      a.subtitle_ar !== b.subtitle_ar ||
      a.description !== b.description ||
      a.description_ar !== b.description_ar ||
      a.desktop_image !== b.desktop_image ||
      a.mobile_image !== b.mobile_image ||
      a.category !== b.category ||
      a.category_ar !== b.category_ar ||
      a.status !== b.status ||
      a.animation_type !== b.animation_type ||
      a.button_text !== b.button_text ||
      a.button_text_ar !== b.button_text_ar ||
      a.display_order !== b.display_order ||
      a.updated_at !== b.updated_at
    ) {
      return false;
    }
  }
  return true;
};

const fetchEditorialBlocksData = (): Promise<any[]> => {
  if (ACTIVE_EDITORIAL_FETCH_PROMISE) {
    return ACTIVE_EDITORIAL_FETCH_PROMISE;
  }
  ACTIVE_EDITORIAL_FETCH_PROMISE = fetch('/api/homepage-editorial')
    .then(async res => {
      if (!res.ok) throw new Error('Failed to fetch');
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return res.json();
      }
      throw new Error('Response is not JSON');
    })
    .then(data => {
      ACTIVE_EDITORIAL_FETCH_PROMISE = null;
      return Array.isArray(data) ? data : [];
    })
    .catch(err => {
      ACTIVE_EDITORIAL_FETCH_PROMISE = null;
      throw err;
    });
  return ACTIVE_EDITORIAL_FETCH_PROMISE;
};

const cardVariants = {
  hidden: (animationType: string) => {
    const type = animationType || 'fade-up';
    switch (type) {
      case 'fade-in':
        return { opacity: 0 };
      case 'slide-left':
        return { opacity: 0, x: -50 };
      case 'slide-right':
        return { opacity: 0, x: 50 };
      case 'zoom-in':
        return { opacity: 0, scale: 0.96 };
      case 'fade-up':
      default:
        return { opacity: 0, y: 60 };
    }
  },
  visible: (animationType: string) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1
  })
};

export default function Scrolltelling({ setCurrentPage, setSelectedCategoryFilter }: ScrolltellingProps) {
  const renderTime = performance.now();
  console.count("[Audit] Editorial render");
  console.log(`[Audit] Editorial (Scrolltelling) rendering. time: ${renderTime.toFixed(2)}ms`);

  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<any[]>(getInitialEditorialBlocks);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    let isMounted = true;

    const preloadImageWithDecode = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        if (img.complete) {
          if (typeof img.decode === 'function') {
            img.decode()
              .then(() => resolve())
              .catch(() => resolve());
          } else {
            resolve();
          }
        } else {
          img.onload = () => {
            if (typeof img.decode === 'function') {
              img.decode()
                .then(() => resolve())
                .catch(() => resolve());
            } else {
              resolve();
            }
          };
          img.onerror = () => resolve();
        }
      });
    };

    fetchEditorialBlocksData()
      .then(data => {
        if (!isMounted) return;

        const published = data.filter((b: any) => b && b.status === 'published' && b.desktop_image);
        
        if (published.length > 0) {
          setCategories(prev => {
            if (isEditorialDataEqual(prev, published)) {
              return prev;
            }
            IN_MEMORY_EDITORIAL_CACHE = published;
            try {
              localStorage.setItem('zoal_offline_editorial_cache', JSON.stringify(published));
            } catch {}
            return published;
          });
          
          // Preload images in background silently with decode
          const newImages = published.map((item: any) => item.desktop_image).filter(Boolean);
          newImages.forEach(url => preloadImageWithDecode(url));
        }
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.warn('Error loading editorial blocks, recovering from offline cache:', err);
        try {
          const cached = localStorage.getItem('zoal_offline_editorial_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const validated = parsed.filter((b: any) => b && b.status === 'published' && b.desktop_image);
              if (validated.length > 0) {
                setCategories(prev => {
                  if (isEditorialDataEqual(prev, validated)) return prev;
                  return validated;
                });
              }
            }
          }
        } catch {}
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (category: string) => {
    if (setSelectedCategoryFilter) {
      setSelectedCategoryFilter(category);
    }
    if (setCurrentPage) {
      setCurrentPage('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return null;

  return (
    <div id="scrollstory-anchor" className="relative bg-black py-12 sm:py-24 border-t border-b border-white/5 overflow-hidden">
      
      {/* Decorative large branding backdrops */}
      <div className="absolute right-[-10%] top-[10%] text-[15vw] font-display font-extrabold text-white/[0.01] pointer-events-none select-none tracking-widest">
        {t('home.scroll.bg_heritage')}
      </div>
      <div className="absolute left-[-5%] bottom-[5%] text-[15vw] font-display font-extrabold text-gold-pure/[0.01] pointer-events-none select-none tracking-widest">
        {t('home.scroll.bg_brand')}
      </div>

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        
        {/* Editorial Heading */}
        <div 
          className="text-center mb-10 sm:mb-24 px-4 sm:px-0"
        >
          <p className="text-gold-pure text-[10px] tracking-[0.40em] uppercase font-display mb-3">
            {t('home.scroll.eyebrow')}
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-[0.25em] text-white font-display uppercase font-semibold">
            {t('home.scroll.heading')}
          </h2>
          <div className="w-12 h-[1px] bg-gold-pure mx-auto mt-4" />
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-3">
            {t('home.scroll.subheading')}
          </p>
        </div>

        {/* Categories Single Scroll Stack with Generous Editorial Spacing */}
        <div className="space-y-12 sm:space-y-20 md:space-y-[180px] max-w-6xl mx-auto">
          {categories.map((item, index) => {
            const isEven = index % 2 === 0;
            const isAr = i18n.language === 'ar';
            
            return (
              <motion.div
                key={item.slug || item.id}
                id={`editorial-${item.slug}`}
                custom={item.animation_type}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.12
                }}
                className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 md:gap-16 lg:gap-24 items-center"
              >
                {/* Image Showcase Box */}
                <div className={`md:col-span-7 ${!isEven ? 'md:order-last' : ''} w-full`}>
                  <div className={`relative w-screen md:w-full left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 rounded-sm overflow-hidden border border-white/5 bg-[#000] group aspect-[16/10] sm:aspect-[4/3]`}>
                    <SafeImage
                      src={item.desktop_image}
                      alt={isAr ? item.title_ar || item.title : item.title}
                      className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                      category={item.category as BusinessCategory}
                      forceCover={true}
                      priority={index === 0}
                    />
                    {/* Shadow overlay vignette */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                </div>

                {/* Text Editorial Box */}
                <div className="md:col-span-5 flex flex-col justify-center space-y-3 sm:space-y-4 text-center md:text-left px-4 sm:px-0">
                  <span className="text-gold-pure text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase block">
                    {isAr ? item.category_ar || item.category : item.category}
                  </span>
                  
                  <h3 className="text-white text-xl sm:text-2xl lg:text-3xl font-display uppercase tracking-widest font-semibold leading-tight">
                    {isAr ? item.title_ar || item.title : item.title}
                  </h3>
                  
                  <p className="text-zinc-400 text-xs sm:text-sm font-sans font-light leading-relaxed tracking-wider max-w-full md:max-w-md mx-auto md:mx-0">
                    {isAr ? item.description_ar || item.description : item.description}
                  </p>

                  <div className="pt-2 sm:pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategoryClick(item.category)}
                      className="cursor-pointer inline-flex items-center space-x-2 border border-white/15 hover:border-gold-pure/60 bg-transparent hover:bg-gold-pure/5 hover:text-gold-pure text-white text-[10px] sm:text-[11px] uppercase font-mono tracking-widest px-5 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 rounded-xs group focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gold-pure/50"
                    >
                      <span>
                        {isAr 
                          ? (item.button_text_ar || item.button_text || 'اكتشف المجموعة') 
                          : ((item.category === 'thobes' || item.slug === 'mens-thobes' || (item.button_text && item.button_text.toUpperCase().includes('THOBES'))) 
                              ? 'EXPLORE COLLECTION' 
                              : (item.button_text || 'EXPLORE COLLECTION'))}
                      </span>
                      <span className="transform transition-transform duration-300 group-hover:translate-x-1 font-sans rtl:rotate-180 rtl:group-hover:-translate-x-1">→</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
