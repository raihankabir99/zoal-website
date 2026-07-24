import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  Compass, ShieldAlert, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, ChevronLeft, ChevronRight, AlertCircle, Play, 
  HelpCircle, Check, Sliders, DollarSign, Activity, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface DecisionModel {
  id: string;
  name: string;
  description: string;
  variables: any; // { pricingMultiplier: number, discountRate: number, etc }
  risk_weight: number;
}

interface SimulationRun {
  id: string;
  model_id: string;
  scenario_name: string;
  revenue_projection: number;
  profit_projection: number;
  risk_score: number;
  parameters: any;
  captured_at: string;
}

export const EnterpriseDecisionSimulation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [models, setModels] = useState<DecisionModel[]>([]);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [selectedModel, setSelectedModel] = useState<DecisionModel | null>(null);

  // Filter / Page
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Run simulation form states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simScenario, setSimScenario] = useState('');
  const [simParam1, setSimParam1] = useState('1.2'); // multiplier or percent
  const [simParam2, setSimParam2] = useState('15');  // discount rate or capacity

  // Model Form States
  const [isModelFormOpen, setIsModelFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DecisionModel | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelDesc, setModelDesc] = useState('');
  const [modelRisk, setModelRisk] = useState('4.0');

  // Fetch simulation data
  const fetchSimulationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resModels, resRuns] = await Promise.all([
        fetch('/api/simulation/models'),
        fetch('/api/simulation/runs')
      ]);

      if (!resModels.ok || !resRuns.ok) throw new Error('Secure handshake with Simulation Center failed.');

      const dataModels = await resModels.json();
      const dataRuns = await resRuns.json();

      setModels(dataModels || []);
      setRuns(dataRuns || []);

      if (dataModels && dataModels.length > 0 && !selectedModel) {
        setSelectedModel(dataModels[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verification failed with Executive Decision Engine.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Realtime
  useEffect(() => {
    fetchSimulationData();

    const channel = supabaseClient
      .channel('simulation-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_decision_models' },
        () => { fetchSimulationData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_simulation_runs' },
        () => { fetchSimulationData(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Seeding models if empty
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      const seedModels = [
        { name: 'Pricing Simulation', description: 'Optimizes premium gown and luxury Sudanese coffee prices against regional Hofuf and Riyadh indices.', risk_weight: 4.5, variables: { base_price: 350, elasticity: -1.2 } },
        { name: 'Warehouse Expansion', description: 'Simulates profit margins and dispatch throughput of establishing a secondary fulfillment terminal in Dammam.', risk_weight: 5.8, variables: { footprint_sqm: 1200, rent_sar: 140000 } },
        { name: 'Discount Campaign Impact', description: 'Forecasts flash-discount conversion curves and customer lifetime value spikes.', risk_weight: 3.2, variables: { default_discount: 15, duration_days: 7 } }
      ];

      for (const m of seedModels) {
        await supabaseClient.from('zoal_decision_models').insert(m);
      }
      await fetchSimulationData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Run Simulation Calculation (Client-side projection logic that writes to DB)
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !simScenario.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      // Algorithmic Projection Engine
      const val1 = parseFloat(simParam1) || 1.0;
      const val2 = parseFloat(simParam2) || 0;

      let projectedRev = 125000;
      let projectedProfit = 48000;
      let calculatedRisk = selectedModel.risk_weight;

      if (selectedModel.name.includes('Pricing')) {
        // Revenue = base_sales * multiplier * elasticity
        projectedRev = 125000 * val1 * (1 - (val2 / 100) * 0.5);
        projectedProfit = projectedRev * 0.42;
        calculatedRisk = Math.min(10, Math.max(1, selectedModel.risk_weight + (val1 - 1.0) * 3));
      } else if (selectedModel.name.includes('Warehouse')) {
        projectedRev = 125000 * (1 + (val1 / 1000) * 0.25);
        projectedProfit = projectedRev * 0.38 - (val2 * 0.1);
        calculatedRisk = Math.min(10, Math.max(1, selectedModel.risk_weight + (val1 > 1500 ? 1.5 : -0.5)));
      } else {
        projectedRev = 125000 * (1 + (val2 / 100) * 1.2);
        projectedProfit = projectedRev * (0.42 - (val1 / 100));
        calculatedRisk = Math.min(10, Math.max(1, selectedModel.risk_weight + (val1 > 25 ? 2.0 : -1.0)));
      }

      const payload = {
        model_id: selectedModel.id,
        scenario_name: simScenario,
        revenue_projection: Math.round(projectedRev),
        profit_projection: Math.round(projectedProfit),
        risk_score: parseFloat(calculatedRisk.toFixed(1)),
        parameters: { param1: val1, param2: val2 },
        captured_at: new Date().toISOString()
      };

      // Call API Endpoint POST `/api/simulation/runs`
      // Use local session token if available or fallback
      const sessionToken = localStorage.getItem('supabase-token') || 'dev-preview-token';
      const res = await fetch('/api/simulation/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('API server rejected simulation registration.');

      setSimScenario('');
      setIsSimulating(false);
      await fetchSimulationData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit simulation model run.');
    } finally {
      setActionLoading(false);
    }
  };

  // Manage Decision Models (CRUD)
  const handleOpenModelCreate = () => {
    setEditingModel(null);
    setModelName('');
    setModelDesc('');
    setModelRisk('4.5');
    setIsModelFormOpen(true);
  };

  const handleOpenModelEdit = (m: DecisionModel) => {
    setEditingModel(m);
    setModelName(m.name);
    setModelDesc(m.description);
    setModelRisk(m.risk_weight.toString());
    setIsModelFormOpen(true);
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      const payload = {
        name: modelName,
        description: modelDesc,
        risk_weight: parseFloat(modelRisk) || 4.5,
        variables: editingModel?.variables || { base: 100 }
      };

      if (editingModel) {
        const { error: err } = await supabaseClient
          .from('zoal_decision_models')
          .update(payload)
          .eq('id', editingModel.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabaseClient
          .from('zoal_decision_models')
          .insert(payload);
        if (err) throw err;
      }

      setIsModelFormOpen(false);
      await fetchSimulationData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure updating model registry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this model template registry?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient.from('zoal_decision_models').delete().eq('id', id);
      if (err) throw err;
      await fetchSimulationData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Simulation Run
  const handleDeleteRun = async (id: string) => {
    if (!confirm('Are you sure you want to permanently erase this simulated run trace?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient.from('zoal_simulation_runs').delete().eq('id', id);
      if (err) throw err;
      await fetchSimulationData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Dynamic Metrics calculations
  const totalRunsCount = useMemo(() => runs.length, [runs]);
  const averageRisk = useMemo(() => {
    return runs.length ? parseFloat((runs.reduce((sum, r) => sum + r.risk_score, 0) / runs.length).toFixed(1)) : 0;
  }, [runs]);

  const maxProfitProjections = useMemo(() => {
    return runs.length ? Math.max(...runs.map(r => r.profit_projection)) : 0;
  }, [runs]);

  // Chart dataset
  const chartData = useMemo(() => {
    return runs.map(r => ({
      scenario: r.scenario_name.substring(0, 15),
      Revenue: r.revenue_projection,
      Profit: r.profit_projection,
      Risk: r.risk_score * 10000, // scaled for single axis visual comparison
    }));
  }, [runs]);

  // Filters and pagination
  const filteredRuns = useMemo(() => {
    return runs.filter(r => r.scenario_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [runs, searchQuery]);

  const paginatedRuns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRuns.slice(start, start + itemsPerPage);
  }, [filteredRuns, currentPage]);

  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage);

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Scenario,Projected Revenue (SAR),Projected Profit (SAR),Risk Score"].concat(
        runs.map(r => `"${r.scenario_name}",${r.revenue_projection},${r.profit_projection},${r.risk_score}`)
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_SIMULATOR_RUNS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">STRATEGIC PROJECTION</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-gold-pure" />
            Decision Simulation Center
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchSimulationData} 
            className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button 
            onClick={() => setIsSimulating(true)}
            disabled={models.length === 0}
            className="flex items-center gap-1 bg-gold-pure text-black font-bold p-2 hover:bg-gold-pure/80 rounded-xs text-[10px] font-mono uppercase cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            Execute Sim
          </button>
          <button 
            onClick={handleOpenModelCreate}
            className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Model
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
          {models.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Compass className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">Sovereign Simulation Templates Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                Supabase registers possess no decision structures. Initializing foundational Pricing, Expansion, and Flash Campaign templates immediately unlocks dynamic visualizer runs.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer"
              >
                Auto-Seed Decision Templates
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Simulation Traces Registered</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{totalRunsCount} Executes</span>
                    <Activity className="w-4 h-4 text-gold-pure" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Average Aggregated Threat Risk</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{averageRisk} / 10</span>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Max Projected Yield Benefit</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-md font-bold font-mono">{maxProfitProjections.toLocaleString()} SAR</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs">
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Active Decision Templates</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gold-pure text-md font-bold font-mono">{models.length} Models</span>
                    <Sliders className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Models Selector & Active Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Templates templates templates list */}
                <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Templates Registry</h3>
                  <div className="space-y-2">
                    {models.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => setSelectedModel(m)}
                        className={`p-3 border rounded-xs text-left cursor-pointer transition-all ${
                          selectedModel?.id === m.id 
                            ? 'bg-gold-pure/5 border-gold-pure/30' 
                            : 'bg-black border-white/5 hover:border-gold-pure/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-white font-bold text-xs">{m.name}</span>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleOpenModelEdit(m); }} className="p-0.5 text-zinc-500 hover:text-white cursor-pointer"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteModel(m.id); }} className="p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <p className="text-zinc-500 text-[10px] leading-relaxed mb-2">{m.description}</p>
                        <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-900 px-1.5 py-0.5 border border-white/5 rounded-xs">Risk: {m.risk_weight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Runs Chart comparison */}
                <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 flex flex-col justify-between">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider border-b border-white/5 pb-2">Revenue vs Profit Projections (SAR)</h3>
                  <div className="h-64 text-xs font-mono">
                    {runs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-500">Run a simulation on an active template template above to graph results.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="scenario" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                          <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                          <Legend />
                          <Bar dataKey="Revenue" fill="#D4AF37" name="Projected Sales" />
                          <Bar dataKey="Profit" fill="#10b981" name="Projected Margin" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* Simulation Runs Table */}
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Executed Runs Audit Logs</h3>
                    <p className="text-zinc-500 text-[10px]">Realtime Supabase audit rows.</p>
                  </div>
                  <button onClick={handleExportCSV} className="p-1 px-2.5 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs font-mono text-[9px] uppercase cursor-pointer">Export CSV</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase tracking-wider font-mono">
                        <th className="py-3 px-4">Scenario</th>
                        <th className="py-3 px-4">Projected Revenue</th>
                        <th className="py-3 px-4">Projected Profit</th>
                        <th className="py-3 px-4">Calculated Risk Score</th>
                        <th className="py-3 px-4">Captured At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRuns.map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/1 font-sans">
                          <td className="py-3 px-4 text-white font-bold">{r.scenario_name}</td>
                          <td className="py-3 px-4 font-mono text-zinc-300">{r.revenue_projection.toLocaleString()} SAR</td>
                          <td className="py-3 px-4 font-mono text-gold-pure font-bold">{r.profit_projection.toLocaleString()} SAR</td>
                          <td className="py-3 px-4 font-mono text-red-400 font-bold">{r.risk_score} / 10</td>
                          <td className="py-3 px-4 font-mono text-zinc-500">{new Date(r.captured_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => handleDeleteRun(r.id)} className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer" title="Archive Trace"><Trash2 className="w-3.5 h-3.5" /></button>
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

      {/* Execute Simulation Setup Modal */}
      <AnimatePresence>
        {isSimulating && selectedModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2 flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-gold-pure" />
                Run Sim: {selectedModel.name}
              </h3>
              <form onSubmit={handleRunSimulation} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Scenario Target Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Riyadh Depot expansion test"
                    value={simScenario}
                    onChange={(e) => setSimScenario(e.target.value)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">
                      {selectedModel.name.includes('Pricing') ? 'Multiplier (x)' : 'Square Foot (Sqm)'}
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={simParam1}
                      onChange={(e) => setSimParam1(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">
                      {selectedModel.name.includes('Pricing') ? 'Discount (%)' : 'Monthly Rent (SAR)'}
                    </label>
                    <input 
                      type="number" 
                      required
                      value={simParam2}
                      onChange={(e) => setSimParam2(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setIsSimulating(false)}
                    className="px-3 py-2 border border-white/5 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-2 bg-gold-pure text-black font-bold rounded-xs cursor-pointer"
                  >
                    {actionLoading ? 'PROSPECTING...' : 'RUN SIMULATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Model Template creation/editing Modal */}
      <AnimatePresence>
        {isModelFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-sm w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">
                {editingModel ? 'Modify Model Structure' : 'Register Decision Model'}
              </h3>
              <form onSubmit={handleModelSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Model Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lounge Pricing Simulation"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Description</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe elasticity variables or physical overhead costs modeled..."
                    value={modelDesc}
                    onChange={(e) => setModelDesc(e.target.value)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Threat Risk Weight (1.0 - 10.0)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.0"
                    max="10.0"
                    required
                    value={modelRisk}
                    onChange={(e) => setModelRisk(e.target.value)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5 text-[10px]">
                  <button 
                    type="button" 
                    onClick={() => setIsModelFormOpen(false)}
                    className="px-3 py-2 border border-white/5 text-zinc-400 hover:text-white rounded-xs cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-2 bg-gold-pure text-black font-bold rounded-xs cursor-pointer"
                  >
                    {actionLoading ? 'REGISTERING...' : 'REGISTER MODEL'}
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
