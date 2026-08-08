import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { BusinessCategory, Product } from './types';
import { PRODUCTS } from './data';
import { deleteProductFromSupabase, cleanupProductOrphans } from './lib/productSync';

// Centralised registry mapping all local asset paths to their high-quality default fallbacks
export const IMAGE_FALLBACKS: Record<string, string> = {
  // Hero and pillars
  '/src/assets/images/pillar-coffee.jpg': 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=80&w=400',
  '/src/assets/images/pillar-bakery.jpg': '/images/collections/bakery.jpeg',
  '/src/assets/images/pillar-market.jpg': '/images/collections/market.jpeg',
  '/src/assets/images/pillar-fashion.jpg': '/images/collections/premium.jpeg',
  '/src/assets/images/pillar-thobes.jpg': '/images/collections/thobes.jpeg',

  // Products
  '/src/assets/images/coffee-saffron-latte.jpg': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-saffron-latte-detail.jpg': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-cold-brew.jpg': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/coffee-rose-tea.jpg': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/bakery-hoboz.jpg': '/images/collections/bakery.jpeg',
  '/src/assets/images/bakery-ghoriba.jpg': '/images/collections/bakery.jpeg',
  '/src/assets/images/bakery-sambuxa.jpg': '/images/collections/bakery.jpeg',
  '/src/assets/images/market-karkadeh.jpg': '/images/collections/market.jpeg',
  '/src/assets/images/market-gum-arabic.jpg': '/images/collections/market.jpeg',
  '/src/assets/images/fashion-sudanese-toob.jpg': '/images/collections/premium.jpeg',
  '/src/assets/images/fashion-silk-abaya.jpg': '/images/collections/premium.jpeg',
  '/src/assets/images/thobes.jpg': '/images/collections/thobes.jpeg',
  '/src/assets/images/thobes-white-luxury.jpg': '/images/collections/thobes.jpeg',
  '/src/assets/images/thobes-heritage-modern.jpg': '/images/collections/thobes.jpeg',

  // Direct mappings for legacy or uploaded local paths
  '/images/market_grocery_official_1781633042972.jpg': '/images/collections/market.jpeg',
  'market_grocery_official_1781633042972.jpg': '/images/collections/market.jpeg',
  '/images/thoves.1.jpeg': '/images/collections/thobes.jpeg',
  '/thoves.1.jpeg': '/images/collections/thobes.jpeg',
  'thoves.1.jpeg': '/images/collections/thobes.jpeg',
  '/images/thobes.jpg': '/images/collections/thobes.jpeg',
  'thobes.jpg': '/images/collections/thobes.jpeg',

  // Branches
  '/src/assets/images/branch-al-hofuf.jpg': 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800',

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
  '/src/assets/images/scroll-market.jpg': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
  '/src/assets/images/scroll-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1200',

  // Portfolio items
  '/src/assets/images/gallery-coffee.jpg': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-bakery.jpg': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-fashion.jpg': 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-croissant.jpg': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-canning.jpg': 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-beans-bag.jpg': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=800',
  '/src/assets/images/gallery-market.jpg': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
};

export const ABSOLUTE_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBhMGEwYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI0Q0QUYzNyIgbGV0dGVyLXNwYWNpbmc9IjIiPlpPQUwgQVJUSVNBTkFMPC90ZXh0Pjwvc3ZnPg==';

export function cleanUrlString(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw.trim();
  if (cleaned.includes('&#x2F;') || cleaned.includes('&#x2f;')) {
    cleaned = cleaned.replace(/&#x2F;/gi, '/');
  }
  if (cleaned.includes('&amp;')) {
    cleaned = cleaned.replace(/&amp;/gi, '&');
  }
  return cleaned;
}

function isValidCustomUrl(url?: string): boolean {
  if (!url) return false;
  const cleaned = cleanUrlString(url);
  return cleaned.startsWith('http') || cleaned.startsWith('/') || cleaned.startsWith('data:') || cleaned.startsWith('blob:');
}

export function isValidUploadedImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = cleanUrlString(url);
  if (trimmed === '') return false;
  
  // Exclude known hardcoded static fallbacks and placeholders
  if (trimmed === ABSOLUTE_PLACEHOLDER) return false;
  if (trimmed.includes('/images/collections/') && !trimmed.endsWith('.jpeg') && !trimmed.endsWith('.png')) return false;
  if (trimmed.includes('/local/images/hero-placeholder.webp')) return false;

  // Accept valid Supabase public URLs, local assets, blob URLs, data URLs, and remote HTTP/HTTPS URLs
  if (
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') || 
    trimmed.startsWith('/') || 
    trimmed.startsWith('blob:') || 
    trimmed.startsWith('data:') ||
    trimmed.endsWith('.jpg') ||
    trimmed.endsWith('.jpeg') ||
    trimmed.endsWith('.png') ||
    trimmed.endsWith('.webp')
  ) {
    return true;
  }
  
  return false;
}

export function getLatestMarketUploadUrl(): string | null {
  return null;
}

