import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  BarChart3, RefreshCw, Calendar, ShieldAlert, Sparkles, Layers, 
  ArrowUpRight, ArrowDownRight, Info, AlertCircle, HelpCircle, Building2, Globe, Database, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../utils';

export interface StrategicReportOverview {
  totalRevenue: number;
  orderCount: number;
  aov: number;
  customerCount: number;
  revenueGrowth: number | null;
  orderGrowth: number | null;
  customerGrowth: number | null;
  lowStockCount: number;
}

export interface StrategicGrowthDetails {
  retentionRate: number;
  acquiredCustomers: number;
  newRegisteredCustomers: number;
  activeCustomers: number;
  retainedCustomers: number;
  unavailableSources: string[];
}

export interface StrategicFinancials {
  grossProfit: number | null;
  grossMargin: number | null;
  netProfit: number | null;
  netMargin: number | null;
  totalCogs: number | null;
  cogsStatus?: string;
  profitStatus?: string;
  uncostedItemCount: number;
}

export interface StrategicForecast {
  status: 'verified' | 'insufficient_history' | 'error' | 'unavailable';
  model_version?: string;
  wape?: number | null;
  history_days?: number;
  observed_days?: number;
  forecasts?: Array<{
    horizon_days: number;
    forecast_revenue: number;
    forecast_orders: number;
    forecast_customers: number;
  }>;
  note?: string;
}

export interface StrategicRegional {
  region: string;
  revenue: number;
  orderCount: number;
}

export interface StrategicBriefing {
  id: string;
  title: string;
  summary: string;
  content: any;
  captured_at: string;
}

export interface StrategicOpportunity {
  id: string;
  title: string;
  category: 'Growth' | 'Retention' | 'Regional' | 'Operations';
  evidence: string;
  supportingMetrics: string;
  priority: 'High' | 'Medium' | 'Low';
  recommendedAction: string;
}

export interface StrategicRisk {
  id: string;
  title: string;
  category: 'Financial' | 'Inventory' | 'Forecast' | 'Market';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  evidence: string;
  affectedMetric: string;
  recommendedAction: string;
}

export interface StrategicRecommendation {
  id: string;
  finding: string;
  recommendation: string;
  impactArea: string;
  priority: 'Immediate' | 'Short-Term' | 'Long-Term';
}

