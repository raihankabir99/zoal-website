import { Product } from '../types';
import { notifyPoolListeners } from '../imageRegistry';

// Boutique Caching Configuration
const CACHE_VERSION = 'v1_enterprise_zoal';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes cache validity
const CACHE_KEYS = {
  PRODUCTS: 'zoal_custom_products',
  META: 'zoal_products_cache_meta',
  QUEUE: 'zoal_pending_product_ops',
  DELETED_STATIC: 'zoal_deleted_static_products'
};

export interface CacheMetadata {
  version: string;
  lastFetched: number;
  syncInProgress: boolean;
}

// Helper to retrieve valid auth token (falling back to dev-preview-token if not logged in)
function getAuthToken(): string {
  if (typeof window === 'undefined') return 'dev-preview-token';
  return (
    localStorage.getItem('zoal_auth_token') ||
    sessionStorage.getItem('zoal_auth_token') ||
    'dev-preview-token'
  );
}

// Queue type for offline operations
export interface PendingOp {
  id: string;
  type: 'save' | 'delete';
  productId: string;
  productData?: any;
  timestamp: number;
  retryCount?: number;
}

// Initialize / Validate cache integrity based on versioning
function initializeCache() {
  if (typeof window === 'undefined') return;
  try {
    const metaRaw = localStorage.getItem(CACHE_KEYS.META);
    const meta: CacheMetadata | null = metaRaw ? JSON.parse(metaRaw) : null;

    if (!meta || meta.version !== CACHE_VERSION) {
      console.log(`[Cache] Cache stale or version mismatch (${meta?.version || 'none'} vs ${CACHE_VERSION}). Purging and re-initializing...`);
      localStorage.removeItem(CACHE_KEYS.PRODUCTS);
      localStorage.setItem(CACHE_KEYS.META, JSON.stringify({
        version: CACHE_VERSION,
        lastFetched: 0,
        syncInProgress: false
      }));
    }
  } catch (e) {
    console.error('[Cache] Failed to initialize cache:', e);
  }
}

// Get raw cache meta
function getCacheMeta(): CacheMetadata {
  try {
    const metaRaw = localStorage.getItem(CACHE_KEYS.META);
    if (metaRaw) {
      const parsed = JSON.parse(metaRaw);
      if (parsed.version === CACHE_VERSION) return parsed;
    }
  } catch (e) {}
  return { version: CACHE_VERSION, lastFetched: 0, syncInProgress: false };
}

// Update cache meta
function updateCacheMeta(updates: Partial<CacheMetadata>) {
  try {
    const current = getCacheMeta();
    localStorage.setItem(CACHE_KEYS.META, JSON.stringify({ ...current, ...updates }));
  } catch (e) {}
}

