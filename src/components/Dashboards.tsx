import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Shield, Landmark, Bookmark, BarChart3, Package, Truck, Compass,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check, Mail, PackageCheck, LogOut,
  Lock, Menu, ChevronRight, ArrowLeft, Search, Filter, Trash2, Edit3, Download, FileText, CheckCircle2, AlertCircle, Loader2,
  Database, Copy, Server
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { Product, Order, CartItem, Branch } from '../types';
import { BRANCHES } from '../data';
import { useGlobalProducts } from '../imageRegistry';
import { SimulatedLogisticsMap } from './SimulatedLogisticsMap';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';
import { getShippingConfig, saveShippingConfig, ShippingConfig } from '../data/shippingData';
import { getReturnsConfig, saveReturnsConfig, ReturnsConfig } from '../data/returnsData';
import TrackOrder from './TrackOrder';
import { AddressSection } from './AddressSection';
import { AccountSettingsSection } from './AccountSettingsSection';

interface DashboardsProps {
  currentUser: { name: string; email: string; phone: string; address: string; role?: string; addresses?: any[] } | null;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
  setCurrentPage: (page: string) => void;
  deliveryZones?: any[];
  onUpdateDeliveryZones?: (zones: any[]) => void;
  currentPage?: string;
  onUpdateCurrentUser?: (user: any) => void;
  onLogout?: () => void;
  initialSubTab?: string;
  setAuthModalOpen?: (open: boolean) => void;
}

