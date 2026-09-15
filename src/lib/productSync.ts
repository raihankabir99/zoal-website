import { Product } from '../types';
import { notifyPoolListeners } from '../imageRegistry';
import { supabaseClient } from './supabaseClient';

// Boutique Caching Configuration
// Store/Collection uses Supabase/API as the authoritative product source.
// LocalStorage is only a short-lived fast-path cache / offline queue.
const CACHE_VERSION = 'v2_db_authoritative';
const CACHE_MAX_AGE = 0; // Always revalidate storefront products against the API.
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

async function getAuthToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session?.access_token || '';
  } catch (e) {
    console.warn('[Auth] Could not read Supabase session:', e);
    return '';
  }
}

export interface PendingOp {
  id: string;
  type: 'save' | 'delete';
  productId: string;
  productData?: any;
  timestamp: number;
  retryCount?: number;
}

function initializeCache() {
  if (typeof window === 'undefined') return;
  try {
    const metaRaw = localStorage.getItem(CACHE_KEYS.META);
    const meta: CacheMetadata | null = metaRaw ? JSON.parse(metaRaw) : null;
    if (!meta || meta.version !== CACHE_VERSION) {
      console.log(`[Cache] Cache version reset (${meta?.version || 'none'} -> ${CACHE_VERSION}).`);
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

function updateCacheMeta(updates: Partial<CacheMetadata>) {
  try {
    const current = getCacheMeta();
    localStorage.setItem(CACHE_KEYS.META, JSON.stringify({ ...current, ...updates }));
  } catch (e) {}
}

function getPendingQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(CACHE_KEYS.QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function savePendingQueue(queue: PendingOp[]) {
  try {
    localStorage.setItem(CACHE_KEYS.QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.error('[Cache] Failed to save pending queue:', e);
  }
}

export function queuePendingOp(op: Omit<PendingOp, 'id' | 'timestamp'>) {
  const queue = getPendingQueue();
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

export function resolveProductConflict(local: Product, remote: Product): Product {
  console.log(`[Sync] Resolving merge conflicts for Product: ${local.name} (${local.id})`);
  const merged: Product = { ...remote, ...local };

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
    merged.images = [];
    merged.image_urls = [];
    merged.image = '';
    merged.image_url = '';
    (merged as any).imageUrl = '';
    (merged as any).thumbnail = '';
  } else if (!localHasValidImageData && remoteHasValidImageData) {
    merged.images = remote.images || [];
    merged.image_urls = remote.image_urls || remote.images || [];
    merged.image = remote.image || '';
    merged.image_url = remote.image_url || '';
    (merged as any).imageUrl = (remote as any).imageUrl || '';
    (merged as any).thumbnail = (remote as any).thumbnail || '';
  } else if (localHasImages) {
    merged.images = local.images;
    merged.image_urls = local.image_urls || local.images;
    merged.image = local.images[0] || local.image || '';
    merged.image_url = local.images[0] || local.image_url || '';
    (merged as any).imageUrl = local.images[0] || (local as any).imageUrl || '';
    (merged as any).thumbnail = local.images[0] || (local as any).thumbnail || '';
  } else if (localHasPrimaryImage) {
    const primaryStr = local.image || local.image_url || (local as any).imageUrl || (local as any).thumbnail || '';
    merged.images = (local.images && local.images.length > 0) ? local.images : (remote.images && remote.images.length > 0 ? remote.images : [primaryStr]);
    merged.image_urls = (local.image_urls && local.image_urls.length > 0) ? local.image_urls : (remote.image_urls && remote.image_urls.length > 0 ? remote.image_urls : merged.images);
    merged.image = primaryStr;
    merged.image_url = primaryStr;
    (merged as any).imageUrl = primaryStr;
    (merged as any).thumbnail = primaryStr;
  }

  if (Array.isArray(local.reviews) || Array.isArray(remote.reviews)) {
    const reviewsMap = new Map<string, any>();
    (remote.reviews || []).forEach(r => { if (r && r.id) reviewsMap.set(r.id, r); });
    (local.reviews || []).forEach(r => { if (r && r.id) reviewsMap.set(r.id, { ...(reviewsMap.get(r.id) || {}), ...r }); });
    merged.reviews = Array.from(reviewsMap.values());
  }

  if (Array.isArray(local.questions) || Array.isArray(remote.questions)) {
    const qasMap = new Map<string, any>();
    (remote.questions || []).forEach(q => { if (q && q.id) qasMap.set(q.id, q); });
    (local.questions || []).forEach(q => { if (q && q.id) qasMap.set(q.id, { ...(qasMap.get(q.id) || {}), ...q }); });
    merged.questions = Array.from(qasMap.values());
  }

  if (remote.inventory !== undefined && local.inventory !== undefined) merged.inventory = local.inventory;
  return merged;
}

let isRetrying = false;

export async function triggerRetryLoop() {
  if (isRetrying) return;
  const queue = getPendingQueue();
  if (queue.length === 0) return;
  isRetrying = true;
  updateCacheMeta({ syncInProgress: true });
  const remaining: PendingOp[] = [];

  let freshProductsMap = new Map<string, Product>();
  try {
    const baseRes = await fetch('/api/products');
    if (baseRes.ok) {
      const contentType = baseRes.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await baseRes.json();
        const products = Array.isArray(data) ? data : data?.products;
        if (Array.isArray(products)) products.forEach((p: Product) => freshProductsMap.set(p.id, p));
      }
    }
  } catch (err) {
    console.warn('[Sync] Could not fetch base products for conflict resolution.', err);
  }

  for (const op of queue) {
    let success = false;
    try {
      if (op.type === 'save') {
        let finalData = op.productData;
        const remoteVersion = freshProductsMap.get(op.productId);
        if (remoteVersion) finalData = resolveProductConflict(op.productData, remoteVersion);
        const token = await getAuthToken();
        if (!token) throw new Error('No active Supabase session token available.');
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(finalData)
        });
        if (res.ok) success = true;
      } else if (op.type === 'delete') {
        cleanupProductOrphans(op.productId);
        const token = await getAuthToken();
        if (!token) throw new Error('No active Supabase session token available.');
        const res = await fetch(`/api/products/${encodeURIComponent(op.productId)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok || res.status === 404) success = true;
      }
    } catch (err) {
      console.error('[Sync] Sync attempt failed for op:', op.productId, err);
    }

    if (!success) {
      const retryCount = (op.retryCount || 0) + 1;
      if (retryCount <= 8) remaining.push({ ...op, retryCount });
    }
  }

  savePendingQueue(remaining);
  isRetrying = false;
  updateCacheMeta({ syncInProgress: false });
  if (queue.length !== remaining.length) triggerProductFetch(true);
  if (remaining.length > 0) setTimeout(triggerRetryLoop, 15000);
}

function mergeProductsConflictFree(serverProducts: Product[], localProducts: Product[]): Product[] {
  const mergedMap = new Map<string, Product>();
  const pendingQueue = getPendingQueue();
  const pendingSaveIds = new Set(pendingQueue.filter(op => op.type === 'save').map(op => op.productId));
  const pendingDeleteIds = new Set(pendingQueue.filter(op => op.type === 'delete').map(op => op.productId));

  // Server data is authoritative. Local data may override only for explicit unsynced writes.
  for (const sp of serverProducts) {
    if (sp && sp.id && !pendingDeleteIds.has(sp.id)) mergedMap.set(sp.id, sp);
  }
  for (const lp of localProducts) {
    if (lp && lp.id && !pendingDeleteIds.has(lp.id)) {
      if (!mergedMap.has(lp.id) && pendingSaveIds.has(lp.id)) mergedMap.set(lp.id, lp);
      else if (mergedMap.has(lp.id) && pendingSaveIds.has(lp.id)) mergedMap.set(lp.id, lp);
    }
  }
  return Array.from(mergedMap.values());
}

// Fetch products from the database/API. LocalStorage is only a cache/offline fallback.
export async function triggerProductFetch(forceUpdate = false): Promise<Product[] | null> {
  const meta = getCacheMeta();
  const now = Date.now();

  // CACHE_MAX_AGE is intentionally 0 for storefront authority, so this branch is
  // retained only as a future configurable fast path.
  if (!forceUpdate && CACHE_MAX_AGE > 0 && meta.lastFetched > 0 && (now - meta.lastFetched) < CACHE_MAX_AGE) {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
  }

  try {
    if (typeof window === 'undefined') return null;
    console.log('[Cache] Fetching fresh product data from Supabase DB (Source of Truth)...');
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('API returned status ' + res.status);

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Expected JSON response but received ${contentType || 'unknown'} (Body starts with: ${text.substring(0, 50)}...)`);
    }

    const data = await res.json();
    const productsList = Array.isArray(data) ? data : (data && Array.isArray(data.products) ? data.products : null);

    // A successful empty response is authoritative too: do not silently resurrect
    // old/static products when the database currently has zero products.
    if (Array.isArray(productsList)) {
      let finalProducts = productsList;
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
        if (cachedRaw) {
          const cachedProducts = JSON.parse(cachedRaw);
          if (Array.isArray(cachedProducts)) finalProducts = mergeProductsConflictFree(productsList, cachedProducts);
        }
      } catch (e) {
        console.warn('[Cache] Error merging server and local products:', e);
      }

      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(finalProducts));
      updateCacheMeta({ lastFetched: Date.now() });
      window.dispatchEvent(new Event('storage'));
      notifyPoolListeners();
      return finalProducts;
    }
  } catch (err) {
    console.warn('[Cache] Failed to fetch live products, falling back to local cache:', err);
  }

  try {
    const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
}

export async function saveProductToSupabase(product: Product) {
  const nowStr = new Date().toISOString();
  const updatedProduct = { ...product, updatedAt: product.updatedAt || nowStr, updated_at: product.updated_at || nowStr };

  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  let customProducts = customRaw ? JSON.parse(customRaw) : [];
  const exists = customProducts.some((p: any) => p.id === updatedProduct.id);
  if (exists) customProducts = customProducts.map((p: any) => p.id === updatedProduct.id ? updatedProduct : p);
  else customProducts.unshift(updatedProduct);
  localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts));
  window.dispatchEvent(new Event('storage'));
  notifyPoolListeners();

  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No active Supabase session token available.');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(updatedProduct)
    });
    if (res.ok) {
      console.log(`[Cache] Successfully persisted product ${updatedProduct.id} to Supabase Database.`);
      await triggerProductFetch(true);
      return true;
    }
    throw new Error('API non-ok status: ' + res.status);
  } catch (err) {
    console.warn(`[Cache] Database write offline/failed for ${product.id}. Queued for background auto-sync.`, err);
    queuePendingOp({ type: 'save', productId: product.id, productData: product });
    return false;
  }
}

