import { Request, Response } from 'express';
import { getServiceSupabaseClient } from './supabase';

export async function getRegionalAnalytics(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const start = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const end = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const { data, error } = await supabase.rpc('zoal_business_insights_regional_v2', {
      p_start: start ?? null,
      p_end: end ?? null
    });

    if (error) {
      console.error('Regional Analytics Query Error:', error);
      return res.status(500).json({ error: 'Failed to fetch regional analytics.' });
    }

    const report = (data || []).map((row: any) => ({
      region: row.region,
      revenue: Number(row.revenue || 0),
      orderCount: Number(row.order_count || 0),
      customerCount: Number(row.customer_count || 0),
      shippingCost: Number(row.shipping_cost || 0),
      aov: Number(row.aov || 0),
      growth: row.growth === null || row.growth === undefined ? null : Number(row.growth),
      growthStatus: row.growth_status || 'not_available',
      status: 'Active',
      capturedAt: new Date().toISOString()
    }));

    return res.json(report);
  } catch (err) {
    console.error('Regional Analytics Error:', err);
    return res.status(500).json({ error: 'Internal Server Error during regional analysis.' });
  }
}
