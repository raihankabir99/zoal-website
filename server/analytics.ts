import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getRegionalAnalytics(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_regional_analytics').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
