import React, { useState, useEffect } from 'react';
import {
  TrendingUp, BarChart3, Package, Users, Shield, Landmark, Calendar,
  Activity, ArrowUpRight, Award, ChevronRight, Sliders, Globe, RefreshCw, Sparkles,
  Layers, FileText, CheckCircle2, Download, Clock, Landmark as BranchIcon, Briefcase, Bell
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, BarChart, Bar, Line
} from 'recharts';
import { Order, Product } from '../types';
import { supabaseClient } from '../lib/supabaseClient';
import DashboardLanguageSwitcher from './dashboard/DashboardLanguageSwitcher';

interface OwnerExecutiveDashboardProps {
  currentUser: any;
  orders: Order[];
  products: Product[];
}

function SafeBriefing({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="space-y-2 text-left">
      {text.split('\n').map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-white text-xs font-bold uppercase tracking-widest mt-5 mb-2 font-display text-gold-pure border-b border-white/5 pb-1">{trimmed.slice(4)}</h3>;
        }
        if (trimmed.startsWith('#### ')) {
          return <h4 key={idx} className="text-zinc-200 text-[10.5px] font-bold uppercase tracking-wider mt-4 mb-1.5 font-mono">{trimmed.slice(5)}</h4>;
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return <div key={idx} className="text-zinc-400 text-[10.5px] leading-relaxed ml-4 mb-1 font-sans">• {trimmed.replace(/^[*-]\s*/, '')}</div>;
        }
        return <p key={idx} className="text-zinc-300 text-[10.5px] leading-relaxed mb-2.5 font-sans">{line}</p>;
      })}
    </div>
  );
}

