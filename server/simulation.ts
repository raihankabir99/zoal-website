import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const asFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normaliseModel = (row: any) => {
  const configuration = row?.configuration && typeof row.configuration === 'object' ? row.configuration : {};
  return {
    id: row.id,
    name: row.name,
    description: configuration.description ?? '',
    variables: configuration.variables ?? configuration,
    risk_weight: asFiniteNumber(configuration.risk_weight, 0),
    type: row.type,
    created_at: row.created_at,
  };
};

const normaliseRun = (row: any) => {
  const scenarioData = row?.scenario_data && typeof row.scenario_data === 'object' ? row.scenario_data : {};
  return {
    id: row.id,
    model_id: row.model_id,
    scenario_name: scenarioData.scenario_name ?? 'Unnamed scenario',
    revenue_projection: row.revenue_projection == null ? null : asFiniteNumber(row.revenue_projection),
    profit_projection: row.profit_projection == null ? null : asFiniteNumber(row.profit_projection),
    risk_score: asFiniteNumber(row.risk_score),
    parameters: scenarioData.parameters ?? {},
    baseline: scenarioData.baseline ?? null,
    captured_at: row.captured_at,
  };
};

/**
 * Executive Decision Center — authoritative read path.
 * Financial values are sourced from zoal_orders; no client-provided KPI is trusted.
 */
export async function getDecisionModels(req: Request, res: Response) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

    const { data, error } = await supabase
      .from('zoal_decision_models')
      .select('id,name,type,configuration,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Decision models query failed:', error);
      return res.status(500).json({ error: 'Failed to load decision models.' });
    }

    return res.json((data ?? []).map(normaliseModel));
  } catch (error: any) {
    console.error('Decision models error:', error);
    return res.status(500).json({ error: 'Failed to load decision models.' });
  }
}

/**
 * Executive Decision Center — authoritative simulation history read path.
 */
export async function getSimulationRuns(req: Request, res: Response) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

    const { data, error } = await supabase
      .from('zoal_simulation_runs')
      .select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at')
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Simulation runs query failed:', error);
      return res.status(500).json({ error: 'Failed to load simulation runs.' });
    }

    return res.json((data ?? []).map(normaliseRun));
  } catch (error: any) {
    console.error('Simulation runs error:', error);
    return res.status(500).json({ error: 'Failed to load simulation runs.' });
  }
}

/**
 * Server-authoritative scenario execution.
 * The client may submit assumptions, but never authoritative revenue/profit/risk values.
 *
 * Important: profit remains null until an authoritative item-level COGS source exists.
 * We deliberately refuse to fabricate profit from a margin multiplier.
 */
