import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  Globe, TrendingUp, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, FileSpreadsheet, ChevronLeft, ChevronRight, AlertCircle, 
  MapPin, Check, DollarSign, ShoppingBag, Users, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface RegionalRecord {
  id: string;
  country: string;
  city: string;
  orders_count: number;
  revenue: number;
  customers_count: number;
  shipping_cost: number;
  growth_rate: number;
  captured_at: string;
}

export const EnterpriseRegionalAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Database States
  const [records, setRecords] = useState<RegionalRecord[]>([]);

  // Filtering states
  const [citySearch, setCitySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states for Create/Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RegionalRecord | null>(null);
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('Saudi Arabia');
  const [formOrders, setFormOrders] = useState('');
  const [formRevenue, setFormRevenue] = useState('');
  const [formCustomers, setFormCustomers] = useState('');
  const [formShipping, setFormShipping] = useState('');
  const [formGrowth, setFormGrowth] = useState('');

  // Fetch from REST API
  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics/regional');
      if (!res.ok) throw new Error('Could not query secure analytics endpoint.');
      const data = await res.json();
      setRecords(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Cryptographic endpoint handshake failed.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription setup
  useEffect(() => {
    fetchRegionalData();

    const channel = supabaseClient
      .channel('regional-analytics-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_regional_analytics' },
        () => { fetchRegionalData(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Seeding initial Saudi Arabian cities for high visual quality
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      const saudiCities = [
        { country: 'Saudi Arabia', city: 'Riyadh', orders_count: 340, revenue: 125000.00, customers_count: 290, shipping_cost: 11900.00, growth_rate: 18.2 },
        { country: 'Saudi Arabia', city: 'Khobar', orders_count: 210, revenue: 84000.00, customers_count: 180, shipping_cost: 7350.00, growth_rate: 14.5 },
        { country: 'Saudi Arabia', city: 'Jeddah', orders_count: 155, revenue: 54000.00, customers_count: 130, shipping_cost: 5425.00, growth_rate: 11.8 },
        { country: 'Saudi Arabia', city: 'Al Hofuf', orders_count: 120, revenue: 38000.00, customers_count: 110, shipping_cost: 4200.00, growth_rate: 22.4 },
        { country: 'Saudi Arabia', city: 'Dammam', orders_count: 95, revenue: 29000.00, customers_count: 85, shipping_cost: 3325.00, growth_rate: 9.6 }
      ];

      for (const item of saudiCities) {
        await supabaseClient.from('zoal_regional_analytics').insert(item);
      }
      await fetchRegionalData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Form for Create
  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormCity('');
    setFormCountry('Saudi Arabia');
    setFormOrders('150');
    setFormRevenue('45000');
    setFormCustomers('125');
    setFormShipping('5250');
    setFormGrowth('12.5');
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (rec: RegionalRecord) => {
    setEditingRecord(rec);
    setFormCity(rec.city);
    setFormCountry(rec.country);
    setFormOrders(rec.orders_count.toString());
    setFormRevenue(rec.revenue.toString());
    setFormCustomers(rec.customers_count.toString());
    setFormShipping(rec.shipping_cost.toString());
    setFormGrowth(rec.growth_rate.toString());
    setIsFormOpen(true);
  };

  // Handle Submit (Create / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCity.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      const payload = {
        country: formCountry,
        city: formCity,
        orders_count: parseInt(formOrders) || 0,
        revenue: parseFloat(formRevenue) || 0,
        customers_count: parseInt(formCustomers) || 0,
        shipping_cost: parseFloat(formShipping) || 0,
        growth_rate: parseFloat(formGrowth) || 0
      };

      if (editingRecord) {
        // Edit
        const { error: err } = await supabaseClient
          .from('zoal_regional_analytics')
          .update(payload)
          .eq('id', editingRecord.id);
        if (err) throw err;
      } else {
        // Create
        const { error: err } = await supabaseClient
          .from('zoal_regional_analytics')
          .insert(payload);
        if (err) throw err;
      }

      setIsFormOpen(false);
      await fetchRegionalData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure updating regional analytics data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Record
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this regional analytical unit?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient
        .from('zoal_regional_analytics')
        .delete()
        .eq('id', id);
      if (err) throw err;
      await fetchRegionalData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic calculations
  const totalRevenue = useMemo(() => records.reduce((sum, r) => sum + Number(r.revenue), 0), [records]);
  const totalOrders = useMemo(() => records.reduce((sum, r) => sum + Number(r.orders_count), 0), [records]);
  const totalCustomers = useMemo(() => records.reduce((sum, r) => sum + Number(r.customers_count), 0), [records]);
  const avgGrowth = useMemo(() => records.length ? parseFloat((records.reduce((sum, r) => sum + Number(r.growth_rate), 0) / records.length).toFixed(1)) : 0, [records]);

  // Chart dataset
  const chartData = useMemo(() => {
    return records.map(r => ({
      city: r.city,
      Revenue: Number(r.revenue),
      Customers: Number(r.customers_count),
      Orders: Number(r.orders_count),
    }));
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter(r => r.city.toLowerCase().includes(citySearch.toLowerCase()));
  }, [records, citySearch]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["City,Country,Orders Count,Revenue (SAR),Customers,Shipping Cost,Growth Rate (%)"].concat(
        records.map(r => `"${r.city}","${r.country}",${r.orders_count},${r.revenue},${r.customers_count},${r.shipping_cost},${r.growth_rate}`)
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_REGIONAL_REPORTS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN EXPANSION</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-gold-pure" />
            Regional Analytics Center
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchRegionalData} 
            className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-1 bg-gold-pure text-black font-bold p-2 hover:bg-gold-pure/80 rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add City Unit
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4" />
          <span>Error Code 500: {error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(n => (
            <div key={n} className="bg-zinc-950/40 border border-white/5 p-5 rounded-xs space-y-2 animate-pulse">
              <div className="h-3 bg-zinc-800 w-1/3 rounded-sm" />
              <div className="h-6 bg-zinc-800 w-2/3 rounded-sm" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {records.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Globe className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">No Regional Units Configured</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                The database registers contain no localized city statistics for regional marketing audits. Seeding authentic Dammam, Hofuf, Riyadh, and Jeddah benchmarks immediately unlocks dynamic visualizations.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer"
              >
                Auto-Seed Saudi Benchmarks
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Consolidated Sales</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    <DollarSign className="w-4 h-4 text-gold-pure" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Total Regional Orders</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalOrders}</span>
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Total Core VIP Clientele</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalCustomers}</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Average Growth Velocity</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gold-pure text-md font-bold font-mono">+{avgGrowth}%</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visualizer */}
                <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Localized Revenue Contribution (SAR)</h3>
                  <div className="h-64 text-xs font-mono">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="city" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                        <Bar dataKey="Revenue" fill="#D4AF37" radius={[2, 2, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D4AF37' : '#AA8C2C'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Table list panel */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">City Node Registries</h3>
                    <p className="text-zinc-500 text-[10px]">Realtime Supabase audit rows.</p>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search city..."
                      value={citySearch}
                      onChange={(e) => { setCitySearch(e.target.value); setCurrentPage(1); }}
                      className="w-full bg-black border border-white/5 text-white pl-8 pr-3 py-1.5 rounded-xs text-[11px] outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {paginatedRecords.map(r => (
                      <div key={r.id} className="p-3 bg-black border border-white/5 rounded-xs space-y-2 hover:border-gold-pure/20 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-white font-bold text-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gold-pure" />
                              {r.city}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono uppercase">{r.country}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => handleOpenEdit(r)} className="p-1 text-zinc-500 hover:text-white cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDelete(r.id)} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash className="w-3 h-3" /></button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-2">
                          <div>Rev: <strong className="text-white">${Number(r.revenue).toLocaleString()}</strong></div>
                          <div>Ord: <strong className="text-white">{r.orders_count}</strong></div>
                          <div>Growth: <strong className="text-emerald-400">+{r.growth_rate}%</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-between items-center font-mono text-[9px] text-zinc-500 pt-2 border-t border-white/5">
                      <span>PAGE {currentPage} OF {totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => p - 1)}
                          className="p-1 px-1.5 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => p + 1)}
                          className="p-1 px-1.5 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </>
      )}

      {/* Form Dialog/Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-md w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">
                {editingRecord ? 'Edit City Node' : 'Register New City Node'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">City Name</label>
                    <input 
                      type="text" 
                      required
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Country</label>
                    <input 
                      type="text" 
                      required
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Orders Count</label>
                    <input 
                      type="number" 
                      required
                      value={formOrders}
                      onChange={(e) => setFormOrders(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Revenue (SAR)</label>
                    <input 
                      type="number" 
                      required
                      value={formRevenue}
                      onChange={(e) => setFormRevenue(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Customers Count</label>
                    <input 
                      type="number" 
                      required
                      value={formCustomers}
                      onChange={(e) => setFormCustomers(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Shipping Cost (SAR)</label>
                    <input 
                      type="number" 
                      required
                      value={formShipping}
                      onChange={(e) => setFormShipping(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Growth Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    required
                    value={formGrowth}
                    onChange={(e) => setFormGrowth(e.target.value)}
                    className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-2 border border-white/5 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-2 bg-gold-pure text-black font-bold rounded-xs cursor-pointer"
                  >
                    {actionLoading ? 'COMMITTING...' : 'REGISTER'}
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
