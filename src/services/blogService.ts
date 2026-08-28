import { supabaseClient } from '../lib/supabaseClient';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogAuthor, BlogMedia, BlogSeo, BlogRevision } from '../types/blog';
import { ARTICLES } from '../data';

// Helper to construct headers with the Supabase session access token
async function getAuthHeaders(contentType: string | null = 'application/json') {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    console.warn('Failed to get Supabase session for auth headers:', e);
  }
  return headers;
}

const FALLBACK_AUTHORS: BlogAuthor[] = [
  { 
    id: 'a1', 
    name: 'Majid Bin Khalid', 
    name_ar: 'ماجد بن خالد',
    email: 'majid@alzoal.com', 
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', 
    status: 'active',
    expertise: 'Senior Saffron & Specialty Roast Profiler',
    expertise_ar: 'خبير أول في حمص البن والزعفران',
    bio: 'Renowned expert in traditional East African spice chemistry and custom roast profiles. Majid curates the golden fusion hospitality experience at AL ZOAL.',
    bio_ar: 'خبير معروف في كيمياء التوابل التقليدية لشرق إفريقيا وملفات التحميص المخصصة. يشرف ماجد على تجربة ضيافة الاندماج الذهبي في آل زوال.',
    joined_date: '2026-03-12T00:00:00Z'
  },
  { 
    id: 'a2', 
    name: 'Chef Charles Vagner', 
    name_ar: 'الشيف تشارلز فاجنر',
    email: 'charles@alzoal.com', 
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', 
    status: 'active',
    expertise: 'Artisanal Hearth Chemistry & Wild Yeast Physics',
    expertise_ar: 'كيمياء الموقد الحرفي وفيزياء الخميرة البرية',
    bio: 'Distinguished master baker with a passion for heirloom sourdough kinetics and high-temperature thermal baking dynamics.',
    bio_ar: 'خباز رئيسي متميز ولديه شغف بحركية العجين المخمر التقليدي والديناميكا الحرارية للخبز عالي الحرارة.',
    joined_date: '2026-05-18T00:00:00Z'
  },
  { 
    id: 'a3', 
    name: 'Amal S. Al Saud', 
    name_ar: 'أمل س. آل سعود',
    email: 'amal@alzoal.com', 
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', 
    status: 'active',
    expertise: 'Sudanese Heritage Textile Curation & Filigree Arts',
    expertise_ar: 'تنسيق المنسوجات التراثية السودانية وفنون الصقيل',
    bio: 'Eminent textile curator dedicated to preserving the traditional Sudanese Toob draping techniques and gold silk filigree weaving.',
    bio_ar: 'أمينة منسوجات بارزة مكرسة للحفاظ على تقنيات ثني التوب السوداني التقليدي ونسج الصقيل الذهبي.',
    joined_date: '2026-06-01T00:00:00Z'
  }
];

const FALLBACK_CATEGORIES: BlogCategory[] = [
  { id: 'c1', name: 'Coffee & Drinks', name_ar: 'القهوة والمشروبات', slug: 'coffee-drinks', status: 'published', created_at: new Date().toISOString() },
  { id: 'c2', name: 'Bakery Heritage', name_ar: 'تراث المخبوزات', slug: 'bakery-heritage', status: 'published', created_at: new Date().toISOString() },
  { id: 'c3', name: 'Premium Collections', name_ar: 'التشكيلات الفاخرة', slug: 'premium-collections', status: 'published', created_at: new Date().toISOString() }
];

const FALLBACK_TAGS: BlogTag[] = [
  { id: 't1', name: 'Sudanese Heritage', name_ar: 'التراث السوداني', slug: 'sudanese-heritage', status: 'published' },
  { id: 't2', name: 'Specialty Coffee', name_ar: 'القهوة المختصة', slug: 'specialty-coffee', status: 'published' },
  { id: 't3', name: 'Luxury Fashion', name_ar: 'الأزياء الفاخرة', slug: 'luxury-fashion', status: 'published' }
];

export function mapCategoryName(name?: string): string {
  if (!name) return 'General Editorial';
  return name.trim();
}