export function getFallbackImage(src?: string, category?: BusinessCategory): string {
  const cleanedSrc = cleanUrlString(src);
  if (isValidUploadedImageUrl(cleanedSrc)) {
    return cleanedSrc;
  }

  // If it's a valid custom URL (Supabase, Blob, Data, or remote HTTP that isn't a legacy local path),
  // we trust it and return it immediately to avoid keyword-based hijacking.
  if (cleanedSrc && isValidCustomUrl(cleanedSrc)) {
    return cleanedSrc;
  }

  // If src is an official local collection asset, return it directly
  if (cleanedSrc && cleanedSrc.startsWith('/images/collections/')) {
    return cleanedSrc;
  }

  if (cleanedSrc && IMAGE_FALLBACKS[cleanedSrc]) {
    return IMAGE_FALLBACKS[cleanedSrc];
  }

  const normalized = cleanedSrc ? cleanedSrc.replace(/^(\.\.\/)*src\/assets\/images\//, '/src/assets/images/').replace(/^(\.\.\/)*assets\/images\//, '/src/assets/images/') : '';
  if (IMAGE_FALLBACKS[normalized]) return IMAGE_FALLBACKS[normalized];

  const filename = cleanedSrc?.split('/').pop()?.toLowerCase();
  if (filename) {
    const foundKey = Object.keys(IMAGE_FALLBACKS).find(k => k.toLowerCase().endsWith(filename));
    if (foundKey) return IMAGE_FALLBACKS[foundKey];
  }

  // Strictly use static category fallback/placeholder, NEVER use getLatestMarketUploadUrl() or dynamic pool.
  const normalizedCat = normalizeCategory(category);
  return getCategoryFallback(normalizedCat);
}

export function normalizeCategory(category?: string | null): BusinessCategory {
  if (!category || typeof category !== 'string') return 'coffee';
  const lower = category.trim().toLowerCase();
  if (lower.includes('coffee') || lower === 'قهوة') return 'coffee';
  if (lower.includes('bakery') || lower.includes('patisserie') || lower === 'مخبوزات') return 'bakery';
  if (lower.includes('market') || lower.includes('grocery') || lower === 'سوق') return 'market';
  if (lower.includes('fashion') || lower.includes('clothing') || lower === 'أزياء' || lower === 'premium collections') return 'fashion';
  if (lower.includes('thobe') || lower.includes('thobes') || lower === 'أثواب') return 'thobes';
  return 'coffee';
}

export function normalizeProductImages<T extends Partial<Product>>(product: T): T {
  if (!product) return product;

  const rawImages = Array.isArray(product.images) 
    ? product.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '') 
    : [];
  const rawImageUrls = Array.isArray(product.image_urls) 
    ? product.image_urls.filter((url): url is string => typeof url === 'string' && url.trim() !== '') 
    : [];
  const rawImage = typeof product.image === 'string' ? product.image.trim() : '';
  const rawImageUrl = typeof product.image_url === 'string' ? product.image_url.trim() : '';

  const images = rawImages.map(cleanUrlString).filter(Boolean);
  const image_urls = rawImageUrls.map(cleanUrlString).filter(Boolean);
  const image = cleanUrlString(rawImage);
  const image_url = cleanUrlString(rawImageUrl);

  // Determine the single most authoritative image url for this product
  let authoritativeUrl = '';
  const validImage0 = images.find(img => isValidUploadedImageUrl(img));
  const validImageUrl0 = image_urls.find(url => isValidUploadedImageUrl(url));

  if (validImage0) {
    authoritativeUrl = validImage0;
  } else if (validImageUrl0) {
    authoritativeUrl = validImageUrl0;
  } else if (image && isValidUploadedImageUrl(image)) {
    authoritativeUrl = image;
  } else if (image_url && isValidUploadedImageUrl(image_url)) {
    authoritativeUrl = image_url;
  } else {
    authoritativeUrl = images[0] || image_urls[0] || image || image_url || '';
  }

  if (authoritativeUrl) {
    const finalImages = images.length > 0 ? images : [authoritativeUrl];
    if (!isValidUploadedImageUrl(finalImages[0]) && isValidUploadedImageUrl(authoritativeUrl)) {
      finalImages[0] = authoritativeUrl;
    }

    return {
      ...product,
      images: finalImages,
      image_urls: finalImages,
      image: authoritativeUrl,
      image_url: authoritativeUrl
    };
  }

  return {
    ...product,
    images: images.length > 0 ? images : (product.images || []),
    image_urls: image_urls.length > 0 ? image_urls : (product.image_urls || []),
    image: image || product.image || '',
    image_url: image_url || product.image_url || ''
  };
}

