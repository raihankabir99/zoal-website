import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, User, Clock, ArrowRight, ChevronRight, 
  Search, TrendingUp, Sparkles, Newspaper, Coffee, 
  Utensils, Shirt, Briefcase, Heart, Building2, Globe
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';
import ScrollZoomImage from '../ScrollZoomImage';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  coffee: Coffee,
  'coffee-drinks': Coffee,
  'coffee & drinks': Coffee,
  bakery: Utensils,
  'bakery-heritage': Utensils,
  'bakery heritage': Utensils,
  fashion: Shirt,
  'luxury-fashion': Shirt,
  'luxury fashion': Shirt,
  business: Briefcase,
  lifestyle: Heart,
  'premium-collections': Sparkles,
  'premium collections': Sparkles,
  news: Newspaper,
  company: Newspaper,
  updates: Newspaper,
};

const getCategoryIcon = (iconName?: string, slug?: string) => {
  const keysToTry = [
    iconName?.toLowerCase().trim(),
    slug?.toLowerCase().trim()
  ].filter(Boolean) as string[];

  for (const k of keysToTry) {
    if (CATEGORY_ICONS[k]) return CATEGORY_ICONS[k];
  }
  return Newspaper;
};

interface BlogHomeProps {
  onPostClick: (post: BlogPost) => void;
  onCategoryClick: (id: string) => void;
}

