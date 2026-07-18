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
import { useGlobalProducts, updateProductInventory } from '../imageRegistry';
import { SimulatedLogisticsMap } from './SimulatedLogisticsMap';
import { useTranslation } from 'react-i18next';
import { useBranding } from './BrandingContext';
import { formatCurrency } from '../utils';
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
}: DashboardsProps) {
  const { settings } = useBranding();
  const brandName = settings.businessName.split(' ')[0];
  const { t } = useTranslation();
  const allProducts = useGlobalProducts();
  // Assume currentUser has a 'role' property: 'customer' | 'admin'
  const userRole = currentUser ? (currentUser as any).role || 'customer' : null;

  // Select active role view
  const [activeDashboardTab, setActiveDashboardTab] = useState<'patron' | 'admin' | 'owner'>(() => {
    const role = currentUser ? (currentUser as any).role || 'customer' : 'customer';
    if (role === 'staff' || role === 'admin') return 'admin';
    return 'patron';
  });

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

  // --- NEW TABS: REVIEWS, DOWNLOADS, SUPPORT, INVOICES STATE ENGINES ---
  const [customerReviews, setCustomerReviews] = useState<any[]>(() => {
    const saved = localStorage.getItem(`zoal_reviews_${currentUser?.email || 'guest'}`);
    if (saved) return JSON.parse(saved);
    return [
      { id: 'rev-1', productName: 'Royal Sovereign Bisht Thobe', rating: 5, comment: 'The golden zari embroidery is pristine. Truly worthy of high royal assemblies.', date: '2026-06-15' },
      { id: 'rev-2', productName: 'Bespoke Cashmere Al-Ula Ghutra', rating: 5, comment: 'Incredibly soft texture, drapes beautifully. Exceptional thermal comfort.', date: '2026-07-02' }
    ];
  });

  const [supportTickets, setSupportTickets] = useState<any[]>(() => {
    const saved = localStorage.getItem(`zoal_tickets_${currentUser?.email || 'guest'}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'TCK-8921',
        subject: 'Custom Sizing Coordinate Verification',
        category: 'Custom Fit Fitting',
        priority: 'VIP Priority',
        status: 'OPEN',
        date: '2026-07-14',
        messages: [
          { sender: 'customer', text: 'Peace be upon you. I wanted to verify if my sleeve measurement length has been correctly registered as 63.5cm.', time: '10:30 AM' },
          { sender: 'concierge', text: 'And upon you be peace, esteemed patron. Yes, our master bespoke ledger has verified your coordinates: Sleeve: 63.5cm, Shoulder: 48cm. Your thobe is being stitched with precision.', time: '11:15 AM' }
        ]
      }
    ];
  });

  const [selectedSupportTicket, setSelectedSupportTicket] = useState<any | null>(null);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Bespoke Fitting');
  const [newTicketPriority, setNewTicketPriority] = useState('VIP Priority');
  const [newTicketMsg, setNewTicketMsg] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Helper to save state changes
  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_reviews_${currentUser.email}`, JSON.stringify(customerReviews));
    }
  }, [customerReviews, currentUser]);

  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`zoal_tickets_${currentUser.email}`, JSON.stringify(supportTickets));
    }
  }, [supportTickets, currentUser]);

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
          status: 'Active VIP'
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
        { id: 'sn-1', type: 'order', title: 'New Luxury Order Placed', message: 'Order #ORD-7491 contains 2x Bespoke Thobes and requires immediate master artisan assignment.', date: '10 mins ago', read: false },
        { id: 'sn-2', type: 'stock', title: 'Critical Stock Level Alert', message: 'Imperial Dark Roast Coffee beans inventory has dropped below 15 bags.', date: '1 hour ago', read: false },
        { id: 'sn-3', type: 'packing', title: 'Packing Dispatch Request', message: 'Order #ORD-6382 has been marked ready-to-pack for Al Hofuf branch.', date: '3 hours ago', read: true },
        { id: 'sn-4', type: 'message', title: 'Customer Tailoring Message', message: 'Distinguished Patron Raihan Kabir submitted a specific collar custom measure request.', date: '5 hours ago', read: false }
      ];
    } catch (e) {
      return [];
    }
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
              <User className="w-3.5 h-3.5" /> {t('dashboard.customer_dashboard', { defaultValue: 'Customer Dashboard' })}
            </button>
            {(userRole === 'admin' || userRole === 'staff') && (
              <button
                onClick={() => setActiveDashboardTab('admin')}
                className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeDashboardTab === 'admin' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> {t('dashboard.staff_dashboard', { defaultValue: 'Staff Dashboard' })}
              </button>
            )}
            {userRole === 'admin' && (
              <button
                onClick={() => setActiveDashboardTab('owner')}
                className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  activeDashboardTab === 'owner' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" /> Executive Deck
              </button>
            )}
          </div>
        </div>

        {/* I. CUSTOMER DASHBOARD */}
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
                  <span>{t('dashboard.customer_dashboard', { defaultValue: 'Customer' })}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-[#D4AF37] font-semibold">
                    {customerSubTab === 'overview' ? 'Dashboard' :
                     customerSubTab === 'orders' ? (selectedOrder ? 'Order Details' : 'My Orders') :
                     customerSubTab === 'track' ? 'Track Orders' :
                     customerSubTab === 'wishlist' ? 'Wishlist' :
                     customerSubTab === 'addresses' ? 'Saved Addresses' :
                     customerSubTab === 'profile' ? 'Profile' :
                     customerSubTab === 'notifications' ? 'Notifications' :
                     customerSubTab === 'reviews' ? 'Product Reviews' :
                     customerSubTab === 'downloads' ? 'Downloads Hub' :
                     customerSubTab === 'support' ? 'Support Concierge' :
                     customerSubTab === 'invoices' ? 'Premium Invoices' :
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
                      {currentUser ? (currentUser as any).firstName || currentUser.name.split(' ')[0] : 'Customer'}
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
                  Customer Navigation Suite
                </span>
                {[
                  { id: 'overview', name: t('dashboard.overview_label', { defaultValue: 'Dashboard Overview' }), icon: BarChart3 },
                  { id: 'profile', name: t('dashboard.profile_label', { defaultValue: 'Profile Summary' }), icon: User },
                  { id: 'orders', name: t('dashboard.my_orders', { defaultValue: 'My Orders' }), icon: ClipboardList },
                  { id: 'wishlist', name: t('dashboard.wishlist_label', { defaultValue: 'Wishlist Catalog' }), icon: Bookmark },
                  { id: 'addresses', name: t('dashboard.saved_addresses_label', { defaultValue: 'Saved Addresses' }), icon: MapPin },
                  { id: 'notifications', name: t('dashboard.notifications_label', { defaultValue: 'Notifications Log' }), icon: Bell },
                  { id: 'reviews', name: t('dashboard.reviews_label', { defaultValue: 'Product Reviews' }), icon: Star },
                  { id: 'downloads', name: t('dashboard.downloads_label', { defaultValue: 'Downloads Hub' }), icon: Download },
                  { id: 'support', name: t('dashboard.support_label', { defaultValue: 'Support Concierge' }), icon: Mail },
                  { id: 'invoices', name: t('dashboard.invoices_label', { defaultValue: 'Premium Invoices' }), icon: FileText },
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
                            <span className="text-white font-display uppercase font-bold text-xs tracking-wider">Customer Workspace</span>
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
                            { id: 'profile', name: t('dashboard.profile_label', { defaultValue: 'Profile Summary' }), icon: User },
                            { id: 'orders', name: t('dashboard.my_orders', { defaultValue: 'My Orders' }), icon: ClipboardList },
                            { id: 'wishlist', name: t('dashboard.wishlist_label', { defaultValue: 'Wishlist Catalog' }), icon: Bookmark },
                            { id: 'addresses', name: t('dashboard.saved_addresses_label', { defaultValue: 'Saved Addresses' }), icon: MapPin },
                            { id: 'notifications', name: t('dashboard.notifications_label', { defaultValue: 'Notifications Log' }), icon: Bell },
                            { id: 'reviews', name: t('dashboard.reviews_label', { defaultValue: 'Product Reviews' }), icon: Star },
                            { id: 'downloads', name: t('dashboard.downloads_label', { defaultValue: 'Downloads Hub' }), icon: Download },
                            { id: 'support', name: t('dashboard.support_label', { defaultValue: 'Support Concierge' }), icon: Mail },
                            { id: 'invoices', name: t('dashboard.invoices_label', { defaultValue: 'Premium Invoices' }), icon: FileText },
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
                            <p className="text-[#D4AF37] font-mono text-[9px] uppercase tracking-widest">{brandName} {currentUser?.role || 'Customer'} Ledger</p>
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
                                { key: 'sapphire_sovereign', label: '⭐ Star Customer', desc: 'Bright gold celestial' },
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

                  {/* TAB 10: PRODUCT REVIEWS LEDGER */}
                  {customerSubTab === 'reviews' && (
                    <motion.div
                      key="reviews-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left animate-fade-in"
                    >
                      {/* Submit New Review Section */}
                      <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                        <h3 className="text-[#D4AF37] text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 flex items-center gap-2 font-mono">
                          <Star className="w-4 h-4 text-[#D4AF37]" /> Write Sovereign Product Review
                        </h3>
                        <p className="text-zinc-500 text-xs font-sans leading-relaxed">
                          Share your appreciation of Al Zoal's handiwork. Your feedback is meticulously logged and presented to our master designers.
                        </p>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const pName = (e.currentTarget.elements.namedItem('reviewProduct') as HTMLSelectElement).value;
                            const ratingVal = parseInt((e.currentTarget.elements.namedItem('reviewRating') as HTMLSelectElement).value, 10);
                            const commentText = (e.currentTarget.elements.namedItem('reviewComment') as HTMLTextAreaElement).value;

                            if (!commentText.trim()) {
                              triggerToast('⚠️ Please write some feedback before submitting.', 'error');
                              return;
                            }

                            const newReview = {
                              id: 'rev-' + Date.now(),
                              productName: pName,
                              rating: ratingVal,
                              comment: commentText,
                              date: new Date().toISOString().split('T')[0]
                            };

                            setCustomerReviews(prev => [newReview, ...prev]);
                            triggerToast('✓ Your sovereign review was registered successfully.', 'success');
                            (e.target as HTMLFormElement).reset();
                          }}
                          className="space-y-4 font-sans text-xs"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-mono">Select Luxury Product:</label>
                              <select
                                name="reviewProduct"
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                              >
                                <option value="Royal Sovereign Bisht Thobe">Royal Sovereign Bisht Thobe</option>
                                <option value="Bespoke Cashmere Al-Ula Ghutra">Bespoke Cashmere Al-Ula Ghutra</option>
                                <option value="Sovereign Ivory Suede Sandals">Sovereign Ivory Suede Sandals</option>
                                <option value="AL ZOAL Pure Dehn El-Oud Concentrate">AL ZOAL Pure Dehn El-Oud Concentrate</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-mono">Star Rating Score:</label>
                              <select
                                name="reviewRating"
                                className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                              >
                                <option value="5">★★★★★ - Absolute Masterpiece (5/5)</option>
                                <option value="4">★★★★☆ - Premium Excellence (4/5)</option>
                                <option value="3">★★★☆☆ - Fine Stitchwork (3/5)</option>
                                <option value="2">★★☆☆☆ - Below Expectations (2/5)</option>
                                <option value="1">★☆☆☆☆ - Requires Tailor Review (1/5)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-mono">Your Personal Experience Review:</label>
                            <textarea
                              name="reviewComment"
                              rows={4}
                              placeholder="Describe the textile weight, drape, collar precision, and embroidery luster..."
                              className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="px-6 py-2.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                          >
                            Submit Sovereign Review
                          </button>
                        </form>
                      </div>

                      {/* Reviews History Ledger */}
                      <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                        <h3 className="text-white text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5">
                          Your Registered Feedback Dossier
                        </h3>

                        {customerReviews.length === 0 ? (
                          <p className="text-zinc-500 text-xs font-sans py-4 text-center">No reviews submitted yet.</p>
                        ) : (
                          <div className="space-y-4">
                            {customerReviews.map((rev) => (
                              <div key={rev.id} className="p-4 bg-black border border-white/5 rounded-xs space-y-2 relative">
                                <div className="flex justify-between items-start gap-4">
                                  <div>
                                    <h4 className="text-white font-semibold uppercase text-[10px] tracking-wider">{rev.productName}</h4>
                                    <span className="text-[#D4AF37] text-xs font-mono">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                                  </div>
                                  <span className="text-zinc-600 font-mono text-[9px]">{rev.date}</span>
                                </div>
                                <p className="text-zinc-400 text-xs font-sans leading-relaxed">{rev.comment}</p>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Erase this review entry?')) {
                                      setCustomerReviews(prev => prev.filter(r => r.id !== rev.id));
                                      triggerToast('✓ Review record removed.', 'success');
                                    }
                                  }}
                                  className="absolute bottom-4 right-4 text-zinc-600 hover:text-rose-500 transition-colors text-[9px] font-mono uppercase tracking-widest cursor-pointer"
                                >
                                  Erase
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 11: DOWNLOADS VAULT */}
                  {customerSubTab === 'downloads' && (
                    <motion.div
                      key="downloads-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left"
                    >
                      <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                        <h3 className="text-[#D4AF37] text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 flex items-center gap-2 font-mono">
                          <Download className="w-4 h-4 text-[#D4AF37]" /> Imperial Documents & Asset Vault
                        </h3>
                        <p className="text-zinc-500 text-xs leading-relaxed font-sans">
                          Access high-end blueprints, care codexes, and digital luxury backdrops curated exclusively for our patrons.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'dl-1', title: 'Sovereign Thobe Care & Laundry Codex', size: '2.4 MB', type: 'PDF Blueprint', desc: 'Rules and parameters on maintaining the gold-thread zari embroidery luster during luxury dry-cleans.' },
                            { id: 'dl-2', title: 'ZOAL Bespoke Measurement Guidebook', size: '4.8 MB', type: 'PDF Dossier', desc: 'Step-by-step master measurements instruction book for perfect chest, collar, and wrist dimensions.' },
                            { id: 'dl-3', title: 'Saudi Coffee Protocol & Hosting Etiquette', size: '1.2 MB', type: 'PDF Booklet', desc: 'Deep dive into Eastern Province cardamom spice ratios and traditional hosting rituals.' },
                            { id: 'dl-4', title: 'Al-Ula Cinematic 4K Smartphone Wallpapers', size: '42.5 MB', type: 'ZIP Package', desc: 'Exclusive gold-graded desert photography package formatted for high-definition mobile displays.' }
                          ].map((doc) => {
                            const [downloading, setDownloading] = useState(false);
                            return (
                              <div key={doc.id} className="p-4 bg-black border border-white/5 rounded-xs space-y-3 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-white text-[11px] uppercase font-semibold tracking-wider font-sans">{doc.title}</h4>
                                    <span className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest shrink-0 bg-white/5 px-1.5 py-0.5 rounded-sm">{doc.size}</span>
                                  </div>
                                  <span className="text-[#D4AF37] font-mono text-[8px] uppercase tracking-widest block">{doc.type}</span>
                                  <p className="text-zinc-400 text-xs leading-relaxed font-sans pt-1">{doc.desc}</p>
                                </div>

                                <button
                                  onClick={() => {
                                    if (downloading) return;
                                    setDownloading(true);
                                    setTimeout(() => {
                                      setDownloading(false);
                                      triggerToast(`✓ Decrypted and downloaded "${doc.title}" successfully.`, 'success');
                                    }, 1800);
                                  }}
                                  disabled={downloading}
                                  className="w-full py-2 bg-zinc-900 border border-white/10 hover:border-[#D4AF37] text-white hover:text-black hover:bg-[#D4AF37] text-[9px] font-bold uppercase tracking-widest rounded-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans"
                                >
                                  {downloading ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      <span>Decrypting Server Key...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3 h-3" />
                                      <span>Acquire Digital Asset</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 12: SUPPORT TICKETS CONCIERGE */}
                  {customerSubTab === 'support' && (
                    <motion.div
                      key="support-tab"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 text-left animate-fade-in"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left/Sidebar: Ticket Creation & List */}
                        <div className="space-y-6 lg:col-span-1">
                          {/* Ticket Creator Form */}
                          <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-4 space-y-4">
                            <h4 className="text-[#D4AF37] text-[10px] uppercase font-mono tracking-widest border-b border-white/5 pb-2">
                              Summon Concierge
                            </h4>

                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!newTicketSubject.trim() || !newTicketMsg.trim()) {
                                  triggerToast('⚠️ Please write subject and description.', 'error');
                                  return;
                                }

                                const newTicket = {
                                  id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
                                  subject: newTicketSubject,
                                  category: newTicketCategory,
                                  priority: newTicketPriority,
                                  status: 'OPEN',
                                  date: new Date().toISOString().split('T')[0],
                                  messages: [
                                    { sender: 'customer', text: newTicketMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                  ]
                                };

                                setSupportTickets(prev => [newTicket, ...prev]);
                                setSelectedSupportTicket(newTicket);
                                triggerToast('✓ Support ticket dispatched to Hofuf offices.', 'success');
                                setNewTicketSubject('');
                                setNewTicketMsg('');
                              }}
                              className="space-y-3.5 font-sans text-xs"
                            >
                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block">Query Subject</label>
                                <input
                                  type="text"
                                  required
                                  value={newTicketSubject}
                                  onChange={(e) => setNewTicketSubject(e.target.value)}
                                  placeholder="e.g. Bespoke measurements change"
                                  className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35 text-xs"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block">Category</label>
                                  <select
                                    value={newTicketCategory}
                                    onChange={(e) => setNewTicketCategory(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35 text-[10px]"
                                  >
                                    <option value="Bespoke Fitting">Stitching</option>
                                    <option value="Order Logistics">Shipping</option>
                                    <option value="Billing Enquiry">Billing</option>
                                    <option value="Private Assembly">Private Meet</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block">Access Tier</label>
                                  <select
                                    value={newTicketPriority}
                                    onChange={(e) => setNewTicketPriority(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35 text-[10px]"
                                  >
                                    <option value="VIP Priority">Sovereign VIP</option>
                                    <option value="Urgent Dispatch">Urgent Priority</option>
                                    <option value="Standard Consult">Standard Care</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono block">Detailed Message</label>
                                <textarea
                                  rows={3}
                                  required
                                  value={newTicketMsg}
                                  onChange={(e) => setNewTicketMsg(e.target.value)}
                                  placeholder="Describe your inquiry with coordinate precision..."
                                  className="w-full bg-black border border-white/10 rounded-xs p-2 text-white focus:outline-none focus:border-[#D4AF37]/35 text-xs resize-none"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                              >
                                Dispatch Ticket
                              </button>
                            </form>
                          </div>

                          {/* Tickets Ledger List */}
                          <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-4 space-y-3">
                            <h4 className="text-white text-[10px] uppercase font-mono tracking-widest border-b border-white/5 pb-2">
                              Your Active Tickets
                            </h4>

                            {supportTickets.length === 0 ? (
                              <p className="text-zinc-600 text-xs text-center py-2">No tickets active.</p>
                            ) : (
                              <div className="space-y-2">
                                {supportTickets.map((tck) => (
                                  <button
                                    key={tck.id}
                                    onClick={() => setSelectedSupportTicket(tck)}
                                    className={`w-full text-left p-3 border rounded-xs transition-all flex flex-col gap-1 cursor-pointer ${
                                      selectedSupportTicket?.id === tck.id
                                        ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                                        : 'border-white/5 bg-black hover:border-white/10'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className="text-zinc-500 font-mono text-[8px]">{tck.id}</span>
                                      <span className={`px-1.5 py-0.5 rounded-sm font-mono text-[7px] font-bold ${
                                        tck.status === 'OPEN' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-zinc-900 text-zinc-400'
                                      }`}>
                                        {tck.status}
                                      </span>
                                    </div>
                                    <span className="text-white text-[10px] font-semibold truncate uppercase tracking-wide block font-sans">{tck.subject}</span>
                                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase mt-1">
                                      <span>{tck.category}</span>
                                      <span>{tck.date}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Detailed Chat Interface */}
                        <div className="lg:col-span-2 flex flex-col justify-between bg-black/40 border border-white/5 rounded-xs p-4 h-[440px] relative">
                          {selectedSupportTicket ? (
                            <>
                              {/* Chat Header */}
                              <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#D4AF37] text-[11px] uppercase font-bold tracking-wider font-sans">{selectedSupportTicket.subject}</span>
                                    <span className="text-zinc-500 font-mono text-[8px] bg-white/5 px-1 rounded-sm">{selectedSupportTicket.id}</span>
                                  </div>
                                  <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">{selectedSupportTicket.category} • {selectedSupportTicket.priority}</span>
                                </div>
                              </div>

                              {/* Chat Message Lists */}
                              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 scrollbar-thin">
                                {selectedSupportTicket.messages.map((msg: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className={`flex flex-col max-w-[80%] ${
                                      msg.sender === 'customer' ? 'ml-auto items-end' : 'mr-auto items-start'
                                    }`}
                                  >
                                    <div className={`p-3 rounded-xs text-xs font-sans leading-relaxed ${
                                      msg.sender === 'customer'
                                        ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/35 text-white rounded-tr-none'
                                        : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-tl-none'
                                    }`}>
                                      {msg.text}
                                    </div>
                                    <span className="text-[7.5px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">{msg.sender === 'customer' ? 'You' : 'ZOAL Concierge'} • {msg.time}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Chat Input form */}
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  if (!chatInput.trim()) return;

                                  const userMsgText = chatInput;
                                  const userMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                  // Update support ticket record in-place
                                  const updated = {
                                    ...selectedSupportTicket,
                                    messages: [...selectedSupportTicket.messages, { sender: 'customer', text: userMsgText, time: userMsgTime }]
                                  };

                                  setSupportTickets(prev => prev.map(t => t.id === selectedSupportTicket.id ? updated : t));
                                  setSelectedSupportTicket(updated);
                                  setChatInput('');

                                  // Trigger smart delayed butler response
                                  setTimeout(() => {
                                    let reply = 'We are attending to your request immediately. Your thobe stitches are being verified by Al Hofuf masters.';
                                    if (userMsgText.toLowerCase().includes('measure') || userMsgText.toLowerCase().includes('size')) {
                                      reply = 'Understood, Your Excellency. Your measurement coordinates are fully certified. Our tailors have locked these dimensions.';
                                    } else if (userMsgText.toLowerCase().includes('delivery') || userMsgText.toLowerCase().includes('ship') || userMsgText.toLowerCase().includes('track')) {
                                      reply = 'Greetings. Your premium logistical dispatch has been routed via priority secure courier. It is expected to arrive within 2 business days.';
                                    } else if (userMsgText.toLowerCase().includes('gold') || userMsgText.toLowerCase().includes('thread') || userMsgText.toLowerCase().includes('zari')) {
                                      reply = 'Rest assured, our premium thobes utilize 100% genuine silver zari threads double-plated with 18-carat gold imported directly from Germany.';
                                    }

                                    const butlerMsgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const addedButler = {
                                      ...updated,
                                      messages: [...updated.messages, { sender: 'concierge', text: reply, time: butlerMsgTime }]
                                    };

                                    setSupportTickets(prev => prev.map(t => t.id === selectedSupportTicket.id ? addedButler : t));
                                    setSelectedSupportTicket(addedButler);
                                  }, 1200);
                                }}
                                className="border-t border-white/5 pt-3 flex gap-2"
                              >
                                <input
                                  type="text"
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  placeholder="Type secure response to concierge tailors..."
                                  className="flex-1 bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35 font-sans"
                                />
                                <button
                                  type="submit"
                                  className="px-4 py-2 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
                                >
                                  Send
                                </button>
                              </form>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-2 text-center py-10 font-sans">
                              <Mail className="w-8 h-8 text-zinc-700 animate-pulse" />
                              <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider">No Ticket Selected</h4>
                              <p className="text-zinc-600 text-[11px] max-w-xs font-sans">Select or summon a secure connection line with our master tailors to inspect and review your orders.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 13: PREMIUM INVOICES TABLE LEDGER */}
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
                                <span className="text-[8px] font-mono text-zinc-500 tracking-[0.4em] uppercase block">Bespoke House of Excellence</span>
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
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500 block">From: Bespoke House</span>
                              <p className="font-bold text-white uppercase text-[9.5px]">{settings.businessName.toUpperCase()}</p>
                              <p>{settings.address}</p>
                              <p className="font-mono">Email: {settings.email} • Phone: {settings.phone}</p>
                              <p className="font-mono">VAT ID: 31002931500003</p>
                            </div>
                            <div className="space-y-1.5 sm:text-right">
                              <span className="text-[8.5px] uppercase font-mono tracking-widest text-zinc-500 block">Bill To Recipient:</span>
                              <p className="font-bold text-white uppercase text-[9.5px]">{currentUser?.name}</p>
                              <p>{currentUser?.address || 'King Fahd Road, Al Hofuf'}</p>
                              <p className="font-mono">Phone: {currentUser?.phone || '+966 56 769 9315'}</p>
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
                                    <td className="py-3 font-semibold text-white uppercase text-[10px] tracking-wide">Royal Sovereign Bisht Thobe</td>
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
                              <p className="text-[10px]">All thobes are stitched with genuine double-gilt German metallic wire. Returns on bespoke fittings are accommodated via private tailors alteration consultation only.</p>
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
                            <span>Secured Cryptographic Invoice Ledger</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  window.print();
                                }}
                                className="px-3 py-1.5 bg-white text-black font-sans font-bold uppercase rounded-sm hover:bg-[#D4AF37] transition-all cursor-pointer"
                              >
                                Print Invoice
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
                        <div className="bg-[#060606]/60 border border-white/5 rounded-xs p-5 space-y-4">
                          <h3 className="text-[#D4AF37] text-[11px] uppercase font-display font-bold tracking-widest border-b border-white/5 pb-2.5 flex items-center gap-2 font-mono">
                            <FileText className="w-4 h-4 text-[#D4AF37]" /> Royal Treasury Invoices & Receipts Ledger
                          </h3>
                          <p className="text-zinc-500 text-xs font-sans leading-relaxed">
                            View itemized Tax Invoices with Saudi VAT calculation standards. Click on an order invoice below to view or print the document.
                          </p>

                          {customerOrders.length === 0 ? (
                            <div className="p-10 border border-dashed border-white/5 rounded-xs text-center space-y-2">
                              <FileText className="w-6 h-6 text-zinc-600 mx-auto animate-pulse" />
                              <h4 className="text-zinc-500 font-semibold text-xs uppercase font-mono tracking-widest">No Invoice History</h4>
                              <p className="text-zinc-600 text-xs font-sans max-w-xs mx-auto">Complete checkout or purchase a luxury product to generate invoices on servers.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-white/5 text-zinc-500 uppercase font-mono text-[8.5px] tracking-widest py-2">
                                    <th className="py-3 px-2">Invoice ID</th>
                                    <th className="py-3 px-2">Date Issued</th>
                                    <th className="py-3 px-2">Order Reference</th>
                                    <th className="py-3 px-2 text-right">Total (SAR)</th>
                                    <th className="py-3 px-2 text-center">Status</th>
                                    <th className="py-3 px-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                                  {customerOrders.map((ord) => (
                                    <tr key={ord.id} className="hover:bg-white/[0.02]">
                                      <td className="py-3 px-2 text-white font-semibold">INV-{ord.id}</td>
                                      <td className="py-3 px-2 text-zinc-400">{ord.date || new Date().toISOString().substring(0, 10)}</td>
                                      <td className="py-3 px-2 text-[#D4AF37]">{ord.id}</td>
                                      <td className="py-3 px-2 text-right text-white font-bold">{ord.totalPrice.toFixed(2)}</td>
                                      <td className="py-3 px-2 text-center">
                                        <span className="px-2 py-0.5 rounded-sm bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 font-bold text-[8px] uppercase tracking-wider">
                                          PAID
                                        </span>
                                      </td>
                                      <td className="py-3 px-2 text-right">
                                        <button
                                          onClick={() => {
                                            setSelectedInvoice(ord);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-[#D4AF37] hover:text-black border border-white/10 text-zinc-300 text-[8.5px] font-sans font-bold uppercase rounded-sm transition-all cursor-pointer"
                                        >
                                          View Invoice
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
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
                <span className="text-3xl font-mono text-white font-bold block">{groupMetrics.clientCount} Registered Customers</span>
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
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Customers</span>
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
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-widest">Customers</span>
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
