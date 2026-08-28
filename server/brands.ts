import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getBrands(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.json([]);
  const { data, error } = await supabase.from('zoal_brands').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function getBrandById(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(404).json({ error: 'Brand not found' });
  const { data, error } = await supabase.from('zoal_brands').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Brand not found' });
  res.json(data);
}

export async function createBrand(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });
  const { data, error } = await supabase.from('zoal_brands').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function updateBrand(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });
  const { data, error } = await supabase.from('zoal_brands').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function deleteBrand(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });
  const { error } = await supabase.from('zoal_brands').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, id: req.params.id });
}
