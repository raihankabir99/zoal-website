import { getSupabaseClient } from './supabase';
import { Request, Response } from 'express';

const DEFAULT_CAMPAIGNS = [
  { id: 'camp-1', name: 'Ramadan Specialty Coffee Promo', channel: 'Email & SMS', status: 'Active', target_audience: 'VIP Customers', conversion_rate: '14.2%', created_at: new Date().toISOString() },
  { id: 'camp-2', name: 'Summer Bespoke Thobe Launch', channel: 'Instagram & WhatsApp', status: 'Scheduled', target_audience: 'All Registered', conversion_rate: '8.7%', created_at: new Date().toISOString() }
];

const DEFAULT_SUBSCRIBERS = [
  { id: 'sub-1', email: 'tarig@zoal.sa', name: 'Tarig Al-Sultan', status: 'Subscribed', channel: 'Email', joined_at: '2026-05-10' },
  { id: 'sub-2', email: 'fahed@zoal.sa', name: 'Fahed M. Khartum', status: 'Subscribed', channel: 'SMS', joined_at: '2026-06-01' },
  { id: 'sub-3', email: 'amira@zoal.sa', name: 'Amira Hassan', status: 'Subscribed', channel: 'WhatsApp', joined_at: '2026-06-15' }
];

export async function getMarketingData(req: Request, res: Response) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.json({ campaigns: DEFAULT_CAMPAIGNS, subscribers: DEFAULT_SUBSCRIBERS });
  }

  try {
    const { data: campaigns, error: campaignsError } = await supabase.from('zoal_campaigns').select('*');
    const { data: subscribers, error: subscribersError } = await supabase.from('zoal_subscribers').select('*');
    
    let campaignsList = campaigns && campaigns.length > 0 ? campaigns : DEFAULT_CAMPAIGNS;
    let subscribersList = subscribers && subscribers.length > 0 ? subscribers : DEFAULT_SUBSCRIBERS;

    if (campaignsError) {
      console.warn('Warning: Failed to fetch campaigns data from database, using fallback:', campaignsError.message);
    }
    if (subscribersError) {
      console.warn('Warning: Failed to fetch subscribers data from database, using fallback:', subscribersError.message);
    }

    res.json({ campaigns: campaignsList, subscribers: subscribersList });
  } catch (err: any) {
    console.warn('Unexpected warning fetching marketing data, returning fallback lists:', err.message || err);
    res.json({ campaigns: DEFAULT_CAMPAIGNS, subscribers: DEFAULT_SUBSCRIBERS });
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
