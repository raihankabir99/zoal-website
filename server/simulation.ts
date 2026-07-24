import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getDecisionModels(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_decision_models').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function getSimulationRuns(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_simulation_runs').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function createSimulationRun(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_simulation_runs').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