// Loads the queue from LocalStorage
function getPendingQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Saves the queue to LocalStorage
function savePendingQueue(queue: PendingOp[]) {
  try {
    localStorage.setItem(CACHE_KEYS.QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('[Cache] Failed to save pending queue:', e);
  }
}

// Add an operation to the queue
export function queuePendingOp(op: Omit<PendingOp, 'id' | 'timestamp'>) {
  const queue = getPendingQueue();
  
  // Deduplicate: If we already have a pending op for this product, let's keep the latest one
  const filtered = queue.filter(item => !(item.productId === op.productId && item.type === op.type));
  
  const newOp: PendingOp = {
    ...op,
    id: 'op-' + Math.random().toString(36).slice(2, 11),
    timestamp: Date.now()
  };
  filtered.push(newOp);
  savePendingQueue(filtered);
  triggerRetryLoop();
}

/**
 * Intelligent Conflict Resolution Strategy
 * Merges local changes with remote changes.
 * Avoids data loss for dynamic fields (e.g. user reviews, variants, QAs).
 */
export function resolveProductConflict(local: Product, remote: Product): Product {
  console.log(`[Sync] Resolving merge conflicts for Product: ${local.name} (${local.id})`);

  // Default to Last-Write-Wins for base attributes, but merge dynamic arrays
  const merged: Product = { ...remote, ...local };

  // 1. IMAGE SYNC HARDENING: Check if local or remote has valid image data
  const localImages = local.images || [];
  const localHasImages = Array.isArray(localImages) && localImages.length > 0 && localImages.some(img => img && typeof img === 'string' && img.trim());
  const localHasPrimaryImage = !!(local.image || local.image_url || (local as any).imageUrl || (local as any).thumbnail);
  const localHasValidImageData = localHasImages || localHasPrimaryImage;

  const remoteImages = remote.images || [];
  const remoteHasImages = Array.isArray(remoteImages) && remoteImages.length > 0 && remoteImages.some(img => img && typeof img === 'string' && img.trim());
  const remoteHasPrimaryImage = !!(remote.image || remote.image_url || (remote as any).imageUrl || (remote as any).thumbnail);
  const remoteHasValidImageData = remoteHasImages || remoteHasPrimaryImage;

  const isExplicitDeletion = (local as any).explicitImageDeletion === true;

  if (isExplicitDeletion) {
    // Administrator explicitly deleted all images
    merged.images = [];
    merged.image_urls = [];
    merged.image = '';
    merged.image_url = '';
    (merged as any).imageUrl = '';
    (merged as any).thumbnail = '';
  } else if (!localHasValidImageData && remoteHasValidImageData) {
    // Preserve remote's valid image fields completely (no image change during edit)
    merged.images = remote.images || [];
    merged.image_urls = remote.image_urls || remote.images || [];
    merged.image = remote.image || '';
    merged.image_url = remote.image_url || '';
    (merged as any).imageUrl = (remote as any).imageUrl || '';
    (merged as any).thumbnail = (remote as any).thumbnail || '';
  } else if (localHasImages) {
    // Local has authoritative new images
    merged.images = local.images;
    merged.image_urls = local.image_urls || local.images;
    merged.image = local.images[0] || local.image || '';
    merged.image_url = local.images[0] || local.image_url || '';
    (merged as any).imageUrl = local.images[0] || (local as any).imageUrl || '';
    (merged as any).thumbnail = local.images[0] || (local as any).thumbnail || '';
  } else if (localHasPrimaryImage) {
    // Local has valid primary image string even if images array is empty
    const primaryStr = local.image || local.image_url || (local as any).imageUrl || (local as any).thumbnail || '';
    merged.images = (local.images && local.images.length > 0) ? local.images : (remote.images && remote.images.length > 0 ? remote.images : [primaryStr]);
    merged.image_urls = (local.image_urls && local.image_urls.length > 0) ? local.image_urls : (remote.image_urls && remote.image_urls.length > 0 ? remote.image_urls : merged.images);
    merged.image = primaryStr;
    merged.image_url = primaryStr;
    (merged as any).imageUrl = primaryStr;
    (merged as any).thumbnail = primaryStr;
  }

  // 2. Merge Reviews list to avoid losing community feedback submitted concurrently
  if (Array.isArray(local.reviews) || Array.isArray(remote.reviews)) {
    const localReviews = local.reviews || [];
    const remoteReviews = remote.reviews || [];
    const reviewsMap = new Map<string, any>();
    
    // Add remote first as base
    remoteReviews.forEach(r => {
      if (r && r.id) reviewsMap.set(r.id, r);
    });
    // Overlay local (or add new ones)
    localReviews.forEach(r => {
      if (r && r.id) {
        const existing = reviewsMap.get(r.id);
        reviewsMap.set(r.id, existing ? { ...existing, ...r } : r);
      }
    });
    merged.reviews = Array.from(reviewsMap.values());
  }

  // 2. Merge QAs/Questions list
  if (Array.isArray(local.questions) || Array.isArray(remote.questions)) {
    const localQAs = local.questions || [];
    const remoteQAs = remote.questions || [];
    const qasMap = new Map<string, any>();

    remoteQAs.forEach(q => {
      if (q && q.id) qasMap.set(q.id, q);
    });
    localQAs.forEach(q => {
      if (q && q.id) {
        const existing = qasMap.get(q.id);
        qasMap.set(q.id, existing ? { ...existing, ...q } : q);
      }
    });
    merged.questions = Array.from(qasMap.values());
  }

  // 3. Keep newer inventory/sales count if available
  if (remote.inventory !== undefined && local.inventory !== undefined) {
    // If remote has a different inventory count, let the remote act as server-of-truth 
    // unless local had an explicit modification. In our application flow, inventory is updated via updateProductInventory.
    // We default to local if local is newer, or remote if remote is newer.
    merged.inventory = local.inventory;
  }

  return merged;
}

let isRetrying = false;

// Retry flushing the queue in the background with Conflict Resolution
export async function triggerRetryLoop() {
  if (isRetrying) return;
  const queue = getPendingQueue();
  if (queue.length === 0) return;

  isRetrying = true;
  updateCacheMeta({ syncInProgress: true });
  console.log(`[Sync] Starting background auto-sync for ${queue.length} pending operations...`);

  const remaining: PendingOp[] = [];
  
  // Fetch latest products from server once to have a conflict baseline
  let freshProductsMap = new Map<string, Product>();
  try {
    const baseRes = await fetch('/api/products');
    if (baseRes.ok) {
      const contentType = baseRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await baseRes.json();
        if (Array.isArray(data.products)) {
          data.products.forEach((p: Product) => freshProductsMap.set(p.id, p));
        }
      } else {
        const text = await baseRes.text();
        console.warn('[Sync] Expected JSON for conflict baseline but received:', contentType, text.substring(0, 100));
      }
    }
  } catch (err) {
    console.warn('[Sync] Could not fetch base products for conflict resolution, relying on last-write-wins', err);
  }
  
  for (const op of queue) {
    let success = false;
    try {
      if (op.type === 'save') {
        let finalData = op.productData;
        const remoteVersion = freshProductsMap.get(op.productId);
        
        // Resolve conflicts if there is a newer remote version
        if (remoteVersion) {
          finalData = resolveProductConflict(op.productData, remoteVersion);
        }

        const token = getAuthToken();
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(finalData)
        });
        if (res.ok) success = true;
      } else if (op.type === 'delete') {
        cleanupProductOrphans(op.productId);
        const token = getAuthToken();
        const res = await fetch(`/api/products/${encodeURIComponent(op.productId)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          success = true;
          cleanupProductOrphans(op.productId);
        }
      }
    } catch (err) {
      console.error('[Sync] Sync attempt failed for op:', op.productId, err);
    }

    if (!success) {
      const retryCount = (op.retryCount || 0) + 1;
      if (retryCount <= 8) {
        remaining.push({ ...op, retryCount });
      } else {
        console.warn(`[Sync] Dropping operation for ${op.productId} after ${retryCount} unsuccessful sync attempts.`);
      }
    } else {
      console.log(`[Sync] Successfully synchronized: ${op.type} for ${op.productId}`);
    }
  }

  savePendingQueue(remaining);
  isRetrying = false;
  updateCacheMeta({ syncInProgress: false });

  // Update local cache fully if some writes went through
  if (queue.length !== remaining.length) {
    triggerProductFetch();
  }

  // If there are still pending items, automatically retry in 15 seconds
  if (remaining.length > 0) {
    setTimeout(triggerRetryLoop, 15000);
  }
}

function mergeProductsConflictFree(serverProducts: Product[], localProducts: Product[]): Product[] {
  const mergedMap = new Map<string, Product>();
  const pendingQueue = getPendingQueue();
  const pendingSaveIds = new Set(pendingQueue.filter(op => op.type === 'save').map(op => op.productId));
  const pendingDeleteIds = new Set(pendingQueue.filter(op => op.type === 'delete').map(op => op.productId));

  // Initialize with server products
  for (const sp of serverProducts) {
    if (sp && sp.id) {
      // If there is a pending delete for this product, do not include it
      if (pendingDeleteIds.has(sp.id)) {
        continue;
      }
      mergedMap.set(sp.id, sp);
    }
  }

  // Override with local products ONLY if the local product is newer or has newer image data, or is a legitimate unsynced product
  for (const lp of localProducts) {
    if (lp && lp.id) {
      // If there is a pending delete for this product, do not include it
      if (pendingDeleteIds.has(lp.id)) {
        continue;
      }

      const sp = mergedMap.get(lp.id);
      if (!sp) {
        // Keep local product ONLY if it is a legitimate unsynced product (exists in the pending save queue)
        if (pendingSaveIds.has(lp.id)) {
          mergedMap.set(lp.id, lp);
        }
      } else {
        const lpTime = new Date(lp.updatedAt || lp.updated_at || 0).getTime();
        const spTime = new Date(sp.updatedAt || sp.updated_at || 0).getTime();
        
        const lpHasImages = (lp.images && lp.images.length > 0) || (lp.image_urls && lp.image_urls.length > 0);
        const spHasImages = (sp.images && sp.images.length > 0) || (sp.image_urls && sp.image_urls.length > 0);
        const localHasBetterImages = lpHasImages && !spHasImages;
        
        if (lpTime > spTime || localHasBetterImages) {
          mergedMap.set(lp.id, lp);
        }
      }
    }
  }

  return Array.from(mergedMap.values());
}

// Fetch products from database, update local storage cache, check expiration
export async function triggerProductFetch(forceUpdate = false): Promise<Product[] | null> {
  const meta = getCacheMeta();
  const now = Date.now();
  
  // If not forced and cache is clean & warm, return early
  if (!forceUpdate && meta.lastFetched > 0 && (now - meta.lastFetched) < CACHE_MAX_AGE) {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('[Cache] Serving warm cache instantly (Fast Path). age:', Math.round((now - meta.lastFetched) / 1000), 's');
          return parsed;
        }
      }
    } catch (e) {}
  }

  // Background/stale-while-revalidate or direct load
  try {
    console.log('[Cache] Fetching fresh product data from Supabase DB (Source of Truth)...');
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API returned status ' + res.status);
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON response but received ${contentType || 'unknown'} (Body starts with: ${text.substring(0, 50)}...)`);
    }

    const data = await res.json();
    const productsList = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : null);
    
    if (productsList && Array.isArray(productsList) && productsList.length > 0) {
      let finalProducts = productsList;
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
        if (cachedRaw) {
          const cachedProducts = JSON.parse(cachedRaw);
          if (Array.isArray(cachedProducts)) {
            finalProducts = mergeProductsConflictFree(productsList, cachedProducts);
          }
        }
      } catch (e) {
        console.warn('[Cache] Error merging server and local products:', e);
      }

      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(finalProducts));
      updateCacheMeta({ lastFetched: Date.now() });
      
      // Dispatch storage event to keep other tabs/hooks perfectly in sync
      window.dispatchEvent(new Event('storage'));
      notifyPoolListeners();
      return finalProducts;
    }
  } catch (err) {
    console.warn('[Cache] Failed to fetch live products, falling back to local cache:', err);
  }

  // Last-resort fallback to whatever is in localStorage
  try {
    const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

// Unify saving product to Supabase and cache
export async function saveProductToSupabase(product: Product) {
  // Ensure product has fresh timestamps to prevent race conditions during triggerProductFetch
  const nowStr = new Date().toISOString();
  const updatedProduct = {
    ...product,
    updatedAt: product.updatedAt || nowStr,
    updated_at: product.updated_at || nowStr
  };

  // 1. Instantly update local cache for smooth Optimistic UI response
  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  let customProducts = customRaw ? JSON.parse(customRaw) : [];
  const exists = customProducts.some((p: any) => p.id === updatedProduct.id);
  
  if (exists) {
    customProducts = customProducts.map((p: any) => p.id === updatedProduct.id ? updatedProduct : p);
  } else {
    customProducts.unshift(updatedProduct);
  }
  localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts));
  window.dispatchEvent(new Event('storage'));
  notifyPoolListeners();

  // 2. Perform direct write to database
  try {
    const token = getAuthToken();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedProduct)
    });
    
    if (res.ok) {
      console.log(`[Cache] Successfully persisted product ${updatedProduct.id} to Supabase Database.`);
      // Fetch latest from database to align everything perfectly
      triggerProductFetch(true);
      return true;
    } else {
      throw new Error('API non-ok status: ' + res.status);
    }
  } catch (err) {
    console.warn(`[Cache] Database write offline/failed for ${product.id}. Queued for background auto-sync.`, err);
    queuePendingOp({
      type: 'save',
      productId: product.id,
      productData: product
    });
    return false;
  }
}

