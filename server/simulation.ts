import { getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const DEFAULT_MODELS = [
  {
    name: 'Pricing Scenario',
    type: 'Pricing',
    configuration: {
      description: 'Scenario analysis using live transactional revenue as the baseline. Results are planning scenarios, not forecasts.',
      variables: { multiplier: 1.0, discountRate: 0 }
    }
  },
  {
    name: 'Warehouse Scenario',
    type: 'Warehouse',
    configuration: {
      description: 'Scenario analysis for warehouse capacity and operating cost inputs using live transactional revenue as the baseline.',
      variables: { capacity: 1000, monthlyRent: 0 }
    }
  },
  {
    name: 'Discount Scenario',
    type: 'Discount',
    configuration: {
      description: 'Scenario analysis for discount changes using live transactional revenue as the baseline.',
      variables: { discountRate: 0, sensitivity: 1.0 }
    }
  },
  {
    name: 'Inventory Scenario',
    type: 'Inventory',
    configuration: {
      description: 'Scenario analysis for inventory assumptions using live transactional revenue as the baseline.',
      variables: { capacity: 1000, monthlyCost: 0 }
    }
  }
] as const;

function mapModel(row: any) {
  const configuration = row?.configuration || {};
  return {
    id: row.id,
    name: row.name,
    description: configuration.description || `Authoritative ${row.type || 'decision'} scenario model.`,
    variables: configuration.variables || {},
    risk_weight: Number(configuration.risk_weight ?? 5),
    type: row.type
  };
}

export async function getDecisionModels(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const { data, error } = await supabase
      .from('zoal_decision_models')
      .select('id,name,type,configuration,created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Keep the existing UI usable on a fresh installation without inventing metrics.
    // Templates contain only scenario metadata; all numerical baselines come from live data at run time.
    if (!data || data.length === 0) {
      const { data: seeded, error: seedError } = await supabase
        .from('zoal_decision_models')
        .insert(DEFAULT_MODELS.map(model => ({
          name: model.name,
          type: model.type,
          configuration: model.configuration
        })))
        .select('id,name,type,configuration,created_at');

      if (seedError) throw seedError;
      return res.json((seeded || []).map(mapModel));
    }

    return res.json(data.map(mapModel));
  } catch (err: any) {
    console.error('Decision model registry error:', err);
    return res.status(500).json({ error: 'Failed to load decision model registry.' });
  }
}

export async function getSimulationRuns(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const { data, error } = await supabase
      .from('zoal_simulation_runs')
      .select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at')
      .order('captured_at', { ascending: false })
      .limit(200);

    if (error) throw error;

    return res.json((data || []).map((row: any) => ({
      id: row.id,
      model_id: row.model_id,
      scenario_name: row.scenario_data?.scenario_name || 'Unnamed Scenario',
      revenue_projection: Number(row.revenue_projection || 0),
      profit_projection: Number(row.profit_projection || 0),
      risk_score: Number(row.risk_score || 0),
      parameters: row.scenario_data?.parameters || {},
      captured_at: row.captured_at
    })));
  } catch (err: any) {
    console.error('Simulation run registry error:', err);
    return res.status(500).json({ error: 'Failed to load simulation runs.' });
  }
}