export default function OwnerExecutiveDashboard({ currentUser, orders, products }: OwnerExecutiveDashboardProps) {
  const [kpiData, setKpiData] = useState<{ totalRevenue: number | null; totalOrders: number | null; averageOrderValue: number | null; activeCustomers: number | null; lowStockCount: number | null; regional: any[] }>({ totalRevenue: null, totalOrders: null, averageOrderValue: null, activeCustomers: null, lowStockCount: null, regional: [] });
  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [regionalRecords, setRegionalRecords] = useState<any[]>([]);
  const [aiBriefing, setAiBriefing] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiForecasts, setAiForecasts] = useState<any[]>([]);
  const [selectedHour, setSelectedHour] = useState(18);
  const [complianceStatus, setComplianceStatus] = useState('NOT_CONNECTED');
  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const branches = [
    { id: 'all', name: 'Consolidated S.A.' },
    { id: 'riyadh', name: 'Branch A Elite Lounge' },
    { id: 'khobar', name: 'Khobar Port Terminal' },
    { id: 'jeddah', name: 'Jeddah Al-Shati Palace' },
    { id: 'hofuf', name: 'Hofuf Heritage Club' }
  ];

  useEffect(() => {
    async function fetchAuthoritativeBackendData() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const kpiRes = await fetch('/api/kpi?range=yearly', { headers });
        if (kpiRes.ok) {
          const kpiJson = await kpiRes.json();
          if (kpiJson?.live) {
            setKpiData({
              totalRevenue: kpiJson.live.totalRevenue ?? null,
              totalOrders: kpiJson.live.orderCount ?? null,
              averageOrderValue: kpiJson.live.aov ?? null,
              activeCustomers: kpiJson.live.customerCount ?? null,
              lowStockCount: kpiJson.live.lowStockCount ?? null,
              regional: kpiJson.live.regional || []
            });
            setRegionalRecords(kpiJson.live.regional || []);
          }
        }
        const fcRes = await fetch('/api/forecasting', { headers });
        if (fcRes.ok) {
          const fcJson = await fcRes.json();
          if (fcJson?.forecasts) setAiForecasts(fcJson.forecasts.map((f: any) => ({ month: `Horizon ${f.horizon_days}D`, revenue: f.forecast_revenue })));
        }
      } catch (err) {
        console.error('Failed to fetch authoritative analytics:', err);
      } finally {
        setIsLoadingKpi(false);
      }
    }
    fetchAuthoritativeBackendData();
  }, []);

  const lowStockCount = kpiData.lowStockCount ?? 0;
  const activeBranchRevenue = selectedBranch === 'all' ? kpiData.totalRevenue : (regionalRecords.find(r => r.region?.toLowerCase()?.includes(selectedBranch))?.revenue ?? null);

  const triggerAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiBriefing('');
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;
      if (!token) { setAiBriefing('Authorization Error\n\nNo active security session detected. Please re-authenticate as Owner.'); return; }
      const response = await fetch('/api/executive/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ totalRevenue: kpiData.totalRevenue ?? 0, totalProfit: null, totalOrders: kpiData.totalOrders ?? 0, lowStockCount })
      });
      const data = await response.json();
      setAiBriefing(data.success ? data.insights : `Operational Failure\n\n${data.error || 'Unable to assemble dynamic AI briefings.'}`);
    } catch (err: any) {
      setAiBriefing(`Connection Interrupted\n\nFailed to establish server connection: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => { if (!isLoadingKpi) triggerAiAnalysis(); }, [isLoadingKpi]);

  const runComplianceAudit = () => {
    setComplianceStatus('RUNNING');
    setAuditLogs([
      `[${new Date().toLocaleTimeString()}] Initiating Business Entity Audit...`,
      `[${new Date().toLocaleTimeString()}] Connecting to ZATCA Verification API...`,
      `[${new Date().toLocaleTimeString()}] Audit workflow requires connected verification service. Status: Not Connected.`
    ]);
    setTimeout(() => setComplianceStatus('NOT_CONNECTED'), 1200);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-12" id="owner-executive-board">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div><span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">OWNER SECTOR</span><h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2"><Landmark className="w-5 h-5 text-gold-pure animate-pulse" />Owner Dashboard</h2></div>
        <div className="flex items-center gap-2"><div className="flex items-center gap-2 bg-zinc-950 p-1 border border-white/5 rounded-xs font-mono text-[9px] uppercase">{branches.map(b => <button key={b.id} onClick={() => setSelectedBranch(b.id)} className={`px-2.5 py-1 rounded-sm cursor-pointer transition-all ${selectedBranch === b.id ? 'bg-gold-pure text-black font-bold' : 'text-zinc-400 hover:text-white'}`}>{b.name}</button>)}</div><DashboardLanguageSwitcher /><button className="p-2 border border-white/5 rounded-xs text-zinc-400 hover:text-white"><Bell className="w-4 h-4" /></button></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['TOTAL REVENUE', activeBranchRevenue !== null && activeBranchRevenue !== undefined ? `${activeBranchRevenue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} SAR` : 'Not Available', selectedBranch === 'all' ? 'All national branches combined' : `${branches.find(b=>b.id===selectedBranch)?.name} overview`],
          ['Net Gross Profit Margin', 'Not Available', 'Authoritative accounting COGS required'],
          ['Operational Overhead', 'Not Available', 'Requires expense telemetry'],
          ['Net Yield', 'Not Available', 'Requires authoritative profit and expenses']
        ].map(([label,value,note]) => <div key={label} className="bg-zinc-950/40 border border-white/5 p-4 rounded-xs space-y-2"><div className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest">{label}</div><strong className="text-white text-md">{value}</strong><span className="text-zinc-600 font-mono text-[8px] block">{note}</span></div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-3 lg:col-span-2"><div><span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono block">Financial Velocity Trends</span><h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Revenue Growth Trajectory</h3></div><div className="h-64">{kpiData.totalRevenue !== null ? <ResponsiveContainer width="100%" height="100%"><LineChart data={[{name:'Current Period',revenue:kpiData.totalRevenue}]}><XAxis dataKey="name" stroke="#555" fontSize={8}/><YAxis stroke="#555" fontSize={8}/><Tooltip/><Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2}/></LineChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-zinc-500">Not Available — Requires authoritative trend data</div>}</div></div>
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs flex items-center justify-center text-zinc-500 text-center text-[9px]">Category Analytics: Not Available — Requires authoritative category metrics</div>
      </div>

      <div className="bg-black border border-gold-pure/20 rounded-xs overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center gap-4"><div><span className="text-[9px] font-mono uppercase text-gold-pure tracking-widest font-bold">AL ZOAL PROGNOSTIC PORTAL</span><h3 className="text-xs uppercase font-mono text-white tracking-widest font-bold">AI Strategic Business Advisor</h3></div><button onClick={triggerAiAnalysis} disabled={isAiLoading} className="py-1 px-3 bg-gold-pure hover:bg-white text-black font-mono text-[8.5px] uppercase font-bold tracking-widest rounded-xs flex items-center gap-1.5">{isAiLoading ? <><RefreshCw className="w-3 h-3 animate-spin"/>Assembling Briefing...</> : <><RefreshCw className="w-3 h-3"/>Recompile Strategic Assembly</>}</button></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          <div className="lg:col-span-2 p-6 space-y-4 max-h-[420px] overflow-y-auto custom-scrollbar bg-black">{isAiLoading ? <div className="py-24 text-center text-zinc-500">Assembling Briefing...</div> : aiBriefing ? <SafeBriefing text={aiBriefing}/> : <div className="py-20 text-center text-zinc-500">No briefing compiled.</div>}</div>
          <div className="p-6 space-y-5 bg-zinc-950/20"><h4 className="text-[10px] uppercase font-mono text-white font-bold tracking-wider">Revenue Forecast — WMA Baseline</h4><div className="h-44"><ResponsiveContainer width="100%" height="100%"><BarChart data={aiForecasts}><XAxis dataKey="month" stroke="#444" fontSize={8}/><YAxis stroke="#444" fontSize={8}/><Tooltip/><Bar dataKey="revenue" fill="#D4AF37" name="Proj. Revenue"/></BarChart></ResponsiveContainer></div><div className="text-[8px] text-zinc-500">Profit Forecast: Not Available</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs text-center text-zinc-500 text-[9px]">Customer Intelligence: Not Available — Requires authoritative customer analytics</div>
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4"><h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Interactive Peak-Hour Staff Allocation</h3><input type="range" min="0" max="23" value={selectedHour} onChange={e=>setSelectedHour(Number(e.target.value))} className="w-full"/><div className="grid grid-cols-3 gap-2 text-center text-zinc-500 text-[9px]"><div>Active Traffic<br/><strong>Not Available</strong></div><div>Support Staff<br/><strong>Not Available</strong></div><div>Service Protocol<br/><strong>Not Available</strong></div></div></div>
      </div>

      <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4"><div className="flex justify-between items-center"><div><span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono block">Regulatory Gatekeeper</span><h3 className="text-xs uppercase font-mono text-gold-pure tracking-widest font-bold">Compliance Auditor (Verification Service)</h3></div><button onClick={runComplianceAudit} disabled={complianceStatus==='RUNNING'} className="py-1.5 px-3 bg-white text-black font-mono text-[8.5px] uppercase font-bold tracking-widest"><Shield className="w-3.5 h-3.5"/> Trigger compliance audit</button></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="md:col-span-2 bg-black border border-white/5 p-4 rounded-xs font-mono text-[9px] text-zinc-400">{auditLogs.length ? auditLogs.map((log,i)=><div key={i}>{log}</div>) : 'Audit workflow requires connected verification service.'}</div><div className="bg-black/40 border border-white/5 p-4 rounded-xs text-[9px] text-zinc-400">ZATCA TRN Verification: Not Connected<br/>GCC VAT: Verification Not Available<br/>Regional Data Isolation: Not Available<br/>Compliance Level: {complianceStatus}</div></div></div>
    </div>
  );
}