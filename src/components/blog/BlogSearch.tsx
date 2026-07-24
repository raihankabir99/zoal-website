import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, X, Calendar, User, 
  Tag, Clock, ChevronDown, List, Grid,
  TrendingUp, Award, Clock3
} from 'lucide-react';
import { BlogPost, BlogCategory, BlogTag, BlogAuthor } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';

interface BlogSearchProps {
  onPostClick: (post: BlogPost) => void;
}

export function BlogSearch({ onPostClick }: BlogSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'oldest'>('newest');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [c, t, a] = await Promise.all([
          blogService.getCategories(),
          blogService.getTags(),
          blogService.getAuthors()
        ]);
        setCategories(c);
        setTags(t);
        setAuthors(a);
      } catch (err) {
        console.error('Failed to load search filters:', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const posts = await blogService.getPosts({
          search: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          tag: selectedTag !== 'all' ? selectedTag : undefined,
          status: 'published'
        });

        // Client side filtering for author since service might not support it yet
        let filtered = posts;
        if (selectedAuthor !== 'all') {
          filtered = posts.filter(p => p.author_id === selectedAuthor);
        }

        // Sorting
        if (sortBy === 'newest') {
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else if (sortBy === 'popular') {
          filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        } else if (sortBy === 'oldest') {
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        setResults(filtered);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedTag, selectedAuthor, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Search Header */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-500" />
          <input 
            type="text" 
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search the Al Zoal archives..."
            className="w-full bg-zinc-950 border-b border-white/10 px-16 py-8 text-2xl sm:text-4xl text-white font-display uppercase tracking-wider outline-none focus:border-gold-pure transition-colors placeholder:text-zinc-800"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">{results.length} Discoveries Found</span>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${showFilters ? 'text-gold-pure' : 'text-zinc-400 hover:text-white'}`}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Advanced Refinement'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">Sort By:</span>
            <div className="flex gap-2">
              {[
                { id: 'newest', label: 'Newest', icon: Clock3 },
                { id: 'popular', label: 'Popular', icon: TrendingUp },
                { id: 'oldest', label: 'Oldest', icon: Calendar }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-3 py-1.5 rounded-xs text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center gap-2 ${
                    sortBy === s.id ? 'bg-gold-pure border-gold-pure text-black' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-white/5">
              {/* Category Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gold-pure font-mono uppercase tracking-widest">By Category</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedCategory === 'all' ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                  >
                    All Collections
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedCategory === cat.id ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gold-pure font-mono uppercase tracking-widest">By Editorial Tag</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedTag('all')}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedTag === 'all' ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                  >
                    All Tags
                  </button>
                  {tags.map(tag => (
                    <button 
                      key={tag.id}
                      onClick={() => setSelectedTag(tag.id)}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedTag === tag.id ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] text-gold-pure font-mono uppercase tracking-widest">By Author</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedAuthor('all')}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedAuthor === 'all' ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                  >
                    All Authors
                  </button>
                  {authors.map(author => (
                    <button 
                      key={author.id}
                      onClick={() => setSelectedAuthor(author.id)}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border rounded-xs transition-all ${selectedAuthor === author.id ? 'bg-white text-black border-white' : 'text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                      {author.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-8 h-8 border-2 border-gold-pure/20 border-t-gold-pure rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-mono animate-pulse">Scanning Archives...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {results.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 group cursor-pointer"
              onClick={() => onPostClick(post)}
            >
              <div className="aspect-[16/10] rounded-sm overflow-hidden border border-white/5 relative">
                <SafeImage src={post.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4">
                  <span className="bg-black/60 backdrop-blur-md px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-gold-pure border border-gold-pure/20">
                    {post.zoal_blog_categories?.name}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 bg-gold-pure rounded-full" />
                  <span>{post.reading_time || 5} MIN</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display uppercase tracking-widest group-hover:text-gold-pure transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-40 space-y-6">
          <div className="w-20 h-20 bg-zinc-950 border border-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
            <Search className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white font-display uppercase tracking-[0.2em]">No Dispatch Found</h3>
            <p className="text-zinc-600 text-sm max-w-md mx-auto">Our archives do not contain any editorials matching your current criteria. Try refining your search or filters.</p>
          </div>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedTag('all'); setSelectedAuthor('all'); }}
            className="text-xs font-bold uppercase tracking-widest text-gold-pure border-b border-gold-pure/30 pb-0.5 hover:border-gold-pure transition-all"
          >
            Reset All Discoveries
          </button>
        </div>
      )}
    </div>
  );
}