export const StrategicReport: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('yearly');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Raw API state
  const [kpiData, setKpiData] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<StrategicForecast | null>(null);
  const [briefingData, setBriefingData] = useState<StrategicBriefing[]>([]);

  // Fetch all authoritative data
  const fetchStrategicData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || localStorage.getItem('supabase_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Calculate start and end dates based on range for growth API
      const now = new Date();
      let startDate = new Date();
      if (timeRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'quarter') {
        startDate.setMonth(now.getMonth() - 3);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      const startIso = startDate.toISOString();
      const endIso = now.toISOString();

      // Parallel fetch of authoritative analytics endpoints
      const [kpiRes, growthRes, forecastRes, briefingRes] = await Promise.allSettled([
        fetch(`/api/kpi?range=${timeRange}`, { headers }),
        fetch(`/api/analytics/growth?mode=live&startDate=${encodeURIComponent(startIso)}&endDate=${encodeURIComponent(endIso)}`, { headers }),
        fetch('/api/forecasting', { headers }),
        fetch(`/api/ai/briefings?startDate=${encodeURIComponent(startIso)}&endDate=${encodeURIComponent(endIso)}`, { headers })
      ]);

      // Parse KPI Data (Core Authoritative SOT)
      if (kpiRes.status === 'fulfilled' && kpiRes.value.ok) {
        const kJson = await kpiRes.value.json();
        setKpiData(kJson);
      } else if (kpiRes.status === 'fulfilled' && !kpiRes.value.ok) {
        throw new Error(`Authoritative KPI Engine returned status ${kpiRes.value.status}`);
      } else if (kpiRes.status === 'rejected') {
        throw new Error(`Network failure connecting to Authoritative KPI Engine: ${kpiRes.reason?.message || 'Unknown error'}`);
      }

      // Parse Growth Data (Graceful Partial Degradation)
      if (growthRes.status === 'fulfilled' && growthRes.value.ok) {
        const gJson = await growthRes.value.json();
        setGrowthData(gJson);
      } else {
        console.warn('Growth Analytics API returned non-OK or was rejected; operating with partial metrics.');
        setGrowthData(null);
      }

      // Parse Forecast Data (Explicit Status Mapping)
      if (forecastRes.status === 'fulfilled') {
        if (forecastRes.value.ok) {
          const fJson = await forecastRes.value.json();
          let resolvedStatus: 'verified' | 'insufficient_history' | 'error' | 'unavailable' = 'unavailable';
          
          if (fJson.status === 'verified') {
            resolvedStatus = 'verified';
          } else if (fJson.status === 'insufficient_history') {
            resolvedStatus = 'insufficient_history';
          } else if (fJson.status === 'error') {
            resolvedStatus = 'error';
          } else {
            resolvedStatus = 'unavailable';
          }

          setForecastData({
            status: resolvedStatus,
            model_version: fJson.model_version || fJson.forecast_method,
            wape: fJson.accuracy?.wape ?? null,
            history_days: fJson.history_days,
            observed_days: fJson.observed_days,
            forecasts: Array.isArray(fJson.forecasts) ? fJson.forecasts : [],
            note: fJson.financial?.status === 'insufficient_authoritative_cost_data'
              ? 'Profit forecast unavailable — authoritative cost data is not populated.'
              : (fJson.error || fJson.message || undefined)
          });
        } else {
          const status = forecastRes.value.status;
          setForecastData({
            status: status === 403 ? 'unavailable' : 'error',
            note: status === 403 
              ? 'Forecast intelligence requires executive authorization (Owner/Admin).'
              : `Forecast engine returned HTTP ${status}.`
          });
        }
      } else {
        setForecastData({
          status: 'unavailable',
          note: 'Forecast service network connection failed.'
        });
      }

      // Parse Briefing Data
      if (briefingRes.status === 'fulfilled' && briefingRes.value.ok) {
        const bJson = await briefingRes.value.json();
        setBriefingData(Array.isArray(bJson) ? bJson : []);
      } else {
        setBriefingData([]);
      }

    } catch (err: any) {
      console.error('Error loading Strategic Intelligence data:', err);
      setError(err.message || 'Failed to communicate with Enterprise Strategic Analytics Engine.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStrategicData();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStrategicData();
  };

  // Derive Overview Metrics cleanly
  const liveKpi = kpiData?.live || {};
  const overview: StrategicReportOverview = useMemo(() => {
    return {
      totalRevenue: Number(liveKpi.totalRevenue || 0),
      orderCount: Number(liveKpi.orderCount || 0),
      aov: Number(liveKpi.aov || 0),
      customerCount: Number(liveKpi.customerCount || 0),
      revenueGrowth: growthData?.revenueGrowth ?? null,
      orderGrowth: growthData?.orderGrowth ?? null,
      customerGrowth: growthData?.customerGrowth ?? null,
      lowStockCount: Number(liveKpi.lowStockCount || 0)
    };
  }, [liveKpi, growthData]);

  // Derive Growth Details
  const growthDetails: StrategicGrowthDetails = useMemo(() => {
    return {
      retentionRate: Number(growthData?.retentionRate || 0),
      acquiredCustomers: Number(growthData?.acquiredCustomers || 0),
      newRegisteredCustomers: Number(growthData?.newRegisteredCustomers || 0),
      activeCustomers: Number(growthData?.activeCustomers || 0),
      retainedCustomers: Number(growthData?.retainedCustomers || 0),
      unavailableSources: growthData?.unavailableSources || ['traffic', 'pageviews', 'ad_spend', 'conversion_funnel']
    };
  }, [growthData]);

  // Financial Metrics
  const financials: StrategicFinancials = useMemo(() => {
    return {
      grossProfit: liveKpi.grossProfit == null ? null : Number(liveKpi.grossProfit),
      grossMargin: liveKpi.grossMargin == null ? null : Number(liveKpi.grossMargin),
      netProfit: liveKpi.netProfit == null ? null : Number(liveKpi.netProfit),
      netMargin: liveKpi.netMargin == null ? null : Number(liveKpi.netMargin),
      totalCogs: liveKpi.totalCogs == null ? null : Number(liveKpi.totalCogs),
      cogsStatus: liveKpi.cogsStatus || 'unverified',
      profitStatus: liveKpi.profitStatus || 'unverified',
      uncostedItemCount: Number(liveKpi.uncostedItemCount || 0)
    };
  }, [liveKpi]);

  // Regions
  const regionalList: StrategicRegional[] = useMemo(() => {
    return (liveKpi.regional || []).map((r: any) => ({
      region: r.region || 'Unknown Region',
      revenue: Number(r.revenue || 0),
      orderCount: Number(r.orderCount || 0)
    }));
  }, [liveKpi.regional]);

  // Dynamic Evidence-Based Opportunities
  const opportunities: StrategicOpportunity[] = useMemo(() => {
    const list: StrategicOpportunity[] = [];

    if (overview.revenueGrowth !== null && overview.revenueGrowth > 0) {
      list.push({
        id: 'opp-rev-growth',
        title: 'Positive Revenue Expansion',
        category: 'Growth',
        evidence: `Revenue grew by +${overview.revenueGrowth}% in the selected period compared to previous matching period.`,
        supportingMetrics: `Current Revenue: ${formatCurrency(overview.totalRevenue)}`,
        priority: 'High',
        recommendedAction: 'Capitalize on sales momentum by maintaining inventory availability across high-demand categories.'
      });
    }

    if (growthDetails.retentionRate > 0) {
      list.push({
        id: 'opp-retention',
        title: 'Established Repeat Retention Base',
        category: 'Retention',
        evidence: `Customer retention rate is recorded at ${growthDetails.retentionRate}% with ${growthDetails.retainedCustomers} retained active buyers.`,
        supportingMetrics: `${growthDetails.acquiredCustomers} Period Acquired Customers`,
        priority: growthDetails.retentionRate >= 30 ? 'High' : 'Medium',
        recommendedAction: 'Implement targeted repeat buyer loyalty incentives to sustain lifetime customer engagement.'
      });
    }

    if (regionalList.length > 0) {
      const sortedReg = [...regionalList].sort((a, b) => b.revenue - a.revenue);
      const topReg = sortedReg[0];
      if (topReg && topReg.revenue > 0) {
        list.push({
          id: 'opp-top-region',
          title: `Regional Market Leadership: ${topReg.region}`,
          category: 'Regional',
          evidence: `${topReg.region} leads regional revenue output at ${formatCurrency(topReg.revenue)} across ${topReg.orderCount} orders.`,
          supportingMetrics: `${topReg.orderCount} Total Orders`,
          priority: 'High',
          recommendedAction: `Prioritize local logistics and targeted regional promotional campaigns in ${topReg.region}.`
        });
      }
    }

    if (overview.lowStockCount > 0) {
      list.push({
        id: 'opp-restock',
        title: 'High-Demand Replenishment Opportunity',
        category: 'Operations',
        evidence: `${overview.lowStockCount} product SKUs have fallen to low safety stock levels.`,
        supportingMetrics: `${overview.lowStockCount} SKUs below threshold`,
        priority: 'Medium',
        recommendedAction: 'Issue purchase replenishment orders immediately to prevent out-of-stock revenue loss.'
      });
    }

    return list;
  }, [overview, growthDetails, regionalList]);

  // Dynamic Evidence-Based Risks
  const risks: StrategicRisk[] = useMemo(() => {
    const list: StrategicRisk[] = [];

    if (financials.grossProfit === null) {
      list.push({
        id: 'risk-cogs',
        title: 'Financial Profitability Blindspot',
        category: 'Financial',
        severity: 'High',
        evidence: `Unit cost prices (COGS) are missing or incomplete for ${financials.uncostedItemCount} inventory items.`,
        affectedMetric: 'Gross & Net Profit Margin',
        recommendedAction: 'Populate unit cost prices across all catalog items to unlock authoritative profit margin tracking.'
      });
    }

    if (overview.revenueGrowth !== null && overview.revenueGrowth < 0) {
      list.push({
        id: 'risk-rev-decline',
        title: 'Revenue Contraction Risk',
        category: 'Market',
        severity: 'Critical',
        evidence: `Revenue contracted by ${overview.revenueGrowth}% compared to the prior baseline period.`,
        affectedMetric: 'Total Revenue',
        recommendedAction: 'Perform category performance analysis to identify underperforming SKUs and adjust pricing strategies.'
      });
    }

    if (overview.lowStockCount > 0) {
      list.push({
        id: 'risk-stockout',
        title: 'Inventory Stockout & Revenue Loss Risk',
        category: 'Inventory',
        severity: overview.lowStockCount > 5 ? 'High' : 'Medium',
        evidence: `${overview.lowStockCount} product SKUs have reached safety thresholds.`,
        affectedMetric: 'Fulfillment & Low-Stock Count',
        recommendedAction: 'Coordinate with warehouse managers to restock critical inventory items immediately.'
      });
    }

    if (forecastData?.status === 'insufficient_history') {
      list.push({
        id: 'risk-forecast-history',
        title: 'Predictive Forecast Data Deficit',
        category: 'Forecast',
        severity: 'Low',
        evidence: `Observed order history (${forecastData.observed_days || 0} days) has not reached the required minimum threshold (14 days).`,
        affectedMetric: 'Revenue Projection Model',
        recommendedAction: 'Allow transactional order history to accumulate over consecutive operating days to enable regression forecasting.'
      });
    }

    return list;
  }, [financials, overview, forecastData]);

  // Strategic Recommendations derived strictly from findings
  const recommendations: StrategicRecommendation[] = useMemo(() => {
    const recs: StrategicRecommendation[] = [];

    if (financials.grossProfit === null) {
      recs.push({
        id: 'rec-cogs',
        finding: 'Profit & Margin tracking unavailable due to uncosted product inventory.',
        recommendation: 'Audit catalog cost prices in Product Workspace to establish authoritative gross margin baselines.',
        impactArea: 'Financial Management',
        priority: 'Immediate'
      });
    }

    if (overview.lowStockCount > 0) {
      recs.push({
        id: 'rec-restock',
        finding: `${overview.lowStockCount} items currently below safety stock threshold.`,
        recommendation: 'Initiate targeted supplier reorders for top velocity inventory SKUs.',
        impactArea: 'Supply Chain & Inventory',
        priority: 'Immediate'
      });
    }

    if (growthDetails.retentionRate > 0) {
      recs.push({
        id: 'rec-retention',
        finding: `Current customer retention rate stands at ${growthDetails.retentionRate}%.`,
        recommendation: 'Launch automated post-purchase email workflows to increase customer repeat order frequency.',
        impactArea: 'Customer Retention & CRM',
        priority: 'Short-Term'
      });
    }

    if (forecastData?.status === 'verified' && forecastData.forecasts && forecastData.forecasts.length > 0) {
      const f30 = forecastData.forecasts.find(f => f.horizon_days === 30) || forecastData.forecasts[0];
      recs.push({
        id: 'rec-forecast-capacity',
        finding: `30-Day Revenue Forecast projects ${formatCurrency(f30.forecast_revenue)} based on WMA baseline model.`,
        recommendation: 'Align procurement budgets with forecasted 30-day demand expectations.',
        impactArea: 'Financial Planning',
        priority: 'Short-Term'
      });
    }

    return recs;
  }, [financials, overview, growthDetails, forecastData]);

  // Loading View
  if (loading) {
    return (
      <div className="bg-zinc-950 border border-white/5 rounded-xs p-12 text-center space-y-4 animate-fade-in text-left">
        <div className="flex items-center justify-center space-x-3 text-gold-pure">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold">Loading Strategic Intelligence...</span>
        </div>
        <p className="text-zinc-500 text-xs text-center max-w-md mx-auto">
          Synchronizing authoritative Business Insights core aggregations, live growth metrics, and predictive forecasting pipelines.
        </p>
      </div>
    );
  }

  // Error View
  if (error) {
    return (
      <div className="bg-zinc-950 border border-red-500/20 rounded-xs p-8 space-y-4 text-left font-sans">
        <div className="flex items-center space-x-3 text-red-400 border-b border-red-500/10 pb-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <h3 className="font-mono text-sm uppercase font-bold tracking-wider">Strategic Intelligence Pipeline Failure</h3>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed">{error}</p>
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleRefresh}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono font-bold uppercase py-2 px-4 rounded-xs border border-red-500/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Analytics Sync</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans animate-fade-in">
      {/* Strategic Header Bar */}
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block">ENTERPRISE INTELLIGENCE</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
              Authoritative SOT Connected
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center space-x-2">
            <span>STRATEGIC BUSINESS REPORT</span>
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-zinc-900 border border-white/10 rounded-xs p-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'quarter', label: '90 Days' },
              { id: 'yearly', label: '1 Year' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-xs transition-all cursor-pointer ${
                  timeRange === range.id
                    ? 'bg-gold-pure text-black shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white p-2 rounded-xs transition-all cursor-pointer"
            title="Refresh Strategic Intelligence Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-gold-pure' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Source & Scope Notice */}
      <div className="bg-zinc-950/80 border border-white/5 p-3 rounded-xs flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-400 gap-2">
        <div className="flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-gold-pure" />
          <span>Source: <strong className="text-white">Authoritative Business Insights Engine</strong> (Supabase / PostgreSQL)</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Range: <strong className="text-gold-pure uppercase">{timeRange}</strong></span>
          <span>Basis: <strong className="text-emerald-400">Realized Orders (paid, processing, shipped, delivered)</strong></span>
        </div>
      </div>

      {/* 1. STRATEGIC OVERVIEW METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* Total Revenue */}
        <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider">
            <span>Total Revenue</span>
            <BarChart3 className="w-4 h-4 text-gold-pure" />
          </div>
          <div className="text-2xl text-white font-bold">
            {formatCurrency(overview.totalRevenue)}
          </div>
          <div className="flex items-center space-x-2 text-[10px]">
            {overview.revenueGrowth !== null ? (
              <span className={`font-bold flex items-center ${overview.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {overview.revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {overview.revenueGrowth >= 0 ? `+${overview.revenueGrowth}%` : `${overview.revenueGrowth}%`}
              </span>
            ) : (
              <span className="text-zinc-500">Growth: N/A</span>
            )}
            <span className="text-zinc-600">vs prior period</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider">
            <span>Total Realized Orders</span>
            <Layers className="w-4 h-4 text-gold-pure" />
          </div>
          <div className="text-2xl text-white font-bold">
            {overview.orderCount.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 text-[10px]">
            {overview.orderGrowth !== null ? (
              <span className={`font-bold flex items-center ${overview.orderGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {overview.orderGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {overview.orderGrowth >= 0 ? `+${overview.orderGrowth}%` : `${overview.orderGrowth}%`}
              </span>
            ) : (
              <span className="text-zinc-500">Growth: N/A</span>
            )}
            <span className="text-zinc-600">vs prior period</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-gold-pure" />
          </div>
          <div className="text-2xl text-white font-bold">
            {formatCurrency(overview.aov)}
          </div>
          <div className="text-[10px] text-zinc-500">
            Per completed order baseline
          </div>
        </div>

        {/* Active Customers */}
        <div className="p-5 bg-zinc-950 border border-white/5 rounded-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-[10px] uppercase tracking-wider">
            <span>Active Customers</span>
            <Globe className="w-4 h-4 text-gold-pure" />
          </div>
          <div className="text-2xl text-white font-bold">
            {overview.customerCount.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 text-[10px]">
            {overview.customerGrowth !== null ? (
              <span className={`font-bold flex items-center ${overview.customerGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {overview.customerGrowth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {overview.customerGrowth >= 0 ? `+${overview.customerGrowth}%` : `${overview.customerGrowth}%`}
              </span>
            ) : (
              <span className="text-zinc-500">Growth: N/A</span>
            )}
            <span className="text-zinc-600">vs prior period</span>
          </div>
        </div>
      </div>

      {/* 2. FINANCIAL & COST TRUTHFULNESS SECTION */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gold-pure" />
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold">Financial Profitability & Cost Control</h3>
          </div>
          {financials.grossProfit === null ? (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
              Cost Data Pending
            </span>
          ) : (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase">
              Authoritative Profit Verified
            </span>
          )}
        </div>

        {financials.grossProfit === null ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Profit Unavailable — Authoritative Cost Data Not Available</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Gross profit, net profit, and contribution margins cannot be calculated because product cost prices (COGS) are not populated for <strong>{financials.uncostedItemCount} item SKUs</strong>. ZOAL Enterprise rules prohibit synthetic margin estimation.
            </p>
            <div className="text-[11px] font-mono text-zinc-500 pt-1">
              To unlock profit tracking, enter unit cost prices under <strong>Product Workspace Form</strong>.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Total COGS</span>
              <span className="text-lg text-white font-bold block">{formatCurrency(financials.totalCogs || 0)}</span>
            </div>
            <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Gross Profit</span>
              <span className="text-lg text-emerald-400 font-bold block">{formatCurrency(financials.grossProfit)}</span>
            </div>
            <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Gross Margin</span>
              <span className="text-lg text-emerald-400 font-bold block">{financials.grossMargin}%</span>
            </div>
            <div className="p-4 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Net Margin</span>
              <span className="text-lg text-emerald-400 font-bold block">{financials.netMargin}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. GROWTH & CUSTOMER RETENTION INTELLIGENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Intelligence */}
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
              <Globe className="w-4 h-4 text-gold-pure" />
              <span>Customer Intelligence & Retention</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">Period Cohort</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Period Retention Rate</span>
              <span className="text-xl text-gold-pure font-bold block">{growthDetails.retentionRate}%</span>
            </div>
            <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">Retained Buyers</span>
              <span className="text-xl text-white font-bold block">{growthDetails.retainedCustomers}</span>
            </div>
            <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">New Acquired Buyers</span>
              <span className="text-xl text-white font-bold block">{growthDetails.acquiredCustomers}</span>
            </div>
            <div className="p-3 bg-black border border-white/5 rounded-xs space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">New Registrations</span>
              <span className="text-xl text-white font-bold block">{growthDetails.newRegisteredCustomers}</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xs text-[11px] text-zinc-400 leading-relaxed space-y-1">
            <div className="flex items-center space-x-1.5 text-zinc-300 font-bold">
              <Info className="w-3.5 h-3.5 text-gold-pure" />
              <span>Lifetime Value (LTV) Policy</span>
            </div>
            <p>
              Lifetime Value (LTV) and CAC are currently marked as <strong className="text-white">Unavailable</strong>. True LTV requires full historical customer economics. Period revenue is not mislabeled as lifetime value.
            </p>
          </div>
        </div>

        {/* Regional Market Performance */}
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
              <Compass className="w-4 h-4 text-gold-pure" />
              <span>Regional Market Revenue Breakdown</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">GCC States</span>
          </div>

          {regionalList.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs font-mono">
              No regional order volume recorded for the selected period.
            </div>
          ) : (
            <div className="space-y-2.5">
              {regionalList.map((reg, idx) => {
                const totalRegRev = regionalList.reduce((sum, r) => sum + r.revenue, 0);
                const pct = totalRegRev > 0 ? ((reg.revenue / totalRegRev) * 100).toFixed(1) : '0.0';
                return (
                  <div key={idx} className="p-3 bg-black border border-white/5 rounded-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{reg.region}</span>
                      <span className="text-gold-pure">{formatCurrency(reg.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>{reg.orderCount} Orders</span>
                      <span>{pct}% of Regional Share</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gold-pure h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. PREDICTIVE FORECASTING INTEGRATION */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-gold-pure" />
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold">Predictive Forecast Model</h3>
          </div>
          <div className="flex items-center space-x-2 font-mono text-[10px]">
            {forecastData?.status === 'verified' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Model: {forecastData.model_version || 'WMA Baseline'} (WAPE: {forecastData.wape ?? 'N/A'}%)
              </span>
            )}
            {forecastData?.status === 'insufficient_history' && (
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Forecast Status: Insufficient History ({forecastData.observed_days || 0}/14 Days)
              </span>
            )}
            {forecastData?.status === 'error' && (
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Forecast Status: Service Error
              </span>
            )}
            {forecastData?.status === 'unavailable' && (
              <span className="bg-zinc-800 text-zinc-400 border border-white/10 px-2.5 py-0.5 rounded-full font-bold uppercase">
                Forecast Status: Unavailable
              </span>
            )}
          </div>
        </div>

        {forecastData?.status === 'verified' && forecastData.forecasts && forecastData.forecasts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            {forecastData.forecasts.map((f, i) => (
              <div key={i} className="p-4 bg-black border border-white/5 rounded-xs space-y-2">
                <div className="text-zinc-400 text-[10px] uppercase tracking-wider flex justify-between">
                  <span>{f.horizon_days}-Day Projection</span>
                  <span className="text-gold-pure">WMA Model</span>
                </div>
                <div className="text-xl text-white font-bold">
                  {formatCurrency(f.forecast_revenue)}
                </div>
                <div className="text-[10px] text-zinc-500 flex justify-between pt-1 border-t border-white/5">
                  <span>Est. Orders: <strong>{Math.round(f.forecast_orders)}</strong></span>
                  <span>Est. Buyers: <strong>{Math.round(f.forecast_customers)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : forecastData?.status === 'insufficient_history' ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xs space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-amber-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Forecast Unavailable — Insufficient Authoritative Historical Data</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              Automated weighted moving average (WMA) forecasting requires a minimum of 14 operating days of transactional order history. 
              {forecastData?.observed_days !== undefined && (
                <span> Currently observed: <strong>{forecastData.observed_days} active order days</strong>.</span>
              )}
            </p>
            <div className="text-[10px] text-zinc-500 pt-1">
              Arbitrary projection multipliers (e.g. static +15% additions) are strictly forbidden by enterprise analytics rules.
            </div>
          </div>
        ) : forecastData?.status === 'error' ? (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xs space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Forecast Engine Communication Error</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              {forecastData?.note || 'The forecasting service was unable to calculate statistical projections for the active store database.'}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xs space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-zinc-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Predictive Forecast Model Unavailable</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-sans">
              {forecastData?.note || 'Forecasting service is currently unavailable or requires elevated executive credentials.'}
            </p>
          </div>
        )}
      </div>

      {/* 5. EVIDENCE-BASED STRATEGIC OPPORTUNITIES & RISKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        {/* Evidence-Based Opportunities */}
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Evidence-Based Opportunities ({opportunities.length})</span>
            </h3>
          </div>

          {opportunities.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs font-mono">
              No active growth opportunities triggered for the selected timeframe.
            </div>
          ) : (
            <div className="space-y-3">
              {opportunities.map(opp => (
                <div key={opp.id} className="p-4 bg-black border border-white/5 rounded-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-mono font-bold text-xs uppercase">{opp.title}</span>
                    <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {opp.category} • {opp.priority} Priority
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{opp.evidence}</p>
                  <div className="p-2 bg-zinc-900/80 border border-white/5 rounded-xs text-[10px] font-mono text-zinc-400">
                    <strong className="text-gold-pure">Action: </strong>{opp.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evidence-Based Risks */}
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Evidence-Based Strategic Risks ({risks.length})</span>
            </h3>
          </div>

          {risks.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs font-mono">
              No critical operational or financial risks detected.
            </div>
          ) : (
            <div className="space-y-3">
              {risks.map(r => (
                <div key={r.id} className="p-4 bg-black border border-white/5 rounded-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-red-400 font-mono font-bold text-xs uppercase">{r.title}</span>
                    <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      r.severity === 'Critical' || r.severity === 'High' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {r.severity} Severity
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{r.evidence}</p>
                  <div className="p-2 bg-zinc-900/80 border border-white/5 rounded-xs text-[10px] font-mono text-zinc-400">
                    <strong className="text-red-400">Mitigation: </strong>{r.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. ACTIONABLE STRATEGIC RECOMMENDATIONS */}
      <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4 font-sans">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gold-pure" />
            <span>Targeted Executive Directives ({recommendations.length})</span>
          </h3>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs font-mono">
            No active executive directives required for the current operating baseline.
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {recommendations.map((rec, i) => (
              <div key={rec.id} className="p-4 bg-black border border-white/5 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-gold-pure font-bold text-xs uppercase">Directive #{i + 1}: {rec.impactArea}</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full uppercase">
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-[11px] font-sans leading-relaxed">{rec.recommendation}</p>
                  <div className="text-[10px] text-zinc-500">
                    Finding basis: {rec.finding}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. RECENT EXECUTIVE BRIEFING EXTRACT */}
      {briefingData.length > 0 && (
        <div className="bg-zinc-950 border border-white/5 p-6 rounded-xs space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-xs font-display uppercase tracking-widest font-bold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gold-pure" />
              <span>AI Executive Synthesis Briefing</span>
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              Captured: {new Date(briefingData[0].captured_at).toLocaleDateString()}
            </span>
          </div>

          <div className="p-4 bg-black border border-white/5 rounded-xs space-y-3 text-xs">
            <h4 className="text-gold-pure font-bold font-mono text-xs uppercase">{briefingData[0].title || 'Executive Performance Analysis'}</h4>
            <div className="text-zinc-300 text-xs leading-relaxed font-sans whitespace-pre-line">
              {typeof briefingData[0].content === 'string' 
                ? briefingData[0].content 
                : briefingData[0].summary || 'Real-time performance analysis compiled from authoritative Business Insights data.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicReport;
