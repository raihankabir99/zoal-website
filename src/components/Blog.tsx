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

interface BlogProps {
  onPostSelect?: (post: BlogPost | null) => void;
  currentUser?: any;
}

export default function Blog({ onPostSelect, currentUser }: BlogProps) {
  const { t, i18n } = useTranslation();
  const [currentView, setCurrentView] = useState<BlogView>('home');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [subscribed, setSubscribed] = useState(false);

  // Notify parent of selected post for SEO
  useEffect(() => {
    if (onPostSelect) {
      if (currentView === 'article' && selectedPost) {
        onPostSelect(selectedPost);
      } else {
        onPostSelect(null);
      }
    }
  }, [currentView, selectedPost, onPostSelect]);

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
            onAuthorClick={handleAuthorClick}
            currentUser={currentUser}
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
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-display uppercase">{t('blog.stay_updated')}</h2>
            <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              {t('blog.newsletter_desc')}
            </p>
          </div>

          {subscribed ? (
            <div className="p-6 bg-gold-pure/5 border border-gold-pure/20 rounded-xs max-w-md mx-auto text-gold-pure text-sm tracking-wider">
              {t('blog.success_message')}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="max-w-md mx-auto relative group">
              <input 
                type="email" 
                required
                placeholder={t('blog.email_placeholder')}
                className="w-full bg-black border border-white/10 rounded-xs px-6 py-5 text-xs text-white placeholder:text-zinc-700 outline-none focus:border-gold-pure transition-all pr-40 tracking-widest"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 bg-gold-pure text-black px-6 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-gold-light transition-all cursor-pointer">
                {t('blog.subscribe_now')}
              </button>
            </form>
          )}

          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">
            {t('blog.privacy_agreement')}
          </p>
        </div>
      </section>
    </div>
  );
}

