import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, MapPin, Coffee, Shirt, Home, Cookie, Cake, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';
import { BusinessCategory } from '../types';
import { supabaseClient } from '../lib/supabaseClient';

const OUR_SPACE_STATIC = {
  coffee: '/assets/our-space/coffee.webp',
  bakery: '/assets/our-space/bakery.webp',
  market: '/assets/our-space/market.webp',
  fashion: '/assets/our-space/premium.webp',
  thobes: '/assets/our-space/thobes.webp',
};

const ThobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 2h10l3 7h-3v13H7V9H4z" />
    <path d="M12 2v6" />
  </svg>
);

interface HeroProps {
  setCurrentPage: (page: string) => void;
  setSelectedCategoryFilter?: (cat: string) => void;
}

const STATIC_HERO_SLIDES = [
  {
    id: 'static-1',
    title: 'Heritage in every thread',
    subtitle: 'PREMIUM SUDANESE ATTIRE',
    desc: 'Experience the fusion of tradition and luxury with our handcrafted thobes and formal menswear collections.',
    hero_image_desktop: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=2000',
    hero_image_mobile: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800',
    category: 'thobes',
    button_text: 'Explore Collection'
  },
  {
    id: 'static-2',
    title: 'Artisanal Coffee & Roasts',
    subtitle: 'SPECIALTY GRADES',
    desc: 'Savor single-origin specialty coffees and golden saffron infusions roasted to absolute perfection.',
    hero_image_desktop: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=2000',
    hero_image_mobile: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
    category: 'coffee',
    button_text: 'Explore Coffee'
  }
];

let GLOBAL_HERO_SLIDES_CACHE: any[] | null = null;
try {
  const cached = localStorage.getItem('zoal_offline_heroes_cache');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.length > 0) {
      GLOBAL_HERO_SLIDES_CACHE = parsed;
    }
  }
} catch {}
if (!GLOBAL_HERO_SLIDES_CACHE) {
  GLOBAL_HERO_SLIDES_CACHE = STATIC_HERO_SLIDES;
  try {
    localStorage.setItem('zoal_offline_heroes_cache', JSON.stringify(STATIC_HERO_SLIDES));
  } catch {}
}

const getInitialHeroSlides = () => GLOBAL_HERO_SLIDES_CACHE || STATIC_HERO_SLIDES;

