import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Heart, ShoppingBag, Eye, X 
} from 'lucide-react';
import { Product, BusinessCategory } from '../types';
import ScrollZoomImage from './ScrollZoomImage';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SafeImage, useGlobalProducts, useGlobalImages, resolveProductImage, normalizeCategory } from '../imageRegistry';
import { formatCurrency } from '../utils';

interface StoreProps {
  onProductSelect: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  onToggleWishlist: (productId: string) => void;
  wishlist: string[];
  initialCategoryFilter?: string;
}

export default React.memo(function Store({
  onProductSelect,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  initialCategoryFilter = 'all'
}: StoreProps) {
  const renderTime = performance.now();
  console.count("[Audit] Store render");
  console.log(`[Audit] Store rendering. time: ${renderTime.toFixed(2)}ms`);

  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(initialCategoryFilter);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'best_sellers' | 'rating' | 'price-low' | 'price-high'>('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');

  // Premium button state locks & visual indicators in Store
  const [addingId, setAddingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Hook subscriptions
  const allProducts = useGlobalProducts();
  const globalImages = useGlobalImages();

  console.log(`[Audit] Store hook products: ${allProducts.length}, time: ${performance.now().toFixed(2)}ms`);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const categories = useMemo(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_categories');
      if (raw) {
        const parsed = JSON.parse(raw);
        const published = parsed.filter((c: any) => c.status === 'Published' || c.status === undefined);
        if (published.length > 0) {
          return [
            { id: 'all', name: t('store.category.all'), featuredImage: undefined },
            ...published.map((c: any) => {
              const catId = c.slug || c.id;
              const key = `store.category.${catId}`;
              const hasKey = i18n.exists(key);
              let localizedName = hasKey ? t(key) : '';
              if (!localizedName) {
                localizedName = isAr ? (c.nameAr || c.name_ar || c.name) : (c.nameEn || c.name);
              }
              return { 
                id: catId, 
                name: localizedName,
                featuredImage: c.featuredImage || c.bannerImage || c.image || c.imageUrl
              };
            })
          ];
        }
      }
    } catch (e) {}
    return [
      { id: 'all', name: t('store.category.all'), featuredImage: undefined },
      { id: 'coffee', name: t('store.category.coffee'), featuredImage: undefined },
      { id: 'bakery', name: t('store.category.bakery'), featuredImage: undefined },
      { id: 'market', name: t('store.category.market'), featuredImage: undefined },
      { id: 'fashion', name: t('store.category.fashion'), featuredImage: undefined },
      { id: 'thobes', name: t('store.category.thobes'), featuredImage: undefined },
    ];
  }, [t, isAr, i18n]);

  const brandsList = useMemo(() => {
    try {
      const raw = localStorage.getItem('zoal_admin_brands');
      if (raw) {
        const parsed = JSON.parse(raw);
        const published = parsed.filter((b: any) => b.status === 'Published' || b.status === undefined || b.featuredToggle);
        return [
          { id: 'all', name: t('store.all_brands', { defaultValue: 'All Brands' }) },
          ...published.map((b: any) => ({ id: b.name, name: b.name }))
        ];
      }
    } catch (e) {}
    return [
      { id: 'all', name: t('store.all_brands', { defaultValue: 'All Brands' }) },
      { id: 'ZOAL Specialty Roasters', name: 'ZOAL Specialty Roasters' },
      { id: 'Sudan Bakery Heritage', name: 'Sudan Bakery Heritage' },
      { id: 'Kordofan Organic Co.', name: 'Kordofan Organic Co.' },
      { id: 'Artisan Sudanese Weaves', name: 'Artisan Sudanese Weaves' }
    ];
  }, [t]);

  const PRESET_ASSETS = [
    {
      category: 'coffee' as BusinessCategory,
      title: 'Premium Shaken Obsidian Espresso',
      url: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'bakery' as BusinessCategory,
      title: 'Freshly-Fired Saj-Oven Flatbread',
      url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'market' as BusinessCategory,
      title: 'Finely-Sifted Kordofan Hibiscus Buds',
      url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'fashion' as BusinessCategory,
      title: 'Atelier Royal Silk Emerald Abaya',
      url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800'
    },
    {
      category: 'thobes' as BusinessCategory,
      title: 'Premium White Silk Thobe',
      url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800'
    }
  ];

  // Sync category filter if received as a prop
  React.useEffect(() => {
    if (initialCategoryFilter) {
      setActiveCategory(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Compute filtered & sorted product list with strict validation of elements
  const filteredProducts = useMemo(() => {
    const rawFiltered = allProducts.filter((product) => {
      const matchSearch =
        (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.story || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = activeCategory === 'all' || normalizeCategory(product.category) === normalizeCategory(activeCategory);
      const matchFilter = 
        activeFilter === 'all' ||
        (activeFilter === 'in_stock' && product.inventory > 0) ||
        (activeFilter === 'featured' && (product.isFeatured || product.is_featured || product.featured)) ||
        (activeFilter === 'popular' && (product.isPopular || product.is_popular || product.popular)) ||
        (activeFilter === 'new_arrivals' && (product.isNewArrival || product.is_new_arrival)) ||
        (activeFilter === 'latest' && (product.isNewArrival || product.is_new_arrival)) ||
        (activeFilter === 'best_sellers' && (product.isBestSeller || product.is_best_seller)) ||
        (activeFilter === 'recommended' && (product.isRecommended || product.is_recommended)) ||
        (activeFilter === 'limited_edition' && (product.isLimitedEdition || product.is_limited_edition)) ||
        (activeFilter === 'seasonal' && (product.isSeasonal || product.is_seasonal)) ||
        (activeFilter === 'staff_pick' && (product.isStaffPick || product.is_staff_pick)) ||
        (activeFilter === 'luxury_choice' && (product.isLuxuryChoice || product.is_luxury_choice));

      return matchSearch && matchCategory && matchFilter;
    });

    return rawFiltered.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'featured') return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      if (sortBy === 'newest') return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      if (sortBy === 'best_sellers') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return 0; // Default sorting
    });
  }, [allProducts, searchTerm, activeCategory, activeFilter, sortBy]);

  // Determine standard configuration options per category
  const getProductOptions = (category: BusinessCategory) => {
    switch (category) {
      case 'coffee': return ['Whole Beans', 'Infused Ground', 'Fine Roasted Espresso'];
      case 'bakery': return ['Fresh Baked Daily Lot', 'Sealed Presentation Pack'];
      case 'market': return ['Standard Burlap Bag', 'Hermetically Sealed Tin (+0.00 SAR)'];
      case 'fashion': return ['Standard Fit drape (4.5m)', 'Premium Presentation Box (+0.00 SAR)'];
      case 'thobes': return ['Standard Fit', 'Tailored Fit (+0.00 SAR)'];
      default: return ['Standard Luxury Pack'];
    }
  };

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

  const handleQuickViewOpen = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const opts = getProductOptions(product.category);
    setSelectedOption(opts[0]);
    setQuickViewProduct(product);
  };

  // Compute active category details and banner image dynamically
  const categoryHeaderDetails = useMemo(() => {
    if (activeCategory === 'all') return null;

    // Get live image for category, prioritizing custom uploader
    const catImages = globalImages.filter((img) => img.category === activeCategory);
    const customUpload = catImages.find((img) => img.source === 'store upload');
    let imgUrl = customUpload ? customUpload.url : '';

    if (!imgUrl) {
      try {
        const raw = localStorage.getItem('zoal_admin_categories');
        if (raw) {
          const parsed = JSON.parse(raw);
          const matched = parsed.find((c: any) => (c.slug || c.id) === activeCategory);
          if (matched && (matched.bannerImage || matched.featuredImage || matched.image)) {
            imgUrl = matched.bannerImage || matched.featuredImage || matched.image;
          }
        }
      } catch (e) {}
    }

    if (!imgUrl) {
      switch (activeCategory) {
        case 'coffee':
          imgUrl = 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=1200';
          break;
        case 'bakery':
          imgUrl = '/images/collections/bakery.jpeg';
          break;
        case 'market':
          imgUrl = '/images/collections/market.jpeg';
          break;
        case 'fashion':
          imgUrl = '/images/collections/premium.jpeg';
          break;
        case 'thobes':
          imgUrl = '/images/collections/thobes.jpeg';
          break;
      }
    }

    const detailsMap: Record<string, { title: string; subtitle: string; desc: string }> = {
      coffee: {
        title: t('scroll.c_t', { defaultValue: 'Crafted for Every Moment' }),
        subtitle: isAr ? 'بيت القهوة - COFFEE HOUSE' : 'COFFEE HOUSE',
        desc: t('scroll.c_d', { defaultValue: 'Premium specialty coffee made from carefully selected beans, delivering rich flavor, refined quality, and the true spirit of Arabian hospitality in every cup.' })
      },
      bakery: {
        title: t('scroll.b_t', { defaultValue: 'Crafted with Heritage Baked to Perfection' }),
        subtitle: isAr ? 'المخبوزات والوجبات الخفيفة - BAKERY & SNACKS' : 'BAKERY & SNACKS',
        desc: t('scroll.b_d', { defaultValue: 'From authentic Hoboz bread to handcrafted pastries, premium biscuits, and traditional sweets—every creation reflects timeless recipes and exceptional quality.' })
      },
      market: {
        title: t('scroll.m_t', { defaultValue: 'Fresh Essentials Every Day' }),
        subtitle: isAr ? 'السوق والبقالة - MARKET & GROCERY' : 'MARKET & GROCERY',
        desc: t('scroll.m_d', { defaultValue: 'Discover premium groceries, fresh ingredients, daily essentials, beverages, snacks, and household products carefully selected for quality and convenience.' })
      },
      fashion: {
        title: t('scroll.f_t', { defaultValue: 'Fashion & Beauty' }),
        subtitle: isAr ? 'المجموعات الفاخرة - PREMIUM COLLECTIONS' : 'PREMIUM COLLECTIONS',
        desc: t('scroll.f_d', { defaultValue: "Discover Sudanese fashion, elegant women's wear, abayas, modest wear, traditional men's attire, cosmetics, perfumes, and carefully selected beauty essentials for every occasion." })
      },
      thobes: {
        title: t('scroll.t_t', { defaultValue: 'Timeless Sudanese Style' }),
        subtitle: isAr ? 'الثياب وملابس رجالية - THOBES & MEN\'S WEAR' : "THOBES & MEN'S WEAR",
        desc: t('scroll.t_d', { defaultValue: "Discover authentic Sudanese thobes and traditional men's attire, carefully selected for comfort, quality, and timeless elegance." })
      }
    };

    return {
      ...(detailsMap[activeCategory] || { title: activeCategory.toUpperCase(), subtitle: activeCategory.toUpperCase(), desc: '' }),
      img: imgUrl
    };
  }, [activeCategory, globalImages, isAr, t]);

  return (
    <div className="bg-black text-white min-h-screen pt-[60px] md:pt-[80px] pb-10 md:pb-16">
      
      {/* Decorative Gold Header Aura */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[200px] gold-glow-orb opacity-5 pointer-events-none" />
 
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        
        {/* Compact Elegant Header */}
        <div className="text-left rtl:text-right mb-1 md:mb-2.5">
          <div className="inline-flex items-center gap-1 mb-0.5 md:mb-1 justify-start rtl:justify-end">
            <span className="w-1 h-1 rounded-full bg-gold-pure" />
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-display text-gold-pure uppercase font-medium">
              {isAr ? 'المتجر' : 'STORE'}
            </span>
          </div>
          <h1 className="text-[15px] md:text-[22px] lg:text-[24px] font-medium tracking-[0.02em] leading-tight md:leading-[1.1] font-display text-white normal-case">
            {isAr ? 'اكتشف المنتجات' : 'Discover Products'}
          </h1>
        </div>

        {/* Filter bars / Search tools */}
        <div className="bg-[#030303] sm:bg-glass border border-white/5 rounded-sm px-1 pt-1.5 pb-0.5 md:p-3.5 mb-1 md:mb-3.5 space-y-0.5 md:space-y-2.5 relative z-30">
          
          {/* Combined Toolbar: Search Box + Filters on Desktop/Tablet */}
          <div className="flex flex-row items-center gap-1.5 md:gap-3 w-full">
            {/* Search Box */}
            <div className="w-[70%] md:w-auto md:flex-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('store.search')}
                aria-label={t('store.search_aria', { defaultValue: 'Search for products' })}
                className="w-full pl-9 pr-4 h-9 md:h-11 bg-black/60 border border-white/5 rounded-sm text-xs md:text-sm placeholder-zinc-500 focus:outline-none focus:border-gold-pure focus:ring-1 focus:ring-gold-pure/30 text-white transition-all duration-300 rtl:pr-9 rtl:pl-4 rtl:text-right"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filters & Sorting Controls */}
            <div className="w-[30%] md:w-auto flex items-center space-x-1.5 md:space-x-3 rtl:space-x-reverse justify-end shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label={t('store.sort.label', { defaultValue: 'Sort products' })}
                className="w-full bg-black border border-white/5 rounded-sm text-[10px] md:text-[11px] text-zinc-400 py-1 md:py-2 px-1.5 md:px-2.5 focus:outline-none focus:border-gold-pure/40 rtl:text-right h-9 md:h-11 min-w-[95px] max-w-[120px] md:min-w-[180px] md:max-w-none"
              >
                <option value="featured">{t('store.sort.featured')}</option>
                <option value="newest">{t('store.sort.newest')}</option>
                <option value="best_sellers">{t('store.sort.best_sellers')}</option>
                <option value="rating">{t('store.sort.rating')}</option>
                <option value="price-low">{t('store.sort.price_low')}</option>
                <option value="price-high">{t('store.sort.price_high')}</option>
              </select>
            </div>
          </div>

          {/* Results count & Browse Categories indicator */}
          <div className="flex justify-between items-center text-[8.5px] md:text-[10px] tracking-[0.15em] text-zinc-500 uppercase border-t border-white/5 pt-2 md:pt-3.5 mt-2 md:mt-3.5 mb-[4px] md:mb-0">
            <span className="font-semibold text-gold-pure/90">{isAr ? 'تصفح الفئات' : 'Browse Categories'}</span>
            <span className="text-zinc-500 font-medium">
              {filteredProducts.length} {isAr ? 'نتائج تم العثور عليها' : 'RESULTS FOUND'}
            </span>
          </div>

          {/* Category Cards */}
          <div className="flex flex-nowrap md:grid md:grid-cols-6 gap-1.5 md:gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 category-scroll-indicator snap-x snap-mandatory touch-pan-x pt-0 md:pt-1">
            {categories.map((cat, index) => {
              const imgMap: Record<string, string> = {
                all: '/assets/categories/all.webp',
                coffee: '/assets/categories/coffee.webp',
                bakery: '/assets/categories/bakery.webp',
                market: '/assets/categories/market.webp',
                fashion: '/assets/categories/fashion.webp',
                thobes: '/assets/categories/thobes.webp'
              };
              
              const imgSrc = (cat as any).featuredImage || imgMap[cat.id] || imgMap.all;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (cat.id !== 'all') {
                      setSearchTerm('');
                    }
                  }}
                  aria-label={t('store.category.aria_label', { name: cat.name, defaultValue: `View ${cat.name} collection` })}
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-center justify-center h-[64px] sm:h-[88px] lg:h-[100px] w-[150px] md:w-full flex-none md:flex-initial shrink-0 snap-start gap-1.5 sm:gap-2.5 lg:gap-4 px-1.5 sm:px-3 rounded-sm border transition-all duration-500 overflow-hidden cursor-pointer ${
                    isActive
                      ? 'bg-[#111] border-gold-pure/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                      : 'bg-zinc-950/40 border-white/5 hover:border-gold-pure/20 hover:bg-[#0a0a0a]'
                  }`}
                >
                  {/* Background Image filling the card perfectly */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={imgSrc || undefined} 
                      alt={cat.name} 
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                      decoding="sync"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/branding/zoal-logo-4.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 transition-opacity duration-300 group-hover:bg-black/50" />
                  </div>

                  <span 
                    style={(() => {
                      switch (index) {
                        case 0:
                          return {
                            marginBottom: '-68px',
                            fontWeight: 'bold'
                          };
                        case 1:
                          return {
                            marginBottom: '-68px',
                            fontWeight: 'bold',
                            color: '#9f9fa9'
                          };
                        case 2:
                          return {
                            fontWeight: 'bold',
                            marginBottom: '-68px',
                            height: '24px'
                          };
                        case 3:
                          return {
                            marginBottom: '-66px',
                            fontWeight: 'bold',
                            height: '24px'
                          };
                        case 4:
                          return {
                            marginBottom: '-68px',
                            fontWeight: 'bold',
                            width: '140.667px',
                            height: '28px'
                          };
                        case 5:
                          return {
                            marginBottom: '-68px',
                            fontWeight: 'bold',
                            height: '32px',
                            width: '110.667px',
                            paddingTop: '0px',
                            paddingLeft: '0px',
                            paddingRight: '0px',
                            paddingBottom: '0px',
                            marginLeft: '0px',
                            marginTop: '0px',
                            marginRight: '0px'
                          };
                        default:
                          return undefined;
                      }
                    })()}
                    className={`text-[7px] sm:text-[8px] uppercase font-display tracking-[0.2em] relative z-10 transition-colors duration-300 ${
                      isActive ? 'text-gold-pure font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                    } absolute bottom-1.5 sm:relative sm:bottom-auto`}
                  >
                    {cat.name}
                  </span>
                  
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gold-pure/10 to-transparent pointer-events-none z-10" />
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Category Header Banner / Collection Hero Section */}
        {categoryHeaderDetails && (
          <div
            key={`banner-${activeCategory}`}
            className={`mb-1 md:mb-10 relative rounded-sm overflow-hidden border border-white/5 bg-[#000] group ${
              activeCategory === 'market'
                ? 'aspect-[16/9] sm:aspect-[21/9] w-full h-auto min-h-[160px] md:min-h-[340px]'
                : 'h-[96px] md:h-[240px]'
            }`}
          >
            {/* Background image matrix with custom opacity controls */}
            <SafeImage
              src={categoryHeaderDetails.img}
              alt={categoryHeaderDetails.title}
              containerClassName="absolute inset-0 z-0 overflow-hidden"
              className={`w-full h-full select-none pointer-events-none transition-all duration-700 ${
                activeCategory === 'market'
                  ? 'opacity-100 group-hover:brightness-105'
                  : 'opacity-40 group-hover:opacity-50 scale-100 group-hover:scale-[1.02] group-hover:brightness-105'
              }`}
              category={activeCategory as BusinessCategory}
              forceCover={true}
              priority={true}
            />

            {/* Cinematic top-and-bottom gradient plus a soft-light blend mask for rich presence */}
            <div className={`absolute inset-0 z-10 ${
              activeCategory === 'market'
                ? 'bg-gradient-to-t from-black/85 via-black/10 to-black/35'
                : 'bg-gradient-to-t from-black via-black/40 to-transparent'
            }`} />
            {activeCategory !== 'market' && <div className="absolute inset-0 bg-black/10 z-10" />}

            {/* Banner Text Contents */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-3 sm:p-8 text-left max-w-2xl">
              <span className="text-[7.5px] sm:text-[10px] uppercase tracking-[0.4em] text-gold-pure font-bold font-display mb-0.5 sm:mb-2 ml-0.5">
                {categoryHeaderDetails.subtitle}
              </span>
              <h2 className="text-xs sm:text-2xl font-bold tracking-[0.1em] text-white uppercase font-display mb-0.5 sm:mb-2 ml-0.5 select-none">
                {categoryHeaderDetails.title}
              </h2>
              <p className="hidden sm:block text-zinc-400 text-[10px] sm:text-xs tracking-wide max-w-xl font-sans leading-relaxed select-none ml-0.5">
                {categoryHeaderDetails.desc}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic products list grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-white/5 rounded-sm p-8 bg-zinc-950/20">
            <SlidersHorizontal className="w-10 h-10 text-gold-pure/40 mx-auto mb-4 animate-bounce" />
            <span className="font-display text-sm tracking-widest uppercase text-white block mb-2">
              {t('store.no_matching_curations')}
            </span>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto">
              {t('store.clear_filters_desc')}
            </p>
          </div>
        ) : (
          <motion.div 
            key={activeCategory}
            className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-[6px] sm:gap-8 lg:gap-10"
          >
            {filteredProducts.map((product, idx) => {
              const hasInWishlist = wishlist.includes(product.id);
              
              return (
                <motion.div
                  key={product.id}
                  variants={idx < 6 ? {
                    hidden: { opacity: 1, y: 0 },
                    show: { opacity: 1, y: 0, transition: { duration: 0 } }
                  } : {
                    hidden: { opacity: 0, y: 15 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
                  }}
                  onClick={() => onProductSelect(product)}
                  className="group bg-[#060606] border border-white/5 rounded-sm p-0 sm:p-1.5 transition-all duration-500 hover:border-gold-pure/30 cursor-pointer flex flex-col justify-between h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.8)]"
                >
                  
                   {/* Aspect Ratio Box with zoom state */}
                  <div className={`rounded-t-sm sm:rounded-xs overflow-hidden relative bg-black border-b border-white/5 sm:border border-white/5 shrink-0 ${
                    product.category === 'market' ? 'aspect-[16/9]' : 'aspect-square sm:aspect-[4/5]'
                  }`}>
                    
                    {/* Floating popular badge */}
                    {product.popular && (
                      <span className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10 text-[6.5px] sm:text-[9px] uppercase font-display tracking-widest text-black bg-gold-pure font-bold px-1.5 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-gold-dark to-gold-pure select-none">
                        {t('store.popular_choice')}
                      </span>
                    )}

                    <div className={`w-full h-full transition-transform duration-700 ease-out ${
                      product.category === 'market' ? '' : 'group-hover:scale-105'
                    }`}>
                      <SafeImage
                        product={product}
                        alt={product.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : product.name}
                        className={product.category === 'market' ? "w-full h-full object-contain" : "w-full h-full object-cover"}
                        category={normalizeCategory(product.category)}
                        priority={idx < 6}
                      />
                    </div>

                    {/* Interactive Overlay Tools */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3.5 rtl:space-x-reverse">
                      
                      {/* View Button */}
                      <button
                        onClick={(e) => handleQuickViewOpen(product, e)}
                        className="w-10 h-10 rounded-full bg-white text-black hover:bg-gold-pure hover:text-black duration-300 flex items-center justify-center cursor-pointer shadow-lg"
                        title={t('store.quick_view', { defaultValue: 'Quick Preview' })}
                        aria-label={t('store.quick_view_aria', { name: product.name, defaultValue: `Quick preview for ${product.name}` })}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        className={`w-10 h-10 rounded-full duration-300 flex items-center justify-center cursor-pointer shadow-lg ${
                          hasInWishlist ? 'bg-rose-600 text-white' : 'bg-black/60 text-white hover:bg-white hover:text-black'
                        }`}
                        title={hasInWishlist ? t('store.wishlist_remove', { defaultValue: "Remove from wishlist" }) : t('store.wishlist_add', { defaultValue: "Add to wishlist" })}
                        aria-label={hasInWishlist ? t('store.wishlist_remove_aria', { name: product.name, defaultValue: `Remove ${product.name} from wishlist` }) : t('store.wishlist_add_aria', { name: product.name, defaultValue: `Add ${product.name} to wishlist` })}
                        aria-pressed={hasInWishlist}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      {/* Buy Trigger */}
                      <button
                        disabled={addingId === product.id || successId === product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          const pid = product.id;
                          if (addingId === pid || successId === pid) return;
                          
                          setAddingId(pid);
                          const opts = getProductOptions(product.category);
                          
                          setTimeout(() => {
                            onAddToCart(product, 1, opts[0]);
                            setAddingId(null);
                            setSuccessId(pid);
                            setTimeout(() => {
                              setSuccessId(null);
                            }, 1500);
                          }, 600);
                        }}
                        className={`w-10 h-10 rounded-full duration-300 flex items-center justify-center cursor-pointer shadow-lg border transition-all ${
                          successId === product.id
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.45)]'
                            : addingId === product.id
                            ? 'bg-zinc-950 border-white/10 text-zinc-600'
                            : 'bg-black/80 border-white/5 text-white hover:bg-gold-pure hover:border-[#D4AF37] hover:text-black mt-0'
                        }`}
                        title={t('store.add_to_cart_btn', { defaultValue: 'Add to Shopping Bag' })}
                        aria-label={t('store.add_to_cart_aria', { name: product.name, defaultValue: `Add ${product.name} to shopping bag` })}
                        id={`direct-buy-btn-${product.id}`}
                      >
                        {addingId === product.id ? (
                          <svg className="animate-spin h-4.5 w-4.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : successId === product.id ? (
                          <span className="font-bold text-xs">✓</span>
                        ) : (
                          <ShoppingBag className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Card Descriptive details */}
                  <div className="px-2 py-1.5 sm:p-5 text-left rtl:text-right border-t border-white/5 mt-0 sm:mt-2 bg-black/20 flex flex-col justify-between flex-grow">
                    <div>
                      <span className="hidden sm:block text-[8px] uppercase tracking-[0.2em] text-zinc-500 font-display mb-1">
                        {t(`store.category.${product.category}`, { defaultValue: product.category.replace('_', ' ') })}
                      </span>
                      <h3 className="font-display font-medium text-[8.5px] sm:text-[13px] leading-tight sm:leading-normal uppercase tracking-wider sm:tracking-widest text-white group-hover:text-gold-pure duration-300 line-clamp-2 sm:line-clamp-1 mb-0 z-10 relative">
                        {i18n.language === 'ar' ? (product.title_ar || product.nameAr || t(`products.${product.id}.name`, { defaultValue: product.name })) : (product.nameEn || product.name)}
                      </h3>
                      <p className="hidden sm:block text-zinc-500 text-[10px] sm:text-[11px] font-sans mt-2 line-clamp-2 leading-relaxed font-light min-h-[32px]">
                        {i18n.language === 'ar' ? (product.short_description_ar || product.description_ar || t(`products.${product.id}.description`, { defaultValue: product.description })) : (product.shortDescription || product.subDescription || product.description)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-0.5 sm:mt-4 pt-0.5 sm:pt-4 border-t border-white/5">
                      <span className="text-gold-pure font-sans font-medium text-[8.5px] sm:text-[11px] tracking-wide leading-none tabular-nums-fix">
                        {formatCurrency(product.price)} <span className="text-[6.5px] sm:text-[11px]">{t('app.sar')}</span>
                      </span>
                      <div className="flex items-center space-x-1 leading-none">
                        <span className="text-[7.5px] sm:text-[10px] text-zinc-400 font-sans tabular-nums-fix">★ {product.rating}</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}

      </div>

      {/* QUICK VIEW INTEGRATION DRAWERS / MODALS */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-white/10 max-w-2xl w-full rounded-sm overflow-hidden p-6 sm:p-8 shrink-0">
            
            {/* Close Cross */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-gold-pure transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Image Box */}
              <div className="aspect-square rounded-sm overflow-hidden bg-black border border-white/5 h-[260px]">
                <SafeImage
                  product={quickViewProduct}
                  alt={quickViewProduct.category === 'thobes' ? "ZOAL THOBES & MEN'S WEAR" : (i18n.language === 'ar' ? t(`products.${quickViewProduct.id}.name`, { defaultValue: quickViewProduct.name }) : quickViewProduct.name)}
                  className="w-full h-full object-cover"
                  category={normalizeCategory(quickViewProduct.category)}
                />
              </div>

              {/* Information Side */}
              <div className="space-y-4 text-left rtl:text-right">
                <div>
                  <span className="text-[8px] uppercase tracking-widest text-gold-pure font-display px-2 py-0.5 border border-gold-pure/20 rounded-full bg-gold-pure/5">
                    {t(`store.category.${quickViewProduct.category}`, { defaultValue: quickViewProduct.category.replace('_', ' ') })}
                  </span>
                  <h3 className="text-white text-base sm:text-lg font-display uppercase tracking-widest font-semibold mt-2">
                    {i18n.language === 'ar' ? (quickViewProduct.title_ar || quickViewProduct.nameAr || t(`products.${quickViewProduct.id}.name`, { defaultValue: quickViewProduct.name })) : (quickViewProduct.nameEn || quickViewProduct.name)}
                  </h3>
                  <p className="text-gold-pure font-sans text-xs tracking-normal mt-1 tabular-nums-fix">
                    {formatCurrency(quickViewProduct.price)} {t('app.sar')}
                  </p>
                </div>

                <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                  {i18n.language === 'ar' ? (quickViewProduct.short_description_ar || quickViewProduct.description_ar || t(`products.${quickViewProduct.id}.description`, { defaultValue: quickViewProduct.description })) : (quickViewProduct.shortDescription || quickViewProduct.subDescription || quickViewProduct.description)}
                </p>

                {/* Option configurations depending on product type */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest">
                    {t('store.select_premium_setup')}
                  </label>
                  <select
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-full bg-black border border-white/5 text-zinc-300 py-2 px-3 text-xs focus:outline-none focus:border-gold-pure/40"
                  >
                    {getProductOptions(quickViewProduct.category).map((opt) => (
                      <option key={opt} value={opt}>
                        {getLocalizedOption(opt)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Confirm actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    disabled={addingId === quickViewProduct.id || successId === quickViewProduct.id}
                    onClick={() => {
                      const pid = quickViewProduct.id;
                      setAddingId(pid);
                      setTimeout(() => {
                        const finalOpt = selectedOption || getProductOptions(quickViewProduct.category)[0] || 'Standard';
                        onAddToCart(quickViewProduct, 1, finalOpt);
                        setAddingId(null);
                        setSuccessId(pid);
                        setTimeout(() => {
                          setSuccessId(null);
                          setQuickViewProduct(null);
                        }, 1600);
                      }, 750);
                    }}
                    className={`flex-grow py-2.5 font-display text-[9.5px] font-semibold uppercase tracking-widest rounded-xs transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-90 ${
                      successId === quickViewProduct.id
                        ? 'bg-[#D4AF37] text-black shadow-[0_0_12px_rgba(212,175,55,0.35)]'
                        : addingId === quickViewProduct.id
                        ? 'bg-zinc-900 border border-white/5 text-zinc-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold-dark to-gold-pure text-black hover:scale-[1.01]'
                    }`}
                  >
                    {addingId === quickViewProduct.id ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t('product_detail.adding')}</span>
                      </>
                    ) : successId === quickViewProduct.id ? (
                      <span>{t('product_detail.added_label')}</span>
                    ) : (
                      <span>{t('store.add_to_cart', { defaultValue: 'ADD TO SHOPPING BAG' })}</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onProductSelect(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="px-4 py-2.5 border border-white/10 hover:border-gold-pure/30 text-white rounded-xs text-[9.5px] uppercase font-display tracking-widest cursor-pointer"
                  >
                    {t('store.details')}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
});