export function resolveProductImage(
  product?: Partial<Product> | null,
  categoryOverride?: BusinessCategory
): string {
  if (!product) {
    const category = categoryOverride ? normalizeCategory(categoryOverride) : 'coffee';
    return getCategoryFallback(category);
  }

  const category = categoryOverride ? normalizeCategory(categoryOverride) : normalizeCategory(product.category);

  // 1. product.images[0]
  if (Array.isArray(product.images) && product.images.length > 0) {
    const img0 = cleanUrlString(product.images[0]);
    if (img0 && isValidUploadedImageUrl(img0)) {
      return img0;
    }
  }

  // 2. product.image_urls[0]
  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    const url0 = cleanUrlString(product.image_urls[0]);
    if (url0 && isValidUploadedImageUrl(url0)) {
      return url0;
    }
  }

  // 3. product.image
  if (product.image && typeof product.image === 'string') {
    const singleImg = cleanUrlString(product.image);
    if (singleImg && isValidUploadedImageUrl(singleImg)) {
      return singleImg;
    }
  }

  // 4. product.image_url
  if (product.image_url && typeof product.image_url === 'string') {
    const singleUrl = cleanUrlString(product.image_url);
    if (singleUrl && isValidUploadedImageUrl(singleUrl)) {
      return singleUrl;
    }
  }

  // If we have a non-empty string that isn't a valid uploaded image URL (e.g., local fallback or mapping)
  const candidateRaw =
    (Array.isArray(product.images) && cleanUrlString(product.images[0])) ||
    (Array.isArray(product.image_urls) && cleanUrlString(product.image_urls[0])) ||
    cleanUrlString(product.image) ||
    cleanUrlString(product.image_url);

  if (candidateRaw && typeof candidateRaw === 'string') {
    const trimmed = candidateRaw.trim();
    if (trimmed !== '') {
      if (trimmed.startsWith('/images/collections/') || IMAGE_FALLBACKS[trimmed]) {
        return getFallbackImage(trimmed, category);
      }
      const normalized = trimmed.replace(/^(\.\.\/)*src\/assets\/images\//, '/src/assets/images/').replace(/^(\.\.\/)*assets\/images\//, '/src/assets/images/');
      if (IMAGE_FALLBACKS[normalized]) {
        return IMAGE_FALLBACKS[normalized];
      }
      return getFallbackImage(trimmed, category);
    }
  }

  // Strictly return static category fallback if product has no valid/specific image.
  // NEVER return another product's image or any latest uploaded image globally.
  return getCategoryFallback(category);
}

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  category?: BusinessCategory;
  forceCover?: boolean;
  priority?: boolean;
  isHero?: boolean;
  product?: Partial<Product> | null;
}

function optimizeImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('q', '75'); // Lower quality slightly to 75 for massive payload savings
      return u.toString();
    } catch (e) {
      return url;
    }
  }
  return url;
}

type QueueSubscriber = (src: string) => void;

interface QueueItem {
  src: string;
  category?: BusinessCategory;
  backoffIndex: number;
  subscribers: Set<QueueSubscriber>;
  timerId: any;
  activeImageObj: HTMLImageElement | null;
  priority: number;
  visibleSubscriberCount: number;
  abortController: AbortController | null;
  startTime: number;
}

class CentralImageRecoveryQueue {
  private queue: Map<string, QueueItem> = new Map();
  private activeCount = 0;
  private maxConcurrent = 3;
  private delays = [5000, 10000, 20000, 40000, 60000];
  private maxDelay = 120000;
  private metrics = {
    attempts: 0,
    failures: 0,
    successes: 0,
    fallbacks: 0,
    errorCounts: {} as Record<string, number>,
    totalDuration: 0,
    maxDuration: 0,
  };

  public getMetrics() {
    return {
      ...this.metrics,
      averageDuration: this.metrics.successes > 0 ? this.metrics.totalDuration / this.metrics.successes : 0,
    };
  }