export default React.memo(function Hero({ setCurrentPage, setSelectedCategoryFilter }: HeroProps) {
  const renderTime = performance.now();
  console.count("[Audit] Hero render");
  console.log(`[Audit] Hero rendering. time: ${renderTime.toFixed(2)}ms`);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { t, i18n } = useTranslation();
  const [dbSlides, setDbSlides] = useState<any[]>(() => {
    const initial = getInitialHeroSlides();
    console.log(`[Audit] Hero initializing with ${initial.length} slides at ${performance.now().toFixed(2)}ms`);
    return initial;
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  // Carousel configuration settings
  const [carouselSettings, setCarouselSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('zoal_hero_carousel_settings');
      return saved ? JSON.parse(saved) : {
        autoplay: true,
        duration: 6, // seconds
        loop: true,
        effect: 'fade', // 'fade' | 'slide' | 'zoom'
        speed: 1000 // ms
      };
    } catch {
      return { autoplay: true, duration: 6, loop: true, effect: 'fade', speed: 1000 };
    }
  });

  const [loadAllSlides, setLoadAllSlides] = useState(false);

  useEffect(() => {
    // Defer rendering of secondary slides to guarantee zero network competition during initial paint
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const id = window.requestIdleCallback(() => setLoadAllSlides(true));
        return () => window.cancelIdleCallback(id);
      } else {
        const id = setTimeout(() => setLoadAllSlides(true), 1500);
        return () => clearTimeout(id);
      }
    }
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const saved = localStorage.getItem('zoal_hero_carousel_settings');
        if (saved) setCarouselSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading carousel settings:', e);
      }
    };
    window.addEventListener('zoal_hero_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('zoal_hero_settings_updated', handleSettingsUpdate);
  }, []);

  // Responsive logic to select between Desktop -> hero_image_desktop and Mobile -> hero_image_mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640); // 640px is Tailwind's sm breakpoint
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [realtimeLatency, setRealtimeLatency] = useState<number | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('connected');

  useEffect(() => {
    const preloadImage = (url: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    };

    const loadHeroes = (isRealtime = false) => {
      const startTime = performance.now();
      fetch('/api/homepage-heroes')
        .then(async (res) => {
          console.log(`[Audit] Hero CMS fetch started at ${performance.now().toFixed(2)}ms`);
          if (!res.ok) throw new Error('Failed to fetch');
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return res.json();
          }
          throw new Error('Response is not JSON');
        })
        .then((data) => {
          if (!Array.isArray(data)) data = [];
          const endTime = performance.now();
          console.log(`[Audit] Hero CMS data received. count: ${data.length}, time: ${endTime.toFixed(2)}ms`);
          if (isRealtime) {
            const latency = Math.round(endTime - startTime);
            setRealtimeLatency(latency);
            setRealtimeStatus('connected');
            console.log(`[Realtime Hero] Instant update received from Supabase. Propagation latency: ${latency}ms`);
          }

          const now = new Date();
          // Only active, non-future, and non-expired Hero appears.
          const activeHeroes = data.filter((h: any) => {
            if (!h.active) return false;
            
            if (h.start_date) {
              const start = new Date(h.start_date);
              if (!isNaN(start.getTime()) && start > now) {
                return false; // Future Hero: automatically inactive
              }
            }
            
            if (h.end_date) {
              let end = new Date(h.end_date);
              if (h.end_date.length === 10) {
                // YYYY-MM-DD format: treat as end of day
                end = new Date(`${h.end_date}T23:59:59.999`);
              }
              if (!isNaN(end.getTime()) && end < now) {
                return false; // Expired Hero: automatically deactivated
              }
            }
            
            return true;
          });
          
          // Automatically sort by priority (descending, higher first) and display_order (ascending)
          activeHeroes.sort((a: any, b: any) => {
            const pA = a.priority ?? 0;
            const pB = b.priority ?? 0;
            if (pA !== pB) {
              return pB - pA; // highest priority first
            }
            const dA = a.display_order ?? 0;
            const dB = b.display_order ?? 0;
            return dA - dB; // lowest display order index first
          });

          if (activeHeroes.length > 0) {
            GLOBAL_HERO_SLIDES_CACHE = activeHeroes;
            const currentIsMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : isMobile;
            
            setDbSlides((currentSlides) => {
              const oldImages = currentSlides.map(h => {
                return currentIsMobile
                  ? (h.hero_image_mobile && h.hero_image_mobile.trim() ? h.hero_image_mobile : h.hero_image_desktop)
                  : (h.hero_image_desktop && h.hero_image_desktop.trim() ? h.hero_image_desktop : h.hero_image_mobile);
              }).filter(Boolean);
              
              const newImages = activeHeroes.map(h => {
                return currentIsMobile
                  ? (h.hero_image_mobile && h.hero_image_mobile.trim() ? h.hero_image_mobile : h.hero_image_desktop)
                  : (h.hero_image_desktop && h.hero_image_desktop.trim() ? h.hero_image_desktop : h.hero_image_mobile);
              }).filter(Boolean);
              
              const hasChanged = currentSlides.length === 0 || JSON.stringify(oldImages) !== JSON.stringify(newImages);
              
              if (hasChanged && currentSlides.length > 0) {
                // Silently preload new images in the background, then update state
                Promise.all(newImages.map(url => preloadImage(url))).then(() => {
                  setDbSlides(activeHeroes);
                  try {
                    localStorage.setItem('zoal_offline_heroes_cache', JSON.stringify(activeHeroes));
                  } catch {}
                });
                return currentSlides; // Keep current slides visible without flashing
              } else {
                try {
                  localStorage.setItem('zoal_offline_heroes_cache', JSON.stringify(activeHeroes));
                } catch {}
                return hasChanged ? activeHeroes : currentSlides;
              }
            });
          }
        })
        .catch((err) => {
          console.warn('Error fetching homepage heroes, recovering from offline cache:', err);
          setRealtimeStatus('offline-recovery');
          try {
            const cached = localStorage.getItem('zoal_offline_heroes_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && parsed.length > 0) {
                setDbSlides(parsed);
              }
            }
          } catch {}
        });
    };

    // Initial load
    loadHeroes(false);

    // Supabase Realtime Channel Subscription for zoal_homepage_heroes
    const channel = supabaseClient
      .channel('zoal_homepage_heroes_realtime_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_homepage_heroes' },
        (payload) => {
          console.log('[Supabase Realtime] Hero table mutation detected:', payload);
          loadHeroes(true);
        }
      )
      .subscribe((status) => {
        console.log('[Supabase Realtime] Channel status:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('reconnecting');
        }
      });

    // Cross-tab and manual synchronization listeners
    const handleCustomUpdate = () => loadHeroes(true);
    window.addEventListener('zoal_hero_settings_updated', handleCustomUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'zoal_hero_last_update') {
        loadHeroes(true);
      }
    });

    return () => {
      supabaseClient.removeChannel(channel);
      window.removeEventListener('zoal_hero_settings_updated', handleCustomUpdate);
    };
  }, []);

  const isAr = i18n.language === 'ar';

  const slides = dbSlides.length > 0
    ? dbSlides.map((h) => {
        // Localization Switch with Fallback-Only-If-Translation-Missing (Prevents cross-language leakage)
        const rawTitle = isAr
          ? (h.hero_title_ar && h.hero_title_ar.trim() ? h.hero_title_ar : h.hero_title)
          : (h.hero_title && h.hero_title.trim() ? h.hero_title : h.hero_title_ar);

        const titleParts = (rawTitle || '').split('|');

        const tag = isAr
          ? (h.hero_subtitle_ar && h.hero_subtitle_ar.trim() ? h.hero_subtitle_ar : h.hero_subtitle)
          : (h.hero_subtitle && h.hero_subtitle.trim() ? h.hero_subtitle : h.hero_subtitle_ar);

        const subtitle = isAr
          ? (h.hero_description_ar && h.hero_description_ar.trim() ? h.hero_description_ar : h.hero_description)
          : (h.hero_description && h.hero_description.trim() ? h.hero_description : h.hero_description_ar);

        const cta_text = isAr
          ? (h.cta_text_ar && h.cta_text_ar.trim() ? h.cta_text_ar : h.cta_text)
          : (h.cta_text && h.cta_text.trim() ? h.cta_text : h.cta_text_ar);

        // Device specific image switching:
        // Desktop Device: Prefer hero_image_desktop, fallback to hero_image_mobile.
        // Mobile Device: Prefer hero_image_mobile, fallback to hero_image_desktop.
        const img = isMobile
          ? (h.hero_image_mobile && h.hero_image_mobile.trim() ? h.hero_image_mobile : h.hero_image_desktop)
          : (h.hero_image_desktop && h.hero_image_desktop.trim() ? h.hero_image_desktop : h.hero_image_mobile);

        return {
          line1: titleParts[0] || '',
          line2: titleParts[1] || '',
          line3: titleParts[2] || '',
          line4: titleParts[3] || '',
          tag: tag,
          subtitle: subtitle,
          img: img,
          cta_text: cta_text,
          cta_link: h.cta_link || 'store',
        };
      })
    : [
        {
          line1: t('home.hero.line1_1'),
          line2: t('home.hero.line1_2'),
          line3: t('home.hero.line1_3'),
          line4: '',
          tag: t('home.hero.tag1'),
          subtitle: t('home.hero.sub1'),
          img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1600',
          cta_text: t('home.hero.shop_button'),
          cta_link: 'store',
        },
        {
          line1: t('home.hero.line2_1'),
          line2: t('home.hero.line2_2'),
          line3: t('home.hero.line2_3'),
          line4: '',
          tag: t('home.hero.tag2'),
          subtitle: t('home.hero.sub2'),
          img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1600',
          cta_text: t('home.hero.shop_button'),
          cta_link: 'store',
        },
        {
          line1: t('home.hero.line3_1'),
          line2: t('home.hero.line3_2'),
          line3: t('home.hero.line3_3'),
          line4: t('home.hero.line3_4'),
          tag: t('home.hero.tag3'),
          subtitle: t('home.hero.sub3'),
          img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600',
          cta_text: t('home.hero.shop_button'),
          cta_link: 'store',
        },
      ];

  // Reactively synchronize Browser SEO Title, Description, OpenGraph, Twitter, hreflang, and JSON-LD tags
  useEffect(() => {
    if (slides.length === 0 || activeSlide >= slides.length) return;

    let seoTitle = '';
    let seoDesc = '';
    let ogImg = '';
    let twitterImg = '';
    let canonicalUrl = '';
    let jsonLdRaw = '';
    
    const currentRawHero = dbSlides.length > 0 ? dbSlides[activeSlide] : null;

    const makeAbsolute = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return window.location.origin + url;
    };

    if (currentRawHero) {
      seoTitle = isAr
        ? (currentRawHero.seo_title_ar && currentRawHero.seo_title_ar.trim() ? currentRawHero.seo_title_ar : currentRawHero.seo_title)
        : (currentRawHero.seo_title && currentRawHero.seo_title.trim() ? currentRawHero.seo_title : currentRawHero.seo_title_ar);

      seoDesc = isAr
        ? (currentRawHero.seo_description_ar && currentRawHero.seo_description_ar.trim() ? currentRawHero.seo_description_ar : currentRawHero.seo_description)
        : (currentRawHero.seo_description && currentRawHero.seo_description.trim() ? currentRawHero.seo_description : currentRawHero.seo_description_ar);

      ogImg = isAr
        ? (currentRawHero.seo_og_image_ar && currentRawHero.seo_og_image_ar.trim() ? currentRawHero.seo_og_image_ar : currentRawHero.seo_og_image)
        : (currentRawHero.seo_og_image && currentRawHero.seo_og_image.trim() ? currentRawHero.seo_og_image : currentRawHero.seo_og_image_ar);

      if (!ogImg) {
        ogImg = isAr
          ? (currentRawHero.hero_image_mobile || currentRawHero.hero_image_desktop)
          : (currentRawHero.hero_image_desktop || currentRawHero.hero_image_mobile);
      }

      twitterImg = isAr
        ? (currentRawHero.seo_twitter_image_ar && currentRawHero.seo_twitter_image_ar.trim() ? currentRawHero.seo_twitter_image_ar : currentRawHero.seo_twitter_image)
        : (currentRawHero.seo_twitter_image && currentRawHero.seo_twitter_image.trim() ? currentRawHero.seo_twitter_image : currentRawHero.seo_twitter_image_ar);

      canonicalUrl = currentRawHero.seo_canonical_url || '';
      jsonLdRaw = currentRawHero.seo_json_ld || '';
    } else {
      // Hardcoded fallback sliders translated SEO content (no leakage)
      const defaultSeoTitles = isAr
        ? [
            'الزول الراقي | مجموعة أزياء الرجال الفاخرة',
            'الزول الراقي | قهوة مختصة سودانية أصيلة',
            'الزول الراقي | فخامة التصاميم والديكورات العريقة',
          ]
        : [
            'Al Zoal Al Raqi | Premium Traditional Menswear',
            'Al Zoal Al Raqi | Specialty Sudanese Coffee Beans',
            'Al Zoal Al Raqi | Bespoke Interior Designs & Decor',
          ];

      const defaultSeoDescs = isAr
        ? [
            'اكتشف أفخم الأثواب والعبايات والملابس الرجالية المطرزة بدقة وجودة عالية في الخرطوم ولندن.',
            'تذوق القهوة السودانية المختصة الفاخرة من حبوب البن المحمصة بعناية وبطابع تقليدي عريق.',
            'ديكورات ومساحات فخمة تجمع بين التراث السوداني الأصيل والحداثة العالمية المبهرة.',
          ]
        : [
            'Explore fine bespoke thobes, handcrafted apparel, and premium menswear representing Sudanese dignity.',
            'Indulge in authentic specialty coffee crafted with absolute passion and roasted to perfection.',
            'Experience handpicked artisan products and luxury interior aesthetics inspired by heritage.',
          ];

      seoTitle = defaultSeoTitles[activeSlide] || '';
      seoDesc = defaultSeoDescs[activeSlide] || '';
    }

    // 1. Title tag
    /*
    if (seoTitle) {
      document.title = seoTitle;
    } else {
      document.title = isAr ? 'الزول الراقي | فخامة الأزياء الرجالية والقهوة' : 'Al Zoal Al Raqi | Luxury Menswear & Coffee';
    }
    */

    // Helper functions for meta tags and links
    const setMetaTag = (propertyOrName: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${propertyOrName}"]` : `meta[name="${propertyOrName}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(isProperty ? 'property' : 'name', propertyOrName);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (hreflang) el.setAttribute('hreflang', hreflang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // 2. Standard Meta Description tag
    const finalDesc = seoDesc || (isAr ? 'أثواب رجالية فاخرة، عطور شرقية، ومساحات قهوة مختصة متميزة.' : 'Luxury bespoke thobes, oriental fragrances, and premium specialty coffee.');
    setMetaTag('description', finalDesc, false);

    // 3. OpenGraph Tags
    const resolvedOgImg = makeAbsolute(ogImg || 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1600');
    setMetaTag('og:title', document.title);
    setMetaTag('og:description', finalDesc);
    setMetaTag('og:image', resolvedOgImg);
    setMetaTag('og:type', 'website');
    setMetaTag('og:url', canonicalUrl || window.location.href);

    // 4. Twitter Card Tags
    const resolvedTwitterImg = makeAbsolute(twitterImg || resolvedOgImg);
    setMetaTag('twitter:card', 'summary_large_image', false);
    setMetaTag('twitter:title', document.title, false);
    setMetaTag('twitter:description', finalDesc, false);
    setMetaTag('twitter:image', resolvedTwitterImg, false);

    // 5. Canonical link tag
    const finalCanonicalUrl = canonicalUrl || (window.location.origin + (isAr ? '/?lng=ar' : '/?lng=en'));
    setLinkTag('canonical', finalCanonicalUrl);

    // 6. Dynamic alternate hreflangs
    setLinkTag('alternate', window.location.origin + '/?lng=en', 'en');
    setLinkTag('alternate', window.location.origin + '/?lng=ar', 'ar');
    setLinkTag('alternate', window.location.origin + '/', 'x-default');

    // 7. Structured JSON-LD Data Schema
    let jsonLdObj: any = null;
    if (jsonLdRaw) {
      try {
        jsonLdObj = JSON.parse(jsonLdRaw);
      } catch (e) {
        console.warn('Failed to parse custom SEO JSON-LD schema:', e);
      }
    }

    if (!jsonLdObj) {
      const isFashion = activeSlide === 0;
      const isCoffee = activeSlide === 1;
      jsonLdObj = {
        "@context": "https://schema.org",
        "@type": isFashion ? "Store" : isCoffee ? "Cafe" : "LocalBusiness",
        "name": isAr ? "الزول الراقي" : "Al Zoal Al Raqi",
        "description": finalDesc,
        "url": finalCanonicalUrl,
        "image": resolvedOgImg,
        "telephone": "+966567699315",
        "priceRange": "$$$",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Al Hofuf",
          "addressLocality": "Al Hofuf",
          "addressRegion": "Eastern Province",
          "addressCountry": "SA"
        }
      };
    }

    let scriptEl = document.querySelector('script[type="application/ld+json"]#hero-seo-jsonld');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'application/ld+json');
      scriptEl.setAttribute('id', 'hero-seo-jsonld');
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(jsonLdObj, null, 2);

    // Cleanup when component unmounts
    return () => {
      // Remove dynamically generated elements if necessary
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]#hero-seo-jsonld');
      if (jsonLdScript) jsonLdScript.remove();
    };
  }, [activeSlide, slides, isAr, dbSlides]);

  // Next / Previous navigation handlers with Infinite Loop support
  const handleNext = () => {
    setActiveSlide((prev) => {
      if (prev < slides.length - 1) return prev + 1;
      return carouselSettings.loop ? 0 : prev;
    });
  };

  const handlePrev = () => {
    setActiveSlide((prev) => {
      if (prev > 0) return prev - 1;
      return carouselSettings.loop ? slides.length - 1 : prev;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, carouselSettings.loop]);

  // Touch Swipe handlers
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setIsPaused(false);
  };

  // Autoplay timer
  useEffect(() => {
    if (!carouselSettings.autoplay || isPaused || slides.length === 0 || !carouselSettings.duration || carouselSettings.duration === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        if (prev < slides.length - 1) return prev + 1;
        return carouselSettings.loop ? 0 : prev;
      });
    }, carouselSettings.duration * 1000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused, carouselSettings]);

  const pillars = [
    { id: 'coffee', name: t('home.categories.coffee'), desc: t('home.categories.coffee_desc'), icon: Coffee, img: OUR_SPACE_STATIC.coffee },
    { id: 'bakery', name: t('home.categories.bakery'), desc: t('home.categories.bakery_desc'), icon: Cookie, img: OUR_SPACE_STATIC.bakery },
    { id: 'market', name: t('home.categories.market'), desc: t('home.categories.market_desc'), icon: ShoppingBag, img: OUR_SPACE_STATIC.market },
    { id: 'fashion', name: t('home.categories.fashion'), desc: t('home.categories.fashion_desc'), icon: Shirt, img: OUR_SPACE_STATIC.fashion },
    { id: 'thobes', name: t('home.categories.thobes'), desc: t('home.categories.thobes_desc'), icon: ThobeIcon, img: OUR_SPACE_STATIC.thobes },
  ];

  return (
    <div 
      className="relative min-h-screen bg-black overflow-hidden flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      {/* Background cinematic fading images */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => {
          const isCurrent = index === activeSlide;
          if (!isCurrent && !loadAllSlides) return null;
          const speedSec = (carouselSettings.speed || 1000) / 1000;
          const effectClass = carouselSettings.effect === 'zoom'
            ? (isCurrent ? 'opacity-65 scale-100' : 'opacity-0 scale-105')
            : carouselSettings.effect === 'slide'
            ? (isCurrent ? 'opacity-65 translate-x-0' : 'opacity-0 translate-x-8')
            : (isCurrent ? 'opacity-65' : 'opacity-0');

          return (
            <div
              key={index}
              className={`absolute inset-0 ${isCurrent ? '' : 'transition-all ease-in-out'} ${effectClass}`}
              style={isCurrent ? { opacity: 1 } : { transitionDuration: `${speedSec}s` }}
            >
              {/* Cinematic top-and-bottom gradient plus a soft-light blend mask for rich presence */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-[#000000]/40 to-black z-10" />
              <div className="absolute inset-0 bg-[#0c0c0c]/15 mix-blend-soft-light z-10 pointer-events-none" />
              <SafeImage
                src={slide.img}
                isHero={true}
                alt={`${slide.tag} - ${slide.line1} ${slide.line2} ${slide.line3}`}
                containerClassName="absolute inset-0 w-full h-full z-0"
                className="w-full h-full object-cover select-none pointer-events-none"
                priority={isCurrent}
              />
            </div>
          );
        })}
      </div>

      {/* Floating Gold Flare Particles Layer */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-screen opacity-50">
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[60%] left-[80%] w-1 h-1 rounded-full bg-amber-200/40 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-[80%] left-[30%] w-1.5 h-1.5 rounded-full bg-[#D4AF37]/20 animate-ping" style={{ animationDuration: '5s' }} />
        <div className="absolute top-[40%] left-[70%] w-1.5 h-1.5 bg-amber-100 rounded-full opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      {/* Hero Editorial Divided Grid */}
      <div className="relative z-20 flex-grow flex items-center px-4 sm:px-8 lg:px-16 pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Hero Typography (60% equivalent: col-span-7) */}
          <div 
            className={`lg:col-span-7 flex flex-col justify-center space-y-6 ${isAr ? 'text-right items-end' : 'text-left items-start'}`}
            dir={isAr ? "rtl" : "ltr"}
          >
            
            {/* Tagline Indicator - Fade in and slide slightly */}
            <motion.div 
              key={`tag-${activeSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#D4AF37] text-xs tracking-[0.45em] uppercase font-display select-none flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
              {slides[activeSlide].tag}
            </motion.div>

            {/* Majestic Main Heading with hollow stroke effect - Title rises from bottom! */}
            <h1 className="w-full sm:w-auto text-3xl sm:text-5xl md:text-6xl lg:text-[3.25rem] xl:text-7xl font-extrabold tracking-tighter uppercase leading-[0.85] font-display min-h-[150px] sm:min-h-[250px] md:min-h-[290px] flex flex-col justify-center overflow-visible">
              <span className="block pb-1">
                <motion.span 
                  key={`l1-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  {slides[activeSlide].line1}
                </motion.span>
              </span>
              <span className="block py-1">
                <motion.span 
                  key={`l2-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="text-stroke-white select-none block hover:text-[#D4AF37]/10 transition-colors duration-500"
                >
                  {slides[activeSlide].line2}
                </motion.span>
              </span>
              <span className="block pt-1">
                <motion.span 
                  key={`l3-${activeSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#D4AF37] block"
                >
                  {slides[activeSlide].line3}
                </motion.span>
              </span>
              {slides[activeSlide].line4 && (
                <span className="block pt-1">
                  <motion.span 
                    key={`l4-${activeSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    className="text-[#D4AF37] block"
                  >
                    {slides[activeSlide].line4}
                  </motion.span>
                </span>
              )}
            </h1>

            {/* Subtitle description - Fades in gently */}
            <div className="min-h-[48px] sm:min-h-[60px]">
              <motion.p 
                key={`sub-${activeSlide}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-zinc-300 w-[90%] sm:w-auto text-[11px] sm:text-sm tracking-wide max-w-lg leading-relaxed font-sans text-justify bg-black/10 backdrop-blur-xs p-1 rounded-sm"
              >
                {slides[activeSlide].subtitle}
              </motion.p>
            </div>

            {/* CTA action buttons - Fixed across all slides */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-1 sm:pt-4 sm:mt-auto"
            >
              <button
                onClick={() => {
                  if (setSelectedCategoryFilter) setSelectedCategoryFilter('all');
                  setCurrentPage(slides[activeSlide]?.cta_link || 'store');
                }}
                className="w-auto px-4 py-2 sm:w-auto sm:px-10 sm:py-4 bg-[#D4AF37] text-black text-[11px] sm:text-[10px] font-bold tracking-widest sm:tracking-[0.2em] uppercase whitespace-nowrap hover:bg-white hover:text-black transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
              >
                {(() => {
                  const currentSlide = slides[activeSlide];
                  const defaultText = currentSlide?.cta_text || t('home.hero.shop_button');
                  if ((currentSlide as any)?.category === 'thobes' || (defaultText && defaultText.toUpperCase().includes('THOBES'))) {
                    return 'EXPLORE COLLECTION';
                  }
                  return defaultText;
                })()}
              </button>
            </motion.div>

            {/* Geographic Location Indicator */}
            <div className="flex flex-wrap items-center gap-4 mt-8 sm:mt-0 pt-2 sm:pt-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 text-[8px] sm:text-[9px] uppercase tracking-[0.25em] font-mono select-none"
              >
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37]/60" />
                <span>{t('home.hero.location')}</span>
              </motion.div>
            </div>

          </div>

          {/* Right Column: Visual Experience Grid as the interactive Pillars (40% equivalent: col-span-5) */}
          <div className="lg:col-span-5 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-[10px] tracking-[0.4em] uppercase text-zinc-500 mb-6 font-display text-center lg:text-left"
            >
              {t('home.hero.our_spaces')}
            </motion.div>
            
            {/* Staggered container for pillars */}
            <div 
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-4 h-full"
            >
              {pillars.map((p, idx) => {
                const IconComp = p.icon;
                
                // If there's an odd number of pillars (e.g. 5), the last one spans 2 columns
                const isLastAndOdd = idx === pillars.length - 1 && pillars.length % 2 !== 0;
                const gridClass = isLastAndOdd ? "col-span-2 md:col-span-2" : "";
                
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (setSelectedCategoryFilter) {
                        setSelectedCategoryFilter(p.id);
                      }
                      setCurrentPage('store');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    aria-label={t('home.hero.explore_pillar', { name: p.name })}
                    className={`group relative h-[85px] min-[375px]:h-[95px] sm:min-h-[160px] md:h-44 rounded-sm overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-900 to-black p-2 sm:p-5 md:p-6 text-left transition-all duration-400 hover:border-[#D4AF37]/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between ${gridClass}`}
                  >
                    {/* Protected Static Image for OUR SPACE */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover opacity-65 group-hover:opacity-85 transition-all duration-400 scale-100 group-hover:scale-[1.04] group-hover:brightness-110 select-none pointer-events-none"
                        loading="eager"
                      />
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black via-black/35 to-transparent z-10" />

                    <div className="relative z-20 flex justify-between items-start w-full">
                      <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-[#D4AF37]/80 font-bold group-hover:text-[#D4AF37] transition-colors mt-0.5 sm:mt-1">
                        0{idx + 1}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="opacity-0 translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-400 text-[#D4AF37] text-[8px] sm:text-[9px] uppercase tracking-widest font-mono hidden sm:inline-block mt-0.5">
                          {t('home.actions.explore')} &rarr;
                        </span>
                        <div className="p-1 sm:p-2 rounded-full bg-black/40 border border-white/10 group-hover:border-[#D4AF37]/50 backdrop-blur-sm transition-all duration-400 group-hover:bg-[#D4AF37]/10 flex items-center justify-center">
                          <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300 group-hover:text-[#D4AF37] transition-colors" aria-hidden="true" />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-20 mt-auto pt-1 sm:pt-4">
                      <h3 className="text-white text-[9.5px] min-[375px]:text-[10.5px] sm:text-[13px] md:text-sm font-display uppercase tracking-widest font-bold group-hover:text-[#D4AF37] duration-400 leading-tight block line-clamp-2">
                        {p.name}
                      </h3>
                      <p className="hidden sm:block text-zinc-400 text-[10px] md:text-[11px] font-sans truncate mt-1.5 group-hover:text-zinc-300 transition-colors w-full">
                        {p.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Decorative vertical spacer / scroll prompt */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 flex flex-col items-center"
      >
        {/* Scroll indicator with bounce animation */}
        <div className="flex flex-col items-center justify-center text-zinc-500 hover:text-[#D4AF37] transition-all duration-300">
          <span className="text-[9px] uppercase tracking-[0.3em] mb-2 pointer-events-none select-none">
            {t('home.hero.deepen_experience')}
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-[#D4AF37]" />
        </div>
      </motion.div>

    </div>
  );
});
