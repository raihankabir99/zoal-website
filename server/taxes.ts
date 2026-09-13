import { Request, Response } from 'express';
import { getSupabaseClient, getServiceSupabaseClient } from './supabase';
import { logAuditEvent } from './audit';
import { authenticateRequest } from '../backend/security';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    role?: string;
    email?: string;
    [key: string]: unknown;
  } | null;
};

function getClient() {
  return getServiceSupabaseClient() || getSupabaseClient();
}

function requireTaxAdmin(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    return false;
  }

  const allowed = new Set(['owner', 'admin', 'manager', 'staff']);
  if (!allowed.has(req.user.role || '')) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }

  return true;
}

export async function getTaxData(req: AuthenticatedRequest, res: Response) {
  if (!requireTaxAdmin(req, res)) return;

  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data: rates, error: ratesError } = await supabase
    .from('zoal_tax_rates')
    .select('*')
    .order('start_date', { ascending: false });
  const { data: regions, error: regionsError } = await supabase
    .from('zoal_tax_regions')
    .select('*')
    .order('region_name');

  if (ratesError || regionsError) {
    return res.status(500).json({ error: 'Failed to fetch tax data.' });
  }

  const now = new Date().toISOString();
  const activeRates = (rates || []).filter((rate: any) =>
    rate.is_active === true &&
    rate.start_date <= now &&
    (!rate.end_date || rate.end_date >= now)
  );

  res.json({ rates: rates || [], regions: regions || [], activeRates });
}

export async function updateTaxRate(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!new Set(['owner', 'admin', 'manager']).has(req.user.role || '')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const supabase = getClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const body = req.body || {};
  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.rate_percentage === 'number' && Number.isFinite(body.rate_percentage)) {
    if (body.rate_percentage < 0 || body.rate_percentage > 100) {
      return res.status(400).json({ error: 'rate_percentage must be between 0 and 100.' });
    }
    patch.rate_percentage = body.rate_percentage;
  }
  if (typeof body.tax_type === 'string' && ['VAT', 'Zero Rated', 'Exempt'].includes(body.tax_type)) {
    patch.tax_type = body.tax_type;
  }
  if (typeof body.start_date === 'string' && !Number.isNaN(Date.parse(body.start_date))) patch.start_date = body.start_date;
  if (body.end_date === null || (typeof body.end_date === 'string' && !Number.isNaN(Date.parse(body.end_date)))) patch.end_date = body.end_date;
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No valid tax fields supplied.' });
  }

  const { data: existing, error: existingError } = await supabase
    .from('zoal_tax_rates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ error: existingError.message });
  if (!existing) return res.status(404).json({ error: 'Tax rate not found.' });

  const { data, error } = await supabase
    .from('zoal_tax_rates')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPDATE_TAX_RATE',
    resourceType: 'tax_rate',
    resourceId: id,
    beforeState: existing,
    afterState: data,
    severity: 'WARN',
    source: 'finance'
  });

  res.json(data);
}

export const taxAuthenticationMiddleware = authenticateRequest;
