import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useMotionValueEvent } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  LinkedinShareButton, 
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon
} from 'react-share';
import { 
  User, ArrowLeft, Bookmark, Copy, ChevronLeft, ChevronRight, 
  ThumbsUp, Check, Clock, BookOpen
} from 'lucide-react';
import { BlogPost } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { SafeImage } from '../../imageRegistry';
import { BlogComments } from './BlogComments';

interface BlogArticleProps {
  post: BlogPost;
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
  onAuthorClick?: (id: string) => void;
  currentUser?: any;
}

export function BlogArticle({ post, onBack, onPostClick, onAuthorClick, currentUser }: BlogArticleProps) {
  const { t, i18n } = useTranslation();
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setScrollProgress(latest);
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const progressPercent = Math.min(100, Math.round(scrollProgress * 100));
  const readingTime = post.reading_time || 5;
  const minRemaining = Math.max(0, Math.ceil((1 - scrollProgress) * readingTime));

  const localized = (obj: any, field: string) => {
    const arField = `${field}_ar`;
    if (i18n.language === 'ar' && obj && obj[arField]) return obj[arField];
    return obj?.[field] || '';
  };

  const activeContent = localized(post, 'content');
  const isLongArticle = activeContent && activeContent.length > 2000;

  const getCategoryName = (cat?: any) => {
    if (!cat) return t('blog.categories.general');
    return localized(cat, 'name');
  };

  const getAuthorName = (auth?: any) => {
    if (!auth) return t('blog.editor');
    return localized(auth, 'name');
  };

  const getAuthorBio = (auth?: any) => {
    const bio = localized(auth, 'bio');
    if (bio) return bio;
    if (auth?.name || auth?.name_ar) {
      return t('blog.archive.author_desc', { name: getAuthorName(auth) });
    }
    return t('blog.editor_desc');
  };

  const formatReadingTime = (mins: number) => {
    return t('blog.min_read', { count: mins });
  };

  const formatRemainingTime = (mins: number) => {
    return t('blog.min_left', { mins });
  };

  const tagsList = (() => {
    const tags: any[] = [];
    if ((post as any).zoal_blog_post_tags && Array.isArray((post as any).zoal_blog_post_tags)) {
      (post as any).zoal_blog_post_tags.forEach((item: any) => {
        if (item?.tags) tags.push(item.tags);
      });
    }
    if ((post as any).tags && Array.isArray((post as any).tags)) {
      (post as any).tags.forEach((item: any) => {
        tags.push(item);
      });
    }
    return tags;
  })();

  const getTagName = (tag: any) => {
    if (typeof tag === 'string') return tag;
    return localized(tag, 'name');
  };

  // Reset expanded state when post changes
  useEffect(() => {
    setIsExpanded(false);
  }, [post]);

  useEffect(() => {
    if (post && post.id) {
      blogService.trackView(post.id).catch(err => {
        console.warn('Failed to track view for post:', post.id, err);
      });
    }
  }, [post.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allPosts] = await Promise.all([
          blogService.getPosts()
        ]);
        
        const scoredPosts = allPosts
          .filter(p => p.id !== post.id && p.status === 'published')
          .map(p => {
            let score = 0;

            // 1. Same Category
            const sameCategory = (post.category_id && post.category_id === p.category_id) || 
                                 (post.zoal_blog_categories?.name && p.zoal_blog_categories?.name && post.zoal_blog_categories.name === p.zoal_blog_categories.name);
            if (sameCategory) {
              score += 20;
            }

            // 2. Same Tags
            const getTagsOfPost = (bp: BlogPost): string[] => {
              const tags: string[] = [];
              if ((bp as any).zoal_blog_post_tags && Array.isArray((bp as any).zoal_blog_post_tags)) {
                (bp as any).zoal_blog_post_tags.forEach((item: any) => {
                  if (item?.tags?.name) tags.push(item.tags.name.toLowerCase());
                });
              }
              if ((bp as any).tags && Array.isArray((bp as any).tags)) {
                (bp as any).tags.forEach((item: any) => {
                  if (typeof item === 'string') tags.push(item.toLowerCase());
                  else if (item?.name) tags.push(item.name.toLowerCase());
                });
              }
              return tags;
            };
            const currentTags = getTagsOfPost(post);
            const otherTags = getTagsOfPost(p);
            let matchingTagsCount = 0;
            currentTags.forEach(t => {
              if (otherTags.includes(t)) {
                matchingTagsCount++;
              }
            });
            score += matchingTagsCount * 15;

            // 3. Similar Keywords
            const stopWords = new Set([
              'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 
              'is', 'of', 'our', 'this', 'it', 'how', 'why', 'are', 'from', 'by', 'about', 
              'as', 'into', 'that', 'these', 'those', 'then', 'than', 'them', 'their', 
              'there', 'they', 'we', 'you', 'your', 'us', 'me', 'my', 'he', 'she', 'its', 
              'not', 'no', 'yes', 'can', 'will', 'would', 'should', 'could', 'has', 'have', 
              'had', 'been', 'was', 'were', 'be'
            ]);
            const getKeywords = (text: string): string[] => {
              if (!text) return [];
              return text
                .toLowerCase()
                .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopWords.has(w));
            };
            const currentKeywords = getKeywords(post.title + ' ' + (post.excerpt || ''));
            const otherKeywords = getKeywords(p.title + ' ' + (p.excerpt || ''));
            let matchingKeywordsCount = 0;
            const otherKeywordSet = new Set(otherKeywords);
            currentKeywords.forEach(k => {
              if (otherKeywordSet.has(k)) {
                matchingKeywordsCount++;
              }
            });
            score += matchingKeywordsCount * 5;

            // 4. Same Author
            const sameAuthor = (post.author_id && post.author_id === p.author_id) ||
                               (post.zoal_blog_authors?.name && p.zoal_blog_authors?.name && post.zoal_blog_authors.name === p.zoal_blog_authors.name);
            if (sameAuthor) {
              score += 10;
            }

            // 5. Most Popular
            const popularityScore = (p.view_count || 0) * 0.01 + (p.like_count || 0) * 0.05;
            score += popularityScore;

            return { post: p, score };
          });

        const sorted = scoredPosts.sort((a, b) => b.score - a.score);
        setRelatedPosts(sorted.slice(0, 3).map(item => item.post));
      } catch (err) {
        console.error('Failed to load article details:', err);
      }
    };
    loadData();

    // Generate TOC from content
    const contentToParse = localized(post, 'content');
    const extractedHeadings = contentToParse.split('\n')
      .filter((line: string) => line.startsWith('#'))
      .map((line: string) => {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return { id, text, level };
      });
    setHeadings(extractedHeadings);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post, i18n.language]);

  const handleNavigationBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/blog';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    alert(t('blog.copy_link_success'));
  };

  // Dynamic typography styling controls
  const typography = post?.content_json?.typography || {
    font_size: 'default',
    line_height: 'comfortable',
    color_contrast: 'high-contrast'
  };

  const getFontSizeClasses = () => {
    switch (typography.font_size) {
      case 'compact':
        return 'prose-p:text-[11px] sm:prose-p:text-sm prose-li:text-[11px] sm:prose-li:text-sm prose-blockquote:text-[11px] sm:prose-blockquote:text-sm';
      case 'executive':
        return 'prose-p:text-[13px] sm:prose-p:text-xl prose-li:text-[13px] sm:prose-li:text-xl prose-blockquote:text-[13px] sm:prose-blockquote:text-xl';
      case 'spacious':
        return 'prose-p:text-[14px] sm:prose-p:text-2xl prose-li:text-[14px] sm:prose-li:text-2xl prose-blockquote:text-[14px] sm:prose-blockquote:text-2xl';
      case 'default':
      default:
        return 'prose-p:text-[12px] sm:prose-p:text-lg prose-li:text-[12px] sm:prose-li:text-lg prose-blockquote:text-[12px] sm:prose-blockquote:text-lg';
    }
  };

  const getLineHeightClasses = () => {
    switch (typography.line_height) {
      case 'regular':
        return 'prose-p:leading-[18px] sm:prose-p:leading-normal prose-li:leading-[18px] sm:prose-li:leading-normal prose-blockquote:leading-[18px] sm:prose-blockquote:leading-normal';
      case 'elegant':
        return 'prose-p:leading-[24px] sm:prose-p:leading-loose prose-li:leading-[24px] sm:prose-li:leading-loose prose-blockquote:leading-[24px] sm:prose-blockquote:leading-loose';
      case 'comfortable':
      default:
        return 'prose-p:leading-[21px] sm:prose-p:leading-relaxed prose-li:leading-[21px] sm:prose-li:leading-relaxed prose-blockquote:leading-[21px] sm:prose-blockquote:leading-relaxed';
    }
  };

  const getColorContrastClasses = () => {
    switch (typography.color_contrast) {
      case 'warm-sepia':
        return 'p-6 sm:p-10 rounded-sm bg-[#FAF6EE] border border-amber-900/10 text-[#433E39] prose-p:text-[#433E39] prose-li:text-[#433E39] prose-blockquote:text-[#433E39] prose-h1:text-amber-950 prose-h2:text-amber-950';
      case 'deep-anthracite':
        return 'p-6 sm:p-10 rounded-sm bg-[#1C1C1E] border border-white/5 text-[#E5E5EA] prose-p:text-[#E5E5EA] prose-li:text-[#E5E5EA] prose-blockquote:text-[#E5E5EA] prose-h1:text-white prose-h2:text-white';
      case 'high-contrast':
      default:
        return 'prose-p:text-zinc-300 prose-li:text-zinc-300 prose-blockquote:text-zinc-300';
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      {/* Reading Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gold-pure origin-left z-50"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <header className="relative h-[45vh] sm:h-[70vh] w-full overflow-hidden">
        {/* Back Arrow Navigation Overlay */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
          <button 
            onClick={handleNavigationBack}
            aria-label={t('blog.back_to_journal')}
            title={t('blog.back_to_journal')}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-gold-pure hover:text-white hover:bg-black/80 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-gold-pure"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute inset-0 z-0">
          <SafeImage 
            src={post.featured_image || 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?auto=format&fit=crop&q=80'} 
            alt={post.title}
            className="w-full h-full object-cover"
            priority={true}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        </div>

        <div className="absolute inset-0 z-10 hidden sm:flex flex-col justify-end p-3 sm:p-12 lg:p-20 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl space-y-3 sm:space-y-6"
          >
            <div className="flex flex-row items-center gap-2 sm:gap-3">
              <span className="bg-gold-pure text-black px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] rounded-xs shrink-0">
                {getCategoryName(post.zoal_blog_categories)}
              </span>
              <span className="text-zinc-400 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest truncate">
                {new Date(post.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-1.5 sm:space-y-3">
              <h1 className="text-2xl sm:text-5xl lg:text-7xl font-bold text-white font-display uppercase tracking-tight leading-[1.1]">
                {localized(post, 'title')}
              </h1>
              {(post.subtitle || post.subtitle_ar) && (
                <p className="text-zinc-300 text-xs sm:text-lg lg:text-xl font-light leading-relaxed tracking-wide italic">
                  {localized(post, 'subtitle')}
                </p>
              )}
            </div>

            <div className="flex flex-row items-center justify-between sm:justify-start gap-4 sm:gap-8 pt-3 sm:pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold-pure/20 border border-gold-pure/30 flex items-center justify-center overflow-hidden shrink-0">
                  {post.zoal_blog_authors?.avatar_url ? (
                    <img src={post.zoal_blog_authors.avatar_url} alt={getAuthorName(post.zoal_blog_authors)} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-gold-pure" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.author')}</span>
                  <span className="text-[10px] sm:text-xs text-white font-bold uppercase tracking-widest">{getAuthorName(post.zoal_blog_authors)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.reading_time')}</span>
                  <span className="text-[10px] sm:text-xs text-white font-bold uppercase tracking-widest">⏱ {formatReadingTime(post.reading_time || 5)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.views')}</span>
                  <span className="text-[10px] sm:text-xs text-white font-bold uppercase tracking-widest">{post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Mobile Title & Metadata Block */}
      <div className="sm:hidden px-2.5 py-6 bg-zinc-950 border-b border-white/5 space-y-4">
        <div className="flex flex-row items-center gap-2">
          <span className="bg-gold-pure text-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.2em] rounded-xs shrink-0">
            {getCategoryName(post.zoal_blog_categories)}
          </span>
          <span className="text-zinc-400 text-[8px] font-mono uppercase tracking-widest truncate">
            {new Date(post.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-white font-display uppercase tracking-tight leading-[1.2]">
            {localized(post, 'title')}
          </h1>
          {(post.subtitle || post.subtitle_ar) && (
            <p className="text-zinc-300 text-xs font-light leading-relaxed tracking-wide italic">
              {localized(post, 'subtitle')}
            </p>
          )}
        </div>

        <div className="flex flex-row items-center justify-between gap-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-pure/20 border border-gold-pure/30 flex items-center justify-center overflow-hidden shrink-0">
              {post.zoal_blog_authors?.avatar_url ? (
                <img src={post.zoal_blog_authors.avatar_url} alt={getAuthorName(post.zoal_blog_authors)} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-gold-pure" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.author')}</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">{getAuthorName(post.zoal_blog_authors)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.reading_time')}</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">⏱ {formatReadingTime(post.reading_time || 5)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none mb-0.5">{t('blog.views')}</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">{post.view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-4 sm:mt-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Left Sidebar - Sticky TOC & Engagement */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-32 space-y-12">
              {headings.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">{t('blog.toc')}</h3>
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
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">{t('blog.engagement')}</h3>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className={`flex items-center justify-between p-3 rounded-xs border transition-all group cursor-pointer ${
                      isLiked ? 'bg-gold-pure border-gold-pure text-black' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-gold-pure/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('blog.appreciate')}</span>
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-black' : 'group-hover:text-gold-pure'}`} />
                  </button>
                  <button 
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`flex items-center justify-between p-3 rounded-xs border transition-all group cursor-pointer ${
                      isBookmarked ? 'bg-white border-white text-black' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/30'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('blog.bookmark')}</span>
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-black' : 'group-hover:text-white'}`} />
                  </button>
                </div>
              </div>

              {/* Reader Status widget in Left Sidebar */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">{t('blog.reader_status')}</h3>
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-3 font-mono">
                  <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
                    <span>{t('blog.read_progress')}</span>
                    <span className="text-gold-pure font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                    <div className="bg-gold-pure h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest pt-1">
                    <span>{t('blog.reading_time')}</span>
                    <span className="text-white">
                      {scrollProgress >= 0.96 ? `0 ${t('blog.min_abbr')}` : formatRemainingTime(minRemaining)}
                    </span>
                  </div>
                  {scrollProgress >= 0.96 && (
                    <div className="pt-2">
                      <span className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gold-pure/10 border border-gold-pure/20 text-gold-pure font-bold text-[9px] uppercase tracking-wider rounded-xs">
                        <Check className="w-3 h-3" /> {t('blog.completed')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-gold-pure border-b border-white/5 pb-2">{t('blog.share')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <FacebookShareButton url={currentUrl} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <FacebookIcon size={20} round />
                    </div>
                  </FacebookShareButton>
                  <TwitterShareButton url={currentUrl} title={localized(post, 'title')} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <TwitterIcon size={20} round />
                    </div>
                  </TwitterShareButton>
                  <LinkedinShareButton url={currentUrl} className="hover:opacity-80 transition-opacity">
                    <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center">
                      <LinkedinIcon size={20} round />
                    </div>
                  </LinkedinShareButton>
                  <button onClick={handleCopyLink} className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex justify-center hover:border-gold-pure/30 transition-all cursor-pointer">
                    <Copy className="w-5 h-5 text-gold-pure" />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 space-y-6 sm:space-y-16">
            <div className="relative space-y-6 sm:space-y-8">
              {/* Excerpt Block */}
              {localized(post, 'excerpt') && (
                <div className="border-l-2 border-gold-pure pl-4 sm:pl-6 italic text-zinc-300 text-sm sm:text-xl font-light leading-relaxed max-w-3xl mx-4 sm:mx-0">
                  {localized(post, 'excerpt')}
                </div>
              )}

              <div 
                className={`transition-all duration-700 ease-in-out relative ${
                  isLongArticle && !isExpanded ? 'max-h-[600px] overflow-hidden' : 'max-h-none'
                }`}
              >
                <div 
                  ref={contentRef}
                  className={`prose prose-invert prose-gold max-w-none px-2.5 sm:px-0
                             prose-h1:font-display prose-h1:uppercase prose-h1:tracking-wider prose-h1:text-2xl sm:prose-h1:text-4xl
                             prose-h2:font-display prose-h2:uppercase prose-h2:tracking-wider prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4
                             prose-p:font-light prose-li:font-light prose-blockquote:font-light
                             prose-a:text-gold-pure prose-a:underline hover:prose-a:text-white
                             prose-strong:text-gold-pure prose-strong:font-bold
                             prose-img:rounded-sm prose-img:border prose-img:border-white/5
                             ${getFontSizeClasses()} ${getLineHeightClasses()} ${getColorContrastClasses()}`}
                >
                  <ReactMarkdown 
                    components={{
                      h1: ({ node, ...props }) => <h1 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')} {...props} />,
                      h2: ({ node, ...props }) => <h2 id={props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')} {...props} />,
                    }}
                  >
                    {activeContent}
                  </ReactMarkdown>
                </div>

                {isLongArticle && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none" />
                )}
              </div>

              {isLongArticle && !isExpanded && (
                <div className="absolute -bottom-6 left-0 right-0 flex justify-center z-20">
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="px-8 py-3.5 bg-gold-pure hover:bg-gold-light text-black font-mono text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs shadow-xl hover:shadow-gold-pure/20 transition-all duration-300 cursor-pointer flex items-center gap-2 border border-gold-pure animate-bounce"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {t('blog.continue_reading')}
                  </button>
                </div>
              )}
            </div>

            {/* Tags Section */}
            {tagsList.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-6 border-t border-white/5 px-2.5 sm:px-0">
                {tagsList.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-zinc-900 border border-white/5 hover:border-gold-pure/30 transition-colors text-zinc-400 hover:text-white rounded-xs text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="text-gold-pure">#</span>
                    {getTagName(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Reading Completed Badge (Luxury Card) */}
            {scrollProgress >= 0.96 && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gold-pure/20 bg-gold-pure/[0.02] p-6 rounded-xs text-center space-y-3 my-6 mx-2.5 sm:mx-0"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold-pure/10 text-gold-pure mb-1 border border-gold-pure/20">
                  <Check className="w-4 h-4" />
                </div>
                <h4 className="text-white text-xs sm:text-sm font-display uppercase tracking-[0.25em] font-bold">{t('blog.completed')}</h4>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
                  {t('blog.thank_you_completed')}
                </p>
              </motion.div>
            )}

            {/* Meet the Author Card */}
            <div className="bg-zinc-950 border border-white/5 p-4 sm:p-6 lg:p-8 rounded-sm flex flex-row gap-3.5 sm:gap-8 items-start text-start mx-2.5 sm:mx-0">
              <div className="w-16 h-16 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden border-2 border-gold-pure/20 shrink-0">
                <SafeImage src={post.zoal_blog_authors?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80'} alt={getAuthorName(post.zoal_blog_authors)} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2 sm:space-y-3.5 min-w-0 flex-1">
                <div className="space-y-0.5 sm:space-y-1">
                  <span className="text-[8px] sm:text-[10px] tracking-[0.3em] text-gold-pure uppercase font-mono block leading-none">{t('blog.meet_author')}</span>
                  <h3 className="text-[18px] sm:text-2xl font-bold text-white font-display uppercase tracking-wider sm:tracking-widest leading-tight whitespace-nowrap sm:whitespace-normal truncate sm:overflow-visible">{getAuthorName(post.zoal_blog_authors)}</h3>
                  {localized(post.zoal_blog_authors, 'expertise') && (
                    <span className="text-[8px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-widest block leading-tight mt-0.5 sm:mt-1">{localized(post.zoal_blog_authors, 'expertise')}</span>
                  )}
                </div>
                <p className="text-zinc-400 text-[11px] sm:text-sm font-light leading-relaxed max-w-xl text-left self-start">
                  {getAuthorBio(post.zoal_blog_authors)}
                </p>
                <div className="flex flex-row items-center justify-start gap-3 sm:gap-4 pt-1 whitespace-nowrap">
                  <button className="text-white hover:text-gold-pure transition-colors cursor-pointer"><TwitterIcon size={14} round /></button>
                  <button className="text-white hover:text-gold-pure transition-colors cursor-pointer"><LinkedinIcon size={14} round /></button>
                  <button 
                    onClick={() => {
                      if (onAuthorClick) {
                        const resolvedAuthorId = post.author_id || 
                          (post.zoal_blog_authors?.name?.includes('Charles') ? 'a2' : 
                           post.zoal_blog_authors?.name?.includes('Amal') ? 'a3' : 'a1');
                        onAuthorClick(resolvedAuthorId);
                      }
                    }}
                    className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gold-pure border-b border-gold-pure/30 pb-0.5 hover:border-gold-pure transition-all cursor-pointer whitespace-nowrap"
                  >
                    {t('blog.explore_profile')}
                  </button>
                </div>
              </div>
            </div>

            {/* Next/Prev Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mx-2.5 sm:mx-0">
              <button onClick={handleNavigationBack} className="group text-left p-3.5 sm:p-8 bg-zinc-950 border border-white/5 rounded-sm hover:border-gold-pure/30 transition-all flex items-center gap-4 sm:gap-6 cursor-pointer rtl:text-right">
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-600 group-hover:text-gold-pure transition-colors rtl:rotate-180" />
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-mono tracking-widest">{t('blog.prev_editorial')}</span>
                  <span className="text-[10px] sm:text-xs text-white font-bold uppercase block truncate">{t('blog.prev_article_stub')}</span>
                </div>
              </button>
              <button onClick={handleNavigationBack} className="group text-right p-3.5 sm:p-8 bg-zinc-950 border border-white/5 rounded-sm hover:border-gold-pure/30 transition-all flex items-center justify-end gap-4 sm:gap-6 cursor-pointer rtl:text-left">
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-mono tracking-widest">{t('blog.next_editorial')}</span>
                  <span className="text-[10px] sm:text-xs text-white font-bold uppercase block truncate">{t('blog.next_article_stub')}</span>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-600 group-hover:text-gold-pure transition-colors rtl:rotate-180" />
              </button>
            </div>

            {/* Conversation Sector */}
            <BlogComments postId={post.id} currentUser={currentUser} />

            {/* Recommended Reading */}
            <div className="space-y-6 sm:space-y-8 px-0 sm:px-0">
              <div className="flex items-center gap-4 px-2.5 sm:px-0">
                <h3 className="text-lg sm:text-xl font-bold font-display uppercase tracking-widest text-white">{t('blog.recommended')}</h3>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {relatedPosts.map((r) => (
                  <div 
                    key={r.id} 
                    className="space-y-4 group cursor-pointer"
                    onClick={() => onPostClick(r)}
                  >
                    <div className="aspect-video rounded-xs overflow-hidden border border-white/5">
                      <SafeImage src={r.featured_image} alt={localized(r, 'title')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2 px-2.5 sm:px-0">
                      <span className="text-[9px] text-gold-pure font-mono uppercase">{getCategoryName(r.zoal_blog_categories)}</span>
                      <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider group-hover:text-gold-pure transition-colors line-clamp-2">
                        {localized(r, 'title')}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

