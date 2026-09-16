import crypto from 'crypto';
import pg from 'pg';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

const { Client } = pg;

type AIProviderName = 'gemini' | 'openai' | 'groq';
interface AIRequest { provider: AIProviderName; model?: string; prompt: string; maxOutputTokens?: number; }
interface AIResult { provider: AIProviderName; text: string; }

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_PROMPT_CHARS = Number(process.env.AI_MAX_PROMPT_CHARS || 12000);
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048);
const MAX_CONCURRENT_PER_USER = Number(process.env.AI_MAX_CONCURRENT_PER_USER || 2);
const CONCURRENCY_LEASE_TTL_MS = Number(process.env.AI_CONCURRENCY_LEASE_TTL_MS || 120000);
const PROVIDER_TIMEOUT_MS = Number(process.env.AI_PROVIDER_TIMEOUT_MS || 90000);
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX || 20);
const AI_RATE_LIMIT_WINDOW_SECONDS = Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS || 900);

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

function getUserId(req: Request): string {
  const id = (req as any).user?.id;
  if (!id) throw Object.assign(new Error('Authenticated user is required'), { statusCode: 401 });
  const strId = String(id).trim();
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (UUID_REGEX.test(strId)) return strId;
  const hash = crypto.createHash('sha256').update(strId).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

async function enforceAIRateLimit(userId: string, reqCount = 1): Promise<{ remaining: number; resetAt: number }> {
  let client: pg.Client | null = null;
  try {
    client = getPgClient();
    await client.connect();
    const result = await client.query(
      `INSERT INTO public.zoal_ai_rate_limits (user_id, window_start, request_count)
       VALUES ($1, to_timestamp(floor(extract(epoch from now()) / $2) * $2), $3)
       ON CONFLICT (user_id, window_start)
       DO UPDATE SET request_count = public.zoal_ai_rate_limits.request_count + EXCLUDED.request_count
       RETURNING request_count, extract(epoch from window_start) + $2 AS reset_epoch`,
      [userId, AI_RATE_LIMIT_WINDOW_SECONDS, reqCount]
    );
    const count = Number(result.rows[0]?.request_count || 0);
    const resetAt = Number(result.rows[0]?.reset_epoch || 0);
    if (count > AI_RATE_LIMIT_MAX) throw Object.assign(new Error(`AI rate limit exceeded (${AI_RATE_LIMIT_MAX} requests per ${Math.round(AI_RATE_LIMIT_WINDOW_SECONDS / 60)} minutes)`), { statusCode: 429 });
    return { remaining: Math.max(0, AI_RATE_LIMIT_MAX - count), resetAt };
  } catch (err: any) {
    if (err?.statusCode === 429) throw err;
    throw Object.assign(new Error('AI rate-limit service is temporarily unavailable'), { statusCode: 503, code: 'AI_RATE_LIMIT_UNAVAILABLE' });
  } finally { await client?.end().catch(() => undefined); }
}

function getMasterKey(): Buffer {
  const raw = process.env.AI_CREDENTIAL_MASTER_KEY;
  if (!raw) throw new Error('AI_CREDENTIAL_MASTER_KEY is not configured');
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('AI_CREDENTIAL_MASTER_KEY must decode to exactly 32 bytes');
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

async function loadThirdPartyAIProvider(requested?: AIProviderName): Promise<{ provider: AIProviderName; apiKey: string } | null> {
  const client = getPgClient();
  await client.connect();
  try {
    const params: any[] = [];
    let where = `provider IN ('openai','groq','gemini') AND status = 'active'`;
    if (requested && requested !== 'gemini') { where = `provider = $1 AND status = 'active'`; params.push(requested); }
    const result = await client.query(
      `SELECT provider, encrypted_secret, iv, auth_tag
       FROM public.zoal_third_party_integrations
       WHERE ${where}
       ORDER BY COALESCE(last_verified_at, updated_at) DESC LIMIT 1`,
      params
    );
    const row = result.rows[0];
    if (!row) return null;
    return { provider: row.provider as AIProviderName, apiKey: decryptSecret(row.encrypted_secret, row.iv, row.auth_tag) };
  } finally { await client.end(); }
}

async function loadGeminiApiKey() {
  const client = getPgClient();
  await client.connect();
  try {
    const result = await client.query(`SELECT status, encrypted_secret, iv, auth_tag FROM public.zoal_ai_provider_credentials WHERE provider = 'gemini' AND credential_name = 'primary' LIMIT 1`);
    const row = result.rows[0];
    if (row) {
      if (row.status !== 'active') throw new Error('AI provider is disabled');
      return decryptSecret(row.encrypted_secret, row.iv, row.auth_tag);
    }
  } finally { await client.end(); }
  const envKey = process.env.GEMINI_API_KEY;
  if (!envKey) throw new Error('Gemini provider is not configured');
  return envKey;
}

function defaultModel(provider: AIProviderName) {
  if (provider === 'openai') return process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  if (provider === 'groq') return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  return DEFAULT_MODEL;
}

function validateAIRequest(input: AIRequest): Required<AIRequest> {
  if (!['gemini', 'openai', 'groq'].includes(input.provider)) throw new Error('Unsupported AI provider');
  if (typeof input.prompt !== 'string' || !input.prompt.trim()) throw new Error('Prompt is required');
  if (input.prompt.length > MAX_PROMPT_CHARS) throw new Error('Prompt exceeds configured size limit');
  const maxOutputTokens = input.maxOutputTokens ?? MAX_OUTPUT_TOKENS;
  if (!Number.isInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > MAX_OUTPUT_TOKENS) throw new Error('Invalid maxOutputTokens');
  return { provider: input.provider, model: input.model || defaultModel(input.provider), prompt: input.prompt, maxOutputTokens };
}

async function acquireLease(userId: string, requestId: string, provider: AIProviderName) {
  const client = getPgClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`ai-concurrency:${userId}`]);
    await client.query(`DELETE FROM public.zoal_ai_concurrency_leases WHERE expires_at <= now()`);
    const count = await client.query(`SELECT count(*)::int AS count FROM public.zoal_ai_concurrency_leases WHERE user_id = $1 AND expires_at > now()`, [userId]);
    if (count.rows[0].count >= MAX_CONCURRENT_PER_USER) { await client.query('ROLLBACK'); return false; }
    await client.query(`INSERT INTO public.zoal_ai_concurrency_leases (user_id, provider, request_id, acquired_at, expires_at) VALUES ($1, $2, $3, now(), now() + ($4 * interval '1 millisecond'))`, [userId, provider, requestId, CONCURRENCY_LEASE_TTL_MS]);
    await client.query('COMMIT');
    return true;
  } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error; }
  finally { await client.end(); }
}

