import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getTaxData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: rates, error: ratesError } = await supabase.from('zoal_tax_rates').select('*');
  const { data: regions, error: regionsError } = await supabase.from('zoal_tax_regions').select('*');
  
  if (ratesError || regionsError) {
    return res.status(500).json({ error: 'Failed to fetch tax data.' });
  }

  res.json({ rates, regions });
}

export async function updateTaxRate(req: Request, res: Response) {
  const { id } = req.params;
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_tax_rates').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