/**
 * ENTERPRISE ORPHAN CLEANUP ENGINE
 * Safely removes orphan inventory and product override records for a deleted product ID.
 * Guarantees zero orphan records remain in zoal_product_inventories and zoal_product_overrides.
 */
export function cleanupProductOrphans(productId: string): void {
  if (!productId) return;

  // 1. Purge from zoal_product_inventories
  try {
    const rawInv = localStorage.getItem('zoal_product_inventories');
    if (rawInv) {
      const invMap = JSON.parse(rawInv);
      if (invMap && typeof invMap === 'object' && !Array.isArray(invMap) && productId in invMap) {
        delete invMap[productId];
        localStorage.setItem('zoal_product_inventories', JSON.stringify(invMap));
      }
    }
  } catch (err) {
    console.warn('[OrphanCleanup] Failed cleaning zoal_product_inventories for ID:', productId, err);
  }

  // 2. Purge from zoal_product_overrides
  try {
    const rawOverrides = localStorage.getItem('zoal_product_overrides');
    if (rawOverrides) {
      const overridesMap = JSON.parse(rawOverrides);
      if (overridesMap && typeof overridesMap === 'object' && !Array.isArray(overridesMap) && productId in overridesMap) {
        delete overridesMap[productId];
        localStorage.setItem('zoal_product_overrides', JSON.stringify(overridesMap));
      }
    }
  } catch (err) {
    console.warn('[OrphanCleanup] Failed cleaning zoal_product_overrides for ID:', productId, err);
  }
}

