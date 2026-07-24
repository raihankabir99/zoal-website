import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Calendar, User, Tag as TagIcon, 
  ChevronRight, Filter, Grid, List as ListIcon 
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
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaInfo, setMetaInfo] = useState<any>(null);

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
          fetchedPosts = await blogService.getPosts(); // Need to filter by author client side or update service
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
    if (type === 'category') return metaInfo?.name || 'Category Archive';
    if (type === 'tag') return `#${metaInfo?.name || 'Tag'}`;
    if (type === 'author') return `Editor: ${metaInfo?.name || 'Author'}`;
    return 'The Archives';
  };

  const getPageDescription = () => {
    if (type === 'category') return metaInfo?.description || 'Curated narratives from our specialized collections.';
    if (type === 'author') return metaInfo?.bio || 'Meet our distinguished contributor delivering global insights.';
    return 'Exploring the depth of Al Zoal editorial heritage.';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <header className="space-y-6">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-zinc-500 hover:text-gold-pure text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Journal
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-12">
          <div className="space-y-4 max-w-2xl">
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono">Archive Exploration</span>
            <h1 className="text-4xl sm:text-6xl font-bold text-white font-display uppercase tracking-tight">
              {getPageTitle()}
            </h1>
            <p className="text-zinc-500 text-sm sm:text-lg font-light leading-relaxed">
              {getPageDescription()}
            </p>
          </div>

          <div className="flex items-center gap-4 text-zinc-500 font-mono text-[10px] uppercase">
            <span className="bg-zinc-950 px-3 py-2 rounded-xs border border-white/5">
              {posts.length} Editorials
            </span>
          </div>
        </div>
      </header>

      {/* Grid */}
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
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-gold-pure rounded-full" />
                  <span>{post.reading_time || 5} MIN READ</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display uppercase tracking-widest group-hover:text-gold-pure transition-colors leading-snug line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold-pure/20 flex items-center justify-center overflow-hidden border border-gold-pure/30">
                      {post.zoal_blog_authors?.avatar_url ? (
                        <img src={post.zoal_blog_authors.avatar_url} className="w-full h-full object-cover" />
                      ) : <User className="w-3 h-3 text-gold-pure" />}
                    </div>
                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">{post.zoal_blog_authors?.name || 'AL ZOAL'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-gold-pure transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 space-y-4 bg-zinc-950/30 rounded-sm border border-dashed border-white/10">
          <Grid className="w-12 h-12 text-zinc-800 mx-auto" />
          <p className="text-zinc-500 text-sm italic">The archives are currently silent in this section.</p>
          <button onClick={onBack} className="text-[10px] text-gold-pure font-bold uppercase tracking-widest hover:underline">Return to Main Journal</button>
        </div>
      )}
    </div>
  );
}
