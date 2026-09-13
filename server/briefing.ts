import { getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { getCoreBusinessStats } from './data_aggregator';
import { generateExecutiveBriefingFromContext } from './ai_service';
import { validateAndSanitizeAiBriefing, ExecutiveContext } from './ai_briefing_validator';

export async function getAiBriefings(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try {
    const { data, error } = await supabase.from('zoal_ai_briefings').select('*').order('captured_at', { ascending: false });
    if (error) { console.error('Fetch AI Briefings Error:', error); return res.status(500).json({ error: error.message }); }
    res.json(data || []);
  } catch (err: any) {
    console.error('AI Briefing Error:', err);
    res.status(500).json({ error: 'Failed to retrieve executive briefings.' });
  }
}

export async function generateAiBriefing(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  try {
    const stats = await getCoreBusinessStats();
    const now = new Date().toISOString();
    const context: ExecutiveContext = {
      metadata: { data_period: { range: 'yearly' }, data_as_of: now, generated_at: now, currency: 'SAR' },
      sales: {
        total_revenue: Number(stats.totalRevenue || 0),
        total_orders: Number(stats.totalOrders || 0),
        average_order_value: Number(stats.averageOrderValue || 0)
      },
      customers: { active_customers: Number(stats.activeCustomers || 0) },
      inventory: { low_stock_count: Number(stats.lowStockCount || 0) },
      financials: {
        revenue: { value: Number(stats.totalRevenue || 0), status: 'AVAILABLE' },
        cogs: { status: 'UNAVAILABLE' }, gross_profit: { status: 'UNAVAILABLE' },
        gross_margin: { status: 'UNAVAILABLE' }, expenses: { status: 'UNAVAILABLE' },
        net_profit: { status: 'UNAVAILABLE' }, cash_flow: { status: 'UNAVAILABLE' }
      }
    };

    const rawAiOutput = await generateExecutiveBriefingFromContext(context);
    const validationResult = validateAndSanitizeAiBriefing(rawAiOutput, context);
    if (!validationResult.isValid) return res.status(422).json({ error: 'AI Briefing validation failed.', errors: validationResult.errors });

    const validatedPayload = validationResult.validatedData;
    const { data, error } = await supabase.from('zoal_ai_briefings').insert({
      briefing_type: validatedPayload.briefing_type || 'Daily',
      executive_summary: validatedPayload.executive_summary,
      risks: validatedPayload.risks,
      recommendations: validatedPayload.recommendations,
      revenue_summary: validatedPayload.revenue_summary,
      inventory_summary: validatedPayload.inventory_summary,
      customer_summary: validatedPayload.customer_summary,
      source_type: 'ai_generated',
      generation_context: validatedPayload.generation_context,
      data_period: validatedPayload.data_period,
      data_as_of: validatedPayload.data_as_of,
      generated_at: validatedPayload.generated_at,
      ai_model: validatedPayload.ai_model,
      verification_status: 'verified',
      captured_at: new Date().toISOString()
    }).select().single();
    if (error) { console.error('Persistence Error:', error); return res.status(500).json({ error: error.message }); }
    res.status(201).json(data);
  } catch (err: any) {
    console.error('AI Briefing Generation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate verified AI briefing.' });
  }
}

export async function createManualBriefing(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  const { briefing_type, risks, recommendations, revenue_summary, inventory_summary, customer_summary } = req.body;
  if (!briefing_type) return res.status(400).json({ error: 'briefing_type is required.' });
  const { data, error } = await supabase.from('zoal_ai_briefings').insert({
    briefing_type, risks: risks || '', recommendations: recommendations || '', revenue_summary: revenue_summary || {},
    inventory_summary: inventory_summary || {}, customer_summary: customer_summary || {}, source_type: 'manual',
    verification_status: 'manual', captured_at: new Date().toISOString()
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateManualBriefing(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  const { id } = req.params;
  const { briefing_type, risks, recommendations, revenue_summary, inventory_summary, customer_summary } = req.body;
  if (!id) return res.status(400).json({ error: 'Briefing ID is required.' });
  const { data, error } = await supabase.from('zoal_ai_briefings').update({
    ...(briefing_type && { briefing_type }), ...(risks !== undefined && { risks }),
    ...(recommendations !== undefined && { recommendations }), ...(revenue_summary !== undefined && { revenue_summary }),
    ...(inventory_summary !== undefined && { inventory_summary }), ...(customer_summary !== undefined && { customer_summary })
  }).eq('id', id).eq('source_type', 'manual').select().single();
  if (error) return res.status(error.code === 'PGRST116' ? 409 : 500).json({ error: error.code === 'PGRST116' ? 'Only manual briefings can be edited.' : error.message });
  res.json(data);
}

export async function deleteBriefing(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Briefing ID is required.' });
  const { data, error } = await supabase.from('zoal_ai_briefings').delete().eq('id', id).eq('source_type', 'manual').select('id').single();
  if (error) return res.status(error.code === 'PGRST116' ? 409 : 500).json({ error: error.code === 'PGRST116' ? 'Only manual briefings can be deleted.' : error.message });
  res.json({ success: true, id: data.id });
}
