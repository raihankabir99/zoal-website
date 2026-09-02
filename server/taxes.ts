import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { Request, Response } from 'express';
import { logAuditEvent } from './audit';

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

export async function getTaxData(req: Request, res: Response) {
  const supabase = getClient();
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
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: existing } = await supabase.from('zoal_tax_rates').select('*').eq('id', id).maybeSingle();
  const { data, error } = await supabase.from('zoal_tax_rates').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPDATE_TAX_RATE',
    resourceType: 'tax_rate',
    resourceId: id,
    beforeState: existing || null,
    afterState: data,
    severity: 'WARN',
    source: 'finance'
  });

  res.json(data);
}
