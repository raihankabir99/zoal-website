import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Building2, MapPin, Phone, Mail, UserCheck, BarChart3, 
  Trash2, Edit, RefreshCw, Sliders, Package, CheckCircle2, AlertTriangle, 
  X, Layers, ShieldCheck, ArrowUpRight, Check, Warehouse as WarehouseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { supabaseClient } from '../lib/supabaseClient';
import { Product, Warehouse } from '../types';

interface WarehouseManagementProps {
  allProducts?: Product[];
  addLog?: (action: string, target?: string) => void;
}

export const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  allProducts = [],
  addLog
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Modal states for Create / Edit / Delete / Product Assignment
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'grid' | 'inventory' | 'analytics'>('grid');

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    warehouse_name: string;
    warehouse_code: string;
    country: string;
    city: string;
    address: string;
    manager: string;
    phone: string;
    email: string;
    capacity: number;
    used_capacity: number;
    status: string;
    latitude?: number;
    longitude?: number;
  }>({
    warehouse_name: '',
    warehouse_code: '',
    country: 'Saudi Arabia',
    city: 'Dammam',
    address: '',
    manager: '',
    phone: '',
    email: '',
    capacity: 10000,
    used_capacity: 0,
    status: 'Optimal',
    latitude: 26.4207,
    longitude: 50.0888
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [assignProductId, setAssignProductId] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  // Fetch warehouses from Supabase API endpoint
  const fetchWarehouses = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data || []);
      }
    } catch (err) {
      console.error('Failed to load warehouses from Supabase API:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();

    // Supabase Realtime Subscription for live warehouse updates
    let channel: any;
    try {
      channel = supabaseClient
        ?.channel?.('zoal_warehouses_changes')
        ?.on?.('postgres_changes', { event: '*', schema: 'public', table: 'zoal_warehouses' }, () => {
          fetchWarehouses(true);
        })
        ?.subscribe?.();
    } catch (e) {
      console.log('Realtime listener subscription skipped:', e);
    }

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, []);

  // Compute stats per warehouse
  const enrichedWarehouses = useMemo(() => {
    return warehouses.map(wh => {
      const matchingProds = allProducts.filter(p => {
        const loc = (p.warehouseLocation || '').toLowerCase();
        const name = (wh.warehouse_name || '').toLowerCase();
        const code = (wh.warehouse_code || '').toLowerCase();
        const city = (wh.city || '').toLowerCase();
        return loc.includes(name) || loc.includes(code) || loc.includes(city);
      });

      const totalProductCount = matchingProds.length;
      const totalStockUnits = matchingProds.reduce((acc, p) => acc + (Number(p.inventory) || 0), 0);
      const cap = Number(wh.capacity) || 10000;
      const used = Number(wh.used_capacity) || totalStockUnits || 0;
      const utilizationPct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;

      return {
        ...wh,
        assignedProductCount: totalProductCount,
        stockUnitsCount: totalStockUnits,
        utilizationPct
      };
    });
  }, [warehouses, allProducts]);

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    return enrichedWarehouses.filter(wh => {
      const matchesSearch = 
        wh.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.warehouse_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wh.manager.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || wh.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [enrichedWarehouses, searchQuery, statusFilter]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalHubs = enrichedWarehouses.length;
    const totalCap = enrichedWarehouses.reduce((acc, w) => acc + (Number(w.capacity) || 0), 0);
    const totalUsed = enrichedWarehouses.reduce((acc, w) => acc + (Number(w.used_capacity) || 0), 0);
    const avgUtil = totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
    const activeHubs = enrichedWarehouses.filter(w => w.status !== 'Inactive' && w.status !== 'Maintenance').length;

    return { totalHubs, totalCap, totalUsed, avgUtil, activeHubs };
  }, [enrichedWarehouses]);

  // Form Handlers
  const handleOpenCreate = () => {
    setFormData({
      warehouse_name: '',
      warehouse_code: `WH-HUB-${Math.floor(100 + Math.random() * 900)}`,
      country: 'Saudi Arabia',
      city: 'Dammam',
      address: '',
      manager: '',
      phone: '',
      email: '',
      capacity: 10000,
      used_capacity: 0,
      status: 'Optimal',
      latitude: 26.4207,
      longitude: 50.0888
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setFormData({
      id: wh.id,
      warehouse_name: wh.warehouse_name,
      warehouse_code: wh.warehouse_code,
      country: wh.country || 'Saudi Arabia',
      city: wh.city || 'Dammam',
      address: wh.address || '',
      manager: wh.manager || '',
      phone: wh.phone || '',
      email: wh.email || '',
      capacity: wh.capacity || 10000,
      used_capacity: wh.used_capacity || 0,
      status: wh.status || 'Optimal',
      latitude: wh.latitude,
      longitude: wh.longitude
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        if (addLog) addLog(`Created enterprise warehouse hub: ${formData.warehouse_name} (${formData.warehouse_code})`, 'Logistics System');
        setIsCreateModalOpen(false);
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(`Failed to save warehouse: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error creating warehouse: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/warehouses/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        if (addLog) addLog(`Updated warehouse configuration: ${formData.warehouse_name}`, 'Logistics System');
        setIsEditModalOpen(false);
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(`Failed to update warehouse: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error updating warehouse: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWarehouse) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/warehouses/${selectedWarehouse.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (addLog) addLog(`Deleted warehouse hub: ${selectedWarehouse.warehouse_name}`, 'Logistics System');
        setIsDeleteModalOpen(false);
        setSelectedWarehouse(null);
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(`Failed to delete warehouse: ${err.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error deleting warehouse: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouse || !assignProductId) return;
    setAssigning(true);
    try {
      const targetProd = allProducts.find(p => p.id === assignProductId);
      if (!targetProd) return;

      const newLoc = `${selectedWarehouse.warehouse_name} - Shelf A1`;
      const res = await fetch(`/api/products/${assignProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseLocation: newLoc })
      });

      if (res.ok) {
        if (addLog) addLog(`Assigned ${targetProd.name} to ${selectedWarehouse.warehouse_name}`, 'Logistics System');
        alert(`Successfully assigned ${targetProd.name} to ${selectedWarehouse.warehouse_name}`);
        setIsAssignModalOpen(false);
        setAssignProductId('');
        fetchWarehouses();
      } else {
        alert('Failed to reassign product warehouse location.');
      }
    } catch (err: any) {
      alert(`Error assigning product: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  // Chart data formatting
  const chartData = useMemo(() => {
    return enrichedWarehouses.map(w => ({
      name: w.warehouse_name.replace('Distribution Gate', 'Gate').replace('Lounge', '').replace('Gateway', ''),
      'Capacity Used %': w.utilizationPct
    }));
  }, [enrichedWarehouses]);

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      {/* Header Bar */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">
            SUPABASE REALTIME LOGISTICS ENGINE
          </span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-gold-pure inline-block" /> WAREHOUSE & FULFILLMENT GRID
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchWarehouses()}
            disabled={refreshing}
            className="p-2 bg-zinc-900 border border-white/10 hover:border-gold-pure/40 text-zinc-300 hover:text-white rounded-xs text-xs flex items-center gap-1.5 font-mono cursor-pointer transition-all"
            title="Refresh Supabase records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-gold-pure' : ''}`} />
            <span className="hidden sm:inline">Sync DB</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-gold-pure text-black py-2 px-4 rounded-xs text-[10px] uppercase font-mono tracking-wider font-extrabold hover:bg-gold-light transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Warehouse Hub
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[10px]">
        <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-1">
          <span className="text-zinc-500 uppercase tracking-wider block text-[8px]">Active Hubs</span>
          <span className="text-lg font-bold text-white block">{stats.activeHubs} / {stats.totalHubs}</span>
          <span className="text-emerald-400 text-[8px]">Live Supabase Sync</span>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-1">
          <span className="text-zinc-500 uppercase tracking-wider block text-[8px]">Total Capacity</span>
          <span className="text-lg font-bold text-gold-pure block">{stats.totalCap.toLocaleString()} Units</span>
          <span className="text-zinc-400 text-[8px]">Volumetric Volume</span>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-1">
          <span className="text-zinc-500 uppercase tracking-wider block text-[8px]">Occupied Inventory</span>
          <span className="text-lg font-bold text-white block">{stats.totalUsed.toLocaleString()} Units</span>
          <span className="text-zinc-400 text-[8px]">Allocated Stock</span>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-1">
          <span className="text-zinc-500 uppercase tracking-wider block text-[8px]">Avg Utilization</span>
          <span className="text-lg font-bold text-white block">{stats.avgUtil}%</span>
          <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-1">
            <div className="bg-gold-pure h-full" style={{ width: `${stats.avgUtil}%` }} />
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-1 col-span-2 md:col-span-1">
          <span className="text-zinc-500 uppercase tracking-wider block text-[8px]">Total SKUs Assigned</span>
          <span className="text-lg font-bold text-white block">{allProducts.length} Items</span>
          <span className="text-zinc-400 text-[8px]">Across Catalog</span>
        </div>
      </div>

      {/* Filter and Tab Controller */}
      <div className="bg-zinc-950 border border-white/5 p-3 rounded-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 font-mono text-[10px]">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search hubs by name, code, manager, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border border-white/10 pl-9 pr-3 py-1.5 text-white outline-none focus:border-gold-pure rounded-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-white/10 px-3 py-1.5 text-white outline-none focus:border-gold-pure rounded-xs"
          >
            <option value="all">All Statuses</option>
            <option value="optimal">Optimal</option>
            <option value="near capacity">Near Capacity</option>
            <option value="under-utilized">Under-utilized</option>
            <option value="full">Full</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-black p-1 border border-white/10 rounded-xs">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1 uppercase text-[9px] font-bold rounded-xs cursor-pointer transition-all ${
              activeTab === 'grid' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hub Cards
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1 uppercase text-[9px] font-bold rounded-xs cursor-pointer transition-all ${
              activeTab === 'inventory' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            SKU Distribution
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 uppercase text-[9px] font-bold rounded-xs cursor-pointer transition-all ${
              activeTab === 'analytics' ? 'bg-gold-pure text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Capacity Analytics
          </button>
        </div>
      </div>

      {/* TAB 1: GRID CARDS (Exact design matching user specification) */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-950 border border-white/5 p-5 rounded-xs animate-pulse space-y-3 h-44">
                <div className="h-4 w-3/4 bg-zinc-800 rounded-xs" />
                <div className="h-3 w-1/2 bg-zinc-800 rounded-xs" />
                <div className="h-10 bg-zinc-900 rounded-xs mt-4" />
              </div>
            ))
          ) : filteredWarehouses.length === 0 ? (
            <div className="col-span-full bg-zinc-950 border border-white/5 p-8 text-center text-zinc-500 font-mono text-xs uppercase tracking-widest rounded-xs">
              No matching warehouse hubs found in Supabase.
            </div>
          ) : (
            filteredWarehouses.map((wh) => {
              const cap = Number(wh.capacity) || 10000;
              const used = Number(wh.used_capacity) || 0;
              const capPct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
              const status = wh.status || 'Optimal';

              const statusBadgeStyle = 
                status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                status === 'Near Capacity' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                status === 'Full' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20';

              return (
                <div key={wh.id} className="bg-zinc-950 border border-white/5 hover:border-gold-pure/30 p-5 rounded-xs space-y-4 transition-all duration-200 group relative">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[8px] font-mono text-gold-pure uppercase block tracking-wider">{wh.warehouse_code}</span>
                      <h4 className="text-white font-semibold text-xs uppercase tracking-wide font-display mt-0.5">{wh.warehouse_name}</h4>
                    </div>
                    <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider ${statusBadgeStyle}`}>
                      {status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="flex justify-between text-zinc-400">
                      <span>City & Region:</span>
                      <span className="text-white font-mono font-medium">{wh.city}, {wh.country}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Manager:</span>
                      <span className="text-white font-mono">{wh.manager || 'Unassigned'}</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Active Stock Units:</span>
                      <span className="text-white font-mono font-bold">{wh.stockUnitsCount ?? used} units</span>
                    </div>

                    <div className="flex justify-between text-zinc-400">
                      <span>Catalog SKUs:</span>
                      <span className="text-white font-mono">{wh.assignedProductCount ?? 0} SKUs</span>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Capacity Utilization</span>
                        <span className="text-gold-pure font-bold">{capPct}% ({used} / {cap})</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            capPct > 90 ? 'bg-rose-500' : capPct > 75 ? 'bg-amber-400' : 'bg-gold-pure'
                          }`}
                          style={{ width: `${capPct}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-mono pt-2">
                    <button
                      onClick={() => {
                        setSelectedWarehouse(wh);
                        setIsAssignModalOpen(true);
                      }}
                      className="text-gold-pure hover:underline flex items-center gap-1 uppercase font-bold cursor-pointer"
                    >
                      + Assign SKU
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(wh)}
                        className="p-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xs border border-white/5"
                        title="Edit Warehouse Configuration"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWarehouse(wh);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 bg-zinc-900 hover:bg-rose-950 text-zinc-300 hover:text-rose-400 rounded-xs border border-white/5"
                        title="Delete Warehouse"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY BY WAREHOUSE */}
      {activeTab === 'inventory' && (
        <div className="bg-zinc-950 border border-white/5 rounded-xs p-5 space-y-4 font-mono text-[11px]">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div>
              <h3 className="text-white text-xs font-display uppercase tracking-widest">PRODUCT SOURCING DISTRIBUTION BY HUB</h3>
              <p className="text-[9.5px] text-zinc-500 mt-0.5">Live stock counts mapped from Supabase zoal_products collection.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left divide-y divide-white/5">
              <thead className="bg-white/[0.01] text-zinc-500 text-[8.5px] uppercase tracking-widest">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Assigned Location</th>
                  <th className="p-3 text-right">Available Inventory</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-500 uppercase tracking-widest text-[10px]">
                      No catalog products registered in database.
                    </td>
                  </tr>
                ) : (
                  allProducts.map((p) => {
                    const loc = p.warehouseLocation || 'Central Storage D2';
                    const stock = p.inventory ?? 0;
                    const isLow = stock <= (p.lowStockThreshold || 5);

                    return (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 font-sans font-medium text-white">{p.name}</td>
                        <td className="p-3 text-gold-pure font-mono text-[10px]">{p.sku || p.id}</td>
                        <td className="p-3 text-zinc-400 capitalize">{p.category}</td>
                        <td className="p-3 text-zinc-300 font-mono text-[10px]">{loc}</td>
                        <td className="p-3 text-right font-bold text-white">{stock} units</td>
                        <td className="p-3 text-center">
                          <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold ${
                            stock === 0 ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20' :
                            isLow ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {stock === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              const newLocation = prompt('Enter new Warehouse Location string:', loc);
                              if (newLocation && newLocation !== loc) {
                                fetch(`/api/products/${p.id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ warehouseLocation: newLocation })
                                }).then(res => {
                                  if (res.ok) {
                                    alert('Warehouse location updated.');
                                    fetchWarehouses();
                                  }
                                });
                              }
                            }}
                            className="text-[9px] text-gold-pure hover:underline uppercase font-bold"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CAPACITY ANALYTICS CHART */}
      {activeTab === 'analytics' && (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div>
              <h3 className="text-white text-xs font-display uppercase tracking-widest">CAPACITY UTILIZATION & DISTRIBUTION ANALYSIS</h3>
              <p className="text-[9.5px] text-zinc-500 font-mono mt-0.5">Real-time capacity ratios fetched directly from Supabase DB.</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#222', borderRadius: '2px', color: '#fff' }}
                  formatter={(val: any) => [`${val}%`, 'Capacity Used']}
                />
                <Bar dataKey="Capacity Used %" fill="#D4AF37">
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D4AF37' : '#C5A028'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WAREHOUSE */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-6 rounded-xs max-w-xl w-full text-left space-y-4 font-mono text-[10.5px]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-white font-bold uppercase tracking-wider text-xs font-display">CREATE ENTERPRISE WAREHOUSE HUB</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Warehouse Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Riyadh Central Hub"
                      value={formData.warehouse_name}
                      onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Warehouse Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WH-RUH-05"
                      value={formData.warehouse_code}
                      onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    >
                      <option value="Optimal">Optimal</option>
                      <option value="Near Capacity">Near Capacity</option>
                      <option value="Under-utilized">Under-utilized</option>
                      <option value="Full">Full</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Manager Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Abdullah Al-Otaibi"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+966 50 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Total Unit Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Used Unit Capacity</label>
                    <input
                      type="number"
                      value={formData.used_capacity}
                      onChange={(e) => setFormData({ ...formData, used_capacity: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Physical Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Gate 4, Sully Industrial Logistics Park"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xs uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gold-pure text-black font-extrabold uppercase rounded-xs hover:bg-gold-light"
                  >
                    {saving ? 'Persisting...' : 'Save Hub to Supabase'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT WAREHOUSE */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-6 rounded-xs max-w-xl w-full text-left space-y-4 font-mono text-[10.5px]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-white font-bold uppercase tracking-wider text-xs font-display">EDIT WAREHOUSE CONFIGURATION</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Warehouse Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.warehouse_name}
                      onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Warehouse Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.warehouse_code}
                      onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    >
                      <option value="Optimal">Optimal</option>
                      <option value="Near Capacity">Near Capacity</option>
                      <option value="Under-utilized">Under-utilized</option>
                      <option value="Full">Full</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Manager Name</label>
                    <input
                      type="text"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Total Capacity</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Used Capacity</label>
                    <input
                      type="number"
                      value={formData.used_capacity}
                      onChange={(e) => setFormData({ ...formData, used_capacity: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xs uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-gold-pure text-black font-extrabold uppercase rounded-xs hover:bg-gold-light"
                  >
                    {saving ? 'Updating...' : 'Update Supabase Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedWarehouse && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-rose-500/20 p-6 rounded-xs max-w-md w-full text-left space-y-4 font-mono text-[11px]"
            >
              <h3 className="text-rose-400 font-bold uppercase tracking-wider text-xs font-display">DELETE WAREHOUSE HUB</h3>
              <p className="text-zinc-300 font-sans">
                Are you sure you want to delete <strong className="text-white">{selectedWarehouse.warehouse_name}</strong> ({selectedWarehouse.warehouse_code})? This will remove the facility from Supabase database.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xs uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-5 py-2 bg-rose-600 text-white font-extrabold uppercase rounded-xs hover:bg-rose-500"
                >
                  {saving ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ASSIGN PRODUCT */}
      <AnimatePresence>
        {isAssignModalOpen && selectedWarehouse && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-white/10 p-6 rounded-xs max-w-md w-full text-left space-y-4 font-mono text-[11px]"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-gold-pure font-bold uppercase tracking-wider text-xs font-display">
                  ASSIGN PRODUCT SKU TO HUB
                </h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-zinc-400 font-sans text-xs">
                Select a product SKU from catalog to reassign its primary sourcing location to <strong className="text-white">{selectedWarehouse.warehouse_name}</strong>.
              </p>

              <form onSubmit={handleAssignProduct} className="space-y-3">
                <div>
                  <label className="text-zinc-500 block uppercase text-[8.5px] mb-1">Catalog Product *</label>
                  <select
                    required
                    value={assignProductId}
                    onChange={(e) => setAssignProductId(e.target.value)}
                    className="w-full bg-black border border-white/10 p-2 text-white outline-none focus:border-gold-pure text-xs"
                  >
                    <option value="">SELECT PRODUCT SKU...</option>
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || p.id}) — Current: {p.warehouseLocation || 'Default Hub'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded-xs uppercase font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assigning || !assignProductId}
                    className="px-5 py-2 bg-gold-pure text-black font-extrabold uppercase rounded-xs hover:bg-gold-light disabled:opacity-40"
                  >
                    {assigning ? 'Assigning...' : 'Assign SKU Location'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
