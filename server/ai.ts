import { Request, Response } from 'express';
import { getSupabaseClient, getServiceSupabaseClient } from './supabase';

const AI_ADMIN_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);

async function requireAiAccess(req: Request, res: Response) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const supabase = getSupabaseClient();
  const service = getServiceSupabaseClient();
  if (!supabase || !service) {
    res.status(500).json({ error: 'AI security services are not configured.' });
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const { data: profile, error: profileError } = await service
    .from('zoal_users')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    res.status(500).json({ error: 'Unable to verify AI access.' });
    return null;
  }

  if (!profile?.role || !AI_ADMIN_ROLES.has(profile.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return { user: authData.user, role: profile.role, supabase, service };
}

export async function getAiWorkspaceData(req: Request, res: Response) {
  const access = await requireAiAccess(req, res);
  if (!access) return;

  const { data: prompts, error: promptsError } = await access.service.from('zoal_ai_prompts').select('*');
  const { data: usage, error: usageError } = await access.service.from('zoal_ai_usage').select('*');
  const { data: templates, error: templatesError } = await access.service.from('zoal_ai_templates').select('*');
  const { data: history, error: historyError } = await access.service.from('zoal_ai_history').select('*');

  if (promptsError || usageError || templatesError || historyError) {
    return res.status(500).json({ error: 'Failed to fetch AI workspace data.' });
  }

  return res.json({ prompts, usage, templates, history, provider: { configured: false } });
}

export async function logAiAction(req: Request, res: Response) {
  const access = await requireAiAccess(req, res);
  if (!access) return;

  const actionType = typeof req.body?.action_type === 'string' ? req.body.action_type.trim() : '';
  const metaData = req.body?.meta_data && typeof req.body.meta_data === 'object' ? req.body.meta_data : {};
  if (!actionType) return res.status(400).json({ error: 'action_type is required.' });

  const { data, error } = await access.service.from('zoal_ai_history').insert({
    user_id: access.user.id,
    action_type: actionType,
    meta_data: metaData
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
}

export async function executeAiPrompt(req: Request, res: Response) {
  const access = await requireAiAccess(req, res);
  if (!access) return;

  return res.status(503).json({
    error: 'AI_PROVIDER_NOT_CONFIGURED',
    message: 'No AI provider is configured. No prompt was executed, no usage was recorded, and no synthetic metrics were created.'
  });
}
