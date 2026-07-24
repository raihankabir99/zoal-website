import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, User, Clock, ArrowRight, ChevronRight, 
  Search, TrendingUp, Sparkles, Newspaper, Coffee, 
  Utensils, Shirt, Briefcase, Heart, Building2, Globe
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';
import ScrollZoomImage from '../ScrollZoomImage';

interface BlogHomeProps {
  onPostClick: (post: BlogPost) => void;
  onCategoryClick: (slug: string) => void;
}

export function BlogHome({ onPostClick, onCategoryClick }: BlogHomeProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const featuredPost = posts.find(p => p.is_featured) || posts[0];
  const latestPosts = posts.filter(p => p.id !== featuredPost?.id).slice(0, 6);
  const trendingPosts = posts.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 4);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 space-y-4 animate-fade-in">
        <div className="w-8 h-8 border-2 border-gold-pure/20 border-t-gold-pure rounded-full animate-spin" />
        <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono animate-pulse">
          CURATING EDITORIALS...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-24 animate-fade-in">
      {/* Hero Banner Section */}
      {featuredPost && (
        <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden group">
          <div className="absolute inset-0 z-0">
            <SafeImage 
              src={featuredPost.featured_image || 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&q=80'} 
              alt={featuredPost.title}
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
          </div>

          <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-12 lg:p-20 max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-3xl space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="bg-gold-pure text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-xs">
                  {featuredPost.zoal_blog_categories?.name || 'FEATURED'}
                </span>
                <span className="text-white/60 text-[10px] font-mono uppercase tracking-widest">
                  {new Date(featuredPost.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-bold text-white font-display uppercase tracking-wider leading-tight">
                {featuredPost.title}
              </h1>

              <p className="text-zinc-300 text-sm sm:text-lg max-w-2xl font-light leading-relaxed">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center gap-6 pt-4">
                <button 
                  onClick={() => onPostClick(featuredPost)}
                  className="bg-gold-pure text-black px-8 py-3 rounded-xs text-xs font-bold uppercase tracking-widest hover:bg-gold-light transition-all flex items-center gap-2 cursor-pointer group"
                >
                  Read Article
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                  <Clock className="w-4 h-4 text-gold-pure" />
                  <span>{featuredPost.reading_time || 5} MIN READ</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Latest Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">RECENT DISPATCHES</span>
            <h2 className="text-3xl font-bold tracking-widest text-white font-display uppercase">LATEST IN THE JOURNAL</h2>
          </div>
          <button className="text-gold-pure hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 group">
            View Archive <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-black/80 backdrop-blur-md border border-white/10 text-gold-pure px-2 py-1 text-[9px] font-bold uppercase tracking-widest">
                    {post.zoal_blog_categories?.name || 'General'}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono uppercase">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-gold-pure rounded-full" />
                  <span>{post.reading_time || 5} MIN</span>
                </div>
                <h3 className="text-white text-xl font-bold font-display uppercase tracking-wide group-hover:text-gold-pure transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-400 text-sm line-clamp-3 font-light leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="pt-4 mt-auto flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gold-pure/20 border border-gold-pure/40 flex items-center justify-center overflow-hidden">
                      {post.zoal_blog_authors?.avatar_url ? (
                        <img src={post.zoal_blog_authors.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3 h-3 text-gold-pure" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-300 font-mono uppercase">{post.zoal_blog_authors?.name || 'AL ZOAL EDITOR'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gold-pure group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending & Categories Section */}
      <section className="bg-zinc-950/50 py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Trending Column */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">MOST READ</span>
              <h2 className="text-3xl font-bold tracking-widest text-white font-display uppercase">TRENDING EDITORIALS</h2>
            </div>
            <div className="space-y-8">
              {trendingPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="flex gap-6 group cursor-pointer"
                  onClick={() => onPostClick(post)}
                >
                  <span className="text-4xl font-bold text-white/10 font-display transition-colors group-hover:text-gold-pure/20">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="space-y-2">
                    <span className="text-[9px] text-gold-pure font-mono uppercase tracking-[0.2em]">
                      {post.zoal_blog_categories?.name || 'LIFE STYLE'}
                    </span>
                    <h3 className="text-lg text-white font-bold font-display uppercase tracking-wide group-hover:text-gold-pure transition-colors">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                      <span>{post.zoal_blog_authors?.name || 'AL ZOAL'}</span>
                      <span>•</span>
                      <span>{post.reading_time || 5} MIN READ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Sidebar */}
          <div className="space-y-12">
            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block">TAXONOMY</span>
              <h2 className="text-3xl font-bold tracking-widest text-white font-display uppercase">CATEGORIES</h2>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Coffee Stories', icon: Coffee, count: 12, slug: 'coffee' },
                { name: 'Gourmet Bakery', icon: Utensils, count: 8, slug: 'bakery' },
                { name: 'Luxury Fashion', icon: Shirt, count: 15, slug: 'fashion' },
                { name: 'Business & Strategy', icon: Briefcase, count: 6, slug: 'business' },
                { name: 'Lifestyle', icon: Heart, count: 22, slug: 'lifestyle' },
                { name: 'Company News', icon: Newspaper, count: 4, slug: 'company' }
              ].map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => onCategoryClick(cat.slug)}
                  className="w-full flex items-center justify-between p-4 bg-black border border-white/5 rounded-xs hover:border-gold-pure/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-900 flex items-center justify-center rounded-xs group-hover:bg-gold-pure/10 transition-colors">
                      <cat.icon className="w-5 h-5 text-gold-pure" />
                    </div>
                    <span className="text-xs text-white font-bold uppercase tracking-widest">{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{cat.count}</span>
                </button>
              ))}
            </div>

            {/* Newsletter Mini-Block */}
            <div className="bg-gold-pure p-8 rounded-xs space-y-4">
              <h3 className="text-black text-xl font-bold font-display uppercase tracking-wider">THE JOURNAL V.I.P</h3>
              <p className="text-black/70 text-xs font-medium leading-relaxed">
                Join our inner circle for exclusive editorial content and luxury insights.
              </p>
              <div className="space-y-2">
                <input 
                  type="email" 
                  placeholder="Email Address"
                  className="w-full bg-black/10 border border-black/20 rounded-xs px-4 py-3 text-xs text-black placeholder:text-black/40 outline-none focus:border-black"
                />
                <button className="w-full bg-black text-white py-3 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-colors cursor-pointer">
                  Subscribe Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Break / Instagram Grade */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
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
