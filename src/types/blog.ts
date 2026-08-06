export interface BlogPost {
  id: string;
  title: string;
  title_ar?: string;
  slug: string;
  subtitle?: string;
  subtitle_ar?: string;
  excerpt?: string;
  excerpt_ar?: string;
  content: string;
  content_ar?: string;
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
  status: 'draft' | 'in_review' | 'published' | 'scheduled' | 'archived';
  created_at: string;
  updated_at: string;
  zoal_blog_authors?: { name: string; name_ar?: string; avatar_url?: string; bio?: string; bio_ar?: string; expertise?: string; expertise_ar?: string; id?: string };
  zoal_blog_categories?: { name: string; name_ar?: string; slug: string };
}

export interface BlogCategory {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  description_ar?: string;
  parent_id?: string;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  name_ar?: string;
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
  name_ar?: string;
  email: string;
  bio?: string;
  bio_ar?: string;
  avatar_url?: string;
  status: string;
  expertise?: string;
  expertise_ar?: string;
  joined_date?: string;
}

export interface BlogMedia {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  bucket_name: string;
  created_at: string;
  alt_text?: string;
  caption?: string;
  original_url?: string;
  webp_url?: string;
}

export interface BlogSeo {
  id: string;
  post_id: string;
  meta_title?: string;
  meta_title_ar?: string;
  meta_description?: string;
  meta_description_ar?: string;
  canonical_url?: string;
  og_title?: string;
  og_title_ar?: string;
  og_description?: string;
  og_description_ar?: string;
  og_image?: string;
  twitter_card?: string;
}

export interface BlogRevision {
  id: string;
  post_id: string;
  title: string;
  content: string;
  revision_number: number;
  status?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

