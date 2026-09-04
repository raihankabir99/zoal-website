import { getServiceSupabaseClient } from './supabase';
import { logActivityAsync } from './auth_db';
import { buildExecutiveForecast } from './forecasting';
import { Request, Response } from 'express';

const DEFAULT_MODELS = [
  { name: 'Pricing Scenario', type: 'Pricing', configuration: { description: 'Scenario analysis using live transactional revenue as the baseline. Results are planning scenarios, not forecasts.', variables: { multiplier: 1.0, discountRate: 0 } } },
  { name: 'Warehouse Scenario', type: 'Warehouse', configuration: { description: 'Scenario analysis for warehouse capacity and operating cost inputs using live transactional revenue as the baseline.', variables: { capacity: 1000, monthlyRent: 0 } } },
  { name: 'Discount Scenario', type: 'Discount', configuration: { description: 'Scenario analysis for discount changes using live transactional revenue as the baseline.', variables: { discountRate: 0, sensitivity: 1.0 } } },
  { name: 'Inventory Scenario', type: 'Inventory', configuration: { description: 'Scenario analysis for inventory assumptions using live transactional revenue as the baseline.', variables: { capacity: 1000, monthlyCost: 0 } } }
] as const;

function mapModel(row: any) {
  const configuration = row?.configuration || {};
  return { id: row.id, name: row.name, description: configuration.description || `Authoritative ${row.type || 'decision'} scenario model.`, variables: configuration.variables || {}, risk_weight: Number(configuration.risk_weight ?? 5), type: row.type };
}