  private isPaused = false;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.handleStateChange());
      window.addEventListener('online', () => this.handleStateChange());
      window.addEventListener('beforeunload', () => this.cleanupAll());
    }
  }

  private handleStateChange() {
    if (typeof window === 'undefined') return;
    const shouldPause = document.hidden || !navigator.onLine;
    if (shouldPause) {
      this.pauseAll();
    } else {
      this.resumeAll();
    }
  }

  public updateVisibility(src: string, isVisible: boolean) {
    const item = this.queue.get(src);
    if (!item) return;

    item.visibleSubscriberCount = Math.max(0, item.visibleSubscriberCount + (isVisible ? 1 : -1));
    this.processQueue();
  }

  public register(src: string, category: BusinessCategory | undefined, callback: QueueSubscriber, priority: number = 1) {
    if (!src) return () => {};

    let item = this.queue.get(src);
    if (!item) {
      item = {
        src,
        category,
        backoffIndex: 0,
        subscribers: new Set(),
        timerId: null,
        activeImageObj: null,
        priority,
        visibleSubscriberCount: 0,
        abortController: null,
        startTime: 0
      };
      this.queue.set(src, item);
    }

    item.subscribers.add(callback);
    this.updateVisibility(src, false); // Initialize invisible

    if (!item.timerId && !item.activeImageObj) {
      this.scheduleProbe(item);
    }

    return () => {
      if (!item) return;
      item.subscribers.delete(callback);
      if (item.subscribers.size === 0) {
        this.cancelItem(src);
      }
    };
  }

  private cancelItem(src: string) {
    const item = this.queue.get(src);
    if (item) {
      if (item.timerId) clearTimeout(item.timerId);
      if (item.abortController) {
        item.abortController.abort();
        item.abortController = null;
      }
      if (item.activeImageObj) {
        item.activeImageObj.onload = null;
        item.activeImageObj.onerror = null;
        item.activeImageObj.src = '';
        item.activeImageObj = null;
        this.activeCount = Math.max(0, this.activeCount - 1);
      }
      this.queue.delete(src);
      this.processQueue();
    }
  }

  private pauseAll() {
    this.isPaused = true;
    for (const item of this.queue.values()) {
      if (item.timerId) {
        clearTimeout(item.timerId);
        item.timerId = null;
      }
      if (item.abortController) {
        item.abortController.abort();
        item.abortController = null;
      }
      if (item.activeImageObj) {
        item.activeImageObj.onload = null;
        item.activeImageObj.onerror = null;
        item.activeImageObj.src = '';
        item.activeImageObj = null;
        this.activeCount = Math.max(0, this.activeCount - 1);
      }
    }
  }

  private resumeAll() {
    this.isPaused = false;
    for (const item of this.queue.values()) {
      if (!item.timerId && !item.activeImageObj) {
        this.scheduleProbe(item);
      }
    }
    this.processQueue();
  }

  private scheduleProbe(item: QueueItem) {
    if (this.isPaused) return;
    if (item.timerId) clearTimeout(item.timerId);

    const delayIndex = Math.min(item.backoffIndex, this.delays.length - 1);
    const delay = item.backoffIndex < this.delays.length ? this.delays[delayIndex] : this.maxDelay;

    item.timerId = setTimeout(() => {
      item.timerId = null;
      this.processQueue();
    }, delay);
  }

  private processQueue() {
    if (this.isPaused) return;
    if (this.activeCount >= this.maxConcurrent) return;

    const candidates = Array.from(this.queue.values())
      .filter(item => !item.timerId && !item.activeImageObj)
      .filter(item => item.visibleSubscriberCount > 0) // Only process visible
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.backoffIndex - b.backoffIndex;
      });

    for (const item of candidates) {
      if (this.activeCount >= this.maxConcurrent) break;
      this.runProbe(item);
    }
  }

  private handleSuccess(item: QueueItem) {
    this.metrics.successes++;
    const duration = Date.now() - item.startTime;
    this.metrics.totalDuration += duration;
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, duration);

    const subscribers = Array.from(item.subscribers);
    this.queue.delete(item.src);
    this.activeCount = Math.max(0, this.activeCount - 1);
    subscribers.forEach(cb => cb(item.src));
    this.processQueue();
  }

  private async runProbe(item: QueueItem) {
    if (this.isPaused || item.activeImageObj || item.abortController) return;

    this.activeCount++;
    this.metrics.attempts++;
    item.startTime = Date.now();
    const targetUrl = optimizeImageUrl(item.src) || item.src;
    const controller = new AbortController();
    item.abortController = controller;

    let errorType = 'UNKNOWN';
    let shouldRetry = true;

    try {
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(targetUrl, {
        method: 'HEAD',
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (controller.signal.aborted) {
        this.activeCount = Math.max(0, this.activeCount - 1);
        return;
      }

      if (res.ok) {
        item.abortController = null;
        this.handleSuccess(item);
        return;
      }

      const status = res.status;
      if (status === 404) {
        errorType = '404_NOT_FOUND';
        shouldRetry = false; // Never retry 404
      } else if (status === 403) {
        errorType = '403_FORBIDDEN';
        shouldRetry = item.backoffIndex < 1; // Retry once then stop
      } else if (status === 429) {
        errorType = '429_RATE_LIMITED';
      } else if (status >= 500 && status < 600) {
        errorType = '500_SERVER_ERROR';
      } else {
        errorType = `HTTP_${status}`;
      }
    } catch (err: any) {
      if (controller.signal.aborted) {
        this.activeCount = Math.max(0, this.activeCount - 1);
        return;
      }
      if (!navigator.onLine) {
        errorType = 'OFFLINE';
      } else if (err.name === 'AbortError') {
        errorType = 'TIMEOUT';
      } else if (err.message && (err.message.includes('dns') || err.message.includes('failed to fetch'))) {
        errorType = 'DNS_FAILURE';
      } else {
        errorType = 'SUPABASE_OR_CLOUDFLARE_ERROR';
      }
    }

    item.abortController = null;

    // Store diagnostics internally
    (item as any).lastErrorType = errorType;
    (item as any).lastAttemptTime = Date.now();
    this.metrics.failures++;
    this.metrics.errorCounts[errorType] = (this.metrics.errorCounts[errorType] || 0) + 1;

    if (!shouldRetry || errorType === '404_NOT_FOUND') {
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.queue.delete(item.src);
      this.processQueue();
      return;
    }

    // Fallback to Image verification probe
    const testImg = new Image();
    item.activeImageObj = testImg;

    testImg.onload = () => {
      this.handleSuccess(item);
    };

    testImg.onerror = () => {
      item.activeImageObj = null;
      this.activeCount = Math.max(0, this.activeCount - 1);
      item.backoffIndex++;

      this.scheduleProbe(item);
      this.processQueue();
    };

    testImg.src = targetUrl;
  }

  private cleanupAll() {
    for (const item of this.queue.values()) {
      if (item.timerId) clearTimeout(item.timerId);
      if (item.abortController) {
        item.abortController.abort();
        item.abortController = null;
      }
      if (item.activeImageObj) {
        item.activeImageObj.onload = null;
        item.activeImageObj.onerror = null;
        item.activeImageObj.src = '';
        item.activeImageObj = null;
      }
    }
    this.queue.clear();
    this.activeCount = 0;
  }
}

export const imageRecoveryQueue = new CentralImageRecoveryQueue();

// Global cache for tracking successfully loaded image URLs
const LOADED_IMAGES_CACHE = new Set<string>();

function isCachedInstantly(url: string): boolean {
  if (!url) return false;
  if (LOADED_IMAGES_CACHE.has(url)) return true;
  if (typeof window === 'undefined') return false;
  try {
    const img = new Image();
    img.src = url;
    if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
      LOADED_IMAGES_CACHE.add(url);
      return true;
    }
  } catch (e) {
    // Fail-safe
  }
  return false;
}

