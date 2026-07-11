import React, { useState, useEffect } from 'react';
import { BusinessCategory, Product } from './types';
import { PRODUCTS } from './data';

// Centralised registry mapping all local asset paths to their high-quality default fallbacks
export const IMAGE_FALLBACKS: Record<string, string> = {
  // Hero and pillars
  '/src/assets/images/hero-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1600',
  '/src/assets/images/hero-coffee-beans.jpg': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1600',
  '/src/assets/images/hero-interior.jpg': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600',
  '/src/assets/images/pillar-coffee.jpg': 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/pillar-bakery.jpg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/pillar-market.jpg': '/images/market_grocery_official_1781633042972.jpg',
  '/src/assets/images/pillar-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/pillar-thobes.jpg': 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800',

  // Products
  '/src/assets/images/coffee-saffron-latte.jpg': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-saffron-latte-detail.jpg': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-cold-brew.jpg': 'https://images.unsplash.com/photo-151097252790b-af4f42d91015?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-rose-tea.jpg': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/bakery-hoboz.jpg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/bakery-ghoriba.jpg': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/bakery-sambuxa.jpg': 'https://images.unsplash.com/photo-1548907040-4d42b52125f0?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/market-karkadeh.jpg': '/images/market_grocery_official_1781633042972.jpg',
  '/src/assets/images/market-gum-arabic.jpg': '/images/market_grocery_official_1781633042972.jpg',
  '/src/assets/images/fashion-sudanese-toob.jpg': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/fashion-silk-abaya.jpg': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/thobes.jpg': 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/thobes-white-luxury.jpg': 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/thobes-heritage-modern.jpg': 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=800',

  // Branches
  '/src/assets/images/branch-al-hofuf.jpg': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',

  // About us
  '/src/assets/images/about-hq.jpg': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',

  // Blog / Articles
  '/src/assets/images/blog-saffron-ritual.jpg': 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/blog-baking-physics.jpg': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/blog-woven-legacies.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',

  // Scrolltelling / Stages
  '/src/assets/images/scroll-coffee-stage-0.jpg': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/scroll-coffee-stage-1.jpg': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/scroll-coffee-stage-2.jpg': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/scroll-coffee-stage-3.jpg': 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/scroll-bakery.jpg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/scroll-market.jpg': '/images/market_grocery_official_1781633042972.jpg',
  '/src/assets/images/scroll-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400',

  // Portfolio items
  '/src/assets/images/gallery-coffee.jpg': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-bakery.jpg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-croissant.jpg': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-canning.jpg': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-beans-bag.jpg': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-market.jpg': '/images/market_grocery_official_1781633042972.jpg',
};

export const ABSOLUTE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBhMGEwYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q0QUYzNyIgbGV0dGVyLXNwYWNpbmc9IjIiPlpPQUwgQVJUSVNBTkFMPC90ZXh0Pjwvc3ZnPg==';

export function getLatestMarketUploadUrl(): string | null {
  try {
    const raw = localStorage.getItem('zoal_global_image_pool');
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored)) {
        // Find the most recently uploaded custom asset under 'market'
        const marketCustom = stored.find(img => img.category === 'market' && img.source === 'store upload');
        if (marketCustom && marketCustom.url) {
          return marketCustom.url;
        }
      }
    }
  } catch (e) {}

  try {
    const pRaw = localStorage.getItem('zoal_custom_products');
    if (pRaw) {
      const pStored = JSON.parse(pRaw);
      if (Array.isArray(pStored)) {
        // Find the most recently uploaded custom product under 'market'
        const marketP = pStored.find(p => p.category === 'market' && p.images && p.images[0]);
        if (marketP && marketP.images && marketP.images[0]) {
          return marketP.images[0];
        }
      }
    }
  } catch (e) {}

  return null;
}

