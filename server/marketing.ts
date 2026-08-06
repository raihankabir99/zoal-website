import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

export async function getMarketingData(req: Request, res: Response) {
  console.log('--- Marketing API Request Received ---');
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn('--- Marketing API Warning: Supabase client not initialized, returning fallback arrays ---');
    return res.json({ campaigns: [], subscribers: [] });
  }

  try {
    const { data: campaigns, error: campaignsError } = await supabase.from('zoal_campaigns').select('*');
    const { data: subscribers, error: subscribersError } = await supabase.from('zoal_subscribers').select('*');
    
    let campaignsList = campaigns || [];
    let subscribersList = subscribers || [];

    if (campaignsError) {
      console.warn('Warning: Failed to fetch campaigns data from database, using empty list:', campaignsError.message);
      campaignsList = [];
    }
    if (subscribersError) {
      console.warn('Warning: Failed to fetch subscribers data from database, using empty list:', subscribersError.message);
      subscribersList = [];
    }

    res.json({ campaigns: campaignsList, subscribers: subscribersList });
  } catch (err: any) {
    console.warn('Unexpected warning fetching marketing data, returning empty lists:', err.message || err);
    res.json({ campaigns: [], subscribers: [] });
  }
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