export async function createSimulationRun(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const { model_id, scenario_name, parameters } = req.body || {};
    if (!model_id || typeof model_id !== 'string') {
      return res.status(400).json({ error: 'model_id is required.' });
    }
    if (!scenario_name || typeof scenario_name !== 'string' || scenario_name.trim().length < 2) {
      return res.status(400).json({ error: 'scenario_name is required.' });
    }

    const { data: model, error: modelError } = await supabase
      .from('zoal_decision_models')
      .select('id,name,type,configuration')
      .eq('id', model_id)
      .single();

    if (modelError || !model) return res.status(404).json({ error: 'Decision model not found.' });

    // Authoritative baseline: live transactional revenue from the existing KPI aggregation RPC.
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);

    const { data: core, error: coreError } = await supabase.rpc('zoal_business_insights_core_stats', {
      p_start: start.toISOString(),
      p_end: end.toISOString()
    });

    if (coreError) throw coreError;

    const baseRevenue = Number(core?.totalRevenue || 0);
    const p1 = Number(parameters?.param1 ?? 1);
    const p2 = Number(parameters?.param2 ?? 0);
    if (!Number.isFinite(p1) || !Number.isFinite(p2)) {
      return res.status(400).json({ error: 'Simulation parameters must be finite numbers.' });
    }

    let projectedRevenue = baseRevenue;
    const type = model.type;

    if (type === 'Pricing') {
      const multiplier = Math.max(0, p1);
      const discountRate = Math.min(100, Math.max(0, p2));
      projectedRevenue = baseRevenue * multiplier * (1 - discountRate / 100);
    } else if (type === 'Warehouse' || type === 'Inventory') {
      const capacity = Math.max(0, p1);
      const monthlyCost = Math.max(0, p2);
      const capacityFactor = Math.min(1.5, 1 + capacity / 10000);
      projectedRevenue = Math.max(0, baseRevenue * capacityFactor - monthlyCost);
    } else if (type === 'Discount') {
      const discountRate = Math.min(100, Math.max(0, p2));
      const sensitivity = Math.max(0, p1);
      projectedRevenue = baseRevenue * (1 + (discountRate / 100) * sensitivity);
    }

    projectedRevenue = Number(projectedRevenue.toFixed(2));

    // Profit is deliberately unavailable unless the authoritative KPI RPC provides verified COGS/margin.
    // The legacy table requires a numeric column, so 0 is stored with explicit status in scenario_data.
    const verifiedGrossProfit = core?.grossProfit == null ? null : Number(core.grossProfit);
    const projectedProfit = verifiedGrossProfit == null
      ? 0
      : Number((verifiedGrossProfit * (baseRevenue > 0 ? projectedRevenue / baseRevenue : 0)).toFixed(2));

    const configuredRisk = Number(model.configuration?.risk_weight ?? 5);
    const riskScore = Math.min(10, Math.max(1, Number.isFinite(configuredRisk) ? configuredRisk : 5));

    const scenarioData = {
      scenario_name: scenario_name.trim(),
      parameters: { param1: p1, param2: p2 },
      baseline: {
        revenue: baseRevenue,
        windowDays: 30,
        source: 'zoal_business_insights_core_stats'
      },
      resultStatus: {
        revenue: 'authoritative_scenario',
        profit: verifiedGrossProfit == null ? 'unavailable' : 'derived_from_verified_gross_profit'
      },
      model_type: type,
      generated_at: new Date().toISOString()
    };

    const { data: inserted, error: insertError } = await supabase
      .from('zoal_simulation_runs')
      .insert({
        model_id,
        revenue_projection: projectedRevenue,
        profit_projection: projectedProfit,
        risk_score: Math.round(riskScore),
        scenario_data: scenarioData,
        captured_at: new Date().toISOString()
      })
      .select('id,model_id,revenue_projection,profit_projection,risk_score,scenario_data,captured_at')
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      id: inserted.id,
      model_id: inserted.model_id,
      scenario_name: inserted.scenario_data?.scenario_name,
      revenue_projection: Number(inserted.revenue_projection || 0),
      profit_projection: Number(inserted.profit_projection || 0),
      risk_score: Number(inserted.risk_score || 0),
      parameters: inserted.scenario_data?.parameters || {},
      captured_at: inserted.captured_at,
      profitStatus: inserted.scenario_data?.resultStatus?.profit,
      baselineRevenue: baseRevenue
    });
  } catch (err: any) {
    console.error('Decision simulation execution error:', err);
    return res.status(500).json({ error: 'Failed to execute authoritative scenario simulation.' });
  }
}
