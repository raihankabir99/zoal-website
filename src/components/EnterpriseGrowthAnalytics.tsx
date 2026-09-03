import React, { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { ArrowUpRight, BarChart3, Plus, Trash2, Edit2, RefreshCw, Download, ChevronLeft, ChevronRight, AlertCircle, Percent, DollarSign, Eye, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

interface GrowthReport { 
  id: string; 
  traffic_count: number; 
  seo_score: number; 
  ads_spend: number; 
  organic_count: number; 
  referral_count: number; 
  conversion_rate: number; 
  funnels_data: any; 
  campaign_roi: number; 
  captured_at: string; 
}

interface LiveGrowthMetrics { 
  mode: 'live'; 
  period: { start: string; end: string }; 
  previousPeriod: { start: string; end: string }; 
  revenue: number; 
  previousRevenue?: number;
  orders: number; 
  previousOrders?: number;
  newRegisteredCustomers: number; 
  previousRegisteredCustomers?: number;
  averageOrderValue: number | null; 
  revenueGrowth: number | null; 
  orderGrowth: number | null; 
  customerGrowth: number | null; 
  revenueStatusBasis: string[]; 
  generatedAt: string; 
}

const formatGrowth = (value: number | null) => value === null ? 'Not Available' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

export const EnterpriseGrowthAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true); 
  const [liveLoading, setLiveLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 
  const [liveError, setLiveError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false); 
  const [reports, setReports] = useState<GrowthReport[]>([]); 
  const [liveMetrics, setLiveMetrics] = useState<LiveGrowthMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting'); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 5;
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [editingReport, setEditingReport] = useState<GrowthReport | null>(null);
  const [formTraffic, setFormTraffic] = useState(''); 
  const [formSeo, setFormSeo] = useState(''); 
  const [formAdsSpend, setFormAdsSpend] = useState(''); 
  const [formOrganic, setFormOrganic] = useState(''); 
  const [formReferral, setFormReferral] = useState(''); 
  const [formConversion, setFormConversion] = useState(''); 
  const [formRoi, setFormRoi] = useState('');

  useEffect(() => { 
    const on = () => setIsOnline(true); 
    const off = () => setIsOnline(false); 
    window.addEventListener('online', on); 
    window.addEventListener('offline', off); 
    return () => { 
      window.removeEventListener('online', on); 
      window.removeEventListener('offline', off); 
    }; 
  }, []);

  const fetchGrowthData = async () => { 
    try { 
      setLoading(true); 
      setError(null); 
      const res = await fetch('/api/analytics/growth'); 
      if (!res.ok) throw new Error('Failed to load legacy growth reports.'); 
      const data = await res.json(); 
      setReports(Array.isArray(data) ? data : []); 
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || 'Failed to load legacy growth reports.'); 
    } finally { 
      setLoading(false); 
    } 
  };

  const fetchLiveGrowthData = async () => { 
    try { 
      setLiveLoading(true); 
      setLiveError(null); 
      const res = await fetch('/api/analytics/growth?mode=live'); 
      if (!res.ok) throw new Error('Failed to calculate live growth analytics.'); 
      const data = await res.json(); 
      if (data?.mode !== 'live') throw new Error('Invalid live analytics response.'); 
      setLiveMetrics(data); 
    } catch (err: any) { 
      console.error(err); 
      setLiveMetrics(null); 
      setLiveError(err.message || 'Live Growth Analytics unavailable.'); 
    } finally { 
      setLiveLoading(false); 
    } 
  };

  const handleSync = async () => { 
    await Promise.all([fetchLiveGrowthData(), fetchGrowthData()]); 
  };

  useEffect(() => { 
    fetchGrowthData(); 
    fetchLiveGrowthData(); 
    const channel = supabaseClient.channel('growth-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zoal_growth_reports' }, () => fetchGrowthData())
      .subscribe(status => setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')); 
    return () => { 
      supabaseClient.removeChannel(channel); 
    }; 
  }, []);

  const handleOpenCreate = () => { 
    setEditingReport(null); 
    setFormTraffic(''); 
    setFormSeo(''); 
    setFormAdsSpend(''); 
    setFormOrganic(''); 
    setFormReferral(''); 
    setFormConversion(''); 
    setFormRoi(''); 
    setIsFormOpen(true); 
  };

  const handleOpenEdit = (r: GrowthReport) => { 
    setEditingReport(r); 
    setFormTraffic(r.traffic_count.toString()); 
    setFormSeo(r.seo_score.toString()); 
    setFormAdsSpend(r.ads_spend.toString()); 
    setFormOrganic(r.organic_count.toString()); 
    setFormReferral(r.referral_count.toString()); 
    setFormConversion(r.conversion_rate.toString()); 
    setFormRoi(r.campaign_roi.toString()); 
    setIsFormOpen(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    try { 
      setActionLoading(true); 
      setError(null); 
      const payload = { 
        traffic_count: parseInt(formTraffic) || 0, 
        seo_score: parseInt(formSeo) || 0, 
        ads_spend: parseFloat(formAdsSpend) || 0, 
        organic_count: parseInt(formOrganic) || 0, 
        referral_count: parseInt(formReferral) || 0, 
        conversion_rate: parseFloat(formConversion) || 0, 
        campaign_roi: parseFloat(formRoi) || 0, 
        funnels_data: { 
          impressions: parseInt(formTraffic) || 0, 
          click_throughs: parseInt(formReferral) || 0
        } 
      }; 
      const q = editingReport 
        ? supabaseClient.from('zoal_growth_reports').update(payload).eq('id', editingReport.id) 
        : supabaseClient.from('zoal_growth_reports').insert(payload); 
      const { error: err } = await q; 
      if (err) throw err; 
      setIsFormOpen(false); 
      await fetchGrowthData(); 
    } catch (err: any) { 
      console.error(err); 
      setError(err.message || 'Failure updating legacy database report.'); 
    } finally { 
      setActionLoading(false); 
    } 
  };

  const handleDelete = async (id: string) => { 
    if (!confirm('Are you sure you want to permanently delete this legacy growth report?')) return; 
    try { 
      setActionLoading(true); 
      const { error: err } = await supabaseClient.from('zoal_growth_reports').delete().eq('id', id); 
      if (err) throw err; 
      await fetchGrowthData(); 
    } catch (err: any) { 
      console.error(err); 
      alert(err.message || 'Deletion error.'); 
    } finally { 
      setActionLoading(false); 
    } 
  };

  const filteredReports = useMemo(() => reports.filter(r => r.traffic_count.toString().includes(searchQuery)), [reports, searchQuery]);
  const paginatedReports = useMemo(() => { 
    const start = (currentPage - 1) * itemsPerPage; 
    return filteredReports.slice(start, start + itemsPerPage); 
  }, [filteredReports, currentPage]);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handleExportCSV = () => { 
    const csv = 'data:text/csv;charset=utf-8,' + ['Report ID,Traffic,SEO Score,Ads Spend (SAR),Organic,Referrals,Conversion Rate (%),ROI'].concat(reports.map(r => `"${r.id}",${r.traffic_count},${r.seo_score},${r.ads_spend},${r.organic_count},${r.referral_count},${r.conversion_rate},${r.campaign_roi}`)).join('\n'); 
    const link = document.createElement('a'); 
    link.href = encodeURI(csv); 
    link.download = `ZOAL_GROWTH_LEGACY_REPORTS_${Date.now()}.csv`; 
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link); 
  };

  const liveChartData = liveMetrics ? [
    { 
      name: 'Previous', 
      Revenue: liveMetrics.previousRevenue !== undefined 
        ? liveMetrics.previousRevenue 
        : (liveMetrics.revenueGrowth === null || liveMetrics.revenueGrowth === -100 ? 0 : Number((liveMetrics.revenue / (1 + liveMetrics.revenueGrowth / 100)).toFixed(2))), 
      Orders: liveMetrics.previousOrders !== undefined 
        ? liveMetrics.previousOrders 
        : (liveMetrics.orderGrowth === null || liveMetrics.orderGrowth === -100 ? 0 : Number((liveMetrics.orders / (1 + liveMetrics.orderGrowth / 100)).toFixed(2))) 
    }, 
    { 
      name: 'Current', 
      Revenue: liveMetrics.revenue, 
      Orders: liveMetrics.orders 
    }
  ] : [];

  const liveMetricCards = liveMetrics ? [
    {
      label: 'Revenue',
      value: liveMetrics.revenue !== null && liveMetrics.revenue !== undefined 
        ? `${liveMetrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR` 
        : 'Not Available',
      sub: `${formatGrowth(liveMetrics.revenueGrowth)} vs previous period`,
      icon: DollarSign
    },
    {
      label: 'Valid Orders',
      value: liveMetrics.orders !== null && liveMetrics.orders !== undefined 
        ? liveMetrics.orders.toLocaleString() 
        : 'Not Available',
      sub: `${formatGrowth(liveMetrics.orderGrowth)} vs previous period`,
      icon: Eye
    },
    {
      label: 'New Registered Customers',
      value: liveMetrics.newRegisteredCustomers !== null && liveMetrics.newRegisteredCustomers !== undefined 
        ? liveMetrics.newRegisteredCustomers.toLocaleString() 
        : 'Not Available',
      sub: `${formatGrowth(liveMetrics.customerGrowth)} vs previous period`,
      icon: Award
    },
    {
      label: 'Average Order Value',
      value: liveMetrics.averageOrderValue !== null && liveMetrics.averageOrderValue !== undefined 
        ? `${liveMetrics.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR` 
        : 'Not Available',
      sub: 'Revenue / valid orders',
      icon: Percent
    }
  ] : [];

  return <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4"><div><span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">LIVE DATA INTELLIGENCE</span><h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-gold-pure" />Growth Analytics</h2></div><div className="flex items-center gap-3 flex-wrap"><div className="flex items-center gap-2 px-2.5 py-1 bg-black/60 border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-widest"><span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-red-500 animate-ping' : connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} /><span className="text-zinc-300">{!isOnline ? 'Offline' : connectionStatus === 'connected' ? 'Live Connected' : 'Connecting...'}</span></div><button onClick={handleSync} className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Sync</button><button onClick={handleExportCSV} className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"><Download className="w-3.5 h-3.5" />Export Legacy CSV</button></div></div>
    {liveError && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono"><AlertCircle className="w-4 h-4" /><span>Live Analytics Error: {liveError}</span></div>}
    <section className="space-y-4"><div className="border-b border-white/5 pb-3"><span className="text-[9px] tracking-[0.3em] text-emerald-400 uppercase font-mono">AUTHORITATIVE / SERVER-SIDE</span><h3 className="text-white text-sm font-bold font-display uppercase tracking-wider">Automated Growth Analytics</h3><p className="text-zinc-500 text-[10px] mt-1">Live KPIs calculated from transactional orders and registered users. Legacy manual values are excluded.</p></div>
      {liveLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(n => <div key={n} className="bg-zinc-950/40 border border-white/5 p-5 rounded-xs space-y-2 animate-pulse"><div className="h-3 bg-zinc-800 w-1/3 rounded-sm"/><div className="h-6 bg-zinc-800 w-2/3 rounded-sm"/></div>)}</div> : liveMetrics ? <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveMetricCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">{card.label}</span>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-white text-md font-bold font-mono">{card.value}</span>
                  <Icon className="w-4 h-4 text-gold-pure" />
                </div>
                <span className="text-[9px] font-mono text-zinc-500">{card.sub}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4"><h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Revenue Period Comparison</h3><div className="h-64 text-xs"><ResponsiveContainer width="100%" height="100%"><AreaChart data={liveChartData}><XAxis dataKey="name" stroke="#444" tick={{fill:'#888',fontSize:9}}/><YAxis stroke="#444" tick={{fill:'#888',fontSize:9}}/><Tooltip contentStyle={{backgroundColor:'#09090b',borderColor:'#222'}}/><Area type="monotone" dataKey="Revenue" stroke="#D4AF37" fill="rgba(212,175,55,0.05)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></div><div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4"><h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Order Period Comparison</h3><div className="h-64 text-xs"><ResponsiveContainer width="100%" height="100%"><LineChart data={liveChartData}><XAxis dataKey="name" stroke="#444" tick={{fill:'#888',fontSize:9}}/><YAxis stroke="#444" tick={{fill:'#888',fontSize:9}}/><Tooltip contentStyle={{backgroundColor:'#09090b',borderColor:'#222'}}/><Line type="monotone" dataKey="Orders" stroke="#10b981" strokeWidth={3}/></LineChart></ResponsiveContainer></div></div></div>
      </> : <div className="bg-zinc-950 border border-white/5 p-8 text-center rounded-xs text-zinc-500 text-xs font-mono">Live transactional analytics are unavailable.</div>}
    </section>
    <section className="space-y-4"><div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-white/5 pb-3"><div><span className="text-[9px] tracking-[0.3em] text-amber-400 uppercase font-mono">LEGACY / MANUAL DATA</span><h3 className="text-white text-sm font-bold font-display uppercase tracking-wider">Legacy Manual Growth Reports</h3><p className="text-zinc-500 text-[10px] mt-1">Historical CMS records only. These values are not used by Automated Growth Analytics.</p></div><button onClick={handleOpenCreate} className="self-start flex items-center gap-1 bg-zinc-900 text-zinc-300 border border-white/10 p-2 hover:border-gold-pure/30 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"><Plus className="w-3.5 h-3.5"/>Add Legacy Report</button></div>
      {error && <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono"><AlertCircle className="w-4 h-4"/><span>Legacy Data Error: {error}</span></div>}
      {loading ? <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-xs animate-pulse"/> : reports.length === 0 ? <div className="bg-zinc-950 border border-white/5 p-10 text-center rounded-xs"><BarChart3 className="w-10 h-10 text-gold-pure/40 mx-auto mb-3"/><p className="text-zinc-500 text-xs">No legacy manual growth reports found.</p></div> : <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4"><div className="overflow-x-auto"><table className="w-full text-left border-collapse font-sans text-xs"><thead><tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-mono"><th className="py-3 px-4">Traffic</th><th className="py-3 px-4">Organic</th><th className="py-3 px-4">Referrals</th><th className="py-3 px-4">SEO</th><th className="py-3 px-4">Conversion</th><th className="py-3 px-4">Ad Spend</th><th className="py-3 px-4">ROI</th><th className="py-3 px-4 text-right">Actions</th></tr></thead><tbody>{paginatedReports.map(r=><tr key={r.id} className="border-b border-white/5 hover:bg-white/1"><td className="py-3 px-4 text-white font-bold">{r.traffic_count.toLocaleString()}</td><td className="py-3 px-4 text-zinc-400 font-mono">{r.organic_count.toLocaleString()}</td><td className="py-3 px-4 text-zinc-400 font-mono">{r.referral_count.toLocaleString()}</td><td className="py-3 px-4 font-mono text-zinc-300">{r.seo_score}%</td><td className="py-3 px-4 font-mono text-gold-pure font-bold">{r.conversion_rate}%</td><td className="py-3 px-4 font-mono text-zinc-400">{r.ads_spend} SAR</td><td className="py-3 px-4 font-mono text-emerald-400 font-bold">{r.campaign_roi}x</td><td className="py-3 px-4 text-right"><button onClick={()=>handleOpenEdit(r)} className="p-1 text-zinc-500 hover:text-white cursor-pointer"><Edit2 className="w-3.5 h-3.5"/></button><button onClick={()=>handleDelete(r.id)} disabled={actionLoading} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button></td></tr>)}</tbody></table></div>{totalPages>1&&<div className="flex justify-between items-center font-mono text-[9px] text-zinc-500 pt-2 border-t border-white/5"><span>PAGE {currentPage} OF {totalPages}</span><div className="flex gap-1"><button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="p-1 px-1.5 border border-white/5 rounded-xs disabled:opacity-30"><ChevronLeft className="w-3 h-3"/></button><button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="p-1 px-1.5 border border-white/5 rounded-xs disabled:opacity-30"><ChevronRight className="w-3 h-3"/></button></div></div>}</div>}
    </section>
    <AnimatePresence>{isFormOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}} className="bg-zinc-950 border border-white/5 max-w-md w-full p-6 space-y-4 rounded-xs text-left font-sans"><h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">{editingReport?'Edit Legacy Growth Report':'Create Legacy Growth Report'}</h3><p className="text-amber-400/80 text-[9px] font-mono">Legacy/manual data only. Never used for automated KPI calculations.</p><form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs"><div className="grid grid-cols-2 gap-3">{[['Traffic',formTraffic,setFormTraffic],['SEO',formSeo,setFormSeo],['Ads Spend',formAdsSpend,setFormAdsSpend],['Organic',formOrganic,setFormOrganic]].map(([label,value,setter]:any)=><div key={label}><label className="text-zinc-500 text-[9px] uppercase block mb-1">{label}</label><input type="number" required value={value} onChange={e=>setter(e.target.value)} className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none"/></div>)}</div><div className="grid grid-cols-3 gap-3">{[['Referrals',formReferral,setFormReferral],['Conversion',formConversion,setFormConversion],['ROI',formRoi,setFormRoi]].map(([label,value,setter]:any)=><div key={label}><label className="text-zinc-500 text-[9px] uppercase block mb-1">{label}</label><input type="number" step="0.1" required value={value} onChange={e=>setter(e.target.value)} className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none"/></div>)}</div><div className="flex justify-end gap-2 pt-2 border-t border-white/5"><button type="button" onClick={()=>setIsFormOpen(false)} className="px-3 py-2 border border-white/5 text-zinc-400 rounded-xs">CANCEL</button><button type="submit" disabled={actionLoading} className="px-3 py-2 bg-gold-pure text-black font-bold rounded-xs">{actionLoading?'SAVING...':'COMMIT LEGACY'}</button></div></form></motion.div></div>}</AnimatePresence>
  </div>;
};
