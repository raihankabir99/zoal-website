import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getAiWorkspaceData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: prompts, error: promptsError } = await supabase.from('zoal_ai_prompts').select('*');
  const { data: usage, error: usageError } = await supabase.from('zoal_ai_usage').select('*');
  const { data: templates, error: templatesError } = await supabase.from('zoal_ai_templates').select('*');
  const { data: history, error: historyError } = await supabase.from('zoal_ai_history').select('*');
  
  if (promptsError || usageError || templatesError || historyError) {
    return res.status(500).json({ error: 'Failed to fetch AI workspace data.' });
  }

  res.json({ prompts, usage, templates, history });
}

export async function logAiAction(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { user_id, action_type, meta_data } = req.body;
  const { data, error } = await supabase.from('zoal_ai_history').insert({
    user_id, action_type, meta_data
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
