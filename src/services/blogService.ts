import { supabaseClient } from '../lib/supabaseClient';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogAuthor, BlogMedia, BlogSeo } from '../types/blog';

export const blogService = {
  async getPosts(params?: { category?: string; tag?: string; search?: string; status?: string }): Promise<BlogPost[]> {
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
    return data.posts || [];
  },

  async createPost(payload: Partial<BlogPost>): Promise<BlogPost> {
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create blog post');
    return res.json();
  },

  async updatePost(id: string, payload: Partial<BlogPost>): Promise<BlogPost> {
    const res = await fetch(`/api/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update blog post');
    return res.json();
  },

  async deletePost(id: string): Promise<void> {
    const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete blog post');
  },

  async getCategories(): Promise<BlogCategory[]> {
    const res = await fetch('/api/blog/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getTags(): Promise<BlogTag[]> {
    const res = await fetch('/api/blog/tags');
    if (!res.ok) throw new Error('Failed to fetch tags');
    return res.json();
  },

  async getComments(): Promise<BlogComment[]> {
    const res = await fetch('/api/blog/comments');
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async updateCommentStatus(id: string, status: string): Promise<BlogComment> {
    const res = await fetch(`/api/blog/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update comment status');
    return res.json();
  },

  async getAuthors(): Promise<BlogAuthor[]> {
    const res = await fetch('/api/blog/authors');
    if (!res.ok) throw new Error('Failed to fetch authors');
    return res.json();
  },

  async getMedia(): Promise<BlogMedia[]> {
    const res = await fetch('/api/blog/media');
    if (!res.ok) throw new Error('Failed to fetch media');
    return res.json();
  },

  async subscribeNewsletter(email: string): Promise<void> {
    const res = await fetch('/api/blog/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Failed to subscribe to newsletter');
  }
};
