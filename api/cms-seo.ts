import express, { Request, Response } from 'express';
import { getServiceSupabaseClient } from '../server/supabase.ts';
import { authenticateRequest, requireRole } from '../backend/security.ts';
import { logAuditEvent } from '../server/audit.ts';

const app = express();
app.use(express.json({ limit: '512kb' }));

const SETTING_KEY = 'seo.global';

app.get('/api/cms-seo', async (_req: Request, res: Response) => {
  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const { data, error } = await supabase
    .from('zoal_cms_settings')
    .select('id,setting_key,setting_value,status,created_at,updated_at')
    .eq('setting_key', SETTING_KEY)
    .eq('status', 'published')
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    setting_key: SETTING_KEY,
    setting_value: data?.setting_value && typeof data.setting_value === 'object' ? data.setting_value : {},
    updated_at: data?.updated_at ?? null
  });
});

app.put('/api/cms-seo', authenticateRequest, requireRole(['staff', 'manager', 'admin', 'owner']), async (req: Request, res: Response) => {
  const value = req.body?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return res.status(400).json({ error: 'SEO setting value must be an object.' });
  }

  const canonical = typeof value.canonical === 'string' ? value.canonical.trim() : '';
  if (canonical && !/^https?:\\/\\//i.test(canonical)) {
    return res.status(400).json({ error: 'Canonical URL must be an absolute http(s) URL.' });
  }

  if (typeof value.jsonLd === 'string' && value.jsonLd.trim()) {
    try { JSON.parse(value.jsonLd); } catch { return res.status(400).json({ error: 'JSON-LD must contain valid JSON.' }); }
  }

  if (JSON.stringify(value).length > 100000) {
    return res.status(413).json({ error: 'SEO settings payload is too large.' });
  }

  const supabase = getServiceSupabaseClient();
  if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized.' });

  const actor = (req as any).user?.id || (req as any).user?.email || null;
  const { data: existing } = await supabase
    .from('zoal_cms_settings')
    .select('*')
    .eq('setting_key', SETTING_KEY)
    .maybeSingle();

  const { data, error } = await supabase
    .from('zoal_cms_settings')
    .upsert({
      setting_key: SETTING_KEY,
      setting_value: value,
      status: 'published',
      created_by: existing?.created_by || actor,
      updated_by: actor,
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' })
    .select('id,setting_key,setting_value,status,created_at,updated_at')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  logAuditEvent({
    req,
    action: 'UPSERT_CMS_GLOBAL_SEO',
    resourceType: 'cms_setting',
    resourceId: String(data.id),
    beforeState: existing || null,
    afterState: data,
    source: 'cms-seo'
  });

  return res.json(data);
});

export default app;