export async function getDecisionModels(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try {
    const { data, error } = await supabase.from('zoal_decision_models').select('id,name,type,configuration,created_at').order('created_at', { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) {
      const { data: seeded, error: seedError } = await supabase.from('zoal_decision_models').insert(DEFAULT_MODELS.map(model => ({ name: model.name, type: model.type, configuration: model.configuration }))).select('id,name,type,configuration,created_at');
      if (seedError) throw seedError;
      return res.json((seeded || []).map(mapModel));
    }
    return res.json(data.map(mapModel));
  } catch (err: any) { console.error('Decision model registry error:', err); return res.status(500).json({ error: 'Failed to load decision model registry.' }); }
}

export async function getSimulationRuns(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try {
    const { data, error } = await supabase.from('zoal_simulation_runs').select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at').order('captured_at', { ascending: false }).limit(200);
    if (error) throw error;
    return res.json((data || []).map((row: any) => ({ id: row.id, model_id: row.model_id, scenario_name: row.scenario_data?.scenario_name || 'Unnamed Scenario', revenue_projection: Number(row.revenue_projection || 0), profit_projection: Number(row.profit_projection || 0), risk_score: Number(row.risk_score || 0), parameters: row.scenario_data?.parameters || {}, captured_at: row.captured_at, profitStatus: row.scenario_data?.resultStatus?.profit || 'unavailable', decisionSignal: row.scenario_data?.decision?.signal || 'insufficient_evidence', riskBasis: row.scenario_data?.risk?.basis || 'model_configuration', recommendation: row.scenario_data?.recommendation || null, forecast: row.scenario_data?.forecast || null })));
  } catch (err: any) { console.error('Simulation run registry error:', err); return res.status(500).json({ error: 'Failed to load simulation runs.' }); }
}

function deriveOperationalRisk(core: any, modelRisk: number, parameterRisk: boolean) {
  const lowStockCount = Math.max(0, Number(core?.lowStockCount || 0));
  const refundRatePct = Math.max(0, Number(core?.refundRatePct || 0));
  const stockSignal = lowStockCount >= 20 ? 3 : lowStockCount >= 10 ? 2 : lowStockCount > 0 ? 1 : 0;
  const refundSignal = refundRatePct >= 10 ? 3 : refundRatePct >= 5 ? 2 : refundRatePct > 0 ? 1 : 0;
  const parameterSignal = parameterRisk ? 1 : 0;
  const score = Math.min(10, Math.max(1, Math.round(modelRisk + stockSignal + refundSignal + parameterSignal)));
  return { score, basis: 'authoritative_inventory_refund_signals_plus_model_configuration_and_parameter_bounds', liveOperationalRisk: true, lowStockCount, refundRatePct, components: { model: modelRisk, lowStock: stockSignal, refundRate: refundSignal, parameterBounds: parameterSignal } };
}

export async function createSimulationRun(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try {
    const { model_id, scenario_name, parameters } = req.body || {};
    if (!model_id || typeof model_id !== 'string') return res.status(400).json({ error: 'model_id is required.' });
    if (!scenario_name || typeof scenario_name !== 'string' || scenario_name.trim().length < 2) return res.status(400).json({ error: 'scenario_name is required.' });
    const { data: model, error: modelError } = await supabase.from('zoal_decision_models').select('id,name,type,configuration').eq('id', model_id).single();
    if (modelError || !model) return res.status(404).json({ error: 'Decision model not found.' });

    const end = new Date();
    const start = new Date(end); start.setDate(start.getDate() - 30);
    const { data: core, error: coreError } = await supabase.rpc('zoal_executive_financial_core_stats', { p_start: start.toISOString(), p_end: end.toISOString() });
    if (coreError) throw coreError;

    const baseRevenue = Number(core?.totalRevenue || 0);
    const p1 = Number(parameters?.param1 ?? 1);
    const p2 = Number(parameters?.param2 ?? 0);
    if (!Number.isFinite(p1) || !Number.isFinite(p2)) return res.status(400).json({ error: 'Simulation parameters must be finite numbers.' });

    const type = model.type;
    let projectedRevenue = baseRevenue;
    let assumptions: Record<string, number> = {};
    if (type === 'Pricing') {
      const multiplier = Math.max(0, Math.min(10, p1)); const discountRate = Math.min(100, Math.max(0, p2));
      assumptions = { multiplier, discountRate }; projectedRevenue = baseRevenue * multiplier * (1 - discountRate / 100);
    } else if (type === 'Warehouse' || type === 'Inventory') {
      const capacity = Math.max(0, Math.min(1000000, p1)); const monthlyCost = Math.max(0, Math.min(100000000, p2));
      assumptions = { capacity, monthlyCost }; const capacityFactor = Math.min(1.5, 1 + capacity / 10000); projectedRevenue = Math.max(0, baseRevenue * capacityFactor - monthlyCost);
    } else if (type === 'Discount') {
      const discountRate = Math.min(100, Math.max(0, p2)); const sensitivity = Math.max(0, Math.min(10, p1));
      assumptions = { discountRate, sensitivity }; projectedRevenue = baseRevenue * (1 + (discountRate / 100) * sensitivity);
    } else return res.status(400).json({ error: 'Unsupported decision model type.' });

    projectedRevenue = Number(projectedRevenue.toFixed(2));
    const revenueDelta = Number((projectedRevenue - baseRevenue).toFixed(2));
    const revenueDeltaPct = baseRevenue > 0 ? Number(((revenueDelta / baseRevenue) * 100).toFixed(2)) : null;
    const verifiedGrossProfit = core?.grossProfit == null ? null : Number(core.grossProfit);
    const projectedProfit = verifiedGrossProfit == null ? 0 : Number((verifiedGrossProfit * (baseRevenue > 0 ? projectedRevenue / baseRevenue : 0)).toFixed(2));

    const configuredRisk = Number(model.configuration?.risk_weight ?? 5);
    const modelRisk = Math.min(10, Math.max(1, Number.isFinite(configuredRisk) ? configuredRisk : 5));
    const parameterRisk = (type === 'Pricing' && (p2 > 30 || p1 < 0.8 || p1 > 1.5)) || ((type === 'Warehouse' || type === 'Inventory') && p2 > Math.max(1, baseRevenue * 0.1)) || (type === 'Discount' && p2 > 25);
    const risk = deriveOperationalRisk(core, modelRisk, parameterRisk);

    const forecast = await buildExecutiveForecast(supabase);
    const decisionSignal = baseRevenue <= 0 ? 'insufficient_baseline' : revenueDeltaPct === null ? 'insufficient_evidence' : revenueDeltaPct >= 10 && verifiedGrossProfit !== null && risk.score < 8 ? 'favorable_with_verified_profit' : revenueDeltaPct >= 0 && risk.score < 8 ? 'favorable_revenue_signal_profit_unverified' : revenueDeltaPct < 0 ? 'unfavorable_revenue_signal' : 'review_required';
    const recommendation = decisionSignal === 'favorable_with_verified_profit'
      ? { action: 'Proceed to controlled review', rationale: 'Scenario revenue signal is favorable, verified gross profit is available, and current operational risk is below the review threshold.', confidence: 'deterministic_signal_only' }
      : decisionSignal === 'favorable_revenue_signal_profit_unverified'
        ? { action: 'Review revenue upside; do not approve on profit grounds', rationale: 'Projected revenue is non-negative relative to the live baseline, but authoritative profit evidence is unavailable.', confidence: 'deterministic_signal_only' }
        : decisionSignal === 'unfavorable_revenue_signal'
          ? { action: 'Do not proceed without further analysis', rationale: 'The scenario produces a negative revenue variance against the live baseline.', confidence: 'deterministic_signal_only' }
          : { action: 'Hold for additional evidence', rationale: 'Current financial or operational evidence does not support an executive approval.', confidence: 'deterministic_signal_only' };

    const generatedAt = new Date().toISOString();
    const scenarioData = {
      scenario_name: scenario_name.trim(), parameters: { param1: p1, param2: p2 }, assumptions,
      baseline: { revenue: baseRevenue, windowDays: 30, periodStart: start.toISOString(), periodEnd: end.toISOString(), source: 'zoal_executive_financial_core_stats' },
      financialBaseline: { cogs: core?.cogs ?? null, grossProfit: core?.grossProfit ?? null, grossMargin: core?.grossMargin ?? null, cogsStatus: core?.cogsStatus || 'unavailable', profitStatus: core?.profitStatus || 'unavailable', costCoverage: { itemCount: Number(core?.itemCount || 0), costedItemCount: Number(core?.costedItemCount || 0) } },
      variance: { revenueDelta, revenueDeltaPct },
      resultStatus: { revenue: 'authoritative_scenario', profit: verifiedGrossProfit == null ? 'unavailable' : 'derived_from_verified_gross_profit' },
      risk,
      decision: { signal: decisionSignal, recommendationStatus: 'deterministic_scenario_signal_only', forecast: forecast.status === 'verified' },
      recommendation,
      forecast: { status: forecast.status, modelVersion: forecast.model_version, method: forecast.forecast_method, dataCutoff: forecast.data_cutoff, generatedAt: forecast.generated_at, accuracy: forecast.accuracy, horizons: forecast.forecasts, financialProfitForecast: forecast.financial },
      data_lineage: { baseline: 'zoal_executive_financial_core_stats', actuals: 'paid_non_cancelled_non_refunded_orders_and_order_time_unit_cost', cogs: core?.cogsStatus || 'unavailable', profit: core?.profitStatus || 'unavailable', operationalRisk: 'lowStockCount+refundRatePct+model_configuration+parameter_bounds', forecast: 'server_forecasting.buildExecutiveForecast -> zoal_orders -> baseline-wma-v1', generated_at: generatedAt },
      model_type: type, generated_at: generatedAt
    };

    const { data: inserted, error: insertError } = await supabase.from('zoal_simulation_runs').insert({ model_id, revenue_projection: projectedRevenue, profit_projection: projectedProfit, risk_score: risk.score, scenario_data: scenarioData, captured_at: generatedAt }).select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at').single();
    if (insertError) throw insertError;

    try {
      if (req.user?.id) await logActivityAsync(req.user.id, req.user.email || null, `[Decision Center] Scenario executed: ${scenario_name.trim()} (${type}) — signal=${decisionSignal}, risk=${risk.score}, profit=${scenarioData.resultStatus.profit}, forecast=${forecast.status}`, req.ip || '', req.headers['user-agent'] || '');
    } catch (auditError) { console.error('Decision simulation audit logging error:', auditError); }

    return res.status(201).json({ id: inserted.id, model_id: inserted.model_id, scenario_name: inserted.scenario_data?.scenario_name, revenue_projection: Number(inserted.revenue_projection || 0), profit_projection: Number(inserted.profit_projection || 0), risk_score: Number(inserted.risk_score || 0), parameters: inserted.scenario_data?.parameters || {}, captured_at: inserted.captured_at, profitStatus: inserted.scenario_data?.resultStatus?.profit, decisionSignal: inserted.scenario_data?.decision?.signal, riskBasis: inserted.scenario_data?.risk?.basis, baselineRevenue: baseRevenue, recommendation: inserted.scenario_data?.recommendation || null, forecast: inserted.scenario_data?.forecast || null });
  } catch (err: any) { console.error('Decision simulation execution error:', err); return res.status(500).json({ error: 'Failed to execute authoritative scenario simulation.' }); }
}

export async function createDecisionModel(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient(); if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try { const { name, type, configuration } = req.body || {}; if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name is required.' }); const allowed = ['Pricing','Warehouse','Discount','Inventory']; if (!allowed.includes(type)) return res.status(400).json({ error: 'Unsupported model type.' }); const safeRisk = Number(configuration?.risk_weight ?? 5); if (!Number.isFinite(safeRisk)) return res.status(400).json({ error: 'risk_weight must be a finite number.' }); const safeConfig = { description: String(configuration?.description || '').slice(0, 2000), risk_weight: Math.min(10, Math.max(1, safeRisk)), variables: configuration?.variables && typeof configuration.variables === 'object' ? configuration.variables : {} }; const { data, error } = await supabase.from('zoal_decision_models').insert({ name: name.trim(), type, configuration: safeConfig }).select('id,name,type,configuration,created_at').single(); if (error) throw error; return res.status(201).json(mapModel(data)); } catch (err:any) { console.error('Decision model create error:',err); return res.status(500).json({ error:'Failed to create decision model.' }); }
}

export async function updateDecisionModel(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient(); if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try { const { name, type, configuration } = req.body || {}; const patch:any = {}; if (typeof name === 'string' && name.trim()) patch.name = name.trim(); if (type) { if (!['Pricing','Warehouse','Discount','Inventory'].includes(type)) return res.status(400).json({ error:'Unsupported model type.' }); patch.type = type; } if (configuration && typeof configuration === 'object') { const safeRisk = Number(configuration.risk_weight ?? 5); if (!Number.isFinite(safeRisk)) return res.status(400).json({ error:'risk_weight must be a finite number.' }); patch.configuration = { description:String(configuration.description||'').slice(0,2000), risk_weight:Math.min(10,Math.max(1,safeRisk)), variables:configuration.variables&&typeof configuration.variables==='object'?configuration.variables:{} }; } const { data,error}=await supabase.from('zoal_decision_models').update(patch).eq('id',req.params.id).select('id,name,type,configuration,created_at').single(); if(error) throw error; return res.json(mapModel(data)); } catch(err:any){ console.error('Decision model update error:',err); return res.status(500).json({error:'Failed to update decision model.'}); }
}

export async function deleteDecisionModel(req: Request,res:Response){ const supabase=getServiceSupabaseClient(); if(!supabase)return res.status(500).json({error:'Supabase service client not initialized.'}); try{ const {count,error:countError}=await supabase.from('zoal_simulation_runs').select('id',{count:'exact',head:true}).eq('model_id',req.params.id); if(countError)throw countError; if((count||0)>0)return res.status(409).json({error:'Cannot delete a model with existing simulation history.'}); const {error}=await supabase.from('zoal_decision_models').delete().eq('id',req.params.id); if(error)throw error; return res.json({success:true}); }catch(err:any){console.error('Decision model delete error:',err);return res.status(500).json({error:'Failed to delete decision model.'});}}

export async function deleteSimulationRun(req: Request,res: Response){ const supabase=getServiceSupabaseClient(); if(!supabase)return res.status(500).json({error:'Supabase service client not initialized.'}); try{const {error}=await supabase.from('zoal_simulation_runs').delete().eq('id',req.params.id);if(error)throw error;return res.json({success:true});}catch(err:any){console.error('Simulation run deletion error:',err);return res.status(500).json({error:'Failed to delete simulation run.'});}}