const ARABIC_MOCK_DATA = [
  {
    title_ar: "طقوس الزعفران والذهب: الارتقاء بالضيافة السودانية والعربية",
    subtitle_ar: "سمفونية ذهبية تجمع بين توابل شرق إفريقيا والتحميص الملكي",
    subtitle: "A Golden Symbiosis of East African Spice & Royal Roasting",
    excerpt_ar: "كيف يتم إعادة ابتكار التوابل التقليدية داخل منصات القهوة الفاخرة في السعودية.",
    content_ar: "لطالما كان الزعفران علامة فارقة في المناسبات الكبرى في البيوت التقليدية. يتم غليه تقليديًا بشكل خفيف مع بذور مختارة، والآن يدخل عصرًا ذهبيًا حديثًا في زوال. يحلل خبراء التحميص لدينا حبوب البن على طبقات دقيقة لتكوين منحنيات تحميص تتطابق مع المظهر الزهري الرقيق للزعفران عالي الجودة. لا يتعلق الأمر بطمس نكهة المنشأ للمشروب؛ بل بتركيب تعايش فاخر حيث تمتزج عناصر الإسبريسو بسلاسة مع التوابل الذهبية. هذه هي ضيافة المستقبل."
  },
  {
    title_ar: "فيزياء خبز الهوبوز التقليدي المخبوز على الحطب",
    subtitle_ar: "التبثر الحراري المثالي: الماء، الحجر، والحركة الحرارية عند 420 درجة مئوية",
    subtitle: "The Perfect Thermodynamic Blister: Water, Stone, and 420°C Thermal Kinetics",
    excerpt_ar: "دراسة التقاطع بين حضارات الخميرة البرية وميكانيكا التبثر بالحرارة العالية داخل مختبرات مطابخنا.",
    content_ar: "لماذا يعتبر خبز الهوبوز السوداني التقليدي خفيفًا ومع ذلك مرنًا؟ يقف وراء طاولات الإنتاج لدينا نهج متقدم للحرارة والترطيب. في مختبرات مخابز زوال، نتعامل مع الخبز على الحجر كعلم دقيق. من خلال دمج مزارع الخميرة الحامضة المتوارثة منذ 8 سنوات واستخدام عملية التبثر السريع على نار الحطب عند 420 درجة مئوية بالضبط، ننتج خبزًا خفيفًا للغاية يحتفظ بالرطوبة دون عوامل تخمير اصطناعية. إنها فيزياء الخبز التقليدية الصافية التي تعمل جنبًا إلى جنب مع دقيق الجيزة العضوي الغني."
  },
  {
    title_ar: "الموروثات المنسوجة: حرفة التوب السوداني المغزول يدويًا",
    subtitle_ar: "شعر مكتوب في الحركة: قطن متوارث وحرير صقيل ذهبي",
    subtitle: "Written Poetry in Movement: Heirloom Cotton & Gold Silk Filigree",
    excerpt_ar: "اكتشف التفاصيل الدقيقة للقطن العضوي الفاخر وألياف الحرير الذهبية في أثوابنا الأيقونية المستوردة.",
    content_ar: "الملابس التقليدية هي أكثر من مجرد عمل؛ إنها شعر مكتوب في حركة. ينسدل فستان التوب التقليدي بعمق ملموس ثقيل، ليلتف حول القوام بتموجات أنيقة. نحن نستورد ملابس تتميز بقطن طويل التيلة وخيوط مغلفة بالذهب تشكل حدودًا هندسية جميلة مباشرة على أسطح النول. في موقع البيع بالتجزئة الخاص بنا، نضمن أن كل فستان رسمي مستورد بمثابة عمل فني متنقل."
  }
];

