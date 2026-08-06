import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Calendar, User, Tag as TagIcon, 
  ChevronRight, Filter, Grid, List as ListIcon,
  Eye, Award, Compass, BookOpen, Clock, CalendarDays 
} from 'lucide-react';
import { BlogPost, BlogCategory, BlogTag, BlogAuthor } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';

interface BlogGridPageProps {
  type: 'category' | 'tag' | 'author' | 'archive';
  id?: string;
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
}

export function BlogGridPage({ type, id, onBack, onPostClick }: BlogGridPageProps) {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaInfo, setMetaInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'all'>(type === 'author' ? 'profile' : 'all');

  const localized = (obj: any, field: string) => {
    const arField = `${field}_ar`;
    if (i18n.language === 'ar' && obj && obj[arField]) return obj[arField];
    return obj?.[field] || '';
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let fetchedPosts: BlogPost[] = [];
        let info: any = null;

        if (type === 'category' && id) {
          fetchedPosts = await blogService.getPosts({ category: id });
          const categories = await blogService.getCategories();
          info = categories.find(c => c.id === id);
        } else if (type === 'tag' && id) {
          fetchedPosts = await blogService.getPosts({ tag: id });
          const tags = await blogService.getTags();
          info = tags.find(t => t.id === id);
        } else if (type === 'author' && id) {
          fetchedPosts = await blogService.getPosts();
          fetchedPosts = fetchedPosts.filter(p => p.author_id === id);
          const authors = await blogService.getAuthors();
          info = authors.find(a => a.id === id);
        } else {
          fetchedPosts = await blogService.getPosts();
        }

        setPosts(fetchedPosts);
        setMetaInfo(info);
      } catch (err) {
        console.error('Failed to load grid page:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [type, id]);

  const getPageTitle = () => {
    if (type === 'category') {
      return localized(metaInfo, 'name') || t('blog.archive.category');
    }
    if (type === 'tag') {
      const tagName = localized(metaInfo, 'name') || 'Tag';
      return `#${tagName}`;
    }
    if (type === 'author') {
      const authorName = localized(metaInfo, 'name') || t('blog.author');
      return t('blog.archive.author', { name: authorName });
    }
    return t('blog.archive.general');
  };

  const getPageDescription = () => {
    if (type === 'category') {
      return localized(metaInfo, 'description') || t('blog.archive.category_desc');
    }
    if (type === 'author') {
      return localized(metaInfo, 'bio') || t('blog.archive.author_desc');
    }
    return t('blog.archive.general_desc');
  };

  // Aggregated analytics for Author Profile
  const totalArticles = posts.length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const categoriesWritten = Array.from(
    new Set(posts.map(p => localized(p.zoal_blog_categories, 'name')).filter(Boolean))
  );
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return i18n.language === 'ar' ? 'مارس ٢٠٢٦' : 'March 2026';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return i18n.language === 'ar' ? 'مارس ٢٠٢٦' : 'March 2026';
    }
  };

  const latestPosts = [...posts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Back to Journal Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 hover:text-gold-pure text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          {t('blog.back_to_journal')}
        </button>

        {type === 'author' && !loading && (
          <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-xs">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all rounded-xs cursor-pointer ${activeTab === 'profile' ? 'bg-gold-pure text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              {t('blog.reader_status')}
            </button>
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all rounded-xs cursor-pointer ${activeTab === 'all' ? 'bg-gold-pure text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              {t('blog.archive.latest_contributions')} ({totalArticles})
            </button>
          </div>
        )}
      </div>

      {/* DETAILED AUTHOR PROFILE MODE */}
      {type === 'author' && activeTab === 'profile' && !loading && (
        <div className="space-y-16">
          {/* Main Dossier Card */}
          <div className="bg-zinc-950 border border-white/5 p-8 md:p-12 rounded-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-pure/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                <div className="w-24 h-24 rounded-full border border-gold-pure/30 p-1 bg-black flex-shrink-0 overflow-hidden shadow-2xl">
                  {metaInfo?.avatar_url ? (
                    <img src={metaInfo.avatar_url} alt={localized(metaInfo, 'name') || t('blog.author')} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center">
                      <User className="w-8 h-8 text-gold-pure" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono block">{t('blog.archive.dossier')}</span>
                  <h1 className="text-3xl sm:text-5xl font-bold text-white font-display uppercase tracking-wider">
                    {localized(metaInfo, 'name') || t('blog.author')}
                  </h1>
                  
                  {/* Expertise badge */}
                  <div className="inline-flex items-center gap-2 bg-gold-pure/10 border border-gold-pure/30 text-gold-pure px-3 py-1 text-[10px] uppercase font-mono tracking-widest rounded-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>{localized(metaInfo, 'expertise') || t('blog.editor')}</span>
                  </div>

                  <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-2xl pt-2">
                    {localized(metaInfo, 'bio') || t('blog.archive.author_desc')}
                  </p>
                </div>
              </div>

              {/* Induction Date Badge */}
              <div className="self-center md:self-start bg-zinc-900/50 border border-white/5 px-4 py-3 rounded-xs flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                <CalendarDays className="w-4 h-4 text-gold-pure" />
                <div>
                  <span className="block text-[8px] text-zinc-500">{t('blog.archive.induction')}</span>
                  <span className="text-white font-bold">{formatDate(metaInfo?.joined_date || metaInfo?.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/5">
              <div className="p-6 bg-black border border-white/5 rounded-xs flex items-center gap-4 group hover:border-gold-pure/20 transition-all">
                <div className="w-10 h-10 rounded-full bg-gold-pure/5 border border-gold-pure/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-gold-pure" />
                </div>
                <div>
                  <span className="block text-2xl font-bold text-white font-mono">{totalArticles}</span>
                  <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{t('blog.archive.editorials_penned')}</span>
                </div>
              </div>

              <div className="p-6 bg-black border border-white/5 rounded-xs flex items-center gap-4 group hover:border-gold-pure/20 transition-all">
                <div className="w-10 h-10 rounded-full bg-gold-pure/5 border border-gold-pure/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-gold-pure" />
                </div>
                <div>
                  <span className="block text-2xl font-bold text-white font-mono">{totalViews.toLocaleString()}</span>
                  <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{t('blog.archive.readers_engaged')}</span>
                </div>
              </div>

              <div className="p-6 bg-black border border-white/5 rounded-xs flex items-center gap-4 group hover:border-gold-pure/20 transition-all">
                <div className="w-10 h-10 rounded-full bg-gold-pure/5 border border-gold-pure/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-gold-pure" />
                </div>
                <div>
                  <span className="block text-2xl font-bold text-white font-mono">{categoriesWritten.length}</span>
                  <span className="block text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{t('blog.archive.thematic_horizons')}</span>
                </div>
              </div>
            </div>

            {/* Categories Written section */}
            {categoriesWritten.length > 0 && (
              <div className="pt-6 border-t border-white/5 space-y-3">
                <span className="text-[9px] tracking-[0.2em] text-zinc-500 uppercase font-mono block">{t('blog.archive.established_channels')}</span>
                <div className="flex flex-wrap gap-2">
                  {categoriesWritten.map((cat, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 bg-zinc-900 border border-white/5 hover:border-gold-pure/30 transition-colors text-white rounded-xs text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5"
                    >
                      <span className="w-1 h-1 rounded-full bg-gold-pure" />
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LATEST ARTICLES PANEL */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] tracking-[0.3em] text-gold-pure uppercase font-mono">CURATED DISPATCHES</span>
                <h2 className="text-xl font-bold text-white font-display uppercase tracking-wider">{t('blog.archive.latest_contributions')}</h2>
              </div>
            </div>

            {latestPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {latestPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 group cursor-pointer"
                    onClick={() => onPostClick(post)}
                  >
                    <div className="aspect-[16/10] rounded-sm overflow-hidden border border-white/5 relative">
                      <SafeImage src={post.featured_image} alt={localized(post, 'title')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[8px] text-zinc-500 font-mono uppercase tracking-widest">
                        <span>{new Date(post.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                        <span className="w-1 h-1 bg-gold-pure rounded-full" />
                        <span>⏱ {t('blog.min_read', { count: post.reading_time || 5 })}</span>
                      </div>
                      <h3 className="text-base font-bold text-white font-display uppercase tracking-wider group-hover:text-gold-pure transition-colors leading-snug line-clamp-2">
                        {localized(post, 'title')}
                      </h3>
                      <p className="text-zinc-500 text-xs font-light leading-relaxed line-clamp-2">
                        {localized(post, 'excerpt')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-xs italic">{t('blog.archive.no_contributions')}</p>
            )}

            {/* View All Articles button */}
            <div className="flex justify-center pt-8">
              <button 
                onClick={() => {
                  setActiveTab('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-3 bg-zinc-950 border border-white/10 hover:border-gold-pure text-gold-pure hover:text-white rounded-xs text-[10px] font-mono uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{t('blog.explore_all')} ({totalArticles})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD GRID / ALL ARTICLES ARCHIVE MODE */}
      {(type !== 'author' || activeTab === 'all') && (
        <div className="space-y-12">
          {/* Page Header (reused or tailored) */}
          <header className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
              <div className="space-y-4 max-w-2xl">
                <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono">
                  {type === 'author' ? t('blog.archive.dossier') : t('blog.archive.general')}
                </span>
                <h1 className="text-4xl sm:text-6xl font-bold text-white font-display uppercase tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-zinc-500 text-sm sm:text-lg font-light leading-relaxed">
                  {getPageDescription()}
                </p>
              </div>

              <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px] uppercase">
                <span className="bg-zinc-950 px-3 py-2 rounded-xs border border-white/5">
                  {t('blog.archive.editorials_count', { count: posts.length })}
                </span>
              </div>
            </div>
          </header>

          {/* Grid list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-6">
                  <div className="aspect-[16/10] bg-zinc-900 rounded-sm" />
                  <div className="space-y-3">
                    <div className="h-4 bg-zinc-900 w-1/4 rounded" />
                    <div className="h-6 bg-zinc-900 w-3/4 rounded" />
                    <div className="h-4 bg-zinc-900 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 group cursor-pointer"
                  onClick={() => onPostClick(post)}
                >
                  <div className="aspect-[16/10] rounded-sm overflow-hidden border border-white/5 relative">
                    <SafeImage src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                      <span>{new Date(post.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      <span className="w-1 h-1 bg-gold-pure rounded-full" />
                      <span>⏱ {t('blog.min_read', { count: post.reading_time || 5 })}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white font-display uppercase tracking-widest group-hover:text-gold-pure transition-colors leading-snug line-clamp-2">
                      {localized(post, 'title')}
                    </h3>
                    <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-3">
                      {localized(post, 'excerpt')}
                    </p>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gold-pure/20 flex items-center justify-center overflow-hidden border border-gold-pure/30">
                          {post.zoal_blog_authors?.avatar_url ? (
                            <img src={post.zoal_blog_authors.avatar_url} alt={localized(post.zoal_blog_authors, 'name') || t('blog.editor')} className="w-full h-full object-cover" />
                          ) : <User className="w-3 h-3 text-gold-pure" />}
                        </div>
                        <span className="text-[10px] text-white font-bold uppercase tracking-widest">
                          {localized(post.zoal_blog_authors, 'name') || t('blog.editor')}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-gold-pure transition-colors rtl:rotate-180" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 space-y-4 bg-zinc-950/30 rounded-sm border border-dashed border-white/10">
              <Grid className="w-12 h-12 text-zinc-800 mx-auto" />
              <p className="text-zinc-500 text-sm italic">{t('blog.archive.no_articles')}</p>
              <button onClick={onBack} className="text-[10px] text-gold-pure font-bold uppercase tracking-widest hover:underline">{t('blog.back_to_journal')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