export function BlogHome({ onPostClick, onCategoryClick }: BlogHomeProps) {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localized = (obj: any, field: string) => {
    const arField = `${field}_ar`;
    if (i18n.language === 'ar' && obj && obj[arField]) return obj[arField];
    return obj?.[field] || '';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c] = await Promise.all([
          blogService.getPosts({ status: 'published' }),
          blogService.getCategories()
        ]);
        setPosts(p);
        setCategories(c);
      } catch (err) {
        console.error('Failed to load blog home data:', err);
        setError(t('blog.unable_to_load_error', { defaultValue: 'Unable to load blog posts at this time. Please try again later.' }));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [t]);

  const featuredPosts = posts
    .filter(p => p.is_featured)
    .sort((a, b) => {
      if (a.featured_order !== undefined && b.featured_order !== undefined) {
        return a.featured_order - b.featured_order;
      }
      if (a.featured_order !== undefined) return -1;
      if (b.featured_order !== undefined) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  const featuredPost = featuredPosts[0] || posts[0];
  const latestPosts = posts.filter(p => p.id !== featuredPost?.id).slice(0, 6);
  const trendingPosts = [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center space-y-6">
        <h2 className="text-2xl font-bold text-white font-display uppercase tracking-widest">{t('blog.unable_to_load')}</h2>
        <p className="text-zinc-400 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-gold-pure text-black px-6 py-2 rounded-xs text-xs font-bold uppercase tracking-widest hover:bg-gold-light transition-all cursor-pointer"
        >
          {t('blog.try_again')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 space-y-4 animate-fade-in">
        <div className="w-8 h-8 border-2 border-gold-pure/20 border-t-gold-pure rounded-full animate-spin" />
        <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono animate-pulse">
          {t('blog.curating_editorials')}
        </span>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 px-4 text-center space-y-6 animate-fade-in">
        <Newspaper className="w-12 h-12 text-zinc-600" />
        <h2 className="text-xl font-bold text-white font-display uppercase tracking-widest">
          {t('blog.archive.no_articles')}
        </h2>
        <p className="text-zinc-500 text-xs sm:text-sm max-w-md tracking-wider">
          We are curating luxury editorial stories. Please check back soon.
        </p>
      </div>
    );
  }

  const sortedCategories = [...categories]
    .filter(cat => cat.is_active !== false)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const getCategoryPostCount = (catId: string, catSlug: string) => {
    return posts.filter(p => p.category_id === catId || p.zoal_blog_categories?.slug === catSlug).length;
  };

  return (
    <div className="space-y-12 sm:space-y-24 animate-fade-in">
      {featuredPost && (
        <section className="relative h-[55vh] min-h-[400px] sm:h-[80vh] sm:min-h-[600px] w-full overflow-hidden group">
          <div className="absolute inset-0 z-0">
            <SafeImage 
              src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&q=80'} 
              alt={localized(featuredPost, 'title')}
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
              priority={true}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end px-2.5 pb-4 pt-4 sm:p-12 lg:p-20 max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-3xl space-y-3 sm:space-y-6"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="bg-gold-pure text-black px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest rounded-xs">
                  {localized(featuredPost.zoal_blog_categories, 'name') || t('blog.featured')}
                </span>
                <span className="text-white/60 text-[8px] sm:text-[10px] font-mono uppercase tracking-widest">
                  {new Date(featuredPost.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-2xl sm:text-6xl font-bold text-white font-display uppercase tracking-wider leading-snug sm:leading-tight">
                {localized(featuredPost, 'title')}
              </h1>

              <p className="text-zinc-300 text-xs sm:text-lg max-w-2xl font-light leading-relaxed">
                {localized(featuredPost, 'excerpt')}
              </p>

              <div className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-4">
                <button 
                  onClick={() => onPostClick(featuredPost)}
                  className="bg-gold-pure text-black px-4 py-2 sm:px-8 sm:py-3 rounded-xs text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-gold-light transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
                >
                  {t('blog.read_article')}
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                </button>
                <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-[10px] sm:text-xs font-mono">
                  <span>⏱ {t('blog.min_read', { count: featuredPost.reading_time || 5 })}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest Articles Grid */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center sm:items-end mb-6 sm:mb-12 gap-2 sm:gap-4 px-2.5 sm:px-0">
          <div className="space-y-1 sm:space-y-2">
            <span className="text-[9px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-gold-pure uppercase font-display block">
              {t('blog.latest_articles')}
            </span>
            <h2 className="text-lg sm:text-3xl font-bold tracking-wider sm:tracking-widest text-white font-display uppercase leading-tight">
              {t('blog.latest_articles')}
            </h2>
          </div>
          <button className="text-gold-pure hover:text-white text-[8px] min-[360px]:text-[9px] sm:text-xs font-bold uppercase tracking-normal min-[360px]:tracking-wider sm:tracking-widest transition-colors flex items-center gap-1 sm:gap-2 group cursor-pointer whitespace-nowrap shrink-0 pb-0.5 sm:pb-1">
            {t('blog.explore_all')} <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 px-0 sm:px-6 lg:px-8">
          {latestPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-950/30 border border-white/5 rounded-sm overflow-hidden group hover:border-gold-pure/30 transition-all cursor-pointer flex flex-col"
              onClick={() => onPostClick(post)}
            >
              <div className="aspect-video overflow-hidden relative">
                <SafeImage 
                  src={post.featured_image || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80'} 
                  alt={localized(post, 'title')}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-black/80 backdrop-blur-md border border-white/10 text-gold-pure px-2 py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest">
                    {localized(post.zoal_blog_categories, 'name') || t('blog.categories.general')}
                  </span>
                </div>
              </div>
              <div className="px-2.5 py-3 sm:p-6 space-y-2 sm:space-y-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase">
                  <span>{new Date(post.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  <span className="w-1 h-1 bg-gold-pure rounded-full" />
                  <span>
                    {t('blog.by_author', { name: localized(post.zoal_blog_authors, 'name') || t('blog.editor') })} • ⏱ {t('blog.min_read', { count: post.reading_time || 5 })}
                  </span>
                </div>
                <h3 className="text-white text-base sm:text-xl font-bold font-display uppercase tracking-wide group-hover:text-gold-pure transition-colors line-clamp-2">
                  {localized(post, 'title')}
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 font-light leading-relaxed">
                  {localized(post, 'excerpt')}
                </p>
                <div className="pt-3 mt-auto flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold-pure/20 border border-gold-pure/40 flex items-center justify-center overflow-hidden">
                      {post.zoal_blog_authors?.avatar_url ? (
                        <img src={post.zoal_blog_authors.avatar_url} alt={localized(post.zoal_blog_authors, 'name') || t('blog.editor')} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-gold-pure" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-300 font-mono uppercase">
                      {localized(post.zoal_blog_authors, 'name') || t('blog.editor')}
                    </span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-pure group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending & Categories Section */}
      <section className="bg-zinc-950/50 pt-8 pb-4 sm:py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-16">
          {/* Trending Column */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-12 px-2.5 sm:px-0">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-gold-pure uppercase font-display block">
                {t('blog.most_popular')}
              </span>
              <h2 className="text-xl sm:text-3xl font-bold tracking-widest text-white font-display uppercase">
                {t('blog.most_popular')}
              </h2>
            </div>
            <div className="space-y-4 sm:space-y-8">
              {trendingPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex gap-3 sm:gap-6 group cursor-pointer"
                  onClick={() => onPostClick(post)}
                >
                  <span className="text-2xl sm:text-4xl font-bold text-white/10 font-display transition-colors group-hover:text-gold-pure/20">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="space-y-1 sm:space-y-2">
                    <span className="text-[8px] sm:text-[9px] text-gold-pure font-mono uppercase tracking-[0.2em]">
                      {localized(post.zoal_blog_categories, 'name') || t('blog.categories.lifestyle')}
                    </span>
                    <h3 className="text-sm sm:text-lg text-white font-bold font-display uppercase tracking-wide group-hover:text-gold-pure transition-colors">
                      {localized(post, 'title')}
                    </h3>
                    <div className="flex items-center gap-4 text-[8px] sm:text-[10px] text-zinc-500 font-mono">
                      <span>{t('blog.by_author', { name: localized(post.zoal_blog_authors, 'name') || t('blog.editor') })}</span>
                      <span>•</span>
                      <span>⏱ {t('blog.min_read', { count: post.reading_time || 5 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Sidebar */}
          <div className="space-y-6 sm:space-y-12 px-2.5 sm:px-0">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] sm:tracking-[0.4em] text-gold-pure uppercase font-display block">
                {t('blog.explore_topics')}
              </span>
              <h2 className="text-xl sm:text-3xl font-bold tracking-widest text-white font-display uppercase">
                {t('blog.explore_topics')}
              </h2>
            </div>
            <div className="space-y-3">
              {sortedCategories.length > 0 ? (
                sortedCategories.map((cat) => {
                  const IconComponent = getCategoryIcon(cat.icon, cat.slug);
                  const count = getCategoryPostCount(cat.id, cat.slug);
                  const displayName = localized(cat, 'name') || cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onCategoryClick(cat.id)}
                      className="w-full flex items-center justify-between p-3 sm:p-4 bg-black border border-white/5 rounded-xs hover:border-gold-pure/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 flex items-center justify-center rounded-xs group-hover:bg-gold-pure/10 transition-colors">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gold-pure" />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white font-bold uppercase tracking-widest">
                          {displayName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{count}</span>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 bg-zinc-950/40 border border-white/5 rounded-xs text-center">
                  <span className="text-zinc-500 text-[10px] uppercase tracking-widest">
                    {t('blog.no_topics_available', { defaultValue: 'No topics available' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Break / Instagram Grade */}
      <section className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 !mt-4 sm:!mt-24">
        {[
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1554047600-4763133644f1?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80'
        ].map((url, i) => (
          <div key={i} className="aspect-square rounded-sm overflow-hidden border border-white/5 group">
            <img src={url} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
          </div>
        ))}
      </section>
    </div>
  );
}
