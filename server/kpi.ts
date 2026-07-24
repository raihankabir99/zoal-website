import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getKpiData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: snapshots, error: snapshotsError } = await supabase.from('zoal_kpi_snapshots').select('*');
  const { data: targets, error: targetsError } = await supabase.from('zoal_kpi_targets').select('*');
  
  if (snapshotsError || targetsError) {
    return res.status(500).json({ error: 'Failed to fetch KPI data.' });
  }

  res.json({ snapshots, targets });
}

export async function setKpiTarget(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_kpi_targets').upsert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
