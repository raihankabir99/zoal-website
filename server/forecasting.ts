import { Request, Response } from 'express';
import { getServiceSupabaseClient } from './supabase.ts';
import { authenticateRequest } from '../backend/security.ts';

type DailyPoint = { period: string; revenue: number; orders: number; customers: number };
const FORECAST_HORIZONS = [7, 30, 90] as const;
const MIN_HISTORY_DAYS = 14;
const MIN_OBSERVED_DAYS = 7;
const MODEL_VERSION = 'baseline-wma-v1';
const PAGE_SIZE = 1000;
const REALIZED_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

function weightedAverage(values: number[]): number {
  if (!values.length) return 0;
  const weights = values.map((_, i) => i + 1);
  const denominator = weights.reduce((a, b) => a + b, 0);
  return values.reduce((sum, value, i) => sum + value * weights[i], 0) / denominator;
}

function wape(actual: number[], predicted: number[]): number | null {
  const denominator = actual.reduce((sum, value) => sum + Math.abs(value), 0);
  if (!denominator) return null;
  const error = actual.reduce((sum, value, i) => sum + Math.abs(value - (predicted[i] ?? 0)), 0);
  return Number(((error / denominator) * 100).toFixed(2));
}

function buildDailySeries(rows: any[]): DailyPoint[] {
  const buckets = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();
  for (const row of rows) {
    const date = new Date(row.created_at);
    if (Number.isNaN(date.getTime())) continue;
    const period = date.toISOString().slice(0, 10);
    const bucket = buckets.get(period) || { revenue: 0, orders: 0, customers: new Set<string>() };
    bucket.revenue += Number(row.total_amount || 0);
    bucket.orders += 1;
    if (row.customer_id) bucket.customers.add(String(row.customer_id));
    buckets.set(period, bucket);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([period, value]) => ({ period, revenue: value.revenue, orders: value.orders, customers: value.customers.size }));
}

function fillMissingDays(series: DailyPoint[], cutoff: Date): DailyPoint[] {
  if (!series.length) return [];
  const start = new Date(series[0].period + 'T00:00:00.000Z');
  const end = new Date(cutoff);
  end.setUTCHours(0, 0, 0, 0);
  const byDay = new Map(series.map(point => [point.period, point]));
  const result: DailyPoint[] = [];
  for (const cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10);
    result.push(byDay.get(key) || { period: key, revenue: 0, orders: 0, customers: 0 });
  }
  return result;
}

function project(series: DailyPoint[], horizon: number) {
  const recent = series.slice(-Math.min(7, series.length));
  return { revenue: weightedAverage(recent.map(p => p.revenue)), orders: weightedAverage(recent.map(p => p.orders)), customers: weightedAverage(recent.map(p => p.customers)), horizon };
}

