import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Download, Globe, RefreshCw, Search, ShoppingBag, TrendingUp, Users, DollarSign } from 'lucide-react';
import { ResponsiveContainer, Bar, BarChart, Tooltip, XAxis, YAxis } from 'recharts';

interface RegionalAnalyticsRow {
  region: string;
  revenue: number;
  orderCount: number;
  customerCount: number;
  shippingCost: number;
  aov: number;
  growth: number | null;
  growthStatus: string;
  status: string;
  capturedAt: string;
}

export const EnterpriseRegionalAnalytics: React.FC = () => {
  const [records, setRecords] = useState<RegionalAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 5;

  const fetchRegionalData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', new Date(`${startDate}T00:00:00`).toISOString());
      if (endDate) params.set('endDate', new Date(`${endDate}T23:59:59.999`).toISOString());
      const query = params.toString();
      const res = await fetch(`/api/analytics/regional${query ? `?${query}` : ''}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Could not query secure regional analytics endpoint.');
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load regional analytics.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchRegionalData(); }, []);

  const totalRevenue = useMemo(() => records.reduce((sum, r) => sum + Number(r.revenue || 0), 0), [records]);
  const totalOrders = useMemo(() => records.reduce((sum, r) => sum + Number(r.orderCount || 0), 0), [records]);
  const totalCustomers = useMemo(() => records.reduce((sum, r) => sum + Number(r.customerCount || 0), 0), [records]);
  const totalShipping = useMemo(() => records.reduce((sum, r) => sum + Number(r.shippingCost || 0), 0), [records]);
  const overallAov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const growthValues = useMemo(() => records.map(r => r.growth).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)), [records]);
  const averageGrowth = growthValues.length ? growthValues.reduce((a, b) => a + b, 0) / growthValues.length : null;

  const filteredRecords = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    return q ? records.filter(r => (r.region || '').toLowerCase().includes(q)) : records;
  }, [records, citySearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredRecords, currentPage]);

  const chartData = useMemo(() => records.map(r => ({ city: r.region, Revenue: Number(r.revenue || 0), Orders: Number(r.orderCount || 0), Customers: Number(r.customerCount || 0) })), [records]);

  const handleExportCSV = () => {
    const header = 'Region,Orders,Revenue (SAR),Customers,Shipping Cost (SAR),AOV (SAR),Growth (%)';
    const rows = records.map(r => [r.region, r.orderCount, r.revenue, r.customerCount, r.shippingCost, r.aov, r.growth ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZOAL_REGIONAL_ANALYTICS_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCitySearch('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SOVEREIGN EXPANSION</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2"><Globe className="w-5 h-5 text-gold-pure" />Regional Analytics Center</h2>
          <p className="text-zinc-500 text-[10px] mt-1">Automatically derived from authoritative order and shipping-address data.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => void fetchRegionalData()} className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
          <button onClick={handleExportCSV} disabled={!records.length} className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer disabled:opacity-30"><Download className="w-3.5 h-3.5" />CSV</button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs flex flex-col md:flex-row gap-3 md:items-end">
        <div><label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none" /></div>
        <div><label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none" /></div>
        <button onClick={() => void fetchRegionalData()} disabled={loading || (!!startDate && !!endDate && endDate < startDate)} className="bg-gold-pure text-black font-bold p-2 rounded-xs text-[10px] font-mono uppercase disabled:opacity-40">Apply</button>
        <button onClick={clearFilters} className="bg-black border border-white/5 text-zinc-400 p-2 rounded-xs text-[10px] font-mono uppercase">Clear</button>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}

      {loading ? <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{[1,2,3,4].map(n => <div key={n} className="bg-zinc-950/40 border border-white/5 p-5 rounded-xs space-y-2 animate-pulse"><div className="h-3 bg-zinc-800 w-1/3 rounded-sm" /><div className="h-6 bg-zinc-800 w-2/3 rounded-sm" /></div>)}</div> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi label="Regional Revenue" value={`${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR`} icon={<DollarSign className="w-4 h-4 text-gold-pure" />} />
            <Kpi label="Total Orders" value={totalOrders.toLocaleString()} icon={<ShoppingBag className="w-4 h-4" />} />
            <Kpi label="Unique Customers" value={totalCustomers.toLocaleString()} icon={<Users className="w-4 h-4" />} />
            <Kpi label="AOV" value={`${overallAov.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR`} icon={<DollarSign className="w-4 h-4" />} />
            <Kpi label="Avg Growth" value={averageGrowth === null ? 'N/A' : `${averageGrowth >= 0 ? '+' : ''}${averageGrowth.toFixed(1)}%`} icon={<TrendingUp className="w-4 h-4" />} />
          </div>

          {records.length === 0 ? <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs"><Globe className="w-12 h-12 text-gold-pure/40 mx-auto mb-4" /><h3 className="text-white font-bold uppercase tracking-widest font-display text-sm">No Regional Order Data</h3><p className="text-zinc-500 text-xs max-w-md mx-auto mt-2">No qualifying order data was returned for the selected period.</p></div> : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Regional Revenue Contribution (SAR)</h3>
                <div className="h-64 text-xs font-mono"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="city" stroke="#444" tick={{ fill: '#888', fontSize: 10 }} /><YAxis stroke="#444" tick={{ fill: '#888', fontSize: 10 }} /><Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} /><Bar dataKey="Revenue" fill="#D4AF37" radius={[2,2,0,0]} /></BarChart></ResponsiveContainer></div>
              </div>

              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-3"><h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Regional Performance</h3><p className="text-zinc-500 text-[10px]">Live aggregated order metrics.</p></div>
                <div className="relative"><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" /><input type="text" placeholder="Search city..." value={citySearch} onChange={e => { setCitySearch(e.target.value); setCurrentPage(1); }} className="w-full bg-black border border-white/5 text-white pl-8 pr-3 py-1.5 rounded-xs text-[11px] outline-none" /></div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {paginatedRecords.map(r => <div key={`${r.region}`} className="p-3 bg-black border border-white/5 rounded-xs space-y-2"><div className="flex justify-between items-start"><div><span className="text-white font-bold text-xs flex items-center gap-1"><Globe className="w-3 h-3 text-gold-pure" />{r.region}</span><span className="text-[9px] text-zinc-500 font-mono uppercase">Active order region</span></div><span className="text-[9px] font-mono text-zinc-500">{r.growth === null ? 'Growth N/A' : `${r.growth >= 0 ? '+' : ''}${r.growth}%`}</span></div><div className="grid grid-cols-3 text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-2"><div>Rev: <strong className="text-white">{Number(r.revenue).toLocaleString()} SAR</strong></div><div>Ord: <strong className="text-white">{r.orderCount}</strong></div><div>AOV: <strong className="text-white">{Number(r.aov).toLocaleString()} SAR</strong></div></div></div>)}
                </div>
                {totalPages > 1 && <div className="flex justify-between items-center font-mono text-[9px] text-zinc-500 pt-2 border-t border-white/5"><span>PAGE {currentPage} OF {totalPages}</span><div className="flex gap-1"><button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-1 px-1.5 border border-white/5 disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button><button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-1 px-1.5 border border-white/5 disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button></div></div>}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-zinc-950/60 border border-white/5 p-3 rounded-xs text-[9px] font-mono text-zinc-500">Source: authoritative order transactions joined to shipping addresses. Calculated metrics are read-only; no manual regional revenue/order entry is supported.</div>
    </div>
  );
};

const Kpi: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs"><span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">{label}</span><div className="flex justify-between items-baseline pt-1"><span className="text-white text-md font-bold font-mono">{value}</span>{icon}</div></div>
);
