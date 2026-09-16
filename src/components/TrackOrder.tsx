import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, PackageCheck, Search, Truck } from 'lucide-react';
import { Order } from '../types';

interface TrackOrderProps {
  orders: Order[];
  setCurrentPage: (page: string) => void;
  isEmbedded?: boolean;
}

const STATUS_MAP: Record<string, Order['status']> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing', preparing: 'Preparing', packed: 'Packed',
  ready_for_shipping: 'Ready for Shipping', shipped: 'Shipped', out_for_delivery: 'Out for Delivery', delivered: 'Delivered',
  completed: 'Completed', cancelled: 'Cancelled', returned: 'Returned', refund_requested: 'Refund Requested',
  refund_approved: 'Refund Approved', refund_completed: 'Refund Completed',
};

function mapApiOrder(row: any): Order {
  return {
    id: String(row.id), date: row.created_at || row.date || '', items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal || 0), shipping: Number(row.shipping_cost || 0), discount: Number(row.discount_amount || 0),
    total: Number(row.total_amount || 0), status: STATUS_MAP[String(row.status || '').toLowerCase()] || 'Pending',
    customerName: row.customer_name || '', email: row.email || '', phone: row.phone || '', address: row.shipping_address || row.address || '',
    paymentMethod: row.payment_method || '—', trackingNumber: row.tracking_number || '',
  };
}

const statusIcon = (status: Order['status']) => {
  if (status === 'Delivered' || status === 'Completed') return <CheckCircle2 className="w-4 h-4" />;
  if (status === 'Shipped' || status === 'Out for Delivery') return <Truck className="w-4 h-4" />;
  if (status === 'Preparing' || status === 'Packed' || status === 'Processing') return <PackageCheck className="w-4 h-4" />;
  if (status === 'Cancelled' || status === 'Returned') return <AlertCircle className="w-4 h-4" />;
  return <Clock3 className="w-4 h-4" />;
};

export default function TrackOrder({ orders: _orders, setCurrentPage, isEmbedded = false }: TrackOrderProps) {
  const [authoritativeOrders, setAuthoritativeOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
      if (!token) {
        if (!cancelled) { setAuthoritativeOrders([]); setLoading(false); setError('Authentication is required to view order tracking.'); }
        return;
      }
      try {
        const response = await fetch('/api/orders/my-orders?limit=100&page=1', { headers: { Authorization: `Bearer ${token}` } });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || `Orders request failed (${response.status})`);
        const rows = Array.isArray(payload?.data?.orders) ? payload.data.orders : Array.isArray(payload?.orders) ? payload.orders : [];
        if (!cancelled) { setAuthoritativeOrders(rows.map(mapApiOrder)); setError(''); }
      } catch (err: any) {
        console.error('Failed to load authoritative customer orders:', err);
        if (!cancelled) { setAuthoritativeOrders([]); setError('Unable to load your orders. Please try again.'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    loadOrders();
    return () => { cancelled = true; };
  }, []);

  const orders = useMemo(() => authoritativeOrders, [authoritativeOrders]);

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalized = orderId.trim().toLowerCase();
    if (!normalized) { setError('Enter an order ID to track.'); setSelectedOrder(null); return; }
    setSearching(true);
    setError('');
    const found = orders.find((order) => order.id.toLowerCase() === normalized);
    setSelectedOrder(found || null);
    if (!found) setError('No order matching that ID was found in your authenticated orders.');
    setSearching(false);
  };

  const reset = () => { setOrderId(''); setSelectedOrder(null); setError(''); };

  return (
    <section className={`space-y-5 ${isEmbedded ? '' : 'max-w-4xl mx-auto'}`} aria-label="Customer order tracking">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[9px] uppercase tracking-[0.3em] text-zinc-500">Customer Area</p><h2 className="text-xl font-semibold text-white mt-1">Track Orders</h2><p className="text-xs text-zinc-500 mt-1">Tracking data is loaded from your authenticated orders.</p></div>
        <button type="button" onClick={() => setCurrentPage('dashboard')} className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-sm text-xs"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
      </div>
      <form onSubmit={handleSearch} className="bg-zinc-950 border border-white/5 rounded-sm p-4 flex flex-col sm:flex-row gap-2">
        <input value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Enter your order ID" aria-label="Order ID" className="flex-1 bg-black/30 border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50" />
        <button type="submit" disabled={loading || searching} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D4AF37] text-black rounded-sm text-xs font-semibold disabled:opacity-50"><Search className="w-3.5 h-3.5" /> {searching ? 'Searching…' : 'Track Order'}</button>
      </form>
      {loading && <div className="bg-zinc-950 border border-white/5 rounded-sm p-8 text-center text-sm text-zinc-500">Loading your orders…</div>}
      {!loading && error && <div className="bg-zinc-950 border border-red-500/20 rounded-sm p-4 text-sm text-red-300">{error}</div>}
      {!loading && !selectedOrder && !error && <div className="bg-zinc-950 border border-white/5 rounded-sm p-5 space-y-2"><p className="text-[10px] uppercase tracking-wider text-zinc-500">Your orders</p>{orders.length === 0 ? <p className="text-sm text-zinc-500 py-4">No orders are available for this account.</p> : orders.map((order) => <button key={order.id} type="button" onClick={() => { setOrderId(order.id); setSelectedOrder(order); }} className="w-full text-left flex items-center justify-between gap-3 py-3 border-t border-white/5 hover:bg-white/[0.02]"><span className="text-xs text-white font-medium">{order.id}</span><span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">{statusIcon(order.status)} {order.status}</span></button>)}</div>}
      {selectedOrder && <div className="bg-zinc-950 border border-white/5 rounded-sm p-5 space-y-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] uppercase tracking-wider text-zinc-500">Order</p><h3 className="text-lg font-semibold text-white mt-1">{selectedOrder.id}</h3></div><button type="button" onClick={reset} className="px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-sm text-xs">Track another</button></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border border-white/5 p-3 rounded-sm"><span className="text-[9px] uppercase tracking-wider text-zinc-500">Status</span><div className="flex items-center gap-2 mt-2 text-sm text-zinc-200">{statusIcon(selectedOrder.status)}{selectedOrder.status}</div></div>
          <div className="border border-white/5 p-3 rounded-sm"><span className="text-[9px] uppercase tracking-wider text-zinc-500">Tracking</span><p className="text-sm text-white mt-2">{selectedOrder.trackingNumber || 'Not assigned'}</p></div>
          <div className="border border-white/5 p-3 rounded-sm"><span className="text-[9px] uppercase tracking-wider text-zinc-500">Order Date</span><p className="text-sm text-zinc-200 mt-2">{selectedOrder.date || '—'}</p></div>
          <div className="border border-white/5 p-3 rounded-sm"><span className="text-[9px] uppercase tracking-wider text-zinc-500">Total</span><p className="text-sm text-[#D4AF37] mt-2">{Number(selectedOrder.total || 0).toFixed(2)}</p></div>
        </div>
        <div className="border-t border-white/5 pt-4"><p className="text-[9px] uppercase tracking-wider text-zinc-500 mb-2">Delivery information</p><p className="text-sm text-zinc-300">{selectedOrder.address || 'Shipping address unavailable'}</p></div>
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm p-4 text-xs text-amber-200">Tracking events are shown only when the backend provides authoritative status/tracking data. No estimated or simulated timeline is generated by this component.</div>
      </div>}
    </section>
  );
}