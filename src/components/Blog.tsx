import React, { useState, useEffect } from 'react';
import { 
  Calendar, User, Clock, ArrowLeft, ArrowUpRight, 
  ChevronRight, Search as SearchIcon, Globe, Rss,
  LayoutGrid, List as ListIcon, Filter, TrendingUp
} from 'lucide-react';
import { ARTICLES } from '../data';
import { BlogPost } from '../types/blog';
import { blogService } from '../services/blogService';
import ScrollZoomImage from './ScrollZoomImage';
import { useTranslation } from 'react-i18next';
import { SafeImage } from '../imageRegistry';

// Sub-components
import { BlogHome } from './blog/BlogHome';
import { BlogArticle } from './blog/BlogArticle';
import { BlogSearch } from './blog/BlogSearch';
import { BlogGridPage } from './blog/BlogGridPage';

type BlogView = 'home' | 'article' | 'category' | 'tag' | 'author' | 'search' | 'archive' | 'trending';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState<BlogView>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  // Sync scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedPost, selectedId]);

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    setCurrentView('article');
  };

  const handleCategoryClick = (id: string) => {
    setSelectedId(id);
    setCurrentView('category');
  };

  const handleTagClick = (id: string) => {
    setSelectedId(id);
    setCurrentView('tag');
  };

  const handleAuthorClick = (id: string) => {
    setSelectedId(id);
    setCurrentView('author');
  };

  return (
    <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] relative">
      {/* Blog Global Header / Sub-Nav */}
      <div className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-[80px] sm:top-[84px] md:pt-[88px] lg:top-[92px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setCurrentView('home')}
              className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors cursor-pointer ${currentView === 'home' ? 'text-gold-pure' : 'text-zinc-500 hover:text-white'}`}
            >
              The Journal
            </button>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { name: 'Collections', view: 'search' as BlogView },
                { name: 'Archives', view: 'archive' as BlogView },
                { name: 'Trending', view: 'trending' as BlogView }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setCurrentView(item.view)}
                  className={`text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${currentView === item.view ? 'text-gold-pure' : 'text-zinc-500 hover:text-white'}`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentView('search')}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${currentView === 'search' ? 'text-gold-pure' : 'text-zinc-500 hover:text-white'}`}
            >
              <SearchIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-3">
              <a href="/api/blog/rss" target="_blank" className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Rss className="w-4 h-4" />
              </a>
              <a href="/sitemap.xml" target="_blank" className="text-zinc-500 hover:text-gold-pure transition-colors">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* View Controller */}
      <div className="pb-20">
        {currentView === 'home' && (
          <BlogHome 
            onPostClick={handlePostClick} 
            onCategoryClick={handleCategoryClick} 
          />
        )}

        {currentView === 'article' && selectedPost && (
          <BlogArticle 
            post={selectedPost} 
            onBack={() => setCurrentView('home')} 
            onPostClick={handlePostClick}
          />
        )}

        {currentView === 'search' && (
          <BlogSearch 
            onPostClick={handlePostClick} 
          />
        )}

        {['category', 'tag', 'author', 'archive', 'trending'].includes(currentView) && (
          <BlogGridPage 
            type={currentView as any}
            id={selectedId}
            onBack={() => setCurrentView('home')}
            onPostClick={handlePostClick}
          />
        )}
      </div>

      {/* Global Newsletter Section */}
      <section className="bg-zinc-950 border-t border-white/5 py-32 overflow-hidden relative">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-gold-pure/30 rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold-pure/20 rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center space-y-12">
          <div className="space-y-4">
            <span className="text-[10px] tracking-[0.6em] text-gold-pure uppercase font-display block">THE DISPATCH</span>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-display uppercase">SUBSCRIBE TO THE ARCHIVE</h2>
            <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Curated luxury insights, editorial narratives, and global strategy briefings delivered straight to your inbox. Join the Al Zoal inner circle.
            </p>
          </div>

          <form className="max-w-md mx-auto relative group">
            <input 
              type="email" 
              placeholder="ENTER YOUR EMAIL"
              className="w-full bg-black border border-white/10 rounded-xs px-6 py-5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-gold-pure transition-all pr-40 tracking-widest"
            />
            <button className="absolute right-2 top-2 bottom-2 bg-gold-pure text-black px-6 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-gold-light transition-all cursor-pointer">
              Sign Up
            </button>
          </form>

          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            By subscribing, you agree to our <a href="/privacy-policy" className="text-zinc-500 hover:text-gold-pure underline">Privacy Policy</a>
          </p>
        </div>
      </section>
    </div>
  );
}