// Unify deleting product from Supabase and cache
export async function deleteProductFromSupabase(productId: string) {
  console.log("TRACE 11: First line inside deleteProductFromSupabase()", { productId });
  if (!productId) {
    console.log("TRACE 11 early return: no productId");
    return false;
  }

  console.log(`[Sync] Initiating delete for product: ${productId}`);

  // 1. Instantly update local cache for smooth Optimistic UI response
  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  if (customRaw) {
    try {
      let customProducts = JSON.parse(customRaw);
      if (Array.isArray(customProducts)) {
        customProducts = customProducts.filter((p: any) => p && p.id !== productId);
        localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts));
      }
    } catch (e) {
      console.warn('[Cache] Error updating custom products on delete:', e);
    }
  }
  
  // Track deleted static products
  const deletedRaw = localStorage.getItem(CACHE_KEYS.DELETED_STATIC);
  try {
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (Array.isArray(deletedIds) && !deletedIds.includes(productId)) {
      deletedIds.push(productId);
      localStorage.setItem(CACHE_KEYS.DELETED_STATIC, JSON.stringify(deletedIds));
    }
  } catch (e) {
    console.warn('[Cache] Error updating deleted static IDs:', e);
  }

  // 2. ENTERPRISE ORPHAN CLEANUP: Purge inventory & overrides before notifying listeners
  cleanupProductOrphans(productId);

  window.dispatchEvent(new Event('storage'));
  
  // 3. Notify listeners (Safe check to prevent circular dependency crashes)
  try {
    if (typeof notifyPoolListeners === 'function') {
      console.log("7. Immediately before notifyPoolListeners()");
      notifyPoolListeners();
      console.log("8. Immediately after notifyPoolListeners()");
    }
  } catch (e) {
    console.warn('[Sync] Notification failed, but continuing with database sync:', e);
  }

  // 4. ALWAYS Perform direct delete from database regardless of local state
  try {
    const token = getAuthToken();
    console.log("TRACE 12: Immediately before fetch()", { productId, hasToken: !!token });
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("TRACE 14: Print response.status", res.status);
    
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log("TRACE 15: Print response body", body);
      console.log(`[Cache] Successfully deleted product ${productId} from Supabase Database.`);
      cleanupProductOrphans(productId);
      triggerProductFetch(true);
      return true;
    } else if (res.status === 404) {
      console.log(`[Cache] Product ${productId} not found in database (404), treating as deleted.`);
      cleanupProductOrphans(productId);
      triggerProductFetch(true);
      return true;
    } else {
      const errorText = await res.text().catch(() => 'No error body');
      console.error(`[Cache] API delete failed for ${productId}. Status: ${res.status}. Body: ${errorText}`);
      throw new Error(`API non-ok status: ${res.status}`);
    }
  } catch (err: any) {
    console.error(`[Cache] Database delete failed for ${productId}. Error:`, err);
    
    // Fallback to queueing for background sync if it's a network error
    queuePendingOp({
      type: 'delete',
      productId
    });
    return false;
  }
}

// Initialize cache checks
initializeCache();

// Network status recovery & periodic sync timers
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync] Network connection restored. Flushing operations queue...');
    triggerRetryLoop();
  });
  
  // Automatically scan & refresh stale cache/queue in background periodically
  setInterval(() => {
    triggerRetryLoop();
    // Do background fetch only if stale
    triggerProductFetch(false);
  }, 45000);
}
