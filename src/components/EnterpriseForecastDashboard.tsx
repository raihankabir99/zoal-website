import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  Calendar, TrendingUp, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, ChevronLeft, ChevronRight, AlertCircle, Sparkles, 
  Layers, Settings, Check, DollarSign, Package, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from 'recharts';

interface ForecastRecord {
  id: string;
  forecast_type: 'Revenue' | 'Inventory' | 'Demand' | 'Seasonal' | 'AI';
  predicted_value: number;
  history_data: any;
  scenario?: string;
  captured_at: string;
}

export const EnterpriseForecastDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [forecasts, setForecasts] = useState<ForecastRecord[]>([]);

  // Filters / pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<ForecastRecord | null>(null);
  const [formType, setFormType] = useState<'Revenue' | 'Inventory' | 'Demand' | 'Seasonal' | 'AI'>('Revenue');
  const [formPredicted, setFormPredicted] = useState('');
  const [formScenario, setFormScenario] = useState('');
  const [formHistoryVal, setFormHistoryVal] = useState('');

  // Fetch forecast data
  const fetchForecastData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/forecasting');
      if (!res.ok) throw new Error('Failed to retrieve forecasting models.');
      const data = await res.json();
      setForecasts(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error aligning predictive forecasting engine.');
    } finally {
      setLoading(false);
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchForecastData();

    const channel = supabaseClient
      .channel('forecast-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_forecasts' },
        () => { fetchForecastData(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Seeding initial forecasts if empty
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      const seedData = [
        { forecast_type: 'Revenue', predicted_value: 145000.00, scenario: 'Q4 2026 Winter Gown Surge', history_data: { base: 85000, growth: 1.7 } },
        { forecast_type: 'Demand', predicted_value: 38000.00, scenario: 'Al Hofuf Lounge Peak Coffee Gathering', history_data: { base: 28000, growth: 1.35 } },
        { forecast_type: 'Inventory', predicted_value: 1200.00, scenario: 'Riyadh Distribution Gate Holiday stocking', history_data: { base: 840, growth: 1.42 } },
        { forecast_type: 'Seasonal', predicted_value: 59000.00, scenario: 'Hearth-Baked Sudanese Bakery Weekend Spike', history_data: { base: 39000, growth: 1.51 } }
      ];

      for (const f of seedData) {
        await supabaseClient.from('zoal_forecasts').insert(f);
      }
      await fetchForecastData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Open forms for Create/Edit
  const handleOpenCreate = () => {
    setEditingForecast(null);
    setFormType('Revenue');
    setFormPredicted('120000');
    setFormScenario('Saudi National Day Gathering Demand');
    setFormHistoryVal('80000');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (f: ForecastRecord) => {
    setEditingForecast(f);
    setFormType(f.forecast_type);
    setFormPredicted(f.predicted_value.toString());
    setFormScenario(f.scenario || '');
    setFormHistoryVal(f.history_data?.base?.toString() || '0');
    setIsFormOpen(true);
  };

  // Submit Forecast form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPredicted) return;

    try {
      setActionLoading(true);
      setError(null);

      const payload = {
        forecast_type: formType,
        predicted_value: parseFloat(formPredicted) || 0,
        scenario: formScenario,
        history_data: {
          base: parseFloat(formHistoryVal) || 0,
          growth: parseFloat((parseFloat(formPredicted) / (parseFloat(formHistoryVal) || 1)).toFixed(2))
        }
      };

      if (editingForecast) {
        const { error: err } = await supabaseClient
          .from('zoal_forecasts')
          .update(payload)
          .eq('id', editingForecast.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabaseClient
          .from('zoal_forecasts')
          .insert(payload);
        if (err) throw err;
      }

      setIsFormOpen(false);
      await fetchForecastData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure updating forecasting entry.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Forecast
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this forecasting scenario model?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient.from('zoal_forecasts').delete().eq('id', id);
      if (err) throw err;
      await fetchForecastData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic calculations
  const totalPredictedRevenue = useMemo(() => {
    return forecasts.filter(f => f.forecast_type === 'Revenue' || f.forecast_type === 'Seasonal').reduce((sum, f) => sum + Number(f.predicted_value), 0);
  }, [forecasts]);

  const activeScenariosCount = useMemo(() => forecasts.length, [forecasts]);

  const averageGrowthModel = useMemo(() => {
    const models = forecasts.map(f => f.history_data?.growth || 1);
    return models.length ? parseFloat(((models.reduce((sum, g) => sum + g, 0) / models.length) * 100 - 100).toFixed(1)) : 0;
  }, [forecasts]);

  // Chart data mapping
  const chartData = useMemo(() => {
    return forecasts.map(f => ({
      scenario: f.scenario?.substring(0, 15) || f.forecast_type,
      Baseline: f.history_data?.base || 0,
      Predicted: f.predicted_value,
    }));
  }, [forecasts]);

  // Filtration and pagination
  const filteredForecasts = useMemo(() => {
    return forecasts.filter(f => (f.scenario || '').toLowerCase().includes(searchQuery.toLowerCase()) || f.forecast_type.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [forecasts, searchQuery]);

  const paginatedForecasts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredForecasts.slice(start, start + itemsPerPage);
  }, [filteredForecasts, currentPage]);

  const totalPages = Math.ceil(filteredForecasts.length / itemsPerPage);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Type,Scenario,Baseline Value,Predicted Value,Growth Ratio"].concat(
        forecasts.map(f => `"${f.forecast_type}","${f.scenario || 'N/A'}",${f.history_data?.base || 0},${f.predicted_value},${f.history_data?.growth || 1}`)
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_EXECUTIVE_FORECASTS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">PREDICTIVE ANALYTICS</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-pure" />
            Executive Forecast Center
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchForecastData} 
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
            Add Scenario
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
          {forecasts.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Calendar className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">Forecasting Models Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                Supabase databases do not contain predictive scenarios. Populating winter collection scales and lounge expansion scenarios immediately exposes baseline versus predictive curves.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer"
              >
                Auto-Seed Scenarios
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Projected Revenue Target</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalPredictedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    <DollarSign className="w-4 h-4 text-gold-pure" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Active Projections Count</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{activeScenariosCount}</span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Average Growth Multiplier</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">+{averageGrowthModel}%</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Scenario Status Flag</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gold-pure text-md font-bold font-mono">CRITICAL</span>
                    <Compass className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Predictive Scenario vs Baseline Modeling</h3>
                <div className="h-64 text-xs font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="scenario" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                      <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Baseline" stroke="#555" strokeWidth={2} />
                      <Line type="monotone" dataKey="Predicted" stroke="#D4AF37" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Forecast CRUD list table */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Scenario Projections Ledger</h3>
                  <p className="text-zinc-500 text-[10px]">Realtime Supabase row data.</p>
                </div>

                <div className="relative max-w-xs">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search scenario or type..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-black border border-white/5 text-white pl-8 pr-3 py-1.5 rounded-xs text-[11px] outline-none"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Scenario Context</th>
                        <th className="py-3 px-4">Baseline (SAR)</th>
                        <th className="py-3 px-4">Predicted Value (SAR)</th>
                        <th className="py-3 px-4">Growth Multiplier</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedForecasts.map(f => (
                        <tr key={f.id} className="border-b border-white/5 hover:bg-white/1 font-sans">
                          <td className="py-3 px-4">
                            <span className="bg-gold-pure/10 text-gold-pure border border-gold-pure/20 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                              {f.forecast_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-bold">{f.scenario || 'N/A'}</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{(f.history_data?.base || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-gold-pure font-bold">{(f.predicted_value).toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">+{Math.round(((f.history_data?.growth || 1) - 1) * 100)}%</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenEdit(f)} className="p-1 text-zinc-500 hover:text-white cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(f.id)} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Forecast Scenario setup Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">
                {editingForecast ? 'Modify Forecast Scenario' : 'Add Forecast Scenario'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Forecast Model Type</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  >
                    <option value="Revenue">Revenue Modeling</option>
                    <option value="Inventory">Inventory Thresholds</option>
                    <option value="Demand">Demand Fluctuations</option>
                    <option value="Seasonal">Seasonal Peaks</option>
                    <option value="AI">AI Predictive Nodes</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Scenario Context Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Winter Gown Surge"
                    value={formScenario}
                    onChange={(e) => setFormScenario(e.target.value)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Baseline (SAR)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 50000"
                      value={formHistoryVal}
                      onChange={(e) => setFormHistoryVal(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Predicted Value (SAR)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 75000"
                      value={formPredicted}
                      onChange={(e) => setFormPredicted(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
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
                    {actionLoading ? 'PROSPECTING...' : 'COMMIT MODEL'}
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
