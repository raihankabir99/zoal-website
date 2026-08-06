import React, { useState, useMemo } from 'react';
import { 
  X, Bell, CheckCheck, Trash2, Search, 
  Clock, Volume2, VolumeX, Check, ExternalLink,
  ShoppingBag, Tag, Award, MessageSquare, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EnterpriseNotification } from '../types/notification';

export interface CustomerNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EnterpriseNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentUser?: { name: string; email: string; role?: string } | null;
}

export default function CustomerNotificationCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  soundEnabled,
  setSoundEnabled,
  currentUser,
}: CustomerNotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { name: 'All', icon: Bell },
    { name: 'Orders', icon: ShoppingBag },
    { name: 'Offers', icon: Tag },
    { name: 'Rewards', icon: Award },
    { name: 'Messages', icon: MessageSquare },
    { name: 'Account', icon: User }
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Exclude archived if any
      if (n.archived) return false;

      // Filter by category
      if (selectedCategory !== 'All') {
        const cat = (selectedCategory || '').toLowerCase();
        const nCat = (n.category || '').toLowerCase();
        const nTitle = (n.title || '').toLowerCase();
        const nMsg = (n.message || '').toLowerCase();

        if (cat === 'orders') {
          const isOrder = nCat.includes('order') || nCat.includes('delivery') || nCat.includes('shipping') || 
                          nTitle.includes('order') || nTitle.includes('package') || nMsg.includes('order');
          if (!isOrder) return false;
        } else if (cat === 'offers') {
          const isOffer = nCat.includes('offer') || nCat.includes('marketing') || nCat.includes('discount') || 
                          nTitle.includes('offer') || nTitle.includes('sale') || nTitle.includes('deal') || nMsg.includes('offer');
          if (!isOffer) return false;
        } else if (cat === 'rewards') {
          const isReward = nCat.includes('reward') || nCat.includes('points') || nCat.includes('gift') || 
                           nTitle.includes('reward') || nTitle.includes('points') || nMsg.includes('points');
          if (!isReward) return false;
        } else if (cat === 'messages') {
          const isMsg = nCat.includes('ticket') || nCat.includes('support') || nCat.includes('message') || 
                        nTitle.includes('review') || nTitle.includes('message') || nMsg.includes('support');
          if (!isMsg) return false;
        } else if (cat === 'account') {
          const isAccount = nCat.includes('security') || nCat.includes('account') || nCat.includes('profile') || 
                            nTitle.includes('wishlist') || nTitle.includes('account') || nTitle.includes('welcome');
          if (!isAccount) return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q) || n.category.toLowerCase().includes(q);
      }

      return true;
    });
  }, [notifications, selectedCategory, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { today: EnterpriseNotification[]; yesterday: EnterpriseNotification[]; older: EnterpriseNotification[] } = {
      today: [],
      yesterday: [],
      older: []
    };

    filteredNotifications.forEach(n => {
      const dStr = new Date(n.timestamp).toDateString();
      if (dStr === today) {
        groups.today.push(n);
      } else if (dStr === yesterday) {
        groups.yesterday.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  if (!isOpen || !currentUser) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg h-full bg-[#08080a] border-l border-[#D4AF37]/20 flex flex-col shadow-2xl overflow-hidden font-sans"
        >
          {/* Customer Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-b from-zinc-950 to-[#08080a] flex items-start justify-between">
            <div className="space-y-1 max-w-sm">
              <h2 className="text-xl font-display font-medium tracking-wide text-white">
                Notifications
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Stay updated with your orders, offers and account activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg transition-all cursor-pointer"
                title={soundEnabled ? 'Notification Sound: Mute' : 'Notification Sound: Unmute'}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Mute</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Unmute</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          {unreadCount > 0 && (
            <div className="px-6 py-2.5 bg-zinc-950/80 border-b border-white/5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                You have <span className="text-[#D4AF37] font-semibold">{unreadCount}</span> unread notification{unreadCount > 1 ? 's' : ''}
              </span>
              <button
                onClick={onMarkAllAsRead}
                className="text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            </div>
          )}

          {/* Search & Categories Bar */}
          <div className="p-4 px-6 border-b border-white/5 space-y-3 bg-[#0a0a0d]">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            {/* Customer Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(({ name, icon: CategoryIcon }) => (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === name 
                      ? 'bg-[#D4AF37] text-black font-semibold shadow-sm' 
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  <CategoryIcon className="w-3.5 h-3.5" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Cards Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-zinc-900/80 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white tracking-wide">No new notifications</h3>
                  <p className="text-xs text-zinc-400">Everything is up to date.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Today Group */}
                {groupedNotifications.today.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider border-b border-[#D4AF37]/20 pb-1.5 flex items-center justify-between">
                      <span>Today</span>
                      <span className="text-[11px] text-zinc-500 font-normal">{groupedNotifications.today.length}</span>
                    </div>
                    {groupedNotifications.today.map((n, idx) => (
                      <CustomerNotificationCard
                        key={`${n.id}-today-${idx}`}
                        notification={n}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}

                {/* Yesterday Group */}
                {groupedNotifications.yesterday.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/10 pb-1.5 flex items-center justify-between">
                      <span>Yesterday</span>
                      <span className="text-[11px] text-zinc-500 font-normal">{groupedNotifications.yesterday.length}</span>
                    </div>
                    {groupedNotifications.yesterday.map((n, idx) => (
                      <CustomerNotificationCard
                        key={`${n.id}-yesterday-${idx}`}
                        notification={n}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}

                {/* Earlier Group */}
                {groupedNotifications.older.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>Earlier</span>
                      <span className="text-[11px] text-zinc-500 font-normal">{groupedNotifications.older.length}</span>
                    </div>
                    {groupedNotifications.older.map((n, idx) => (
                      <CustomerNotificationCard
                        key={`${n.id}-older-${idx}`}
                        notification={n}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Customer Footer */}
          <div className="p-4 bg-black/90 border-t border-white/10 text-center space-y-0.5">
            <p className="text-xs font-semibold text-zinc-300">You're all caught up.</p>
            <p className="text-[11px] text-zinc-500">Thanks for shopping with AL ZOAL.</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface CustomerNotificationCardProps {
  notification: EnterpriseNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function CustomerNotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: CustomerNotificationCardProps) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  // Customer-friendly emoji and title formatting
  const getCustomerVisual = (title: string, category: string) => {
    const t = title.toLowerCase();
    const c = category.toLowerCase();

    if (t.includes('confirm') || (c.includes('order') && t.includes('placed'))) {
      return { emoji: '🎉', actionLabel: 'View Order' };
    }
    if (t.includes('shipped') || t.includes('way') || t.includes('out for delivery') || c.includes('delivery')) {
      return { emoji: '📦', actionLabel: 'View Order' };
    }
    if (t.includes('payment') || t.includes('paid') || t.includes('received')) {
      return { emoji: '✅', actionLabel: 'View Details' };
    }
    if (t.includes('reward') || t.includes('point') || c.includes('reward')) {
      return { emoji: '💎', actionLabel: 'View Rewards' };
    }
    if (t.includes('offer') || t.includes('discount') || t.includes('sale') || c.includes('offer')) {
      return { emoji: '🏷️', actionLabel: 'View Offer' };
    }
    if (t.includes('wishlist') || t.includes('back in stock')) {
      return { emoji: '❤️', actionLabel: 'View Item' };
    }
    if (t.includes('birthday') || t.includes('gift')) {
      return { emoji: '🎁', actionLabel: 'Claim Reward' };
    }
    if (t.includes('review') || t.includes('published')) {
      return { emoji: '⭐', actionLabel: 'View Review' };
    }
    if (c.includes('ticket') || c.includes('support') || t.includes('support') || t.includes('message')) {
      return { emoji: '💬', actionLabel: 'View Message' };
    }
    return { emoji: '🛍️', actionLabel: 'View Details' };
  };

  const visual = getCustomerVisual(notification.title, notification.category);

  return (
    <div className={`p-4 rounded-xl border transition-all duration-300 ${
      !notification.read 
        ? 'bg-zinc-900/95 border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(212,175,55,0.06)]' 
        : 'bg-zinc-950/70 border-white/10 opacity-80 hover:opacity-100'
    }`}>
      <div className="space-y-2.5">
        {/* Card Header: Emoji Badge + Time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-sm shadow-sm">
              {visual.emoji}
            </span>
            <span className="text-xs font-semibold text-white tracking-wide">
              {notification.title}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              {timeAgo(notification.timestamp)}
            </span>
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shrink-0" />
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-zinc-300 leading-relaxed pl-9">
          {notification.message}
        </p>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/10 pl-9">
          <div className="flex items-center gap-2">
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-[#D4AF37] bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}

            <button
              onClick={() => onDelete(notification.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-md transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          {/* Primary Action link if applicable */}
          <span className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline cursor-pointer font-medium">
            <span>{visual.actionLabel}</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}
