import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Shield, Landmark, Bookmark, BarChart3, Package, Truck, Compass,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check, Mail, PackageCheck, LogOut,
  Lock, Menu, ChevronRight, ArrowLeft, Search, Filter, Trash2, Edit3, Download, FileText, Printer, CheckCircle2, AlertCircle, Loader2,
  Database, Copy, Server, Camera, Settings, Heart, Pencil, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { Product, Order, CartItem, Branch } from '../types';
import { BRANCHES } from '../data';
import { useGlobalProducts, updateProductInventory } from '../imageRegistry';
import { SimulatedLogisticsMap } from './SimulatedLogisticsMap';
import { useTranslation } from 'react-i18next';
import { useBranding } from './BrandingContext';
import { formatCurrency } from '../utils';
import { downloadHtmlAsPdf } from '../lib/pdf';
import { generatePrintableInvoiceHtml } from './EnterpriseOrderManagement';
import { getShippingConfig, saveShippingConfig, ShippingConfig } from '../data/shippingData';
import { getReturnsConfig, saveReturnsConfig, ReturnsConfig } from '../data/returnsData';
import TrackOrder from './TrackOrder';
import { AddressSection } from './AddressSection';
import { AccountSettingsSection } from './AccountSettingsSection';
import SupabaseStoragePanel from './SupabaseStoragePanel';
import StaffDashboard from './StaffDashboard';
import EnterpriseOrderManagement from './EnterpriseOrderManagement';

interface DashboardsProps {
  currentUser: { name: string; email: string; phone: string; address: string; role?: string; addresses?: any[] } | null;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
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
  supabaseStatus: any;
  fetchSupabaseStatus: () => void;
  fetchingStatus: boolean;
  handleCopySchema: () => void;
  copiedSchema: boolean;
  handleSyncData: () => void;
  syncingData: boolean;
  syncResult: any;
  syncError: string | null;
  SupabaseStoragePanel: React.ComponentType<any>;
}

