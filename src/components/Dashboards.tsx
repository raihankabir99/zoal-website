import React, { useState, useMemo } from 'react';
import {
  User, Shield, Landmark, Bookmark, BarChart3, Package, Truck, Compass,
  MapPin, CheckCircle, Users, RefreshCw, Star, ArrowUpRight, TrendingUp, Sparkles, Bell,
  Clock, CreditCard, X, Gift, ClipboardList, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';
import { Product, Order, CartItem, Branch } from '../types';
import { PRODUCTS, BRANCHES } from '../data';
import { SimulatedLogisticsMap } from './SimulatedLogisticsMap';

interface DashboardsProps {
  currentUser: { name: string; email: string; phone: string; address: string } | null;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, option?: string) => void;
}

export default function Dashboards({
  currentUser,
  orders,
  onUpdateOrderStatus,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
  onAddToCart,
}: DashboardsProps) {
  // Select active role view
  const [activeDashboardTab, setActiveDashboardTab] = useState<'patron' | 'admin' | 'owner'>('patron');

  // Customer sub-tab states
  const [customerSubTab, setCustomerSubTab] = useState<'history' | 'wishlist' | 'addresses'>('history');

  // Granular Order Tracking Modal State
  const [selectedDetailedOrder, setSelectedDetailedOrder] = useState<Order | null>(null);

  // Multi-branch selected analytics index
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<'all' | 'dammam' | 'hofuf'>('all');

  // Seeding simulated employees
  const simulatedEmployees = [
    { name: 'Raed Al-Fahad', role: 'Chief Roasting Master', branch: 'Dammam', status: 'Active' },
    { name: 'Sarah Al-Ghamdi', role: 'Head Boutique Curator', branch: 'Dammam', status: 'Active' },
    { name: 'Jean-Luc Vagner', role: 'Artisanal Chocolatier', branch: 'Dammam', status: 'Active' },
    { name: 'Manal Al-Yousef', role: 'Lounge Supervisor', branch: 'Al Hofuf', status: 'Rest' }
  ];

  // Grouped products list to check low inventories
  const inventoryStatusList = useMemo(() => {
    return PRODUCTS.map((p) => ({
      name: p.name,
      category: p.category,
      price: p.price,
      qty: p.inventory,
      state: p.inventory < 15 ? 'Critical (Restock immediately)' : 'Sufficient'
    }));
  }, []);

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
    { name: 'Coffee Cafe', value: 34 },
    { name: 'Sudan Bakery', value: 26 },
    { name: 'Sudan Market', value: 18 },
    { name: 'Sudan Fashion', value: 14 },
    { name: 'Pots & Household', value: 8 }
  ];

  const PIE_COLORS = ['#AA7C11', '#D4AF37', '#F3E5AB', '#92400e', '#78350f'];

  // Map products of wishlist
  const userWishlistProducts = useMemo(() => {
    return PRODUCTS.filter((p) => wishlist.includes(p.id));
  }, [wishlist]);

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic Multi-Dashboard Tab Switcher (Apple/Rolex inspired) */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 mb-10 gap-4">
          <div>
            <span className="text-[10px] tracking-[0.4em] text-gold-pure uppercase font-display block mb-1">
              ZOAL GROUP CORE COMMAND
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider font-display uppercase text-white">
              Sovereign Ecosystem
            </h1>
          </div>

          <div className="flex bg-zinc-950 p-1 border border-white/5 rounded-sm w-full sm:w-auto">
            <button
              onClick={() => setActiveDashboardTab('patron')}
              className={`flex-grow sm:flex-initial py-2.5 px-5 rounded-xs text-[10px] sm:text-xs font-display uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeDashboardTab === 'patron' ? 'bg-gold-pure text-black font-semibold' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Patron Area
            </button>
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
          </div>
        </div>

        {/* I. PATRON / CUSTOMER DASHBOARD */}
        {activeDashboardTab === 'patron' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Profile Block (column 1 to 4) */}
              <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-6 rounded-sm space-y-6">
                
                <div className="text-center pb-6 border-b border-white/5">
                  <div className="w-20 h-20 bg-gradient-to-tr from-gold-dark to-gold-pure rounded-full flex items-center justify-center text-black font-display font-bold text-2xl mx-auto shadow-[0_0_15px_rgba(212,175,55,0.25)]">
                    {currentUser ? currentUser.name.split('')[0] : 'V'}
                  </div>
                  <h3 className="text-white text-base font-display uppercase tracking-wider font-semibold mt-4">
                    {currentUser ? currentUser.name : 'VIP Guest Account'}
                  </h3>
                  <p className="text-gold-pure font-mono text-[10px] uppercase tracking-widest mt-1">Sovereign Privilege status</p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <p className="text-zinc-400">
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest">Email Address:</span>
                    {currentUser ? currentUser.email : 'guest@zoal.sa'}
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest">Phone Axis:</span>
                    {currentUser ? currentUser.phone : '+966 50 000 0000'}
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-zinc-500 block uppercase font-mono text-[9px] tracking-widest">Saved addresses:</span>
                    {currentUser ? currentUser.address : 'Al Shati District, Dammam, Saudi Arabia'}
                  </p>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xs flex items-center space-x-2">
                    <Star className="w-4 h-4 text-gold-pure fill-current animate-pulse" />
                    <span className="text-[10px] text-zinc-400">Estimated rewards balance: <strong>4,200 points</strong></span>
                  </div>
                </div>

              </div>

              {/* Interaction Block (column 5 to 12) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Internal subtab headers */}
                <div className="flex border-b border-white/5 gap-4">
                  <button
                    onClick={() => setCustomerSubTab('history')}
                    className={`py-3 text-[10px] font-display uppercase tracking-widest relative cursor-pointer ${
                      customerSubTab === 'history' ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    Order History ({orders.length})
                    {customerSubTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gold-pure" />}
                  </button>
                  <button
                    onClick={() => setCustomerSubTab('wishlist')}
                    className={`py-3 text-[10px] font-display uppercase tracking-widest relative cursor-pointer ${
                      customerSubTab === 'wishlist' ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    Your Wishlist ({wishlist.length})
                    {customerSubTab === 'wishlist' && <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gold-pure" />}
                  </button>
                </div>

                {/* Subtab Content: History */}
                {customerSubTab === 'history' && (
                  <div className="space-y-4">
                    {orders.length === 0 ? (
                      <div className="p-12 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
                        <Truck className="w-8 h-8 text-zinc-500 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-white text-xs font-display uppercase tracking-wider">No Orders Logged Yet</h4>
                        <p className="text-zinc-550 text-[10px] mt-1 max-w-xs mx-auto">Purchase fine coffees or linen apparel to activate courier tracking feeds.</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.id} className="p-5 border border-white/5 bg-[#060606] rounded-sm space-y-4 hover:border-gold-pure/15 duration-300">
                          
                          {/* Order Header */}
                          <div className="flex flex-col sm:flex-row justify-between text-xs gap-2 border-b border-white/5 pb-3">
                            <div className="space-y-0.5">
                              <span className="text-white font-mono font-semibold tracking-wider">{order.id}</span>
                              <span className="text-zinc-500 block font-mono text-[9px]">{order.date}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-gold-pure font-mono font-medium">{order.total} SAR</span>
                              <span className={`px-2 py-0.5 rounded-sm text-[8px] uppercase tracking-widest font-semibold ${
                                order.status === 'Completed' ? 'bg-emerald-900/30 text-emerald-400' :
                                order.status === 'Shipped' ? 'bg-blue-900/30 text-blue-400' :
                                order.status === 'Cancelled' ? 'bg-rose-900/40 text-rose-400' :
                                'bg-amber-900/30 text-amber-400 animate-pulse'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Items array */}
                          <div className="space-y-2">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-zinc-300 font-sans">{it.name} <strong className="text-zinc-400 font-mono">×{it.quantity}</strong></span>
                                <span className="text-zinc-500 font-mono">{it.price * it.quantity} SAR</span>
                              </div>
                            ))}
                          </div>

                          {/* Progress Bar Container */}
                          <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="uppercase tracking-[0.25em] text-zinc-500 font-display">Live Order Status</span>
                              <span className="font-mono text-zinc-650">VIP climate courier</span>
                            </div>

                            {order.status === 'Cancelled' ? (
                              <div className="p-3 bg-rose-950/20 border border-rose-500/10 text-rose-400 rounded-sm text-[10px] tracking-wide flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                <span>Bespoke Order was Cancelled. Core transaction credit safely reversed.</span>
                              </div>
                            ) : (
                              <div className="relative pt-2 pb-5">
                                {/* Background Line Track */}
                                <div className="absolute top-[14px] left-4 right-4 h-[1.5px] bg-zinc-950 z-0">
                                  <div 
                                    className="h-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.4)] transition-all duration-[800ms] ease-out"
                                    style={{
                                      width: 
                                        order.status === 'Pending' ? '0%' :
                                        order.status === 'Preparing' ? '33.33%' :
                                        order.status === 'Shipped' ? '66.66%' :
                                        order.status === 'Completed' ? '100%' : '0%'
                                    }}
                                  />
                                </div>

                                {/* Steps circle */}
                                <div className="relative z-10 flex justify-between items-center">
                                  {[
                                    { label: 'Confirmed', key: 'Pending', stepNum: 1 },
                                    { label: 'Preparing', key: 'Preparing', stepNum: 2 },
                                    { label: 'Out for Delivery', key: 'Shipped', stepNum: 3 },
                                    { label: 'Delivered', key: 'Completed', stepNum: 4 }
                                  ].map((step, idx) => {
                                    const statusOrder = ['Pending', 'Preparing', 'Shipped', 'Completed'];
                                    const currentIdx = statusOrder.indexOf(order.status);
                                    const stepIdx = statusOrder.indexOf(step.key);
                                    
                                    const isDone = stepIdx < currentIdx;
                                    const isCurrent = stepIdx === currentIdx;
                                    const isUpcoming = stepIdx > currentIdx;

                                    return (
                                      <div key={idx} className="flex flex-col items-center flex-1 text-center relative">
                                        {/* Step Indicator Dot */}
                                        <div 
                                          className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[9px] font-mono border transition-all duration-500 ${
                                            isCurrent 
                                              ? 'bg-black border-[#D4AF37] text-[#D4AF37] font-bold shadow-[0_0_10px_rgba(212,175,55,0.4)] scale-110' 
                                              : isDone 
                                              ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-semibold' 
                                              : 'bg-[#060606] border-zinc-900 text-zinc-500'
                                          }`}
                                        >
                                          {isDone ? '✓' : step.stepNum}
                                        </div>

                                        {/* Step Label */}
                                        <span 
                                          className={`text-[9px] tracking-wider uppercase font-display font-medium mt-2 block transition-colors duration-300 ${
                                            isCurrent ? 'text-[#D4AF37]' : isDone ? 'text-zinc-200' : 'text-zinc-500'
                                          }`}
                                        >
                                          {step.label}
                                        </span>

                                        {isCurrent && (
                                          <span className="text-[7.5px] font-mono tracking-widest text-[#D4AF37] uppercase absolute top-11 animate-pulse hidden sm:block">
                                            Active Stage
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Tracking indicators */}
                          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 text-[10px] text-zinc-500 gap-3 border-t border-white/5">
                            <div className="space-y-0.5 text-left">
                              <div>Courier Route: <strong className="text-zinc-300 font-mono tracking-wider">{order.trackingNumber}</strong></div>
                              <div>Est Delivery: <span className="text-zinc-400 font-medium">Sovereign climate courier</span></div>
                            </div>
                            <button
                              onClick={() => setSelectedDetailedOrder(order)}
                              className="w-full sm:w-auto px-3 py-2 border border-[#D4AF37]/35 hover:border-[#D4AF37] text-[#D4AF37] hover:text-white hover:bg-[#D4AF37]/10 text-[9px] font-bold uppercase tracking-[0.2em] rounded-sm transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Track Order & Timeline
                            </button>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Subtab Content: Wishlist bookmarks */}
                {customerSubTab === 'wishlist' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {userWishlistProducts.length === 0 ? (
                      <div className="col-span-2 p-12 text-center border border-dashed border-white/5 bg-zinc-950/25 rounded-sm">
                        <Bookmark className="w-8 h-8 text-zinc-500 mx-auto mb-3 animate-pulse" />
                        <h4 className="text-white text-xs font-display uppercase tracking-wider">No Reserved Items</h4>
                        <p className="text-zinc-550 text-[10px] mt-1">Bookmark catalog listings to quickly evaluate choices later.</p>
                      </div>
                    ) : (
                      userWishlistProducts.map((p) => (
                        <div key={p.id} className="p-4 border border-white/5 bg-[#060606] rounded-sm flex items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded-xs object-cover" />
                            <div>
                              <h4 className="text-white text-xs font-display font-semibold uppercase tracking-wider truncate max-w-[120px]">{p.name}</h4>
                              <span className="text-gold-pure text-[10px] font-mono">{p.price} SAR</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                onAddToCart(p, 1, 'Standard option selected');
                              }}
                              className="px-2.5 py-1.5 bg-white text-black text-[9px] uppercase font-display font-bold rounded-xs transition-colors hover:bg-gold-pure"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => onToggleWishlist(p.id)}
                              className="p-1 px-2 border border-white/5 hover:border-rose-500 hover:text-rose-500 rounded-xs text-[10px] transition-all"
                            >
                              X
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

              </div>

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
                <span className="text-2xl font-mono text-white font-bold">{PRODUCTS.length} Distinct Products</span>
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
                        <td className="py-4 font-mono text-zinc-300">{ord.total} SAR</td>
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

          </div>
        )}

        {/* III. EXECUTIVE OWNER DASHBOARD */}
        {activeDashboardTab === 'owner' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Owner quick performance overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-sm text-left relative overflow-hidden">
                <span className="text-[10px] tracking-widest text-zinc-500 uppercase block mb-1">Gross Net Sales (SAR)</span>
                <span className="text-3xl font-mono text-gold-pure font-bold block">{groupMetrics.totalSales.toFixed(2)} SAR</span>
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
                <span className="text-3xl font-mono text-gold-pure font-bold block">{groupMetrics.averageOrderValue.toFixed(2)} SAR</span>
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
                      <span className="font-mono text-zinc-200 font-semibold">189,500 SAR</span>
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
                      <span className="font-mono text-zinc-200 font-semibold">120,500 SAR</span>
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
                      <span className="leading-relaxed">This bespoke order was cancelled. Authorized billing amount of {selectedDetailedOrder.total} SAR has been reversed safely.</span>
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
                        <span className="text-zinc-400 font-mono">{it.price * it.quantity} SAR</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs font-semibold">
                      <span className="text-zinc-400 font-sans">Sovereign Net Value</span>
                      <span className="text-[#D4AF37] font-mono">{selectedDetailedOrder.total} SAR</span>
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
                    All delicate viennoiseries and specialty Geisha cold-brews are distributed under strict climate-controlled environments matching 18°C temperature baselines across Abu Bakr As Siddiq Rd (Al Hofuf) and Prince Mohammad Bin Fahd Rd (Dammam). Real-time dispatch is backed by Zoal Group Priority Services.
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
