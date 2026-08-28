import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, MessageSquare, Clock, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogComment } from '../../types/blog';

interface BlogCommentsProps {
  postId: string;
  currentUser?: any;
}

export function BlogComments({ postId, currentUser }: BlogCommentsProps) {
  const { t, i18n } = useTranslation();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<BlogComment | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await blogService.getComments(postId);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    setReplyingTo(null);
    setContent('');
    setStatusMessage(null);
  }, [postId]);

  // Filter only approved comments for readers
  const approvedComments = comments.filter(c => c.status === 'approved');

  // Group comments into roots and replies
  const rootComments = approvedComments.filter(c => !c.parent_id);
  const getRepliesFor = (parentId: string) => {
    return approvedComments.filter(c => c.parent_id === parentId);
  };

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent('zoal-open-auth'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!content.trim()) return;

    try {
      setSubmitLoading(true);
      setStatusMessage(null);

      // Pre-fill user identity from authenticated state
      const author_name = currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Anonymous Client';
      const author_email = currentUser.email || 'anonymous@zoalgroup.com';

      const payload: Partial<BlogComment> = {
        post_id: postId,
        parent_id: replyingTo?.id || undefined,
        author_name,
        author_email,
        content: content.trim(),
        status: 'pending' // Enforces the moderation queue standard
      };

      await blogService.createComment(payload);

      // Show success feedback
      setContent('');
      setReplyingTo(null);
      setStatusMessage({
        type: 'success',
        text: t('blog.comments.pending_approval')
      });

      // Optionally refresh to see if there is any other update, though newly added is pending so won't show yet.
      fetchComments();
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to submit comment. Please try again.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'Z';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6 sm:space-y-12 border-t border-white/5 pt-8 sm:pt-16 mt-8 sm:mt-16 max-w-4xl mx-auto px-2.5 sm:px-0">
      {/* Header */}
      <div className="space-y-1 sm:space-y-2 border-b border-white/5 pb-4 sm:pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-widest text-white">
            {t('blog.comments.title')}
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold-pure bg-gold-pure/10 border border-gold-pure/20 px-2.5 py-1 rounded-xs">
            {approvedComments.length === 1 
              ? t('blog.comments.comments_count') 
              : t('blog.comments.comments_count_plural', { count: approvedComments.length })
            }
          </span>
        </div>
        <p className="text-zinc-500 text-xs tracking-widest uppercase font-mono">
          {t('blog.comments.subtitle')}
        </p>
      </div>

      {/* Submission Form Sector */}
      <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute -left-16 -top-16 w-32 h-32 bg-gold-pure/5 rounded-full blur-2xl pointer-events-none" />
        
        {currentUser ? (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
            {/* Replying indicator */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-zinc-900/50 border border-gold-pure/10 px-4 py-2.5 rounded-xs text-xs text-gold-pure font-mono">
                <span>
                  {t('blog.comments.replying_to', { name: replyingTo.author_name })}
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-zinc-500 hover:text-white uppercase text-[10px] tracking-widest font-bold cursor-pointer"
                >
                  {t('blog.comments.cancel')}
                </button>
              </div>
            )}

            {/* Input field */}
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                placeholder={t('blog.comments.placeholder')}
                className="w-full bg-black border border-white/10 rounded-xs p-3 sm:p-4 text-xs sm:text-sm text-white placeholder:text-zinc-700 outline-none focus:border-gold-pure transition-all resize-none leading-relaxed tracking-wide"
              />
            </div>

            {/* Form footer */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                <User className="w-3.5 h-3.5 text-gold-pure/50" />
                <span>
                  {t('blog.by')}: <span className="text-zinc-300 font-bold">{currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email}</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={submitLoading || !content.trim()}
                className="inline-flex items-center justify-center gap-2 bg-gold-pure text-black px-6 py-3 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-gold-light disabled:opacity-35 disabled:hover:bg-gold-pure transition-all cursor-pointer select-none"
              >
                {submitLoading ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    {t('blog.comments.submit')}
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 sm:py-6 max-w-md mx-auto space-y-3 sm:space-y-5 relative z-10">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-gold-pure/40 mx-auto" />
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed px-2">
              {t('blog.comments.must_sign_in')}
            </p>
            <button
              onClick={handleOpenAuth}
              className="inline-flex items-center gap-2 border border-gold-pure/30 text-gold-pure px-6 py-2.5 rounded-xs text-[10px] font-bold uppercase tracking-widest hover:bg-gold-pure/10 transition-all cursor-pointer"
            >
              {t('blog.comments.sign_in_action')}
            </button>
          </div>
        )}
      </div>

      {/* Success / Error Status Alerts */}
      {statusMessage && (
        <div 
          className={`flex items-start gap-3 p-4 border rounded-xs max-w-2xl mx-auto transition-all animate-fadeIn ${
            statusMessage.type === 'success' 
              ? 'bg-gold-pure/5 border-gold-pure/20 text-gold-pure' 
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className="text-xs font-light leading-relaxed tracking-wide">
            {statusMessage.text}
          </span>
        </div>
      )}

      {/* Comments List Sector */}
      <div className="space-y-6 sm:space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-4">
            <div className="w-6 h-6 border-2 border-gold-pure border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {t('blog.curating_editorials')}
            </span>
          </div>
        ) : rootComments.length === 0 ? (
          <div className="text-center py-6 sm:py-12 border border-dashed border-white/5 rounded-xs px-4">
            <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-800 mx-auto mb-3 sm:mb-4" />
            <p className="text-zinc-500 text-xs tracking-widest uppercase font-mono leading-relaxed whitespace-pre-line">
              {t('blog.comments.no_comments')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {rootComments.map((comment) => {
              const replies = getRepliesFor(comment.id);
              const replyCount = replies.length;

              return (
                <div key={comment.id} className="group space-y-6 border-b border-white/5 pb-8 last:border-0 last:pb-0">
                  {/* Parent comment */}
                  <div className="flex items-start gap-4">
                    {/* Monogram Monolith Avatar */}
                    <div className="w-10 h-10 rounded-full border border-gold-pure/20 bg-zinc-950 flex items-center justify-center shrink-0 shadow-lg">
                      <span className="text-[10px] font-mono font-bold text-gold-pure tracking-wider">
                        {getInitials(comment.author_name)}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-display">
                          {comment.author_name}
                        </span>
                        <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>

                      <p className="text-zinc-300 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap max-w-3xl">
                        {comment.content}
                      </p>

                      {/* Reply action trigger */}
                      <div className="flex items-center gap-4 pt-1">
                        {currentUser && (
                          <button
                            onClick={() => {
                              setReplyingTo(comment);
                              const entryBox = document.querySelector('textarea');
                              if (entryBox) {
                                entryBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                entryBox.focus();
                              }
                            }}
                            className="text-[9px] font-bold font-mono uppercase tracking-widest text-gold-pure/75 hover:text-gold-pure transition-colors cursor-pointer"
                          >
                            {t('blog.comments.reply')}
                          </button>
                        )}
                        {replyCount > 0 && (
                          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                            {replyCount === 1 
                              ? t('blog.comments.reply_count') 
                              : t('blog.comments.reply_count_plural', { count: replyCount })
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies nesting */}
                  {replyCount > 0 && (
                    <div className="ml-8 sm:ml-14 border-l border-gold-pure/10 pl-4 sm:pl-6 space-y-6 mt-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-mono text-zinc-500">
                              {getInitials(reply.author_name)}
                            </span>
                          </div>

                          <div className="space-y-2 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                              <span className="text-xs font-bold text-zinc-200 tracking-wide uppercase">
                                {reply.author_name}
                              </span>
                              <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(reply.created_at)}</span>
                              </div>
                            </div>

                            <p className="text-zinc-400 text-xs font-light leading-relaxed whitespace-pre-wrap max-w-2xl">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
