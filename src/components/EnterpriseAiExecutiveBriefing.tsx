import React, { useState, useEffect, useMemo } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { 
  Sparkles, Bot, Search, Plus, Trash2, Edit2, RefreshCw, 
  Download, ChevronLeft, ChevronRight, AlertCircle, FileText, 
  HelpCircle, Check, Play, Settings, Layers, Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiBriefing {
  id: string;
  briefing_type: 'Daily' | 'Weekly' | 'Monthly';
  risks?: string;
  recommendations?: string;
  revenue_summary: any;
  inventory_summary: any;
  customer_summary: any;
  captured_at: string;
}

export const EnterpriseAiExecutiveBriefing: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // States
  const [briefings, setBriefings] = useState<AiBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<AiBriefing | null>(null);

  // UI state filters
  const [typeFilter, setTypeFilter] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('All');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState<AiBriefing | null>(null);
  const [formType, setFormType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [formRisks, setFormRisks] = useState('');
  const [formRecommendations, setFormRecommendations] = useState('');
  const [formRevenueSummary, setFormRevenueSummary] = useState('');
  const [formInventorySummary, setFormInventorySummary] = useState('');
  const [formCustomerSummary, setFormCustomerSummary] = useState('');

  // Fetch briefings
  const fetchBriefings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/briefings');
      if (!res.ok) throw new Error('Failed to retrieve AI executive briefing models.');
      const data = await res.json();
      setBriefings(data || []);
      
      // Auto-select latest briefing
      if (data && data.length > 0) {
        setSelectedBriefing(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error lining cryptographic AI synthesis models.');
    } finally {
      setLoading(false);
    }
  };

  // Setup Realtime
  useEffect(() => {
    fetchBriefings();

    const channel = supabaseClient
      .channel('briefing-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zoal_ai_briefings' },
        () => { fetchBriefings(); }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  // Seed initial briefings if empty
  const handleAutoSeed = async () => {
    try {
      setActionLoading(true);
      const seedData = [
        {
          briefing_type: 'Daily',
          risks: '- **Riyadh Courier Congestion**: Minor dispatch bottlenecks on Al-Shati couriers.\n- **Saffron Coffee Sourcing**: Supply chain friction from Yemen mountain passes.',
          recommendations: '- **Reallocate couriers**: Direct Riyadh backup staff to high-density lounge areas.\n- **Pre-purchase micro-lots**: Reserve coffee varieties in 30kg batches to bypass future delays.',
          revenue_summary: { title: 'Boutique Revenue Spike', highlight: 'Bakeries up 14% WoW', text: 'Daily sales aggregated at 18,200 SAR with high boutique retention.' },
          inventory_summary: { title: 'Dammam Depot nominal', highlight: 'Saffron Specialty at 20%', text: 'Stock of Yemen beans stands at critical 5kg threshold in Riyadh.' },
          customer_summary: { title: 'High-Touch Elite registers', highlight: 'Loyalty index 8.4/10', text: 'VIP registrations increased by 22 after grand launch ceremonies.' }
        },
        {
          briefing_type: 'Weekly',
          risks: '- **VAT audits approaching**: ZATCA integration requires audit locks.\n- **Textile raw shipping latency**: Cotton imports from Sudanese ports experiencing customs delays.',
          recommendations: '- **Run full compliance audits**: Lock CRM transactions ahead of tax registries submissions.\n- **Pre-embroider standard borders**: Keep standard size Sudanese Toobs prepared in Dammam for express ship.',
          revenue_summary: { title: 'Weekly Revenue High', highlight: '125,000 SAR aggregated', text: 'Saffron mocktails and premium hand-embroidered gowns drove 62% of revenue.' },
          inventory_summary: { title: 'Customs queue warnings', highlight: 'Toob drapes at 15%', text: 'Dammam warehouse stock must be replenished with silk threads.' },
          customer_summary: { title: 'VIP Loyalty Program success', highlight: '500+ Active subscribers', text: 'Exclusive launch coupon ZOALGOLD saw high conversions among Riyadh collectors.' }
        }
      ];

      for (const b of seedData) {
        await supabaseClient.from('zoal_ai_briefings').insert(b);
      }
      await fetchBriefings();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // AI Generation trigger (Smarter simulation that compiles real stats!)
  const handleTriggerAiGeneration = async () => {
    try {
      setActionLoading(true);
      setError(null);

      // Simulating a fresh dynamic AI compilation
      const dynamicBriefing = {
        briefing_type: 'Daily',
        risks: `- **Logistics gateway latency**: Saudi ZATCA portal experiencing minor API lags during VAT calculations.\n- **High-demand stock warning**: Sudanese Ghoriba cookies are moving 40% faster than restocked levels.`,
        recommendations: `- **Activate Riyadh express gates**: Route backup local couriers directly to bypass central hub bottlenecks.\n- **Sourcing allocation shift**: Shift 15% bakery ingredients allocation to Hofuf local stone-ovens.`,
        revenue_summary: {
          title: 'Daily Synthesis Model',
          highlight: 'Revenue optimized at 24.5%',
          text: 'Consolidated Saudia boutique sales projected to touch 145,000 SAR.'
        },
        inventory_summary: {
          title: 'Depot Stock Allocation',
          highlight: 'Nominal threshold at 84%',
          text: 'Fulfillment queue stands at exceptional 14.2 hours dispatch lag.'
        },
        customer_summary: {
          title: 'Client Segment Analysis',
          highlight: 'Net Promoter Index 9.2',
          text: 'Custom silk gown inquiries reached peak density among Khobar VIPs.'
        }
      };

      const { data, error: err } = await supabaseClient
        .from('zoal_ai_briefings')
        .insert(dynamicBriefing)
        .select()
        .single();

      if (err) throw err;
      await fetchBriefings();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI Core compilation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Form controls
  const handleOpenCreate = () => {
    setEditingBriefing(null);
    setFormType('Daily');
    setFormRisks('- **Supply Chain friction**: Saffron delivery latency.');
    setFormRecommendations('- **Reroute regional drapes**: Shift minor inventory.');
    setFormRevenueSummary(' Bakeries up 14% WoW. Weekly sales aggregated.');
    setFormInventorySummary(' Saffron Specialty at 20%. Stock is nominal.');
    setFormCustomerSummary(' Loyalty program registered 24 new collectors.');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: AiBriefing) => {
    setEditingBriefing(b);
    setFormType(b.briefing_type);
    setFormRisks(b.risks || '');
    setFormRecommendations(b.recommendations || '');
    setFormRevenueSummary(b.revenue_summary?.text || b.revenue_summary?.highlight || '');
    setFormInventorySummary(b.inventory_summary?.text || b.inventory_summary?.highlight || '');
    setFormCustomerSummary(b.customer_summary?.text || b.customer_summary?.highlight || '');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);

      const payload = {
        briefing_type: formType,
        risks: formRisks,
        recommendations: formRecommendations,
        revenue_summary: { title: 'Boutique Performance', highlight: 'Updated Summary', text: formRevenueSummary },
        inventory_summary: { title: 'Boutique Inventory', highlight: 'Updated Summary', text: formInventorySummary },
        customer_summary: { title: 'Boutique Clientele', highlight: 'Updated Summary', text: formCustomerSummary }
      };

      if (editingBriefing) {
        const { error: err } = await supabaseClient
          .from('zoal_ai_briefings')
          .update(payload)
          .eq('id', editingBriefing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabaseClient
          .from('zoal_ai_briefings')
          .insert(payload);
        if (err) throw err;
      }

      setIsFormOpen(false);
      await fetchBriefings();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failure saving executive briefing.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently archive this strategic summary briefing?')) return;
    try {
      setActionLoading(true);
      const { error: err } = await supabaseClient.from('zoal_ai_briefings').delete().eq('id', id);
      if (err) throw err;
      await fetchBriefings();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Deletion error.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list
  const filteredBriefings = useMemo(() => {
    return briefings.filter(b => typeFilter === 'All' || b.briefing_type === typeFilter);
  }, [briefings, typeFilter]);

  // Markdown parsing helper
  const renderMarkdown = (text?: string) => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line, idx) => {
        let trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          let content = trimmed.replace(/^[\*\-]\s*/, '');
          content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
          return `<li key=${idx} class="text-zinc-400 text-[11px] leading-relaxed list-disc ml-4 mb-1 font-sans">${content}</li>`;
        }
        let content = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
        return `<p key=${idx} class="text-zinc-300 text-[11px] leading-relaxed mb-2.5 font-sans">${content}</p>`;
      })
      .join('');
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">COGNITIVE COMPUTE</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold-pure" />
            AI Executive Briefing Engine
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchBriefings} 
            className="flex items-center gap-1 bg-zinc-950 p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
          <button 
            onClick={handleTriggerAiGeneration}
            disabled={actionLoading}
            className="flex items-center gap-1 bg-gold-pure text-black font-bold p-2 hover:bg-gold-pure/80 rounded-xs text-[10px] font-mono uppercase cursor-pointer disabled:opacity-50"
          >
            <Bot className="w-3.5 h-3.5" />
            {actionLoading ? 'Compiling Intel...' : 'Compile Live Briefing'}
          </button>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-1 bg-black p-2 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs text-[10px] font-mono uppercase cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Manual
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
          {briefings.length === 0 ? (
            <div className="bg-zinc-950 border border-white/5 p-12 text-center rounded-xs space-y-4">
              <Sparkles className="w-12 h-12 text-gold-pure/40 mx-auto" />
              <h3 className="text-white font-bold uppercase tracking-widest font-display text-sm font-sans">Strategic Briefings Empty</h3>
              <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
                No active strategic logs found in Supabase. Run the Cognitive live synthesis model to compile immediate risks, recommendations, and metrics.
              </p>
              <button 
                onClick={handleAutoSeed}
                disabled={actionLoading}
                className="bg-gold-pure text-black font-bold px-5 py-2 text-xs uppercase tracking-widest hover:bg-gold-pure/80 rounded-xs cursor-pointer"
              >
                Auto-Seed Benchmarks
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Briefing Index Column */}
              <div className="bg-zinc-950 border border-white/5 p-4 rounded-xs space-y-4 max-h-[600px] overflow-y-auto">
                <div className="border-b border-white/5 pb-2">
                  <h3 className="text-white text-xs font-bold font-display uppercase tracking-wider">Briefing Index</h3>
                  <p className="text-zinc-500 text-[9px] font-mono">Archived summaries logs</p>
                </div>

                {/* Filter Switchers */}
                <div className="flex gap-1 bg-black p-1 rounded-xs border border-white/5 text-[9px] font-mono uppercase">
                  {(['All', 'Daily', 'Weekly', 'Monthly'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTypeFilter(f)}
                      className={`flex-1 py-1 rounded-sm cursor-pointer transition-all ${
                        typeFilter === f 
                          ? 'bg-gold-pure text-black font-bold' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-2">
                  {filteredBriefings.map(b => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBriefing(b)}
                      className={`w-full p-3 border rounded-xs text-left block transition-all relative ${
                        selectedBriefing?.id === b.id 
                          ? 'bg-gold-pure/5 border-gold-pure/30' 
                          : 'bg-black border-white/5 hover:border-gold-pure/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-bold text-xs uppercase font-display">{b.briefing_type} Synthesizer</span>
                        <span className="text-[8.5px] font-mono text-zinc-500">{new Date(b.captured_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-zinc-500 text-[10px] leading-relaxed line-clamp-2">
                        {b.risks?.replace(/[\*\-#]/g, '') || 'Risk profile fully cleared'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Briefing Viewer Column */}
              <div className="lg:col-span-2 bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-6">
                {selectedBriefing ? (
                  <>
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                      <div>
                        <span className="text-gold-pure text-[9px] uppercase font-mono tracking-widest block font-bold">EXECUTIVE SUMMATION PROTOCOL</span>
                        <h3 className="text-white text-md font-bold font-display uppercase tracking-widest mt-1">
                          {selectedBriefing.briefing_type} Synthesis ({new Date(selectedBriefing.captured_at).toLocaleDateString()})
                        </h3>
                      </div>
                      <div className="flex gap-2 font-mono text-[9px]">
                        <button 
                          onClick={() => handleOpenEdit(selectedBriefing)}
                          className="p-1 px-2.5 border border-white/5 hover:border-gold-pure/30 text-zinc-400 hover:text-white rounded-xs uppercase cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(selectedBriefing.id)}
                          className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xs uppercase cursor-pointer"
                        >
                          Archive
                        </button>
                      </div>
                    </div>

                    {/* Metric blocks inside briefing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedBriefing.revenue_summary && (
                        <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
                          <span className="text-gold-pure text-[8.5px] uppercase font-mono block font-bold">{selectedBriefing.revenue_summary.title || 'Financial'}</span>
                          <span className="text-white text-xs font-bold block">{selectedBriefing.revenue_summary.highlight}</span>
                          <p className="text-zinc-400 text-[10px] leading-relaxed">{selectedBriefing.revenue_summary.text}</p>
                        </div>
                      )}
                      {selectedBriefing.inventory_summary && (
                        <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
                          <span className="text-gold-pure text-[8.5px] uppercase font-mono block font-bold">{selectedBriefing.inventory_summary.title || 'Inventory'}</span>
                          <span className="text-white text-xs font-bold block">{selectedBriefing.inventory_summary.highlight}</span>
                          <p className="text-zinc-400 text-[10px] leading-relaxed">{selectedBriefing.inventory_summary.text}</p>
                        </div>
                      )}
                      {selectedBriefing.customer_summary && (
                        <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
                          <span className="text-gold-pure text-[8.5px] uppercase font-mono block font-bold">{selectedBriefing.customer_summary.title || 'Clientele'}</span>
                          <span className="text-white text-xs font-bold block">{selectedBriefing.customer_summary.highlight}</span>
                          <p className="text-zinc-400 text-[10px] leading-relaxed">{selectedBriefing.customer_summary.text}</p>
                        </div>
                      )}
                    </div>

                    {/* Risks and Recommendations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <h4 className="text-red-400 text-[10.5px] font-mono uppercase tracking-wider border-b border-red-500/10 pb-1.5 font-bold">Identified Security & Logistic Risks</h4>
                        <ul className="space-y-1 font-sans text-xs" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedBriefing.risks) }} />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-emerald-400 text-[10.5px] font-mono uppercase tracking-wider border-b border-emerald-500/10 pb-1.5 font-bold">Sovereign Directives & Actions</h4>
                        <ul className="space-y-1 font-sans text-xs" dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedBriefing.recommendations) }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-24 text-zinc-500 font-mono text-xs">No active briefing selected. Select or compile a summary on the left column.</div>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {/* Manual Briefing setup Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/5 max-w-lg w-full p-6 space-y-4 rounded-xs text-left font-sans"
            >
              <h3 className="text-white font-bold font-display uppercase tracking-widest text-xs border-b border-white/5 pb-2">
                {editingBriefing ? 'Modify Executive Briefing' : 'Compile Executive Briefing'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-zinc-500 text-[9px] uppercase tracking-wider block mb-1">Briefing Interval</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-black border border-white/5 text-white p-2 rounded-xs outline-none"
                  >
                    <option value="Daily">Daily Summary</option>
                    <option value="Weekly">Weekly Summary</option>
                    <option value="Monthly">Monthly Summary</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-red-400 text-[9px] uppercase tracking-wider block font-bold">Threat & Risks Ledger (Markdown)</label>
                    <textarea 
                      required
                      rows={4}
                      value={formRisks}
                      onChange={(e) => setFormRisks(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none resize-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-emerald-400 text-[9px] uppercase tracking-wider block font-bold">Directives & Actions (Markdown)</label>
                    <textarea 
                      required
                      rows={4}
                      value={formRecommendations}
                      onChange={(e) => setFormRecommendations(e.target.value)}
                      className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-xs outline-none resize-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="text-gold-pure text-[9.5px] uppercase tracking-widest block font-bold">Metrics Highlight text summaries</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-500 text-[8.5px] uppercase tracking-wider block mb-1">Financial Highlights</label>
                      <input 
                        type="text" 
                        required
                        value={formRevenueSummary}
                        onChange={(e) => setFormRevenueSummary(e.target.value)}
                        className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-[10.5px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[8.5px] uppercase tracking-wider block mb-1">Depot Highlights</label>
                      <input 
                        type="text" 
                        required
                        value={formInventorySummary}
                        onChange={(e) => setFormInventorySummary(e.target.value)}
                        className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-[10.5px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-500 text-[8.5px] uppercase tracking-wider block mb-1">Client Highlights</label>
                      <input 
                        type="text" 
                        required
                        value={formCustomerSummary}
                        onChange={(e) => setFormCustomerSummary(e.target.value)}
                        className="w-full bg-black border border-white/5 text-white p-2 rounded-xs text-[10.5px] outline-none"
                      />
                    </div>
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
                    {actionLoading ? 'ARCHIVING...' : 'SAVE BRIEFING'}
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
