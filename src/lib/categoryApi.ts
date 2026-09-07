export interface CategoryApiRecord {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  featuredImage?: string;
  bannerImage?: string;
  categoryIcon?: string;
  parent: string | null;
  sortOrder: number;
  visibility: 'Visible' | 'Hidden' | 'Featured';
  status: 'Draft' | 'Published' | 'Hidden' | 'Archived' | 'Scheduled';
  featuredToggle: boolean;
  homepageDisplayToggle: boolean;
  createdAt: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  structuredData?: string;
  friendlyUrl?: string;
  mobileBannerImage?: string;
  homepageImage?: string;
}

const getToken = () =>
  localStorage.getItem('zoal_auth_token') ||
  sessionStorage.getItem('zoal_auth_token') ||
  localStorage.getItem('auth_token') ||
  sessionStorage.getItem('auth_token') ||
  '';

const request = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(input, { ...init, headers, cache: 'no-store' });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error || payload?.message || `Category request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

export const categoryApi = {
  async list(): Promise<CategoryApiRecord[]> {
    const payload = await request('/api/categories');
    const rows = Array.isArray(payload) ? payload : payload?.data || payload?.categories || [];
    return Array.isArray(rows) ? rows : [];
  },

  async create(category: Omit<CategoryApiRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const payload = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return payload?.data || payload?.category || payload;
  },

  async update(id: string, category: Partial<CategoryApiRecord>) {
    const payload = await request(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return payload?.data || payload?.category || payload;
  },

  async remove(id: string) {
    return request(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
