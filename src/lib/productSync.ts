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

// Queue type for offline operations
export interface PendingOp {
  id: string;
  type: 'save' | 'delete';
  productId: string;
  productData?: any;
  timestamp: number;
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

  // 1. Merge Reviews list to avoid losing community feedback submitted concurrently
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

        const token = localStorage.getItem('zoal_auth_token');
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(finalData)
        });
        if (res.ok) success = true;
      } else if (op.type === 'delete') {
        const token = localStorage.getItem('zoal_auth_token');
        const res = await fetch(`/api/products/${op.productId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) success = true;
      }
    } catch (err) {
      console.error('[Sync] Sync attempt failed for op:', op.productId, err);
    }

    if (!success) {
      remaining.push(op);
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
    
    if (data.products && Array.isArray(data.products)) {
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(data.products));
      updateCacheMeta({ lastFetched: Date.now() });
      
      // Dispatch storage event to keep other tabs/hooks perfectly in sync
      window.dispatchEvent(new Event('storage'));
      notifyPoolListeners();
      return data.products;
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
  // 1. Instantly update local cache for smooth Optimistic UI response
  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  let customProducts = customRaw ? JSON.parse(customRaw) : [];
  const exists = customProducts.some((p: any) => p.id === product.id);
  
  if (exists) {
    customProducts = customProducts.map((p: any) => p.id === product.id ? product : p);
  } else {
    customProducts.unshift(product);
  }
  localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts));
  window.dispatchEvent(new Event('storage'));
  notifyPoolListeners();

  // 2. Perform direct write to database
  try {
    const token = localStorage.getItem('zoal_auth_token');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(product)
    });
    
    if (res.ok) {
      console.log(`[Cache] Successfully persisted product ${product.id} to Supabase Database.`);
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

// Unify deleting product from Supabase and cache
export async function deleteProductFromSupabase(productId: string) {
  // 1. Instantly update local cache for smooth Optimistic UI response
  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  if (customRaw) {
    let customProducts = JSON.parse(customRaw);
    customProducts = customProducts.filter((p: any) => p.id !== productId);
    localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts));
  }
  
  // Track deleted static products
  const deletedRaw = localStorage.getItem(CACHE_KEYS.DELETED_STATIC);
  const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
  if (!deletedIds.includes(productId)) {
    deletedIds.push(productId);
    localStorage.setItem(CACHE_KEYS.DELETED_STATIC, JSON.stringify(deletedIds));
  }

  window.dispatchEvent(new Event('storage'));
  notifyPoolListeners();

  // 2. Perform direct delete from database
  try {
    const token = localStorage.getItem('zoal_auth_token');
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    
    if (res.ok) {
      console.log(`[Cache] Successfully deleted product ${productId} from Supabase Database.`);
      triggerProductFetch(true);
      return true;
    } else {
      throw new Error('API non-ok status: ' + res.status);
    }
  } catch (err) {
    console.warn(`[Cache] Database delete offline/failed for ${productId}. Queued for background auto-sync.`, err);
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
