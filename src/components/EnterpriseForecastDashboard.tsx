import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, RefreshCw, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { supabaseClient } from '../lib/supabaseClient';

interface ForecastResponse {
  status: string;
  data_cutoff: string;
  generated_at: string;
  forecast_method: string;
  model_version: string;
  history_days: number;
  minimum_history_days: number;
  historical: Array<{ period: string; revenue: number; orders: number; customers: number }>;
  summary?: { actual_revenue: number; actual_orders: number; actual_customers: number };
  forecasts: Array<{ horizon_days: number; forecast_revenue: number; forecast_orders: number; forecast_customers: number }>;
  accuracy: { status: string; wape: number | null; sample_size: number };
  financial: { profit_forecast: number | null; status: string };
}

const money = (value: number | null | undefined) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR`;

export const EnterpriseForecastDashboard: React.FC = () => {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const token = sessionData.session?.access_token;
      const response = await fetch('/api/forecasting', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Forecast request failed (${response.status})`);
      }
      setData(await response.json());
    } catch (err: any) {
      setError(err?.message || 'Unable to load the authoritative forecast.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chart = useMemo(() => {
    if (!data) return [];
    const history = data.historical.slice(-60).map(point => ({
      period: point.period,
      Actual: Number(point.revenue.toFixed(2)),
      Forecast: null as number | null
    }));
    const horizon30 = data.forecasts.find(f => f.horizon_days === 30);
    if (horizon30 && history.length) {
      const daily = horizon30.forecast_revenue / 30;
      for (let i = 1; i <= 30; i++) {
        const d = new Date(data.data_cutoff);
        d.setUTCDate(d.getUTCDate() + i);
        history.push({ period: d.toISOString().slice(0, 10), Actual: null as number | null, Forecast: Number(daily.toFixed(2)) });
      }
    }
    return history;
  }, [data]);

  if (loading) {
    return <div className="p-8 text-zinc-400 font-mono text-xs uppercase tracking-widest">Loading authoritative forecast…</div>;
  }

  if (error) {
    return <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-3"><AlertCircle className="w-4 h-4" />{error}</div>;
  }

  if (!data) return null;

  const insufficient = data.status === 'insufficient_history';

  return (
    <div className="space-y-6 text-left pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-[9px] tracking-[0.4em] text-gold-pure uppercase font-mono block mb-1">SERVER-AUTHORITATIVE FORECAST</span>
          <h2 className="text-xl font-bold tracking-widest font-display uppercase text-white flex items-center gap-2"><Calendar className="w-5 h-5 text-gold-pure" />Executive Forecast Center</h2>
          <p className="text-[10px] text-zinc-500 mt-2 font-mono">Model: {data.model_version} · Cutoff: {new Date(data.data_cutoff).toLocaleString()}</p>
        </div>
        <button onClick={load} className="self-start flex items-center gap-2 bg-zinc-950 border border-white/10 px-3 py-2 text-[10px] font-mono uppercase text-zinc-300"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>

      {insufficient ? (
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 text-amber-200 text-sm">
          <strong>Forecast unavailable — insufficient historical data.</strong>
          <p className="text-zinc-400 mt-2">The engine has {data.history_days} historical day(s) and requires at least {data.minimum_history_days}. No synthetic forecast is generated.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-950 border border-white/5 p-4"><span className="text-zinc-500 text-[8px] uppercase tracking-widest">Actual Revenue</span><div className="text-white text-lg font-bold font-mono mt-1">{money(data.summary?.actual_revenue)}</div></div>
            <div className="bg-zinc-950 border border-white/5 p-4"><span className="text-zinc-500 text-[8px] uppercase tracking-widest">30-Day Revenue Forecast</span><div className="text-white text-lg font-bold font-mono mt-1">{money(data.forecasts.find(f => f.horizon_days === 30)?.forecast_revenue)}</div></div>
            <div className="bg-zinc-950 border border-white/5 p-4"><span className="text-zinc-500 text-[8px] uppercase tracking-widest">Forecast Accuracy</span><div className="text-white text-lg font-bold font-mono mt-1">{data.accuracy.wape == null ? 'N/A' : `${data.accuracy.wape}% WAPE`}</div></div>
            <div className="bg-zinc-950 border border-white/5 p-4"><span className="text-zinc-500 text-[8px] uppercase tracking-widest">Profit Forecast</span><div className="text-white text-lg font-bold font-mono mt-1">N/A</div><div className="text-[9px] text-zinc-600 mt-1">Authoritative COGS unavailable</div></div>
          </div>

          <div className="bg-zinc-950 border border-white/5 p-5">
            <div className="flex items-center gap-2 mb-5"><TrendingUp className="w-4 h-4 text-gold-pure" /><span className="text-xs uppercase tracking-widest text-white">Actual vs 30-Day Model Forecast</span></div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Actual" stroke="#D4AF37" dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="Forecast" stroke="#8b8b8b" dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.forecasts.map(f => (
              <div key={f.horizon_days} className="bg-zinc-950 border border-white/5 p-5">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500">Next {f.horizon_days} Days</div>
                <div className="text-xl font-bold font-mono text-white mt-2">{money(f.forecast_revenue)}</div>
                <div className="text-[10px] text-zinc-500 mt-2">Orders: {f.forecast_orders.toLocaleString()} · Customers: {f.forecast_customers.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">Generated {new Date(data.generated_at).toLocaleString()} · {data.forecast_method} · Backtest sample {data.accuracy.sample_size}</div>
        </>
      )}
    </div>
  );
};

export default EnterpriseForecastDashboard;
