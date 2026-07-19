import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronRight, X, Check, Eye, Trash2, Calendar, 
  ClipboardList, TrendingUp, DollarSign, Package, Truck, Printer, Download, User, MapPin, 
  FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, FolderPlus, ArrowUpRight, 
  Activity, Shield, ShieldCheck, UserCheck, CreditCard, Ban, Undo2, Users, BarChart3, 
  PackageCheck, HelpCircle, Phone, Mail, Clock, ShoppingBag, FileSpreadsheet, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Order, Product, CartItem } from '../types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils';

interface EnterpriseOrderManagementProps {
  currentUser: {
    name: string;
    email: string;
    phone: string;
    address: string;
    role?: string;
  } | null;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export default function EnterpriseOrderManagement({
  currentUser,
  orders,
  setOrders
}: EnterpriseOrderManagementProps) {
  const { t } = useTranslation();
  const userRole = currentUser?.role || 'customer';

  // State Management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'my-tasks' | 'reports'>(() => {
    if (userRole === 'customer') return 'ledger';
    if (userRole === 'staff') return 'my-tasks';
    return 'overview';
  });

  // Filters & Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Sorting
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'status' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 8;

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Notes fields
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [customerNoteInput, setCustomerNoteInput] = useState('');

  // Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState<string>('');
  const [bulkStaffToAssign, setBulkStaffToAssign] = useState<string>('');

  // Local state for reports selection
  const [reportType, setReportType] = useState<'sales' | 'products' | 'staff' | 'geo'>('sales');

  // Mock staff list for assignment
  const STAFF_LIST = [
    { id: 'st-1', name: 'Concierge Ahmad', email: 'ahmad@zoal.sa' },
    { id: 'st-2', name: 'Master Roaster Khalid', email: 'khalid@zoal.sa' },
    { id: 'st-3', name: 'Fulfillment Yasir', email: 'yasir@zoal.sa' },
    { id: 'st-4', name: 'Logistics Hisham', email: 'hisham@zoal.sa' }
  ];

  // Simulated system delay for polished UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Log audit helper
  const addActivityLog = (orderId: string, action: string, details: string) => {
    setOrders(prevOrders => 
      prevOrders.map(o => {
        if (o.id === orderId) {
          const newLog = {
            action,
            date: new Date().toISOString(),
            details,
            user: currentUser?.name || 'System'
          };
          const newTimeline = {
            status: action,
            date: new Date().toISOString(),
            notes: details,
            updatedBy: currentUser?.name || 'System'
          };
          return {
            ...o,
            activityHistory: [newLog, ...(o.activityHistory || [])],
            timeline: [...(o.timeline || []), newTimeline]
          };
        }
        return o;
      })
    );
  };

  // Status Workflow transitions state machine validator
  const getValidTransitions = (status: Order['status']): Order['status'][] => {
    switch (status) {
      case 'Pending':
        return ['Confirmed', 'Cancelled'];
      case 'Confirmed':
        return ['Processing', 'Cancelled'];
      case 'Processing':
        return ['Packed'];
      case 'Packed':
        return ['Ready for Shipping'];
      case 'Ready for Shipping':
        return ['Shipped'];
      case 'Shipped':
        return ['Out for Delivery'];
      case 'Out for Delivery':
        return ['Delivered'];
      case 'Delivered':
      case 'Completed':
        return ['Returned', 'Refund Requested'];
      case 'Refund Requested':
        return ['Refund Approved', 'Cancelled'];
      case 'Refund Approved':
        return ['Refund Completed'];
      case 'Refund Completed':
      case 'Cancelled':
      case 'Returned':
      default:
        return [];
    }
  };

  // Perform status update & timeline creation
  const handleStatusTransition = (orderId: string, nextStatus: Order['status'], noteText?: string) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    // Check if transition is valid, except for admin who can override status
    const validTransitions = getValidTransitions(orderToUpdate.status);
    if (userRole !== 'admin' && !validTransitions.includes(nextStatus)) {
      alert(`Invalid status transition from ${orderToUpdate.status} to ${nextStatus}.`);
      return;
    }

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Automatically mark payment status on Delivered or completed
        let updatedPaymentStatus = o.paymentStatus || 'Unpaid';
        if (nextStatus === 'Delivered' || nextStatus === 'Completed') {
          updatedPaymentStatus = 'Paid';
        } else if (nextStatus === 'Refund Completed') {
          updatedPaymentStatus = 'Refunded';
        }

        const newTimeline = {
          status: nextStatus,
          date: new Date().toISOString(),
          notes: noteText || `Order transitioned to ${nextStatus}`,
          updatedBy: currentUser?.name || 'System'
        };

        const newLog = {
          action: `Status Update: ${nextStatus}`,
          date: new Date().toISOString(),
          details: noteText || `Status transitioned to ${nextStatus}`,
          user: currentUser?.name || 'System'
        };

        return {
          ...o,
          status: nextStatus,
          paymentStatus: updatedPaymentStatus,
          timeline: [...(o.timeline || []), newTimeline],
          activityHistory: [newLog, ...(o.activityHistory || [])]
        };
      }
      return o;
    }));

    // Update locally selected view details
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => {
        if (!prev) return null;
        let updatedPaymentStatus = prev.paymentStatus || 'Unpaid';
        if (nextStatus === 'Delivered' || nextStatus === 'Completed') {
          updatedPaymentStatus = 'Paid';
        } else if (nextStatus === 'Refund Completed') {
          updatedPaymentStatus = 'Refunded';
        }
        return {
          ...prev,
          status: nextStatus,
          paymentStatus: updatedPaymentStatus,
          timeline: [...(prev.timeline || []), {
            status: nextStatus,
            date: new Date().toISOString(),
            notes: noteText || `Order transitioned to ${nextStatus}`,
            updatedBy: currentUser?.name || 'System'
          }],
          activityHistory: [{
            action: `Status Update: ${nextStatus}`,
            date: new Date().toISOString(),
            details: noteText || `Status transitioned to ${nextStatus}`,
            user: currentUser?.name || 'System'
          }, ...(prev.activityHistory || [])]
        };
      });
    }
  };

  // Staff Assignment
  const handleAssignStaff = (orderId: string, staffName: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          assignedStaff: staffName,
          activityHistory: [{
            action: 'Staff Assigned',
            date: new Date().toISOString(),
            details: `Assigned order to concierge staff: ${staffName}`,
            user: currentUser?.name || 'Admin'
          }, ...(o.activityHistory || [])]
        };
      }
      return o;
    }));

    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, assignedStaff: staffName } : null);
    }
  };

  // Notes Updates
  const handleSaveNotes = (type: 'admin' | 'staff' | 'customer') => {
    if (!selectedOrder) return;
    
    setOrders(prev => prev.map(o => {
      if (o.id === selectedOrder.id) {
        const update: Partial<Order> = {};
        if (type === 'admin') {
          update.adminNotes = adminNoteInput;
        } else if (type === 'staff') {
          update.staffNotes = staffNoteInput;
        } else if (type === 'customer') {
          update.customerNotes = customerNoteInput;
        }
        return {
          ...o,
          ...update,
          activityHistory: [{
            action: `${type.toUpperCase()} Notes Saved`,
            date: new Date().toISOString(),
            details: `Updated notes in order folder.`,
            user: currentUser?.name || 'System'
          }, ...(o.activityHistory || [])]
        };
      }
      return o;
    }));

    setSelectedOrder(prev => {
      if (!prev) return null;
      const update: Partial<Order> = {};
      if (type === 'admin') update.adminNotes = adminNoteInput;
      if (type === 'staff') update.staffNotes = staffNoteInput;
      if (type === 'customer') update.customerNotes = customerNoteInput;
      return { ...prev, ...update };
    });

    alert(`${type.toUpperCase()} notes updated successfully.`);
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const validOrders = orders;
    const totalCount = validOrders.length;
    const pending = validOrders.filter(o => o.status === 'Pending').length;
    const confirmed = validOrders.filter(o => o.status === 'Confirmed').length;
    const processing = validOrders.filter(o => o.status === 'Processing' || o.status === 'Preparing').length;
    const packed = validOrders.filter(o => o.status === 'Packed').length;
    const readyForShipping = validOrders.filter(o => o.status === 'Ready for Shipping').length;
    const shipped = validOrders.filter(o => o.status === 'Shipped').length;
    const outForDelivery = validOrders.filter(o => o.status === 'Out for Delivery').length;
    const delivered = validOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
    const cancelled = validOrders.filter(o => o.status === 'Cancelled').length;
    const returned = validOrders.filter(o => o.status === 'Returned').length;
    const refundRequested = validOrders.filter(o => o.status === 'Refund Requested').length;
    const refundApproved = validOrders.filter(o => o.status === 'Refund Approved').length;
    const refundCompleted = validOrders.filter(o => o.status === 'Refund Completed').length;
    
    // Revenue (excluding cancelled and refunded)
    const totalRev = validOrders.reduce((sum, o) => {
      if (o.status !== 'Cancelled' && o.status !== 'Refund Completed') {
        return sum + o.total;
      }
      return sum;
    }, 0);

    // Today's orders
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = validOrders.filter(o => o.date === todayStr).length;

    // Monthly orders (July 2026)
    const monthlyOrders = validOrders.filter(o => o.date.startsWith('2026-07') || o.date.startsWith('2026-06')).length;

    return {
      totalCount, pending, confirmed, processing, packed, readyForShipping, shipped,
      delivered, cancelled, returned, refundRequested, refundApproved, refundCompleted,
      todayOrders, monthlyOrders, totalRev, outForDelivery
    };
  }, [orders]);

  // Handle Filtering & Sorting & Searching
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    // Customer specific filter (Customer can view own orders only)
    if (userRole === 'customer' && currentUser?.email) {
      list = list.filter(o => o.email.toLowerCase() === currentUser.email.toLowerCase() || o.phone === currentUser.phone);
    }

    // Staff specific filter (Staff can view assigned orders only)
    if (userRole === 'staff') {
      list = list.filter(o => o.assignedStaff === currentUser?.name || o.email === currentUser?.email);
    }

    // Keyword Search (Order Number, Customer Name, Phone, Email)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.email.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Processing') {
        list = list.filter(o => o.status === 'Processing' || o.status === 'Preparing');
      } else if (statusFilter === 'Delivered') {
        list = list.filter(o => o.status === 'Delivered' || o.status === 'Completed');
      } else {
        list = list.filter(o => o.status === statusFilter);
      }
    }

    // Payment Status Filter
    if (paymentFilter !== 'all') {
      list = list.filter(o => (o.paymentStatus || 'Unpaid') === paymentFilter);
    }

    // Staff Filter
    if (staffFilter !== 'all') {
      list = list.filter(o => o.assignedStaff === staffFilter);
    }

    // Date Filter
    if (dateFilter) {
      list = list.filter(o => o.date === dateFilter);
    }

    // Amount range Filter
    if (minAmount) {
      list = list.filter(o => o.total >= parseFloat(minAmount));
    }
    if (maxAmount) {
      list = list.filter(o => o.total <= parseFloat(maxAmount));
    }

    // Sorting
    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'date') {
        valA = new Date(a.date).getTime();
        valB = new Date(b.date).getTime();
      }

      if (sortBy === 'total') {
        valA = a.total;
        valB = b.total;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    return list;
  }, [orders, searchQuery, statusFilter, paymentFilter, staffFilter, minAmount, maxAmount, dateFilter, sortBy, sortOrder, userRole, currentUser]);

  // Pagination slice
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPageNum - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPageNum]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

  // Sync details input on selecting an order
  const handleOpenDetails = (order: Order) => {
    setSelectedOrder(order);
    setAdminNoteInput(order.adminNotes || '');
    setStaffNoteInput(order.staffNotes || '');
    setCustomerNoteInput(order.customerNotes || '');
    setShowDetailsModal(true);
  };

  // Bulk Actions Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const executeBulkStatus = () => {
    if (!bulkStatusToUpdate) return;
    setOrders(prev => prev.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        const nextStatus = bulkStatusToUpdate as Order['status'];
        const newTimeline = {
          status: nextStatus,
          date: new Date().toISOString(),
          notes: `Bulk status update triggered by ${currentUser?.name || 'Admin'}`,
          updatedBy: currentUser?.name || 'System'
        };
        const newLog = {
          action: `Bulk status transition to ${nextStatus}`,
          date: new Date().toISOString(),
          details: `Transitioned in bulk command`,
          user: currentUser?.name || 'System'
        };
        return {
          ...o,
          status: nextStatus,
          timeline: [...(o.timeline || []), newTimeline],
          activityHistory: [newLog, ...(o.activityHistory || [])]
        };
      }
      return o;
    }));
    setSelectedOrderIds([]);
    setBulkStatusToUpdate('');
    alert(`Successfully updated status of selected orders to ${bulkStatusToUpdate}`);
  };

  const executeBulkStaffAssign = () => {
    if (!bulkStaffToAssign) return;
    setOrders(prev => prev.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return {
          ...o,
          assignedStaff: bulkStaffToAssign,
          activityHistory: [{
            action: 'Bulk Staff Assigned',
            date: new Date().toISOString(),
            details: `Assigned in bulk to ${bulkStaffToAssign}`,
            user: currentUser?.name || 'Admin'
          }, ...(o.activityHistory || [])]
        };
      }
      return o;
    }));
    setSelectedOrderIds([]);
    setBulkStaffToAssign('');
    alert(`Successfully assigned staff to selected orders.`);
  };

  // Export filtered orders as CSV
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Customer Name', 'Customer Phone', 'Order Date', 'Payment Method', 'Payment Status', 'Shipping Status', 'Order Status', 'Total (SAR)', 'Assigned Staff'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.customerName,
      `'${o.phone}`, // Escaped to prevent phone truncation
      o.date,
      o.paymentMethod,
      o.paymentStatus || 'Unpaid',
      o.shippingStatus || 'Fulfillment',
      o.status,
      o.total,
      o.assignedStaff || 'Unassigned'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AL_ZOAL_Enterprise_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reports data parsing
  const salesByMonthData = [
    { month: 'Jan', revenue: 145000, orders: 320 },
    { month: 'Feb', revenue: 185000, orders: 410 },
    { month: 'Mar', revenue: 210000, orders: 490 },
    { month: 'Apr', revenue: 290000, orders: 610 },
    { month: 'May', revenue: 380000, orders: 740 },
    { month: 'Jun', revenue: 450000, orders: 890 },
    { month: 'Jul (SLA)', revenue: stats.totalRev, orders: stats.totalCount }
  ];

  const orderStatusPieData = [
    { name: 'Pending', value: stats.pending, color: '#f59e0b' },
    { name: 'Confirmed', value: stats.confirmed, color: '#3b82f6' },
    { name: 'Processing', value: stats.processing, color: '#8b5cf6' },
    { name: 'Packed', value: stats.packed, color: '#ec4899' },
    { name: 'Ready to Ship', value: stats.readyForShipping, color: '#06b6d4' },
    { name: 'Shipped', value: stats.shipped, color: '#10b981' },
    { name: 'Delivered', value: stats.delivered, color: '#22c55e' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' }
  ];

  const paymentMethodsData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      counts[o.paymentMethod] = (counts[o.paymentMethod] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS_PALETTE = ['#D4AF37', '#ffffff', '#a1a1aa', '#52525b', '#27272a'];

  return (
    <div className="space-y-6 text-left">
      {/* Title Header with Role Accents */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-gold-pure bg-gold-pure/10 px-2 py-0.5 rounded-xs border border-gold-pure/20">
              {userRole === 'admin' ? 'Sovereign Admin Mode' : userRole === 'staff' ? 'Staff Fulfillment Suite' : 'Patron Concierge'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Enterprise Core v2.4</span>
          </div>
          <h1 className="text-2xl font-bold tracking-widest font-display text-white uppercase">
            ENTERPRISE ORDER MANAGEMENT SYSTEM
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Sovereign transaction ledger, status orchestrator, staff metrics, and real-time SLA verification engines.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-xs shrink-0 self-start md:self-center font-mono text-[10px]">
          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Overview
            </button>
          )}

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ledger' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {userRole === 'customer' ? 'My Order History' : 'Orders Ledger'}
          </button>

          {userRole === 'staff' && (
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-3 py-1.5 rounded-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'my-tasks' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" /> My Assigned
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reports' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Executive Reports
            </button>
          )}
        </div>
      </div>

      {loading ? (
        /* GORGEOUS SKELETON LOADERS */
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-zinc-950 border border-white/5 rounded-xs animate-pulse p-3 space-y-2">
                <div className="w-1/2 h-2.5 bg-zinc-800 rounded-sm"></div>
                <div className="w-3/4 h-4 bg-zinc-800 rounded-sm"></div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-zinc-950 border border-white/5 rounded-xs animate-pulse"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* OVERVIEW METRICS DASHBOARD TAB */}
          {activeTab === 'overview' && userRole === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stat Boxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Total Orders</span>
                  <p className="text-xl font-bold font-mono text-white">{stats.totalCount}</p>
                  <Activity className="w-4 h-4 text-gold-pure/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-amber-500 uppercase tracking-widest block mb-1">Pending Gate</span>
                  <p className="text-xl font-bold font-mono text-amber-400">{stats.pending}</p>
                  <Clock className="w-4 h-4 text-amber-500/40 absolute top-3 right-3 animate-pulse" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest block mb-1">Confirmed State</span>
                  <p className="text-xl font-bold font-mono text-blue-300">{stats.confirmed}</p>
                  <ShieldCheck className="w-4 h-4 text-blue-400/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block mb-1">Roasting / Processing</span>
                  <p className="text-xl font-bold font-mono text-purple-300">{stats.processing}</p>
                  <RefreshCw className="w-4 h-4 text-purple-400/40 absolute top-3 right-3 animate-spin-slow" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest block mb-1">Packed & Boxed</span>
                  <p className="text-xl font-bold font-mono text-pink-300">{stats.packed}</p>
                  <Package className="w-4 h-4 text-pink-400/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">Ready for Courier</span>
                  <p className="text-xl font-bold font-mono text-cyan-300">{stats.readyForShipping}</p>
                  <Truck className="w-4 h-4 text-cyan-400/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-[#06b6d4] uppercase tracking-widest block mb-1">Shipped Gate</span>
                  <p className="text-xl font-bold font-mono text-[#22d3ee]">{stats.shipped}</p>
                  <Truck className="w-4 h-4 text-[#06b6d4]/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest block mb-1">Delivered Handover</span>
                  <p className="text-xl font-bold font-mono text-emerald-300">{stats.delivered}</p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-rose-500 uppercase tracking-widest block mb-1">Cancelled Order</span>
                  <p className="text-xl font-bold font-mono text-rose-400">{stats.cancelled}</p>
                  <Ban className="w-4 h-4 text-rose-500/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Refund Pending</span>
                  <p className="text-xl font-bold font-mono text-zinc-300">{stats.refundRequested}</p>
                  <Undo2 className="w-4 h-4 text-zinc-400/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-[#D4AF37] uppercase tracking-widest block mb-1">Total Gross Revenue</span>
                  <p className="text-xl font-bold font-mono text-gold-pure truncate">{formatCurrency(stats.totalRev)} SAR</p>
                  <DollarSign className="w-4 h-4 text-gold-pure/40 absolute top-3 right-3" />
                </div>

                <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs relative group hover:border-gold-pure/30 transition-all text-left">
                  <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest block mb-1">Active This Month</span>
                  <p className="text-xl font-bold font-mono text-purple-200">{stats.monthlyOrders}</p>
                  <Calendar className="w-4 h-4 text-purple-400/40 absolute top-3 right-3" />
                </div>
              </div>

              {/* Main Charts Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* sales progression area chart */}
                <div className="lg:col-span-2 bg-[#060608] border border-white/5 p-5 rounded-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-mono font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-gold-pure" /> Executive Revenue Flow (2026)
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-500">Gross metrics over calendar span</span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesByMonthData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                        <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#D4AF37', color: '#fff', fontSize: '11px', borderRadius: '4px' }} />
                        <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue (SAR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* status breakdown pie chart */}
                <div className="bg-[#060608] border border-white/5 p-5 rounded-xs space-y-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-mono font-bold flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-gold-pure" /> Order Stages Ratio
                    </h3>
                  </div>
                  <div className="h-52 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusPieData.filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderStatusPieData.filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-400 max-h-[100px] overflow-y-auto pt-2 border-t border-white/5">
                    {orderStatusPieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                        <span className="truncate">{d.name}: {d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LEDGER & ORDERS DIRECTORY TAB */}
          {(activeTab === 'ledger' || (activeTab === 'my-tasks' && userRole === 'staff')) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Filter drawer dashboard panel */}
              <div className="bg-[#09090b]/80 border border-white/5 rounded-xs p-4 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-white font-bold flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-gold-pure" /> Order Matrix Filter
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {filteredOrders.length} orders match current parameters
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Search Query */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block">Search Client / Serial</label>
                    <div className="flex items-center gap-2 bg-black border border-white/10 px-2.5 py-1.5 rounded-xs">
                      <Search className="w-3.5 h-3.5 text-zinc-600" />
                      <input
                        type="text"
                        placeholder="ID, Name, Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-white outline-none text-xs w-full placeholder-zinc-700"
                      />
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block">Delivery Stage</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-xs py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Stages</option>
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Ready for Shipping">Ready for Shipping</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Returned">Returned</option>
                      <option value="Refund Requested">Refund Requested</option>
                      <option value="Refund Approved">Refund Approved</option>
                      <option value="Refund Completed">Refund Completed</option>
                    </select>
                  </div>

                  {/* Payment Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block">Payment Status</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-xs py-1.5 px-2 rounded-xs outline-none focus:border-gold-pure"
                    >
                      <option value="all">All Payment States</option>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Partially Refunded">Partially Refunded</option>
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-zinc-500 block">Placement Date</label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-black w-full border border-white/10 text-zinc-300 text-xs py-1 px-2 rounded-xs outline-none focus:border-gold-pure font-mono"
                    />
                  </div>
                </div>

                {/* Second row of filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  <div className="flex gap-2 col-span-2">
                    <div className="w-1/2 space-y-1">
                      <label className="text-[9px] font-mono uppercase text-zinc-500 block">Min Price (SAR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 100"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="bg-black w-full border border-white/10 text-zinc-300 text-xs py-1 px-2.5 rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                    <div className="w-1/2 space-y-1">
                      <label className="text-[9px] font-mono uppercase text-zinc-500 block">Max Price (SAR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="bg-black w-full border border-white/10 text-zinc-300 text-xs py-1 px-2.5 rounded-xs outline-none focus:border-gold-pure font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-end justify-end gap-3 text-[10px] font-mono">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-white/10 hover:border-gold-pure text-white rounded-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-gold-pure" /> Export CSV
                    </button>
                    {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter || minAmount || maxAmount) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                          setPaymentFilter('all');
                          setDateFilter('');
                          setMinAmount('');
                          setMaxAmount('');
                        }}
                        className="text-gold-pure hover:underline"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Actions Console (Admin Only) */}
              {userRole === 'admin' && selectedOrderIds.length > 0 && (
                <div className="bg-gold-pure/5 border border-gold-pure/30 p-3 rounded-xs flex flex-col md:flex-row items-center justify-between gap-3 text-gold-pure text-[10px] font-mono animate-fade-in">
                  <span className="font-bold">⚡ BULK ACTION MODE ACTIVE ({selectedOrderIds.length} orders highlighted)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Bulk Status Dropdown */}
                    <div className="flex items-center gap-1 bg-black border border-white/10 rounded-xs py-0.5 px-2">
                      <span className="text-[8px] uppercase text-zinc-500 font-bold">Stage:</span>
                      <select
                        value={bulkStatusToUpdate}
                        onChange={(e) => setBulkStatusToUpdate(e.target.value)}
                        className="bg-transparent text-white outline-none border-none text-[10px]"
                      >
                        <option value="">Choose...</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Ready for Shipping">Ready for Shipping</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={executeBulkStatus}
                        disabled={!bulkStatusToUpdate}
                        className="px-1.5 py-0.5 bg-gold-pure text-black font-bold uppercase rounded-sm disabled:opacity-50 ml-1"
                      >
                        Run
                      </button>
                    </div>

                    {/* Bulk Staff Dropdown */}
                    <div className="flex items-center gap-1 bg-black border border-white/10 rounded-xs py-0.5 px-2">
                      <span className="text-[8px] uppercase text-zinc-500 font-bold">Assign:</span>
                      <select
                        value={bulkStaffToAssign}
                        onChange={(e) => setBulkStaffToAssign(e.target.value)}
                        className="bg-transparent text-white outline-none border-none text-[10px]"
                      >
                        <option value="">Choose...</option>
                        {STAFF_LIST.map(st => (
                          <option key={st.id} value={st.name}>{st.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={executeBulkStaffAssign}
                        disabled={!bulkStaffToAssign}
                        className="px-1.5 py-0.5 bg-gold-pure text-black font-bold uppercase rounded-sm disabled:opacity-50 ml-1"
                      >
                        Run
                      </button>
                    </div>

                    <button
                      onClick={() => setSelectedOrderIds([])}
                      className="text-zinc-400 hover:text-white"
                    >
                      Clear Highlights
                    </button>
                  </div>
                </div>
              )}

              {/* RESPONSIVE TABLE VIEW (DESKTOP) */}
              <div className="hidden md:block bg-[#050507] border border-white/5 rounded-xs overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead className="bg-black text-zinc-500 text-[8.5px] uppercase tracking-widest font-mono">
                    <tr>
                      {userRole === 'admin' && (
                        <th className="p-4 w-10">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                      )}
                      <th className="p-4">Order Code</th>
                      <th className="p-4">Client Detail</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Payment Info</th>
                      <th className="p-4">Courier Method</th>
                      <th className="p-4">Fulfillment Stage</th>
                      <th className="p-4">Assigned Crew</th>
                      <th className="p-4 text-right">Sum Total</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((o) => (
                        <tr
                          key={o.id}
                          className="hover:bg-white/[0.01] transition-colors cursor-pointer group"
                          onClick={() => handleOpenDetails(o)}
                        >
                          {userRole === 'admin' && (
                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedOrderIds.includes(o.id)}
                                onChange={() => handleSelectOrder(o.id)}
                              />
                            </td>
                          )}
                          <td className="p-4 font-mono font-bold text-gold-pure">{o.id}</td>
                          <td className="p-4">
                            <p className="font-semibold text-zinc-200">{o.customerName}</p>
                            <p className="text-[10px] text-zinc-500">{o.phone}</p>
                          </td>
                          <td className="p-4 text-zinc-400 font-mono text-[10px]">{o.date}</td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <p className="text-zinc-300 font-medium text-[11px]">{o.paymentMethod || 'Mada Pay'}</p>
                              <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-semibold font-mono ${
                                (o.paymentStatus || 'Unpaid') === 'Paid' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                                (o.paymentStatus || 'Unpaid') === 'Refunded' ? 'bg-zinc-950/60 text-zinc-400 border border-white/10' :
                                'bg-rose-950/40 text-rose-400 border border-rose-500/20'
                              }`}>
                                {o.paymentStatus || 'Unpaid'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-zinc-400 font-mono text-[10px]">
                            {o.shippingMethod || 'AL ZOAL Premium Ship'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-sm text-[8.5px] uppercase tracking-wider font-semibold font-mono ${
                              o.status === 'Completed' || o.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400' :
                              o.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                              o.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                              'bg-amber-950 text-amber-400 animate-pulse'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-[10px] text-zinc-300">
                            {o.assignedStaff || (
                              <span className="text-zinc-600 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono font-bold text-white">
                            {formatCurrency(o.total)} SAR
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenDetails(o)}
                              className="px-2 py-1 bg-zinc-900 hover:bg-gold-pure hover:text-black border border-white/5 rounded-xs transition-colors cursor-pointer text-[10px]"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-zinc-500 font-sans italic">
                          No matching orders registered under current filter matrix.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="block md:hidden space-y-3">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => handleOpenDetails(o)}
                      className="bg-zinc-950 border border-white/5 p-4 rounded-xs text-left space-y-3 relative overflow-hidden group active:border-gold-pure/40"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-gold-pure"></div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="font-mono font-bold text-gold-pure text-[13px]">{o.id}</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-semibold font-mono ${
                          o.status === 'Completed' || o.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400' :
                          o.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                          o.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                          'bg-amber-950 text-amber-400 animate-pulse'
                        }`}>
                          {o.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block">Client</span>
                          <span className="text-zinc-200 font-semibold">{o.customerName}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block">Date</span>
                          <span className="text-zinc-400 font-mono">{o.date}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block">Sum Value</span>
                          <span className="text-white font-mono font-bold">{formatCurrency(o.total)} SAR</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block">Payment Gate</span>
                          <span className="text-zinc-400">{o.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                        <span className="font-mono text-zinc-500">Staff: {o.assignedStaff || 'Unassigned'}</span>
                        <button className="text-gold-pure uppercase font-bold tracking-widest font-mono hover:text-white">
                          View details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-500 bg-zinc-950 border border-white/5 rounded-xs italic">
                    No orders registered in ledger.
                  </div>
                )}
              </div>

              {/* PAGINATION NAVIGATION FOOTER */}
              <div className="flex items-center justify-between bg-[#060608] border border-white/5 rounded-xs p-3 font-mono text-[10px]">
                <span className="text-zinc-500">
                  Showing page {currentPageNum} of {totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageNum === 1}
                    className="px-2.5 py-1.5 bg-black border border-white/10 hover:border-gold-pure rounded-xs text-white disabled:opacity-30 disabled:hover:border-white/10 cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPageNum === totalPages}
                    className="px-2.5 py-1.5 bg-black border border-white/10 hover:border-gold-pure rounded-xs text-white disabled:opacity-30 disabled:hover:border-white/10 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* EXECUTIVE REPORTS GENERATOR TAB */}
          {activeTab === 'reports' && userRole === 'admin' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 text-left"
            >
              {/* Report selection buttons */}
              <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 border border-white/5 rounded-xs text-[10px] font-mono">
                <button
                  onClick={() => setReportType('sales')}
                  className={`px-3 py-1.5 rounded-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    reportType === 'sales' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Financial Sales Reports
                </button>
                <button
                  onClick={() => setReportType('products')}
                  className={`px-3 py-1.5 rounded-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    reportType === 'products' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Product Velocity Logs
                </button>
                <button
                  onClick={() => setReportType('staff')}
                  className={`px-3 py-1.5 rounded-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    reportType === 'staff' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Fulfillment Staff SLA
                </button>
              </div>

              {/* REPORT DISPLAY PANELS */}
              {reportType === 'sales' && (
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Financial Sales Analytics</h3>
                  <p className="text-xs text-zinc-400">Total gross revenue ledger filtered through standard margins & currency benchmarks.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-black border border-white/5 rounded-xs text-left">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Total Sales Transacted</span>
                      <p className="text-2xl font-bold font-mono text-gold-pure">{formatCurrency(stats.totalRev)} SAR</p>
                    </div>
                    <div className="p-4 bg-black border border-white/5 rounded-xs text-left">
                      <span className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Average Order Value (AOV)</span>
                      <p className="text-2xl font-bold font-mono text-white">
                        {formatCurrency(stats.totalCount > 0 ? stats.totalRev / stats.totalCount : 0)} SAR
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'products' && (
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Product Velocity Index</h3>
                  <p className="text-xs text-zinc-400">Most requested product groups placed in premium catalog shopping baskets.</p>
                  <div className="divide-y divide-white/5 font-sans">
                    {orders.slice(0, 3).map((o, index) => (
                      <div key={index} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-gold-pure">0{index + 1}</span>
                          <div>
                            <p className="font-bold text-zinc-200">{o.items[0]?.name || 'Imported Thobe Classic'}</p>
                            <p className="text-[10px] text-zinc-500">Quantity: {o.items[0]?.quantity || 1} units sold</p>
                          </div>
                        </div>
                        <span className="font-mono text-zinc-300 font-bold">{formatCurrency(o.items[0]?.price * (o.items[0]?.quantity || 1) || 0)} SAR</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reportType === 'staff' && (
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">Concierge Staff Performance Metrics</h3>
                  <p className="text-xs text-zinc-400">Track assigned order distribution, packaging times, and client delivery success rates.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STAFF_LIST.map(st => {
                      const count = orders.filter(o => o.assignedStaff === st.name).length;
                      return (
                        <div key={st.id} className="p-4 bg-black border border-white/5 rounded-xs flex items-center justify-between">
                          <div>
                            <p className="text-zinc-200 font-bold text-xs">{st.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{st.email}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Active Loads</span>
                            <span className="font-mono text-gold-pure font-bold">{count} Orders</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* FULL DETAILED ORDER DRAWER / MODAL */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b0b0d] border border-white/10 w-full max-w-4xl rounded-xs p-6 relative space-y-6 text-left max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-pure"></div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-4 right-4 p-1.5 border border-white/5 hover:border-white/10 hover:text-white rounded-xs text-zinc-500 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="border-b border-white/5 pb-4">
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-gold-pure block mb-1">Detailed Sovereign Bill folder</span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <h2 className="text-lg font-bold font-mono text-white uppercase">
                    Order Serial: {selectedOrder.id}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-semibold font-mono ${
                    selectedOrder.status === 'Completed' || selectedOrder.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400' :
                    selectedOrder.status === 'Shipped' ? 'bg-blue-950 text-blue-400' :
                    selectedOrder.status === 'Cancelled' ? 'bg-rose-950 text-rose-400' :
                    'bg-amber-950 text-amber-400 animate-pulse'
                  }`}>
                    Stage: {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Core Layout Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Information Sections */}
                <div className="md:col-span-2 space-y-6">
                  {/* Customer, Shipping and Billing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer info */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Customer Information
                      </h4>
                      <p className="text-zinc-200 font-bold leading-none text-sm">{selectedOrder.customerName}</p>
                      <p className="text-zinc-400 font-mono text-[10px] leading-tight">Email: {selectedOrder.email}</p>
                      <p className="text-zinc-400 font-mono text-[10px] leading-tight">Phone: {selectedOrder.phone}</p>
                    </div>

                    {/* Shipping Address */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> Shipping Address
                      </h4>
                      <p className="text-zinc-200 font-semibold">{selectedOrder.customerName}</p>
                      <p className="text-zinc-400 leading-normal">{selectedOrder.address}</p>
                      <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block pt-1">
                        Carrier: {selectedOrder.shippingMethod || 'AL ZOAL Premium Express'}
                      </span>
                    </div>

                    {/* Billing Address */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Billing Address
                      </h4>
                      <p className="text-zinc-200 font-semibold">{selectedOrder.customerName}</p>
                      <p className="text-zinc-400 leading-normal">{selectedOrder.billingAddress || selectedOrder.address}</p>
                    </div>

                    {/* Payment Gate Detail */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Payment Gateway & SLA
                      </h4>
                      <p className="text-zinc-200 font-semibold">{selectedOrder.paymentMethod || 'Apple Pay'}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[8px] uppercase tracking-wider font-semibold font-mono ${
                          (selectedOrder.paymentStatus || 'Unpaid') === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' :
                          'bg-rose-950 text-rose-400 border border-rose-500/20'
                        }`}>
                          {selectedOrder.paymentStatus || 'Unpaid'}
                        </span>
                        <span className="text-zinc-500 font-mono text-[9px]">SLA Secured</span>
                      </div>
                    </div>
                  </div>

                  {/* Ordered Products Itemized basket */}
                  <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-3">
                    <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <PackageCheck className="w-3.5 h-3.5" /> Ordered Products Catalog
                    </h4>
                    <div className="divide-y divide-white/5 space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xs overflow-hidden shrink-0">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=200'}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-zinc-100">{item.name}</p>
                              {item.selectedOption && (
                                <span className="inline-block bg-white/5 px-1.5 py-0.5 rounded-sm text-[9px] text-gold-pure font-mono mt-0.5">
                                  {item.selectedOption}
                                </span>
                              )}
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {formatCurrency(item.price)} SAR x {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-zinc-200">
                            {formatCurrency(item.price * item.quantity)} SAR
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Invoice math summary */}
                    <div className="border-t border-white/5 pt-3 space-y-1.5 text-zinc-400 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span>Basket Subtotal</span>
                        <span className="text-zinc-300">{formatCurrency(selectedOrder.subtotal)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (15%)</span>
                        <span className="text-zinc-300">{formatCurrency(selectedOrder.tax || selectedOrder.subtotal * 0.15)} SAR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Fee</span>
                        <span className="text-zinc-300">{formatCurrency(selectedOrder.shipping)} SAR</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-gold-pure font-semibold">
                          <span>Voucher Discount</span>
                          <span>-{formatCurrency(selectedOrder.discount)} SAR</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white font-bold text-sm border-t border-white/5 pt-2 font-mono">
                        <span>Grand Total Bill</span>
                        <span className="text-gold-pure">{formatCurrency(selectedOrder.total)} SAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes folders section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Customer Notes */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                        Customer Placement Notes
                      </label>
                      {userRole === 'customer' ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={customerNoteInput}
                            onChange={(e) => setCustomerNoteInput(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-white outline-none focus:border-gold-pure"
                            placeholder="Add delivery instructions or details..."
                          />
                          <button
                            onClick={() => handleSaveNotes('customer')}
                            className="w-full py-1 bg-gold-pure text-black font-mono uppercase font-bold text-[9px] rounded-xs"
                          >
                            Save Client Notes
                          </button>
                        </div>
                      ) : (
                        <p className="text-zinc-300 italic">{selectedOrder.customerNotes || 'No specific requests.'}</p>
                      )}
                    </div>

                    {/* Staff Notes (Staff/Admin write, customer views) */}
                    <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                      <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                        Staff packing & courier instructions
                      </label>
                      {userRole === 'staff' || userRole === 'admin' ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={staffNoteInput}
                            onChange={(e) => setStaffNoteInput(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-white outline-none focus:border-gold-pure"
                            placeholder="Packing box serial, weight notes..."
                          />
                          <button
                            onClick={() => handleSaveNotes('staff')}
                            className="w-full py-1 bg-gold-pure text-black font-mono uppercase font-bold text-[9px] rounded-xs"
                          >
                            Save Staff Notes
                          </button>
                        </div>
                      ) : (
                        <p className="text-zinc-300 italic">{selectedOrder.staffNotes || 'Fulfillment team packing check completed.'}</p>
                      )}
                    </div>

                    {/* Admin Notes (Admin only) */}
                    {userRole === 'admin' && (
                      <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2 col-span-1 sm:col-span-2">
                        <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                          Sovereign Administrative Internal Logs
                        </label>
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={adminNoteInput}
                            onChange={(e) => setAdminNoteInput(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xs p-2 text-white outline-none focus:border-gold-pure"
                            placeholder="Internal private audit details..."
                          />
                          <button
                            onClick={() => handleSaveNotes('admin')}
                            className="w-full py-1 bg-gold-pure text-black font-mono uppercase font-bold text-[9px] rounded-xs"
                          >
                            Save Administrative Log
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Transitions, Timelines and Activity History Logs */}
                <div className="space-y-6">
                  {/* Transition Panel */}
                  <div className="p-4 border border-gold-pure/20 bg-zinc-950/60 rounded-xs space-y-3">
                    <h4 className="text-[9px] font-mono text-gold-pure uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" /> Workflow Status Control
                    </h4>

                    {/* Staff & Admin Actions */}
                    {(userRole === 'admin' || userRole === 'staff') && (
                      <div className="space-y-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block">Trigger manual status advance:</span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {getValidTransitions(selectedOrder.status).map((nextSt) => (
                            <button
                              key={nextSt}
                              onClick={() => handleStatusTransition(selectedOrder.id, nextSt)}
                              className="w-full py-1.5 bg-zinc-900 border border-white/10 hover:bg-gold-pure hover:text-black hover:border-gold-pure text-zinc-300 font-mono uppercase font-bold text-[10px] rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3 text-gold-pure group-hover:text-black" /> Advance: {nextSt}
                            </button>
                          ))}

                          {/* Admin bypass override */}
                          {userRole === 'admin' && (
                            <div className="pt-2 border-t border-white/5 mt-2 space-y-1.5">
                              <span className="text-[8px] font-mono text-red-400 uppercase block">Admin Override status bypass:</span>
                              <select
                                value={selectedOrder.status}
                                onChange={(e) => handleStatusTransition(selectedOrder.id, e.target.value as Order['status'], "Admin override override status override.")}
                                className="w-full bg-black border border-white/10 p-1 rounded-xs text-[10px] text-white focus:border-red-500"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Packed">Packed</option>
                                <option value="Ready for Shipping">Ready for Shipping</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Returned">Returned</option>
                                <option value="Refund Requested">Refund Requested</option>
                                <option value="Refund Approved">Refund Approved</option>
                                <option value="Refund Completed">Refund Completed</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Staff Assignment Control (Admin Only) */}
                    {userRole === 'admin' && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase block">Assign fulfillment crew:</span>
                        <select
                          value={selectedOrder.assignedStaff || ''}
                          onChange={(e) => handleAssignStaff(selectedOrder.id, e.target.value)}
                          className="w-full bg-black border border-white/10 text-white text-[10px] p-1.5 rounded-xs"
                        >
                          <option value="">Unassigned</option>
                          {STAFF_LIST.map(st => (
                            <option key={st.id} value={st.name}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Customer Cancellation / Return Requests */}
                    {userRole === 'customer' && (
                      <div className="space-y-2">
                        {selectedOrder.status === 'Pending' && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to cancel this order?")) {
                                handleStatusTransition(selectedOrder.id, 'Cancelled', 'Cancelled by patron request');
                              }
                            }}
                            className="w-full py-2 bg-rose-950/30 hover:bg-rose-600 hover:text-white border border-rose-500/20 text-rose-400 font-mono uppercase font-bold text-[10px] rounded-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel Order
                          </button>
                        )}
                        {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Completed') && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleStatusTransition(selectedOrder.id, 'Returned', 'Return requested by customer')}
                              className="py-1.5 bg-zinc-900 border border-white/10 text-zinc-300 font-mono uppercase font-bold text-[9px] rounded-xs hover:border-gold-pure"
                            >
                              Request Return
                            </button>
                            <button
                              onClick={() => handleStatusTransition(selectedOrder.id, 'Refund Requested', 'Refund requested by customer')}
                              className="py-1.5 bg-zinc-900 border border-white/10 text-zinc-300 font-mono uppercase font-bold text-[9px] rounded-xs hover:border-gold-pure"
                            >
                              Request Refund
                            </button>
                          </div>
                        )}
                        {['Cancelled', 'Returned', 'Refund Requested', 'Refund Approved', 'Refund Completed'].includes(selectedOrder.status) && (
                          <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xs text-center text-zinc-500 italic">
                            Order is in refund/return management process.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Order Timeline Visual Progress */}
                  <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-3 text-left">
                    <h4 className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold-pure" /> Fulfillment Timeline
                    </h4>
                    <div className="relative pl-4 border-l border-white/10 space-y-4">
                      {selectedOrder.timeline?.map((step: any, idx: number) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-gold-pure border border-black shrink-0"></span>
                          <div className="text-[10px]">
                            <p className="font-bold text-zinc-200 uppercase tracking-wider">{step.status}</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{new Date(step.date).toLocaleString()}</p>
                            {step.notes && <p className="text-zinc-400 italic text-[9px] mt-0.5">{step.notes}</p>}
                          </div>
                        </div>
                      ))}

                      {/* Default timeline seed fallback if empty */}
                      {(!selectedOrder.timeline || selectedOrder.timeline.length === 0) && (
                        <div className="relative">
                          <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-gold-pure border border-black"></span>
                          <div className="text-[10px]">
                            <p className="font-bold text-zinc-200 uppercase tracking-wider">ORDERED</p>
                            <p className="text-[9px] text-zinc-500 font-mono">{new Date(selectedOrder.date).toLocaleString()}</p>
                            <p className="text-zinc-400 italic text-[9px] mt-0.5">Sovereign order placed successfully via AL ZOAL website.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Print and Invoice Dispatch */}
                  <div className="p-4 border border-white/5 bg-zinc-950/40 rounded-xs space-y-2">
                    <button
                      onClick={() => {
                        window.print();
                        addActivityLog(selectedOrder.id, 'Printed Invoice', 'Transmitted invoice metadata to printer');
                      }}
                      className="w-full py-2 bg-black hover:bg-zinc-900 border border-white/10 text-white font-mono uppercase font-bold text-[10px] rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-gold-pure" /> Print Official Invoice
                    </button>
                    <button
                      onClick={() => {
                        alert("Packing slip generated for print queue.");
                        addActivityLog(selectedOrder.id, 'Printed Slip', 'Transmitted packing slip metadata to printer');
                      }}
                      className="w-full py-2 bg-black hover:bg-zinc-900 border border-white/10 text-white font-mono uppercase font-bold text-[10px] rounded-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-gold-pure" /> Print Packing Slip
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
