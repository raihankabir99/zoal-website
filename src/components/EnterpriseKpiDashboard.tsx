import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { 
  Award, TrendingUp, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, ChevronLeft, ChevronRight, AlertCircle, Check, 
  Sliders, Calendar, Star, DollarSign, Clock, LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface KpiSnapshot {
  id: string;
  metric_name: string;
  value: number;
  period: 'Weekly' | 'Monthly' | 'Yearly';
  captured_at: string;
}

interface KpiTarget {
  id: string;
  metric_name: string;
  target_value: number;
  deadline?: string;
}

export const EnterpriseKpiDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [snapshots, setSnapshots] = useState<KpiSnapshot[]>([]);
  const [targets, setTargets] = useState<KpiTarget[]>([]);
  const [liveData, setLiveData] = useState<any>(null);

  // Realtime connection status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filtering / pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState('yearly');
  const itemsPerPage = 5;

  // Modals / forms states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<KpiTarget | null>(null);
  const [formMetric, setFormMetric] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  // Fetch KPI data
  const fetchKpiData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
      const res = await fetch(`/api/kpi?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch KPI analytics engine data.');
      const data = await res.json();
      setSnapshots(data.snapshots || []);
      setTargets(data.targets || []);
      setLiveData(data.live || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error syncing with strategic KPI registry.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime postgres_changes subscription
  useEffect(() => {
    fetchKpiData();

    const snapshotsChannel = supabaseClient
      .channel('kpi-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_kpi_snapshots' },
        () => { fetchKpiData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_kpi_targets' },
        () => { fetchKpiData(); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      });

    return () => {
      supabaseClient.removeChannel(snapshotsChannel);
    };
  }, [timeRange]);

  // Create or update KPI Target
  const handleOpenCreate = () => {
    setEditingTarget(null);
    setFormMetric('');
    setFormValue('');
    setFormDeadline(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (target: KpiTarget) => {
    setEditingTarget(target);
    setFormMetric(target.metric_name);
    setFormValue(target.target_value.toString());
    setFormDeadline(target.deadline || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMetric.trim() || !formValue) return;

    try {
      setActionLoading(true);
      setError(null);

      const payload: any = {
        metric_name: formMetric,
        target_value: parseFloat(formValue) || 0,
        deadline: formDeadline || null
      };

      if (editingTarget) {
        payload.id = editingTarget.id;
      }

      // Use backend `/api/kpi/targets` endpoint for set/upsert
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
      const res = await fetch('/api/kpi/targets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API server rejected target upsert.');
      setIsModalOpen(false);
      await fetchKpiData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure updating target.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Target
  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategic target?')) return;
    try {
      setActionLoading(true);
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token');
      const res = await fetch(`/api/kpi/targets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to delete target from strategic registry.');
      await fetchKpiData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // KPI Calculations / Comparisons (using authoritative live backend KPI values)
  const kpiComparisons = useMemo(() => {
    return targets.map(t => {
      let value = -1;
      if (liveData) {
        switch (t.metric_name) {
          case 'Revenue':
            value = liveData.totalRevenue ?? -1;
            break;
          case 'Orders':
            value = liveData.orderCount ?? -1;
            break;
          case 'AOV':
            value = liveData.aov ?? -1;
            break;
          case 'Customers':
            value = liveData.customerCount ?? -1;
            break;
          case 'Profit':
            value = liveData.profit ?? -1;
            break;
          case 'Margin':
            value = liveData.margin ?? -1;
            break;
          case 'CAC':
          case 'DAU':
          case 'Latency':
          case 'Refund Rate':
          default:
            value = -1;
            break;
        }
      }
      
      // Calculate progress percentage
      // For CAC or Latency, lower is better, so calculate inverse
      let progress = 0;
      const isLowerBetter = t.metric_name === 'CAC' || t.metric_name === 'Latency';
      
      if (t.target_value > 0 && value !== -1) {
        if (isLowerBetter) {
          progress = value <= t.target_value ? 100 : Math.max(0, Math.round((t.target_value / value) * 100));
        } else {
          progress = Math.min(100, Math.round((value / t.target_value) * 100));
        }
      }

      return {
        ...t,
        current_value: value,
        progress,
        isLowerBetter
      };
    });
  }, [targets, liveData]);

  // Filters and pagination
  const filteredKpis = useMemo(() => {
    return kpiComparisons.filter(k => k.metric_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [kpiComparisons, searchQuery]);

  const paginatedKpis = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKpis.slice(start, start + itemsPerPage);
  }, [filteredKpis, currentPage]);

  const totalPages = Math.ceil(filteredKpis.length / itemsPerPage);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Target,Current,Progress (%),Deadline"].concat(
        kpiComparisons.map(k => `"${k.metric_name}",${k.target_value},${k.current_value},${k.progress},"${k.deadline || 'N/A'}"`)
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_KPI_METRICS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">{t('kpi.tagline', 'ENTERPRISE METRICS')}</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-gold-pure" />
            {t('kpi.title', 'Company KPI Center')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-950 border border-white/10 text-zinc-400 text-[10px] font-mono uppercase px-2 py-2 rounded-xs outline-none cursor-pointer hover:border-gold-pure/30 transition-colors"
          >
            <option value="today">Today</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="quarter">Past Quarter</option>
            <option value="yearly">Past Year</option>
          </select>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-black/60 border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-red-500 animate-ping' : connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            <span className="text-zinc-300">
              {!isOnline ? t('notifications.offline', 'Offline') : connectionStatus === 'connected' ? t('notifications.realtime_sync', 'Live Connected') : t('notifications.connecting', 'Connecting...')}
            </span>
          </div>
          <button 
            onClick={fetchKpiData} 
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
            Set Target
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
        <div className="space-y-6">
          {targets.length === 0 && snapshots.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Award className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">Strategic KPI Trackers Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                No active target registers or live data found in the enterprise engine. Configure strategic targets to begin monitoring business performance.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KPI Cards Visual list */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Active Strategic Target Gauges</h3>
                  <div className="space-y-4">
                    {kpiComparisons.slice(0, 3).map((k, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end text-xs font-sans">
                          <div>
                            <span className="text-white font-bold block">{k.metric_name}</span>
                            <span className="text-[9px] text-zinc-500 block mt-0.5">Target: {k.target_value} {k.isLowerBetter ? '(Lower is better)' : ''}</span>
                          </div>
                          <div className="text-right font-mono text-[11px]">
                            <span className="text-gold-pure font-bold block">Current: {k.current_value === -1 ? 'N/A' : k.current_value}</span>
                            <span className="text-zinc-500 block text-[9px]">Achieved: {k.current_value === -1 ? '0' : k.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-black border border-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gold-pure h-full transition-all duration-500" 
                            style={{ width: `${k.progress}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar visualization */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs flex flex-col justify-between">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2 mb-2">Corporate KPI Vectors</h3>
                  <div className="h-52 text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={kpiComparisons.map(k => ({ subject: k.metric_name.substring(0, 15), value: k.progress }))}>
                        <PolarGrid stroke="#222" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 9 }} />
                        <PolarRadiusAxis stroke="#222" tick={{ fill: '#444', fontSize: 8 }} />
                        <Radar name="Completion Rate" dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.15} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Targets registry CRUD */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Targets Registry Audit Table</h3>
                  <p className="text-zinc-500 text-[10px]">Realtime Supabase row targets.</p>
                </div>

                <div className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search metric name..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black border border-white/5 text-white pl-8 pr-3 py-1.5 rounded-xs text-[11px] outline-none"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Metric</th>
                        <th className="py-3 px-4">Current Value</th>
                        <th className="py-3 px-4">Target Value</th>
                        <th className="py-3 px-4">Completion Status</th>
                        <th className="py-3 px-4">Deadline</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedKpis.map(k => (
                        <tr key={k.id} className="border-b border-white/5 hover:bg-white/1 font-sans">
                          <td className="py-3 px-4 text-white font-bold">{k.metric_name}</td>
                          <td className="py-3 px-4 font-mono text-gold-pure font-bold">{k.current_value === -1 ? 'N/A' : k.current_value}</td>
                          <td className="py-3 px-4 font-mono text-zinc-300">{k.target_value}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                              k.progress >= 100 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {k.current_value === -1 ? 'Incalculable' : `${k.progress}% Achieved`}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{k.deadline || 'Continuous'}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenEdit(k)} className="p-1 text-zinc-500 hover:text-white cursor-pointer" title="Edit Target"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteTarget(k.id)} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer" title="Delete Target"><Trash2 className="w-3.5 h-3.5" /></button>
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
        </div>
      )}

      {/* Target Setup Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">
                {editingTarget ? 'Modify KPI Target' : 'Set KPI Target'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Metric Name</label>
                  <select 
                    required
                    value={formMetric}
                    onChange={(e) => setFormMetric(e.target.value)}
                    className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none"
                  >
                    <option value="" disabled>Select Metric</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Orders">Orders</option>
                    <option value="AOV">Average Order Value (AOV)</option>
                    <option value="Customers">Customers</option>
                    <option value="CAC">Customer Acquisition Cost (CAC)</option>
                    <option value="DAU">Daily Active Users (DAU)</option>
                    <option value="Latency">Latency</option>
                    <option value="Profit">Profit</option>
                    <option value="Margin">Margin</option>
                    <option value="Refund Rate">Refund Rate</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Target Threshold Value</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="e.g. 350.00"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider block mb-1">Audit Deadline</label>
                  <input 
                    type="date" 
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full bg-black border border-white/5 focus:border-gold-pure/40 text-white p-2 rounded-xs text-xs outline-none font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 border border-white/5 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-2 bg-gold-pure text-black font-bold rounded-xs cursor-pointer"
                  >
                    {actionLoading ? 'SETTING...' : 'SET TARGET'}
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