export function getFallbackImage(src?: string, category?: BusinessCategory): string {
  const customMarketUrl = getLatestMarketUploadUrl();

  // Normalize path pattern
  const normalized = src ? src.replace(/^(\.\.\/)*src\/assets\/images\//, '/src/assets/images/').replace(/^(\.\.\/)*assets\/images\//, '/src/assets/images/') : '';

  const isMarketAsset = category === 'market' || 
                       normalized.includes('market') || 
                       normalized.includes('karkadeh') || 
                       normalized.includes('gum-arabic') || 
                       (src && (
                         src.includes('photo-1542838132-92c53300491e') || 
                         src.includes('photo-1555507036-ab1f4038808a') || 
                         src.includes('photo-1615485290382-441e4d049cb5')
                       ));

  // 1. Strict Protection: If requested category is NOT 'market', prevent BOTH default and custom market images from leaking!
  if (category && category !== 'market') {
    const isTryingToLoadMarket = isMarketAsset || (customMarketUrl && src === customMarketUrl);
    if (isTryingToLoadMarket) {
      switch (category) {
        case 'coffee':
          return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800';
        case 'bakery':
          return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800';
        case 'fashion':
          return 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800';
        case 'thobes':
          return 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800';
        default:
          return ABSOLUTE_PLACEHOLDER;
      }
    }
  }

  // 2. If it is a market asset, prioritize the custom uploaded grocery image
  if (isMarketAsset) {
    if (customMarketUrl) {
      return customMarketUrl;
    }
    return '/images/market_grocery_official_1781633042972.jpg';
  }

  // If category is thobes, enforce a strict fallback that never returns anything other than a Thobe image.
  if (category === 'thobes') {
    if (!src) {
      return 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800';
    }

    // Check if it is a validated Thobe image URL pattern/local path/known IDs
    const lower = src.toLowerCase();
    const isValidThobePattern = 
      lower.includes('thobe') || 
      lower.includes('p1') || 
      lower.includes('p2') || 
      lower.includes('photo-1528459801416') || 
      lower.includes('photo-1620799140408') || 
      lower.includes('photo-1593030761757');

    if (isValidThobePattern) {
      return src;
    }

    // Allow custom base64 or blob uploaded specifically for Thobes
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    // Re-use normalized paths
    if (IMAGE_FALLBACKS[normalized] && (normalized.includes('thobe') || normalized.includes('p1') || normalized.includes('p2'))) {
      return IMAGE_FALLBACKS[normalized];
    }
    
    // Try matching filename
    const filename = src.split('/').pop()?.toLowerCase();
    if (filename && (filename.includes('thobe') || filename.includes('p1') || filename.includes('p2'))) {
      const foundKey = Object.keys(IMAGE_FALLBACKS).find(k => k.toLowerCase().endsWith(filename) && (k.includes('thobe') || k.includes('p1') || k.includes('p2')));
      if (foundKey) return IMAGE_FALLBACKS[foundKey];
    }

    // Absolutely no images from other categories are allowed under Thobes. Fall back to secure Unsplash Thobes.
    return 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800';
  }

  if (!src) return ABSOLUTE_PLACEHOLDER;
  if (IMAGE_FALLBACKS[src]) return IMAGE_FALLBACKS[src];

  // Use normalized path variations
  if (IMAGE_FALLBACKS[normalized]) return IMAGE_FALLBACKS[normalized];

  // Try matching by raw filename (case-insensitive)
  const filename = src.split('/').pop()?.toLowerCase();
  if (filename) {
    const foundKey = Object.keys(IMAGE_FALLBACKS).find(k => k.toLowerCase().endsWith(filename));
    if (foundKey) return IMAGE_FALLBACKS[foundKey];
  }

  return src;
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  category?: BusinessCategory;
  forceCover?: boolean;
}

export function SafeImage({ src, alt, className, containerClassName, category, forceCover, ...props }: SafeImageProps) {
  // Standard sync-state derivation to solve the category switching cached image flash problem
  const [prevSrc, setPrevSrc] = useState<string | undefined>(src);
  const [prevCategory, setPrevCategory] = useState<BusinessCategory | undefined>(category);
  const [currentSrc, setCurrentSrc] = useState<string>(getFallbackImage(src, category));
  const [errorCount, setErrorCount] = useState<number>(0);

  if (src !== prevSrc || category !== prevCategory) {
    setPrevSrc(src);
    setPrevCategory(category);
    setCurrentSrc(getFallbackImage(src, category));
    setErrorCount(0);
  }

  const handleError = () => {
    if (errorCount === 0) {
      setErrorCount(1);
      const fallback = getFallbackImage(src, category);
      if (currentSrc !== fallback) {
        setCurrentSrc(fallback);
        return;
      }
    }
    setErrorCount(2);
    setCurrentSrc(category === 'thobes' ? 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=800' : ABSOLUTE_PLACEHOLDER);
  };

  const isMarket = !forceCover && (category === 'market' || 
                   (src && (src.toLowerCase().includes('market') || src.toLowerCase().includes('grocery'))) ||
                   (currentSrc && (currentSrc.toLowerCase().includes('market') || currentSrc.toLowerCase().includes('grocery'))));

  const customContainerStyle: React.CSSProperties = isMarket ? {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  } : {};

  const customImgStyle: React.CSSProperties = isMarket ? {
    objectFit: 'contain',
    transform: 'none',
    transition: 'none',
  } : {};

  let finalImgClass = className || "w-full h-full object-cover";
  if (isMarket) {
    if (finalImgClass.includes('object-cover')) {
      finalImgClass = finalImgClass.replace('object-cover', 'object-contain');
    } else if (!finalImgClass.includes('object-contain')) {
      finalImgClass = `${finalImgClass} object-contain`;
    }
    // Remove hover scales completely from className
    finalImgClass = finalImgClass
      .replace(/scale-\d+\b/g, 'scale-100')
      .replace(/scale-\[\d+\.?\d*\]/g, 'scale-100')
      .replace(/group-hover:scale-\[\d+\.?\d*\]/g, 'group-hover:scale-100')
      .replace(/group-hover:scale-\d+\b/g, 'group-hover:scale-100')
      .replace(/hover:scale-\d+\b/g, 'hover:scale-100');
  }

  return (
    <div 
      className={containerClassName || "w-full h-full relative overflow-hidden"}
      style={customContainerStyle}
    >
      <img
        src={currentSrc || undefined}
        alt={alt || "ZOAL Artisanal Asset"}
        onError={handleError}
        loading="lazy"
        className={`transition-all duration-500 ease-out ${finalImgClass}`}
        style={customImgStyle}
        {...props}
      />
    </div>
  );
}

// -------------------------------------------------------------
// UNIFIED GLOBAL IMAGE POOL & METADATA MANAGEMENT
// -------------------------------------------------------------

export interface GlobalImage {
  id: string;
  url: string;
  category: BusinessCategory;
  title?: string;
  source: 'store upload' | 'brand default';
}

export const DEFAULT_BRAND_POOL: GlobalImage[] = [
  { id: 'bd1', url: '/src/assets/images/gallery-coffee.jpg', category: 'coffee', title: 'Geisha Extraction Ritual', source: 'brand default' },
  { id: 'bd2', url: '/src/assets/images/gallery-bakery.jpg', category: 'bakery', title: 'Sudanese Traditional Hoboz Bread', source: 'brand default' },
  { id: 'bd3', url: '/src/assets/images/gallery-fashion.jpg', category: 'fashion', title: 'Royal Handwoven Silk Toob', source: 'brand default' },
  { id: 'bd4', url: '/src/assets/images/thobes.jpg', category: 'thobes', title: 'Exclusive Sudanese Thobes Chambers', source: 'brand default' },
  { id: 'bd5', url: '/images/market_grocery_official_1781633042972.jpg', category: 'market', title: 'Kordofan Hibiscus Calyces Selection', source: 'brand default' },
  { id: 'bd6', url: '/src/assets/images/gallery-canning.jpg', category: 'coffee', title: 'Nitrogen Cold-Brew Canning Ritual', source: 'brand default' },
  { id: 'bd7', url: '/src/assets/images/bakery-ghoriba.jpg', category: 'bakery', title: 'Handcrafted Sudanese Sweets & Ghoriba', source: 'brand default' },
  { id: 'bd8', url: '/images/market_grocery_official_1781633042972.jpg', category: 'market', title: 'Golden Hasab Gum Arabic Selection', source: 'brand default' },
  { id: 'bd9', url: '/src/assets/images/thobes-white-luxury.jpg', category: 'thobes', title: 'White Bespoke Luxury Thobe', source: 'brand default' },
  { id: 'bd10', url: '/src/assets/images/thobes-heritage-modern.jpg', category: 'thobes', title: 'Heritage Modern Tailored Thobe', source: 'brand default' },
  { id: 'bd11', url: '/src/assets/images/fashion-sudanese-toob.jpg', category: 'fashion', title: 'Traditional Sudanese Handcrafted Toob', source: 'brand default' },
  { id: 'bd12', url: '/src/assets/images/fashion-silk-abaya.jpg', category: 'fashion', title: 'Royal Premium Silk Abaya', source: 'brand default' },
];

// Read dynamic upload lists and cache updates
const poolChangeListeners = new Set<() => void>();

function notifyPoolListeners() {
  poolChangeListeners.forEach(fn => fn());
}

export function getGlobalImagePool(categoryFilter?: BusinessCategory): GlobalImage[] {
  let stored: GlobalImage[] = [];
  try {
    const raw = localStorage.getItem('zoal_global_image_pool');
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse dynamic image pool:', e);
  }

  // Scan products set for images to maintain single-source integrity
  const productPool: GlobalImage[] = [];
  PRODUCTS.forEach((p) => {
    if (Array.isArray(p.images)) {
      p.images.forEach((imgUrl, idx) => {
        if (imgUrl) {
          const existsInDefaults = DEFAULT_BRAND_POOL.some(item => item.url === imgUrl);
          const existsInStoredList = stored.some(item => item.url === imgUrl);
          const existsInPendingPool = productPool.some(item => item.url === imgUrl);
          if (!existsInDefaults && !existsInStoredList && !existsInPendingPool) {
            productPool.push({
              id: `product-${p.id}-${idx}`,
              url: imgUrl,
              category: p.category,
              title: p.name + (p.images.length > 1 ? ` (Perspective ${idx + 1})` : ''),
              source: 'store upload'
            });
          }
        }
      });
    }
  });

  const fullPool = [...DEFAULT_BRAND_POOL, ...stored, ...productPool];

  // Map each item in fullPool through getFallbackImage to apply live overrides for market!
  const mappedPool = fullPool.map(img => ({
    ...img,
    url: getFallbackImage(img.url, img.category)
  }));

  if (categoryFilter) {
    const filteredPool = mappedPool.filter(img => img.category === categoryFilter);
    if (categoryFilter === 'thobes') {
      console.log('[Thobes Pool Debug] Loaded and confirmed isolated thobes image pool (no cross-category leakage):', filteredPool.map(img => img.url));
    }
    return filteredPool;
  }

  return mappedPool;
}

export function uploadImageToStore(url: string, category: BusinessCategory, title?: string): GlobalImage {
  const cleanId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const titleText = title || `Bespoke Selection ${category.toUpperCase()}`;
  
  const newAsset: GlobalImage = {
    id: cleanId,
    url,
    category,
    title: titleText,
    source: 'store upload'
  };

  // 1. Save to custom images
  let stored: GlobalImage[] = [];
  try {
    const raw = localStorage.getItem('zoal_global_image_pool');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  stored.unshift(newAsset);
  localStorage.setItem('zoal_global_image_pool', JSON.stringify(stored));

  // 2. Automatically generate corresponding custom Product inside Store section to maintain absolute reusability
  let customProducts: Product[] = [];
  try {
    const raw = localStorage.getItem('zoal_custom_products');
    if (raw) customProducts = JSON.parse(raw);
  } catch (e) {}

  const newCustomProduct: Product = {
    id: `custom-prod-${cleanId}`,
    name: titleText,
    description: `An exclusive addition to our ${category} menu. Premium handcrafted collection.`,
    subDescription: 'Bespoke Merchant Asset Curation',
    price: 150 + Math.floor(Math.random() * 200), // realistic premium pricing
    category,
    images: [url],
    specifications: {
      'Sourcing': 'Hand-selected boutique import',
      'Integrity Assurance': 'Verified by ZOAL',
      'Format': 'Bespoke custom order'
    },
    story: `This exclusive asset was added directly to our unified digital collection. Available dynamically as a premium order option across both our digital interfaces and flagship hospitality lounges.`,
    rating: 5.0,
    reviews: [],
    inventory: 25,
    popular: true
  };

  customProducts.unshift(newCustomProduct);
  localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));

  notifyPoolListeners();
  return newAsset;
}

export function deleteImageFromStore(id: string) {
  // 1. Delete asset from image pool
  let stored: GlobalImage[] = [];
  try {
    const raw = localStorage.getItem('zoal_global_image_pool');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  stored = stored.filter(item => item.id !== id);
  localStorage.setItem('zoal_global_image_pool', JSON.stringify(stored));

  // 2. Delete corresponding product from custom products
  let customProducts: Product[] = [];
  try {
    const raw = localStorage.getItem('zoal_custom_products');
    if (raw) customProducts = JSON.parse(raw);
  } catch (e) {}

  customProducts = customProducts.filter(p => !p.id.endsWith(id));
  localStorage.setItem('zoal_custom_products', JSON.stringify(customProducts));

  notifyPoolListeners();
}

/**
 * Reactive global hook subscribing components to live updates from the Unified Image Pool
 */
export function useGlobalImages(categoryFilter?: BusinessCategory) {
  const [images, setImages] = useState<GlobalImage[]>(() => getGlobalImagePool(categoryFilter));

  useEffect(() => {
    const handleUpdate = () => {
      setImages(getGlobalImagePool(categoryFilter));
    };
    poolChangeListeners.add(handleUpdate);
    return () => {
      poolChangeListeners.delete(handleUpdate);
    };
  }, [categoryFilter]);

  return images;
}

/**
 * Reactive hook merging static and custom products continuously
 */
export function useGlobalProducts(): Product[] {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  useEffect(() => {
    const readProducts = () => {
      try {
        const raw = localStorage.getItem('zoal_custom_products');
        if (raw) {
          setCustomProducts(JSON.parse(raw));
        } else {
          setCustomProducts([]);
        }
      } catch (e) {
        setCustomProducts([]);
      }
    };

    readProducts(); // Initial read
    poolChangeListeners.add(readProducts);
    return () => {
      poolChangeListeners.delete(readProducts);
    };
  }, []);

  return [...customProducts, ...PRODUCTS];
}