export default function Dashboards({
  currentUser,
  orders,
  onUpdateOrderStatus,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
  setCurrentPage,
  deliveryZones = [],
  onUpdateDeliveryZones,
  currentPage = 'dashboard',
  onUpdateCurrentUser,
  onLogout,
  initialSubTab,
  setAuthModalOpen,
}: DashboardsProps) {
  const { t } = useTranslation();
  const allProducts = useGlobalProducts();
  // Assume currentUser has a 'role' property: 'customer' | 'admin'
  const userRole = currentUser ? (currentUser as any).role || 'customer' : null;

  // Select active role view
  const [activeDashboardTab, setActiveDashboardTab] = useState<'patron' | 'admin' | 'owner'>('patron');

  // Customer sub-tab states
  const [customerSubTab, setCustomerSubTab] = useState<string>(() => {
    if (currentPage === 'track') return 'track';
    return initialSubTab || 'overview';
  });

  React.useEffect(() => {
    if (currentPage === 'track') {
      setCustomerSubTab('track');
    } else if (initialSubTab) {
      setCustomerSubTab(initialSubTab);
    }
  }, [currentPage, initialSubTab]);

  // Dynamic Shipping Configurations
  const [shippingConfig, setLocalShippingConfig] = useState<ShippingConfig>(() => getShippingConfig());

  // Dynamic Return & Refund Configurations
  const [returnsConfig, setLocalReturnsConfig] = useState<ReturnsConfig>(() => getReturnsConfig());

  // Granular Order Tracking Modal State
  const [selectedDetailedOrder, setSelectedDetailedOrder] = useState<Order | null>(null);

  // Multi-branch selected analytics index
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'all' | 'dammam' | 'hofuf'>('all');

  // --- CUSTOMER DASHBOARD INTEGRATIONS ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'Pending' | 'Preparing' | 'Shipped' | 'Completed' | 'Cancelled'>('all');
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [notificationSearch, setNotificationSearch] = useState('');
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'order' | 'offer' | 'system'>('all');

  const customerOrders = useMemo(() => {
    if (!currentUser?.email) return [];
    return orders.filter((o) => o.email.toLowerCase() === currentUser.email.toLowerCase());
  }, [orders, currentUser]);
  
  // Custom states stored in localStorage per user
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    if (!currentUser?.email) return 'gold_monarch';
    return localStorage.getItem(`zoal_avatar_${currentUser.email}`) || 'gold_monarch';
  });

  // --- SUPABASE INTEGRATION STATES & HANDLERS ---
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);
  const [syncingData, setSyncingData] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState('');
  const [copiedSchema, setCopiedSchema] = useState(false);

  const fetchSupabaseStatus = async () => {
    setFetchingStatus(true);
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
      }
    } catch (err) {
      console.error('Error fetching Supabase status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleCopySchema = () => {
    if (supabaseStatus?.sqlSchema) {
      navigator.clipboard.writeText(supabaseStatus.sqlSchema);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    }
  };

  const handleSyncData = async () => {
    if (syncingData) return;
    setSyncingData(true);
    setSyncError('');
    setSyncResult(null);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        // Refresh status to show updated table counts
        fetchSupabaseStatus();
      } else {
        setSyncError(data.error || 'Synchronization failed.');
      }
    } catch (err: any) {
      setSyncError(err.message || 'Network error occurred during synchronization.');
    } finally {
      setSyncingData(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchSupabaseStatus();
    }
  }, [userRole]);

  const [languagePreference, setLanguagePreference] = useState<string>(() => {
    if (!currentUser?.email) return 'en';
    return localStorage.getItem(`zoal_lang_${currentUser.email}`) || 'en';
  });

  const [notificationPreferences, setNotificationPreferences] = useState(() => {
    if (!currentUser?.email) return { email: true, sms: false, whatsapp: true };
    const saved = localStorage.getItem(`zoal_notif_pref_${currentUser.email}`);
    return saved ? JSON.parse(saved) : { email: true, sms: false, whatsapp: true };
  });

  const [notifications, setNotifications] = useState(() => {
    if (!currentUser?.email) return [];
    const localSaved = localStorage.getItem(`zoal_notifications_${currentUser.email}`);
    if (localSaved) return JSON.parse(localSaved);
    
    return [
      {
        id: '1',
        title: 'Order Confirmed',
        message: 'Your signature Saffron Brew order #ZOAL-7892 has been confirmed by our master boutique roaster.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        type: 'order',
        read: false
      },
      {
        id: '2',
        title: 'VIP Reward Point Awarded',
        message: 'Congratulations! You have received +250 Gold loyalty reward points for your recent boutique visit.',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        type: 'offer',
        read: false
      },
      {
        id: '3',
        title: 'Exclusive Batch Launch',
        message: 'Bespoke Single-Origin Geisha selection has arrived at the Dammam flagship lounge. Reserve your signature cup.',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        type: 'offer',
        read: true
      },
      {
        id: '4',
        title: 'Sovereign Session Active',
        message: 'A secure authentication login key has been issued from Riyadh, KSA. Enjoy curated access.',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        type: 'system',
        read: true
      }
    ];
  });

  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_avatar_${currentUser.email}`, profilePhoto);
    }
  }, [profilePhoto, currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_lang_${currentUser.email}`, languagePreference);
    }
  }, [languagePreference, currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_notif_pref_${currentUser.email}`, JSON.stringify(notificationPreferences));
    }
  }, [notificationPreferences, currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_notifications_${currentUser.email}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser?.email]);

  // Seeding simulated employees
  const simulatedEmployees = [
    { name: 'Raed Al-Fahad', role: 'Chief Roasting Master', branch: 'Dammam', status: 'Active' },
    { name: 'Sarah Al-Ghamdi', role: 'Head Boutique Curator', branch: 'Dammam', status: 'Active' },
    { name: 'Jean-Luc Vagner', role: 'Artisanal Chocolatier', branch: 'Dammam', status: 'Active' },
    { name: 'Manal Al-Yousef', role: 'Lounge Supervisor', branch: 'Al Hofuf', status: 'Rest' }
  ];

  // Grouped products list to check low inventories
  const inventoryStatusList = useMemo(() => {
    return allProducts.map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      qty: p.inventory,
      state: p.inventory < 15 ? 'Critical (Restock immediately)' : 'Sufficient'
    }));
  }, [allProducts]);

  // Compute metrics for Owner Dashboard
  const groupMetrics = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);
    const orderCount = orders.length;
    const clientCount = Array.from(new Set(orders.map((o) => o.email))).length;
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;

    return {
      totalSales,
      orderCount,
      clientCount,
      averageOrderValue
    };
  }, [orders]);

  // Chart data for revenues: Monthly trends
  const revenueChartData = [
    { month: 'Jan', revenue: 120000, items: 340 },
    { month: 'Feb', revenue: 154000, items: 410 },
    { month: 'Mar', revenue: 189000, items: 490 },
    { month: 'Apr', revenue: 245000, items: 610 },
    { month: 'May', revenue: 310000, items: 780 },
    { month: 'Jun', revenue: groupMetrics.totalSales + 350000, items: 840 } // real order additions
  ];

  // Chart data: Business Category allocations
  const pillarAllocationData = [
    { name: 'COFFEE HOUSE', value: 34 },
    { name: 'BAKERY & SNACKS', value: 26 },
    { name: 'MARKET & GROCERY', value: 18 },
    { name: 'PREMIUM COLLECTIONS', value: 14 },
    { name: "THOBES & MEN'S WEAR", value: 8 }
  ];

  const PIE_COLORS = ['#AA7C11', '#D4AF37', '#F3E5AB', '#92400e', '#78350f'];

  // Map products of wishlist
  const userWishlistProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(p.id));
  }, [allProducts, wishlist]);

  if (!userRole) {
    return (
      <div className="bg-black text-white min-h-screen pt-[80px] sm:pt-[84px] md:pt-[88px] lg:pt-[92px] pb-20 flex items-center justify-center">
        <div className="text-center p-8 border border-white/5 rounded-sm max-w-md w-full mx-4 bg-zinc-950/40 backdrop-blur-md relative">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
          <Shield className="w-12 h-12 text-gold-pure mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-display uppercase tracking-widest text-white">{t('dashboard.access_denied', { defaultValue: 'Access Denied' })}</h2>
          <p className="text-zinc-400 text-xs mt-3 mb-6 leading-relaxed">
            {t('dashboard.login_required', { defaultValue: 'Authentication is required to access your premium Al Zoal Sovereign workspace.' })}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (setAuthModalOpen) {
                  setAuthModalOpen(true);
                } else {
                  window.dispatchEvent(new CustomEvent('zoal-open-auth'));
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-gold-dark to-[#D4AF37] hover:from-white hover:to-white hover:text-black text-black text-xs font-bold font-display uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              Authenticate Access
            </button>
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full py-2.5 bg-transparent border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white text-[10px] font-display uppercase tracking-widest rounded-xs transition-all cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic Multi-Dashboard Tab Switcher (Apple/Rolex inspired) */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 mb-10 gap-4">
          <div>
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1">
              ZOAL CORE COMMAND
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-display uppercase text-white">
              Sovereign Ecosystem
            </h1>
          </div>

          <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-sm w-full sm:w-auto rtl:flex-row-reverse">
            <button
              onClick={() => setActiveDashboardTab('patron')}
              className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeDashboardTab === 'patron' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> {t('dashboard.patron_area', { defaultValue: 'Patron Area' })}
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => setActiveDashboardTab('admin')}
                  className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeDashboardTab === 'admin' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> Portal Desk
                </button>
                <button
                  onClick={() => setActiveDashboardTab('owner')}
                  className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeDashboardTab === 'owner' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" /> Executive Deck
                </button>
              </>
            )}
          </div>
        </div>

        {/* I. PATRON / CUSTOMER DASHBOARD */}
        {activeDashboardTab === 'patron' && (
          <div className="space-y-6">
            
            {/* Top Navigation & Breadcrumb Bar */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setSidebarOpen(true); }}
                  className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
                  aria-label="Open Sidebar Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono">
                  <span>{t('dashboard.patron_area', { defaultValue: 'Patron' })}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-[#D4AF37] font-semibold">
                    {customerSubTab === 'overview' ? 'Dashboard' :
                     customerSubTab === 'orders' ? (selectedOrder ? 'Order Details' : 'My Orders') :
                     customerSubTab === 'track' ? 'Track Orders' :
                     customerSubTab === 'wishlist' ? 'Wishlist' :
                     customerSubTab === 'addresses' ? 'Saved Addresses' :
                     customerSubTab === 'profile' ? 'Profile' :
                     customerSubTab === 'notifications' ? 'Notifications' :
                     customerSubTab === 'settings' ? 'Account Settings' :
                     customerSubTab === 'password' ? 'Change Password' : 'Overview'}
                  </span>
                </div>
              </div>

              {/* Top Bar Quick Action Controls */}
              <div className="flex items-center justify-end gap-4">
                {/* Notification Bell Badge Trigger */}
                <button
                  onClick={() => { setCustomerSubTab('notifications'); setSelectedOrder(null); }}
                  className="relative p-2.5 bg-black hover:bg-zinc-900 border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-all cursor-pointer group"
                  title="View Notifications"
                >
                  <Bell className="w-4 h-4 group-hover:animate-swing" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] text-black font-mono font-bold text-[8px] flex items-center justify-center rounded-full animate-bounce">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Profile Quick Dropdown */}
                <div className="relative group/profile select-none">
                  <div className="flex items-center gap-2.5 p-1.5 px-3 bg-black hover:bg-zinc-900 border border-white/5 rounded-xs cursor-pointer duration-300">
                    <div className="w-6 h-6 rounded-full border border-[#D4AF37] overflow-hidden bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-[#D4AF37] font-mono">
                      {profilePhoto === 'gold_monarch' ? '👑' :
                       profilePhoto === 'emerald_elite' ? '💎' :
                       profilePhoto === 'sapphire_sovereign' ? '⭐' :
                       profilePhoto === 'ruby_royal' ? '🌹' : '🛡️'}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[100px] hidden sm:block">
                      {currentUser ? (currentUser as any).firstName || currentUser.name.split(' ')[0] : 'Patron'}
                    </span>
                  </div>

                  {/* Dropdown Menu Popup */}
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-zinc-950 border border-white/5 rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.9)] opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all duration-200 z-50 text-left p-1.5">
                    <div className="p-2 border-b border-white/5 text-left mb-1">
                      <p className="text-[10.5px] text-white font-semibold truncate leading-none mb-1">
                        {currentUser?.name || 'VIP Guest'}
                      </p>
                      <span className="text-[8px] font-mono text-zinc-500 tracking-wider truncate block">
                        {currentUser?.email}
                      </span>
                    </div>
                    <button
                      onClick={() => { setCustomerSubTab('profile'); setSelectedOrder(null); }}
                      className="w-full text-left py-1.5 px-2.5 text-[9.5px] uppercase tracking-wider text-zinc-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xs transition-all"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={() => { setCustomerSubTab('settings'); setSelectedOrder(null); }}
                      className="w-full text-left py-1.5 px-2.5 text-[9.5px] uppercase tracking-wider text-zinc-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xs transition-all"
                    >
                      Bespoke Preferences
                    </button>
                    <button
                      onClick={() => { setCustomerSubTab('password'); setSelectedOrder(null); }}
                      className="w-full text-left py-1.5 px-2.5 text-[9.5px] uppercase tracking-wider text-zinc-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xs transition-all"
                    >
                      Security Settings
                    </button>
                    <div className="border-t border-white/5 my-1 pt-1">
                      <button
                        onClick={() => {
                          if (onLogout && window.confirm('Terminate secure session?')) {
                            onLogout();
                          }
                        }}
                        className="w-full text-left py-1.5 px-2.5 text-[9.5px] uppercase tracking-wider text-rose-500 hover:bg-rose-950/20 rounded-xs transition-all"
                      >
                        Log Out Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Container: Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-8 items-start relative">
              
              {/* 1. DESKTOP SIDEBAR */}
              <div className="hidden lg:block w-64 shrink-0 bg-zinc-950 border border-white/5 rounded-sm p-4 space-y-1.5">
                <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 font-mono block px-3 pb-2 border-b border-white/5 mb-3">
                  Patron Navigation Suite
                </span>
                {[
                  { id: 'overview', name: t('dashboard.overview_label', { defaultValue: 'Dashboard Overview' }), icon: BarChart3 },
                  { id: 'orders', name: t('dashboard.my_orders', { defaultValue: 'My Orders' }), icon: ClipboardList },
                  { id: 'track', name: t('dashboard.track_orders_label', { defaultValue: 'Track Orders' }), icon: Truck },
                  { id: 'wishlist', name: t('dashboard.wishlist_label', { defaultValue: 'Wishlist Catalog' }), icon: Bookmark },
                  { id: 'addresses', name: t('dashboard.saved_addresses_label', { defaultValue: 'Saved Addresses' }), icon: MapPin },
                  { id: 'profile', name: t('dashboard.profile_label', { defaultValue: 'Profile Summary' }), icon: User },
                  { id: 'notifications', name: t('dashboard.notifications_label', { defaultValue: 'Notifications Log' }), icon: Bell },
                  { id: 'settings', name: t('dashboard.settings_label', { defaultValue: 'Account Settings' }), icon: Shield },
                  { id: 'password', name: t('dashboard.change_password_label', { defaultValue: 'Change Password' }), icon: Lock },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCustomerSubTab(item.id);
                      setSelectedOrder(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left py-2.5 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs cursor-pointer ${
                      customerSubTab === item.id 
                        ? 'bg-[#D4AF37] text-black font-bold shadow-[0_4px_12px_rgba(212,175,55,0.15)]' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </button>
                ))}

                {onLogout && (
                  <button
                    onClick={() => {
                      if (window.confirm('Sign out of your AL ZOAL sovereign session?')) {
                        onLogout();
                      }
                    }}
                    className="w-full text-left py-2.5 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 mt-4 border-t border-white/5 pt-4 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Log Out Session</span>
                  </button>
                )}
              </div>

              {/* 2. MOBILE DRAWER SIDEBAR */}
              <AnimatePresence>
                {sidebarOpen && (
                  <>
                    {/* Backdrop Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSidebarOpen(false)}
                      className="fixed inset-0 bg-black z-50 lg:hidden"
                    />
                    
                    {/* Drawer Content */}
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="fixed top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-white/5 z-50 p-5 flex flex-col justify-between lg:hidden text-left"
                    >
                      <div className="space-y-6">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div>
                            <span className="text-[8px] tracking-[0.3em] text-[#D4AF37] uppercase font-bold block mb-0.5">AL ZOAL BOUTIQUE</span>
                            <span className="text-white font-display uppercase font-bold text-xs tracking-wider">Patron Workspace</span>
                          </div>
                          <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 border border-white/5 hover:border-[#D4AF37]/30 text-zinc-500 hover:text-white rounded-sm duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Navigation Menu Links */}
                        <div className="space-y-1.5">
                          {[
                            { id: 'overview', name: t('dashboard.overview_label', { defaultValue: 'Dashboard Overview' }), icon: BarChart3 },
                            { id: 'orders', name: t('dashboard.my_orders', { defaultValue: 'My Orders' }), icon: ClipboardList },
                            { id: 'track', name: t('dashboard.track_orders_label', { defaultValue: 'Track Orders' }), icon: Truck },
                            { id: 'wishlist', name: t('dashboard.wishlist_label', { defaultValue: 'Wishlist Catalog' }), icon: Bookmark },
                            { id: 'addresses', name: t('dashboard.saved_addresses_label', { defaultValue: 'Saved Addresses' }), icon: MapPin },
                            { id: 'profile', name: t('dashboard.profile_label', { defaultValue: 'Profile Summary' }), icon: User },
                            { id: 'notifications', name: t('dashboard.notifications_label', { defaultValue: 'Notifications Log' }), icon: Bell },
                            { id: 'settings', name: t('dashboard.settings_label', { defaultValue: 'Account Settings' }), icon: Shield },
                            { id: 'password', name: t('dashboard.change_password_label', { defaultValue: 'Change Password' }), icon: Lock },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCustomerSubTab(item.id);
                                setSelectedOrder(null);
                                setSidebarOpen(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-full text-left py-2.5 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs cursor-pointer ${
                                customerSubTab === item.id 
                                  ? 'bg-[#D4AF37] text-black font-bold' 
                                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5" />
                              <span>{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Drawer Footer Logout */}
                      {onLogout && (
                        <button
                          onClick={() => {
                            if (window.confirm('Sign out of your AL ZOAL session?')) {
                              onLogout();
                            }
                          }}
                          className="w-full text-left py-3 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 border-t border-white/5 cursor-pointer mt-auto"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                          <span>Log Out Session</span>
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* 3. MAIN DASHBOARD CONTENT PANEL */}
              <div className="flex-1 w-full bg-zinc-950/30 border border-white/5 rounded-sm p-5 sm:p-6 min-h-[500px]">
                
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: OVERVIEW / DASHBOARD HOME */}
                  {customerSubTab === 'overview' && (
                    <motion.div
                      key="overview-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      {/* Welcome Banner Card */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-[#D4AF37]/20 rounded-xs p-6 shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] opacity-5 blur-2xl rounded-full pointer-events-none"></div>
                        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
                          
                          {/* Avatar Display */}
                          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-zinc-950 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(212,175,55,0.15)] animate-pulse shrink-0">
                            {profilePhoto === 'gold_monarch' ? '👑' :
                             profilePhoto === 'emerald_elite' ? '💎' :
                             profilePhoto === 'sapphire_sovereign' ? '⭐' :
                             profilePhoto === 'ruby_royal' ? '🌹' : '🛡️'}
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8.5px] uppercase tracking-[0.3em] text-[#D4AF37] font-mono font-bold block">
                              Sovereign Privilege Ledger
                            </span>
                            <h2 className="text-white font-display uppercase font-bold text-lg tracking-wider">
                              Welcome back, {currentUser?.name || 'VIP Guest'}
                            </h2>
                            <p className="text-zinc-500 text-[10px] leading-relaxed max-w-xl">
                              Enjoy bespoke high-tier lounge amenities, private priority delivery dispatching across Riyadh and Dammam, and curated boutique reservations.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Privilege Core Stats Widgets Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                          { label: 'Total Orders', value: customerOrders.length, icon: ClipboardList, color: 'text-[#D4AF37]' },
                          { label: 'In Delivery', value: customerOrders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Shipped').length, icon: Truck, color: 'text-amber-500' },
                          { label: 'Completed', value: customerOrders.filter(o => o.status === 'Completed').length, icon: CheckCircle2, color: 'text-emerald-500' },
                          { label: 'Wishlist Saved', value: wishlist.length, icon: Bookmark, color: 'text-rose-500' },
                          { label: 'Locations Set', value: (currentUser?.addresses || []).length, icon: MapPin, color: 'text-blue-500' }
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-[#060606]/90 border border-white/5 hover:border-[#D4AF37]/20 duration-300 p-4 rounded-xs text-center relative group">
                            <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color} group-hover:scale-110 duration-200`} />
                            <span className="text-[7.5px] uppercase tracking-widest text-zinc-500 block font-mono mb-1 leading-tight">{stat.label}</span>
                            <span className="text-lg font-mono text-white font-extrabold">{stat.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Main Overview Split Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Side: Recent Orders Summary */}
                        <div className="lg:col-span-8 bg-[#060606]/50 border border-white/5 rounded-xs p-5 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-wider flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-[#D4AF37]" /> Recent Account Orders
                            </h3>
                            <button
                              onClick={() => setCustomerSubTab('orders')}
                              className="text-[#D4AF37] hover:text-white text-[9px] uppercase tracking-widest font-mono duration-200"
                            >
                              See All
                            </button>
                          </div>

                          <div className="space-y-3">
                            {customerOrders.length === 0 ? (
                              <div className="p-8 text-center border border-dashed border-white/5 rounded-xs">
                                <p className="text-[10px] text-zinc-500">No recent transactions recorded under your email.</p>
                                <button
                                  onClick={() => setCurrentPage('store')}
                                  className="mt-3 px-4 py-1.5 bg-[#D4AF37] hover:bg-white text-black text-[8px] font-bold uppercase tracking-widest rounded-xs"
                                >
                                  Browse Creations
                                </button>
                              </div>
                            ) : (
                              customerOrders.slice(0, 2).map((order) => (
                                <div key={order.id} className="p-3 bg-black border border-white/5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4AF37]/20 duration-300">
                                  <div>
                                    <span className="text-white font-mono text-[10px] font-semibold block">{order.id}</span>
                                    <span className="text-[9px] text-zinc-500 font-mono">{order.date} • {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items</span>
                                  </div>
                                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                                    <span className="text-white font-mono text-xs font-bold">{formatCurrency(order.total)} SAR</span>
                                    <span className={`px-2 py-0.5 border text-[7.5px] uppercase tracking-wider rounded-sm font-bold font-mono ${
                                      order.status === 'Completed' ? 'border-emerald-500/35 text-emerald-400 bg-emerald-500/5' :
                                      order.status === 'Cancelled' ? 'border-rose-500/35 text-rose-400 bg-rose-500/5' :
                                      'border-amber-500/35 text-amber-400 bg-amber-500/5'
                                    }`}>
                                      {order.status}
                                    </span>
                                    <button
                                      onClick={() => { setSelectedOrder(order); setCustomerSubTab('orders'); }}
                                      className="p-1 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs duration-200"
                                      title="Review detailed coordinates"
                                    >
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Right Side: Quick Action Suite */}
                        <div className="lg:col-span-4 bg-[#060606]/50 border border-white/5 rounded-xs p-5 space-y-4">
                          <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-wider border-b border-white/5 pb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Quick Dispatches
                          </h3>
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                              { label: 'Track Shipment', action: 'track', desc: 'Real-time order map location' },
                              { label: 'Sovereign Address', action: 'addresses', desc: 'Configure checkout delivery pins' },
                              { label: 'Profile Dossier', action: 'profile', desc: 'Inspect authenticated user logs' },
                              { label: 'Session Password', action: 'password', desc: 'Secure encryption key rotation' }
                            ].map((act, i) => (
                              <button
                                key={i}
                                onClick={() => { setCustomerSubTab(act.action); setSelectedOrder(null); }}
                                className="w-full text-left p-2.5 bg-black hover:bg-[#D4AF37]/5 border border-white/5 hover:border-[#D4AF37]/25 rounded-xs duration-200 flex justify-between items-center group cursor-pointer"
                              >
                                <div>
                                  <span className="text-white font-display uppercase tracking-wider text-[9px] font-bold group-hover:text-[#D4AF37] transition-colors">{act.label}</span>
                                  <span className="text-[8px] text-zinc-500 block leading-tight font-mono">{act.desc}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#D4AF37] transition-all group-hover:translate-x-0.5" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Curated Recommendations Header */}
                      <div className="border-t border-white/5 pt-6 space-y-4">
                        <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-widest flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#D4AF37]" /> Curated Boutique Recommendations
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {allProducts.slice(0, 2).map((prod) => (
                            <div key={prod.id} className="p-4 border border-white/5 bg-[#060606] rounded-xs flex gap-4 hover:border-[#D4AF37]/25 duration-300 items-center">
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                referrerPolicy="no-referrer"
                                className="w-14 h-14 object-cover bg-zinc-900 border border-white/5 rounded-xs shrink-0"
                              />
                              <div className="flex-1 min-w-0 text-left">
                                <span className="text-[7.5px] uppercase tracking-widest text-[#D4AF37] font-mono">{prod.category}</span>
                                <h4 className="text-white text-xs font-semibold truncate mt-0.5">{prod.name}</h4>
                                <span className="text-zinc-400 font-mono text-[10px] mt-1 block">{prod.price} SAR</span>
                              </div>
                              <button
                                onClick={() => {
                                  onAddToCart(prod, 1);
                                  triggerToast(`✓ Curated dispatch of ${prod.name} into luxury cart.`, 'success');
                                }}
                                className="px-3 py-2 bg-[#D4AF37] hover:bg-white text-black text-[8px] font-bold uppercase tracking-widest rounded-xs transition-colors shrink-0 font-sans cursor-pointer"
                              >
                                Purchase
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: MY ORDERS & ORDER DETAILS */}
                  {customerSubTab === 'orders' && (
                    <motion.div
                      key="orders-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* VIEW 2A: ORDER DETAILS SUBVIEW */}
                      {selectedOrder ? (
                        <div className="space-y-6 text-left">
                          {/* Subview Header */}
                          <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <button
                              onClick={() => setSelectedOrder(null)}
                              className="px-3 py-1.5 border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white text-[9px] uppercase tracking-widest rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" /> Back to Ledger
                            </button>
                            <span className="text-zinc-500 font-mono text-[10px]">SPL Ref: {selectedOrder.trackingNumber || 'TRK-SPL-PENDING'}</span>
                          </div>

                          {/* Order Receipt Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Detailed List of Ordered Items */}
                            <div className="lg:col-span-2 bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                              <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                                <FileText className="w-4 h-4 text-[#D4AF37]" /> Invoice Receipt details
                              </h3>
                              
                              <div className="space-y-3">
                                {selectedOrder.items.map((it, idx) => {
                                  const matchingProd = allProducts.find(p => p.id === it.productId);
                                  return (
                                    <div key={idx} className="flex gap-4 items-center p-3 bg-black border border-white/5 rounded-xs">
                                      <img
                                        src={matchingProd?.images[0] || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=200'}
                                        alt={it.name}
                                        referrerPolicy="no-referrer"
                                        className="w-12 h-12 object-cover bg-zinc-900 border border-white/5 rounded-xs shrink-0"
                                      />
                                      <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-white text-xs font-semibold truncate">{it.name}</h4>
                                        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                                          Quantity: {it.quantity} • Option: {it.selectedOption || 'Standard'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-white font-mono text-xs font-bold block">{formatCurrency(it.price * it.quantity)} SAR</span>
                                        <span className="text-[9.5px] text-zinc-500 font-mono">{formatCurrency(it.price)} SAR / unit</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Interactive Visual Shipping Timeline */}
                              <div className="pt-4 border-t border-white/5 space-y-4">
                                <h4 className="text-white text-[9px] uppercase font-display font-bold tracking-widest">Priority Dispatch Status Timeline</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                  {[
                                    { label: '1. Pending', active: true, desc: 'Boutique confirmation' },
                                    { label: '2. Confirmed', active: selectedOrder.status !== 'Cancelled', desc: 'Preparation queued' },
                                    { label: '3. Packed', active: selectedOrder.status === 'Preparing' || selectedOrder.status === 'Shipped' || selectedOrder.status === 'Completed', desc: 'Signature sealed' },
                                    { label: '4. Shipped', active: selectedOrder.status === 'Shipped' || selectedOrder.status === 'Completed', desc: 'En route with SPL' },
                                    { label: '5. Delivered', active: selectedOrder.status === 'Completed', desc: 'Priority handover' }
                                  ].map((step, sIdx) => (
                                    <div key={sIdx} className={`p-2.5 border rounded-xs text-center duration-300 ${
                                      step.active 
                                        ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5 text-white' 
                                        : 'border-white/5 bg-black/40 text-zinc-500'
                                    }`}>
                                      <span className="text-[8px] uppercase tracking-wider font-bold block mb-1 font-sans">{step.label}</span>
                                      <span className="text-[7.5px] font-mono leading-tight block text-zinc-500">{step.desc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Cost Breakdown & Shipping Details Summary */}
                            <div className="space-y-4 text-left">
                              
                              {/* Order Information Card */}
                              <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                                <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5">
                                  Sovereign Order Summary
                                </h3>
                                <div className="space-y-3 font-mono text-[10.5px]">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Subtotal:</span>
                                    <span className="text-white">{formatCurrency(selectedOrder.subtotal)} SAR</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Shipping (Priority SPL):</span>
                                    <span className="text-white">{formatCurrency(selectedOrder.shipping)} SAR</span>
                                  </div>
                                  {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                      <span>Privilege Discount:</span>
                                      <span>-{formatCurrency(selectedOrder.discount)} SAR</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-white/5 pt-2 text-xs font-bold font-sans">
                                    <span className="text-white">Total Amount:</span>
                                    <span className="text-[#D4AF37] font-mono">{formatCurrency(selectedOrder.total)} SAR</span>
                                  </div>
                                  <div className="flex justify-between text-[8px] uppercase tracking-wider font-semibold border-t border-white/5 pt-2">
                                    <span className="text-zinc-500">Method:</span>
                                    <span className="text-white font-sans">{selectedOrder.paymentMethod}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Destination Addresses Card */}
                              <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-3">
                                <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5">
                                  Delivery Coordinates
                                </h3>
                                <p className="text-xs text-white font-medium">{selectedOrder.customerName}</p>
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{selectedOrder.address}</p>
                                <div className="text-[9.5px] text-zinc-500 font-mono border-t border-white/5 pt-2">
                                  Phone: <span className="text-zinc-300">{selectedOrder.phone}</span>
                                </div>
                              </div>

                              {/* Automated Invoice Download Mock */}
                              <button
                                onClick={() => {
                                  window.print();
                                }}
                                className="w-full py-3 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-widest rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer font-sans"
                              >
                                <Download className="w-4 h-4" /> Download Printable Invoice
                              </button>
                            </div>

                          </div>
                        </div>
                      ) : (
                        
                        /* VIEW 2B: ORDERS LIST LEDGER */
                        <div className="space-y-4 text-left">
                          
                          {/* Filters Toolbar */}
                          <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                            
                            {/* Search Field */}
                            <div className="relative w-full md:w-72">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Search by Order ID..."
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xs py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                              />
                            </div>

                            {/* Status Filter Tab Buttons */}
                            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 font-mono text-[8px] uppercase tracking-wider">
                              {['all', 'Pending', 'Preparing', 'Shipped', 'Completed', 'Cancelled'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => setOrderStatusFilter(status as any)}
                                  className={`px-3 py-1.5 border rounded-sm transition-all whitespace-nowrap cursor-pointer ${
                                    orderStatusFilter === status
                                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold'
                                      : 'border-white/5 bg-black hover:border-white/10 text-zinc-500 hover:text-white'
                                  }`}
                                >
                                  {status === 'all' ? 'All Orders' : status}
                                </button>
                              ))}
                            </div>

                          </div>

                          {/* Orders List Map */}
                          <div className="space-y-3">
                            {customerOrders.filter((o) => {
                              const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase());
                              const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                              return matchesSearch && matchesFilter;
                            }).length === 0 ? (
                              <div className="p-12 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
                                <ClipboardList className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                                <h4 className="text-white text-xs font-display uppercase tracking-wider">No Orders Match Query</h4>
                                <p className="text-[10px] text-zinc-500 mt-1">Refine your search or clear filters to view ledger.</p>
                              </div>
                            ) : (
                              customerOrders
                                .filter((o) => {
                                  const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase());
                                  const matchesFilter = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                                  return matchesSearch && matchesFilter;
                                })
                                .map((order) => (
                                  <div 
                                    key={order.id} 
                                    className="p-4 border border-white/5 bg-[#060606]/80 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#D4AF37]/25 transition-all duration-300"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-white font-mono text-[11px] font-bold">{order.id}</span>
                                        <span className={`px-2 py-0.5 border text-[7.5px] uppercase tracking-wider rounded-xs font-bold font-mono ${
                                          order.status === 'Completed' ? 'border-emerald-500/35 text-emerald-400 bg-emerald-500/5' :
                                          order.status === 'Cancelled' ? 'border-rose-500/35 text-rose-400 bg-rose-500/5' :
                                          'border-amber-500/35 text-amber-400 bg-amber-500/5'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <span className="text-[9.5px] text-zinc-500 font-mono block">
                                        Date: {order.date} • Recipient: {order.customerName}
                                      </span>
                                    </div>
                                    
                                    {/* Products Compact Previews */}
                                    <div className="flex items-center gap-2 overflow-x-auto max-w-full md:max-w-xs pb-1 md:pb-0">
                                      {order.items.slice(0, 3).map((it, idx) => {
                                        const matchingP = allProducts.find(p => p.id === it.productId);
                                        return (
                                          <div key={idx} className="w-8 h-8 rounded-xs border border-white/5 bg-zinc-900 overflow-hidden relative group" title={it.name}>
                                            <img
                                              src={matchingP?.images[0] || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=80&w=200'}
                                              alt={it.name}
                                              referrerPolicy="no-referrer"
                                              className="w-full h-full object-cover"
                                            />
                                            {it.quantity > 1 && (
                                              <span className="absolute bottom-0 right-0 bg-black/85 text-[7px] text-white px-0.5 font-mono font-bold border-t border-l border-white/5 leading-none">
                                                x{it.quantity}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {order.items.length > 3 && (
                                        <div className="w-8 h-8 rounded-xs border border-white/5 bg-zinc-950 flex items-center justify-center text-[7.5px] font-mono text-zinc-500">
                                          +{order.items.length - 3}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-4 border-t border-white/5 pt-3 md:border-t-0 md:pt-0">
                                      <div className="text-left md:text-right">
                                        <span className="text-[8px] uppercase font-mono tracking-widest text-zinc-500 block leading-none mb-1">Total Paid</span>
                                        <span className="text-white font-mono text-[12.5px] font-extrabold">{formatCurrency(order.total)} SAR</span>
                                      </div>
                                      <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="px-4 py-2 bg-transparent hover:bg-[#D4AF37] border border-[#D4AF37]/35 text-[#D4AF37] hover:text-black text-[9px] font-bold uppercase tracking-widest rounded-xs duration-300 cursor-pointer font-sans"
                                      >
                                        Invoice details
                                      </button>
                                    </div>

                                  </div>
                                ))
                            )}
                          </div>

                        </div>
                      )}

                    </motion.div>
                  )}

                  {/* TAB 3: TRACK ACTIVE SHIPMENTS */}
                  {customerSubTab === 'track' && (
                    <motion.div
                      key="track-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-5 text-left">
                        <h3 className="text-white text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 mb-4 flex items-center gap-2">
                          <Truck className="w-4.5 h-4.5 text-[#D4AF37]" /> Active Order Tracking Portal
                        </h3>
                        <p className="text-zinc-500 text-xs mb-4 max-w-xl">
                          Select any of your pending or active dispatches below to visualize the real-time logistics timeline.
                        </p>
                        <TrackOrder 
                          orders={customerOrders} 
                          setCurrentPage={setCurrentPage} 
                          isEmbedded={true} 
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: WISHLIST VIEW */}
                  {customerSubTab === 'wishlist' && (
                    <motion.div
                      key="wishlist-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 text-left"
                    >
                      <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-4 flex gap-4 items-center justify-between mb-2">
                        <div className="relative w-full max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search saved wishlist creations..."
                            value={wishlistSearch}
                            onChange={(e) => setWishlistSearch(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xs py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                          />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-mono whitespace-nowrap">{wishlist.length} Items</span>
                      </div>

                      {wishlist.length === 0 ? (
                        <div className="p-12 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
                          <Bookmark className="w-8 h-8 text-zinc-500 mx-auto mb-3 animate-pulse" />
                          <h4 className="text-white text-xs font-display uppercase tracking-wider">Your Wishlist Canvas is Clean</h4>
                          <button
                            onClick={() => setCurrentPage('store')}
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs mt-4 transition-all duration-300 cursor-pointer"
                          >
                            Browse Creations
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {allProducts
                            .filter((p) => wishlist.includes(p.id) && p.name.toLowerCase().includes(wishlistSearch.toLowerCase()))
                            .map((product) => (
                              <div key={product.id} className="p-4 border border-white/5 bg-[#060606] rounded-xs flex gap-4 hover:border-[#D4AF37]/20 duration-300 items-center">
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 object-cover bg-zinc-900 border border-white/5 rounded-xs shrink-0"
                                />
                                <div className="flex-1 min-w-0 text-left">
                                  <span className="text-[8.5px] uppercase tracking-widest text-[#D4AF37] font-mono">{product.category}</span>
                                  <h4 className="text-white text-xs font-semibold truncate mt-0.5">{product.name}</h4>
                                  <span className="text-zinc-400 font-mono text-[10.5px] mt-1 block">{product.price} SAR</span>
                                  
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      onClick={() => {
                                        onAddToCart(product, 1);
                                        triggerToast(`✓ Dispatched ${product.name} into shopping cart.`, 'success');
                                      }}
                                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-white text-black text-[8.5px] font-bold uppercase tracking-wider rounded-xs cursor-pointer"
                                    >
                                      Add to Cart
                                    </button>
                                    <button
                                      onClick={() => {
                                        onToggleWishlist(product.id);
                                        triggerToast(`✓ Removed ${product.name} from wishlist.`, 'info');
                                      }}
                                      className="px-3 py-1.5 border border-white/5 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 text-[8.5px] font-bold uppercase tracking-wider rounded-xs cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 5: SAVED ADDRESS COORD MANAGER */}
                  {customerSubTab === 'addresses' && (
                    <motion.div
                      key="addresses-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <AddressSection 
                        currentUser={currentUser} 
                        onUpdateCurrentUser={onUpdateCurrentUser} 
                      />
                    </motion.div>
                  )}

                  {/* TAB 6: IDENTITY PROFILE DOSSIER */}
                  {customerSubTab === 'profile' && (
                    <motion.div
                      key="profile-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      {/* Identity Summary */}
                      <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-5">
                        <h3 className="text-white text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 flex items-center gap-2">
                          <User className="w-4.5 h-4.5 text-[#D4AF37]" /> Identity Registry File
                        </h3>

                        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-white/5 pb-5">
                          {/* Avatar Large */}
                          <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-zinc-950 flex items-center justify-center text-4xl shadow-xl shrink-0">
                            {profilePhoto === 'gold_monarch' ? '👑' :
                             profilePhoto === 'emerald_elite' ? '💎' :
                             profilePhoto === 'sapphire_sovereign' ? '⭐' :
                             profilePhoto === 'ruby_royal' ? '🌹' : '🛡️'}
                          </div>

                          <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-white font-display uppercase font-semibold text-base tracking-wider">{currentUser?.name}</h4>
                            <p className="text-[#D4AF37] font-mono text-[9px] uppercase tracking-widest">ZOAL {currentUser?.role || 'Customer'} Ledger</p>
                            <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest block">Account key ID: {(currentUser as any)?.id || 'VIP-AC-781'}</span>
                          </div>
                        </div>

                        {/* Grid Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">First Name</span>
                            <span className="text-white font-medium">{(currentUser as any)?.firstName || currentUser?.name.split(' ')[0]}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Last Name</span>
                            <span className="text-white font-medium">{(currentUser as any)?.lastName || currentUser?.name.split(' ').slice(1).join(' ')}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Primary Email Contact</span>
                            <span className="text-zinc-300 font-mono">{currentUser?.email}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Authorized Contact Phone</span>
                            <span className="text-zinc-300 font-mono">{currentUser?.phone || '+966 56 769 9315'}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1 sm:col-span-2">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Verification Status</span>
                            <div className="flex items-center gap-1.5 text-emerald-400 mt-1">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              <span className="text-[10px] uppercase tracking-wider font-semibold font-mono">Bespoke identity securely validated on server</span>
                            </div>
                          </div>
                        </div>

                        {/* Switch to settings */}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setCustomerSubTab('settings')}
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer font-sans"
                          >
                            Modify Dossier
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 7: NOTIFICATIONS ALERTS LOGGER */}
                  {customerSubTab === 'notifications' && (
                    <motion.div
                      key="notifications-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 text-left"
                    >
                      {/* Notifications Header Filter toolbar */}
                      <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="Search alerts..."
                            value={notificationSearch}
                            onChange={(e) => setNotificationSearch(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xs py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 text-[8.5px] uppercase font-mono tracking-wider">
                          {['all', 'order', 'offer', 'system'].map((f) => (
                            <button
                              key={f}
                              onClick={() => setNotificationFilter(f as any)}
                              className={`px-2.5 py-1.5 border rounded-sm transition-all cursor-pointer ${
                                notificationFilter === f 
                                  ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' 
                                  : 'border-white/5 bg-black text-zinc-500 hover:text-white'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Actions */}
                      {notifications.length > 0 && (
                        <div className="flex justify-end gap-3 px-1">
                          <button
                            onClick={() => {
                              setNotifications(notifications.map(n => ({ ...n, read: true })));
                              triggerToast('✓ All notifications flagged as read.', 'success');
                            }}
                            className="text-[8.5px] uppercase tracking-widest text-[#D4AF37] font-mono hover:text-white duration-200"
                          >
                            Mark All Read
                          </button>
                          <span className="text-zinc-700">|</span>
                          <button
                            onClick={() => {
                              if (window.confirm('Clear all notifications?')) {
                                setNotifications([]);
                                triggerToast('✓ Clean log slate completed.', 'info');
                              }
                            }}
                            className="text-[8.5px] uppercase tracking-widest text-rose-500 hover:text-rose-400 font-mono duration-200"
                          >
                            Clear All Log
                          </button>
                        </div>
                      )}

                      {/* List */}
                      <div className="space-y-3">
                        {notifications.filter(n => {
                          const matchesS = n.title.toLowerCase().includes(notificationSearch.toLowerCase()) || n.message.toLowerCase().includes(notificationSearch.toLowerCase());
                          const matchesF = notificationFilter === 'all' || n.type === notificationFilter;
                          return matchesS && matchesF;
                        }).length === 0 ? (
                          <div className="p-12 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
                            <Bell className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                            <h4 className="text-white text-xs font-display uppercase tracking-wider">Your Alert Dossier is Empty</h4>
                            <p className="text-[10px] text-zinc-500 mt-1">We will log order dispatches and key events here.</p>
                          </div>
                        ) : (
                          notifications
                            .filter(n => {
                              const matchesS = n.title.toLowerCase().includes(notificationSearch.toLowerCase()) || n.message.toLowerCase().includes(notificationSearch.toLowerCase());
                              const matchesF = notificationFilter === 'all' || n.type === notificationFilter;
                              return matchesS && matchesF;
                            })
                            .map((notif) => (
                              <div 
                                key={notif.id} 
                                className={`p-4 border rounded-xs flex gap-4 items-start duration-300 relative group ${
                                  notif.read 
                                    ? 'border-white/5 bg-zinc-950/15 text-zinc-400' 
                                    : 'border-[#D4AF37]/20 bg-[#D4AF37]/5 text-white'
                                }`}
                              >
                                {/* Indicator Point */}
                                {!notif.read && (
                                  <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping" />
                                )}

                                <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-zinc-600" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-semibold text-white uppercase tracking-wide">{notif.title}</h4>
                                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase">({notif.type})</span>
                                  </div>
                                  <p className="text-[10.5px] text-zinc-400 mt-1 leading-relaxed pr-8">{notif.message}</p>
                                  <span className="text-[8px] font-mono text-zinc-500 block mt-2">{new Date(notif.timestamp).toLocaleString()}</span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                                  {!notif.read && (
                                    <button
                                      onClick={() => {
                                        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                        triggerToast('✓ Notification updated.', 'success');
                                      }}
                                      className="p-1 border border-white/10 hover:border-white/30 text-zinc-500 hover:text-white rounded-xs duration-200 text-[8px] uppercase tracking-wider font-mono"
                                    >
                                      Read
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setNotifications(notifications.filter(n => n.id !== notif.id));
                                      triggerToast('✓ Item removed from registry.', 'info');
                                    }}
                                    className="p-1 border border-white/5 hover:border-rose-500/30 text-zinc-600 hover:text-rose-400 rounded-xs duration-200"
                                    title="Delete coordinate"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 8: BESPOKE ACCOUNT SETTINGS */}
                  {customerSubTab === 'settings' && (
                    <motion.div
                      key="settings-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-5 space-y-6 text-left">
                        <AccountSettingsSection 
                          currentUser={currentUser} 
                          onUpdateCurrentUser={onUpdateCurrentUser} 
                        />

                        {/* Extra visual custom layout settings (Language & Notifications & Avatars) */}
                        <div className="border-t border-white/5 pt-5 space-y-4 font-sans">
                          <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> II. Visual Preferences & Theme Registry
                          </h4>

                          {/* Avatar Presets Selection Gallery */}
                          <div className="space-y-2">
                            <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Bespoke Sovereign Avatar Selection:</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {[
                                { key: 'gold_monarch', label: '👑 Gold Monarch', desc: 'Elite Sovereign gold crown' },
                                { key: 'emerald_elite', label: '💎 Emerald Elite', desc: 'Sovereign precious gem' },
                                { key: 'sapphire_sovereign', label: '⭐ Star Patron', desc: 'Bright gold celestial' },
                                { key: 'ruby_royal', label: '🌹 Ruby Royal', desc: 'Rich scarlet floral' },
                                { key: 'shield_guardian', label: '🛡️ Sentinel Shield', desc: 'Platinum secure protector' }
                              ].map((av) => (
                                <button
                                  key={av.key}
                                  onClick={() => {
                                    setProfilePhoto(av.key);
                                    triggerToast(`✓ Profile avatar successfully updated to ${av.label}.`, 'success');
                                  }}
                                  className={`p-3 border rounded-xs text-center duration-200 transition-all text-left ${
                                    profilePhoto === av.key 
                                      ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-white' 
                                      : 'border-white/5 bg-black hover:border-white/15 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  <span className="text-[10.5px] font-bold block mb-1">{av.label}</span>
                                  <span className="text-[7.5px] font-mono block text-zinc-500 leading-tight">{av.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Split Language and Notification Preferences */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            
                            {/* Language */}
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Workspace Display Language:</label>
                              <select
                                value={languagePreference}
                                onChange={(e) => {
                                  setLanguagePreference(e.target.value);
                                  triggerToast(`✓ Display language shifted to ${e.target.value === 'en' ? 'English' : 'Arabic'}.`, 'info');
                                }}
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                              >
                                <option value="en">English (Curated UK Standard)</option>
                                <option value="ar">العربية (Kingdom of Saudi Arabia)</option>
                              </select>
                            </div>

                            {/* Alert Preferences */}
                            <div className="space-y-2">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Priority Alert Channels:</label>
                              <div className="space-y-2 bg-black/40 border border-white/5 p-3 rounded-xs text-xs font-mono">
                                {[
                                  { key: 'email', label: 'VIP Automated Email alerts' },
                                  { key: 'sms', label: 'High Priority SMS alerts (+966)' },
                                  { key: 'whatsapp', label: 'Curated WhatsApp alerts' }
                                ].map((ch) => (
                                  <label key={ch.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={(notificationPreferences as any)[ch.key]}
                                      onChange={(e) => {
                                        setNotificationPreferences({
                                          ...notificationPreferences,
                                          [ch.key]: e.target.checked
                                        });
                                        triggerToast(`✓ Notification preference modified.`, 'success');
                                      }}
                                      className="accent-[#D4AF37] rounded-sm focus:outline-none cursor-pointer"
                                    />
                                    <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{ch.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 9: CHANGE SECRET SECURITY PASSWORD KEY */}
                  {customerSubTab === 'password' && (
                    <motion.div
                      key="password-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="bg-[#060606]/40 border border-white/5 rounded-xs p-5 space-y-4 text-left">
                        
                        {/* Custom Change Password Inline Form */}
                        <div className="max-w-xl mx-auto space-y-4 font-sans">
                          <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                            <Lock className="w-4 h-4" /> Secure Session Key Password Rotation
                          </h4>
                          <p className="text-zinc-500 text-xs leading-relaxed">
                            Protect your premium access level. Rotate your security secret keys regularly. High cryptography encryption pbkdf2 with SHA-512 applied on servers.
                          </p>

                          {/* Standard password forms are embedded elegantly */}
                          <div className="p-3.5 bg-black border border-white/5 rounded-xs text-zinc-500 font-mono text-[9px] uppercase tracking-wider mb-2">
                            Password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 special character (@$!%*?&).
                          </div>

                          {/* Embed password update form */}
                          <div className="space-y-4">
                            {/* Passwords rotated using settings endpoint inside component */}
                            <form 
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const currentPass = (e.currentTarget.elements.namedItem('currentPass') as HTMLInputElement).value;
                                const newPass = (e.currentTarget.elements.namedItem('newPass') as HTMLInputElement).value;
                                const confirmPass = (e.currentTarget.elements.namedItem('confirmPass') as HTMLInputElement).value;
                                
                                if (!currentPass || !newPass || !confirmPass) {
                                  alert('Provide all credentials.');
                                  return;
                                }

                                if (newPass !== confirmPass) {
                                  alert('Rotated passwords do not match.');
                                  return;
                                }

                                const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
                                if (!token) {
                                  alert('Session expired. Please log in.');
                                  return;
                                }

                                try {
                                  const res = await fetch('/api/auth/change-password', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
                                  });

                                  const data = await res.json();
                                  if (!res.ok) {
                                    alert(data.error || 'Failed to rotate secret keys.');
                                    return;
                                  }

                                  triggerToast('✓ Secret security keys successfully rotated on servers.', 'success');
                                  (e.target as HTMLFormElement).reset();
                                } catch (err) {
                                  alert('Network failed. Verify server is online.');
                                }
                              }}
                              className="space-y-4"
                            >
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Current Secure Password:</label>
                                <input
                                  type="password"
                                  name="currentPass"
                                  required
                                  placeholder="••••••••••••"
                                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">New Secure Password Key:</label>
                                <input
                                  type="password"
                                  name="newPass"
                                  required
                                  placeholder="••••••••••••"
                                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Confirm New Secure Password Key:</label>
                                <input
                                  type="password"
                                  name="confirmPass"
                                  required
                                  placeholder="••••••••••••"
                                  className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer font-sans"
                              >
                                Rotate Secret Keys
                              </button>
                            </form>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
                
              </div>

            </div>

            {/* Custom Interactive Toast Alert Notification Container */}
            <div className="fixed bottom-6 right-6 space-y-2 z-50 text-left pointer-events-none max-w-sm">
              <AnimatePresence>
                {toasts.map((toast) => (
                  <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="p-3.5 bg-zinc-950/95 border border-[#D4AF37]/30 text-white rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-start gap-3 pointer-events-auto"
                  >
                    <div className="p-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                      {toast.type === 'error' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold leading-tight">{toast.message}</p>
                      <span className="text-[8px] font-mono text-zinc-500 block mt-1 uppercase tracking-wider">ZOAL SYSTEM CONFIRMATION</span>
                    </div>
                    <button
                      onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

          </div>
        )}

        {/* II. ADMIN PORTAL DASHBOARD */}
        {activeDashboardTab === 'admin' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Quick aggregate widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                <Package className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Stock Portfolio Count</span>
                <span className="text-2xl font-mono text-white font-bold">{allProducts.length} Distinct Products</span>
                <span className="text-[9px] text-[#D4AF37] block mt-1">Multi-Domain items verified</span>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                <Truck className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Active Deliveries Waiting</span>
                <span className="text-2xl font-mono text-white font-bold">
                  {orders.filter((o) => o.status === 'Preparing' || o.status === 'Pending').length} Pending Tasks
                </span>
                <span className="text-[9px] text-blue-405 block mt-1">SLA Standard: &lt;5 hours VIP SLA</span>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                <Users className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Active Labor Roster</span>
                <span className="text-2xl font-mono text-white font-bold">{simulatedEmployees.length} Dedicated Artisans</span>
                <span className="text-[9px] text-zinc-500 block mt-1">Dammam & Al Hofuf branches active</span>
              </div>

            </div>

            {/* Invoices Coordinator (Manage order stages) */}
            <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5 text-gold-pure" /> Order Dispatch Workflow
                </h3>
                <span className="text-[10px] text-zinc-500">Click actions to alter states instantaneously</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                      <th className="py-3">Order ID</th>
                      <th className="py-3">Client</th>
                      <th className="py-3">Total Sum</th>
                      <th className="py-3">Current Status</th>
                      <th className="py-3 text-right">Update Workflow State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                        <td className="py-4 font-mono font-bold text-gold-pure">{ord.id}</td>
                        <td className="py-4 font-sans text-zinc-300">
                          <p className="font-semibold">{ord.customerName}</p>
                          <p className="text-[10px] text-zinc-500">{ord.phone}</p>
                        </td>
                        <td className="py-4 font-mono text-zinc-300">{formatCurrency(ord.total)} SAR</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-widest font-semibold ${
                            ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' :
                            ord.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                            ord.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                            'bg-amber-950 text-amber-400 animate-pulse'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-4 text-right flex items-center justify-end gap-1.5 h-full mt-1.5">
                          {['Pending', 'Preparing', 'Shipped'].includes(ord.status) && (
                            <button
                              onClick={() => {
                                const states: Order['status'][] = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                                const currIdx = states.indexOf(ord.status);
                                if (currIdx < states.length - 1) {
                                  onUpdateOrderStatus(ord.id, states[currIdx + 1]);
                                }
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-gold-pure text-black rounded-xs text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Advance State
                            </button>
                          )}
                          {ord.status !== 'Cancelled' && ord.status !== 'Completed' && (
                            <button
                              onClick={() => onUpdateOrderStatus(ord.id, 'Cancelled')}
                              className="px-2 py-1 bg-rose-950/40 hover:bg-rose-600 border border-rose-500/10 hover:text-white rounded-xs text-[9px] uppercase transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Inventories Matrix */}
            <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">
                IV. Product Inventory Ledger
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventoryStatusList.map((itm, i) => (
                  <div key={i} className="p-4 border border-white/5 bg-zinc-950/40 flex items-center justify-between text-xs rounded-xs">
                    <div>
                      <p className="text-white font-medium truncate max-w-[190px]">{itm.name}</p>
                      <p className="text-zinc-500 text-[9px] uppercase tracking-widest">{itm.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-300 font-mono font-medium">{itm.qty} in stock</p>
                      <span className={`text-[9px] uppercase font-semibold ${itm.state.includes('Critical') ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                        {itm.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🚚 Dynamic Regional Delivery & Logistics Controls */}
            <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5 text-[#D4AF37]" /> V. Regional Delivery & Logistics Controls
                </h3>
                <span className="text-[10px] text-zinc-500">Configure logistics areas or update standard shipping fees</span>
              </div>

              {/* Delivery Zones Table */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left panel: Active zones */}
                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3 text-left">
                    <h4 className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>Available Logistics Zones</span>
                      <span className="text-[#D4AF37] font-bold">{(deliveryZones || []).length} Areas</span>
                    </h4>
                    <div className="divide-y divide-white/5 space-y-2 max-h-[250px] overflow-y-auto pr-2">
                      {(deliveryZones || []).map((zone: any) => (
                        <div key={zone.id} className="pt-2 flex items-center justify-between text-xs">
                          <div className="text-left">
                            <span className="font-semibold text-white block">{zone.city}</span>
                            <span className="text-[9.5px] text-zinc-500 block leading-none mt-0.5">{zone.region || 'Saudi Arabia'} • {zone.method}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[#D4AF37] font-bold text-[11px]">
                              {zone.fee === 0 ? 'Free' : `${zone.fee.toFixed(2)} SAR`}
                            </span>
                            
                            {/* Delete Area */}
                            <button 
                              type="button"
                              onClick={() => {
                                const nextZones = (deliveryZones || []).filter((z: any) => z.id !== zone.id);
                                if (onUpdateDeliveryZones) {
                                  onUpdateDeliveryZones(nextZones);
                                }
                              }}
                              className="text-rose-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title="Delete Area"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right panel: Add Logistics Zone */}
                  <div className="p-4 border border-[#D4AF37]/15 bg-[#D4AF37]/5 rounded-xs space-y-3 text-left">
                    <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-[#D4AF37]/10 pb-1.5">
                      Establish New Logistics Area
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-400 uppercase tracking-widest block">City Area Name:</label>
                          <input 
                            type="text" 
                            id="new_zone_city"
                            placeholder="e.g. Medina"
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-sans">Territory Province:</label>
                          <input 
                            type="text" 
                            id="new_zone_region"
                            placeholder="e.g. Hejaz Province"
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-mono">Standard Fee (SAR):</label>
                          <input 
                            type="number" 
                            id="new_zone_fee"
                            defaultValue={25}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-sans">Logistics Tier:</label>
                          <select 
                            id="new_zone_method"
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-zinc-300 focus:outline-none"
                          >
                            <option value="Regional Delivery">Regional Delivery</option>
                            <option value="Local Delivery">Local Delivery</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const cityEl = document.getElementById('new_zone_city') as HTMLInputElement;
                          const regionEl = document.getElementById('new_zone_region') as HTMLInputElement;
                          const feeEl = document.getElementById('new_zone_fee') as HTMLInputElement;
                          const methodEl = document.getElementById('new_zone_method') as HTMLSelectElement;

                          if (cityEl && cityEl.value.trim()) {
                            const newZ = {
                              id: `zone-${Date.now()}`,
                              city: cityEl.value.trim(),
                              fee: parseFloat(feeEl.value) || 0,
                              method: methodEl.value,
                              region: regionEl.value.trim() || 'Saudi Arabia'
                            };
                            if (onUpdateDeliveryZones) {
                              onUpdateDeliveryZones([...(deliveryZones || []), newZ]);
                              cityEl.value = '';
                              regionEl.value = '';
                              feeEl.value = '25';
                              alert(`Successfully established new logistics zone: ${newZ.city} at ${newZ.fee} SAR!`);
                            }
                          } else {
                            alert('Kindly type in a valid City Name.');
                          }
                        }}
                        className="w-full py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-wider rounded-xs transition-colors mt-1 cursor-pointer"
                      >
                        Establish Logistics Zone
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ⚙️ VI. Luxury Shipping Policy & SLA Configurations */}
            <div className="bg-[#060606] border border-[#D4AF37]/20 rounded-sm p-6 space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
                <div>
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#D4AF37]" /> VI. Luxury Shipping Policy & SLA Configurations
                  </h3>
                  <span className="text-[10px] text-zinc-500">Configure global shipping variables, free shipping minimums, and delivery speeds in real-time</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] text-[#D4AF37] uppercase tracking-wider font-mono self-start sm:self-center">
                  Live Sync Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Left panel: Free shipping & general */}
                <div className="space-y-4">
                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" /> Free Shipping & SLA Thresholds
                    </h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Free Shipping Minimum Purchase (SAR):</label>
                      <input 
                        type="number"
                        value={shippingConfig.freeShippingThreshold}
                        onChange={(e) => setLocalShippingConfig({ ...shippingConfig, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]/35"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Processing Time (EN):</label>
                        <input 
                          type="text"
                          value={shippingConfig.processingTimeEn}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, processingTimeEn: e.target.value })}
                          placeholder="e.g. 1–2 Business Days"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Processing Time (AR):</label>
                        <input 
                          type="text"
                          value={shippingConfig.processingTimeAr}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, processingTimeAr: e.target.value })}
                          placeholder="مثال: 1-2 أيام عمل"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Same-Day Local Delivery Cutoff
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Cutoff Time (EN):</label>
                        <input 
                          type="text"
                          value={shippingConfig.sameDayCutoffEn}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, sameDayCutoffEn: e.target.value })}
                          placeholder="e.g. 1:00 PM"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Cutoff Time (AR):</label>
                        <input 
                          type="text"
                          value={shippingConfig.sameDayCutoffAr}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, sameDayCutoffAr: e.target.value })}
                          placeholder="مثال: 1:00 مساءً"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right panel: Delivery Speeds (Standard, Express, Same Day) */}
                <div className="space-y-4">
                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-4">
                    <h4 className="text-[10px] text-white font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#D4AF37]" /> Delivery Speed Display Variables
                    </h4>

                    {/* Standard Speed */}
                    <div className="grid grid-cols-2 gap-3 border-b border-white/5 pb-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Standard Days (EN):</label>
                        <input 
                          type="text"
                          value={shippingConfig.standardDaysEn}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, standardDaysEn: e.target.value })}
                          placeholder="e.g. 3–5 Business Days"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Standard Days (AR):</label>
                        <input 
                          type="text"
                          value={shippingConfig.standardDaysAr}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, standardDaysAr: e.target.value })}
                          placeholder="مثال: 3-5 أيام عمل"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Express Speed */}
                    <div className="grid grid-cols-2 gap-3 border-b border-white/5 pb-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Express Days (EN):</label>
                        <input 
                          type="text"
                          value={shippingConfig.expressDaysEn}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, expressDaysEn: e.target.value })}
                          placeholder="e.g. 1–2 Business Days"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Express Days (AR):</label>
                        <input 
                          type="text"
                          value={shippingConfig.expressDaysAr}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, expressDaysAr: e.target.value })}
                          placeholder="مثال: 1-2 أيام عمل"
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Same Day Speed */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Same-Day Status (EN):</label>
                        <input 
                          type="text"
                          value={shippingConfig.sameDayDaysEn}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, sameDayDaysEn: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-semibold">Same-Day Status (AR):</label>
                        <input 
                          type="text"
                          value={shippingConfig.sameDayDaysAr}
                          onChange={(e) => setLocalShippingConfig({ ...shippingConfig, sameDayDaysAr: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    saveShippingConfig(shippingConfig);
                    alert("Sovereign shipping configurations saved successfully! Changes are synced in real-time.");
                  }}
                  className="px-8 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
                >
                  Save Shipping Configurations
                </button>
              </div>
            </div>

            {/* ⚙️ VII. Luxury Return & Refund Policy Configurations */}
            <div className="bg-[#060606] border border-[#D4AF37]/20 rounded-sm p-6 space-y-6 text-left mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
                <div>
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#D4AF37]" /> VII. Luxury Return & Refund Policy Configurations
                  </h3>
                  <span className="text-[10px] text-zinc-500">Manage returns windows, refund processing SLAs, exclusions, and support channels in real-time</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[9px] text-[#D4AF37] uppercase tracking-wider font-mono self-start sm:self-center">
                  Live Sync Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                
                {/* Left panel: Window & SLAs */}
                <div className="space-y-4">
                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Return Window Configurations
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Standard Window (Days):</label>
                        <input 
                          type="number"
                          value={returnsConfig.returnWindowDays}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, returnWindowDays: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">Promo Window (Days):</label>
                        <input 
                          type="number"
                          value={returnsConfig.returnWindowDaysPromo}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, returnWindowDaysPromo: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Refund Processing SLAs
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 border-b border-white/5 pb-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Inspection (EN):</label>
                        <input 
                          type="text"
                          value={returnsConfig.inspectionDaysEn}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, inspectionDaysEn: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Inspection (AR):</label>
                        <input 
                          type="text"
                          value={returnsConfig.inspectionDaysAr}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, inspectionDaysAr: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Bank Processing (EN):</label>
                        <input 
                          type="text"
                          value={returnsConfig.refundProcessingDaysEn}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, refundProcessingDaysEn: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Bank Processing (AR):</label>
                        <input 
                          type="text"
                          value={returnsConfig.refundProcessingDaysAr}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, refundProcessingDaysAr: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> Patron Support Channels
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">WhatsApp:</label>
                        <input 
                          type="text"
                          value={returnsConfig.supportWhatsApp}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, supportWhatsApp: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2 text-[11px] text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Email:</label>
                        <input 
                          type="text"
                          value={returnsConfig.supportEmail}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, supportEmail: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2 text-[11px] text-white focus:outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-widest block">Toll-Free Phone:</label>
                        <input 
                          type="text"
                          value={returnsConfig.supportPhone}
                          onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, supportPhone: e.target.value })}
                          className="w-full bg-black border border-white/10 rounded-xs p-2 text-[11px] text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right panel: Exclusions & Exchange lists */}
                <div className="space-y-4">
                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-white font-mono uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>Non-Returnable Categories (English)</span>
                      <span className="text-zinc-500 text-[8px]">One item per line</span>
                    </h4>
                    <textarea
                      rows={4}
                      value={returnsConfig.nonReturnableEn.join('\n')}
                      onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, nonReturnableEn: e.target.value.split('\n') })}
                      className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none font-sans"
                    />
                  </div>

                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-white font-mono uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>Non-Returnable Categories (Arabic)</span>
                      <span className="text-zinc-500 text-[8px]">واحد لكل سطر</span>
                    </h4>
                    <textarea
                      rows={4}
                      value={returnsConfig.nonReturnableAr.join('\n')}
                      onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, nonReturnableAr: e.target.value.split('\n') })}
                      className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none font-sans text-right"
                      dir="rtl"
                    />
                  </div>

                  <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3">
                    <h4 className="text-[10px] text-white font-mono uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>Exchange Policy Options (English / Arabic)</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <textarea
                        rows={2}
                        value={returnsConfig.exchangeOptionsEn.join('\n')}
                        onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, exchangeOptionsEn: e.target.value.split('\n') })}
                        className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none font-sans"
                        placeholder="EN options"
                      />
                      <textarea
                        rows={2}
                        value={returnsConfig.exchangeOptionsAr.join('\n')}
                        onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, exchangeOptionsAr: e.target.value.split('\n') })}
                        className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none font-sans text-right"
                        dir="rtl"
                        placeholder="AR options"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    saveReturnsConfig(returnsConfig);
                    alert("Sovereign Return & Refund Policy configurations saved successfully! Sync is active and live.");
                  }}
                  className="px-8 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
                >
                  Save Return Configurations
                </button>
              </div>
            </div>

            {/* ⚙️ VIII. Supabase Sovereign Cloud Database Integration Hub */}
            <div className="bg-[#060606] border border-[#D4AF37]/20 rounded-sm p-6 space-y-6 text-left mt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
                <div>
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4.5 h-4.5 text-[#D4AF37]" /> VIII. Supabase Sovereign Cloud Database Integration Hub
                  </h3>
                  <span className="text-[10px] text-zinc-500">Coordinate and verify live connection to your Supabase PostgreSQL cluster</span>
                </div>
                <button
                  type="button"
                  onClick={fetchSupabaseStatus}
                  disabled={fetchingStatus}
                  className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-white/10 hover:border-[#D4AF37]/40 text-[9px] text-zinc-300 hover:text-white uppercase tracking-wider font-mono cursor-pointer rounded-xs transition-all animate-none"
                >
                  <RefreshCw className={`w-3 h-3 ${fetchingStatus ? 'animate-spin' : ''}`} />
                  {fetchingStatus ? 'Refreshing...' : 'Refresh Status'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuration Card */}
                <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3 text-xs">
                  <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" /> API Credential Status
                  </h4>
                  {supabaseStatus?.configured ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Supabase Credentials Configured</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                        The AL ZOAL enterprise server has successfully bound the Supabase SDK client in passive standby mode.
                      </p>
                      <div className="bg-black/50 p-2.5 rounded-xs border border-white/5 font-mono text-[9px] text-zinc-500 break-all select-all">
                        URL: https://****.supabase.co
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Passive JSON Standby Active</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                        To enable enterprise-scale PostgreSQL persistence, please set <code className="text-gold-pure bg-white/5 px-1 rounded-xs font-mono">SUPABASE_URL</code> and <code className="text-gold-pure bg-white/5 px-1 rounded-xs font-mono">SUPABASE_ANON_KEY</code> in your Environment Settings. The system will seamlessly switch to Supabase.
                      </p>
                    </div>
                  )}
                </div>

                {/* Connection Status Card */}
                <div className="p-4 border border-white/5 bg-zinc-950/20 rounded-xs space-y-3 text-xs">
                  <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Live Database Sync State
                  </h4>
                  {supabaseStatus?.connected ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Connected to Supabase PostgreSQL</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] font-sans">
                        Connection test successful. The following entity counts are live on Supabase:
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-left font-mono text-[10px]">
                        <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                          <span className="text-zinc-500 block text-[8px] uppercase">Patrons</span>
                          <span className="text-white font-bold">{supabaseStatus.tableCounts?.users ?? 0} Users</span>
                        </div>
                        <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                          <span className="text-zinc-500 block text-[8px] uppercase">Active Sessions</span>
                          <span className="text-white font-bold">{supabaseStatus.tableCounts?.sessions ?? 0} Sessions</span>
                        </div>
                        <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                          <span className="text-zinc-500 block text-[8px] uppercase">Audit Ledger</span>
                          <span className="text-white font-bold">{supabaseStatus.tableCounts?.activity_logs ?? 0} Logs</span>
                        </div>
                        <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                          <span className="text-zinc-500 block text-[8px] uppercase">Email Records</span>
                          <span className="text-white font-bold">{supabaseStatus.tableCounts?.email_logs ?? 0} Logs</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">STANDBY MODE (USING LOCAL STORAGE)</span>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                        {supabaseStatus?.errorMessage || 'Local server-side JSON storage is acting as the primary transaction ledger. Setup credentials to activate live Supabase streaming.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* SQL Schema helper block */}
              {supabaseStatus?.configured && !supabaseStatus?.connected && (
                <div className="p-4 border border-[#D4AF37]/15 bg-[#D4AF37]/5 rounded-xs space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[#D4AF37] font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Initialize Supabase Database Schema
                    </h5>
                    <button
                      type="button"
                      onClick={handleCopySchema}
                      className="px-2.5 py-1 bg-zinc-900 border border-white/10 hover:border-[#D4AF37]/35 text-zinc-300 hover:text-white rounded-xs font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedSchema ? 'Copied Script!' : 'Copy SQL Script'}
                    </button>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                    To setup the tables, open your <strong className="text-white">Supabase Dashboard</strong>, navigate to the <strong className="text-white">SQL Editor</strong>, paste the script below, and click <strong className="text-white">Run</strong>:
                  </p>
                  <pre className="w-full max-h-[160px] overflow-y-auto bg-black border border-white/5 text-[9.5px] font-mono text-zinc-400 p-3 rounded-xs select-all text-left">
                    {supabaseStatus.sqlSchema || '-- SQL Schema Script'}
                  </pre>
                </div>
              )}

              {/* Data Sync Section */}
              {supabaseStatus?.configured && (
                <div className="p-4 border border-[#D4AF37]/10 bg-zinc-950/40 rounded-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-[10px] text-white font-mono uppercase tracking-wider">
                        Dynamic Data Migration & Master Synchronization
                      </h4>
                      <p className="text-zinc-400 text-[11.5px] leading-relaxed font-sans">
                        Push all existing local JSON transaction records (including registered users, customer sessions, audit ledgers, and email histories) directly to your Supabase production tables in one secure operation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncData}
                      disabled={syncingData}
                      className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black font-bold text-[10px] uppercase tracking-wider rounded-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {syncingData ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Syncing Database...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          Sync Local to Supabase
                        </>
                      )}
                    </button>
                  </div>

                  {syncResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-xs text-xs text-emerald-400 space-y-2 text-left"
                    >
                      <p className="font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Synchronization Completed Successfully!
                      </p>
                      <p className="text-[11px] text-zinc-400 font-sans">
                        The AL ZOAL master ledger is now perfectly synchronized. The following entities have been migrated:
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono text-zinc-300">
                        <div className="bg-black/30 p-2 rounded-xs border border-white/5">
                          <span className="block text-[8px] text-zinc-500">Users</span>
                          <span className="font-bold text-emerald-400">{syncResult.syncedCounts?.users ?? 0}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xs border border-white/5">
                          <span className="block text-[8px] text-zinc-500">Sessions</span>
                          <span className="font-bold text-emerald-400">{syncResult.syncedCounts?.sessions ?? 0}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xs border border-white/5">
                          <span className="block text-[8px] text-zinc-500">Logs</span>
                          <span className="font-bold text-emerald-400">{syncResult.syncedCounts?.activity_logs ?? 0}</span>
                        </div>
                        <div className="bg-black/30 p-2 rounded-xs border border-white/5">
                          <span className="block text-[8px] text-zinc-500">Emails</span>
                          <span className="font-bold text-emerald-400">{syncResult.syncedCounts?.email_logs ?? 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {syncError && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-950/20 border border-rose-500/10 rounded-xs text-xs text-rose-400 text-left"
                    >
                      <p className="font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Synchronization Error
                      </p>
                      <p className="text-[11px] text-zinc-400 font-sans">{syncError}</p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}

        {/* III. EXECUTIVE OWNER DASHBOARD */}
        {activeDashboardTab === 'owner' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Owner quick performance overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-sm text-left relative overflow-hidden">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Gross Net Sales (SAR)</span>
                <span className="text-3xl font-mono text-gold-pure font-bold block">{formatCurrency(groupMetrics.totalSales)} SAR</span>
                <span className="text-[9px] text-[#D4AF37] flex items-center gap-1 mt-1 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% versus previous month
                </span>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-sm text-left relative overflow-hidden">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Sales Volume</span>
                <span className="text-3xl font-mono text-white font-bold block">{groupMetrics.orderCount} Orders</span>
                <span className="text-[9px] text-zinc-500 block mt-1">100% real electronic orders completed</span>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-sm text-left relative overflow-hidden">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Distinguished Clients</span>
                <span className="text-3xl font-mono text-white font-bold block">{groupMetrics.clientCount} Registered Patrons</span>
                <span className="text-[9px] text-zinc-500 block mt-1">1.8 order frequency per client matrix</span>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-sm text-left relative overflow-hidden">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Average Check Yield</span>
                <span className="text-3xl font-mono text-gold-pure font-bold block">{formatCurrency(groupMetrics.averageOrderValue)} SAR</span>
                <span className="text-[9px] text-zinc-500 block mt-1">Reflecting premium pricing standards</span>
              </div>

            </div>

            {/* Interactive Charts Platform */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Sales Growth line area (columns 1 to 8) */}
              <div className="lg:col-span-8 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-gold-pure" /> Net Revenues Trend Analysis
                  </h3>
                  <div className="flex bg-black p-0.5 border border-white/5 rounded-xs">
                    <span className="text-[8px] uppercase tracking-widest px-2 py-1 text-gold-pure font-mono">Dammam + Al Hofuf</span>
                  </div>
                </div>

                <div className="h-[280px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#333" tick={{ fill: '#777', fontSize: 10 }} />
                      <YAxis stroke="#333" tick={{ fill: '#777', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#222' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Gross Yield (SAR)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Ratios distribution: Business Category (columns 9 to 12) */}
              <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-4">
                <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">Pillar Allocation Yield</h3>
                
                <div className="h-[180px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pillarAllocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pillarAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#222' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="absolute text-[10px] uppercase font-display tracking-widest text-[#D4AF37] font-bold">5 Pillars</p>
                </div>

                {/* Pie chart legends list */}
                <div className="space-y-2 text-[10px]">
                  {pillarAllocationData.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                        <span className="text-zinc-400 font-sans">{entry.name}</span>
                      </div>
                      <span className="text-white font-mono font-bold">{entry.value}% share</span>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* Multi-Branch Sales and Operational overview */}
            <div className="bg-[#060606] border border-white/5 p-6 rounded-sm space-y-4">
              <h3 className="text-white text-xs font-display uppercase tracking-widest border-b border-white/5 pb-3">SOCIETY GEOGRAPHICAL REGISTER</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="p-5 border border-white/10 bg-zinc-950 rounded-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-display text-[11px] uppercase tracking-wider">Dammam Flagship Hub</h4>
                    <span className="text-emerald-500 text-[10px] font-bold">Online</span>
                  </div>
                  <div className="grid grid-cols-3 text-xs divide-x divide-white/5">
                    <div className="pr-2">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Revenues</span>
                      <span className="font-mono text-zinc-200 font-semibold">{formatCurrency(189500)} SAR</span>
                    </div>
                    <div className="px-3">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Patrons</span>
                      <span className="font-mono text-zinc-200 font-semibold">312 accounts</span>
                    </div>
                    <div className="pl-3">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Score Ratios</span>
                      <span className="font-mono text-zinc-200 font-semibold">★★★★★ (4.9)</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-white/10 bg-zinc-950 rounded-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-display text-[11px] uppercase tracking-wider">Al Hofuf Flagship Lounge</h4>
                    <span className="text-emerald-500 text-[10px] font-bold">Online</span>
                  </div>
                  <div className="grid grid-cols-3 text-xs divide-x divide-white/5">
                    <div className="pr-2">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Revenues</span>
                      <span className="font-mono text-zinc-200 font-semibold">{formatCurrency(120500)} SAR</span>
                    </div>
                    <div className="px-3">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Patrons</span>
                      <span className="font-mono text-zinc-200 font-semibold">118 accounts</span>
                    </div>
                    <div className="pl-3">
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Score Ratios</span>
                      <span className="font-mono text-zinc-200 font-semibold">★★★★★ (4.8)</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Order Tracking Timeline Modal */}
      <AnimatePresence>
        {selectedDetailedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailedOrder(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl bg-[#090909] border border-white/10 rounded-sm shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_20px_rgba(212,175,55,0.08)] z-10 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 bg-zinc-950 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase font-display font-bold">VIP COURIER DISPATCH</span>
                    <span className="px-1.5 py-0.5 border border-[#D4AF37]/45 text-[#D4AF37] font-mono text-[7.5px] tracking-widest uppercase rounded-sm animate-pulse">Live Tracking</span>
                  </div>
                  <h3 className="text-lg font-bold font-sans tracking-wide text-white uppercase mt-1 flex items-center gap-1.5">
                    Order <span className="text-white hover:text-[#D4AF37] transition-all font-mono font-extrabold">{selectedDetailedOrder.id}</span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedDetailedOrder(null)}
                  className="p-1.5 px-3 border border-white/10 hover:border-[#D4AF37] text-zinc-400 hover:text-white rounded-sm duration-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span className="text-[10px] font-mono tracking-widest uppercase">Dismiss</span>
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                
                {/* Visual Status Banner */}
                <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest mb-1">Status Axis</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] uppercase tracking-widest font-bold ${
                      selectedDetailedOrder.status === 'Completed' ? 'bg-emerald-900/30 text-emerald-400' :
                      selectedDetailedOrder.status === 'Shipped' ? 'bg-blue-900/30 text-blue-400' :
                      selectedDetailedOrder.status === 'Cancelled' ? 'bg-rose-900/40 text-rose-400' :
                      'bg-amber-900/30 text-amber-400 animate-pulse'
                    }`}>
                      {selectedDetailedOrder.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest mb-1">Tracking Code</span>
                    <span className="text-zinc-300 font-mono font-semibold text-[11px] block">{selectedDetailedOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest mb-1">Payment Method</span>
                    <span className="text-zinc-300 font-sans block">{selectedDetailedOrder.paymentMethod}</span>
                  </div>
                </div>

                {/* Visual Step-by-Step Progress Bar */}
                <div className="p-5 bg-zinc-950/20 border border-white/5 rounded-xs space-y-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="uppercase tracking-[0.25em] text-zinc-400 font-display font-medium">Sovereign Dispatch Stage</span>
                    <span className="font-mono text-[#D4AF37] tracking-wider uppercase font-bold">
                      {selectedDetailedOrder.status === 'Cancelled' ? 'Disrupted' : `${selectedDetailedOrder.status} Status`}
                    </span>
                  </div>

                  {selectedDetailedOrder.status === 'Cancelled' ? (
                    <div className="p-3.5 bg-rose-950/20 border border-rose-500/10 text-rose-400 rounded-sm text-[10px] tracking-wide flex items-center gap-2.5">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping flex-shrink-0" />
                      <span className="leading-relaxed">This bespoke order was cancelled. Authorized billing amount of {formatCurrency(selectedDetailedOrder.total)} SAR has been reversed safely.</span>
                    </div>
                  ) : (
                    <div className="relative pt-4 pb-6 px-1">
                      {/* Background Line Track */}
                      <div className="absolute top-[28px] left-6 right-6 h-[2px] bg-zinc-950 z-0">
                        <div 
                          className="h-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-[1000ms] ease-out"
                          style={{
                            width: 
                              selectedDetailedOrder.status === 'Pending' ? '0%' :
                              selectedDetailedOrder.status === 'Preparing' ? '33.33%' :
                              selectedDetailedOrder.status === 'Shipped' ? '66.66%' :
                              selectedDetailedOrder.status === 'Completed' ? '100%' : '0%'
                          }}
                        />
                      </div>

                      {/* Steps Indicator circles */}
                      <div className="relative z-10 flex justify-between items-center text-center">
                        {[
                          { label: 'Confirmed', key: 'Pending', stepNum: 1 },
                          { label: 'Preparing', key: 'Preparing', stepNum: 2 },
                          { label: 'Out for Delivery', key: 'Shipped', stepNum: 3 },
                          { label: 'Delivered', key: 'Completed', stepNum: 4 }
                        ].map((step, idx) => {
                          const statusOrder = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                          const currentIdx = statusOrder.indexOf(selectedDetailedOrder.status);
                          const stepIdx = statusOrder.indexOf(step.key);
                          
                          const isDone = stepIdx < currentIdx;
                          const isCurrent = stepIdx === currentIdx;
                          const isUpcoming = stepIdx > currentIdx;

                          return (
                            <div key={idx} className="flex flex-col items-center flex-1 text-center relative">
                              {/* Circle node */}
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono border transition-all duration-500 ${
                                  isCurrent 
                                    ? 'bg-black border-[#D4AF37] text-[#D4AF37] font-bold shadow-[0_0_12px_rgba(212,175,55,0.6)] scale-110 z-10' 
                                    : isDone 
                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-semibold' 
                                    : 'bg-[#060606] border-zinc-900 text-zinc-500'
                                }`}
                              >
                                {isDone ? '✓' : step.stepNum}
                              </div>

                              {/* Label */}
                              <span 
                                className={`text-[9px] sm:text-[10px] tracking-wider uppercase font-display font-medium mt-3 block transition-colors duration-300 ${
                                  isCurrent ? 'text-[#D4AF37]' : isDone ? 'text-zinc-200' : 'text-zinc-500'
                                }`}
                              >
                                {step.label}
                              </span>

                              {isCurrent && (
                                <span className="text-[7px] font-mono tracking-[0.2em] text-[#D4AF37] uppercase absolute top-14 animate-pulse hidden sm:block whitespace-nowrap">
                                  In Progress
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* GPS Coordinates & Google Maps Link Section */}
                <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-xs space-y-2.5 text-xs text-left">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-bold text-[#D4AF37]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Customer Pin Delivery Location</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300 font-sans mt-1">
                    <div>
                      <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-widest leading-none mb-1">Selected Location Area</span>
                      <span className="text-white block font-medium">
                        {(selectedDetailedOrder as any).region || (selectedDetailedOrder.address ? selectedDetailedOrder.address.split(',')[selectedDetailedOrder.address.split(',').length - 2]?.trim() : 'Dammam')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-mono text-[9px] block uppercase tracking-widest leading-none mb-1">Coordinates Index</span>
                      <span className="text-white block font-mono text-[11px]">
                        {(selectedDetailedOrder as any).latitude ? `${(selectedDetailedOrder as any).latitude.toFixed(5)}, ${(selectedDetailedOrder as any).longitude?.toFixed(5)}` : '26.43120, 50.11080 (Default)'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Map Link Button */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] gap-2">
                    <span className="text-zinc-500 font-sans">Google Maps Route:</span>
                    <a 
                      href={(selectedDetailedOrder as any).mapLocationLink || `https://www.google.com/maps/search/?api=1&query=${(selectedDetailedOrder as any).latitude || 26.4312},${(selectedDetailedOrder as any).longitude || 50.1108}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:text-white transition-colors duration-205 font-bold underline flex items-center gap-1 font-mono shrink-0"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> View on Google Maps
                    </a>
                  </div>
                </div>

                {/* Simulated Real-Time Location Map */}
                <SimulatedLogisticsMap 
                  status={selectedDetailedOrder.status} 
                  trackingNumber={selectedDetailedOrder.trackingNumber} 
                />

                {/* Items Summary list */}
                <div className="space-y-2 pb-2">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] tracking-widest uppercase font-mono">
                    <ClipboardList className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Selected Creations ({selectedDetailedOrder.items.reduce((acc, it) => acc + it.quantity, 0)})</span>
                  </div>
                  <div className="bg-zinc-950/20 border border-white/5 p-3.5 rounded-xs space-y-2">
                    {selectedDetailedOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-white font-medium">{it.name} <strong className="text-zinc-500 font-mono">×{it.quantity}</strong></span>
                          {it.selectedOption && (
                            <span className="text-zinc-500 text-[9px] font-mono tracking-wide">{it.selectedOption}</span>
                          )}
                        </div>
                        <span className="text-zinc-400 font-mono">{formatCurrency(it.price * it.quantity)} SAR</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs font-semibold">
                      <span className="text-zinc-400 font-sans">Sovereign Net Value</span>
                      <span className="text-[#D4AF37] font-mono">{formatCurrency(selectedDetailedOrder.total)} SAR</span>
                    </div>
                  </div>
                </div>

                {/* Granular Milestone Timeline */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] tracking-widest uppercase font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Granular Journey Log</span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-650">KSA Standard Time (GMT+3)</span>
                  </div>

                  {/* Vertical Timeline Track */}
                  <div className="relative pl-6 sm:pl-32 space-y-8 before:absolute before:inset-y-1.5 before:left-[11px] sm:before:left-[115px] before:w-[1.5px] before:bg-white/10 overflow-hidden">
                    {(() => {
                      const baseDate = selectedDetailedOrder.date;
                      const dateObj = new Date(baseDate);
                      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                      const formattedDate = dateObj.toLocaleDateString('en-US', options);

                      const milestones = selectedDetailedOrder.status === 'Cancelled' ? [
                        {
                          title: 'Order Confirmed',
                          desc: 'Sovereign client request recorded by Zoal Lounge core processors.',
                          time: '10:15 AM',
                          date: formattedDate,
                          status: 'completed'
                        },
                        {
                          title: 'Secure Payment Cleared',
                          desc: `Requisite billing authorized instantly via ${selectedDetailedOrder.paymentMethod}.`,
                          time: '10:18 AM',
                          date: formattedDate,
                          status: 'completed'
                        },
                        {
                          title: 'Acquisition Revoked',
                          desc: 'Client-driven cancellation completed. Transactions reversed and boutique reservations safely updated.',
                          time: '11:10 AM',
                          date: formattedDate,
                          status: 'error'
                        }
                      ] : [
                        {
                          title: 'Order Confirmed',
                          desc: 'Sovereign client account confirmed. Prepared list queued at the central botanical roasting deck.',
                          time: '10:15 AM',
                          date: formattedDate,
                          status: 'completed'
                        },
                        {
                          title: 'Boutique Preparation',
                          desc: 'Creations meticulously inspected, sealed within climate insulation, and detailed with hand-written registry plates.',
                          time: '11:45 AM',
                          date: formattedDate,
                          status: ['Preparing', 'Shipped', 'Completed'].includes(selectedDetailedOrder.status) ? 'completed' : 
                                  selectedDetailedOrder.status === 'Pending' ? 'active' : 'pending'
                        },
                        {
                          title: 'En Route for Delivery',
                          desc: `Secured inside premium chilled compartment, registered on route barcode ${selectedDetailedOrder.trackingNumber}.`,
                          time: '02:30 PM',
                          date: formattedDate,
                          status: ['Shipped', 'Completed'].includes(selectedDetailedOrder.status) ? 'completed' : 
                                  selectedDetailedOrder.status === 'Preparing' ? 'active' : 'pending'
                        },
                        {
                          title: 'Delivered',
                          desc: 'Secure handoff finalised successfully. Signature verified on private client log.',
                          time: '04:15 PM',
                          date: formattedDate,
                          status: selectedDetailedOrder.status === 'Completed' ? 'completed' : 
                                  selectedDetailedOrder.status === 'Shipped' ? 'active' : 'pending'
                        }
                      ];

                      return milestones.map((milestone, mIdx) => {
                        const isCompletedStage = milestone.status === 'completed';
                        const isActiveStage = milestone.status === 'active';
                        const isErrorStage = milestone.status === 'error';

                        return (
                          <div key={mIdx} className="relative group transition-all duration-300">
                            
                            {/* Left Panel: Desktop Timestamp */}
                            <div className="absolute left-[-115px] top-0.5 hidden sm:flex flex-col items-end text-right w-24">
                              <span className="text-[#D4AF37] font-mono text-[10px] font-bold tracking-wide">
                                {milestone.time}
                              </span>
                              <span className="text-zinc-500 font-mono text-[8px] tracking-widest uppercase mt-0.5">
                                {milestone.date}
                              </span>
                            </div>

                            {/* Bullet Dot indicator */}
                            <div className="absolute left-[-20px] sm:left-[-17px] top-1 z-10 flex items-center justify-center">
                              {isCompletedStage ? (
                                <div className="w-5 h-5 rounded-full bg-[#D4AF37] border border-[#D4AF37] flex items-center justify-center text-black shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : isActiveStage ? (
                                <div className="w-5 h-5 rounded-full bg-black border-2 border-[#D4AF37] flex items-center justify-center text-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.6)] animate-pulse">
                                  <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                                </div>
                              ) : isErrorStage ? (
                                <div className="w-5 h-5 rounded-full bg-rose-650 border border-rose-600 flex items-center justify-center text-white">
                                  <span className="font-bold text-[10px]">!</span>
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-neutral-950 border border-zinc-900 flex items-center justify-center text-zinc-500 font-mono text-[8.5px]">
                                  {mIdx + 1}
                                </div>
                              )}
                            </div>

                            {/* Milestone content */}
                            <div className="text-left bg-zinc-950/30 hover:bg-zinc-950/50 border border-white/[0.03] hover:border-white/10 p-4 rounded-xs transition-colors duration-300">
                              {/* Mobile ONLY visible Timestamp */}
                              <div className="flex sm:hidden items-center justify-between mb-1.5 font-mono text-[9px]">
                                <span className="text-[#D4AF37] font-bold">{milestone.time}</span>
                                <span className="text-zinc-500 uppercase">{milestone.date}</span>
                              </div>

                              <h4 className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${
                                isActiveStage ? 'text-[#D4AF37]' : isCompletedStage ? 'text-zinc-200' : 'text-zinc-500'
                              }`}>
                                {milestone.title}
                              </h4>
                              <p className="text-zinc-400 text-[10px] sm:text-[10.5px] font-sans mt-1 leading-relaxed text-justify">
                                {milestone.desc}
                              </p>
                            </div>

                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Footnote addressing Regional climate standards */}
                <div className="p-4 border border-white/5 bg-black/60 text-[9px] text-zinc-500 font-sans text-justify space-y-1.5 rounded-xs">
                  <div className="text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Sovereign Logistics Clause
                  </div>
                  <p className="leading-relaxed">
                    All delicate viennoiseries and specialty Geisha cold-brews are distributed under strict climate-controlled environments matching 18°C temperature baselines across Abu Bakr As Siddiq Rd (Al Hofuf) and Prince Mohammad Bin Fahd Rd (Dammam). Real-time dispatch is backed by ZOAL Priority Services.
                  </p>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