export function getCategoryFallback(category?: BusinessCategory): string {
  switch (category) {
    case 'coffee':
      return '/assets/categories/coffee.webp';
    case 'bakery':
      return '/assets/categories/bakery.webp';
    case 'market':
      return '/assets/categories/market.webp';
    case 'fashion':
      return '/assets/categories/fashion.webp';
    case 'thobes':
      return '/assets/categories/thobes.webp';
    default:
      return ABSOLUTE_PLACEHOLDER;
  }
}

export const SafeImage = React.memo(function SafeImage({
  src,
  alt,
  className,
  containerClassName,
  category,
  forceCover,
  priority,
  isHero,
  product,
  ...props
}: SafeImageProps) {
  // Sync-state derivation to handle prop changes seamlessly
  const [prevSrc, setPrevSrc] = useState<string | undefined>(src);
  const [prevProduct, setPrevProduct] = useState<Partial<Product> | null | undefined>(product);
  const [prevCategory, setPrevCategory] = useState<BusinessCategory | undefined>(category);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Authoritative target URL determination
  const computeTarget = () => {
    if (product) {
      return resolveProductImage(product, category);
    }
    if (isHero) {
      return src && src.trim() !== '' ? src : '/local/images/hero-placeholder.webp';
    }
    if (isValidUploadedImageUrl(src)) {
      return src!.trim();
    }
    return getFallbackImage(src, category);
  };

  const initialTarget = computeTarget();
  const [currentSrc, setCurrentSrc] = useState<string>(initialTarget);
  
  // Pipeline state: 'primary' | 'fallback' | 'placeholder'
  const [loadPhase, setLoadPhase] = useState<'primary' | 'fallback' | 'placeholder'>('primary');
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Pre-calculate optimized image URL
  const optimizedSrc = optimizeImageUrl(currentSrc);
  const isInitiallyCached = isCachedInstantly(optimizedSrc) || isCachedInstantly(currentSrc) || isCachedInstantly(src || '');
  
  // If priority image OR image is cached, start with isLoading = false for immediate paint
  const [isLoading, setIsLoading] = useState<boolean>(!priority && !isInitiallyCached);
  const [showPlaceholder, setShowPlaceholder] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);
  const [renderSkeleton, setRenderSkeleton] = useState<boolean>(false);

  // Reset state on prop changes
  if (src !== prevSrc || product !== prevProduct) {
    setPrevSrc(src);
    setPrevProduct(product);
    setPrevCategory(category);
    const newTarget = computeTarget();
    const newOptimized = optimizeImageUrl(newTarget);
    const isNewCached = isCachedInstantly(newOptimized) || isCachedInstantly(newTarget) || isCachedInstantly(src || '');
    
    setCurrentSrc(newTarget);
    setLoadPhase('primary');
    setRetryCount(0);
    setIsLoading(!priority && !isNewCached);
    setRenderSkeleton(false);
    setShowPlaceholder(false);
  } else if (category !== prevCategory) {
    setPrevCategory(category);
  }

  // Ref-based instant layout-effect cache check before DOM paint
  useLayoutEffect(() => {
    if (imgRef.current) {
      const img = imgRef.current;
      if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
        LOADED_IMAGES_CACHE.add(optimizedSrc);
        LOADED_IMAGES_CACHE.add(currentSrc);
        if (src) LOADED_IMAGES_CACHE.add(src);
        if (isLoading) {
          setIsLoading(false);
          setRenderSkeleton(false);
        }
      }
    }
  }, [optimizedSrc, currentSrc, src, isLoading]);

  // Skeleton grace period (250ms threshold)
  useEffect(() => {
    if (!isLoading) {
      setRenderSkeleton(false);
      return;
    }

    // Wait 250ms before allowing the skeleton loader to be displayed
    const timer = setTimeout(() => {
      setRenderSkeleton(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [isLoading, currentSrc]);

  // Centralised silent background recovery registration via Central Image Recovery Queue
  useEffect(() => {
    if (!src || loadPhase === 'primary') return;

    const unsubscribe = imageRecoveryQueue.register(src, category, (recoveredSrc) => {
      // Original image is successfully preloaded! Trigger smooth crossfade
      setCurrentSrc(recoveredSrc);
      setLoadPhase('primary');
      setRetryCount(0);
      setShowPlaceholder(false);
      setIsLoading(true);
      setRenderSkeleton(false);
      setRetryKey(k => k + 1);
    }, 1);

    // Bypass IntersectionObserver visibility tracking for priority/above-the-fold images as they are immediately visible
    if (priority) {
      imageRecoveryQueue.updateVisibility(src, true);
      return unsubscribe;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        imageRecoveryQueue.updateVisibility(src, entry.isIntersecting);
      });
    }, { threshold: 0.1 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      unsubscribe();
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [src, loadPhase, category, priority]);

  const handleLoad = () => {
    const time = performance.now();
    console.log(`[Audit] SafeImage LOADED. src: ${optimizedSrc || currentSrc || src}, time: ${time.toFixed(2)}ms`);
    LOADED_IMAGES_CACHE.add(optimizedSrc);
    LOADED_IMAGES_CACHE.add(currentSrc);
    if (src) LOADED_IMAGES_CACHE.add(src);
    setIsLoading(false);
    setShowPlaceholder(false);
  };

  const handleError = () => {
    if (isHero) {
      console.warn(`[Audit] SafeImage Hero load failed. src: ${src}`);
      setLoadPhase('placeholder');
      setShowPlaceholder(true);
      setIsLoading(false);
      return;
    }

    if (loadPhase === 'primary') {
      if (retryCount < 2) {
        // Automatic foreground retries (max 2 attempts)
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        setIsLoading(true);
        setTimeout(() => {
          setRetryKey(k => k + 1);
        }, nextRetry * 500);
        return;
      }
      // Move to Category Fallback Image
      let fallbackUrl = getFallbackImage(src, category);
      if (fallbackUrl === currentSrc) {
        fallbackUrl = getCategoryFallback(category);
      }
      if (fallbackUrl && fallbackUrl !== currentSrc) {
        setLoadPhase('fallback');
        setRetryCount(0);
        setCurrentSrc(fallbackUrl);
        setIsLoading(true);
        setRetryKey(k => k + 1);
        return;
      }
    } else if (loadPhase === 'fallback') {
      if (retryCount < 1) {
        const nextRetry = retryCount + 1;
        setRetryCount(nextRetry);
        setIsLoading(true);
        setTimeout(() => {
          setRetryKey(k => k + 1);
        }, 800);
        return;
      }
    }

    // Every attempt failed: display Premium Luxury Placeholder & rely on Silent Background Probe
    console.warn(`[Audit] SafeImage fallback active. src: ${src}, phase: ${loadPhase}, time: ${performance.now().toFixed(2)}ms`);
    setLoadPhase('placeholder');
    setShowPlaceholder(true);
    setIsLoading(false);
  };

  const isMarket = !isHero && !forceCover && (category === 'market' || 
                   (src && (src.toLowerCase().includes('market') || src.toLowerCase().includes('grocery'))) ||
                   (currentSrc && (currentSrc.toLowerCase().includes('market') || currentSrc.toLowerCase().includes('grocery'))));

  const customContainerStyle: React.CSSProperties = isMarket ? {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  } : {};

  const customImgStyle: React.CSSProperties = isHero ? {
    objectFit: 'cover',
    objectPosition: 'center',
  } : isMarket ? {
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

  // Detect whether image is priority or currently cached to skip visual opacity fades
  const isCurrentlyCached = isCachedInstantly(optimizedSrc) || isCachedInstantly(currentSrc) || isCachedInstantly(src || '');
  const isPriorityOrCached = Boolean(priority || isCurrentlyCached);

  const transitionClass = isPriorityOrCached 
    ? "transition-none" 
    : "transition-all duration-150 ease-out";

  // Force opaque immediately for priority images to prevent blank frames during hydration or mount settling
  const shouldRenderOpaque = priority || isPriorityOrCached || (!isLoading && !showPlaceholder);

  const opacityClass = shouldRenderOpaque
    ? "opacity-100 scale-100"
    : "opacity-0 scale-105";

  return (
    <div 
      className={containerClassName || "w-full h-full relative overflow-hidden bg-zinc-950"}
      style={customContainerStyle}
      ref={containerRef}
    >
      {/* Luxury Skeleton Loader - only displayed if loading exceeds grace period */}
      {isLoading && renderSkeleton && !isPriorityOrCached && (
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 animate-pulse flex items-center justify-center overflow-hidden">
          <div className="w-5 h-5 border-2 border-gold-pure/30 border-t-gold-pure rounded-full animate-spin" />
        </div>
      )}

      {/* Premium Luxury Placeholder (Zero error text, zero retry buttons) */}
      {showPlaceholder && !isLoading && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-gold-pure/20 flex flex-col items-center justify-center p-3 text-center overflow-hidden select-none">
          <div className="w-9 h-9 rounded-full bg-zinc-900/90 border border-gold-pure/30 flex items-center justify-center shadow-lg mb-1">
            <span className="font-serif text-gold-pure text-[10px] tracking-widest font-bold">ZOAL</span>
          </div>
        </div>
      )}

      <img
        ref={imgRef}
        key={retryKey}
        src={optimizedSrc || undefined}
        alt={alt || "ZOAL Artisanal Asset"}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
        className={`${transitionClass} ${opacityClass} ${finalImgClass}`}
        style={customImgStyle}
        {...(priority ? { fetchPriority: "high" } : {})}
        decoding={priority ? "sync" : "async"}
        {...props}
      />
    </div>
  );
});

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
  { id: 'bd2', url: '/images/collections/bakery.jpeg', category: 'bakery', title: 'Sudanese Traditional Hoboz Bread', source: 'brand default' },
  { id: 'bd3', url: '/images/collections/premium.jpeg', category: 'fashion', title: 'Royal Handwoven Silk Toob', source: 'brand default' },
  { id: 'bd4', url: '/images/collections/thobes.jpeg', category: 'thobes', title: 'Exclusive Sudanese Thobes Chambers', source: 'brand default' },
  { id: 'bd5', url: '/images/collections/market.jpeg', category: 'market', title: 'Kordofan Hibiscus Calyces Selection', source: 'brand default' },
  { id: 'bd6', url: '/src/assets/images/gallery-canning.jpg', category: 'coffee', title: 'Nitrogen Cold-Brew Canning Ritual', source: 'brand default' },
  { id: 'bd7', url: '/src/assets/images/bakery-ghoriba.jpg', category: 'bakery', title: 'Handcrafted Sudanese Sweets & Ghoriba', source: 'brand default' },
  { id: 'bd8', url: '/images/collections/market.jpeg', category: 'market', title: 'Golden Hasab Gum Arabic Selection', source: 'brand default' },
  { id: 'bd9', url: '/images/collections/thobes.jpeg', category: 'thobes', title: 'White Premium Luxury Thobe', source: 'brand default' },
  { id: 'bd10', url: '/images/collections/thobes.jpeg', category: 'thobes', title: 'Heritage Modern Tailored Thobe', source: 'brand default' },
  { id: 'bd11', url: '/images/collections/premium.jpeg', category: 'fashion', title: 'Traditional Sudanese Handcrafted Toob', source: 'brand default' },
  { id: 'bd12', url: '/src/assets/images/fashion-silk-abaya.jpg', category: 'fashion', title: 'Royal Premium Silk Abaya', source: 'brand default' },
];

// Read dynamic upload lists and cache updates
const poolChangeListeners = new Set<() => void>();

export function notifyPoolListeners() {
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

  // Pipeline A: Brand Assets only (DEFAULT_BRAND_POOL + stored brand assets).
  // Product assets belong strictly to Pipeline B (useGlobalProducts / zoal_custom_products).
  const fullPool = [...DEFAULT_BRAND_POOL, ...stored];

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
  const titleText = title || `Premium Selection ${category.toUpperCase()}`;
  
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
    subDescription: 'Premium Merchant Asset Curation',
    price: 150 + Math.floor(Math.random() * 200), // realistic premium pricing
    category,
    images: [url],
    specifications: {
      'Sourcing': 'Hand-selected boutique import',
      'Integrity Assurance': 'Verified by ZOAL',
      'Format': 'Premium custom order'
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

  // 2. Delete corresponding product from custom products and purge orphans
  const targetProdId = `custom-prod-${id}`;
  deleteProductFromSupabase(targetProdId);

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
  const [customProducts, setCustomProducts] = useState<Product[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_custom_products');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return PRODUCTS;
  });
  const [inventoryOverrides, setInventoryOverrides] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem('zoal_product_inventories');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [productOverrides, setProductOverrides] = useState<Record<string, any>>(() => {
    try {
      const raw = localStorage.getItem('zoal_product_overrides');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [deletedStaticIds, setDeletedStaticIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_deleted_static_products');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const readProductsAndOverrides = () => {
      try {
        const raw = localStorage.getItem('zoal_custom_products');
        if (raw) {
          const parsed = JSON.parse(raw);
          setCustomProducts(Array.isArray(parsed) ? parsed : PRODUCTS);
        } else {
          setCustomProducts(PRODUCTS);
        }
      } catch (e) {
        setCustomProducts(PRODUCTS);
      }

      try {
        const rawOverrides = localStorage.getItem('zoal_product_inventories');
        if (rawOverrides) {
          setInventoryOverrides(JSON.parse(rawOverrides));
        } else {
          setInventoryOverrides({});
        }
      } catch (e) {
        setInventoryOverrides({});
      }

      try {
        const rawProdOverrides = localStorage.getItem('zoal_product_overrides');
        if (rawProdOverrides) {
          setProductOverrides(JSON.parse(rawProdOverrides));
        } else {
          setProductOverrides({});
        }
      } catch (e) {
        setProductOverrides({});
      }

      try {
        const rawDeleted = localStorage.getItem('zoal_deleted_static_products');
        if (rawDeleted) {
          setDeletedStaticIds(JSON.parse(rawDeleted));
        } else {
          setDeletedStaticIds([]);
        }
      } catch (e) {
        setDeletedStaticIds([]);
      }
    };

    poolChangeListeners.add(readProductsAndOverrides);
    window.addEventListener('storage', readProductsAndOverrides);
    
    // Dynamically trigger Supabase fetch on hook mount to keep state perfectly synchronized
    import('./lib/productSync').then(mod => {
      mod.triggerProductFetch();
    }).catch(err => {
      console.error('Failed to load productSync module on mount:', err);
    });

    return () => {
      poolChangeListeners.delete(readProductsAndOverrides);
      window.removeEventListener('storage', readProductsAndOverrides);
    };
  }, []);

  const mergedProducts = React.useMemo(() => {
    let sourceProducts: Product[];

    // Check if we have active products returned from the API / customProducts cache
    const hasCache = (() => {
      try {
        const raw = localStorage.getItem('zoal_custom_products');
        return !!raw;
      } catch {
        return false;
      }
    })();

    // DEPRECATED old merge logic:
    // const baseProducts = [...PRODUCTS];
    // const staticIds = new Set(PRODUCTS.map(p => p.id));
    // const customOnly = customProducts.filter(p => p && p.id && !staticIds.has(p.id));
    // const combined = [...baseProducts, ...customOnly].filter(p => p && p.id && !deletedStaticIds.includes(p.id));
    
    if (hasCache && customProducts !== PRODUCTS && customProducts.length > 0) {
      // If the API/cache contains fetched products, use ONLY the API products.
      // Never merge the static PRODUCTS array back in. This prevents deleted products from reappearing.
      sourceProducts = customProducts;
    } else {
      // Fallback to static PRODUCTS only as the initial seed / database empty fallback
      sourceProducts = [...PRODUCTS];
    }
    
    // Combine them, filtering out any deleted static products
    const combined = sourceProducts.filter(p => p && p.id && !deletedStaticIds.includes(p.id));
    
    const seenIds = new Set<string>();
    const uniqueList: Product[] = [];
    for (const p of combined) {
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueList.push(p);
      }
    }
    return uniqueList.map(p => {
      // Create a normalized version of the product handling snake_case from database
      const normalizedProduct: any = { ...p };
      
      // Map common snake_case keys from Supabase to camelCase used in frontend
      if (p.is_featured !== undefined) normalizedProduct.isFeatured = !!p.is_featured;
      if (p.is_popular !== undefined) normalizedProduct.isPopular = !!p.is_popular;
      if (p.is_best_seller !== undefined) normalizedProduct.isBestSeller = !!p.is_best_seller;
      if (p.is_new_arrival !== undefined) normalizedProduct.isNewArrival = !!p.is_new_arrival;
      if (p.is_recommended !== undefined) normalizedProduct.isRecommended = !!p.is_recommended;
      if (p.is_flash_sale !== undefined) normalizedProduct.isFlashSale = !!p.is_flash_sale;
      
      // Handle images mapping (DB uses image_urls, Frontend uses images)
      if (p.image_urls && !p.images) {
        normalizedProduct.images = p.image_urls;
      }
      
      // Handle name translations
      if (p.name_en && !p.nameEn) normalizedProduct.nameEn = p.name_en;
      if (p.name_ar && !p.nameAr) normalizedProduct.nameAr = p.name_ar;

      let resolved = normalizeProductImages(normalizedProduct);
      if (p.id in productOverrides) {
        resolved = { ...resolved, ...productOverrides[p.id] };
      }
      if (p.id in inventoryOverrides) {
        resolved = { ...resolved, inventory: inventoryOverrides[p.id] };
      }
      return normalizeProductImages(resolved) as Product;
    });
  }, [customProducts, deletedStaticIds, productOverrides, inventoryOverrides]);

  return mergedProducts;
}

export function updateProductInventory(productId: string, newInventory: number) {
  try {
    const raw = localStorage.getItem('zoal_product_inventories');
    const overrides = raw ? JSON.parse(raw) : {};
    overrides[productId] = newInventory;
    localStorage.setItem('zoal_product_inventories', JSON.stringify(overrides));
    notifyPoolListeners();
  } catch (e) {
    console.error('Failed to update product inventory override:', e);
  }
}

export function updateProductFields(productId: string, fields: Record<string, any>) {
  try {
    const raw = localStorage.getItem('zoal_product_overrides');
    const overrides = raw ? JSON.parse(raw) : {};
    overrides[productId] = { ...(overrides[productId] || {}), ...fields };
    localStorage.setItem('zoal_product_overrides', JSON.stringify(overrides));
    notifyPoolListeners();
  } catch (e) {
    console.error('Failed to update product overrides:', e);
  }
}
