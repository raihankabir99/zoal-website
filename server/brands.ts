import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { logAuditEvent } from './audit';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

export async function getBrands(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.json([]);
  const { data, error } = await supabase.from('zoal_brands').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
}

export async function getBrandById(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(404).json({ error: 'Brand not found' });
  const { data, error } = await supabase.from('zoal_brands').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Brand not found' });
  res.json(data);
}

export async function createBrand(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });
  const { data, error } = await supabase.from('zoal_brands').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'CREATE_BRAND',
    resourceType: 'brand',
    resourceId: data.id,
    afterState: data,
    source: 'taxonomy'
  });

  res.status(201).json(data);
}

export async function updateBrand(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: existing } = await supabase.from('zoal_brands').select('*').eq('id', req.params.id).maybeSingle();
  const { data, error } = await supabase.from('zoal_brands').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPDATE_BRAND',
    resourceType: 'brand',
    resourceId: req.params.id,
    beforeState: existing || null,
    afterState: data,
    source: 'taxonomy'
  });

  res.json(data);
}

export async function deleteBrand(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: existing } = await supabase.from('zoal_brands').select('*').eq('id', req.params.id).maybeSingle();
  const { error } = await supabase.from('zoal_brands').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'DELETE_BRAND',
    resourceType: 'brand',
    resourceId: req.params.id,
    beforeState: existing || null,
    afterState: null,
    severity: 'WARN',
    source: 'taxonomy'
  });

  res.json({ success: true, id: req.params.id });
}
