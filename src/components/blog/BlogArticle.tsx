import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon
} from 'react-share';
import { 
  Calendar, User, Clock, ArrowLeft, Heart, 
  Bookmark, Share2, Copy, Printer, List, 
  MessageSquare, ChevronLeft, ChevronRight, 
  Send, BookmarkCheck, ThumbsUp, MapPin
} from 'lucide-react';
import { BlogPost, BlogComment } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';

interface BlogArticleProps {
  post: BlogPost;
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
}

export function BlogArticle({ post, onBack, onPostClick }: BlogArticleProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allPosts] = await Promise.all([
          blogService.getPosts({ category: post.category_id })
        ]);
        setRelatedPosts(allPosts.filter(p => p.id !== post.id).slice(0, 3));
      } catch (err) {
        console.error('Failed to load article details:', err);
      }
    };
    loadData();

    // Generate TOC from content
    const extractedHeadings = post.content.split('\n')
      .filter(line => line.startsWith('#'))
      .map(line => {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return { id, text, level };
      });
    setHeadings(extractedHeadings);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    alert('Link copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      {/* Reading Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gold-pure origin-left z-50"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <header className="relative h-[70vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SafeImage 
            src={post.featured_image || 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&q=80'} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-12 lg:p-20 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl space-y-6"
          >
            <button 
              onClick={onBack}
              className="group flex items-center gap-2 text-zinc-400 hover:text-gold-pure text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              Return to Journal
            </button>

            <div className="flex items-center gap-3">
              <span className="bg-gold-pure text-black px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] rounded-xs">
                {post.zoal_blog_categories?.name || 'EDITORIAL'}
              </span>
              <span className="text-zinc-400 text-[9px] font-mono uppercase tracking-widest">
                {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white font-display uppercase tracking-tight leading-[1.1]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-pure/20 border border-gold-pure/30 flex items-center justify-center overflow-hidden">
                  {post.zoal_blog_authors?.avatar_url ? (
                    <img src={post.zoal_blog_authors.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gold-pure" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-1">Author</span>
                  <span className="text-xs text-white font-bold uppercase tracking-widest">{post.zoal_blog_authors?.name || 'AL ZOAL EDITOR'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-1">Time</span>
                  <span className="text-xs text-white font-bold uppercase tracking-widest">{post.reading_time || 5} MIN</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-1">Views</span>
                  <span className="text-xs text-white font-bold uppercase tracking-widest">{post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar - Sticky TOC & Share */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-12">
              {headings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">Table of Contents</h3>
                  <nav className="space-y-3">
                    {headings.map((h) => (
                      <a 
                        key={h.id} 
                        href={`#${h.id}`}
                        className={`block text-[11px] uppercase tracking-widest transition-colors hover:text-gold-pure ${
                          h.level === 1 ? 'text-zinc-200 font-bold' : 'text-zinc-500 pl-4'
                        }`}
                      >
                        {h.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">Engagement</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center justify-between p-3 rounded-xs border transition-all group ${
                      isLiked ? 'bg-gold-pure border-gold-pure text-black' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-gold-pure/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">Appreciate</span>
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-black' : 'group-hover:text-gold-pure'}`} />
                  </button>
                  <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex items-center justify-between p-3 rounded-xs border transition-all group ${
                      isBookmarked ? 'bg-white border-white text-black' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">Bookmark</span>
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-black' : 'group-hover:text-white'}`} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">Social Share</h3>
                <div className="grid grid-cols-2 gap-2">
                  <FacebookShareButton url={currentUrl} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <FacebookIcon size={20} round />
                    </div>
                  </FacebookShareButton>
                  <TwitterShareButton url={currentUrl} title={post.title} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <TwitterIcon size={20} round />
                    </div>
                  </TwitterShareButton>
                  <LinkedinShareButton url={currentUrl} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <LinkedinIcon size={20} round />
                    </div>
                  </LinkedinShareButton>
                  <button onClick={handleCopyLink} className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center hover:border-gold-pure/30 transition-all">
                    <Copy className="w-5 h-5 text-gold-pure" />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 space-y-16">
            <div 
              ref={contentRef}
              className="prose prose-invert prose-gold max-w-none 
                         prose-h1:font-display prose-h1:uppercase prose-h1:tracking-wider prose-h1:text-4xl
                         prose-h2:font-display prose-h2:uppercase prose-h2:tracking-wider prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4
                         prose-p:text-zinc-300 prose-p:text-lg prose-p:leading-relaxed prose-p:font-light
                         prose-strong:text-gold-pure prose-strong:font-bold
                         prose-img:rounded-sm prose-img:border prose-img:border-white/5"
            >
              <ReactMarkdown 
                components={{
                  h1: ({ node, ...props }) => <h1 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')} {...props} />,
                  h2: ({ node, ...props }) => <h2 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')} {...props} />,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Author Footer Card */}
            <div className="bg-zinc-950 border border-white/5 p-10 rounded-sm flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gold-pure/20 shrink-0">
                <SafeImage src={post.zoal_blog_authors?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] tracking-[0.3em] text-gold-pure uppercase font-mono">Meet the Author</span>
                  <h3 className="text-2xl font-bold text-white font-display uppercase tracking-widest">{post.zoal_blog_authors?.name || 'AL ZOAL EDITORIAL TEAM'}</h3>
                </div>
                <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-xl">
                  {post.zoal_blog_authors?.name ? 
                    `A veteran curator at AL ZOAL Global, specializing in ${post.zoal_blog_categories?.name || 'luxury lifestyle'} and international hospitality trends.` :
                    "The AL ZOAL Editorial Team represents our collective voice, delivering insights from the forefront of luxury business and heritage strategy."
                  }
                </p>
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <button className="text-white hover:text-gold-pure transition-colors"><TwitterIcon size={16} round /></button>
                  <button className="text-white hover:text-gold-pure transition-colors"><LinkedinIcon size={16} round /></button>
                  <button className="text-xs font-bold uppercase tracking-widest text-gold-pure border-b border-gold-pure/30 pb-0.5 hover:border-gold-pure transition-all">View Profile</button>
                </div>
              </div>
            </div>

            {/* Next/Prev Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="group text-left p-8 bg-zinc-950 border border-white/5 rounded-sm hover:border-gold-pure/30 transition-all flex items-center gap-6">
                <ChevronLeft className="w-6 h-6 text-zinc-600 group-hover:text-gold-pure transition-colors" />
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Previous Article</span>
                  <span className="text-xs text-white font-bold uppercase block truncate">The Art of Roasting in the High Desert</span>
                </div>
              </button>
              <button className="group text-right p-8 bg-zinc-950 border border-white/5 rounded-sm hover:border-gold-pure/30 transition-all flex items-center justify-end gap-6">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest">Next Article</span>
                  <span className="text-xs text-white font-bold uppercase block truncate">Curating Excellence: The 2026 Collection</span>
                </div>
                <ChevronRight className="w-6 h-6 text-zinc-600 group-hover:text-gold-pure transition-colors" />
              </button>
            </div>

            {/* Related Articles */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold font-display uppercase tracking-widest text-white">Recommended Reading</h3>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((r) => (
                  <div 
                    key={r.id} 
                    className="space-y-4 group cursor-pointer"
                    onClick={() => onPostClick(r)}
                  >
                    <div className="aspect-video rounded-xs overflow-hidden border border-white/5">
                      <SafeImage src={r.featured_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] text-gold-pure font-mono uppercase">{r.zoal_blog_categories?.name}</span>
                      <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-gold-pure transition-colors line-clamp-2">{r.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-12 pt-12 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold font-display uppercase tracking-widest text-white">Editorial Dialogue</h3>
                <span className="text-xs text-zinc-500 font-mono">{comments.length} Thoughts</span>
              </div>

              {/* Comment Form */}
              <div className="bg-zinc-950/50 border border-white/5 p-8 rounded-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono">Full Name</label>
                    <input 
                      type="text" 
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xs px-4 py-3 text-xs text-white outline-none focus:border-gold-pure"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-500 uppercase font-mono">Email (Private)</label>
                    <input 
                      type="email" 
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xs px-4 py-3 text-xs text-white outline-none focus:border-gold-pure"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-mono">Commentary</label>
                  <textarea 
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xs p-4 text-xs text-white outline-none focus:border-gold-pure"
                    placeholder="Contribute your insights to the conversation..."
                  />
                </div>
                <button className="bg-gold-pure text-black px-8 py-3 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-gold-light transition-all flex items-center gap-2 cursor-pointer ml-auto">
                  Post Contribution <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-8">
                {comments.length > 0 ? (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-6 pb-8 border-b border-white/5">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center">
                        <User className="w-6 h-6 text-zinc-600" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-bold text-sm tracking-wide">{c.author_name}</span>
                          <span className="text-[10px] text-zinc-600 font-mono uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed font-light">{c.content}</p>
                        <button className="text-[10px] text-gold-pure font-bold uppercase tracking-widest hover:underline">Reply</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-zinc-950/30 rounded-sm border border-dashed border-white/10">
                    <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-500 text-xs italic">No contributions yet. Be the first to share your thoughts.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
