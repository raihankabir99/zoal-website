import React, { useState, useMemo } from 'react';
import {
  User, Shield, Landmark, Bookmark, BarChart3, Package, Truck, Compass,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check, Mail, PackageCheck, LogOut,
  Lock, Menu, ChevronRight, ArrowLeft, Search, Filter, Trash2, Edit3, Download, FileText, Printer, CheckCircle2, AlertCircle, Loader2,
  Database, Copy, Server, Camera, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Order, CartItem, Branch } from '../types';
import { useGlobalProducts, updateProductInventory } from '../imageRegistry';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { formatCurrency } from '../utils';
import EnterpriseOrderManagement, { generatePrintableInvoiceHtml, generatePrintableReceiptHtml } from './EnterpriseOrderManagement';
import { downloadHtmlAsPdf } from '../lib/pdf';
import EnterpriseInventoryManagement from './EnterpriseInventoryManagement';

interface StaffDashboardProps {
  currentUser: any;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onLogout?: () => void;
  deliveryZones?: any[];
  onUpdateDeliveryZones?: (zones: any[]) => void;
  shippingConfig: any;
  setLocalShippingConfig: (config: any) => void;
  saveShippingConfig: (config: any) => void;
  returnsConfig: any;
  setLocalReturnsConfig: (config: any) => void;
  saveReturnsConfig: (config: any) => void;
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

export default function StaffDashboard({
  currentUser,
  orders,
  setOrders,
  onUpdateOrderStatus,
  onLogout,
  deliveryZones = [],
  onUpdateDeliveryZones,
  shippingConfig,
  setLocalShippingConfig,
  saveShippingConfig,
  returnsConfig,
  setLocalReturnsConfig,
  saveReturnsConfig,
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
}: StaffDashboardProps) {
  const allProducts = useGlobalProducts();
  const userRole = currentUser ? currentUser.role || 'customer' : null;

  const [staffSubTab, setStaffSubTab] = useState<string>('overview');
  const [staffSidebarOpen, setStaffSidebarOpen] = useState(false);
  const [selectedStaffOrder, setSelectedStaffOrder] = useState<Order | null>(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Search/Filters
  const [staffOrderSearch, setStaffOrderSearch] = useState('');
  const [staffOrderStatusFilter, setStaffOrderStatusFilter] = useState<string>('all');
  const [staffProductSearch, setStaffProductSearch] = useState('');
  const [staffInventoryFilter, setStaffInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [staffCustomerSearch, setStaffCustomerSearch] = useState('');

  const [staffDutyStatus, setStaffDutyStatus] = useState<'active' | 'break' | 'offline'>(() => {
    return (localStorage.getItem('zoal_staff_duty_status') as any) || 'active';
  });

  // Simulated Logs
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

  // Simulated Notifications
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

  // Derived Customers
  const uniqueCustomers = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      if (!map.has(o.phone)) {
        map.set(o.phone, {
          name: o.customerName,
          phone: o.phone,
          email: `${o.customerName.toLowerCase().replace(/\s+/g, '')}@zoal-customer.sa`,
          address: o.address,
          totalOrders: orders.filter(x => x.phone === o.phone).length,
          totalSpent: orders.filter(x => x.phone === o.phone).reduce((sum, ord) => sum + ord.total, 0),
          status: 'Active VIP'
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  const simulatedEmployeesCount = 4;

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Top Navigation & Status bar */}
      <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setStaffSidebarOpen(!staffSidebarOpen); }}
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
            aria-label="Open Staff Sidebar Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-all duration-300 group cursor-pointer"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[9px] uppercase tracking-widest font-bold">Back</span>
            </button>
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono">
              <span>Al Zoal Staff Command</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-[#D4AF37] font-semibold">
                {staffSubTab === 'overview' ? 'Overview Dashboard' :
                 staffSubTab === 'orders' ? (selectedStaffOrder ? 'Order Detail Drawer' : 'All Orders') :
                 staffSubTab === 'inventory' ? 'Inventory Manager' :
                 staffSubTab === 'catalog' ? 'Premium Catalog' :
                 staffSubTab === 'customers' ? 'Customer Directory' :
                 staffSubTab === 'alerts' ? 'Alerts Feed' :
                 staffSubTab === 'profile' ? 'Profile & Settings' :
                 staffSubTab === 'admin' ? 'Admin Hub' : 'Management'}
              </span>
            </div>
          </div>
        </div>

        {/* Status and Action Panel */}
        <div className="flex items-center justify-end gap-3.5 font-sans">
          {/* Duty Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-white/5 bg-black text-[9px] uppercase tracking-wider font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${
              staffDutyStatus === 'active' ? 'bg-emerald-500 animate-pulse' :
              staffDutyStatus === 'break' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-600'
            }`} />
            <span className="text-zinc-400">Duty:</span>
            <span className={
              staffDutyStatus === 'active' ? 'text-emerald-400 font-bold' :
              staffDutyStatus === 'break' ? 'text-amber-400 font-bold' : 'text-zinc-500 font-bold'
            }>
              {staffDutyStatus === 'active' ? 'ACTIVE ON-DUTY' :
               staffDutyStatus === 'break' ? 'ON BREAK/REST' : 'SESSION OFFLINE'}
            </span>
          </div>

          {/* Notification Badge Bell */}
          <button
            onClick={() => { setStaffSubTab('alerts'); setSelectedStaffOrder(null); }}
            className="relative p-2 bg-black hover:bg-zinc-900 border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs transition-all cursor-pointer group"
            title="System Alerts Feed"
          >
            <Bell className="w-3.5 h-3.5 group-hover:animate-swing" />
            {staffNotifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#D4AF37] text-black font-mono font-bold text-[8.5px] flex items-center justify-center rounded-full animate-bounce">
                {staffNotifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {/* Profile quick dropdown */}
          <div className="relative group/staff select-none">
            <div className="flex items-center gap-2 p-1 px-2.5 bg-black hover:bg-zinc-900 border border-white/5 rounded-xs cursor-pointer duration-300">
              <div className="w-5 h-5 rounded-full border border-[#D4AF37] bg-zinc-900 flex items-center justify-center text-[10px] text-[#D4AF37]">
                💼
              </div>
              <span className="text-[9.5px] font-semibold text-zinc-300 uppercase tracking-wider truncate max-w-[90px] hidden sm:block">
                {currentUser ? (currentUser.name || 'Staff').split(' ')[0] : 'Staff'}
              </span>
            </div>

            <div className="absolute right-0 top-full mt-1.5 w-44 bg-zinc-950 border border-white/5 rounded-sm shadow-xl opacity-0 pointer-events-none group-hover/staff:opacity-100 group-hover/staff:pointer-events-auto transition-all duration-200 z-50 p-1">
              <div className="p-1.5 border-b border-white/5 text-left mb-1">
                <p className="text-[10px] text-white font-semibold truncate mb-0.5">{currentUser?.name || 'Staff'}</p>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">{userRole} account</span>
              </div>
              <div className="border-t border-white/5 my-1 pt-1">
                <button
                  onClick={() => { if (onLogout) onLogout(); }}
                  className="w-full text-left py-1 px-2 text-[9px] uppercase tracking-wider text-rose-500 hover:bg-rose-950/20 rounded-xs transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Management */}
      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        
        {/* 1. SIDEBAR NAVIGATION PANEL */}
        <div className="hidden lg:block w-64 shrink-0 bg-zinc-950 border border-white/5 rounded-sm p-4 space-y-1.5 font-sans">
          <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 font-mono block px-3 pb-2 border-b border-white/5 mb-3">
            Staff Suite
          </span>
          
          <div className="space-y-1">
            <button
              onClick={() => { setStaffSubTab('overview'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'overview' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" /> Overview Dashboard
            </button>

            <button
              onClick={() => { setStaffSubTab('orders'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'orders' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" /> All Orders
            </button>

            <button
              onClick={() => { setStaffSubTab('inventory'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'inventory' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5 shrink-0" /> Inventory Manager
            </button>

            <button
              onClick={() => { setStaffSubTab('catalog'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'catalog' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 shrink-0" /> Premium Catalog
            </button>

            <button
              onClick={() => { setStaffSubTab('customers'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'customers' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" /> Customer Directory
            </button>

            <button
              onClick={() => { setStaffSubTab('alerts'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center justify-between ${
                staffSubTab === 'alerts' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-3.5 h-3.5 shrink-0" /> Alerts Feed
              </div>
              {staffNotifications.filter(n => !n.read).length > 0 && (
                <span className={`px-1.5 py-0.5 font-mono text-[8.5px] rounded-xs ${
                  staffSubTab === 'alerts' ? 'bg-black text-[#D4AF37]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                }`}>
                  {staffNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setStaffSubTab('profile'); setSelectedStaffOrder(null); }}
              className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                staffSubTab === 'profile' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <User className="w-3.5 h-3.5 shrink-0" /> Profile & Settings
            </button>
          </div>

          {userRole === 'admin' && (
            <div className="pt-4 mt-4 border-t border-white/5 space-y-1">
              <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-600 font-mono block px-3 pb-1">
                Admin Panel
              </span>
              <button
                onClick={() => { setStaffSubTab('admin'); setSelectedStaffOrder(null); }}
                className={`w-full text-left py-2 px-3 text-[10.5px] uppercase tracking-wider font-display rounded-xs transition-all flex items-center gap-2.5 ${
                  staffSubTab === 'admin' ? 'bg-[#D4AF37] text-black font-semibold shadow-md' : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" /> Admin Hub (SLA & DB)
              </button>
            </div>
          )}
        </div>

        {/* MOBILE SIDEBAR PANEL (Collapsible Overlay) */}
        <AnimatePresence>
          {staffSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setStaffSidebarOpen(false)}
                className="fixed inset-0 bg-black z-40 lg:hidden"
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed top-0 left-0 bottom-0 w-72 bg-zinc-950 border-r border-white/10 z-50 p-5 space-y-4 lg:hidden flex flex-col font-sans text-left"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[8px] tracking-[0.3em] text-[#D4AF37] uppercase font-mono block mb-0.5">Al Zoal Boutique</span>
                    <h4 className="text-sm font-semibold tracking-wide uppercase text-white">Staff Terminal</h4>
                  </div>
                  <button 
                    onClick={() => setStaffSidebarOpen(false)}
                    className="p-1.5 border border-white/5 hover:border-rose-500/30 text-zinc-400 hover:text-rose-500 rounded-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-grow space-y-1 overflow-y-auto">
                  <button
                    onClick={() => { setStaffSubTab('overview'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'overview' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" /> Overview Dashboard
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('orders'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'orders' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" /> All Orders
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('inventory'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'inventory' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4" /> Inventory Manager
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('catalog'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'catalog' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" /> Premium Catalog
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('customers'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'customers' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Customer Directory
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('alerts'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center justify-between ${
                      staffSubTab === 'alerts' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4" /> Alerts Feed
                    </div>
                    {staffNotifications.filter(n => !n.read).length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] rounded-xs font-mono font-bold">
                        {staffNotifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setStaffSubTab('profile'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                    className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                      staffSubTab === 'profile' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-400 hover:bg-white/[0.02]'
                    }`}
                  >
                    <User className="w-4 h-4" /> Profile & Settings
                  </button>

                  {userRole === 'admin' && (
                    <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
                      <span className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 block font-mono pl-3">Admin Gate</span>
                      <button
                        onClick={() => { setStaffSubTab('admin'); setStaffSidebarOpen(false); setSelectedStaffOrder(null); }}
                        className={`w-full text-left py-2 px-3 text-[11px] uppercase tracking-widest rounded-xs flex items-center gap-3 ${
                          staffSubTab === 'admin' ? 'bg-[#D4AF37] text-black font-bold' : 'text-zinc-500 hover:bg-white/[0.01]'
                        }`}
                      >
                        <Shield className="w-4 h-4" /> Admin Hub (SLA & DB)
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 text-xs text-zinc-500">
                  <p className="font-semibold text-zinc-400 truncate">{currentUser?.name}</p>
                  <p className="text-[9px] truncate font-mono">{currentUser?.email}</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-grow w-full space-y-6">

          {/* MODULE 1: OVERVIEW DASHBOARD */}
          {staffSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Performance metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-sm relative overflow-hidden flex flex-col justify-between h-28">
                  <ClipboardList className="w-5 h-5 text-[#D4AF37] absolute top-4 right-4" />
                  <div>
                    <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Outstanding Orders</span>
                    <span className="text-2xl font-mono text-white font-bold block leading-none">
                      {orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length} Active
                    </span>
                  </div>
                  <span className="text-[9px] text-[#D4AF37] block">Awaiting artisan dispatch</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-sm relative overflow-hidden flex flex-col justify-between h-28">
                  <PackageCheck className="w-5 h-5 text-rose-500 absolute top-4 right-4" />
                  <div>
                    <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Critical Stock Alerts</span>
                    <span className={`text-2xl font-mono font-bold block leading-none ${
                      allProducts.filter(p => p.inventory < 15).length > 0 ? 'text-rose-500 animate-pulse' : 'text-white'
                    }`}>
                      {allProducts.filter(p => p.inventory < 15).length} Items
                    </span>
                  </div>
                  <span className="text-[9px] text-rose-400 block font-mono">Stock level under 15 units</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-sm relative overflow-hidden flex flex-col justify-between h-28">
                  <Bookmark className="w-5 h-5 text-indigo-400 absolute top-4 right-4" />
                  <div>
                    <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Tailoring Requests</span>
                    <span className="text-2xl font-mono text-white font-bold block leading-none">3 Active</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 block font-mono">Premium custom thobe cuts</span>
                </div>

                <div className="bg-zinc-950 border border-[#D4AF37]/10 p-4 rounded-sm relative overflow-hidden flex flex-col justify-between h-28 bg-[#D4AF37]/[0.01]">
                  <Clock className="w-5 h-5 text-[#D4AF37] absolute top-4 right-4" />
                  <div>
                    <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 block mb-1 font-mono">Duty Portal Status</span>
                    <span className="text-lg font-mono text-white font-bold block leading-none uppercase">
                      {staffDutyStatus} Duty
                    </span>
                  </div>
                  <span className="text-[9px] text-emerald-400 block font-mono">Last status sync: Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Interactive SLA Efficiency Chart */}
                <div className="bg-[#060606] border border-white/5 rounded-sm p-5 space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="text-white text-[10.5px] font-display uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#D4AF37]" /> SLA Fulfillment Index (Weekly)
                    </h3>
                    <span className="text-[8px] uppercase font-mono tracking-wider text-zinc-500">Live operational times</span>
                  </div>

                  <div className="h-[210px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Mon', target: 100, active: 94 },
                        { name: 'Tue', target: 100, active: 96 },
                        { name: 'Wed', target: 100, active: 92 },
                        { name: 'Thu', target: 100, active: 98 },
                        { name: 'Fri', target: 100, active: 100 },
                        { name: 'Sat', target: 100, active: 95 },
                        { name: 'Sun', target: 100, active: 97 }
                      ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSla" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} axisLine={false} domain={[80, 105]} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px', color: '#fff' }} />
                        <Area type="monotone" dataKey="active" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSla)" name="Fulfillment %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Simulated Log Feed */}
                <div className="bg-[#060606] border border-white/5 rounded-sm p-5 flex flex-col justify-between">
                  <div className="space-y-3.5 w-full">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-white text-[10.5px] font-display uppercase tracking-widest flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5 text-[#D4AF37]" /> Activity Log
                      </h4>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">Per Session</span>
                    </div>

                    <div className="divide-y divide-white/5 space-y-2 max-h-[190px] overflow-y-auto pr-1">
                      {staffLogs.map((log: any) => (
                        <div key={log.id} className="pt-2 text-left">
                          <div className="flex justify-between items-center text-[10px] text-zinc-300 font-sans leading-tight">
                            <span className="font-semibold text-[#D4AF37]">{log.action}</span>
                            <span className="text-[8.5px] font-mono text-zinc-500">{log.timestamp.split(',')[1] || log.timestamp}</span>
                          </div>
                          <p className="text-[9.5px] text-zinc-400 font-sans mt-0.5 truncate">{log.target}</p>
                          <span className="text-[7.5px] font-mono text-zinc-600 block uppercase">staff: {log.staff} • IP: {log.ip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Log Action */}
                  <div className="pt-3.5 border-t border-white/5 flex gap-2">
                    <input 
                      type="text" 
                      id="custom_staff_note"
                      placeholder="Type a quick session note..."
                      className="flex-grow bg-black border border-white/5 rounded-xs px-2.5 py-1.5 text-[10.5px] text-white focus:outline-none focus:border-[#D4AF37]/35"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const el = e.currentTarget;
                          if (el.value.trim()) {
                            addStaffLog('Note Registered', el.value.trim());
                            el.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById('custom_staff_note') as HTMLInputElement;
                        if (el && el.value.trim()) {
                          addStaffLog('Note Registered', el.value.trim());
                          el.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-[#D4AF37] hover:bg-white text-black text-[9px] font-bold uppercase rounded-xs transition-colors cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: ORDERS LEDGER */}
          {staffSubTab === 'orders' && (
            <EnterpriseOrderManagement
              currentUser={currentUser}
              orders={orders}
              setOrders={setOrders}
            />
          )}

          {/* DEPRECATED STAFF ORDER VIEW */}
          {false && staffSubTab === 'orders' && (
            <div className="space-y-6 font-sans">
              {/* Filter and Search Bar */}
              <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Search Orders (ID, Name, Phone)..."
                    value={staffOrderSearch}
                    onChange={(e) => setStaffOrderSearch(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-xs pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/35 font-sans animate-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto self-start sm:self-center">
                  <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <select
                    value={staffOrderStatusFilter}
                    onChange={(e) => setStaffOrderStatusFilter(e.target.value)}
                    className="bg-black border border-white/5 rounded-xs px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none font-sans"
                  >
                    <option value="all">All States</option>
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <span className="text-[10px] text-zinc-500 ml-auto font-mono hidden md:block">
                  {orders.length} orders total
                </span>
              </div>

              {/* Table View */}
              <div className="bg-[#060606] border border-white/5 rounded-sm p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="py-3 pl-2">Order ID</th>
                        <th className="py-3">Client details</th>
                        <th className="py-3">Branch / Zone</th>
                        <th className="py-3">Total Sum</th>
                        <th className="py-3">Current Status</th>
                        <th className="py-3">VIP SLA Clock</th>
                        <th className="py-3 text-right pr-2">Action Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders
                        .filter(o => {
                          const matchSearch = o.id.toLowerCase().includes(staffOrderSearch.toLowerCase()) || 
                                              o.customerName.toLowerCase().includes(staffOrderSearch.toLowerCase()) ||
                                              o.phone.includes(staffOrderSearch);
                          const matchFilter = staffOrderStatusFilter === 'all' || o.status === staffOrderStatusFilter;
                          return matchSearch && matchFilter;
                        })
                        .map((ord) => {
                          const isVipSla = ord.total > 1500 || ord.customerName.toLowerCase().includes('roy') || ord.customerName.toLowerCase().includes('kabir');
                          return (
                            <tr 
                              key={ord.id} 
                              onClick={() => setSelectedStaffOrder(ord)}
                              className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${
                                selectedStaffOrder?.id === ord.id ? 'bg-white/[0.03]' : ''
                              }`}
                            >
                              <td className="py-4 pl-2 font-mono font-bold text-[#D4AF37]">{ord.id}</td>
                              <td className="py-4 text-left">
                                <p className="font-semibold text-zinc-200">{ord.customerName}</p>
                                <p className="text-[10px] text-zinc-500">{ord.phone}</p>
                              </td>
                              <td className="py-4 text-left font-sans text-zinc-400">
                                <span className="block text-[11px] text-zinc-300 font-medium">{(ord as any).city || 'Branch B Main'}</span>
                                <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{(ord as any).method || 'Standard Ship'}</span>
                              </td>
                              <td className="py-4 text-left font-mono font-bold text-zinc-300">{formatCurrency(ord.total)} SAR</td>
                              <td className="py-4 text-left">
                                <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-widest font-semibold ${
                                  ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' :
                                  ord.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                                  ord.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                                  'bg-amber-950 text-amber-400 animate-pulse'
                                }`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-4 text-left font-mono text-[10px]">
                                {isVipSla ? (
                                  <span className="text-[#D4AF37] font-semibold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-[#D4AF37] animate-pulse" /> VIP SLA: &lt;5 hrs
                                  </span>
                                ) : (
                                  <span className="text-zinc-500">Standard SLA</span>
                                )}
                              </td>
                              <td className="py-4 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1.5">
                                  {['Pending', 'Preparing', 'Shipped'].includes(ord.status) && (
                                    <button
                                      onClick={() => {
                                        const states: Order['status'][] = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                                        const currIdx = states.indexOf(ord.status);
                                        if (currIdx < states.length - 1) {
                                          const nextState = states[currIdx + 1];
                                          onUpdateOrderStatus(ord.id, nextState);
                                          addStaffLog('Advance State', `Order ${ord.id} advanced to ${nextState.toUpperCase()}`);
                                        }
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-[#D4AF37] text-black rounded-xs text-[8.5px] font-bold uppercase transition-all flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5" /> Advance
                                    </button>
                                  )}
                                  {ord.status !== 'Cancelled' && ord.status !== 'Completed' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you absolutely sure you want to cancel order ${ord.id}?`)) {
                                          onUpdateOrderStatus(ord.id, 'Cancelled');
                                          addStaffLog('Cancel Order', `Order ${ord.id} has been cancelled`);
                                        }
                                      }}
                                      className="px-1.5 py-1 bg-rose-950/40 hover:bg-rose-600 border border-rose-500/10 hover:text-white rounded-xs text-[8.5px] uppercase transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Order Drawer/Modal */}
              <AnimatePresence>
                {selectedStaffOrder && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0c0c0e] border border-[#D4AF37]/15 rounded-sm p-6 space-y-4 text-left relative shadow-xl font-sans"
                  >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#D4AF37]"></div>
                    <button 
                      onClick={() => setSelectedStaffOrder(null)}
                      className="absolute top-4 right-4 p-1 border border-white/5 hover:border-white/10 rounded-xs text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="border-b border-white/5 pb-4">
                      <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-1">Detailed Order Drawer</span>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <h3 className="text-white text-base font-bold font-mono">Order {selectedStaffOrder.id}</h3>
                        <span className={`px-2.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-semibold font-mono ${
                          selectedStaffOrder.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' :
                          selectedStaffOrder.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                          selectedStaffOrder.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                          'bg-amber-950 text-amber-400 animate-pulse'
                        }`}>
                          Status: {selectedStaffOrder.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      {/* Customer info */}
                      <div className="space-y-4">
                        <div className="p-4 border border-white/5 bg-zinc-950/30 rounded-xs space-y-2">
                          <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Customer Credentials
                          </h4>
                          <p className="text-zinc-200 font-semibold text-sm leading-snug">{selectedStaffOrder.customerName}</p>
                          <p className="text-zinc-400 leading-tight">Phone: <span className="font-mono text-zinc-300 font-medium">{selectedStaffOrder.phone}</span></p>
                          <p className="text-zinc-400 leading-tight">Email: <span className="font-mono text-zinc-300 font-medium">{selectedStaffOrder.email}</span></p>
                        </div>

                        <div className="p-4 border border-white/5 bg-zinc-950/30 rounded-xs space-y-2">
                          <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> Luxury Delivery Destination
                          </h4>
                          <p className="text-zinc-300 font-medium leading-normal">{selectedStaffOrder.city || 'Branch B Main'}</p>
                          <p className="text-zinc-400 leading-relaxed font-sans">{selectedStaffOrder.address || 'Saudi Arabia VIP Delivery Address'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">Method: {selectedStaffOrder.method || 'Standard Courier'}</p>
                        </div>
                      </div>

                      {/* Products list */}
                      <div className="space-y-4">
                        <div className="p-4 border border-white/5 bg-zinc-950/30 rounded-xs space-y-3">
                          <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-white/5 pb-1 flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5" /> Registered Basket Items
                          </h4>
                          <div className="divide-y divide-white/5 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {selectedStaffOrder.items && selectedStaffOrder.items.length > 0 ? (
                              selectedStaffOrder.items.map((itm: CartItem, idx) => (
                                <div key={idx} className="pt-2 flex items-center justify-between">
                                  <div className="text-left">
                                    <p className="text-zinc-200 font-medium">{itm.product.name}</p>
                                    <p className="text-zinc-500 text-[10px] font-mono">Qty: {itm.quantity} • {formatCurrency(itm.product.price)} SAR</p>
                                  </div>
                                  <span className="font-mono text-[#D4AF37] font-semibold text-xs">
                                    {formatCurrency(itm.product.price * itm.quantity)} SAR
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="text-zinc-500 py-4 text-center font-sans">No catalog items defined</div>
                            )}
                          </div>
                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                            <span className="text-zinc-400">Total Purchase Value</span>
                            <span className="text-white font-mono text-base font-bold">{formatCurrency(selectedStaffOrder.total)} SAR</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-display">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const mockInvoice = {
                                invoiceNumber: `INV-${selectedStaffOrder.id}`,
                                invoiceDate: selectedStaffOrder.date || new Date().toLocaleDateString(),
                                merchantName: 'AL ZOAL ENTERPRISE',
                                merchantVat: '310239485700003',
                                orderId: selectedStaffOrder.id,
                                paymentId: `pay_${selectedStaffOrder.id}`,
                                gateway: selectedStaffOrder.paymentMethod || 'Mada Card',
                                transactionId: `txn_${selectedStaffOrder.id}`,
                                subtotal: selectedStaffOrder.total / 1.15,
                                vat: selectedStaffOrder.total - (selectedStaffOrder.total / 1.15),
                                discount: 0,
                                delivery: 0,
                                total: selectedStaffOrder.total,
                                items: selectedStaffOrder.items || []
                              };
                              printWindow.document.write(generatePrintableInvoiceHtml(mockInvoice));
                              printWindow.document.close();
                              printWindow.print();
                              addStaffLog('Invoice Printed', `Printed dispatch sheet for ${selectedStaffOrder.id}`);
                            }
                          }}
                          className="px-4 py-2 border border-white/10 hover:border-[#D4AF37]/35 text-zinc-300 hover:text-white rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#D4AF37]" /> Print Dispatch Sheet
                        </button>

                        <button
                          onClick={() => {
                            const mockInvoice = {
                              invoiceNumber: `INV-${selectedStaffOrder.id}`,
                              invoiceDate: selectedStaffOrder.date || new Date().toLocaleDateString(),
                              merchantName: 'AL ZOAL ENTERPRISE',
                              merchantVat: '310239485700003',
                              orderId: selectedStaffOrder.id,
                              paymentId: `pay_${selectedStaffOrder.id}`,
                              gateway: selectedStaffOrder.paymentMethod || 'Mada Card',
                              transactionId: `txn_${selectedStaffOrder.id}`,
                              subtotal: selectedStaffOrder.total / 1.15,
                              vat: selectedStaffOrder.total - (selectedStaffOrder.total / 1.15),
                              discount: 0,
                              delivery: 0,
                              total: selectedStaffOrder.total,
                              items: selectedStaffOrder.items || []
                            };
                            const html = generatePrintableInvoiceHtml(mockInvoice);
                            downloadHtmlAsPdf(html, `ALZOAL-INVOICE-${mockInvoice.invoiceNumber}.pdf`);
                            addStaffLog('Invoice Downloaded', `Downloaded PDF invoice for ${selectedStaffOrder.id}`);
                          }}
                          className="px-4 py-2 border border-white/10 hover:border-[#D4AF37]/35 text-zinc-300 hover:text-white rounded-xs transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" /> Download Invoice
                        </button>
                      </div>

                      <div className="flex gap-2">
                        {['Pending', 'Preparing', 'Shipped'].includes(selectedStaffOrder.status) && (
                          <button
                            onClick={() => {
                              const states: Order['status'][] = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                              const currIdx = states.indexOf(selectedStaffOrder.status);
                              if (currIdx < states.length - 1) {
                                const next = states[currIdx + 1];
                                onUpdateOrderStatus(selectedStaffOrder.id, next);
                                setSelectedStaffOrder({ ...selectedStaffOrder, status: next });
                                addStaffLog('Advance State', `Order ${selectedStaffOrder.id} advanced to ${next.toUpperCase()}`);
                              }
                            }}
                            className="px-5 py-2 bg-white hover:bg-[#D4AF37] text-black font-bold uppercase rounded-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Advance State
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* MODULE 3: INVENTORY MANAGER */}
          {staffSubTab === 'inventory' && (
            <EnterpriseInventoryManagement
              currentUser={currentUser}
              products={allProducts}
              orders={orders}
              setOrders={setOrders}
            />
          )}

          {/* MODULE 4: PREMIUM CATALOG */}
          {staffSubTab === 'catalog' && (
            <div className="space-y-6">
              <div className="bg-[#060606] border border-white/5 rounded-sm p-5 space-y-4 text-left font-sans">
                <div className="border-b border-white/5 pb-3">
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-0.5">Luxury Tailoring</span>
                  <h3 className="text-white text-base font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Bookmark className="w-4.5 h-4.5 text-[#D4AF37]" /> Customer Tailoring Customization List
                  </h3>
                </div>

                <div className="divide-y divide-white/5 space-y-4">
                  {[
                    { id: 'ORD-7491', customerName: 'Raihan Kabir', product: 'White Brocade Thobe', measures: 'Length: 58.5", Chest: 44", Shoulder: 18.2", Sleeve: 24.5"', status: 'Artisan Assembly Draft', date: '10 mins ago' },
                    { id: 'ORD-6382', customerName: 'Prince Khalid Al-Saud', product: 'Imperial Navy Cashmere Bisht', measures: 'Length: 60", Chest: 46", Shoulder: 19", Sleeve: 25.5"', status: 'Fabric Cutting Certified', date: '3 hours ago' },
                    { id: 'ORD-9481', customerName: 'Dr. Faisal Branch A', product: 'Golden Sand Silk Linen Thobe', measures: 'Length: 59", Chest: 45", Shoulder: 18.5", Sleeve: 25"', status: 'Double Stitch Quality Check', date: '2 days ago' }
                  ].map((bsp) => (
                    <div key={bsp.id} className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#D4AF37] font-bold">{bsp.id}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-white font-semibold">{bsp.customerName}</span>
                        </div>
                        <p className="text-zinc-300 font-medium">{bsp.product}</p>
                        <p className="text-zinc-400 font-mono text-[10.5px] bg-zinc-950 p-2 border border-white/5 rounded-xs mt-1 leading-snug">{bsp.measures}</p>
                        <span className="text-[8px] text-zinc-500 font-mono uppercase block mt-1">SLA Assigned: Master Tailor • Received {bsp.date}</span>
                      </div>

                      <div className="text-right self-start sm:self-center shrink-0">
                        <p className="text-[10px] uppercase font-semibold text-[#D4AF37] mb-2 leading-none">{bsp.status}</p>
                        <button
                          onClick={() => {
                            alert(`Updating tailoring workflow progress for Order ${bsp.id}.\nAssigned Master Tailor successfully notified.`);
                            addStaffLog('Premium Advance', `Tailoring status advanced for ${bsp.id}`);
                          }}
                          className="px-3 py-1.5 border border-[#D4AF37]/25 hover:bg-[#D4AF37] text-zinc-300 hover:text-black rounded-xs transition-colors uppercase font-bold text-[9px]"
                        >
                          Advance Tailor Step
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 5: CUSTOMER DIRECTORY */}
          {staffSubTab === 'customers' && (
            <div className="space-y-6">
              {/* Search customer */}
              <div className="bg-zinc-950 border border-white/5 rounded-sm p-4 text-left">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input 
                    type="text" 
                    placeholder="Search customer directory..."
                    value={staffCustomerSearch}
                    onChange={(e) => setStaffCustomerSearch(e.target.value)}
                    className="w-full bg-black border border-white/5 rounded-xs pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/35 font-sans animate-none"
                  />
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-[#060606] border border-white/5 rounded-sm p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="py-3 pl-2">VIP Customer Name</th>
                        <th className="py-3">Contact Email</th>
                        <th className="py-3">Registered Mobile</th>
                        <th className="py-3">Total Orders Placed</th>
                        <th className="py-3">Total Spent</th>
                        <th className="py-3 text-right pr-2">Profile Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans text-zinc-300">
                      {uniqueCustomers
                        .filter(c => c.name.toLowerCase().includes(staffCustomerSearch.toLowerCase()) || c.phone.includes(staffCustomerSearch))
                        .map((c, i) => (
                          <tr key={i} className="hover:bg-white/[0.01]">
                            <td className="py-4 pl-2 font-semibold text-white text-left">{c.name}</td>
                            <td className="py-4 font-mono text-[11px] text-zinc-400 text-left">{c.email}</td>
                            <td className="py-4 font-mono text-[11px] text-zinc-400 text-left">{c.phone}</td>
                            <td className="py-4 text-left font-mono">{c.totalOrders} VIP Orders</td>
                            <td className="py-4 text-left font-mono font-bold text-[#D4AF37]">{formatCurrency(c.totalSpent)} SAR</td>
                            <td className="py-4 text-right pr-2">
                              <span className="px-2 py-0.5 bg-gold-pure/10 text-[#D4AF37] text-[8.5px] uppercase tracking-widest font-semibold border border-gold-pure/20 rounded-xs">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 6: ALERTS FEED */}
          {staffSubTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-[#060606] border border-white/5 rounded-sm p-5 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-0.5">Alerts</span>
                    <h3 className="text-white text-base font-semibold uppercase tracking-wider flex items-center gap-2 font-sans">
                      <Bell className="w-4.5 h-4.5 text-[#D4AF37]" /> Portal Dispatch Alerts & Notifications
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      const cleared = staffNotifications.map(n => ({ ...n, read: true }));
                      setStaffNotifications(cleared);
                      localStorage.setItem('zoal_staff_notifications', JSON.stringify(cleared));
                      addStaffLog('Notifications Cleared', 'Marked all alerts as read');
                    }}
                    className="px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xs cursor-pointer"
                  >
                    Mark all as read
                  </button>
                </div>

                <div className="divide-y divide-white/5 space-y-3.5">
                  {staffNotifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => {
                        const updated = staffNotifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
                        setStaffNotifications(updated);
                        localStorage.setItem('zoal_staff_notifications', JSON.stringify(updated));
                      }}
                      className={`pt-3.5 flex items-start gap-3.5 cursor-pointer transition-colors p-2 rounded-xs ${
                        notif.read ? 'opacity-55' : 'bg-[#D4AF37]/[0.02] border-l-2 border-[#D4AF37]'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full shrink-0 mt-1.5 animate-none" />
                      <div className="space-y-0.5 text-left flex-grow">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-semibold text-xs font-sans">{notif.title}</h4>
                          <span className="text-[8.5px] font-mono text-zinc-500">{notif.date}</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed font-sans text-[11px]">{notif.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 7: PROFILE & SETTINGS */}
          {staffSubTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Profile Details */}
                <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-6 text-left font-sans">
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-0.5">Staff</span>
                    <h3 className="text-white text-base font-semibold uppercase tracking-wider">Profile</h3>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                      <div className="w-14 h-14 rounded-full border-2 border-[#D4AF37] bg-zinc-950 flex items-center justify-center text-xl font-mono text-[#D4AF37] uppercase font-bold relative group">
                        {currentUser?.name?.[0]?.toUpperCase() || 'S'}
                        <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" title="Upload Photo">
                          <Camera className="w-5 h-5 text-[#D4AF37]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white text-base font-bold leading-tight">{currentUser?.name}</p>
                        <span className="text-[9px] font-mono text-[#D4AF37] tracking-widest uppercase">{userRole} Account</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-left">
                      <p className="text-zinc-400">Email: <span className="font-mono text-zinc-200 font-semibold">{currentUser?.email}</span></p>
                      <p className="text-zinc-400">Account ID: <span className="font-mono text-zinc-200">{((currentUser as any)?.id || 'VIP-AC-781').substring(0, 8)}</span></p>
                    </div>

                    {/* Duty Status Control Select */}
                    <div className="p-4 border border-[#D4AF37]/15 bg-[#D4AF37]/5 rounded-xs space-y-3 mt-4">
                      <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-[#D4AF37]/10 pb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Duty Status
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {['active', 'break', 'offline'].map((st: any) => (
                          <button
                            key={st}
                            onClick={() => {
                              localStorage.setItem('zoal_staff_duty_status', st);
                              setStaffDutyStatus(st);
                              addStaffLog('Duty Status Changed', `Set status to ${st.toUpperCase()}`);
                            }}
                            className={`py-2 px-2.5 rounded-xs text-[9.5px] uppercase tracking-wider font-bold transition-all cursor-pointer font-mono ${
                              staffDutyStatus === st ? 'bg-white text-black font-semibold' : 'bg-black border border-white/5 text-zinc-500 hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Password Update */}
                <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-5 text-left font-sans">
                  <div className="border-b border-white/5 pb-3">
                    <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4AF37] block mb-0.5">Security</span>
                    <h3 className="text-white text-base font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4.5 h-4.5 text-[#D4AF37]" /> Change Password
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-mono">Current Password:</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? 'text' : 'password'} 
                          placeholder="••••••••"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-mono">New Password:</label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? 'text' : 'password'} 
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xs p-2.5 pr-11 text-xs text-white focus:outline-none focus:border-[#D4AF37]/35"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#D4AF37]/80 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 rounded-xs"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={newPassword} />
                    </div>

                    <button
                      onClick={() => {
                        alert('Password changed successfully!');
                        addStaffLog('Password Changed', 'Staff credentials updated securely');
                      }}
                      className="w-full py-3 bg-[#D4AF37] hover:bg-white text-black font-bold uppercase tracking-widest text-[9.5px] rounded-xs transition-colors cursor-pointer animate-none"
                    >
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#060606] border border-white/5 rounded-sm p-6 text-left font-sans">
                  <h3 className="text-white text-base font-semibold uppercase tracking-wider border-b border-white/5 pb-3 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button onClick={() => setStaffSubTab('orders')} className="p-3 bg-black border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs text-[10px] uppercase tracking-widest font-bold transition-all">Orders</button>
                      <button onClick={() => setStaffSubTab('customers')} className="p-3 bg-black border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs text-[10px] uppercase tracking-widest font-bold transition-all">Customers</button>
                      <button onClick={() => setStaffSubTab('alerts')} className="p-3 bg-black border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs text-[10px] uppercase tracking-widest font-bold transition-all">Tasks</button>
                      <button onClick={() => setStaffSubTab('profile')} className="p-3 bg-black border border-white/5 hover:border-[#D4AF37]/30 text-zinc-400 hover:text-white rounded-xs text-[10px] uppercase tracking-widest font-bold transition-all">Schedule</button>
                  </div>
              </div>
            </div>
          )}

          {/* MODULE 8: ADMIN CONFIGS */}
          {staffSubTab === 'admin' && userRole === 'admin' && (
            <div className="space-y-8 animate-fade-in font-sans">
              
              {/* Quick aggregate widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                  <Package className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Stock List Count</span>
                  <span className="text-2xl font-mono text-white font-bold">{allProducts.length} Distinct Products</span>
                  <span className="text-[9px] text-[#D4AF37] block mt-1">Multi-Domain items verified</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                  <Truck className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Active Deliveries Waiting</span>
                  <span className="text-2xl font-mono text-white font-bold">
                    {orders.filter((o) => o.status === 'Preparing' || o.status === 'Pending').length} Pending Tasks
                  </span>
                  <span className="text-[9px] text-[#D4AF37] block mt-1">SLA Standard: &lt;5 hours VIP SLA</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-5 rounded-sm text-center relative overflow-hidden">
                  <Users className="w-5 h-5 text-gold-pure absolute top-4 left-4" />
                  <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Active Labor Roster</span>
                  <span className="text-2xl font-mono text-white font-bold">{simulatedEmployeesCount} Dedicated Artisans</span>
                  <span className="text-[9px] text-zinc-500 block mt-1">Branch B & Al Hofuf branches active</span>
                </div>

              </div>

              {/* Invoices Coordinator */}
              <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-4.5 h-4.5 text-gold-pure" /> Order Dispatch Workflow
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-sans">Click actions to alter states instantaneously</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                        <th className="py-3 pl-2">Order ID</th>
                        <th className="py-3">Client</th>
                        <th className="py-3">Total Sum</th>
                        <th className="py-3">Current Status</th>
                        <th className="py-3 text-right pr-2">Update Workflow State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 pl-2 font-mono font-bold text-gold-pure text-left">{ord.id}</td>
                          <td className="py-4 font-sans text-zinc-300 text-left">
                            <p className="font-semibold">{ord.customerName}</p>
                            <p className="text-[10px] text-zinc-500">{ord.phone}</p>
                          </td>
                          <td className="py-4 font-mono text-zinc-300 text-left">{formatCurrency(ord.total)} SAR</td>
                          <td className="py-4 text-left">
                            <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-widest font-semibold ${
                              ord.status === 'Completed' ? 'bg-emerald-950 text-emerald-400' :
                              ord.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                              ord.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                              'bg-amber-950 text-amber-400 animate-pulse'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2 flex items-center justify-end gap-1.5 h-full mt-1.5">
                            {['Pending', 'Preparing', 'Shipped'].includes(ord.status) && (
                              <button
                                onClick={() => {
                                  const states: Order['status'][] = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                                  const currIdx = states.indexOf(ord.status);
                                  if (currIdx < states.length - 1) {
                                    onUpdateOrderStatus(ord.id, states[currIdx + 1]);
                                  }
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-[#D4AF37] text-black rounded-xs text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
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

              {/* Delivery Zones */}
              <div className="bg-[#060606] border border-white/5 rounded-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-4.5 h-4.5 text-[#D4AF37]" /> V. Regional Delivery & Logistics Controls
                  </h3>
                  <span className="text-[10px] text-zinc-500">Configure logistics areas or update standard shipping fees</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active zones */}
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

                    {/* Add Logistics Zone */}
                    <div className="p-4 border border-[#D4AF37]/15 bg-[#D4AF37]/5 rounded-xs space-y-3 text-left">
                      <h4 className="text-[10px] text-[#D4AF37] font-mono uppercase tracking-wider border-b border-[#D4AF37]/10 pb-1.5">
                        Establish New Logistics Area
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-sans">City Area Name:</label>
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
                              className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none font-sans"
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
                              className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] text-zinc-400 uppercase tracking-widest block font-sans">Logistics Tier:</label>
                            <select 
                              id="new_zone_method"
                              className="w-full bg-black border border-white/10 rounded-xs p-2 text-xs text-zinc-300 focus:outline-none font-sans"
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

              {/* VI. Luxury Shipping Policy & SLA Configurations */}
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
                  
                  {/* Left panel */}
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

                  {/* Right panel */}
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
                            className="w-full bg-black border border-white/10 rounded-xs p-2.5 text-xs text-white focus:outline-none font-sans"
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
                      alert("Shipping configurations saved successfully! Changes are synced in real-time.");
                    }}
                    className="px-8 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-lg font-sans"
                  >
                    Save Shipping Configurations
                  </button>
                </div>
              </div>

              {/* VII. Luxury Return & Refund Policy Configurations */}
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
                  
                  {/* Left panel: Return window */}
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
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-sans">Inspection (EN):</label>
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
                        <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> Customer Support Channels
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-sans">WhatsApp:</label>
                          <input 
                            type="text"
                            value={returnsConfig.supportWhatsApp}
                            onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, supportWhatsApp: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-[11px] text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-sans">Email:</label>
                          <input 
                            type="text"
                            value={returnsConfig.supportEmail}
                            onChange={(e) => setLocalReturnsConfig({ ...returnsConfig, supportEmail: e.target.value })}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-[11px] text-white focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-400 uppercase tracking-widest block font-sans">Toll-Free Phone:</label>
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

                  {/* Right panel: Exclusions */}
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
                      <h4 className="text-[10px] text-white font-mono uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center justify-between font-sans">
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
                      alert("Return & Refund Policy configurations saved successfully! Sync is active and live.");
                    }}
                    className="px-8 py-3 bg-[#D4AF37] hover:bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-xs transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    Save Return Configurations
                  </button>
                </div>
              </div>

              {/* VIII. Supabase Cloud Database Integration Hub */}
              <div className="bg-[#060606] border border-[#D4AF37]/20 rounded-sm p-6 space-y-6 text-left mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
                  <div>
                    <h3 className="text-white text-xs font-display uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-[#D4AF37]" /> VIII. Supabase Cloud Database Integration Hub
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
                  {/* API Credential Status Card */}
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
                          The AL ZOAL system server has successfully bound the Supabase SDK client in passive standby mode.
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
                        <p className="text-zinc-400 text-[11px] leading-relaxed font-sans text-left">
                          To enable full-scale PostgreSQL persistence, please set <code className="text-gold-pure bg-white/5 px-1 rounded-xs font-mono">SUPABASE_URL</code> and <code className="text-gold-pure bg-white/5 px-1 rounded-xs font-mono">SUPABASE_ANON_KEY</code> in your Environment Settings. The system will seamlessly switch to Supabase.
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
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0 animate-pulse" />
                          <span className="font-semibold uppercase tracking-wider text-[10px]">Connected to Supabase PostgreSQL</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] font-sans">
                          Connection test successful. The following entity counts are live on Supabase:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-left font-mono text-[10px]">
                          <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                            <span className="text-zinc-500 block text-[8px] uppercase">Customers</span>
                            <span className="text-white font-bold">{supabaseStatus.tableCounts?.users ?? 0} Users</span>
                          </div>
                          <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                            <span className="text-zinc-500 block text-[8px] uppercase">Active Sessions</span>
                            <span className="text-white font-bold">{supabaseStatus.tableCounts?.sessions ?? 0} Sessions</span>
                          </div>
                          <div className="p-1.5 bg-black/40 border border-white/5 rounded-xs">
                            <span className="text-zinc-500 block text-[8px] uppercase">Audit List</span>
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
                          {supabaseStatus?.errorMessage || 'Local server-side JSON storage is acting as the primary transaction record. Setup credentials to activate live Supabase streaming.'}
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
                        <Sparkles className="w-3.5 h-3.5 animate-pulse animate-none" /> Initialize Supabase Database Schema
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
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-sans text-left">
                      To setup the tables, open your <strong className="text-white font-semibold">Supabase Dashboard</strong>, navigate to the <strong className="text-white font-semibold">SQL Editor</strong>, paste the script below, and click <strong className="text-white font-semibold font-sans">Run</strong>:
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
                          Push all existing local JSON transaction records (including registered users, customer sessions, audit trails, and email histories) directly to your Supabase production tables in one secure operation.
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
                          The AL ZOAL master records are now perfectly synchronized. The following entities have been migrated:
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
                        <p className="font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1 mb-1 font-sans">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Synchronization Error
                        </p>
                        <p className="text-[11px] text-zinc-400 font-sans">{syncError}</p>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* IX. Supabase Enterprise Storage Manager */}
              <SupabaseStoragePanel />

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