async function loadOrders(supabase: any, historyStart: Date, cutoff: Date): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from('zoal_orders').select('id, customer_id, total_amount, status, payment_status, created_at').gte('created_at', historyStart.toISOString()).lte('created_at', cutoff.toISOString()).in('status', REALIZED_STATUSES).order('created_at', { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(`Forecast order query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function buildExecutiveForecast(supabase: any) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 1);
  cutoff.setUTCHours(23, 59, 59, 999);
  const historyStart = new Date(cutoff);
  historyStart.setUTCDate(historyStart.getUTCDate() - 365);
  historyStart.setUTCHours(0, 0, 0, 0);
  const orders = await loadOrders(supabase, historyStart, cutoff);
  const history = fillMissingDays(buildDailySeries(orders), cutoff);
  const historyDays = history.length;
  const observedDays = history.filter(p => p.orders > 0).length;
  const actualRevenue = history.reduce((sum, p) => sum + p.revenue, 0);
  const actualOrders = history.reduce((sum, p) => sum + p.orders, 0);
  const actualCustomerDays = history.reduce((sum, p) => sum + p.customers, 0);
  if (historyDays < MIN_HISTORY_DAYS || observedDays < MIN_OBSERVED_DAYS) return { status: 'insufficient_history', data_cutoff: cutoff.toISOString(), generated_at: new Date().toISOString(), forecast_method: MODEL_VERSION, model_version: MODEL_VERSION, history_days: historyDays, observed_days: observedDays, minimum_history_days: MIN_HISTORY_DAYS, minimum_observed_days: MIN_OBSERVED_DAYS, historical: history, forecasts: [], accuracy: { status: 'unavailable', wape: null, sample_size: 0 }, financial: { profit_forecast: null, status: 'insufficient_authoritative_cost_data' } };
  const forecasts = FORECAST_HORIZONS.map(horizon => { const daily = project(history, horizon); return { horizon_days: horizon, forecast_revenue: Number((daily.revenue * horizon).toFixed(2)), forecast_orders: Number((daily.orders * horizon).toFixed(2)), forecast_customers: Number((daily.customers * horizon).toFixed(2)), forecast_method: MODEL_VERSION, model_version: MODEL_VERSION, data_cutoff: cutoff.toISOString() }; });
  const holdoutSize = Math.min(7, Math.floor(history.length / 4));
  const train = history.slice(0, -holdoutSize);
  const holdout = history.slice(-holdoutSize);
  const backtestPrediction = weightedAverage(train.slice(-7).map(p => p.revenue));
  const accuracyWape = wape(holdout.map(p => p.revenue), holdout.map(() => backtestPrediction));
  return { status: 'verified', data_cutoff: cutoff.toISOString(), generated_at: new Date().toISOString(), forecast_method: MODEL_VERSION, model_version: MODEL_VERSION, history_days: historyDays, observed_days: observedDays, minimum_history_days: MIN_HISTORY_DAYS, historical: history, summary: { actual_revenue: Number(actualRevenue.toFixed(2)), actual_orders: actualOrders, actual_customer_days: actualCustomerDays }, forecasts, accuracy: { status: accuracyWape === null ? 'unavailable' : 'backtested', wape: accuracyWape, sample_size: holdout.length }, financial: { profit_forecast: null, status: 'insufficient_authoritative_cost_data' } };
}

export function getForecasts(req: Request, res: Response) {
  authenticateRequest(req as any, res, async () => {
    const user = (req as any).user;
    if (!['owner', 'admin', 'manager'].includes(user?.role)) return res.status(403).json({ error: 'Executive Forecast requires owner, admin, or manager access.' });
    const supabase = getServiceSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Forecast data service unavailable.' });
    try {
      const response = await buildExecutiveForecast(supabase);
      if (response.status === 'insufficient_history') return res.json(response);
      const generatedAt = response.generated_at;
      const snapshotRows = response.forecasts.map((f: any) => ({ metric: 'revenue', period_start: response.data_cutoff, horizon_days: f.horizon_days, actual_value: response.summary.actual_revenue, forecast_value: f.forecast_revenue, forecast_method: f.forecast_method, cutoff_at: response.data_cutoff, generated_at: generatedAt, model_version: f.model_version, data_status: 'verified', sample_size: response.history_days, accuracy_wape: response.accuracy.wape, forecast_type: 'Revenue', predicted_value: f.forecast_revenue, history_data: { actual_revenue: response.summary.actual_revenue, history_days: response.history_days, observed_days: response.observed_days, wape: response.accuracy.wape }, scenario: `Automated ${f.horizon_days}-day revenue forecast` }));
      const { error: persistError } = await supabase.from('zoal_forecasts').insert(snapshotRows);
      if (persistError) { console.error('Forecast snapshot persistence failed:', persistError.message); return res.status(503).json({ error: 'Forecast persistence unavailable.' }); }
      return res.json(response);
    } catch (error: any) { console.error('Executive Forecast failed:', error); return res.status(503).json({ error: 'Executive Forecast unavailable.' }); }
  });
}
