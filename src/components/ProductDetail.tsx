import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ShoppingBag, ArrowLeft, Heart, MessageSquare, Shield, Clock, Award, Star, ThumbsUp, Send, Trash2, Plus, CheckCircle2, Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review, BusinessCategory, Order } from '../types';
import ScrollZoomImage from './ScrollZoomImage';
import { useTranslation } from 'react-i18next';
import { SafeImage, getFallbackImage, useGlobalProducts, resolveProductImage } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  setCurrentPage: (page: string) => void;
  onProductSelect: (p: Product) => void;
  currentUser: any;
  orders: Order[];
}

export default function ProductDetail({
  product,
  onBack,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  setCurrentPage,
  onProductSelect,
  currentUser,
  orders
}: ProductDetailProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const getLocalizedOption = (opt: string) => {
    if (!isAr) return opt;
    const optionsMap: Record<string, string> = {
      'Whole Beans': 'حبوب كاملة',
      'Infused Ground': 'مطحونة ممزوجة',
      'Fine Roasted Espresso': 'إسبريسو محمص ناعم',
      'Fresh Baked Daily Lot': 'دفعة مخبوزة طازجة يومياً',
      'Sealed Presentation Pack': 'عبوة عرض مغلقة آمنة',
      'Standard Burlap Bag': 'كيس خيش قياسي',
      'Hermetically Sealed Tin (+0.00 SAR)': 'علبة معدنية محكمة الإغلاق (+٠.٠٠ ر.س)',
      'Standard Fit drape (4.5m)': 'قطعة قياسية مفصلة (٤.٥ م)',
      'Premium Presentation Box (+0.00 SAR)': 'صندوق عرض فاخر (+٠.٠٠ ر.س)',
      'Standard Fit': 'مقاس قياسي',
      'Tailored Fit (+0.00 SAR)': 'تفصيل مخصص (+٠.٠٠ ر.س)',
      'Standard Luxury Pack': 'عبوة فاخرة قياسية'
    };
    return optionsMap[opt] || opt;
  };

  const getLocalizedFeature = (feature: string) => {
    if (!isAr) return feature;
    const featuresMap: Record<string, string> = {
      'Premium Arabica': 'بن أرابيكا فاخر',
      'Artisan Roasted': 'محمص بحرفية',
      'Rich Flavor Profile': 'مذاق غني بالنكهات',
      'Freshly Ground': 'مطحون طازج',
      'Fresh Ingredients': 'مكونات طازجة',
      'Traditional Recipe': 'وصفة تقليدية أصيلة',
      'Baked Daily': 'يخبز يومياً',
      'Preservative Free': 'خالٍ من المواد الحافظة',
      'Authentic Sourcing': 'مصادر موثوقة وأصيلة',
      'Premium Quality': 'جودة استثنائية ممتازة',
      'Natural Ingredients': 'مكونات طبيعية نقية',
      'Heritage Selection': 'مختارات تراثية مميزة',
      'Premium boutique selection': 'تشكيلة بوتيك فاخرة',
      'Luxury Fabrics': 'أقمشة فاخرة راقية',
      'Exquisite Details': 'تفاصيل متقنة رائعة',
      'Elegant Drape': 'تصميم منسدل أنيق',
      'Premium Stitching': 'خياطة فاخرة ممتازة',
      'Premium Materials': 'خامات ممتازة فاخرة',
      'Tailored Fit': 'تفصيل مخصص دقيق',
      'Traditional Styling': 'طراز سوداني تقليدي أصيل',
      'Breathable Fabric': 'نسيج مريح قابل للتنفس',
      'Authentic Design': 'تصميم أصيل فاخر',
      'Luxury Finish': 'لمسات نهائية راقية',
      'Handcrafted Details': 'تفاصيل يدوية دقيقة'
    };
    return featuresMap[feature] || feature;
  };

  const getInitialImage = () => {
    return resolveProductImage(product);
  };

  const allProducts = useGlobalProducts();
  const [activeImg, setActiveImg] = useState(getInitialImage());
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState('');
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', backgroundPosition: '0% 0%' });

  // Premium button state sequence: 'idle' | 'adding' | 'success'
  const [buttonState, setButtonState] = useState<'idle' | 'adding' | 'success'>('idle');

  // Reviews submission forms
  const [newReviewer, setNewReviewer] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<Review[]>(product.reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  // Refined Review States
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [recommendProduct, setRecommendProduct] = useState<'yes' | 'no'>('yes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hoverRating, setHoverRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carousel & Page Indicator States
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-fill name logic
  useEffect(() => {
    if (currentUser && !newReviewer) {
      setNewReviewer(currentUser.name);
    }
  }, [currentUser]);

  // Verified Purchase logic
  const isVerifiedPurchase = useMemo(() => {
    if (!currentUser || !orders) return false;
    return orders.some(order => 
      order.email === currentUser.email && 
      order.items.some(item => item.productId === product.id) &&
      (order.status === 'Delivered' || order.status === 'Completed')
    );
  }, [currentUser, orders, product.id]);

  const isWishlisted = wishlist.includes(product.id);

  // Close form on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showReviewForm) {
        setShowReviewForm(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showReviewForm]);

  // Focus trap for the form
  const formRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showReviewForm && formRef.current) {
      const focusableElements = formRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) firstElement.focus();
    }
  }, [showReviewForm]);

  const resolvedStory = useMemo(() => {
    if (i18n.language === 'ar') {
      return product.description_ar || product.story || product.description;
    }
    return product.story || product.description;
  }, [product, i18n.language]);

  const resolvedSpecifications = useMemo(() => {
    if (i18n.language === 'ar') {
      if (product.specifications_ar) {
        if (typeof product.specifications_ar === 'string') {
          try {
            return JSON.parse(product.specifications_ar);
          } catch {
            return { 'المواصفات': product.specifications_ar };
          }
        }
        return product.specifications_ar;
      }
    }
    return product.specifications || {};
  }, [product, i18n.language]);

  const resolvedMaterials = useMemo(() => {
    if (i18n.language === 'ar') {
      return product.materials_ar || product.reusableAttributes?.material || '';
    }
    return product.reusableAttributes?.material || '';
  }, [product, i18n.language]);

  const resolvedCare = useMemo(() => {
    if (i18n.language === 'ar') {
      return product.care_instructions_ar || product.directions || '';
    }
    return product.directions || '';
  }, [product, i18n.language]);

  // Derive feature highlights based on category
  const productFeatures = useMemo(() => {
    switch (product.category) {
      case 'coffee': return ['Premium Arabica', 'Artisan Roasted', 'Rich Flavor Profile', 'Freshly Ground'];
      case 'bakery': return ['Fresh Ingredients', 'Traditional Recipe', 'Baked Daily', 'Preservative Free'];
      case 'market': return ['Authentic Sourcing', 'Premium Quality', 'Natural Ingredients', 'Heritage Selection'];
      case 'fashion': return ['Luxury Fabrics', 'Exquisite Details', 'Elegant Drape', 'Premium Stitching'];
      case 'thobes': return ['Premium Materials', 'Tailored Fit', 'Traditional Styling', 'Breathable Fabric'];
      default: return ['Premium Quality', 'Authentic Design', 'Luxury Finish', 'Handcrafted Details'];
    }
  }, [product.category]);

  // Setup options
  const productOptions = useMemo(() => {
    switch (product.category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+0.00 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Premium Presentation Box (+0.00 SAR)'];
      case 'thobes': return ['Standard Fit', 'Tailored Fit (+0.00 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  }, [product.category]);

  React.useEffect(() => {
    setSelectedOption(productOptions[0]);
    setActiveImg(getInitialImage());
  }, [product, productOptions]);

  // Compute related recommendations
  const relatedProducts = useMemo(() => {
    // Priority: Recommended products in same category
    const recommended = allProducts.filter((item) => item.category === product.category && item.id !== product.id && item.isRecommended);
    if (recommended.length >= 3) return recommended.slice(0, 3);
    
    // Fallback: Same category
    const sameCategory = allProducts.filter((item) => item.category === product.category && item.id !== product.id);
    return [...recommended, ...sameCategory.filter(p => !recommended.includes(p))].slice(0, 3);
  }, [allProducts, product.category, product.id]);

  const [carouselMetrics, setCarouselMetrics] = useState({ cardWidth: 0, gap: 6, containerWidth: 0 });

  // Keep carousel metrics synchronized using ResizeObserver & Setup Passive Scroll
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const updateMetrics = () => {
      const computedStyle = window.getComputedStyle(container);
      const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || "6") || 6;
      const firstCard = container.querySelector("[data-related-card]") as HTMLElement;
      const cardWidth = firstCard ? firstCard.offsetWidth : 0;
      const containerWidth = container.offsetWidth;

      setCarouselMetrics((prev) => {
        if (prev.cardWidth === cardWidth && prev.gap === gap && prev.containerWidth === containerWidth) {
          return prev;
        }
        return { cardWidth, gap, containerWidth };
      });
    };

    updateMetrics();

    const observer = new ResizeObserver(() => {
      updateMetrics();
    });
    observer.observe(container);

    const firstCard = container.querySelector("[data-related-card]");
    if (firstCard) {
      observer.observe(firstCard);
    }

    // Passive Scroll Listener
    const handleScrollPassive = () => {
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = requestAnimationFrame(() => {
        const firstCardEl = container.querySelector("[data-related-card]") as HTMLElement;
        if (!firstCardEl) return;
        const computedStyleEl = window.getComputedStyle(container);
        const gapVal = parseFloat(computedStyleEl.columnGap || computedStyleEl.gap || "6") || 6;
        const cardWidthVal = firstCardEl.offsetWidth;
        const index = Math.round(container.scrollLeft / (cardWidthVal + gapVal));
        if (index !== activeIndexRef.current) {
          setActiveIndex(index);
        }
      });
    };

    container.addEventListener('scroll', handleScrollPassive, { passive: true });

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScrollPassive);
      if (scrollTimeoutRef.current) {
        cancelAnimationFrame(scrollTimeoutRef.current);
      }
    };
  }, [relatedProducts]);

  const scrollToSlide = useCallback((idx: number) => {
    const container = carouselRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-related-card]");
    const targetCard = cards[idx] as HTMLElement;
    if (targetCard) {
      const isReducedMotion = typeof window !== 'undefined' && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      targetCard.scrollIntoView({
        behavior: isReducedMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }, []);

  const handleDotClick = useCallback((idx: number) => {
    scrollToSlide(idx);
  }, [scrollToSlide]);

  const handleCardClick = useCallback((rel: Product) => {
    onProductSelect(rel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onProductSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const container = carouselRef.current;
    if (!container) return;

    const computedStyle = window.getComputedStyle(container);
    const gap = parseFloat(computedStyle.columnGap || computedStyle.gap || "6") || 6;
    const firstCard = container.querySelector("[data-related-card]") as HTMLElement;
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth;

    const currentScroll = container.scrollLeft;
    const currentIndex = Math.round(currentScroll / (cardWidth + gap));
    const isReducedMotion = typeof window !== 'undefined' && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollBehavior = isReducedMotion ? 'auto' : 'smooth';

    let targetIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      targetIndex = Math.min(currentIndex + 1, relatedProducts.length - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      targetIndex = Math.max(currentIndex - 1, 0);
    } else if (e.key === 'Home') {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      targetIndex = relatedProducts.length - 1;
    } else {
      return;
    }

    container.scrollTo({
      left: targetIndex * (cardWidth + gap),
      behavior: scrollBehavior
    });
  }, [relatedProducts.length]);

  const visibleCards = useMemo(() => {
    const { cardWidth, gap, containerWidth } = carouselMetrics;
    if (!cardWidth || !containerWidth) return 1;
    return Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
  }, [carouselMetrics]);

  const totalDots = useMemo(() => {
    return Math.min(relatedProducts.length, 5);
  }, [relatedProducts.length]);

  const activeDotIndex = useMemo(() => {
    if (relatedProducts.length <= 5) return Math.min(activeIndex, relatedProducts.length - 1);
    const maxIdx = relatedProducts.length - 1;
    if (maxIdx <= 0) return 0;
    return Math.min(Math.round((activeIndex / maxIdx) * 4), 4);
  }, [activeIndex, relatedProducts.length]);

  // Handle image mouse movement for luxurious zoom magnifier
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none', backgroundPosition: '0% 0%' });
  };

  // Photo handling helpers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const remainingSlots = 5 - reviewPhotos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);
    
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setReviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Submit review locally
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newRating === 0) return;

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const newRev: Review = {
        id: `rev-${Date.now()}`,
        reviewerName: (newReviewer || (currentUser?.name) || t('product_detail.guest_user', { defaultValue: 'Guest User' })).trim(),
        rating: newRating,
        date: new Date().toISOString().substring(0, 10),
        comment: newComment.trim(),
        // Extended fields if supported by type (adding as any for now to avoid breaking existing Review interface if I can't modify it easily)
        ...({
          images: reviewPhotos,
          verified: isVerifiedPurchase,
          recommended: recommendProduct === 'yes'
        } as any)
      };

      setLocalReviews([newRev, ...localReviews]);
      setSubmissionStatus('success');
      
      // Reset form after a brief success message
      setTimeout(() => {
        setNewComment('');
        setNewRating(5);
        setReviewPhotos([]);
        setRecommendProduct('yes');
        setShowReviewForm(false);
        setSubmissionStatus('idle');
      }, 2000);
    } catch (err) {
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build high-end pre-compiled WhatsApp text order
  const handleWhatsAppOrder = () => {
    const text = `السلام عليكم ZOAL Boutique. I am interested in placing an exclusive purchase order for columns:
- Product: ${product.name}
- Configuration: ${selectedOption}
- Price: ${formatCurrency(product.price)} SAR
- Ordered Quantity: ${quantity}
Please confirm availability at your nearest flagship boutique. Thank you.`;
    
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=+966567699315&text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBuyNow = () => {
    sessionStorage.setItem('zoal_checkout_source', 'buy-now');
    sessionStorage.setItem('zoal_checkout_product', JSON.stringify(product));
    onAddToCart(product, quantity, selectedOption);
    onBack();
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[58px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-12 sm:pb-20 pb-[calc(3rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Navigation line back */}
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 rtl:space-x-reverse text-xs uppercase tracking-widest text-zinc-500 hover:text-gold-pure transition-colors duration-300 mb-2.5 sm:mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('product_detail.back')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-16 items-start">
          
          {/* Gallery with Zoom (columns 1 to 6) */}
          <div className="lg:col-span-6 space-y-1.5 sm:space-y-4">
            
            {/* Main Visual box */}
            <div
              className={`relative bg-[#050505] border border-white/5 rounded-sm overflow-hidden cursor-crosshair group h-auto sm:max-h-[600px] ${
                product.category === 'market' ? 'aspect-[16/9]' : 'aspect-square sm:aspect-[4/5]'
              }`}
              onMouseMove={product.category === 'market' ? undefined : handleMouseMove}
              onMouseLeave={product.category === 'market' ? undefined : handleMouseLeave}
            >
              <SafeImage
                src={activeImg}
                alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : product.name}
                className={`w-full h-full ${
                  product.category === 'market'
                    ? 'object-contain'
                    : 'object-cover transition-transform duration-700 ease-out group-hover:scale-105'
                }`}
                category={product.category}
                priority={true}
              />

              {/* Dynamic magnifying layout view */}
              {product.category !== 'market' && (
                <div
                  className="absolute inset-0 pointer-events-none border border-gold-pure/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    ...zoomStyle,
                    backgroundImage: `url(${getFallbackImage(activeImg, product.category)})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '200%',
                  }}
                />
              )}
            </div>

            {/* Thumbnail Carousel Picker */}
            <div className="flex space-x-2.5 sm:space-x-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-0 sm:pb-2">
              {((product.images && product.images.length > 0) ? product.images : [activeImg]).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(img)}
                  className={`snap-center w-16 h-16 sm:w-24 sm:h-24 rounded-xs border overflow-hidden shrink-0 transition-all cursor-pointer ${
                    activeImg === img 
                      ? `border-gold-pure ${product.category === 'market' ? '' : 'scale-105'}` 
                      : 'border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <SafeImage src={img} alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR Thumbnail" : `Thumb ${i}`} className="w-full h-full object-contain" category={product.category} />
                </button>
              ))}
            </div>

          </div>

          {/* Pricing & Customization controls (columns 7 to 12) */}
          <div className="lg:col-span-6 space-y-3.5 md:space-y-8 lg:pl-4">
            
            <div className="space-y-1 sm:space-y-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-gold-pure font-display block">
                {(() => {
                  const categoryName = t(`store.category.${product.category}`, { defaultValue: product.category.replace('_', ' ') });
                  const hasCollection = /collection/i.test(categoryName) || categoryName.includes('مجموعة');
                  if (hasCollection) {
                    return categoryName;
                  }
                  return `${categoryName} ${t('product_detail.collection_label', { defaultValue: 'COLLECTION' })}`;
                })()}
              </span>
              <h1 className="text-2xl sm:text-5xl font-semibold tracking-wide uppercase font-display text-white leading-tight line-clamp-2">{i18n.language === 'ar' ? (product.title_ar || product.nameAr || t(`products.${product.id}.name`, { defaultValue: product.name })) : (product.nameEn || product.name)}</h1>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.round(product.rating) ? 'text-gold-pure fill-current' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <span className="text-[11px] sm:text-xs text-zinc-400 font-sans pl-2 tabular-nums-fix">
                  {product.rating} / 5.0  •  {localReviews.length} {t('product_detail.reviews_label')}
                </span>
              </div>
            </div>

            {/* Price tag */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-4xl font-sans tracking-wider text-white font-light tabular-nums-fix">{formatCurrency(product.price)} <span className="text-base sm:text-xl text-gold-pure">{t('app.sar')}</span></span>
              {product.inventory > 0 ? (
                <span className="flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold rounded-xs">
                  ✓ {product.inventory > 20 ? t('product_detail.available_today') : (product.inventory > 5 ? t('product_detail.in_stock') : t('product_detail.low_stock'))}
                </span>
              ) : (
                <span className="flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 bg-rose-950/30 text-rose-400 border border-rose-500/20 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold rounded-xs">
                  ✗ {t('product_detail.out_of_stock')}
                </span>
              )}
            </div>

            {/* Short Narrative intro */}
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans font-light line-clamp-3">{i18n.language === 'ar' ? (product.short_description_ar || product.shortDescription || product.subDescription || t(`products.${product.id}.description`, { defaultValue: product.description })) : (product.shortDescription || product.subDescription || product.description)}</p>

            {/* Product Feature Badges */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mt-2 sm:mt-4">
              {productFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-zinc-400">
                  <span className="text-gold-pure text-xs">✓</span>
                  <span className="text-[11px] sm:text-xs font-mono tracking-wide">{getLocalizedFeature(feature)}</span>
                </div>
              ))}
            </div>

            {/* Option Configuration Selection */}
            <div className="space-y-2 md:space-y-5 pt-3 sm:pt-4 border-t border-white/5 mt-2.5 md:mt-6 mb-2 md:mb-6">
              <label className="text-[11px] sm:text-xs text-white uppercase tracking-widest block font-display">
                {t('product_detail.configuration')}
              </label>
              <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(120px,1fr))] sm:grid-cols-2 sm:gap-3">
                {productOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`min-h-[44px] sm:min-h-[48px] py-2.5 px-3 sm:py-3 sm:px-4 rounded-xs text-[10px] sm:text-[11px] uppercase tracking-wider border text-center sm:text-left flex items-center justify-center sm:justify-start transition-all duration-300 cursor-pointer ${
                      selectedOption === opt
                        ? 'border-gold-pure text-white bg-gold-pure/5 shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold'
                        : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30 bg-black'
                    }`}
                  >
                    {getLocalizedOption(opt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between sm:justify-start space-x-3 sm:space-x-4 pt-1 sm:pt-2 rtl:space-x-reverse">
              <label className="text-[11px] sm:text-xs text-white uppercase tracking-widest font-display shrink-0 w-auto sm:w-32">{t('product_detail.quantity', { defaultValue: 'QUANTITY' })}</label>
              <div className="flex items-center border border-white/10 bg-[#050505] rounded-xs h-11 w-32 sm:w-36 justify-between shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 sm:px-4 py-2 sm:py-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-bold min-h-[44px] flex items-center justify-center"
                >
                  -
                </button>
                <span className="px-2 py-2 sm:py-3 font-sans text-xs sm:text-sm text-white tabular-nums-fix font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))}
                  className="px-3.5 sm:px-4 py-2 sm:py-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-bold min-h-[44px] flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Procurement Actions */}
            <div className="flex flex-col space-y-1.5 md:space-y-3 pt-2 md:pt-5 mt-2 md:mt-5 border-t border-white/5 pb-[env(safe-area-inset-bottom,0px)]">
              
              <button
                id="product-detail-add-to-bag-button"
                disabled={buttonState !== 'idle'}
                onClick={() => {
                  if (buttonState !== 'idle') return;
                  setButtonState('adding');
                  setTimeout(() => {
                    const finalOption = selectedOption || (productOptions && productOptions[0]) || 'Standard';
                    onAddToCart(product, quantity, finalOption);
                    setButtonState('success');
                    setTimeout(() => {
                      setButtonState('idle');
                    }, 1800);
                  }, 800);
                }}
                className={`w-full py-3.5 sm:py-4 min-h-[48px] font-display text-xs uppercase font-bold tracking-[0.25em] rounded-xs transition-all duration-350 flex items-center justify-center gap-2 select-none cursor-pointer shadow-lg active:scale-[0.99] touch-none ${
                  buttonState === 'idle'
                    ? 'bg-white hover:bg-gold-light text-black hover:shadow-white/10 hover:shadow-xl'
                    : buttonState === 'adding'
                    ? 'bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed'
                    : 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] border-[#D4AF37]'
                }`}
              >
                {buttonState === 'idle' && (
                  <>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>{t('product_detail.add_to_cart', { defaultValue: 'ADD TO SHOPPING BAG' })}</span>
                  </>
                )}
                {buttonState === 'adding' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-zinc-400 tracking-[0.2em]">{t('product_detail.adding')}</span>
                  </>
                )}
                {buttonState === 'success' && (
                  <>
                    <span className="font-bold text-[#111] animate-pulse">✓</span>
                    <span className="text-[#111] font-bold tracking-[0.2em]">{t('product_detail.added_label')}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                className="w-full py-3.5 sm:py-4 min-h-[48px] border border-gold-pure text-gold-pure font-display text-xs uppercase font-bold tracking-[0.2em] rounded-xs transition-all duration-300 hover:bg-gold-pure hover:text-black flex items-center justify-center gap-2 cursor-pointer"
              >
                {t('product_detail.buy_now')}
              </button>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleWhatsAppOrder}
                  className="py-2.5 sm:py-3 min-h-[44px] border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400 font-display text-[10px] uppercase font-semibold tracking-widest rounded-xs transition-all duration-300 flex items-center justify-center cursor-pointer"
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.71 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`py-2.5 sm:py-3 min-h-[44px] border hover:border-gold-pure/30 bg-zinc-950/20 hover:bg-gold-pure/5 rounded-xs text-[10px] uppercase font-display tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${isWishlisted ? 'border-rose-500/50 text-rose-500' : 'border-white/5 text-zinc-400 hover:text-gold-pure'}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {t('product_detail.wishlist')}
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* SECTION 1: Why You'll Love It (Replaced Narrative) */}
        <div className="mt-4.5 md:mt-20 border-t border-white/5 pt-4 md:pt-16">
          <div className="text-center max-w-2xl mx-auto mb-2 md:mb-12">
            <h2 className="text-lg sm:text-2xl font-display uppercase tracking-widest text-white">{t('product_detail.why_you_love_it')}</h2>
            <div className="w-10 sm:w-12 h-0.5 sm:h-1 bg-gold-pure mx-auto mt-1 sm:mt-4 rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 max-w-5xl mx-auto">
            {productFeatures.map((feature, idx) => (
              <div key={idx} className="bg-[#050505] border border-white/5 py-2.5 px-3 md:p-6 rounded-xs text-left group hover:border-gold-pure/30 transition-colors space-y-1 md:space-y-5">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-0.5 md:mb-3">
                  <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 group-hover:bg-gold-pure/10 transition-colors">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-gold-pure" />
                  </div>
                  <h4 className="text-white text-[11px] sm:text-xs font-display uppercase tracking-wider line-clamp-1">{getLocalizedFeature(feature)}</h4>
                </div>
                <p className="text-zinc-500 text-[10px] sm:text-xs leading-relaxed font-sans">{t('product_detail.experience_desc')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Product Details (Replaced Specification Matrix) */}
        <div className="mt-4.5 md:mt-20 border-t border-white/5 pt-4.5 md:pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            
            <div className="space-y-3 md:space-y-6">
              <h2 className="text-xl sm:text-3xl font-display uppercase tracking-wider text-white mb-2 md:mb-6">
                {t('product_detail.product_details')}
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-lg font-light">
                {resolvedStory}
              </p>
              <div className="grid grid-cols-1 gap-y-2.5 md:gap-y-5 pt-3 md:pt-6 mt-3 md:mt-8">
                {Object.entries(resolvedSpecifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col border-b border-white/5 pb-2.5 md:pb-4 py-2.5 md:py-5">
                    <span className="font-display text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1">{key}</span>
                    <span className="text-zinc-200 font-sans text-xs sm:text-sm">{val as string}</span>
                  </div>
                ))}

                {/* Resolved Materials */}
                {resolvedMaterials && (
                  <div className="flex flex-col border-b border-white/5 pb-2.5 md:pb-4 py-2.5 md:py-5">
                    <span className="font-display text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1">
                      {t('product_detail.materials')}
                    </span>
                    <span className="text-zinc-200 font-sans text-xs sm:text-sm">
                      {Array.isArray(resolvedMaterials) ? resolvedMaterials.join(', ') : resolvedMaterials}
                    </span>
                  </div>
                )}

                {/* Resolved Care Instructions */}
                {resolvedCare && (
                  <div className="flex flex-col border-b border-white/5 pb-2.5 md:pb-4 py-2.5 md:py-5">
                    <span className="font-display text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 sm:mb-1">
                      {t('product_detail.care_instructions')}
                    </span>
                    <span className="text-zinc-200 font-sans text-xs sm:text-sm">
                      {Array.isArray(resolvedCare) ? resolvedCare.join(', ') : resolvedCare}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className={`relative rounded-sm overflow-hidden border border-white/5 bg-[#000] ${
              product.category === 'market' ? 'aspect-[16/9]' : 'aspect-[4/3]'
            }`}>
              <SafeImage
                src={(product.images && product.images.length > 1 ? product.images[1] : null) || activeImg}
                alt={product.name}
                className={product.category === 'market' 
                  ? "w-full h-full object-contain opacity-100" 
                  : "w-full h-full object-cover opacity-80 mix-blend-lighten"
                }
                category={product.category}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

          </div>
        </div>

        {/* SECTION 3: Customer Reviews */}
        <div className="mt-6 md:mt-20 border-t border-white/5 pt-5 md:pt-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-2 md:mb-12 gap-2 md:gap-6">
            <div>
              <h2 className="text-xl sm:text-3xl font-display uppercase tracking-widest text-white font-semibold mb-1 md:mb-4">
                {t('product_detail.voices_of_zoal', { defaultValue: 'VOICES OF ZOAL' })}
              </h2>
              <div className="flex items-center space-x-4">
                {localReviews.length === 0 ? (
                  <div className="text-sm font-sans tracking-wide text-zinc-400 uppercase tracking-widest font-display">
                    {t('product_detail.no_reviews_yet', { defaultValue: 'NO REVIEWS YET' })}
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? 'text-gold-pure fill-current' : 'text-zinc-700'}`} />
                      ))}
                    </div>
                    <div className="text-sm font-sans tracking-wide">
                      <span className="text-white font-medium">{product.rating.toFixed(1)}/5.0</span>
                      <span className="text-zinc-500 ml-2">{t('product_detail.based_on_reviews', { count: localReviews.length })}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {!showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="py-1.5 px-3 md:py-3 md:px-8 border border-white/10 md:border-none hover:border-gold-pure bg-zinc-900 hover:bg-gold-pure text-white hover:text-black font-display text-[10px] md:text-xs uppercase font-semibold md:font-bold tracking-wider md:tracking-[0.2em] rounded-xs transition-all"
              >
                {localReviews.length === 0 ? t('product_detail.share_experience', { defaultValue: 'SHARE YOUR EXPERIENCE' }) : t('product_detail.write_a_review')}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Feed ledger */}
            <div className={`lg:col-span-${showReviewForm ? '7' : '12'} space-y-2 md:space-y-4`}>
              {localReviews.length === 0 ? (
                <div className="p-12 border border-dashed border-white/5 bg-zinc-950/20 text-center rounded-sm">
                  <MessageSquare className="w-8 h-8 text-zinc-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-white text-sm font-display tracking-widest uppercase">{t('product_detail.no_reviews_shared', { defaultValue: 'NO REVIEWS HAVE BEEN SHARED YET' })}</p>
                  <p className="text-zinc-500 text-xs mt-2">{t('product_detail.be_the_first_review', { defaultValue: 'Be the first to share your experience and help others make confident choices.' })}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  {localReviews.map((rev) => (
                    <div key={rev.id} className="p-3 md:p-6 border border-white/5 bg-[#050505] rounded-sm flex flex-col justify-between">
                      <div>
                        <div className="flex space-x-1 text-gold-pure mb-1 md:mb-4">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed font-light font-sans italic mb-2 md:mb-6">"{rev.comment}"</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2 md:pt-4">
                        <span className="text-xs font-medium text-white uppercase tracking-wider font-display">{rev.reviewerName}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">{rev.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write feedback form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div 
                  ref={formRef}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-5 bg-[#030303] border border-white/10 p-4 md:p-8 rounded-sm space-y-3.5 md:space-y-6 shrink-0 sticky top-32 z-10 shadow-2xl"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 md:pb-4">
                    <h4 className="text-white text-sm font-display uppercase tracking-widest">{t('product_detail.submit_review', { defaultValue: 'Submit Experience' })}</h4>
                    <button 
                      onClick={() => setShowReviewForm(false)} 
                      className="text-zinc-500 hover:text-white border-0 bg-transparent cursor-pointer text-xl transition-colors"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleReviewSubmit} className="space-y-2.5 md:space-y-6">
                    {/* 1. Rating */}
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest font-display block">
                        {t('product_detail.how_was_experience', { defaultValue: 'How was your experience?' })}
                      </label>
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const starValue = i + 1;
                          const isActive = starValue <= (hoverRating || newRating);
                          return (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() => setHoverRating(starValue)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setNewRating(starValue)}
                              className="p-1.5 md:p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                              <Star 
                                className={`w-8 h-8 transition-all duration-300 ${
                                  isActive ? 'text-gold-pure fill-current filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'text-zinc-800'
                                }`} 
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Name */}
                    <div className="space-y-1 md:space-y-2">
                      <label htmlFor="review-name" className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest font-display block">
                        {t('product_detail.your_name', { defaultValue: 'Your Name' })}
                      </label>
                      <input
                        id="review-name"
                        type="text"
                        required
                        value={newReviewer}
                        onChange={(e) => setNewReviewer(e.target.value)}
                        placeholder={t('product_detail.name_placeholder', { defaultValue: 'Enter your name' })}
                        className="w-full bg-black border border-white/10 rounded-xs px-4 py-2.5 md:p-3 text-sm font-medium text-zinc-100 focus:outline-none focus:border-gold-pure/50 transition-colors placeholder:text-zinc-700"
                      />
                    </div>

                    {/* 3. Review Comment */}
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex justify-between items-end">
                        <label htmlFor="review-comment" className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest font-display block">
                          {t('product_detail.your_review', { defaultValue: 'Your Review' })}
                        </label>
                        <span className={`text-[9px] font-mono ${newComment.length > 450 ? 'text-amber-500' : 'text-zinc-600'}`}>
                          {newComment.length} / 500
                        </span>
                      </div>
                      <textarea
                        id="review-comment"
                        required
                        rows={4}
                        maxLength={500}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('product_detail.share_feedback_placeholder', { defaultValue: 'Tell us about your experience with this product...' })}
                        className="w-full bg-black border border-white/10 rounded-xs px-4 py-2.5 md:p-3 text-sm font-medium text-zinc-100 focus:outline-none focus:border-gold-pure/50 transition-colors resize-none h-24 md:h-32 placeholder:text-zinc-700"
                      />
                    </div>

                    {/* 4. Photo Upload */}
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest font-display block">
                        {t('product_detail.add_photos_max', { defaultValue: 'Add Photos (Max 5)' })}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {reviewPhotos.map((photo, index) => (
                          <div key={index} className="relative w-16 h-16 rounded-xs overflow-hidden border border-white/10 group">
                            <img src={photo} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                        {reviewPhotos.length < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-16 h-16 rounded-xs border border-dashed border-white/10 hover:border-gold-pure/50 flex flex-col items-center justify-center gap-1 transition-colors group"
                          >
                            <Camera className="w-4 h-4 text-zinc-500 group-hover:text-gold-pure" />
                            <span className="text-[8px] text-zinc-600 uppercase font-display">{t('product_detail.add_photo_btn', { defaultValue: 'Add' })}</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>

                    {/* 5. Verified Purchase Indicator (Auto-displayed) */}
                    {isVerifiedPurchase && (
                      <div className="flex items-center space-x-2 text-emerald-400 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase tracking-widest font-display font-bold">
                          {t('product_detail.verified_purchase', { defaultValue: 'Verified Purchase' })}
                        </span>
                      </div>
                    )}

                    {/* 6. Recommendation */}
                    <div className="space-y-1.5 md:space-y-3 pt-1 md:pt-2">
                      <label className="text-[10px] text-zinc-100 font-semibold uppercase tracking-widest font-display block">
                        {t('product_detail.recommend_question', { defaultValue: 'Would you recommend this product?' })}
                      </label>
                      <div className="flex gap-2 md:gap-6 space-x-0">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="recommend"
                            checked={recommendProduct === 'yes'}
                            onChange={() => setRecommendProduct('yes')}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${recommendProduct === 'yes' ? 'border-gold-pure bg-gold-pure' : 'border-zinc-700 bg-transparent group-hover:border-zinc-500'}`}>
                            {recommendProduct === 'yes' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span className={`text-xs uppercase tracking-widest font-display ${recommendProduct === 'yes' ? 'text-white' : 'text-zinc-500'}`}>{t('product_detail.yes', { defaultValue: 'Yes' })}</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="recommend"
                            checked={recommendProduct === 'no'}
                            onChange={() => setRecommendProduct('no')}
                            className="hidden"
                          />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${recommendProduct === 'no' ? 'border-gold-pure bg-gold-pure' : 'border-zinc-700 bg-transparent group-hover:border-zinc-500'}`}>
                            {recommendProduct === 'no' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span className={`text-xs uppercase tracking-widest font-display ${recommendProduct === 'no' ? 'text-white' : 'text-zinc-500'}`}>{t('product_detail.no', { defaultValue: 'No' })}</span>
                        </label>
                      </div>
                    </div>

                    {/* Submission Messages */}
                    {submissionStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xs flex items-center gap-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-200">
                          {t('product_detail.review_success', { defaultValue: 'Thank you for sharing your experience.' })}
                        </span>
                      </motion.div>
                    )}
                    {submissionStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xs flex items-center gap-3"
                      >
                        <X className="w-4 h-4 text-rose-500" />
                        <span className="text-xs text-rose-200">
                          {t('product_detail.review_error', { defaultValue: 'Unable to submit review. Please try again.' })}
                        </span>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || submissionStatus === 'success'}
                      className={`w-full py-4 font-display text-xs font-bold uppercase tracking-[0.2em] rounded-xs transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                        submissionStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-gold-pure'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          {t('product_detail.submitting', { defaultValue: 'SUBMITTING...' })}
                        </>
                      ) : submissionStatus === 'success' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          {t('product_detail.submitted', { defaultValue: 'SUBMITTED' })}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t('product_detail.submit_review_btn', { defaultValue: 'SUBMIT REVIEW' })}
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* SECTION 4: Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 md:mt-24 border-t border-white/5 pt-8 md:pt-16">
            <h2 className="text-white text-lg md:text-2xl font-display uppercase tracking-widest mb-6 md:mb-10 text-center">{t('product_detail.related_products')}</h2>
            
            {relatedProducts.length <= 2 ? (
              /* CASE 1: Standard Fixed Grid (length <= 2) */
              <div className="grid grid-cols-2 gap-[6px] md:grid-cols-3 md:gap-8">
                {relatedProducts.map((rel, idx) => (
                  <RelatedProductCard
                    key={`related-fixed-${rel.id}-${idx}`}
                    rel={rel}
                    onProductSelect={handleCardClick}
                    onAddToCart={onAddToCart}
                    formatCurrency={formatCurrency}
                    t={t}
                    i18n={i18n}
                    className="group bg-transparent"
                  />
                ))}
              </div>
            ) : (
              /* CASE 2: Premium Horizontal Luxury Carousel (length > 2) */
              <>
                <div 
                  ref={carouselRef}
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-[6px] pb-1 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 scroll-smooth overscroll-x-contain focus:outline-none focus:ring-1 focus:ring-gold-pure/30 rounded-xs"
                  role="region"
                  aria-label="Related Products Carousel"
                >
                  {relatedProducts.map((rel, idx) => (
                    <RelatedProductCard
                      key={`related-carousel-${rel.id}-${idx}`}
                      rel={rel}
                      onProductSelect={handleCardClick}
                      onAddToCart={onAddToCart}
                      formatCurrency={formatCurrency}
                      t={t}
                      i18n={i18n}
                      className="group bg-transparent shrink-0 snap-start basis-[46%] max-w-[180px] min-w-[160px] md:shrink md:snap-none md:w-full"
                      data-related-card={true}
                      id={`related-card-${rel.id}`}
                      aria-current={activeIndex === idx ? "true" : undefined}
                    />
                  ))}
                </div>

                {/* Subtle luxury page indicator (hidden when <= 2 products, max 5 indicators) */}
                {relatedProducts.length > 2 && (
                  <div className="flex justify-center items-center space-x-1.5 mt-4 md:hidden" role="tablist" aria-label="Related Products Slide Indicators">
                    {Array.from({ length: totalDots }).map((_, idx) => {
                      const isActive = idx === activeDotIndex;
                      // Determine target slide index for proportional mapping when dots < relatedProducts
                      const targetSlide = relatedProducts.length <= 5 
                        ? idx 
                        : Math.min(Math.round((idx / 4) * (relatedProducts.length - 1)), relatedProducts.length - 1);
                      return (
                        <button
                          key={idx}
                          role="tab"
                          aria-selected={isActive}
                          aria-controls={`related-card-${relatedProducts[targetSlide]?.id}`}
                          aria-label={`Go to slide ${idx + 1}`}
                          onClick={() => handleDotClick(targetSlide)}
                          className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-gold-pure ${
                            isActive ? 'bg-gold-pure w-3' : 'bg-zinc-700 w-1.5'
                          }`}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

interface RelatedProductCardProps {
  rel: Product;
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  formatCurrency: (value: number) => string;
  t: any;
  i18n: any;
  className?: string;
  ['data-related-card']?: boolean;
  id?: string;
  ['aria-current']?: "true" | "false";
}

const RelatedProductCard = React.memo<RelatedProductCardProps>(({
  rel,
  onProductSelect,
  onAddToCart,
  formatCurrency,
  t,
  i18n,
  className = "group bg-transparent",
  'data-related-card': dataRelatedCard,
  id,
  'aria-current': ariaCurrent
}) => {
  return (
    <div
      className={className}
      data-related-card={dataRelatedCard ? "" : undefined}
      id={id}
      aria-current={ariaCurrent}
      role="group"
      aria-roledescription="slide"
      aria-label={i18n.language === 'ar' ? (rel.title_ar || rel.nameAr || rel.name) : (rel.nameEn || rel.name)}
    >
      <div 
        className="w-full aspect-[4/5] mb-4 md:mb-6 overflow-hidden rounded-xs cursor-pointer relative"
        onClick={() => onProductSelect(rel)}
      >
        <ScrollZoomImage
          src={resolveProductImage(rel)}
          alt={rel.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          containerClassName="w-full h-full overflow-hidden absolute inset-0"
          category={rel.category}
          priority={false}
        />
      </div>
      
      <div className="space-y-1.5 md:space-y-2 text-center">
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 block mb-0.5 md:mb-1 font-display">{t(`store.category.${rel.category}`, { defaultValue: rel.category })}</span>
        <h4 
          className="text-white text-xs md:text-sm font-display uppercase tracking-wider cursor-pointer group-hover:text-gold-pure transition-colors line-clamp-1"
          onClick={() => onProductSelect(rel)}
        >
          {i18n.language === 'ar' ? (rel.title_ar || rel.nameAr || t(`products.${rel.id}.name`, { defaultValue: rel.name })) : (rel.nameEn || rel.name)}
        </h4>
        <p className="text-gold-pure font-sans text-base md:text-lg font-light tabular-nums-fix">{formatCurrency(rel.price)} <span className="text-xs md:text-sm">{t('app.sar')}</span></p>
      </div>
      
      <button 
        onClick={() => onAddToCart(rel, 1, 'Standard')}
        className="w-full mt-4 md:mt-6 py-3 md:py-4 min-h-[44px] border border-white/10 text-white font-display text-[10px] uppercase font-bold tracking-[0.2em] rounded-xs transition-all hover:bg-gold-pure hover:text-black hover:border-gold-pure flex items-center justify-center gap-2 cursor-pointer"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        {t('product_detail.quick_add')}
      </button>
    </div>
  );
});

RelatedProductCard.displayName = 'RelatedProductCard';
