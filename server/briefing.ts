import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getAiBriefings(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_ai_briefings').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
