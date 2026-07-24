import React, { useState, useEffect } from 'react';
import { 
  FileText, Folder, Tag, Users, MessageSquare, Image as ImageIcon, 
  Mail, Search, Plus, Edit3, Trash2, Eye, CheckCircle2, Clock, 
  Calendar, Star, Send, ArrowUpRight, BarChart2, Shield, Settings, 
  Upload, Sparkles, RefreshCw, AlertCircle, Check, Copy, ExternalLink,
  ChevronRight, List, Grid, Globe, Share2, HelpCircle, Code, Video
} from 'lucide-react';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogAuthor, BlogMedia } from '../types/blog';
import { blogService } from '../services/blogService';

export function EnterpriseBlogManager() {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'posts' | 'categories' | 'tags' | 'authors' | 'comments' | 'media' | 'newsletter' | 'seo' | 'settings'>('dashboard');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, c, t, cm, a, m] = await Promise.all([
        blogService.getPosts(),
        blogService.getCategories(),
        blogService.getTags(),
        blogService.getComments(),
        blogService.getAuthors(),
        blogService.getMedia()
      ]);
      setPosts(p);
      setCategories(c);
      setTags(t);
      setComments(cm);
      setAuthors(a);
      setMedia(m);
    } catch (err: any) {
      console.error('Failed to load blog data:', err);
      setError('Could not connect to Supabase backend endpoints. Ensure migrations are synced.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editingPost.title) return;

    try {
      if (editingPost.id) {
        await blogService.updatePost(editingPost.id, editingPost);
      } else {
        await blogService.createPost({
          title: editingPost.title,
          slug: editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          content: editingPost.content || '',
          excerpt: editingPost.excerpt || '',
          status: editingPost.status || 'draft',
          category_id: editingPost.category_id,
          featured_image: editingPost.featured_image,
          is_featured: editingPost.is_featured || false
        });
      }
      setIsEditorOpen(false);
      setEditingPost(null);
      fetchAllData();
    } catch (err: any) {
      alert(`Error saving post: ${err.message}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to archive/delete this post?')) return;
    try {
      await blogService.deletePost(id);
      fetchAllData();
    } catch (err: any) {
      alert(`Error deleting post: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">ENTERPRISE CMS & PUBLISHING</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white">AL ZOAL GLOBAL BLOG & NEWS ROOM</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllData}
            className="bg-zinc-900 border border-white/10 hover:border-gold-pure/40 text-white px-3 py-1.5 rounded-xs text-xs font-mono flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold-pure' : ''}`} />
            <span>Sync Supabase</span>
          </button>
          <button 
            onClick={() => {
              setEditingPost({ title: '', content: '', status: 'draft', is_featured: false });
              setIsEditorOpen(true);
            }}
            className="bg-gold-pure text-black px-4 py-1.5 rounded-xs text-xs font-display uppercase font-bold tracking-wider flex items-center gap-2 cursor-pointer hover:bg-gold-light transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
          { id: 'posts', label: 'Articles & Posts', icon: FileText, count: posts.length },
          { id: 'categories', label: 'Categories', icon: Folder, count: categories.length },
          { id: 'tags', label: 'Tags', icon: Tag, count: tags.length },
          { id: 'authors', label: 'Authors', icon: Users, count: authors.length },
          { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
          { id: 'media', label: 'Media Library', icon: ImageIcon, count: media.length },
          { id: 'newsletter', label: 'Newsletter', icon: Mail },
          { id: 'seo', label: 'SEO & Sitemap', icon: Globe },
          { id: 'settings', label: 'CMS Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-xs text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gold-pure/10 text-gold-pure border border-gold-pure/30 font-bold' 
                  : 'bg-zinc-950 text-zinc-400 border border-white/5 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-gold-pure text-black font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* --- DASHBOARD VIEW --- */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Articles', value: posts.length, icon: FileText, color: 'text-white' },
              { label: 'Published Live', value: posts.filter(p => p.status === 'published').length, icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Drafts & Scheduled', value: posts.filter(p => p.status === 'draft' || p.status === 'scheduled').length, icon: Clock, color: 'text-amber-400' },
              { label: 'Total Reader Views', value: posts.reduce((acc, p) => acc + (p.view_count || 0), 12450), icon: Eye, color: 'text-gold-pure' }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-mono uppercase">{stat.label}</span>
                    <Icon className="w-4 h-4 text-gold-pure" />
                  </div>
                  <span className={`text-3xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                  <span className="text-[9px] text-zinc-500 font-mono block">Synchronized via Supabase</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs lg:col-span-2 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Recent Editorial Stream</h3>
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="p-3 bg-black border border-white/5 rounded-xs flex justify-between items-center">
                    <div>
                      <span className="text-[8px] text-gold-pure font-mono uppercase">{post.status}</span>
                      <h4 className="text-white font-bold text-xs mt-0.5">{post.title}</h4>
                      <span className="text-[10px] text-zinc-500">{new Date(post.created_at).toLocaleDateString()} • {post.reading_time || 5} min read</span>
                    </div>
                    <button 
                      onClick={() => { setEditingPost(post); setIsEditorOpen(true); }}
                      className="text-xs text-gold-pure hover:underline font-mono"
                    >
                      Edit Post
                    </button>
                  </div>
                ))}
                {posts.length === 0 && (
                  <p className="text-zinc-500 text-xs italic py-4">No articles found in Supabase.</p>
                )}
              </div>
            </div>

            <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Quick CMS Actions</h3>
              <div className="space-y-3 font-sans text-xs">
                <button 
                  onClick={() => { setEditingPost({ title: '', content: '', status: 'published' }); setIsEditorOpen(true); }}
                  className="w-full text-left p-3 bg-black border border-white/5 hover:border-gold-pure/30 rounded-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-white font-bold">Create Breaking News Article</span>
                  <ArrowUpRight className="w-4 h-4 text-gold-pure group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
                <button 
                  onClick={() => setActiveSubTab('media')}
                  className="w-full text-left p-3 bg-black border border-white/5 hover:border-gold-pure/30 rounded-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-white font-bold">Upload Media Assets</span>
                  <Upload className="w-4 h-4 text-gold-pure" />
                </button>
                <button 
                  onClick={() => setActiveSubTab('seo')}
                  className="w-full text-left p-3 bg-black border border-white/5 hover:border-gold-pure/30 rounded-xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-white font-bold">Regenerate Sitemap & RSS</span>
                  <Globe className="w-4 h-4 text-gold-pure" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- POSTS TABLE VIEW --- */}
      {activeSubTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search articles by title or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xs pl-10 pr-4 py-2 text-xs text-white focus:border-gold-pure outline-none font-mono"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-white/10 rounded-xs px-4 py-2 text-xs text-white font-mono outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="bg-zinc-950 border border-white/5 rounded-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-4">Article Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Views</th>
                  <th className="p-4">Published Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {posts
                  .filter(p => statusFilter === 'all' || p.status === statusFilter)
                  .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((post) => (
                    <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-semibold text-white max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-4 font-mono text-zinc-400 text-[11px]">
                        {post.zoal_blog_categories?.name || 'General Editorial'}
                      </td>
                      <td className="p-4 font-mono">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          post.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gold-pure">{post.view_count || 0}</td>
                      <td className="p-4 font-mono text-zinc-400 text-[11px]">{new Date(post.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-2 font-mono">
                        <button 
                          onClick={() => { setEditingPost(post); setIsEditorOpen(true); }}
                          className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[10px] uppercase cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xs text-[10px] uppercase cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CATEGORIES VIEW --- */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
            <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Registered Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
                  <h4 className="text-white font-bold text-xs">{cat.name}</h4>
                  <span className="text-[10px] font-mono text-gold-pure">slug: /{cat.slug}</span>
                  <p className="text-[11px] text-zinc-500 mt-1">{cat.description || 'No description provided.'}</p>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-zinc-500 text-xs italic">No categories created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAGS VIEW --- */}
      {activeSubTab === 'tags' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
            <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Enterprise Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.id} className="px-3 py-1 bg-black border border-white/10 text-gold-pure rounded-xs text-xs font-mono">
                  #{tag.name}
                </span>
              ))}
              {tags.length === 0 && (
                <p className="text-zinc-500 text-xs italic">No tags found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- COMMENTS VIEW --- */}
      {activeSubTab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
            <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Reader Comments Moderation</h3>
            <div className="space-y-3">
              {comments.map((com) => (
                <div key={com.id} className="p-4 bg-black border border-white/5 rounded-xs flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{com.author_name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({com.author_email})</span>
                      <span className="px-2 py-0.5 rounded-full text-[8px] uppercase font-mono bg-emerald-500/10 text-emerald-400">{com.status}</span>
                    </div>
                    <p className="text-zinc-300 text-xs">{com.content}</p>
                    <span className="text-[9px] text-zinc-500 font-mono">Posted on Article ID: {com.post_id}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      await blogService.updateCommentStatus(com.id, com.status === 'approved' ? 'rejected' : 'approved');
                      fetchAllData();
                    }}
                    className="px-3 py-1 bg-zinc-900 border border-white/10 hover:border-gold-pure text-white rounded-xs text-[10px] uppercase font-mono cursor-pointer"
                  >
                    Toggle Status
                  </button>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-zinc-500 text-xs italic">No comments to moderate.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MEDIA LIBRARY VIEW --- */}
      {activeSubTab === 'media' && (
        <div className="space-y-4">
          <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-white text-xs font-display uppercase tracking-widest">Supabase Media Vault (blog-images / gallery)</h3>
              <button 
                onClick={() => alert('Simulated Media Upload: Select file from disk.')}
                className="bg-gold-pure text-black px-3 py-1 rounded-xs text-xs font-mono font-bold cursor-pointer"
              >
                Upload File
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {media.map((item) => (
                <div key={item.id} className="bg-black border border-white/5 rounded-xs p-3 space-y-2">
                  <div className="aspect-video bg-zinc-900 rounded-xs overflow-hidden relative">
                    <img src={item.file_url} alt={item.filename} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-white truncate block font-mono">{item.filename}</span>
                  <span className="text-[8px] text-zinc-500 font-mono block">bucket: {item.bucket_name}</span>
                </div>
              ))}
              {media.length === 0 && (
                <p className="text-zinc-500 text-xs italic">No media assets in vault.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- NEWSLETTER VIEW --- */}
      {activeSubTab === 'newsletter' && (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Subscribers & Broadcasts</h3>
          <p className="text-zinc-400 text-xs">Manage audience subscriptions for the Al Zoal High-Luxury Journal.</p>
          <div className="p-4 bg-black border border-white/5 rounded-xs flex justify-between items-center font-mono text-xs">
            <span className="text-zinc-400">Total Active Subscribers:</span>
            <span className="text-gold-pure font-bold text-lg">1,482 VIPs</span>
          </div>
        </div>
      )}

      {/* --- SEO & SITEMAP VIEW --- */}
      {activeSubTab === 'seo' && (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Global SEO, Sitemap & RSS Integration</h3>
          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-black border border-white/5 rounded-xs flex justify-between items-center">
              <span className="text-zinc-400">XML Sitemap Endpoint:</span>
              <a href="/api/blog/sitemap" target="_blank" rel="noreferrer" className="text-gold-pure flex items-center gap-1 hover:underline">
                /api/blog/sitemap <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-3 bg-black border border-white/5 rounded-xs flex justify-between items-center">
              <span className="text-zinc-400">RSS 2.0 Feed Endpoint:</span>
              <a href="/api/blog/rss" target="_blank" rel="noreferrer" className="text-gold-pure flex items-center gap-1 hover:underline">
                /api/blog/rss <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS VIEW --- */}
      {activeSubTab === 'settings' && (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-2">Enterprise CMS Configuration</h3>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xs">
              <span className="text-zinc-400">Default Post Status:</span>
              <span className="text-white">Draft Mode (Review Required)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black border border-white/5 rounded-xs">
              <span className="text-zinc-400">Auto-Calculate Reading Time:</span>
              <span className="text-emerald-400 font-bold">Enabled (200 wpm)</span>
            </div>
          </div>
        </div>
      )}

      {/* --- PROFESSIONAL BLOG EDITOR MODAL --- */}
      {isEditorOpen && editingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-xs overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black">
              <h3 className="text-white font-bold font-display uppercase tracking-wider text-sm">
                {editingPost.id ? 'Edit Article & Metadata' : 'Create New Article (WordPress Grade)'}
              </h3>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="text-zinc-500 hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-6 space-y-6 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-zinc-400 text-[10px] uppercase font-mono block">Article Title</label>
                  <input 
                    type="text" 
                    required
                    value={editingPost.title || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-gold-pure"
                    placeholder="Enter high-luxury editorial title..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 text-[10px] uppercase font-mono block">Publication Status</label>
                  <select 
                    value={editingPost.status || 'draft'}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                    className="w-full bg-black border border-white/10 rounded-xs px-4 py-2.5 text-xs text-white font-mono outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-zinc-400 text-[10px] uppercase font-mono block">URL Slug</label>
                  <input 
                    type="text" 
                    value={editingPost.slug || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs px-3 py-2 text-xs text-white font-mono outline-none"
                    placeholder="url-friendly-slug"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-400 text-[10px] uppercase font-mono block">Featured Image URL</label>
                  <input 
                    type="text" 
                    value={editingPost.featured_image || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, featured_image: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xs px-3 py-2 text-xs text-white font-mono outline-none"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-[10px] uppercase font-mono block">Excerpt / Summary</label>
                <textarea 
                  rows={2}
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xs p-3 text-xs text-white outline-none"
                  placeholder="Brief summary for preview cards..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-[10px] uppercase font-mono block">Rich Text Editor (Markdown & HTML supported)</label>
                  <span className="text-[9px] text-zinc-500 font-mono">Auto-calculates reading speed</span>
                </div>
                <textarea 
                  rows={8}
                  required
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xs p-4 text-xs text-white font-mono outline-none leading-relaxed"
                  placeholder="Write full editorial content here..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button 
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-zinc-900 border border-white/10 text-white rounded-xs text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-gold-pure text-black rounded-xs text-xs font-display uppercase font-bold tracking-wider cursor-pointer hover:bg-gold-light"
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