const FALLBACK_BLOG_POSTS: BlogPost[] = ARTICLES.map((art, idx) => {
  const authorId = art.author?.includes('Vagner') ? 'a2' : art.author?.includes('Saud') ? 'a3' : 'a1';
  const authorObj = FALLBACK_AUTHORS.find(a => a.id === authorId) || FALLBACK_AUTHORS[0];
  const catName = mapCategoryName(art.category);
  const arData = (ARABIC_MOCK_DATA[idx] || {}) as any;
  return {
    id: art.id || `art-${idx}`,
    title: art.title,
    title_ar: arData.title_ar,
    slug: (art.title || 'post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    subtitle: arData.subtitle,
    subtitle_ar: arData.subtitle_ar,
    excerpt: art.excerpt,
    excerpt_ar: arData.excerpt_ar,
    content: art.content,
    content_ar: arData.content_ar,
    featured_image: art.image,
    is_featured: idx === 0,
    reading_time: parseInt(art.readTime) || 5,
    view_count: 120 + idx * 45,
    like_count: 34 + idx * 12,
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author_id: authorId,
    zoal_blog_authors: { 
      name: authorObj.name, 
      name_ar: authorObj.name_ar, 
      avatar_url: authorObj.avatar_url, 
      bio: authorObj.bio, 
      bio_ar: authorObj.bio_ar, 
      expertise: authorObj.expertise,
      expertise_ar: authorObj.expertise_ar,
      id: authorObj.id 
    } as any,
    zoal_blog_categories: { 
      name: catName, 
      name_ar: catName === 'Coffee & Drinks' ? 'القهوة والمشروبات' : catName === 'Bakery Heritage' ? 'تراث المخبوزات' : 'التشكيلات الفاخرة',
      slug: (catName || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-') 
    }
  };
});

export const blogService = {
  async getPosts(params?: { category?: string; tag?: string; search?: string; status?: string }): Promise<BlogPost[]> {
    try {
      let url = '/api/blog';
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.set('category', params.category);
      if (params?.tag) queryParams.set('tag', params.tag);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status) queryParams.set('status', params.status);
      if (queryParams.toString()) url += `?${queryParams.toString()}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch blog posts');
      const data = await res.json();
      const rawPosts = Array.isArray(data.posts) ? data.posts : FALLBACK_BLOG_POSTS;
      return rawPosts.map((post: BlogPost) => ({
        ...post,
        zoal_blog_categories: post.zoal_blog_categories ? {
          ...post.zoal_blog_categories,
          name: mapCategoryName(post.zoal_blog_categories.name)
        } : undefined
      }));
    } catch (e) {
      console.warn('Backend blog service getPosts using fallback articles:', e);
      return FALLBACK_BLOG_POSTS.map((post: BlogPost) => ({
        ...post,
        zoal_blog_categories: post.zoal_blog_categories ? {
          ...post.zoal_blog_categories,
          name: mapCategoryName(post.zoal_blog_categories.name)
        } : undefined
      }));
    }
  },

  async createPost(payload: Partial<BlogPost>): Promise<BlogPost> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create blog post');
    return res.json();
  },

  async updatePost(id: string, payload: Partial<BlogPost>): Promise<BlogPost> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/blog/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update blog post');
    return res.json();
  },

  async deletePost(id: string): Promise<void> {
    const headers = await getAuthHeaders(null);
    const res = await fetch(`/api/blog/${id}`, { 
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete blog post');
  },

  async getCategories(): Promise<BlogCategory[]> {
    try {
      const res = await fetch('/api/blog/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      const rawCategories = Array.isArray(data) ? data : FALLBACK_CATEGORIES;
      return rawCategories.map(cat => ({
        ...cat,
        name: mapCategoryName(cat.name)
      }));
    } catch (e) {
      console.warn('Backend blog service getCategories using fallbacks:', e);
      return FALLBACK_CATEGORIES.map(cat => ({
        ...cat,
        name: mapCategoryName(cat.name)
      }));
    }
  },

  async createCategory(payload: Partial<BlogCategory>): Promise<BlogCategory> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/categories', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  async updateCategory(id: string, payload: Partial<BlogCategory>): Promise<BlogCategory> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/blog/categories/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const headers = await getAuthHeaders(null);
    const res = await fetch(`/api/blog/categories/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },

  async getTags(): Promise<BlogTag[]> {
    try {
      const res = await fetch('/api/blog/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : FALLBACK_TAGS;
    } catch (e) {
      console.warn('Backend blog service getTags using fallbacks:', e);
      return FALLBACK_TAGS;
    }
  },

  async createTag(payload: Partial<BlogTag>): Promise<BlogTag> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/tags', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create tag');
    return res.json();
  },

  async deleteTag(id: string): Promise<void> {
    const headers = await getAuthHeaders(null);
    const res = await fetch(`/api/blog/tags/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete tag');
  },

  async getComments(postId?: string): Promise<BlogComment[]> {
    try {
      const headers = await getAuthHeaders(null);
      const url = postId ? `/api/blog/comments?postId=${postId}` : '/api/blog/comments';
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    } catch (e) {
      console.warn('Backend comments unavailable:', e);
      return [];
    }
  },

  async createComment(payload: Partial<BlogComment>): Promise<BlogComment> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to create comment');
      }
      return res.json();
    } catch (e) {
      console.error('Backend createComment failed:', e);
      throw e;
    }
  },

  async updateCommentStatus(id: string, status: string): Promise<BlogComment> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/blog/comments/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to update comment status');
      }
      return res.json();
    } catch (e) {
      console.error('Backend updateCommentStatus failed:', e);
      throw e;
    }
  },

  async deleteComment(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/blog/comments/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || 'Failed to delete comment');
      }
    } catch (e) {
      console.error('Backend deleteComment failed:', e);
      throw e;
    }
  },

  async getAuthors(): Promise<BlogAuthor[]> {
    try {
      const res = await fetch('/api/blog/authors');
      if (!res.ok) throw new Error('Failed to fetch authors');
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data : FALLBACK_AUTHORS;
    } catch (e) {
      console.warn('Backend blog service getAuthors using fallbacks:', e);
      return FALLBACK_AUTHORS;
    }
  },

  async getMedia(): Promise<BlogMedia[]> {
    try {
      const res = await fetch('/api/blog/media');
      if (!res.ok) throw new Error('Failed to fetch media');
      return res.json();
    } catch (e) {
      console.warn('Backend media unavailable:', e);
      return [];
    }
  },

  async uploadMedia(payload: Partial<BlogMedia>): Promise<BlogMedia> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/media', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to upload media metadata');
    return res.json();
  },

  async updateMedia(id: string, payload: Partial<BlogMedia>): Promise<BlogMedia> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/blog/media/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update media');
    return res.json();
  },

  async deleteMedia(id: string): Promise<void> {
    const headers = await getAuthHeaders(null);
    const res = await fetch(`/api/blog/media/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete media');
  },

  async getPostSeo(postId: string): Promise<BlogSeo | null> {
    try {
      const res = await fetch(`/api/blog/seo/${postId}`);
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.warn('Backend getPostSeo unavailable:', e);
      return null;
    }
  },

  async upsertPostSeo(payload: Partial<BlogSeo>): Promise<BlogSeo> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/seo', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save SEO metadata');
    return res.json();
  },

  async subscribeNewsletter(email: string): Promise<void> {
    try {
      const res = await fetch('/api/blog/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Failed to subscribe to newsletter');
    } catch (e) {
      console.warn('Backend newsletter subscription fallback used:', e);
    }
  },

  async getRevisions(postId: string): Promise<BlogRevision[]> {
    try {
      const res = await fetch(`/api/blog/revisions/${postId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.warn('Backend getRevisions unavailable:', e);
      return [];
    }
  },

  async createRevision(payload: { post_id: string; title: string; content: string; created_by?: string }): Promise<BlogRevision> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/revisions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save article revision');
    return res.json();
  },

  async translateBlogContent(payload: {
    sourceLang: 'en' | 'ar';
    targetLang: 'en' | 'ar';
    title: string;
    subtitle?: string;
    excerpt?: string;
    content: string;
  }): Promise<{
    translatedTitle: string;
    translatedSubtitle: string;
    translatedExcerpt: string;
    translatedContent: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/ai-translate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to generate AI translation');
    }
    return res.json();
  },

  async schedulePost(postId: string, scheduledPublishAt: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/schedule', {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_id: postId, scheduled_publish_at: scheduledPublishAt })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to schedule article publication');
    }
    return res.json();
  },

  async cancelSchedule(postId: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/blog/schedule/cancel', {
      method: 'POST',
      headers,
      body: JSON.stringify({ post_id: postId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel schedule');
    }
    return res.json();
  },

  async getSchedules(postId?: string): Promise<any[]> {
    try {
      const headers = await getAuthHeaders();
      const url = postId ? `/api/blog/schedule?postId=${postId}` : '/api/blog/schedule';
      const res = await fetch(url, { headers });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.warn('Backend getSchedules unavailable:', e);
      return [];
    }
  },

  async trackView(postId: string): Promise<any> {
    const res = await fetch(`/api/blog/posts/${postId}/view`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to track post view');
    }
    return res.json();
  }
};
