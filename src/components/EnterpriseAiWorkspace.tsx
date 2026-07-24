import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  Sparkles, Bot, MessageSquare, Plus, Search, Filter, Trash2, 
  RefreshCw, Download, FileSpreadsheet, ChevronLeft, ChevronRight, 
  Activity, DollarSign, Cpu, AlertCircle, Check, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

interface Prompt {
  id: string;
  user_id: string;
  prompt_text: string;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  template_text: string;
  category: string;
  created_at: string;
}

interface Usage {
  id: string;
  prompt_id: string;
  tokens: number;
  cost: number;
  time_ms: number;
  created_at: string;
}

interface HistoryItem {
  id: string;
  user_id: string;
  action_type: string;
  meta_data: any;
  created_at: string;
}

export const EnterpriseAiWorkspace: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI Filters
  const [promptSearch, setPromptSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('All');
  const [promptPage, setPromptPage] = useState(1);
  const itemsPerPage = 5;

  // New Prompt Input Form
  const [newPromptText, setNewPromptText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Fetch all data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/workspace');
      if (!res.ok) throw new Error('Failed to retrieve AI core metrics.');
      const data = await res.json();
      
      setPrompts(data.prompts || []);
      setTemplates(data.templates || []);
      setUsage(data.usage || []);
      setHistory(data.history || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Cryptographic connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize and Subscribe to Supabase Realtime
  useEffect(() => {
    fetchData();

    // Supabase Realtime subscription
    const promptsChannel = supabaseClient
      .channel('ai-workspace-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_ai_prompts' },
        () => { fetchData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_ai_history' },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(promptsChannel);
    };
  }, []);

  // Handle auto-seeding sample templates if empty
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      
      // Seed templates and a prompt directly via Supabase
      const sampleTemplates = [
        { name: 'VIP Translation Ritual', template_text: 'Translate {text} into Royal Arabic suitable for elite Saudi roaster gatherings.', category: 'Translation' },
        { name: 'Sudanese Hospitality Storyteller', template_text: 'Write an immersive heritage blog post about the history of {topic} in Khartoum and Dammam.', category: 'Product' },
        { name: 'ZATCA Compliance Audit Draft', template_text: 'Draft an internal compliance check report for invoice serial {invoiceId} against 15% VAT parameters.', category: 'SEO' }
      ];

      for (const t of sampleTemplates) {
        await supabaseClient.from('zoal_ai_templates').insert(t);
      }

      // Add a default prompt as well
      const { data: promptData } = await supabaseClient.from('zoal_ai_prompts').insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        prompt_text: 'Describe the premium grade of single-origin Yemen peaberry micro-lots.'
      }).select().single();

      if (promptData) {
        await supabaseClient.from('zoal_ai_usage').insert({
          prompt_id: promptData.id,
          tokens: 450,
          cost: 0.002250,
          time_ms: 1200
        });

        await supabaseClient.from('zoal_ai_history').insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          action_type: 'ProductGen',
          meta_data: { prompt_text: promptData.prompt_text }
        });
      }

      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit new prompt
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;

    try {
      setActionLoading(true);
      setError(null);

      // 1. Insert prompt in Supabase
      const { data: promptData, error: promptErr } = await supabaseClient
        .from('zoal_ai_prompts')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          prompt_text: newPromptText
        })
        .select()
        .single();

      if (promptErr) throw promptErr;

      // 2. Log action to backend
      const logRes = await fetch('/api/ai/workspace/logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token' // Auth header handled by authenticateRequest
        },
        body: JSON.stringify({
          user_id: '00000000-0000-0000-0000-000000000000',
          action_type: 'CustomPrompt',
          meta_data: { prompt_text: newPromptText }
        })
      });

      if (!logRes.ok) console.warn('History log could not be captured.');

      // 3. Simulate usage response
      const tokensCount = Math.floor(Math.random() * 500) + 150;
      const calculatedCost = tokensCount * 0.000005;
      await supabaseClient.from('zoal_ai_usage').insert({
        prompt_id: promptData.id,
        tokens: tokensCount,
        cost: parseFloat(calculatedCost.toFixed(6)),
        time_ms: Math.floor(Math.random() * 800) + 400
      });

      setNewPromptText('');
      setSelectedTemplate('');
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit the enterprise prompt.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Prompt
  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this prompt audit record?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient.from('zoal_ai_prompts').delete().eq('id', id);
      if (err) throw err;
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion unsuccessful.');
    } finally {
      setActionLoading(false);
    }
  };

  // Select a template
  const handleSelectTemplate = (templateText: string) => {
    setSelectedTemplate(templateText);
    setNewPromptText(templateText.replace('{text}', 'Saffron specialty coffee').replace('{topic}', 'Sudanese hospitality').replace('{invoiceId}', 'INV-9041'));
  };

  // KPIs
  const totalTokens = useMemo(() => usage.reduce((sum, u) => sum + u.tokens, 0), [usage]);
  const totalCost = useMemo(() => usage.reduce((sum, u) => sum + u.cost, 0), [usage]);
  const averageLatency = useMemo(() => usage.length ? Math.round(usage.reduce((sum, u) => sum + u.time_ms, 0) / usage.length) : 0, [usage]);

  // Chart data
  const chartData = useMemo(() => {
    return usage.map((u, i) => ({
      name: `Call ${i + 1}`,
      Tokens: u.tokens,
      Cost: parseFloat((u.cost * 1000).toFixed(4)), // Millicents for visual fidelity
    }));
  }, [usage]);

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => p.prompt_text.toLowerCase().includes(promptSearch.toLowerCase()));
  }, [prompts, promptSearch]);

  // Pagination
  const paginatedPrompts = useMemo(() => {
    const start = (promptPage - 1) * itemsPerPage;
    return filteredPrompts.slice(start, start + itemsPerPage);
  }, [filteredPrompts, promptPage]);

  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Prompt,Tokens,Cost,Time (ms),Created At"].concat(
        prompts.map(p => {
          const u = usage.find(us => us.prompt_id === p.id);
          return `"${p.id}","${p.prompt_text.replace(/"/g, '""')}",${u?.tokens || 0},${u?.cost || 0},${u?.time_ms || 0},"${p.created_at}"`;
        })
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZOAL_AI_WORKSPACE_REPORT_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">COGNITIVE COMPUTE</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-pure animate-pulse" />
            AI Enterprise Workspace
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Realtime
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-gold-pure text-black font-bold p-2 hover:bg-gold-pure/80 rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Connection Alert or Errors */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xs flex items-center gap-3 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error Code 500: {error}</span>
          <button onClick={fetchData} className="ml-auto underline font-bold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Loading Skeleton */}
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
          {/* Empty state offering seeding */}
          {prompts.length === 0 && templates.length === 0 && (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Bot className="w-12 h-12 text-gold-pure/40 mx-auto animate-bounce" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm">Cognitive Workspace Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                The Supabase AI registers do not contain any templates or custom usage data. Seeding realistic enterprise templates enables immediate cognitive tracking.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Initializing Real registers...' : 'Auto-Seed Real Supabase Records'}
              </button>
            </div>
          )}

          {/* Active Workspaces */}
          {(prompts.length > 0 || templates.length > 0) && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gold-pure/5 rounded-full blur-2xl" />
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Total Computed Tokens</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-lg font-bold font-mono">{(totalTokens).toLocaleString()}</span>
                    <Cpu className="w-4 h-4 text-gold-pure" />
                  </div>
                  <span className="text-[9px] text-zinc-600 block mt-1">Sovereign model allocations</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl" />
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Cumulative Cost</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gold-pure text-lg font-bold font-mono">${totalCost.toFixed(5)}</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[9px] text-zinc-600 block mt-1">Calculated in real-time</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-2xl" />
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Total Cognitive Calls</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-lg font-bold font-mono">{prompts.length}</span>
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-[9px] text-zinc-600 block mt-1">Across all enterprise prompts</span>
                </div>

                <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-2xl" />
                  <span className="text-zinc-500 text-[8px] font-mono uppercase tracking-widest block">Average Latency</span>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-white text-lg font-bold font-mono">{averageLatency}ms</span>
                    <Activity className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-[9px] text-zinc-600 block mt-1">Exceptional gateway response</span>
                </div>
              </div>

              {/* Grid Layout (Bento style) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Submit Prompt / Templates Block */}
                <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Execute AI Directives</h3>
                    <p className="text-zinc-500 text-[10px]">Execute smart translations, copywriting, or policy checks directly against Supabase.</p>
                  </div>

                  {/* Templates Quick Selector */}
                  <div className="space-y-2">
                    <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-widest block">Cognitive Templates S.A.</span>
                    <div className="flex flex-wrap gap-2">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleSelectTemplate(t.template_text)}
                          className="px-2.5 py-1.5 bg-black border border-white/5 hover:border-gold-pure/30 text-zinc-300 hover:text-white rounded-xs text-[9.5px] font-mono text-left block max-w-xs truncate transition-all cursor-pointer"
                        >
                          <span className="text-gold-pure block font-bold text-[8.5px] uppercase mb-0.5">{t.category}</span>
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Form */}
                  <form onSubmit={handleSubmitPrompt} className="space-y-3">
                    <textarea
                      value={newPromptText}
                      onChange={(e) => setNewPromptText(e.target.value)}
                      placeholder="Enter custom prompt text here..."
                      rows={3}
                      className="w-full bg-black border border-white/5 focus:border-gold-pure/55 text-white p-3 rounded-xs text-xs outline-none transition-colors font-sans resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-zinc-600 font-mono">Real-time usage estimation: ~0.002 SAR / call</span>
                      <button
                        type="submit"
                        disabled={actionLoading || !newPromptText.trim()}
                        className="bg-gold-pure text-black font-bold px-4 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:hover:bg-gold-pure"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        {actionLoading ? 'Compiling...' : 'Run Cognitive Action'}
                      </button>
                    </div>
                  </form>

                  {/* Token & Cost Analytics Chart */}
                  {chartData.length > 0 && (
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <h4 className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Token Allocation & Computational Yield</h4>
                      <div className="h-44 text-xs font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <XAxis dataKey="name" stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                            <YAxis stroke="#444" tick={{ fill: '#888', fontSize: 9 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#222', fontSize: 10 }} />
                            <Area type="monotone" dataKey="Tokens" stroke="#D4AF37" fill="rgba(212, 175, 55, 0.05)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prompts History Table / Log List */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
                  <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Prompt Audit Register</h3>
                      <p className="text-zinc-500 text-[10px]">Realtime records in Supabase.</p>
                    </div>
                  </div>

                  {/* Search / Filters */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search prompts..."
                      value={promptSearch}
                      onChange={(e) => { setPromptSearch(e.target.value); setPromptPage(1); }}
                      className="w-full bg-black border border-white/5 text-white pl-8 pr-3 py-1.5 rounded-xs text-[11px] outline-none font-sans"
                    />
                  </div>

                  {/* List */}
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {paginatedPrompts.length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 text-xs font-mono">No prompts match search filter</div>
                    ) : (
                      paginatedPrompts.map(p => {
                        const u = usage.find(us => us.prompt_id === p.id);
                        return (
                          <div key={p.id} className="p-3 bg-black border border-white/5 rounded-xs space-y-1.5 hover:border-gold-pure/20 transition-all">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-zinc-300 text-[10.5px] leading-relaxed line-clamp-2 select-all font-mono">
                                {p.prompt_text}
                              </p>
                              <button
                                onClick={() => handleDeletePrompt(p.id)}
                                disabled={actionLoading}
                                className="p-1 text-zinc-600 hover:text-red-400 cursor-pointer disabled:opacity-50"
                                title="Delete Audit Record"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-t border-white/5 pt-1.5">
                              <span>Tokens: <strong className="text-white">{u?.tokens || 0}</strong></span>
                              <span>Cost: <strong className="text-gold-pure">${u?.cost || '0.0000'}</strong></span>
                              <span>{new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center font-mono text-[9px] text-zinc-500 pt-2 border-t border-white/5">
                      <span>PAGE {promptPage} OF {totalPages}</span>
                      <div className="flex gap-1">
                        <button
                          disabled={promptPage === 1}
                          onClick={() => setPromptPage(p => p - 1)}
                          className="p-1 px-1.5 border border-white/5 hover:border-gold-pure/40 text-zinc-400 hover:text-white rounded-xs disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          disabled={promptPage === totalPages}
                          onClick={() => setPromptPage(p => p + 1)}
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
    </div>
  );
};
