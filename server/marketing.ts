import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { logAuditEvent } from './audit';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

const DEFAULT_CAMPAIGNS = [
  { id: 'camp-1', name: 'Ramadan Specialty Coffee Promo', channel: 'Email & SMS', status: 'active', target_audience: 'VIP Customers', conversion_rate: '14.2%', discountPercent: 15, category: 'coffee', created_at: new Date().toISOString() },
  { id: 'camp-2', name: 'Summer Bespoke Thobe Launch', channel: 'Instagram & WhatsApp', status: 'scheduled', target_audience: 'All Registered', conversion_rate: '8.7%', discountPercent: 20, category: 'fashion', created_at: new Date().toISOString() }
];

const DEFAULT_COUPONS = [
  { id: 'c-1', code: 'ZOALGOLD', rate: 15, type: 'percent', expiry: '2026-12-31', limit: 500, usedCount: 84 },
  { id: 'c-2', code: 'SAUDIHERITAGE', rate: 20, type: 'percent', expiry: '2026-08-15', limit: 100, usedCount: 22 }
];

const DEFAULT_SUBSCRIBERS = [
  { id: 'sub-1', email: 'tarig@zoal.sa', name: 'Tarig Al-Sultan', status: 'Subscribed', channel: 'Email', joined_at: '2026-05-10' },
  { id: 'sub-2', email: 'fahed@zoal.sa', name: 'Fahed M. Khartum', status: 'Subscribed', channel: 'SMS', joined_at: '2026-06-01' },
  { id: 'sub-3', email: 'amira@zoal.sa', name: 'Amira Hassan', status: 'Subscribed', channel: 'WhatsApp', joined_at: '2026-06-15' }
];

function mapCampaign(row: any) {
  return {
    id: row.id,
    name: row.name,
    discountPercent: row.discount_percent ?? 10,
    category: row.category || 'coffee',
    status: (row.status || 'active').toLowerCase(),
    target_audience: row.target_audience || 'VIP Customers',
    conversion_rate: row.conversion_rate || '0.0%',
    created_at: row.created_at
  };
}

function mapCoupon(row: any) {
  return {
    id: row.id,
    code: row.code,
    rate: Number(row.discount_value || 0),
    type: row.discount_type === 'percentage' ? 'percent' : 'fixed',
    expiry: row.expiration_date ? row.expiration_date.substring(0, 10) : '2026-12-31',
    limit: row.usage_limit ?? 100,
    usedCount: row.usage_count ?? 0,
    is_active: row.is_active ?? true
  };
}

export async function getMarketingData(req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const supabase = getClient();
  
  if (!supabase) {
    if (isProd) {
      console.error('Critical: Supabase client unavailable in production Marketing API');
      return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    }
    return res.json({ campaigns: DEFAULT_CAMPAIGNS, coupons: DEFAULT_COUPONS, subscribers: DEFAULT_SUBSCRIBERS });
  }

  try {
    const [campaignsRes, couponsRes, subscribersRes] = await Promise.all([
      supabase.from('zoal_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('zoal_coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('zoal_subscribers').select('*').order('subscribed_at', { ascending: false })
    ]);

    const { data: campaigns, error: campaignsError } = campaignsRes;
    const { data: coupons, error: couponsError } = couponsRes;
    const { data: subscribers, error: subscribersError } = subscribersRes;

    if (isProd) {
      if (campaignsError || couponsError || subscribersError || !campaigns || !coupons || !subscribers) {
        console.error('Marketing Database Error (Production):', {
          campErr: campaignsError?.message,
          coupErr: couponsError?.message,
          subErr: subscribersError?.message,
          hasCamp: !!campaigns,
          hasCoup: !!coupons,
          hasSub: !!subscribers
        });
        return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
      }
      return res.json({
        campaigns: campaigns.map(mapCampaign),
        coupons: coupons.map(mapCoupon),
        subscribers: subscribers
      });
    }

    // Development / Local Fallback
    const mappedCampaigns = (campaigns && campaigns.length > 0) ? campaigns.map(mapCampaign) : DEFAULT_CAMPAIGNS;
    const mappedCoupons = (coupons && coupons.length > 0) ? coupons.map(mapCoupon) : DEFAULT_COUPONS;
    const subscribersList = (subscribers && subscribers.length > 0) ? subscribers : DEFAULT_SUBSCRIBERS;

    if (campaignsError || couponsError || subscribersError) {
      console.warn('Non-critical Marketing DB Error (Dev Fallback Active):', 
        campaignsError?.message || couponsError?.message || subscribersError?.message);
    }

    res.json({
      campaigns: mappedCampaigns,
      coupons: mappedCoupons,
      subscribers: subscribersList
    });
  } catch (err: any) {
    console.error('Unexpected Marketing Module Exception:', err.message || err);
    if (isProd) {
      return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    }
    res.json({
      campaigns: DEFAULT_CAMPAIGNS,
      coupons: DEFAULT_COUPONS,
      subscribers: DEFAULT_SUBSCRIBERS
    });
  }
}

export async function getCampaigns(req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const supabase = getClient();
  if (!supabase) {
    if (isProd) return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    return res.status(500).json({ error: 'Supabase client not initialized.' });
  }

  const { data, error } = await supabase
    .from('zoal_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isProd) return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    return res.status(500).json({ error: error.message });
  }
  res.json(data ? data.map(mapCampaign) : []);
}

export async function createCampaign(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { name, discountPercent, category, status, description, target_audience } = req.body;
  if (!name) return res.status(400).json({ error: 'Campaign name is required.' });

  const payload = {
    name,
    discount_percent: discountPercent || 10,
    category: category || 'coffee',
    status: (status || 'active').toLowerCase(),
    description: description || '',
    target_audience: target_audience || 'VIP Customers',
    conversion_rate: '0.0%',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('zoal_campaigns')
    .insert(payload)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  
  logAuditEvent({
    req,
    action: 'CREATE_MARKETING_CAMPAIGN',
    resourceType: 'campaign',
    resourceId: data.id,
    afterState: data,
    source: 'marketing'
  });

  res.status(201).json(mapCampaign(data));
}

export async function updateCampaign(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  const body = req.body;

  const { data: existing } = await supabase
    .from('zoal_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) payload.name = body.name;
  if (body.discountPercent !== undefined) payload.discount_percent = body.discountPercent;
  if (body.category !== undefined) payload.category = body.category;
  if (body.status !== undefined) payload.status = body.status;
  if (body.target_audience !== undefined) payload.target_audience = body.target_audience;

  const { data, error } = await supabase
    .from('zoal_campaigns')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPDATE_MARKETING_CAMPAIGN',
    resourceType: 'campaign',
    resourceId: id,
    beforeState: existing || null,
    afterState: data,
    source: 'marketing'
  });

  res.json(mapCampaign(data));
}

export async function deleteCampaign(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  const { data: existing } = await supabase
    .from('zoal_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('zoal_campaigns')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'DELETE_MARKETING_CAMPAIGN',
    resourceType: 'campaign',
    resourceId: id,
    beforeState: existing || null,
    afterState: null,
    severity: 'WARN',
    source: 'marketing'
  });

  res.json({ success: true, id });
}