async function releaseLease(requestId: string) {
  const client = getPgClient();
  await client.connect();
  try { await client.query(`DELETE FROM public.zoal_ai_concurrency_leases WHERE request_id = $1`, [requestId]); }
  finally { await client.end(); }
}

async function generateWithProvider(input: Required<AIRequest>, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    if (input.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model: input.model, contents: input.prompt, config: { maxOutputTokens: input.maxOutputTokens, abortSignal: controller.signal } as any });
      return response.text || '';
    }
    const url = input.provider === 'openai' ? 'https://api.openai.com/v1/responses' : 'https://api.groq.com/openai/v1/chat/completions';
    const body = input.provider === 'openai'
      ? { model: input.model, input: input.prompt, max_output_tokens: input.maxOutputTokens }
      : { model: input.model, messages: [{ role: 'user', content: input.prompt }], max_completion_tokens: input.maxOutputTokens };
    const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const payload: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${input.provider} generation failed with HTTP ${response.status}`);
    if (input.provider === 'openai') return String(payload?.output_text || payload?.output?.flatMap((item: any) => item?.content || []).map((item: any) => item?.text || '').join('') || '');
    return String(payload?.choices?.[0]?.message?.content || '');
  } catch (error: any) {
    if (error?.name === 'AbortError') throw Object.assign(new Error(`${input.provider} generation timed out`), { statusCode: 504 });
    throw error;
  } finally { clearTimeout(timeout); }
}

async function executeAI(req: Request, input: AIRequest): Promise<AIResult> {
  const normalized = validateAIRequest(input);
  const configured = await loadThirdPartyAIProvider(normalized.provider);
  let provider = normalized.provider;
  let apiKey: string;
  let model = normalized.model;
  if (configured) {
    provider = configured.provider;
    apiKey = configured.apiKey;
    if (!input.model && provider !== normalized.provider) model = defaultModel(provider);
  } else if (normalized.provider === 'gemini') {
    apiKey = await loadGeminiApiKey();
  } else {
    throw new Error(`${normalized.provider} provider is not enabled in 3rd Party Integrations`);
  }
  const effective = { ...normalized, provider, model } as Required<AIRequest>;
  const userId = getUserId(req);
  const requestId = crypto.randomUUID();
  const acquired = await acquireLease(userId, requestId, effective.provider);
  if (!acquired) throw Object.assign(new Error('AI concurrency limit reached'), { statusCode: 429 });
  try { return { provider: effective.provider, text: await generateWithProvider(effective, apiKey) }; }
  finally { await releaseLease(requestId); }
}

async function writeAuditEvent(req: Request, action: string) {
  const user = (req as any).user;
  if (!user?.id) return;
  const client = getPgClient();
  await client.connect();
  try {
    await client.query(`INSERT INTO public.zoal_activity_logs (id, user_id, email, action, timestamp, ip, user_agent) VALUES ($1, $2, $3, $4, now(), $5, $6)`, [crypto.randomUUID(), user.id, user.email || null, action, req.ip || '', req.headers['user-agent'] || '']);
  } finally { await client.end(); }
}

export async function aiGatewayGenerate(req: Request, res: Response) {
  try {
    const userId = getUserId(req);
    const rateLimit = await enforceAIRateLimit(userId, 1);
    res.setHeader('X-RateLimit-Limit-AI', AI_RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining-AI', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset-AI', rateLimit.resetAt);
    const result = await executeAI(req, req.body as AIRequest);
    await writeAuditEvent(req, 'AI_GENERATE').catch(() => undefined);
    return res.json({ ok: true, provider: result.provider, text: result.text });
  } catch (error: any) {
    const status = error?.statusCode === 429 || error?.statusCode === 504 ? error.statusCode : (error?.statusCode || 500);
    return res.status(status).json({ ok: false, error: error?.message || 'AI request failed' });
  }
}

export async function aiGatewayBatch(req: Request, res: Response) {
  try {
    const requests = req.body?.requests;
    if (!Array.isArray(requests) || requests.length < 1 || requests.length > 4) return res.status(400).json({ ok: false, error: 'requests must contain 1 to 4 AI requests' });
    const userId = getUserId(req);
    const rateLimit = await enforceAIRateLimit(userId, requests.length);
    res.setHeader('X-RateLimit-Limit-AI', AI_RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining-AI', rateLimit.remaining);
    res.setHeader('X-RateLimit-Reset-AI', rateLimit.resetAt);
    const results = await Promise.allSettled(requests.map((item: AIRequest) => executeAI(req, item)));
    await writeAuditEvent(req, 'AI_BATCH').catch(() => undefined);
    return res.json({ ok: true, results: results.map(result => result.status === 'fulfilled' ? { ok: true, provider: result.value.provider, text: result.value.text } : { ok: false, error: (result.reason as any)?.message || 'AI request failed' }) });
  } catch (error: any) {
    const status = error?.statusCode === 429 ? 429 : (error?.statusCode || 500);
    return res.status(status).json({ ok: false, error: error?.message || 'AI batch failed' });
  }
}

export async function getAIProviderStatus(_req: Request, res: Response) {
  const client = getPgClient();
  await client.connect();
  try {
    const legacy = await client.query(`SELECT status, last_verified_at, rotated_at FROM public.zoal_ai_provider_credentials WHERE provider = 'gemini' AND credential_name = 'primary' LIMIT 1`);
    const thirdParty = await client.query(`SELECT provider, status, last_verified_at FROM public.zoal_third_party_integrations WHERE provider IN ('openai','groq','gemini') ORDER BY COALESCE(last_verified_at, updated_at) DESC`);
    const row = legacy.rows[0];
    return res.json({ ok: true, providers: [
      { name: 'gemini', enabled: row ? row.status === 'active' : Boolean(process.env.GEMINI_API_KEY), configuredByEnvironment: !row && Boolean(process.env.GEMINI_API_KEY), credentialStatus: row?.status || (process.env.GEMINI_API_KEY ? 'environment' : 'unconfigured'), lastVerifiedAt: row?.last_verified_at || null, rotatedAt: row?.rotated_at || null },
      ...thirdParty.rows.map((x: any) => ({ name: x.provider, enabled: x.status === 'active', configuredByEnvironment: false, credentialStatus: x.status, lastVerifiedAt: x.last_verified_at || null, rotatedAt: null }))
    ], concurrency: { maxPerUser: MAX_CONCURRENT_PER_USER } });
  } finally { await client.end(); }
}

export async function rotateAIProviderKey(req: Request, res: Response) {
  const provider = req.body?.provider;
  const apiKey = req.body?.apiKey;
  if (provider !== 'gemini' || typeof apiKey !== 'string' || apiKey.length < 20 || apiKey.length > 512) return res.status(400).json({ ok: false, error: 'Invalid provider credential payload' });
  try { await generateWithProvider({ provider: 'gemini', model: DEFAULT_MODEL, prompt: 'Return the single word OK.', maxOutputTokens: 8 }, apiKey); }
  catch { return res.status(400).json({ ok: false, error: 'Provider credential verification failed' }); }
  const encrypted = encryptSecret(apiKey);
  const client = getPgClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    const userId = getUserId(req);
    await client.query(`INSERT INTO public.zoal_ai_provider_credentials (provider, credential_name, secret_ref, encrypted_secret, iv, auth_tag, status, created_by, rotated_at, last_verified_at) VALUES ($1, 'primary', 'runtime', $2, $3, $4, 'active', $5, now(), now()) ON CONFLICT (provider, credential_name) DO UPDATE SET encrypted_secret = EXCLUDED.encrypted_secret, iv = EXCLUDED.iv, auth_tag = EXCLUDED.auth_tag, status = 'active', created_by = EXCLUDED.created_by, rotated_at = now(), last_verified_at = now()`, [provider, encrypted.encrypted, encrypted.iv, encrypted.authTag, userId]);
    await client.query(`INSERT INTO public.zoal_activity_logs (id, user_id, email, action, timestamp, ip, user_agent) VALUES ($1, $2, $3, 'AI_PROVIDER_ROTATE', now(), $4, $5)`, [crypto.randomUUID(), userId, (req as any).user?.email || null, req.ip || '', req.headers['user-agent'] || '']);
    await client.query('COMMIT');
    return res.json({ ok: true, provider, status: 'active', verified: true });
  } catch { await client.query('ROLLBACK').catch(() => undefined); return res.status(500).json({ ok: false, error: 'Provider credential rotation failed' }); }
  finally { await client.end(); }
}

export async function disableAIProvider(req: Request, res: Response) {
  const provider = req.body?.provider;
  if (provider !== 'gemini') return res.status(400).json({ ok: false, error: 'Unsupported provider' });
  const client = getPgClient();
  await client.connect();
  try {
    await client.query('BEGIN');
    const userId = getUserId(req);
    const update = await client.query(`UPDATE public.zoal_ai_provider_credentials SET status = 'disabled' WHERE provider = $1 AND credential_name = 'primary'`, [provider]);
    if (update.rowCount !== 1) { await client.query('ROLLBACK'); return res.status(404).json({ ok: false, error: 'Provider credential not found' }); }
    await client.query(`INSERT INTO public.zoal_activity_logs (id, user_id, email, action, timestamp, ip, user_agent) VALUES ($1, $2, $3, 'AI_PROVIDER_DISABLE', now(), $4, $5)`, [crypto.randomUUID(), userId, (req as any).user?.email || null, req.ip || '', req.headers['user-agent'] || '']);
    await client.query('COMMIT');
    return res.json({ ok: true, provider, status: 'disabled' });
  } catch { await client.query('ROLLBACK').catch(() => undefined); return res.status(500).json({ ok: false, error: 'Provider disable failed' }); }
  finally { await client.end(); }
}