export function cleanupProductOrphans(productId: string): void {
  if (!productId) return;
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
    console.warn('[OrphanCleanup] Failed cleaning inventory override:', err);
  }
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
    console.warn('[OrphanCleanup] Failed cleaning product override:', err);
  }
}

export async function deleteProductFromSupabase(productId: string) {
  if (!productId) return false;
  console.log(`[Sync] Initiating delete for product: ${productId}`);

  const customRaw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
  if (customRaw) {
    try {
      const customProducts = JSON.parse(customRaw);
      if (Array.isArray(customProducts)) localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(customProducts.filter((p: any) => p && p.id !== productId)));
    } catch (e) {}
  }

  const deletedRaw = localStorage.getItem(CACHE_KEYS.DELETED_STATIC);
  try {
    const deletedIds = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (Array.isArray(deletedIds) && !deletedIds.includes(productId)) {
      deletedIds.push(productId);
      localStorage.setItem(CACHE_KEYS.DELETED_STATIC, JSON.stringify(deletedIds));
    }
  } catch (e) {}

  cleanupProductOrphans(productId);
  window.dispatchEvent(new Event('storage'));
  notifyPoolListeners();

  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No active Supabase session token available.');
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok || res.status === 404) {
      cleanupProductOrphans(productId);
      await triggerProductFetch(true);
      return true;
    }
    throw new Error(`API non-ok status: ${res.status}`);
  } catch (err: any) {
    console.error(`[Cache] Database delete failed for ${productId}. Error:`, err);
    queuePendingOp({ type: 'delete', productId });
    return false;
  }
}

initializeCache();

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Sync] Network connection restored. Flushing operations queue...');
    triggerRetryLoop();
    triggerProductFetch(true);
  });

  setInterval(() => {
    triggerRetryLoop();
    triggerProductFetch(true);
  }, 45000);
}
