import React, { useState, useMemo } from 'react';
import { 
  X, Bell, CheckCheck, Trash2, Archive, Search, 
  Clock, Volume2, VolumeX, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CustomerNotificationCenter from './CustomerNotificationCenter';
import AdminNotificationDetailsPanel from './AdminNotificationDetailsPanel';
import { EnterpriseNotification, NotificationAuditReport } from '../types/notification';

interface EnterpriseNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EnterpriseNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  auditReport: NotificationAuditReport;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  isOnline: boolean;
  connectionStatus: string;
  currentUser?: { name: string; email: string; role?: string } | null;
  onNavigate?: (targetModule: string, params?: any) => void;
}

export default function EnterpriseNotificationCenter({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onDelete,
  onClearAll,
  auditReport,
  soundEnabled,
  setSoundEnabled,
  currentUser,
  onNavigate,
}: EnterpriseNotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'notifications' | 'audit'>('notifications');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<EnterpriseNotification | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const userRole = ((currentUser as any)?.role || 'customer').toLowerCase();
  const isEnterpriseRole = ['admin', 'staff', 'manager', 'owner'].includes(userRole);

  const categories = [
    'All',
    'Orders',
    'Payments',
    'Inventory',
    'Customers',
    'Security',
    'Marketing',
    'System'
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (showArchived ? !n.archived : n.archived) return false;
      if (selectedCategory !== 'All') {
        const cat = (selectedCategory || '').toLowerCase();
        const nCat = (n.category || '').toLowerCase();
        if (cat === 'orders' && !(nCat.includes('order') || nCat.includes('delivery') || nCat.includes('refund'))) return false;
        if (cat === 'payments' && !(nCat.includes('payment') || nCat.includes('tax') || nCat.includes('refund'))) return false;
        if (cat === 'inventory' && !(nCat.includes('inventory') || nCat.includes('warehouse'))) return false;
        if (cat === 'customers' && !(nCat.includes('customer') || nCat.includes('ticket') || nCat.includes('support') || nCat.includes('client'))) return false;
        if (cat === 'security' && !(nCat.includes('security') || nCat.includes('login') || nCat.includes('staff') || nCat.includes('role'))) return false;
        if (cat === 'marketing' && !(nCat.includes('marketing') || nCat.includes('ai') || nCat.includes('forecast') || nCat.includes('generation') || nCat.includes('storyboard'))) return false;
        if (cat === 'system' && !(nCat.includes('system') || nCat.includes('published') || nCat.includes('decision'))) return false;
        if (!['orders','payments','inventory','customers','security','marketing','system'].includes(cat) && !nCat.includes(cat)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (n.title || '').toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, selectedCategory, searchQuery, showArchived]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const now = new Date();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Calculate start of current week (e.g., Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const groups: { 
      today: EnterpriseNotification[]; 
      yesterday: EnterpriseNotification[]; 
      thisWeek: EnterpriseNotification[]; 
      older: EnterpriseNotification[] 
    } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    filteredNotifications.forEach(n => {
      const nDate = new Date(n.timestamp);
      const dStr = nDate.toDateString();
      
      if (dStr === today) {
        groups.today.push(n);
      } else if (dStr === yesterday) {
        groups.yesterday.push(n);
      } else if (nDate >= startOfWeek) {
        groups.thisWeek.push(n);
      } else {
        groups.older.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  if (!isOpen || !currentUser) return null;

  if (!isEnterpriseRole) {
    return (
      <CustomerNotificationCenter
        isOpen={isOpen}
        onClose={onClose}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={onMarkAsRead}
        onMarkAllAsRead={onMarkAllAsRead}
        onDelete={onDelete}
        onClearAll={onClearAll}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        currentUser={currentUser}
      />
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl h-full bg-[#08080a] border-l border-[#D4AF37]/20 flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="py-3 px-6 border-b border-white/10 bg-zinc-950 flex items-center justify-between">
            <h2 className="text-base font-display font-medium tracking-wide text-white">
              Notifications
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 rounded-lg transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-header Tabs & Quick Actions */}
          <div className="px-6 py-3 bg-zinc-950/90 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === 'notifications' 
                    ? 'bg-[#D4AF37] text-black shadow-sm' 
                    : 'text-zinc-400 hover:text-white bg-zinc-900/60'
                }`}
              >
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </button>
              {isEnterpriseRole && (
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'audit' 
                      ? 'bg-[#D4AF37] text-black shadow-sm' 
                      : 'text-zinc-400 hover:text-white bg-zinc-900/60'
                  }`}
                >
                  Activity Log
                </button>
              )}
            </div>

            {activeTab === 'notifications' && (
              <button
                onClick={onMarkAllAsRead}
                className="text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>

          {/* Content Area */}
          {activeTab === 'notifications' ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Search & Filter Bar */}
              <div className="p-3 px-6 border-b border-white/5 space-y-2.5 bg-[#0a0a0d]">
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

                {/* Categories Scrollable Row */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-[#D4AF37] text-black font-semibold shadow-sm' 
                          : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className="hover:text-[#D4AF37] transition-colors cursor-pointer underline underline-offset-4"
                  >
                    {showArchived ? 'Showing Archived' : 'Show Active Feed'}
                  </button>
                  <button
                    onClick={onClearAll}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear All Feed
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 p-4 px-6 space-y-4 pb-4">
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
                        <div className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.1em] border-b border-[#D4AF37]/20 pb-1.5 flex items-center justify-between">
                          <span>Today</span>
                          <span className="text-[10px] text-zinc-500 font-normal">{groupedNotifications.today.length}</span>
                        </div>
                        {groupedNotifications.today.map((n, idx) => (
                          <NotificationCard
                            key={`${n.id}-today-${idx}`}
                            notification={n}
                            onMarkAsRead={onMarkAsRead}
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onSelect={(selected) => {
                              setSelectedNotification(selected);
                              setIsDetailsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Yesterday Group */}
                    {groupedNotifications.yesterday.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.1em] border-b border-white/10 pb-1.5 flex items-center justify-between">
                          <span>Yesterday</span>
                          <span className="text-[10px] text-zinc-500 font-normal">{groupedNotifications.yesterday.length}</span>
                        </div>
                        {groupedNotifications.yesterday.map((n, idx) => (
                          <NotificationCard
                            key={`${n.id}-yesterday-${idx}`}
                            notification={n}
                            onMarkAsRead={onMarkAsRead}
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onSelect={(selected) => {
                              setSelectedNotification(selected);
                              setIsDetailsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Earlier This Week Group */}
                    {groupedNotifications.thisWeek.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.1em] border-b border-white/5 pb-1.5 flex items-center justify-between">
                          <span>Earlier This Week</span>
                          <span className="text-[10px] text-zinc-600 font-normal">{groupedNotifications.thisWeek.length}</span>
                        </div>
                        {groupedNotifications.thisWeek.map((n, idx) => (
                          <NotificationCard
                            key={`${n.id}-thisweek-${idx}`}
                            notification={n}
                            onMarkAsRead={onMarkAsRead}
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onSelect={(selected) => {
                              setSelectedNotification(selected);
                              setIsDetailsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Older Group */}
                    {groupedNotifications.older.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.1em] border-b border-white/5 pb-1.5 flex items-center justify-between">
                          <span>Older</span>
                          <span className="text-[10px] text-zinc-700 font-normal">{groupedNotifications.older.length}</span>
                        </div>
                        {groupedNotifications.older.map((n, idx) => (
                          <NotificationCard
                            key={`${n.id}-older-${idx}`}
                            notification={n}
                            onMarkAsRead={onMarkAsRead}
                            onArchive={onArchive}
                            onDelete={onDelete}
                            onSelect={(selected) => {
                              setSelectedNotification(selected);
                              setIsDetailsOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Activity Log Tab */
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="p-5 bg-zinc-900/80 border border-[#D4AF37]/30 rounded-xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Activity Log Health</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">OPERATIONAL</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/10">
                  <div className="bg-[#D4AF37] h-full rounded-full w-full" />
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  System activities and enterprise event notifications are fully operational and synchronized.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500">Coverage</span>
                  <p className="text-lg font-bold text-white">100%</p>
                  <span className="text-[11px] text-emerald-400">All Channels Active</span>
                </div>

                <div className="p-4 bg-zinc-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500">Response Speed</span>
                  <p className="text-lg font-bold text-white">OPTIMAL</p>
                  <span className="text-[11px] text-emerald-400">Live Sync</span>
                </div>

                <div className="p-4 bg-zinc-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500">Total Alerts</span>
                  <p className="text-lg font-bold text-white">
                    {auditReport.totalCount}
                  </p>
                  <span className="text-[11px] text-zinc-400">Unread: {auditReport.unreadCount}</span>
                </div>

                <div className="p-4 bg-zinc-950 border border-white/10 rounded-xl space-y-1">
                  <span className="text-xs text-zinc-500">System Status</span>
                  <p className="text-lg font-bold text-emerald-400">OPERATIONAL</p>
                  <span className="text-[11px] text-zinc-400">Fully Functional</span>
                </div>
              </div>

              <div className="p-5 bg-zinc-950 border border-white/10 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Monitored System Activities</h3>
                <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400">
                  {[
                    'New Orders & Status Updates',
                    'Inventory & Stock Thresholds',
                    'Payment Transactions & Refunds',
                    'Customer Inquiries & Support',
                    'AI Product Generation & Publishing',
                    'Security & Access Events',
                    'Staff Activity & System Config'
                  ].map((src, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-900/60 border border-white/5 rounded-lg">
                      <span className="text-zinc-300">{src}</span>
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


        </motion.div>
      </div>

      <AdminNotificationDetailsPanel
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        onNavigate={(targetModule, params) => {
          onClose();
          if (onNavigate) {
            onNavigate(targetModule, params);
          }
        }}
      />
    </AnimatePresence>
  );
}

interface NotificationCardProps {
  notification: EnterpriseNotification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (notification: EnterpriseNotification) => void;
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSelect,
}: NotificationCardProps) {
  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getCategoryDetails = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('order') || cat === 'orders') {
      return { emoji: '🛒', label: 'Order' };
    }
    if (cat.includes('payment') || cat === 'payments') {
      return { emoji: '💳', label: 'Payment' };
    }
    if (cat.includes('inventory') || cat.includes('warehouse')) {
      return { emoji: '📦', label: 'Stock' };
    }
    if (cat.includes('product')) {
      return { emoji: '🛍️', label: 'Product' };
    }
    if (cat.includes('customer') || cat.includes('ticket') || cat.includes('support')) {
      return { emoji: '💬', label: 'Support' };
    }
    if (cat.includes('refund')) {
      return { emoji: '🔄', label: 'Refund' };
    }
    if (cat.includes('delivery')) {
      return { emoji: '🚚', label: 'Delivery' };
    }
    if (cat.includes('security')) {
      return { emoji: '🛡️', label: 'Security' };
    }
    if (cat.includes('staff')) {
      return { emoji: '👤', label: 'Staff' };
    }
    return { emoji: '🔔', label: category };
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-semibold uppercase tracking-wider">
            Important
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-semibold uppercase tracking-wider">
            Attention
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-semibold uppercase tracking-wider">
            Info
          </span>
        );
    }
  };

  const catDetails = getCategoryDetails(notification.category);
  const isOrderRelated = notification.category.toLowerCase().includes('order') || notification.title.toLowerCase().includes('order');

  return (
    <div 
      onClick={() => onSelect(notification)}
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 group hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] hover:translate-y-[-1px] cursor-pointer ${
        !notification.read 
          ? 'bg-zinc-900/40 border-[#D4AF37]/30 border-l-2 border-l-[#D4AF37] hover:bg-zinc-900/60' 
          : 'bg-zinc-950/20 border-white/5 opacity-80 hover:opacity-100 hover:bg-zinc-900/30'
      }`}
    >
      <div className="p-3 sm:p-3.5 space-y-2">
        {/* Top Header Section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/80 border border-white/5">
              <span className="text-xs">{catDetails.emoji}</span>
              <span className="text-[10px] font-medium text-zinc-300 uppercase tracking-wider">{catDetails.label}</span>
            </div>
            {getPriorityLabel(notification.priority)}
            {!notification.read && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-1">
          <h4 className="text-[13px] font-semibold text-white leading-tight tracking-wide">
            {notification.title}
          </h4>
          <p className="text-[12px] text-zinc-400 leading-snug">
            {notification.message}
          </p>
        </div>

        {/* Footer Actions & Meta */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            {isOrderRelated && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(notification);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#D4AF37] hover:text-white bg-[#D4AF37]/5 hover:bg-[#D4AF37] border border-[#D4AF37]/20 rounded transition-all"
              >
                <span>View Order</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
            {!notification.read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all"
              >
                Mark Read
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(notification.id);
              }}
              className="px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all"
            >
              Archive
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="px-2 py-1 text-[10px] font-semibold text-zinc-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded transition-all"
            >
              Delete
            </button>
          </div>

          <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">
            {timeAgo(notification.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
