import crypto from 'crypto';
import type { Request, Response } from 'express';
import pg from 'pg';

const { Client } = pg;

const SUPPORTED_PROVIDERS = new Set(['metricool']);
const PROVIDER_ENDPOINTS: Record<string, string> = {
  metricool: 'https://app.metricool.com'
};

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw Object.assign(new Error('DATABASE_URL is not configured'), { statusCode: 503 });
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

function getMasterKey(): Buffer {
  const raw = process.env.AI_CREDENTIAL_MASTER_KEY || process.env.THIRD_PARTY_CREDENTIAL_MASTER_KEY;
  if (!raw) throw Object.assign(new Error('Third-party credential encryption key is not configured'), { statusCode: 503 });
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw Object.assign(new Error('Third-party credential encryption key must decode to exactly 32 bytes'), { statusCode: 503 });
  return key;
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return { encrypted: encrypted.toString('base64'), iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64') };
}

function decryptSecret(encrypted: string, iv: string, authTag: string) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
}

function requireAdmin(req: Request) {
  const user = (req as any).user;
  if (!user?.id) throw Object.assign(new Error('Authenticated user is required'), { statusCode: 401 });
  const role = String(user.role || '').toLowerCase();
  if (!['owner', 'admin'].includes(role)) throw Object.assign(new Error('Owner or admin access is required'), { statusCode: 403 });
  return user;
}

function normalizeProvider(value: unknown) {
  const provider = String(value || '').trim().toLowerCase();
  if (!SUPPORTED_PROVIDERS.has(provider)) throw Object.assign(new Error('Provider is not supported yet'), { statusCode: 400 });
  return provider;
}

function maskSecret(secret: string) {
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

async function audit(req: Request, action: string, resourceId: string | null, metadata: Record<string, unknown> = {}) {
  const user = (req as any).user;
  if (!user?.id) return;
  const client = getPgClient();
  await client.connect();
  try {
    await client.query(
      `insert into public.zoal_activity_logs
       (id,user_id,email,action,timestamp,ip,user_agent,resource_type,resource_id,metadata,result,severity,source)
       values ($1,$2,$3,$4,now(),$5,$6,'third_party_integration',$7,$8::jsonb,'success','info','admin')`,
      [crypto.randomUUID(), user.id, user.email || null, action, req.ip || '', req.headers['user-agent'] || '', resourceId, JSON.stringify(metadata)]
    );
  } finally {
    await client.end();
  }
}

export async function listThirdPartyIntegrations(req: Request, res: Response) {
  try {
    requireAdmin(req);
    const client = getPgClient();
    await client.connect();
    try {
      const result = await client.query(
        `select id,provider,display_name,category,auth_type,status,last_error,created_at,updated_at,last_verified_at,rotated_at
         from public.zoal_third_party_integrations order by display_name asc`
      );
      return res.json({ ok: true, integrations: result.rows.map((row: any) => ({ ...row, secretConfigured: true })) });
    } finally { await client.end(); }
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || 'Failed to load integrations' });
  }
}

export async function createThirdPartyIntegration(req: Request, res: Response) {
  try {
    const user = requireAdmin(req);
    const provider = normalizeProvider(req.body?.provider);
    const displayName = String(req.body?.displayName || '').trim();
    const secret = String(req.body?.secret || '');
    const category = String(req.body?.category || 'Other').trim().slice(0, 80) || 'Other';
    if (!displayName || displayName.length > 120) return res.status(400).json({ ok: false, error: 'A valid display name is required' });
    if (secret.length < 8 || secret.length > 4096) return res.status(400).json({ ok: false, error: 'Credential length is invalid' });
    const encrypted = encryptSecret(secret);
    const client = getPgClient();
    await client.connect();
    try {
      const result = await client.query(
        `insert into public.zoal_third_party_integrations
         (provider,display_name,category,endpoint,auth_type,credential_name,encrypted_secret,iv,auth_tag,status,created_by,updated_by,rotated_at)
         values ($1,$2,$3,$4,'api_key','primary',$5,$6,$7,'inactive',$8,$8,now())
         returning id,provider,display_name,category,auth_type,status,created_at,updated_at,last_verified_at,rotated_at`,
        [provider, displayName, category, PROVIDER_ENDPOINTS[provider], encrypted.encrypted, encrypted.iv, encrypted.authTag, String(user.id)]
      );
      const row = result.rows[0];
      await audit(req, 'THIRD_PARTY_INTEGRATION_CREATE', row.id, { provider });
      return res.status(201).json({ ok: true, integration: { ...row, secretConfigured: true, secretMasked: maskSecret(secret) } });
    } finally { await client.end(); }
  } catch (error: any) {
    const status = error?.code === '23505' ? 409 : (error?.statusCode || 500);
    return res.status(status).json({ ok: false, error: error?.code === '23505' ? 'This provider credential already exists' : error?.message || 'Failed to save integration' });
  }
}

