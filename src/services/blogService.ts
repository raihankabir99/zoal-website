import { supabaseClient } from '../lib/supabaseClient';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogAuthor, BlogMedia, BlogSeo, BlogRevision } from '../types/blog';

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

export const blogService = {
  async getPosts(params?: { 
    category?: string; 
    tag?: string; 
    author?: string; 
    search?: string; 
    status?: string; 
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<BlogPost[]> {
    let url = '/api/blog';
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.tag) queryParams.set('tag', params.tag);
    if (params?.author) queryParams.set('author', params.author);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (queryParams.toString()) url += `?${queryParams.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to fetch blog posts');
    }
    const data = await res.json();
    const rawPosts = Array.isArray(data.posts) ? data.posts : (Array.isArray(data) ? data : []);
    return rawPosts.map((post: BlogPost) => ({
      ...post,
      zoal_blog_categories: post.zoal_blog_categories ? {
        ...post.zoal_blog_categories,
        name: mapCategoryName(post.zoal_blog_categories.name)
      } : undefined
    }));
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
    const res = await fetch('/api/blog/categories');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to fetch categories');
    }
    const data = await res.json();
    const rawCategories = Array.isArray(data) ? data : [];
    return rawCategories.map(cat => ({
      ...cat,
      name: mapCategoryName(cat.name)
    }));
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
    const res = await fetch('/api/blog/tags');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to fetch tags');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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
    const res = await fetch('/api/blog/authors');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to fetch authors');
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
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
    const res = await fetch('/api/blog/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to subscribe to newsletter');
    }
  },

  async getLikeStatus(postId: string, userIdentifier?: string): Promise<{ liked: boolean; like_count: number }> {
    try {
      const query = userIdentifier ? `?userIdentifier=${encodeURIComponent(userIdentifier)}` : '';
      const res = await fetch(`/api/blog/posts/${postId}/like${query}`);
      if (!res.ok) return { liked: false, like_count: 0 };
      return res.json();
    } catch {
      return { liked: false, like_count: 0 };
    }
  },

  async toggleLike(postId: string, userIdentifier?: string): Promise<{ liked: boolean; like_count: number }> {
    const res = await fetch(`/api/blog/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdentifier })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Failed to update article like status');
    }
    return res.json();
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
