import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getMarketingData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: campaigns, error: campaignsError } = await supabase.from('zoal_campaigns').select('*');
  const { data: subscribers, error: subscribersError } = await supabase.from('zoal_subscribers').select('*');
  
  if (campaignsError || subscribersError) {
    return res.status(500).json({ error: 'Failed to fetch marketing data.' });
  }

  res.json({ campaigns, subscribers });
}

export async function createCampaign(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase.from('zoal_campaigns').insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function sendEmailCampaign(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { campaign_id, subject, body } = req.body;
  const { data, error } = await supabase.from('zoal_email_campaigns').insert({
    campaign_id, subject, body, status: 'Sent', sent_at: new Date().toISOString()
  }).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
