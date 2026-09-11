import React, { useMemo } from 'react';
import { Order } from '../../types';
import {
  BarChart3,
  ClipboardList,
  PackageCheck,
  Truck,
  ArrowLeft,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CustomerDashboardProps {
  customerSubTab: string;
  setSidebarOpen: (open: boolean) => void;
  selectedOrder: Order | null;
  setSelectedOrder: (order: Order | null) => void;
  orders: Order[];
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'Completed';
    case 'Shipped':
      return 'Shipped';
    case 'Preparing':
      return 'Preparing';
    case 'Cancelled':
      return 'Cancelled';
    default:
      return 'Pending';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 className="w-4 h-4" />;
    case 'Shipped':
      return <Truck className="w-4 h-4" />;
    case 'Preparing':
      return <PackageCheck className="w-4 h-4" />;
    case 'Cancelled':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Clock3 className="w-4 h-4" />;
  }
};

export default function CustomerDashboard({
  customerSubTab,
  setSidebarOpen,
  selectedOrder,
  setSelectedOrder,
  orders,
}: CustomerDashboardProps) {
  const customerOrders = useMemo(() => {
    return Array.isArray(orders) ? orders : [];
  }, [orders]);

  const totals = useMemo(() => {
    const activeOrders = customerOrders.filter((order) => order.status !== 'Cancelled');
    return {
      orders: customerOrders.length,
      active: activeOrders.length,
      completed: customerOrders.filter((order) => order.status === 'Completed').length,
      spent: activeOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    };
  }, [customerOrders]);

  if (selectedOrder) {
    return (
      <section className="space-y-4" aria-label="Customer order details">
        <button
          type="button"
          onClick={() => setSelectedOrder(null)}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 hover:text-white rounded-sm text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Orders
        </button>

        <div className="bg-zinc-950 border border-white/5 rounded-sm p-5 space-y-4">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Order</p>
            <h2 className="text-lg font-semibold text-white mt-1">{selectedOrder.id}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Status</span>
              <div className="flex items-center gap-2 mt-2 text-zinc-200 text-sm">
                {getStatusIcon(selectedOrder.status)}
                {getStatusLabel(selectedOrder.status)}
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Total</span>
              <p className="text-sm text-white mt-2 font-semibold">{Number(selectedOrder.total || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Date</span>
              <p className="text-sm text-zinc-200 mt-2">{selectedOrder.date || '—'}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500">Items</span>
              <p className="text-sm text-zinc-200 mt-2">{Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (customerSubTab === 'orders' || customerSubTab === 'track' || customerSubTab === 'invoices') {
    return (
      <section className="space-y-4" aria-label="Customer orders">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Customer Area</p>
            <h2 className="text-lg font-semibold text-white mt-1">
              {customerSubTab === 'track' ? 'Track Orders' : customerSubTab === 'invoices' ? 'Invoices & Receipts' : 'My Orders'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-sm text-xs"
          >
            Menu
          </button>
        </div>

        {customerOrders.length === 0 ? (
          <div className="bg-zinc-950 border border-white/5 rounded-sm p-8 text-center text-zinc-500 text-sm">
            No customer orders are available.
          </div>
        ) : (
          <div className="space-y-2">
            {customerOrders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left bg-zinc-950 border border-white/5 hover:border-[#D4AF37]/30 rounded-sm p-4 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{order.id}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">{order.date || 'Date unavailable'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300">
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-semibold text-[#D4AF37]">{Number(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-label="Customer dashboard overview">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Customer Area</p>
          <h2 className="text-lg font-semibold text-white">Dashboard Overview</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-950 border border-white/5 rounded-sm p-4">
          <ClipboardList className="w-4 h-4 text-zinc-500" />
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 mt-3">Orders</p>
          <p className="text-xl font-semibold text-white mt-1">{totals.orders}</p>
        </div>
        <div className="bg-zinc-950 border border-white/5 rounded-sm p-4">
          <PackageCheck className="w-4 h-4 text-zinc-500" />
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 mt-3">Active</p>
          <p className="text-xl font-semibold text-white mt-1">{totals.active}</p>
        </div>
        <div className="bg-zinc-950 border border-white/5 rounded-sm p-4">
          <CheckCircle2 className="w-4 h-4 text-zinc-500" />
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 mt-3">Completed</p>
          <p className="text-xl font-semibold text-white mt-1">{totals.completed}</p>
        </div>
        <div className="bg-zinc-950 border border-white/5 rounded-sm p-4">
          <Truck className="w-4 h-4 text-zinc-500" />
          <p className="text-[9px] uppercase tracking-wider text-zinc-500 mt-3">Total Spent</p>
          <p className="text-xl font-semibold text-[#D4AF37] mt-1">{totals.spent.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-white/5 rounded-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Orders</h3>
            <p className="text-[10px] text-zinc-500 mt-1">Uses the orders supplied by the authenticated dashboard context.</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-sm text-xs"
          >
            Menu
          </button>
        </div>

        {customerOrders.slice(0, 5).map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => setSelectedOrder(order)}
            className="w-full flex items-center justify-between gap-3 py-3 border-t border-white/5 text-left hover:bg-white/[0.02]"
          >
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{order.id}</p>
              <p className="text-[9px] text-zinc-500 mt-1">{order.date || 'Date unavailable'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-zinc-400">{getStatusLabel(order.status)}</span>
              <span className="text-xs text-[#D4AF37] font-semibold">{Number(order.total || 0).toFixed(2)}</span>
            </div>
          </button>
        ))}

        {customerOrders.length === 0 && (
          <p className="text-sm text-zinc-500 py-5">No orders are available yet.</p>
        )}
      </div>
    </section>
  );
}
