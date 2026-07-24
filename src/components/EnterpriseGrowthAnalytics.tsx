import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  ArrowUpRight, BarChart3, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, ChevronLeft, ChevronRight, AlertCircle, Percent, 
  DollarSign, Eye, Award, Settings, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

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

export const EnterpriseGrowthAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [reports, setReports] = useState<GrowthReport[]>([]);

  // UI state filters
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<GrowthReport | null>(null);
  const [formTraffic, setFormTraffic] = useState('');
  const [formSeo, setFormSeo] = useState('');
  const [formAdsSpend, setFormAdsSpend] = useState('');
  const [formOrganic, setFormOrganic] = useState('');
  const [formReferral, setFormReferral] = useState('');
  const [formConversion, setFormConversion] = useState('');
  const [formRoi, setFormRoi] = useState('');

  // Fetch from REST API
  const fetchGrowthData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/analytics/growth');
      if (!res.ok) throw new Error('Failed to download growth report analytics.');
      const data = await res.json();
      setReports(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'handshake verification failure with Growth engine.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Realtime subscriptions
  useEffect(() => {
    fetchGrowthData();

    const channel = supabaseClient
      .channel('growth-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_growth_reports' },
        () => { fetchGrowthData(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Seeding initial growth metrics if empty
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      const initialReports = [
        { traffic_count: 14500, seo_score: 84, ads_spend: 4200.00, organic_count: 8500, referral_count: 3100, conversion_rate: 3.2, campaign_roi: 4.8, funnels_data: { impressions: 14500, click_throughs: 3100, cart_additions: 890, checkouts: 460 } },
        { traffic_count: 18200, seo_score: 88, ads_spend: 5400.00, organic_count: 11000, referral_count: 4200, conversion_rate: 3.8, campaign_roi: 5.2, funnels_data: { impressions: 18200, click_throughs: 4200, cart_additions: 1250, checkouts: 690 } },
        { traffic_count: 24500, seo_score: 92, ads_spend: 6800.00, organic_count: 14800, referral_count: 5900, conversion_rate: 4.5, campaign_roi: 5.9, funnels_data: { impressions: 24500, click_throughs: 5900, cart_additions: 1840, checkouts: 1100 } }
      ];

      for (const r of initialReports) {
        await supabaseClient.from('zoal_growth_reports').insert(r);
      }
      await fetchGrowthData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // CRUD Forms handlers
  const handleOpenCreate = () => {
    setEditingReport(null);
    setFormTraffic('15000');
    setFormSeo('85');
    setFormAdsSpend('3500');
    setFormOrganic('9000');
    setFormReferral('3200');
    setFormConversion('3.5');
    setFormRoi('4.2');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rep: GrowthReport) => {
    setEditingReport(rep);
    setFormTraffic(rep.traffic_count.toString());
    setFormSeo(rep.seo_score.toString());
    setFormAdsSpend(rep.ads_spend.toString());
    setFormOrganic(rep.organic_count.toString());
    setFormReferral(rep.referral_count.toString());
    setFormConversion(rep.conversion_rate.toString());
    setFormRoi(rep.campaign_roi.toString());
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
          click_throughs: parseInt(formReferral) || 0,
          cart_additions: Math.round((parseInt(formTraffic) || 0) * 0.08),
          checkouts: Math.round((parseInt(formTraffic) || 0) * 0.03)
        }
      };

      if (editingReport) {
        const { error: err } = await supabaseClient
          .from('zoal_growth_reports')
          .update(payload)
          .eq('id', editingReport.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabaseClient
          .from('zoal_growth_reports')
          .insert(payload);
        if (err) throw err;
      }

      setIsFormOpen(false);
      await fetchGrowthData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure updating database report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this growth ledger?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient
        .from('zoal_growth_reports')
        .delete()
        .eq('id', id);
      if (err) throw err;
      await fetchGrowthData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics aggregates
  const totalTraffic = useMemo(() => reports.reduce((sum, r) => sum + r.traffic_count, 0), [reports]);
  const averageSeo = useMemo(() => reports.length ? Math.round(reports.reduce((sum, r) => sum + r.seo_score, 0) / reports.length) : 0, [reports]);
  const totalSpend = useMemo(() => reports.reduce((sum, r) => sum + Number(r.ads_spend), 0), [reports]);
  const averageRoi = useMemo(() => reports.length ? parseFloat((reports.reduce((sum, r) => sum + Number(r.campaign_roi), 0) / reports.length).toFixed(1)) : 0, [reports]);

  // Chart conversions mapping
  const chartData = useMemo(() => {
    return reports.map((r, i) => ({
      name: `M ${i + 1}`,
      Traffic: r.traffic_count,
      Conversion: r.conversion_rate,
      ROI: r.campaign_roi,
    }));
  }, [reports]);

  // Table filtration
  const filteredReports = useMemo(() => {
    return reports.filter(r => r.traffic_count.toString().includes(searchQuery));
  }, [reports, searchQuery]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Report ID,Traffic,SEO Score,Ads Spend (SAR),Organic,Referrals,Conversion Rate (%),ROI"].concat(
        reports.map(r => `"${r.id}",${r.traffic_count},${r.seo_score},${r.ads_spend},${r.organic_count},${r.referral_count},${r.conversion_rate},${r.campaign_roi}`)
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_GROWTH_REPORTS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">VELOCITY PERFORMANCE</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-gold-pure" />
            Growth Velocity & Cohort Metrics
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchGrowthData} 
            className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-1 bg-gold-pure text-black font-bold p-2 hover:bg-gold-pure/80 rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Ledger
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
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
          {reports.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <BarChart3 className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">Growth Ledgers Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                Supabase registers do not contain organic growth trajectories. Generating marketing and campaign conversion records immediately unlocks detailed cohort visualizations.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer"
              >
                Seed Growth Logs
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Total Funnel Ingress</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalTraffic.toLocaleString()} Sessions</span>
                    <Eye className="w-4 h-4 text-gold-pure" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Consolidated Ads Spend</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    <DollarSign className="w-4 h-4 text-red-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Average SEO Strength</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{averageSeo}%</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Marketing ROI Velocity</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gold-pure text-md font-bold font-mono">{averageRoi}x Yield</span>
                    <Percent className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Traffic Flow vs Conversion Rates</h3>
                  <div className="h-64 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                        <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                        <Area type="monotone" dataKey="Traffic" stroke="#D4AF37" fill="rgba(212, 175, 55, 0.05)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Campaign Yield Ratios (ROI)</h3>
                  <div className="h-64 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                        <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                        <Line type="monotone" dataKey="ROI" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Grid / Table list */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Growth Ledger Log Entries</h3>
                  <p className="text-zinc-500 text-[10px]">Realtime Supabase audit rows.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Traffic</th>
                        <th className="py-3 px-4">Organic Sourced</th>
                        <th className="py-3 px-4">Referrals Sourced</th>
                        <th className="py-3 px-4">SEO Rating</th>
                        <th className="py-3 px-4">Conversion Rate</th>
                        <th className="py-3 px-4">Ad Spend</th>
                        <th className="py-3 px-4">Campaign ROI</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReports.map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/1 font-sans">
                          <td className="py-3 px-4 text-white font-bold">{r.traffic_count.toLocaleString()}</td>
                          <td className="py-3 px-4 text-zinc-400 font-mono">{r.organic_count.toLocaleString()}</td>
                          <td className="py-3 px-4 text-zinc-400 font-mono">{r.referral_count.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-zinc-300">{r.seo_score}%</td>
                          <td className="py-3 px-4 font-mono text-gold-pure font-bold">{r.conversion_rate}%</td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{r.ads_spend} SAR</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{r.campaign_roi}x</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenEdit(r)} className="p-1 text-zinc-500 hover:text-white cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(r.id)} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                {editingReport ? 'Edit Growth Ledger' : 'Create Growth Ledger'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Traffic Count</label>
                    <input 
                      type="number" 
                      required
                      value={formTraffic}
                      onChange={(e) => setFormTraffic(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">SEO Score</label>
                    <input 
                      type="number" 
                      required
                      value={formSeo}
                      onChange={(e) => setFormSeo(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Ads Spend (SAR)</label>
                    <input 
                      type="number" 
                      required
                      value={formAdsSpend}
                      onChange={(e) => setFormAdsSpend(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Organic Count</label>
                    <input 
                      type="number" 
                      required
                      value={formOrganic}
                      onChange={(e) => setFormOrganic(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Referrals</label>
                    <input 
                      type="number" 
                      required
                      value={formReferral}
                      onChange={(e) => setFormReferral(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Conv. Rate (%)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      value={formConversion}
                      onChange={(e) => setFormConversion(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">ROI (x)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      value={formRoi}
                      onChange={(e) => setFormRoi(e.target.value)}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 text-[10px]">
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
                    {actionLoading ? 'SAVING...' : 'COMMIT'}
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
