import { Request, Response } from 'express';
import { getServiceSupabaseClient } from './supabase';

export async function getRegionalAnalytics(req: Request, res: Response) {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase service client not initialized.' });

  try {
    const start = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const end = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const { data, error } = await supabase.rpc('zoal_business_insights_regional', {
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
      status: 'Active',
      growth: null,
      growthStatus: 'not_available_without_comparison_period',
      capturedAt: new Date().toISOString()
    }));

    return res.json(report);
  } catch (err) {
    console.error('Regional Analytics Error:', err);
    return res.status(500).json({ error: 'Internal Server Error during regional analysis.' });
  }
}