export async function getCoupons(req: Request, res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  const supabase = getClient();
  if (!supabase) {
    if (isProd) return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    return res.status(500).json({ error: 'Supabase client not initialized.' });
  }

  const { data, error } = await supabase
    .from('zoal_coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isProd) return res.status(500).json({ error: 'MARKETING_DATABASE_UNAVAILABLE' });
    return res.status(500).json({ error: error.message });
  }
  res.json(data ? data.map(mapCoupon) : []);
}

export async function createCoupon(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { code, rate, type, expiry, limit, minOrderAmount } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required.' });

  const discountType = type === 'fixed' ? 'fixed_amount' : 'percentage';
  const payload = {
    code: code.toUpperCase().trim(),
    discount_type: discountType,
    discount_value: Number(rate || 10),
    min_order_amount: Number(minOrderAmount || 0),
    expiration_date: expiry ? new Date(expiry).toISOString() : null,
    usage_limit: limit ? Number(limit) : 100,
    usage_count: 0,
    is_active: true,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('zoal_coupons')
    .insert(payload)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'CREATE_COUPON',
    resourceType: 'coupon',
    resourceId: data.id,
    afterState: data,
    source: 'marketing'
  });

  res.status(201).json(mapCoupon(data));
}

export async function updateCoupon(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  const body = req.body;

  const { data: existing } = await supabase
    .from('zoal_coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const payload: Record<string, any> = {};
  if (body.code !== undefined) payload.code = body.code.toUpperCase().trim();
  if (body.rate !== undefined) payload.discount_value = Number(body.rate);
  if (body.is_active !== undefined) payload.is_active = body.is_active;
  if (body.expiry !== undefined) payload.expiration_date = body.expiry ? new Date(body.expiry).toISOString() : null;

  const { data, error } = await supabase
    .from('zoal_coupons')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPDATE_COUPON',
    resourceType: 'coupon',
    resourceId: id,
    beforeState: existing || null,
    afterState: data,
    source: 'marketing'
  });

  res.json(mapCoupon(data));
}

export async function deleteCoupon(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { id } = req.params;
  const { data: existing } = await supabase
    .from('zoal_coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('zoal_coupons')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'DELETE_COUPON',
    resourceType: 'coupon',
    resourceId: id,
    beforeState: existing || null,
    afterState: null,
    severity: 'WARN',
    source: 'marketing'
  });

  res.json({ success: true, id });
}

export async function sendEmailCampaign(req: Request, res: Response) {
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { campaign_id, subject, body } = req.body;
  const { data, error } = await supabase.from('zoal_email_campaigns').insert({
    campaign_id, subject, body, status: 'Sent', sent_at: new Date().toISOString()
  }).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}