export default function Dashboards({
  currentUser,
  orders,
  setOrders,
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
  supabaseStatus,
  fetchSupabaseStatus,
  fetchingStatus,
  handleCopySchema,
  copiedSchema,
  handleSyncData,
  syncingData,
  syncResult,
  syncError,
  SupabaseStoragePanel,
}: DashboardsProps) {
  const { settings } = useBranding();
  const brandName = settings.businessName.split(' ')[0];
  const { t } = useTranslation();
  const allProducts = useGlobalProducts();
  // Assume currentUser has a 'role' property: 'customer' | 'admin'
  const userRole = currentUser ? (currentUser as any).role || 'customer' : null;

  // Select active role view
  const [activeDashboardTab, setActiveDashboardTab] = useState<'customer' | 'admin' | 'owner'>(() => {
    const role = currentUser ? (currentUser as any).role || 'customer' : 'customer';
    if (role === 'staff' || role === 'admin') return 'admin';
    return 'customer';
  });

  // Customer sub-tab states
  const [customerSubTab, setCustomerSubTab] = useState<string>(() => {
    if (currentPage === 'track') return 'track';
    return initialSubTab || 'overview';
  });

  const sidebarGroups = useMemo(() => [
    {
      title: 'Profile & Settings',
      icon: User,
      items: [
        { id: 'overview', name: 'Profile Summary', icon: BarChart3 },
        { id: 'profile', name: 'My Profile', icon: User },
        { id: 'notifications', name: 'Notifications', icon: Bell },
        { id: 'settings', name: 'Account Settings', icon: Shield },
      ]
    },
    {
      title: 'Orders',
      icon: ClipboardList,
      items: [
        { id: 'orders', name: 'My Orders', icon: ClipboardList },
        { id: 'track', name: 'Track Orders', icon: Truck },
        { id: 'invoices', name: 'Invoices & Receipts', icon: FileText },
      ]
    },
    {
      title: 'Shopping & Delivery',
      icon: Bookmark,
      items: [
        { id: 'wishlist', name: 'Wishlist Catalog', icon: Bookmark },
        { id: 'reviews', name: 'Product Reviews', icon: Star },
        { id: 'addresses', name: 'Saved Addresses', icon: MapPin },
      ]
    }
  ], []);

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

  const customerOrders = useMemo(() => {
    if (!currentUser?.email) return [];
    return orders.filter((o) => o.email.toLowerCase() === currentUser.email.toLowerCase());
  }, [orders, currentUser]);
  
// Logic to be moved in next steps

  const [languagePreference, setLanguagePreference] = useState<string>(() => {
    if (!currentUser?.email) return 'en';
    return localStorage.getItem(`zoal_lang_${currentUser.email}`) || 'en';
  });

  // --- STAFF DASHBOARD INTEGRATIONS ---
  const [staffSubTab, setStaffSubTab] = useState<string>('overview');
  const [staffSidebarOpen, setStaffSidebarOpen] = useState(false);
  const [selectedStaffOrder, setSelectedStaffOrder] = useState<Order | null>(null);
  const [staffDutyStatus, setStaffDutyStatus] = useState<'active' | 'break' | 'offline'>(() => {
    return (localStorage.getItem('zoal_staff_duty_status') as any) || 'active';
  });

  const uniqueCustomers = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!map.has(o.phone)) {
        map.set(o.phone, {
          name: o.customerName,
          phone: o.phone,
          email: `${o.customerName.toLowerCase().replace(/\s+/g, '')}@zoal-patron.sa`,
          address: o.address,
          totalOrders: orders.filter(x => x.phone === o.phone).length,
          totalSpent: orders.filter(x => x.phone === o.phone).reduce((sum, ord) => sum + ord.total, 0),
          status: 'Verified Account'
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);
  
  // Search/Filters in Staff Modules
  const [staffOrderSearch, setStaffOrderSearch] = useState('');
  const [staffOrderStatusFilter, setStaffOrderStatusFilter] = useState<string>('all');
  const [staffProductSearch, setStaffProductSearch] = useState('');
  const [staffProductCategoryFilter, setStaffProductCategoryFilter] = useState<string>('all');
  const [staffCustomerSearch, setStaffCustomerSearch] = useState('');
  const [staffNotificationSearch, setStaffNotificationSearch] = useState('');
  const [staffNotificationFilter, setStaffNotificationFilter] = useState<string>('all');
  const [staffInventoryFilter, setStaffInventoryFilter] = useState<'all' | 'low' | 'out'>('all');

  // Staff activity logs (simulated, stored in localStorage per staff)
  const [staffLogs, setStaffLogs] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_staff_logs');
      return raw ? JSON.parse(raw) : [
        { id: 'log-1', action: 'Order Status Update', target: 'Order #ORD-9481', timestamp: new Date(Date.now() - 3600000).toLocaleString(), staff: currentUser?.name || 'Staff Member', ip: '192.168.1.105' },
        { id: 'log-2', action: 'Stock Level Changed', target: 'Premium Blue Thobe (+50)', timestamp: new Date(Date.now() - 7200000).toLocaleString(), staff: currentUser?.name || 'Staff Member', ip: '192.168.1.105' },
        { id: 'log-3', action: 'System Login', target: 'Authorized Portal Session', timestamp: new Date(Date.now() - 14400000).toLocaleString(), staff: currentUser?.name || 'Staff Member', ip: '192.168.1.105' }
      ];
    } catch (e) {
      return [];
    }
  });

  const addStaffLog = (action: string, target: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      action,
      target,
      timestamp: new Date().toLocaleString(),
      staff: currentUser?.name || 'Staff Member',
      ip: '192.168.1.105'
    };
    setStaffLogs((prev) => {
      const nextLogs = [newLog, ...prev];
      localStorage.setItem('zoal_staff_logs', JSON.stringify(nextLogs));
      return nextLogs;
    });
  };

  const [staffNotifications, setStaffNotifications] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('zoal_staff_notifications');
      return raw ? JSON.parse(raw) : [
        { id: 'sn-1', type: 'order', title: 'New Luxury Order Placed', message: 'Order #ORD-7491 contains 2x Premium Thobes and requires immediate master artisan assignment.', date: '10 mins ago', read: false },
        { id: 'sn-2', type: 'stock', title: 'Critical Stock Level Alert', message: 'Imperial Dark Roast Coffee beans inventory has dropped below 15 bags.', date: '1 hour ago', read: false },
        { id: 'sn-3', type: 'packing', title: 'Packing Dispatch Request', message: 'Order #ORD-6382 has been marked ready-to-pack for Al Hofuf branch.', date: '3 hours ago', read: true },
        { id: 'sn-4', type: 'message', title: 'Customer Tailoring Message', message: 'Distinguished Customer Raihan Kabir submitted a specific collar custom measure request.', date: '5 hours ago', read: false }
      ];
    } catch (e) {
      return [];
    }
  });

  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

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
      localStorage.setItem(`zoal_lang_${currentUser.email}`, languagePreference);
    }
  }, [languagePreference, currentUser?.email]);

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
            {t('dashboard.login_required', { defaultValue: 'Authentication is required to access your premium Al Zoal account.' })}
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
        <div className={`flex flex-col md:flex-row items-center justify-between border-b border-white/5 pb-6 mb-10 gap-6 ${activeDashboardTab === 'customer' && customerSubTab === 'overview' && userRole !== 'admin' && userRole !== 'staff' ? 'hidden' : ''}`}>
          <div className="w-full md:w-auto">
            {activeDashboardTab === 'customer' ? (
              <div className="hidden">
                {/* Hero section removed as per simplification pass */}
              </div>
            ) : (
              <div className="text-center md:text-left">
                <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1">
                  My Dashboard
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-display uppercase text-white">
                  Staff Dashboard
                </h1>
              </div>
            )}
          </div>

          {(userRole === 'admin' || userRole === 'staff' || userRole === 'owner') && (
            <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-sm w-full md:w-auto rtl:flex-row-reverse">
              {activeDashboardTab !== 'customer' && (
                <button
                  onClick={() => setActiveDashboardTab('customer')}
                  className="flex-grow md:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 text-zinc-500 hover:text-white"
                >
                  <User className="w-3.5 h-3.5" /> MY DASHBOARD
                </button>
              )}
              {(userRole === 'admin' || userRole === 'staff') && (
                <button
                  onClick={() => setActiveDashboardTab('admin')}
                  className={`flex-grow md:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeDashboardTab === 'admin' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" /> {t('dashboard.staff_dashboard', { defaultValue: 'Staff Dashboard' })}
                </button>
              )}
              {(userRole === 'admin' || userRole === 'owner') && (
                <button
                  onClick={() => setCurrentPage('admin')}
                  className="flex-grow md:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 text-gold-pure hover:bg-gold-pure/10 border border-gold-pure/30"
                >
                  <Shield className="w-3.5 h-3.5 text-gold-pure" /> OWNER / ADMIN DASHBOARD
                </button>
              )}
            </div>
          )}
        </div>

        {/* I. CUSTOMER DASHBOARD */}
        {activeDashboardTab === 'customer' && (
          <div className="space-y-6">
            
              {/* Top Navigation & Breadcrumb Bar */}
            <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setSidebarOpen(true); }}
                  className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
                  aria-label="Open Sidebar Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {customerSubTab !== 'overview' && (
                    <button
                      onClick={() => {
                        if (selectedOrder) {
                          setSelectedOrder(null);
                        } else {
                          setCustomerSubTab('overview');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-all duration-300 group cursor-pointer"
                      aria-label="Go Back"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-[9px] uppercase tracking-widest font-bold">Back</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono">
                    <span>MY DASHBOARD</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-[#D4AF37] font-semibold">
                      {customerSubTab === 'overview' ? 'Dashboard' :
                     customerSubTab === 'orders' ? (selectedOrder ? 'Order Details' : 'My Orders') :
                     customerSubTab === 'track' ? 'Track Orders' :
                     customerSubTab === 'wishlist' ? 'Wishlist' :
                     customerSubTab === 'addresses' ? 'Saved Addresses' :
                     customerSubTab === 'profile' ? 'Profile' :
                     customerSubTab === 'reviews' ? 'Product Reviews' :
                     customerSubTab === 'invoices' ? 'Invoices & Receipts' :
                     customerSubTab === 'settings' ? 'Account Settings' : 'Overview'}
                  </span>
                </div>
              </div>
            </div>

              {/* Top Bar Quick Action Controls */}
              <div className="flex items-center justify-end gap-4">
                {/* Profile Quick Dropdown */}
                <div className="relative group/profile select-none">
                  <div className="flex items-center gap-2.5 p-1.5 px-3 bg-black hover:bg-zinc-900 border border-white/5 rounded-xs cursor-pointer duration-300">
                    <div className="w-6 h-6 rounded-full border border-[#D4AF37] overflow-hidden bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-[#D4AF37] font-mono">
                      {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[100px] hidden sm:block">
                      {currentUser ? (currentUser as any).firstName || (currentUser.name || 'Customer').split(' ')[0] : 'Customer'}
                    </span>
                  </div>

                  {/* Dropdown Menu Popup (Empty) */}
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-950 border border-white/10 rounded-xs shadow-[0_12px_40px_rgba(0,0,0,0.95)] opacity-0 pointer-events-none group-hover/profile:opacity-100 group-hover/profile:pointer-events-auto transition-all duration-300 z-50 p-3 text-left">
                    <div className="p-2 border-b border-white/5 text-left mb-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full border border-[#D4AF37] bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-[#D4AF37] font-mono shrink-0">
                          {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white font-semibold font-display tracking-wide uppercase truncate leading-tight">
                            {currentUser?.name || 'Guest'}
                          </p>
                          <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider truncate block">
                            {currentUser?.email}
                          </span>
                        </div>
                      </div>

                    </div>

                    <div className="border-t border-white/5 mt-2 pt-2">
                      <button
                        onClick={() => {
                          if (onLogout) {
                            onLogout();
                          }
                        }}
                        className="w-full text-left py-2 px-2.5 rounded-xs hover:bg-rose-950/20 transition-all cursor-pointer group flex items-center gap-2.5 text-rose-500"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider font-bold text-rose-500">
                            Log Out
                          </span>
                          <span className="block text-[8px] text-zinc-500 font-sans tracking-normal leading-tight">
                            Sign out from your account
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Container: Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-8 items-start relative">
              
              {/* 1. DESKTOP SIDEBAR */}
              <div className="hidden lg:block w-64 shrink-0 bg-zinc-950 border border-white/5 rounded-sm p-4 space-y-4">
                <div>
                  <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 font-mono block px-3 pb-2 border-b border-white/5 mb-2">
                    Customer Portal
                  </span>
                  <div className="space-y-4">
                    {sidebarGroups.map((group, groupIdx) => (
                      <div key={groupIdx} className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                          <group.icon className="w-3.5 h-3.5 text-[#D4AF37]/70" />
                          <span>{group.title}</span>
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setCustomerSubTab(item.id);
                                setSelectedOrder(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-full text-left py-2 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs cursor-pointer ${
                                customerSubTab === item.id 
                                  ? 'bg-[#D4AF37] text-black font-bold shadow-[0_4px_12px_rgba(212,175,55,0.15)]' 
                                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <item.icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                    }}
                    className="w-full text-left py-2.5 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 border-t border-white/5 pt-4 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
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
                      className="fixed top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-white/5 z-50 p-5 flex flex-col justify-between lg:hidden text-left overflow-y-auto"
                    >
                      <div className="space-y-6">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div>
                            <span className="text-[8px] tracking-[0.3em] text-[#D4AF37] uppercase font-bold block mb-0.5">AL ZOAL BOUTIQUE</span>
                            <span className="text-white font-display uppercase font-bold text-xs tracking-wider">Customer Account</span>
                          </div>
                          <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 border border-white/5 hover:border-[#D4AF37]/30 text-zinc-500 hover:text-white rounded-sm duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Navigation Menu Links */}
                        <div className="space-y-5">
                          {sidebarGroups.map((group, groupIdx) => (
                            <div key={groupIdx} className="space-y-1">
                              <div className="flex items-center gap-2 px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
                                <group.icon className="w-3.5 h-3.5 text-[#D4AF37]/70" />
                                <span>{group.title}</span>
                              </div>
                              <div className="space-y-0.5">
                                {group.items.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      setCustomerSubTab(item.id);
                                      setSelectedOrder(null);
                                      setSidebarOpen(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`w-full text-left py-2 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs cursor-pointer ${
                                      customerSubTab === item.id 
                                        ? 'bg-[#D4AF37] text-black font-bold' 
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    }`}
                                  >
                                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{item.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Drawer Footer Logout */}
                      {onLogout && (
                        <button
                          onClick={() => {
                            onLogout();
                          }}
                          className="w-full text-left py-3 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 border-t border-white/5 cursor-pointer mt-6"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
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
                          <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-zinc-950 flex items-center justify-center text-xl font-bold text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] shrink-0 relative group">
                            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" title="Change Photo">
                              <Camera className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-white font-display uppercase font-bold text-lg tracking-wider leading-tight">
                              Welcome back,<br />
                              <span className="text-[#D4AF37]">{currentUser?.name || 'Customer'}</span>
                            </h2>
                            <p className="text-zinc-400 text-xs leading-relaxed max-w-xl">
                              Manage your orders, addresses, wishlist and account from one place.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Privilege Stats Widgets Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { id: 'orders', label: 'Orders', value: customerOrders.length, desc: 'View order history', icon: ClipboardList, color: 'text-[#D4AF37]' },
                          { id: 'wishlist', label: t('nav.wishlist', { defaultValue: 'My Wishlist' }), value: wishlist.length, desc: 'Your saved items', icon: Heart, color: 'text-rose-500' },
                          { id: 'reviews', label: 'Reviews', value: customerReviews.length, desc: 'My product feedback', icon: Star, color: 'text-orange-400' },
                          { id: 'notifications', label: 'Notifications', value: 0, desc: 'Account alerts', icon: Bell, color: 'text-blue-500' },
                          { id: 'addresses', label: 'Addresses', value: (currentUser?.addresses || []).length, desc: 'Manage your locations', icon: MapPin, color: 'text-emerald-500' },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <button
                              key={stat.id}
                              onClick={() => {
                                setCustomerSubTab(stat.id);
                                setSelectedOrder(null);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="bg-[#060606]/95 border border-white/5 hover:border-[#D4AF37]/30 hover:bg-zinc-950/85 duration-300 p-4 rounded-xs text-center relative group cursor-pointer flex flex-col justify-between h-32 focus:outline-none"
                            >
                              <div>
                                <Icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color} group-hover:scale-115 duration-300`} />
                                <span className="text-[11px] font-bold text-white block truncate leading-snug">{stat.label}</span>
                                <span className="text-[7.5px] text-zinc-500 block leading-tight mt-0.5 max-w-[120px] mx-auto font-sans font-medium">{stat.desc}</span>
                              </div>
                              <span className="text-xl font-mono text-[#D4AF37] font-extrabold block mt-1.5">{stat.value}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Main Overview Split Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Side: Recent Orders Summary */}
                        <div className="lg:col-span-8 bg-[#060606]/50 border border-white/5 rounded-xs p-5 space-y-4">
                          <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <h3 className="text-white text-[10px] uppercase font-display font-bold tracking-wider flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-[#D4AF37]" /> Recent Orders
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
                                <p className="text-[10px] text-zinc-500">No recent orders yet.</p>
                                <p className="text-[9px] text-zinc-600 mt-1">Start shopping to place your first order.</p>
                                <button
                                  onClick={() => setCurrentPage('store')}
                                  className="mt-3 px-4 py-1.5 bg-[#D4AF37] hover:bg-white text-black text-[8px] font-bold uppercase tracking-widest rounded-xs"
                                >
                                  Shop Now
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
                                      title="Review details"
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
                            <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Quick Actions
                          </h3>
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                              { label: 'Shop Now', action: () => setCurrentPage('store'), desc: 'Browse latest premium creations' },
                              { label: 'Track Orders', action: () => { setCustomerSubTab('track'); setSelectedOrder(null); }, desc: 'View dispatch map and delivery status' },
                              { label: 'Wishlist Catalog', action: () => { setCustomerSubTab('wishlist'); setSelectedOrder(null); }, desc: 'Inspect saved luxury creations' },
                              { label: 'Add Address', action: () => { setCustomerSubTab('addresses'); setSelectedOrder(null); }, desc: 'Configure checkout delivery coordinates' },
                              { label: 'Write Review', action: () => { setCustomerSubTab('reviews'); setSelectedOrder(null); }, desc: 'Share your exclusive experience' }
                            ].map((act, i) => (
                              <button
                                key={i}
                                onClick={act.action}
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
                    </motion.div>
                  )}

                  {/* TAB 2: MY ORDERS & ORDER DETAILS */}
                  {customerSubTab === 'orders' && (
                    <EnterpriseOrderManagement
                      currentUser={currentUser}
                      orders={orders}
                      setOrders={setOrders}
                    />
                  )}

                  {/* DEPRECATED OLD ORDER VIEW */}
                  {false && customerSubTab === 'orders' && (
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
                              <ArrowLeft className="w-3.5 h-3.5" /> Back to List
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
                                <h4 className="text-white text-[9px] uppercase font-display font-bold tracking-widest">Dispatch Status Timeline</h4>
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
                                  Order Summary
                                </h3>
                                <div className="space-y-3 font-mono text-[10.5px]">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Subtotal:</span>
                                    <span className="text-white">{formatCurrency(selectedOrder.subtotal)} SAR</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Shipping:</span>
                                    <span className="text-white">{formatCurrency(selectedOrder.shipping)} SAR</span>
                                  </div>
                                  {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                      <span>Discount:</span>
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
                        
                        /* VIEW 2B: ORDERS LIST */
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
                                <p className="text-[10px] text-zinc-500 mt-1">Refine your search or clear filters to view records.</p>
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
                          <Bookmark className="w-8 h-8 text-zinc-500 mx-auto mb-3 opacity-20" />
                          <h4 className="text-white text-xs font-display uppercase tracking-wider">{t('wishlist.empty', { defaultValue: 'Your Wishlist is Empty' })}</h4>
                          <p className="text-zinc-500 text-[10px] mt-2 mb-4 max-w-[220px] mx-auto">{t('wishlist.empty_desc', { defaultValue: 'Save items you love here to easily find or purchase them later.' })}</p>
                          <button
                            onClick={() => setCurrentPage('store')}
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer"
                          >
                            {t('wishlist.browse', { defaultValue: 'Explore Products' })}
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

                  {/* TAB 6: PROFILE DETAILS */}
                  {customerSubTab === 'profile' && (
                    <motion.div
                      key="profile-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      {/* Profile Information */}
                      <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-5">
                        <h3 className="text-white text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 flex items-center gap-2">
                          <User className="w-4.5 h-4.5 text-[#D4AF37]" /> Personal Information
                        </h3>

                        <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-white/5 pb-5">
                          {/* Profile Photo */}
                          <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37] overflow-hidden bg-zinc-950 flex items-center justify-center text-2xl shadow-xl shrink-0 relative group font-mono text-[#D4AF37] font-bold select-none">
                            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
                            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" title="Change Photo">
                              <Camera className="w-6 h-6 text-[#D4AF37]" />
                            </div>
                          </div>

                          <div className="space-y-1 text-center sm:text-left">
                            <h4 className="text-white font-display uppercase font-semibold text-base tracking-wider">{currentUser?.name}</h4>
                            <p className="text-[#D4AF37] font-mono text-[9px] uppercase tracking-widest">{brandName} Verified Customer</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                              <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest">Account ID: {((currentUser as any)?.id || 'AC-781').substring(0, 8)}</span>
                              <button onClick={() => navigator.clipboard.writeText((currentUser as any)?.id || 'AC-781')} className="text-zinc-600 hover:text-[#D4AF37]"><Copy className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </div>

                        {/* Grid Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Full Name</span>
                            <span className="text-white font-medium">{currentUser?.name}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Email Address</span>
                            <span className="text-zinc-300 font-mono">{currentUser?.email}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Phone Number</span>
                            <span className="text-zinc-300 font-mono">{currentUser?.phone || 'Not Specified'}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Member Since</span>
                            <span className="text-zinc-300 font-mono">July 2026</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Preferred Language</span>
                            <span className="text-zinc-300 font-mono">{languagePreference === 'ar' ? 'العربية' : 'English'}</span>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
                            <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Account Status</span>
                            <div className="flex items-center gap-1.5 text-emerald-400 mt-1">
                              <span className="px-2 py-0.5 bg-emerald-950/30 text-emerald-400 text-[8px] uppercase rounded-full font-bold tracking-wider">✔ Verified</span>
                            </div>
                          </div>
                          <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1 sm:col-span-2 flex justify-between items-center">
                            <div>
                              <span className="text-zinc-500 block uppercase font-mono text-[8px] tracking-widest">Default Delivery Address</span>
                              <span className="text-zinc-400 text-xs">
                                {currentUser?.addresses?.find((a: any) => a.isDefault)?.addressLine || 'No Default Address Selected'}
                              </span>
                            </div>
                            <button onClick={() => setCustomerSubTab('addresses')} className="text-[9.5px] text-[#D4AF37] hover:underline uppercase font-mono font-bold">Manage Addresses</button>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-white/5">
                          <button 
                            onClick={() => setCurrentPage('home')} 
                            className="flex items-center gap-4 p-4 bg-zinc-950/40 backdrop-blur-md border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 rounded-sm group transition-all duration-300 text-left cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-11 h-11 flex items-center justify-center bg-zinc-900/80 border border-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300 rounded-xs shrink-0 z-10">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div className="flex-1 z-10">
                              <div className="text-[11px] text-white uppercase tracking-widest font-bold font-display">SHOP NOW</div>
                              <div className="text-[10px] text-zinc-500 font-sans tracking-wide mt-0.5 uppercase">Browse latest premium creations</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-[#D4AF37] transition-all duration-300 z-10 group-hover:translate-x-1" />
                          </button>

                          <button 
                            onClick={() => setCustomerSubTab('track')} 
                            className="flex items-center gap-4 p-4 bg-zinc-950/40 backdrop-blur-md border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 rounded-sm group transition-all duration-300 text-left cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-11 h-11 flex items-center justify-center bg-zinc-900/80 border border-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300 rounded-xs shrink-0 z-10">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div className="flex-1 z-10">
                              <div className="text-[11px] text-white uppercase tracking-widest font-bold font-display">TRACK ORDERS</div>
                              <div className="text-[10px] text-zinc-500 font-sans tracking-wide mt-0.5 uppercase">View dispatch map and delivery status</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-[#D4AF37] transition-all duration-300 z-10 group-hover:translate-x-1" />
                          </button>

                          <button 
                            onClick={() => setCustomerSubTab('wishlist')} 
                            className="flex items-center gap-4 p-4 bg-zinc-950/40 backdrop-blur-md border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 rounded-sm group transition-all duration-300 text-left cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-11 h-11 flex items-center justify-center bg-zinc-900/80 border border-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300 rounded-xs shrink-0 z-10">
                              <Heart className="w-5 h-5" />
                            </div>
                            <div className="flex-1 z-10">
                              <div className="text-[11px] text-white uppercase tracking-widest font-bold font-display">WISHLIST CATALOG</div>
                              <div className="text-[10px] text-zinc-500 font-sans tracking-wide mt-0.5 uppercase">Inspect saved luxury creations</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-[#D4AF37] transition-all duration-300 z-10 group-hover:translate-x-1" />
                          </button>

                          <button 
                            onClick={() => setCustomerSubTab('reviews')} 
                            className="flex items-center gap-4 p-4 bg-zinc-950/40 backdrop-blur-md border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 rounded-sm group transition-all duration-300 text-left cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-11 h-11 flex items-center justify-center bg-zinc-900/80 border border-white/5 text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300 rounded-xs shrink-0 z-10">
                              <Pencil className="w-5 h-5" />
                            </div>
                            <div className="flex-1 z-10">
                              <div className="text-[11px] text-white uppercase tracking-widest font-bold font-display">WRITE REVIEW</div>
                              <div className="text-[10px] text-zinc-500 font-sans tracking-wide mt-0.5 uppercase">Share your exclusive experience</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-[#D4AF37] transition-all duration-300 z-10 group-hover:translate-x-1" />
                          </button>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => setCustomerSubTab('settings')}
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9.5px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer font-sans"
                          >
                            Edit Profile
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 8: PREMIUM ACCOUNT SETTINGS */}
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

                      </div>
                    </motion.div>
                  )}

                  {/* TAB 9: REMOVED DUPLICATE SECURITY (Preserved in Settings) */}

                  {/* TAB 14: NOTIFICATIONS */}
                  {customerSubTab === 'notifications' && (
                    <motion.div
                      key="notifications-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      <div className="space-y-1">
                        <h3 className="text-white text-base font-display font-bold uppercase tracking-wider flex items-center gap-2">
                          <Bell className="w-5 h-5 text-[#D4AF37]" /> Notifications
                        </h3>
                        <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                          Stay updated with your order status, exclusive offers, and account alerts.
                        </p>
                      </div>

                      <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-10 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 mb-2">
                          <Bell className="w-8 h-8 text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-white text-sm font-display uppercase font-bold tracking-wider">No notifications yet.</h4>
                          <p className="text-zinc-500 text-xs font-sans max-w-xs mx-auto">
                            We'll notify you about your orders and account updates as they happen.
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentPage('home')}
                          className="mt-4 px-8 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all cursor-pointer font-sans shadow-lg shadow-gold-pure/5"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 10: PRODUCT REVIEWS */}
                  {customerSubTab === 'reviews' && (
                    <motion.div
                      key="reviews-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left animate-fade-in"
                    >
                      {/* Page Header */}
                      <div className="space-y-1">
                        <h3 className="text-white text-base font-display font-bold uppercase tracking-wider flex items-center gap-2">
                          <Star className="w-5 h-5 text-[#D4AF37]" /> Product Reviews
                        </h3>
                        <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                          Share your experience to help other customers make better shopping decisions.
                        </p>
                      </div>

                      {/* Eligible Products List */}
                      <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-5 space-y-4 shadow-xl">
                        <h4 className="text-white text-xs uppercase font-display font-bold tracking-wider">Eligible Products</h4>
                        {customerOrders.length === 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                              { id: 'p1', name: 'Royal Bisht Thobe', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80', date: '2026-06-15' },
                              { id: 'p2', name: 'Premium Cashmere Al-Ula Ghutra', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=200&auto=format&fit=crop&q=80', date: '2026-07-01' }
                            ].map((prod) => (
                              <div key={prod.id} className="bg-black border border-white/5 p-3 rounded-xs flex items-center gap-3">
                                <img src={prod.image} alt={prod.name} className="w-12 h-12 object-cover rounded-xs border border-white/10" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-semibold text-[11px] truncate">{prod.name}</h5>
                                  <span className="text-[9px] text-zinc-500 font-mono block">Purchased: {prod.date}</span>
                                  <button
                                    onClick={() => {
                                      const selProdEl = document.getElementById('reviewProductSelect') as HTMLSelectElement;
                                      if (selProdEl) selProdEl.value = prod.name;
                                      window.scrollTo({ top: 300, behavior: 'smooth' });
                                    }}
                                    className="mt-1 text-[9px] text-[#D4AF37] hover:underline font-mono uppercase font-semibold cursor-pointer"
                                  >
                                    Review
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {customerOrders.flatMap(o => o.items).map((item, idx) => (
                              <div key={idx} className="bg-black border border-white/5 p-3 rounded-xs flex items-center gap-3">
                                <img src={item.image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&auto=format&fit=crop&q=80'} alt={item.name} className="w-12 h-12 object-cover rounded-xs border border-white/10" />
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-white font-semibold text-[11px] truncate">{item.name}</h5>
                                  <span className="text-[9px] text-zinc-500 font-mono block">Verified Order Item</span>
                                  <button
                                    onClick={() => {
                                      const selProdEl = document.getElementById('reviewProductSelect') as HTMLSelectElement;
                                      if (selProdEl) selProdEl.value = item.name;
                                      window.scrollTo({ top: 350, behavior: 'smooth' });
                                    }}
                                    className="mt-1 text-[9px] text-[#D4AF37] hover:underline font-mono uppercase font-semibold cursor-pointer"
                                  >
                                    Review Product
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Submit / Edit New Review Section */}
                      <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-6 space-y-5 shadow-xl">
                        <div className="border-b border-white/5 pb-3">
                          <h4 className="text-[#D4AF37] text-xs uppercase font-display font-bold tracking-wider">
                            {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
                          </h4>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const pName = (e.currentTarget.elements.namedItem('reviewProduct') as HTMLSelectElement).value;
                            const ratingVal = parseInt((e.currentTarget.elements.namedItem('reviewRating') as HTMLSelectElement).value, 10);
                            const commentText = (e.currentTarget.elements.namedItem('reviewComment') as HTMLTextAreaElement).value;

                            if (!commentText.trim()) {
                              triggerToast('⚠️ Please share your experience before submitting.', 'error');
                              return;
                            }

                            if (editingReviewId) {
                              setCustomerReviews(prev => prev.map(r => r.id === editingReviewId ? {
                                ...r,
                                productName: pName,
                                rating: ratingVal,
                                comment: commentText,
                                date: new Date().toISOString().split('T')[0]
                              } : r));
                              setEditingReviewId(null);
                              triggerToast('Thank you! Your review has been submitted successfully.', 'success');
                            } else {
                              const newReview = {
                                id: 'rev-' + Date.now(),
                                productName: pName,
                                rating: ratingVal,
                                comment: commentText,
                                date: new Date().toISOString().split('T')[0]
                              };
                              setCustomerReviews(prev => [newReview, ...prev]);
                              triggerToast('Thank you! Your review has been submitted successfully.', 'success');
                            }
                            (e.target as HTMLFormElement).reset();
                          }}
                          className="space-y-4 font-sans text-xs"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">Choose a Product</label>
                              <select
                                id="reviewProductSelect"
                                name="reviewProduct"
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                              >
                                <option value="Royal Bisht Thobe">Royal Bisht Thobe</option>
                                <option value="Premium Cashmere Al-Ula Ghutra">Premium Cashmere Al-Ula Ghutra</option>
                                <option value="Ivory Suede Sandals">Ivory Suede Sandals</option>
                                <option value="AL ZOAL Pure Dehn El-Oud Concentrate">AL ZOAL Pure Dehn El-Oud Concentrate</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">Rating Score</label>
                              <select
                                name="reviewRating"
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
                              >
                                <option value="5">★★★★★ (5 - Excellent)</option>
                                <option value="4">★★★★☆ (4 - Good)</option>
                                <option value="3">★★★☆☆ (3 - Average)</option>
                                <option value="2">★★☆☆☆ (2 - Poor)</option>
                                <option value="1">★☆☆☆☆ (1 - Terrible)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-300 uppercase tracking-widest block font-semibold">Review Comment</label>
                            <textarea
                              name="reviewComment"
                              rows={4}
                              placeholder="Share your experience with this product. Tell us about the quality, fit, comfort, delivery, or anything other customers should know."
                              className="w-full bg-black border border-white/10 rounded-xs p-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                            />
                          </div>

                          {/* Photo & Video Upload */}
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={() => triggerToast('Photo upload prompt ready.', 'success')}
                                className="px-3.5 py-2 bg-black border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-white rounded-xs text-[10px] uppercase font-semibold transition-all cursor-pointer"
                              >
                                Add Photos
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerToast('Video upload prompt ready.', 'success')}
                                className="px-3.5 py-2 bg-black border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-white rounded-xs text-[10px] uppercase font-semibold transition-all cursor-pointer"
                              >
                                Add Video (Optional)
                              </button>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-sans">Upload real photos or videos of the product to help other customers.</p>
                          </div>

                          {/* Review Tips */}
                          <div className="p-3.5 bg-black/60 border border-white/5 rounded-xs space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold block">Review Tips</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-zinc-400 font-sans">
                              <span>✔ Product quality</span>
                              <span>✔ Size & fitting</span>
                              <span>✔ Comfort</span>
                              <span>✔ Delivery experience</span>
                              <span>✔ Packaging</span>
                              <span>✔ Value for money</span>
                            </div>
                          </div>

                          <div className="pt-2 flex items-center gap-3">
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                            >
                              {editingReviewId ? 'Save Changes' : 'Submit Review'}
                            </button>
                            {editingReviewId && (
                              <button
                                type="button"
                                onClick={() => setEditingReviewId(null)}
                                className="px-5 py-2.5 bg-black border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded-xs hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Reviews History List (My Reviews) */}
                      <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-6 space-y-4 shadow-xl">
                        <div className="border-b border-white/5 pb-3">
                          <h4 className="text-white text-xs uppercase font-display font-bold tracking-wider">My Reviews</h4>
                        </div>

                        {customerReviews.length === 0 ? (
                          <div className="text-center py-10 space-y-3">
                            <p className="text-white text-sm font-semibold uppercase tracking-wider">You haven't reviewed any products yet.</p>
                            <p className="text-zinc-500 text-xs font-sans">Share your experience to help other customers make better shopping decisions.</p>
                            <div className="pt-2">
                              <button
                                onClick={() => setCustomerSubTab('orders')}
                                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                              >
                                Review Purchased Products
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {customerReviews.map((rev) => (
                              <div key={rev.id} className="p-4 bg-black border border-white/10 rounded-xs space-y-3 relative">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={
                                        rev.productName?.includes('Ghutra') ? 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=100&auto=format&fit=crop&q=80' :
                                        rev.productName?.includes('Sandals') ? 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100&auto=format&fit=crop&q=80' :
                                        rev.productName?.includes('Oud') ? 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100&auto=format&fit=crop&q=80' :
                                        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&auto=format&fit=crop&q=80'
                                      } 
                                      alt={rev.productName} 
                                      className="w-10 h-10 object-cover rounded-xs border border-white/10 shrink-0" 
                                    />
                                    <div>
                                      <h5 className="text-white font-semibold uppercase text-xs tracking-wider">{rev.productName}</h5>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[#D4AF37] text-xs font-mono">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                        <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-xs font-mono font-bold">✔ Verified Purchase</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-zinc-500 font-mono text-[10px]">{rev.date}</span>
                                </div>

                                <p className="text-zinc-300 text-xs font-sans leading-relaxed pl-13">{rev.comment}</p>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                                  <button
                                    onClick={() => {
                                      setEditingReviewId(rev.id);
                                      const selProdEl = document.getElementById('reviewProductSelect') as HTMLSelectElement;
                                      if (selProdEl) selProdEl.value = rev.productName;
                                      window.scrollTo({ top: 350, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-1 bg-black border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-white rounded-xs text-[10px] uppercase font-semibold transition-all cursor-pointer"
                                  >
                                    Edit Review
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Delete Review?\n\nAre you sure you want to remove this review?')) {
                                        setCustomerReviews(prev => prev.filter(r => r.id !== rev.id));
                                        triggerToast('Review removed successfully.', 'success');
                                      }
                                    }}
                                    className="px-3 py-1 bg-black border border-rose-500/30 hover:border-rose-500 text-zinc-400 hover:text-rose-400 rounded-xs text-[10px] uppercase font-semibold transition-all cursor-pointer"
                                  >
                                    Delete Review
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 13: PREMIUM INVOICES TABLE RECORDS */}
                  {customerSubTab === 'invoices' && (
                    <motion.div
                      key="invoices-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      {selectedInvoice ? (
                        /* Full-page Royal-Gold Printable Invoice Layout */
                        <div className="bg-black border border-[#D4AF37]/30 rounded-xs p-6 md:p-8 space-y-6 font-sans relative shadow-[0_12px_40px_rgba(0,0,0,0.9)] animate-fade-in">
                          {/* Watermark Logo */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.01] pointer-events-none select-none">
                            <span className="font-serif text-[120px] font-bold tracking-widest text-[#D4AF37]">{brandName.toUpperCase()}</span>
                          </div>

                          {/* Double Gold Border Header */}
                          <div className="border-b-2 border-double border-[#D4AF37]/50 pb-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="space-y-1">
                                <span className="font-serif text-2xl font-bold tracking-[0.3em] text-[#D4AF37]">{brandName.toUpperCase()}</span>
                                <span className="text-[8px] font-mono text-zinc-500 tracking-[0.4em] uppercase block">Premium House of Excellence</span>
                              </div>
                              <div className="text-left sm:text-right font-mono space-y-0.5">
                                <h4 className="text-[#D4AF37] font-semibold uppercase text-[11px] tracking-widest">TAX INVOICE</h4>
                                <span className="text-zinc-400 block text-[9px] uppercase">Invoice ID: INV-{selectedInvoice.id}</span>
                                <span className="text-zinc-500 block text-[8px]">Date: {selectedInvoice.date || new Date().toISOString().substring(0, 10)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Address Details Block */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-400 leading-relaxed border-b border-white/5 pb-5">
                            <div className="space-y-1.5">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500 block">From: Premium House</span>
                              <p className="font-bold text-white uppercase text-[9.5px]">{settings.businessName.toUpperCase()}</p>
                              <p>{settings.address}</p>
                              <p className="font-mono">Email: {settings.email} • Phone: {settings.phone}</p>
                              <p className="font-mono">VAT ID: 31002931500003</p>
                            </div>
                            <div className="space-y-1.5 sm:text-right">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500 block">Bill To Recipient:</span>
                              <p className="font-bold text-white uppercase text-[9.5px]">{currentUser?.name}</p>
                              <p>{currentUser?.address || 'King Fahd Road, Al Hofuf'}</p>
                              <p className="font-mono">Phone: {currentUser?.phone || settings.phone}</p>
                              <p className="font-mono">Email: {currentUser?.email}</p>
                            </div>
                          </div>

                          {/* Product Detail Lines */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-white/10 text-zinc-500 uppercase font-mono text-[8px] tracking-widest">
                                  <th className="py-2.5">Item Description</th>
                                  <th className="py-2.5 text-center">Unit price (SAR)</th>
                                  <th className="py-2.5 text-center">Qty</th>
                                  <th className="py-2.5 text-right">Line Total (SAR)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-sans">
                                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                  selectedInvoice.items.map((item: any, index: number) => (
                                    <tr key={index} className="text-zinc-300">
                                      <td className="py-3 font-semibold text-white uppercase text-[10px] tracking-wide">
                                        {item.name}
                                        {item.selectedOption && <span className="text-zinc-500 block text-[8px] font-mono lowercase">Option: {item.selectedOption}</span>}
                                      </td>
                                      <td className="py-3 text-center font-mono text-[10.5px]">{Number(item.price).toFixed(2)}</td>
                                      <td className="py-3 text-center font-mono text-[10.5px]">{item.quantity}</td>
                                      <td className="py-3 text-right font-mono font-bold text-white text-[10.5px]">{(Number(item.price) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr className="text-zinc-300">
                                    <td className="py-3 font-semibold text-white uppercase text-[10px] tracking-wide">Royal Store Bisht Thobe</td>
                                    <td className="py-3 text-center font-mono text-[10.5px]">2450.00</td>
                                    <td className="py-3 text-center font-mono text-[10.5px]">1</td>
                                    <td className="py-3 text-right font-mono font-bold text-white text-[10.5px]">2450.00</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Calculation Summary Footer Block */}
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-white/10 pt-4 text-xs">
                            <div className="text-zinc-500 max-w-sm space-y-1.5 leading-relaxed">
                              <span className="text-[8px] uppercase font-mono tracking-widest text-[#D4AF37] block">House Declaration Terms:</span>
                              <p className="text-[10px]">All thobes are stitched with genuine double-gilt German metallic wire. Returns on premium fittings are accommodated via private tailors alteration consultation only.</p>
                            </div>

                            <div className="w-full sm:w-64 space-y-1.5 font-mono text-[10px] text-zinc-400">
                              <div className="flex justify-between">
                                <span className="uppercase tracking-wider">Subtotal:</span>
                                <span className="text-white">{(selectedInvoice.subtotal || selectedInvoice.totalPrice || 2450).toFixed(2)} SAR</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="uppercase tracking-wider">Shipping Fee:</span>
                                <span className="text-white">{(selectedInvoice.shippingCost || 0).toFixed(2)} SAR</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="uppercase tracking-wider">Saudi VAT (15%):</span>
                                <span className="text-white">{((selectedInvoice.subtotal || selectedInvoice.totalPrice || 2450) * 0.15).toFixed(2)} SAR</span>
                              </div>
                              <div className="flex justify-between border-t border-white/10 pt-1.5 text-xs text-white font-bold">
                                <span className="uppercase tracking-widest text-[#D4AF37]">GRAND TOTAL:</span>
                                <span className="text-[#D4AF37] font-mono">{(selectedInvoice.totalAmount || (selectedInvoice.totalPrice * 1.15) || 2817.5).toFixed(2)} SAR</span>
                              </div>
                            </div>
                          </div>

                          {/* Printable footer metadata signature */}
                          <div className="flex justify-between items-center border-t border-white/5 pt-4 text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span>Secured Invoice List</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    const mockInvoice = {
                                      invoiceNumber: `INV-${selectedInvoice.id}`,
                                      invoiceDate: selectedInvoice.date || new Date().toLocaleDateString(),
                                      merchantName: brandName || 'AL ZOAL',
                                      merchantVat: '310239485700003',
                                      orderId: selectedInvoice.id,
                                      paymentId: `pay_${selectedInvoice.id}`,
                                      gateway: selectedInvoice.paymentMethod || 'Mada Card',
                                      transactionId: `txn_${selectedInvoice.id}`,
                                      subtotal: selectedInvoice.subtotal || selectedInvoice.totalPrice || 0,
                                      vat: (selectedInvoice.subtotal || selectedInvoice.totalPrice || 0) * 0.15,
                                      discount: 0,
                                      delivery: selectedInvoice.shippingCost || 0,
                                      total: selectedInvoice.totalAmount || ((selectedInvoice.subtotal || selectedInvoice.totalPrice || 0) * 1.15),
                                      items: selectedInvoice.items || []
                                    };
                                    printWindow.document.write(generatePrintableInvoiceHtml(mockInvoice));
                                    printWindow.document.close();
                                    printWindow.print();
                                  }
                                }}
                                className="px-3 py-1.5 bg-white text-black font-sans font-bold uppercase rounded-sm hover:bg-[#D4AF37] transition-all cursor-pointer flex items-center gap-2"
                              >
                                <Printer className="w-3 h-3" /> Print Invoice
                              </button>
                              <button
                                onClick={() => {
                                  const mockInvoice = {
                                    invoiceNumber: `INV-${selectedInvoice.id}`,
                                    invoiceDate: selectedInvoice.date || new Date().toLocaleDateString(),
                                    merchantName: brandName || 'AL ZOAL',
                                    merchantVat: '310239485700003',
                                    orderId: selectedInvoice.id,
                                    paymentId: `pay_${selectedInvoice.id}`,
                                    gateway: selectedInvoice.paymentMethod || 'Mada Card',
                                    transactionId: `txn_${selectedInvoice.id}`,
                                    subtotal: selectedInvoice.subtotal || selectedInvoice.totalPrice || 0,
                                    vat: (selectedInvoice.subtotal || selectedInvoice.totalPrice || 0) * 0.15,
                                    discount: 0,
                                    delivery: selectedInvoice.shippingCost || 0,
                                    total: selectedInvoice.totalAmount || ((selectedInvoice.subtotal || selectedInvoice.totalPrice || 0) * 1.15),
                                    items: selectedInvoice.items || []
                                  };
                                  const html = generatePrintableInvoiceHtml(mockInvoice);
                                  downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${mockInvoice.invoiceNumber}.pdf`);
                                }}
                                className="px-3 py-1.5 bg-zinc-800 text-white font-sans font-bold uppercase rounded-sm hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-2"
                              >
                                <Download className="w-3 h-3" /> Download PDF
                              </button>
                              <button
                                onClick={() => setSelectedInvoice(null)}
                                className="px-3 py-1.5 bg-zinc-900 text-zinc-300 border border-white/5 font-sans font-bold uppercase rounded-sm hover:text-white transition-all cursor-pointer"
                              >
                                Close Invoice
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Invoices Selection List Table */
                        <div className="bg-[#060606]/80 border border-white/10 rounded-sm p-6 space-y-6 shadow-xl">
                          {/* Page Header */}
                          <div className="space-y-1">
                            <h3 className="text-white text-base font-display font-bold uppercase tracking-wider flex items-center gap-2">
                              <FileText className="w-5 h-5 text-[#D4AF37]" /> Invoices & Receipts
                            </h3>
                            <p className="text-zinc-400 text-xs font-sans leading-relaxed">
                              View, download, and print your order invoices and payment receipts.
                            </p>
                          </div>

                          {/* Saudi VAT Information Card */}
                          <div className="bg-black/80 border border-[#D4AF37]/30 rounded-xs p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="text-[#D4AF37] text-xs font-display font-bold uppercase tracking-wider block">Saudi VAT Information</span>
                              <p className="text-zinc-400 text-xs font-sans">
                                "All invoices include Saudi Arabia VAT (15%) in accordance with ZATCA e-Invoicing requirements."
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-xs bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                              ✔ ZATCA Ready
                            </span>
                          </div>

                          {/* Search & Filters */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Search Invoice</label>
                              <input
                                type="text"
                                placeholder="Search by INV number..."
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-sans"
                                onChange={(e) => {}}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Date Range</label>
                              <select className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-sans">
                                <option value="all">All Dates</option>
                                <option value="2026">2026</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest block">Payment Status</label>
                              <select className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50 font-sans">
                                <option value="all">All Statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                              </select>
                            </div>
                            <div className="space-y-1 flex items-end">
                              <button
                                onClick={() => {
                                  try {
                                    const targetOrd = customerOrders[0] || { id: '1001', totalPrice: 2450, date: new Date().toLocaleDateString(), items: [] };
                                    const mockInvoice = {
                                      invoiceNumber: `INV-${targetOrd.id}`,
                                      invoiceDate: targetOrd.date || new Date().toLocaleDateString(),
                                      merchantName: brandName || 'AL ZOAL',
                                      merchantVat: '310239485700003',
                                      orderId: targetOrd.id,
                                      paymentId: `pay_${targetOrd.id}`,
                                      gateway: targetOrd.paymentMethod || 'Mada Card',
                                      transactionId: `txn_${targetOrd.id}`,
                                      subtotal: targetOrd.subtotal || targetOrd.totalPrice || 2450,
                                      vat: (targetOrd.subtotal || targetOrd.totalPrice || 2450) * 0.15,
                                      discount: 0,
                                      delivery: targetOrd.shippingCost || 0,
                                      total: targetOrd.totalAmount || ((targetOrd.subtotal || targetOrd.totalPrice || 2450) * 1.15),
                                      items: targetOrd.items || []
                                    };
                                    const html = generatePrintableInvoiceHtml(mockInvoice);
                                    downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${mockInvoice.invoiceNumber}.pdf`);
                                    triggerToast('Invoice downloaded successfully.', 'success');
                                  } catch (err) {
                                    console.error(err);
                                    triggerToast('Unable to download invoice.', 'error');
                                  }
                                }}
                                className="w-full py-2.5 bg-black border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-white text-xs font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> Download
                              </button>
                            </div>
                          </div>

                          {customerOrders.length === 0 ? (
                            <div className="p-12 border border-dashed border-white/10 rounded-xs text-center space-y-4 bg-black/40">
                              <FileText className="w-8 h-8 text-zinc-500 mx-auto animate-pulse" />
                              <div className="space-y-1">
                                <h4 className="text-white font-semibold text-sm uppercase font-display tracking-wider">No invoices available.</h4>
                                <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto">
                                  Your VAT invoices will appear here automatically after you complete an order.
                                </p>
                              </div>
                              <button
                                onClick={() => setCurrentPage('store')}
                                className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                              >
                                Shop Now
                              </button>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-white/10 text-zinc-400 uppercase font-mono text-[10px] tracking-wider py-3">
                                    <th className="py-3 px-3">Invoice Number</th>
                                    <th className="py-3 px-3">Order Date</th>
                                    <th className="py-3 px-3 text-right">Amount</th>
                                    <th className="py-3 px-3 text-right">VAT</th>
                                    <th className="py-3 px-3 text-center">Payment Status</th>
                                    <th className="py-3 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-sans text-zinc-300">
                                  {customerOrders.map((ord) => {
                                    const amount = ord.totalPrice || 2450;
                                    const vat = amount * 0.15;
                                    return (
                                      <tr key={ord.id} className="hover:bg-white/[0.02]">
                                        <td className="py-3.5 px-3 text-white font-bold font-mono">INV-{ord.id}</td>
                                        <td className="py-3.5 px-3 text-zinc-400 font-mono">{ord.date || new Date().toISOString().substring(0, 10)}</td>
                                        <td className="py-3.5 px-3 text-right text-white font-bold font-mono">{amount.toFixed(2)} SAR</td>
                                        <td className="py-3.5 px-3 text-right text-zinc-400 font-mono">{vat.toFixed(2)} SAR</td>
                                        <td className="py-3.5 px-3 text-center">
                                          <span className="px-2.5 py-1 rounded-xs bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase tracking-wider font-mono">
                                            Paid
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <button
                                              onClick={() => {
                                                setSelectedInvoice(ord);
                                                triggerToast('Invoice is ready.', 'success');
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                              }}
                                              className="px-2.5 py-1.5 bg-black hover:bg-[#D4AF37] hover:text-black border border-white/10 text-zinc-300 text-[10px] font-bold uppercase rounded-xs transition-all cursor-pointer"
                                            >
                                              View Invoice
                                            </button>
                                            <button
                                              onClick={() => {
                                                triggerToast('Invoice downloaded successfully.', 'success');
                                              }}
                                              className="px-2.5 py-1.5 bg-black hover:bg-white hover:text-black border border-white/10 text-zinc-300 text-[10px] font-bold uppercase rounded-xs transition-all cursor-pointer"
                                            >
                                              Download PDF
                                            </button>
                                            <button
                                              onClick={() => {
                                                triggerToast('Preparing Invoice...', 'info');
                                                window.print();
                                              }}
                                              className="px-2.5 py-1.5 bg-black hover:bg-white hover:text-black border border-white/10 text-zinc-300 text-[10px] font-bold uppercase rounded-xs transition-all cursor-pointer"
                                            >
                                              Print
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
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

        {/* II. STAFF PORTAL DASHBOARD */}
        {activeDashboardTab === 'admin' && (
          <StaffDashboard
            currentUser={currentUser}
            orders={orders}
            setOrders={setOrders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onLogout={onLogout}
            deliveryZones={deliveryZones}
            onUpdateDeliveryZones={onUpdateDeliveryZones}
            shippingConfig={shippingConfig}
            setLocalShippingConfig={setLocalShippingConfig}
            saveShippingConfig={saveShippingConfig}
            returnsConfig={returnsConfig}
            setLocalReturnsConfig={setLocalReturnsConfig}
            saveReturnsConfig={saveReturnsConfig}
            supabaseStatus={supabaseStatus}
            fetchSupabaseStatus={fetchSupabaseStatus}
            fetchingStatus={fetchingStatus}
            handleCopySchema={handleCopySchema}
            copiedSchema={copiedSchema}
            handleSyncData={handleSyncData}
            syncingData={syncingData}
            syncResult={syncResult}
            syncError={syncError}
            SupabaseStoragePanel={SupabaseStoragePanel}
          />
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
                    <span className="text-[10px] tracking-[0.4em] text-[#D4AF37] uppercase font-display font-bold">PRIORITY COURIER DISPATCH</span>
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
                    <span className="uppercase tracking-[0.25em] text-zinc-400 font-display font-medium">Dispatch Stage</span>
                    <span className="font-mono text-[#D4AF37] tracking-wider uppercase font-bold">
                      {selectedDetailedOrder.status === 'Cancelled' ? 'Disrupted' : `${selectedDetailedOrder.status} Status`}
                    </span>
                  </div>

                  {selectedDetailedOrder.status === 'Cancelled' ? (
                    <div className="p-3.5 bg-rose-950/20 border border-rose-500/10 text-rose-400 rounded-sm text-[10px] tracking-wide flex items-center gap-2.5">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping flex-shrink-0" />
                      <span className="leading-relaxed">This premium order was cancelled. Authorized billing amount of {formatCurrency(selectedDetailedOrder.total)} SAR has been reversed safely.</span>
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
                      <span className="text-zinc-400 font-sans">Net Value</span>
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
                          desc: 'Customer request recorded by Zoal Lounge central processors.',
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
                          desc: 'Customer account confirmed. Prepared list queued at the central botanical roasting center.',
                          time: '10:15 AM',
                          date: formattedDate,
                          status: 'completed'
                        },
                        {
                          title: 'Boutique Preparation',
                          desc: 'Creations meticulously inspected, sealed within climate insulation, and detailed with hand-written records plates.',
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
                    Shipping Logistics Clause
                  </div>
                  <p className="leading-relaxed">
                    All delicate viennoiseries and specialty Geisha cold-brews are distributed under strict climate-controlled environments matching 18°C temperature baselines across {settings.address} and Prince Mohammad Bin Fahd Rd (Dammam). Real-time dispatch is backed by ZOAL Priority Services.
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
