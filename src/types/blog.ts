export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_json?: any;
  featured_image?: string;
  gallery_images?: string[];
  author_id?: string;
  category_id?: string;
  reading_time?: number;
  is_featured?: boolean;
  allow_comments?: boolean;
  view_count?: number;
  like_count?: number;
  published_at?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  created_at: string;
  updated_at: string;
  zoal_blog_authors?: { name: string; avatar_url?: string };
  zoal_blog_categories?: { name: string; slug: string };
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  created_at: string;
  zoal_blog_posts?: { title: string; slug: string };
}

export interface BlogAuthor {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  status: string;
}

export interface BlogMedia {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  bucket_name: string;
  created_at: string;
}

export interface BlogSeo {
  id: string;
  post_id: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card?: string;
}