export async function updateThirdPartyIntegration(req: Request, res: Response) {
  try {
    const user = requireAdmin(req);
    const id = String(req.params.id || '').trim();
    const displayName = req.body?.displayName === undefined ? undefined : String(req.body.displayName).trim();
    const category = req.body?.category === undefined ? undefined : String(req.body.category).trim().slice(0, 80);
    const status = req.body?.status === undefined ? undefined : String(req.body.status).toLowerCase();
    const secret = req.body?.secret === undefined ? undefined : String(req.body.secret);
    if (!id) return res.status(400).json({ ok: false, error: 'Integration id is required' });
    if (status !== undefined && !['inactive','error'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Active status can only be granted after a successful live provider API verification' });
    }
    if (secret !== undefined && (secret.length < 8 || secret.length > 4096)) return res.status(400).json({ ok: false, error: 'Credential length is invalid' });
    const sets: string[] = ['updated_by = $2'];
    const values: any[] = [id, String(user.id)];
    if (displayName !== undefined) { sets.push(`display_name = $${values.length + 1}`); values.push(displayName); }
    if (category !== undefined) { sets.push(`category = $${values.length + 1}`); values.push(category || 'Other'); }
    if (status !== undefined) { sets.push(`status = $${values.length + 1}`); values.push(status); }
    if (secret !== undefined) {
      const encrypted = encryptSecret(secret);
      sets.push(`encrypted_secret = $${values.length + 1}`, `iv = $${values.length + 2}`, `auth_tag = $${values.length + 3}`, `rotated_at = now()`, `last_verified_at = null`, `last_error = null`);
      values.push(encrypted.encrypted, encrypted.iv, encrypted.authTag);
      if (status === undefined) {
        sets.push(`status = $${values.length + 1}`);
        values.push('inactive');
      }
    }
    values.push(id);
    const client = getPgClient();
    await client.connect();
    try {
      const result = await client.query(`update public.zoal_third_party_integrations set ${sets.join(', ')} where id = $${values.length} returning id,provider,display_name,category,auth_type,status,created_at,updated_at,last_verified_at,rotated_at`, values);
      if (!result.rows[0]) return res.status(404).json({ ok: false, error: 'Integration not found' });
      await audit(req, 'THIRD_PARTY_INTEGRATION_UPDATE', id, { credentialRotated: secret !== undefined, statusChanged: status !== undefined, forcedInactiveAfterRotation: secret !== undefined && status === undefined });
      return res.json({ ok: true, integration: { ...result.rows[0], secretConfigured: true } });
    } finally { await client.end(); }
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || 'Failed to update integration' });
  }
}

export async function deleteThirdPartyIntegration(req: Request, res: Response) {
  try {
    requireAdmin(req);
    const id = String(req.params.id || '').trim();
    const client = getPgClient();
    await client.connect();
    try {
      const result = await client.query(`delete from public.zoal_third_party_integrations where id = $1 returning id,provider`, [id]);
      if (!result.rows[0]) return res.status(404).json({ ok: false, error: 'Integration not found' });
      await audit(req, 'THIRD_PARTY_INTEGRATION_DELETE', id, { provider: result.rows[0].provider });
      return res.json({ ok: true });
    } finally { await client.end(); }
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || 'Failed to delete integration' });
  }
}

export async function testThirdPartyIntegration(req: Request, res: Response) {
  try {
    requireAdmin(req);
    const id = String(req.params.id || '').trim();
    const client = getPgClient();
    await client.connect();
    try {
      const result = await client.query(`select id,provider,encrypted_secret,iv,auth_tag,status from public.zoal_third_party_integrations where id = $1`, [id]);
      const row = result.rows[0];
      if (!row) return res.status(404).json({ ok: false, error: 'Integration not found' });
      if (row.provider !== 'metricool') return res.status(400).json({ ok: false, error: 'No provider adapter is available for this integration yet' });
      decryptSecret(row.encrypted_secret, row.iv, row.auth_tag);
      if (row.status === 'active') {
        await client.query(`update public.zoal_third_party_integrations set status = 'inactive', last_error = 'Provider API adapter has not completed a live connectivity test' where id = $1`, [id]);
      }
      await audit(req, 'THIRD_PARTY_INTEGRATION_CREDENTIAL_CHECK', id, { provider: row.provider, adapter: 'credential-integrity', apiCalled: false });
      return res.json({
        ok: true,
        verified: false,
        mode: 'credential-integrity',
        active: false,
        message: 'Credential encryption integrity verified. No provider API call was made, so this integration remains inactive.'
      });
    } finally { await client.end(); }
  } catch (error: any) {
    return res.status(error?.statusCode || 500).json({ ok: false, verified: false, active: false, error: error?.message || 'Integration test failed' });
  }
}