export async function createSimulationRun(req: Request, res: Response) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return res.status(503).json({ error: 'Database unavailable.' });

    const body = req.body ?? {};
    const modelId = typeof body.model_id === 'string' ? body.model_id : '';
    const scenarioName = typeof body.scenario_name === 'string' ? body.scenario_name.trim() : '';
    const rawParameters = body.parameters && typeof body.parameters === 'object' ? body.parameters : {};

    if (!modelId || !scenarioName) {
      return res.status(400).json({ error: 'model_id and scenario_name are required.' });
    }
    if (scenarioName.length > 200) {
      return res.status(400).json({ error: 'scenario_name is too long.' });
    }

    const { data: model, error: modelError } = await supabase
      .from('zoal_decision_models')
      .select('id,name,type,configuration,created_at')
      .eq('id', modelId)
      .maybeSingle();

    if (modelError) {
      console.error('Decision model lookup failed:', modelError);
      return res.status(500).json({ error: 'Failed to validate decision model.' });
    }
    if (!model) return res.status(404).json({ error: 'Decision model not found.' });

    // Authoritative baseline: only completed/paid-like non-cancelled orders are eligible.
    // The exact business status taxonomy is preserved defensively because existing data
    // uses mixed casing in this codebase.
    const { data: orders, error: ordersError } = await supabase
      .from('zoal_orders')
      .select('total_amount,status,created_at')
      .limit(10000);

    if (ordersError) {
      console.error('Authoritative order aggregation failed:', ordersError);
      return res.status(500).json({ error: 'Failed to load authoritative order data.' });
    }

    const eligibleOrders = (orders ?? []).filter((order: any) => {
      const status = String(order?.status ?? '').toLowerCase();
      return !['cancelled', 'canceled', 'failed', 'refunded'].includes(status);
    });

    const baselineRevenue = eligibleOrders.reduce(
      (sum: number, order: any) => sum + Math.max(0, asFiniteNumber(order?.total_amount)),
      0,
    );

    if (!Number.isFinite(baselineRevenue)) {
      return res.status(500).json({ error: 'Authoritative revenue aggregation is invalid.' });
    }

    const param1 = asFiniteNumber(rawParameters.param1, 1);
    const param2 = asFiniteNumber(rawParameters.param2, 0);
    const configuration = model.configuration && typeof model.configuration === 'object' ? model.configuration : {};
    const modelType = String(model.type ?? '').toLowerCase();

    // Scenario calculations are intentionally limited to transparent assumptions over
    // the authoritative baseline. They are NOT labelled as statistical forecasts.
    let projectedRevenue = baselineRevenue;
    if (modelType === 'pricing') {
      const priceMultiplier = Math.max(0, Math.min(3, param1));
      const discountRate = Math.max(0, Math.min(100, param2));
      projectedRevenue = baselineRevenue * priceMultiplier * (1 - discountRate / 100);
    } else if (modelType === 'warehouse') {
      const capacityDelta = Math.max(-100, Math.min(500, param1));
      projectedRevenue = baselineRevenue * (1 + capacityDelta / 1000);
    } else if (modelType === 'discount') {
      const demandLift = Math.max(-100, Math.min(300, param2));
      const discountRate = Math.max(0, Math.min(100, param1));
      projectedRevenue = baselineRevenue * (1 + demandLift / 100) * (1 - discountRate / 100);
    } else if (modelType === 'inventory') {
      const demandDelta = Math.max(-100, Math.min(300, param1));
      projectedRevenue = baselineRevenue * (1 + demandDelta / 100);
    }

    projectedRevenue = Math.max(0, Number(projectedRevenue.toFixed(2)));

    // No authoritative item-level COGS table/ledger has been proven here.
    // Never manufacture profit from a fixed margin.
    const projectedProfit = null;

    // Risk is an explicit model/template signal only; it is not presented as live risk telemetry.
    const configuredRisk = asFiniteNumber(configuration.risk_weight, 0);
    const riskScore = Math.max(0, Math.min(10, Number(configuredRisk.toFixed(1))));

    const scenarioData = {
      scenario_name: scenarioName,
      parameters: {
        param1,
        param2,
        ...rawParameters,
      },
      baseline: {
        revenue: Number(baselineRevenue.toFixed(2)),
        order_count: eligibleOrders.length,
        source: 'zoal_orders',
        generated_at: new Date().toISOString(),
      },
      methodology: 'authoritative-revenue-baseline-plus-explicit-scenario-assumptions',
      profit_status: 'unavailable_without_authoritative_item_level_cogs',
      risk_status: configuredRisk > 0 ? 'template_signal_only' : 'not_available',
    };

    const { data: inserted, error: insertError } = await supabase
      .from('zoal_simulation_runs')
      .insert({
        model_id: modelId,
        revenue_projection: projectedRevenue,
        profit_projection: projectedProfit,
        risk_score: Math.round(riskScore),
        scenario_data: scenarioData,
        captured_at: new Date().toISOString(),
      })
      .select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at')
      .single();

    if (insertError) {
      console.error('Simulation run persistence failed:', insertError);
      return res.status(500).json({ error: 'Failed to persist simulation run.' });
    }

    return res.status(201).json(normaliseRun(inserted));
  } catch (error: any) {
    console.error('Simulation execution error:', error);
    return res.status(500).json({ error: 'Failed to execute simulation.' });
  }
}
