import crypto from 'crypto';
import pg from 'pg';
import { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { logActivityAsync } from './auth_db';

const { Client } = pg;

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const MAX_PROMPT_CHARS = Number(process.env.AI_MAX_PROMPT_CHARS || 12000);
const MAX_OUTPUT_TOKENS = Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048);
const MAX_CONCURRENT_PER_USER = Math.max(1, Number(process.env.AI_MAX_CONCURRENT_PER_USER || 2));
const LEASE_TTL_MS = Math.max(30_000, Number(process.env.AI_CONCURRENCY_LEASE_TTL_MS || 120_000));

export type AIProviderName = 'gemini';

export interface AIRequest {
  provider?: AIProviderName;
  model?: string;
  prompt: string;
  maxOutputTokens?: number;
}

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new Client({ connectionString, ssl: { rejectUnauthorized: false } });
}

function getUserId(req: Request): string {
  const id = (req as any).user?.id;
  if (!id || typeof id !== 'string') throw new Error('AUTHENTICATED_USER_REQUIRED');
  return id;
}

function getRequestInfo(req: Request) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp).split(',')[0].trim();
  return { ip, userAgent: String(req.headers['user-agent'] || 'unknown') };
}

function getMasterKey(): Buffer {
  const raw = process.env.AI_CREDENTIAL_MASTER_KEY;
  if (!raw) throw new Error('AI_CREDENTIAL_MASTER_KEY_NOT_CONFIGURED');

  // Accept exactly 32-byte base64 or 64-character hex. No weak implicit derivation.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  const decoded = Buffer.from(raw, 'base64');
  if (decoded.length === 32) return decoded;
  throw new Error('AI_CREDENTIAL_MASTER_KEY_INVALID');
}

function encryptSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return {
    encryptedSecret: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64')
  };
}

function decryptSecret(row: any): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(row.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(row.auth_tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.encrypted_secret, 'base64')),
    decipher.final()
  ]).toString('utf8');
}

async function loadGeminiApiKey() {
  const client = getPgClient();
  if (!client) throw new Error('DATABASE_CONNECTION_UNAVAILABLE');

  try {
    await client.connect();
    const result = await client.query(
      `SELECT encrypted_secret, iv, auth_tag
       FROM public.zoal_ai_provider_credentials
       WHERE provider = $1 AND credential_name = $2 AND status = 'active'
       LIMIT 1`,
      ['gemini', 'primary']
    );

    // Environment secret remains a safe bootstrap path when no rotated DB credential exists.
    if (result.rows.length === 0) {
      const envKey = process.env.GEMINI_API_KEY;
      if (!envKey) throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
      return envKey;
    }

    return decryptSecret(result.rows[0]);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

function assertProvider(provider?: string): asserts provider is AIProviderName | undefined {
  if (provider && provider !== 'gemini') {
    throw new Error('PROVIDER_NOT_SUPPORTED');
  }
}

function validateAIRequest(body: any): AIRequest {
  const provider = body?.provider || 'gemini';
  assertProvider(provider);

  if (typeof body?.prompt !== 'string' || body.prompt.trim().length === 0) {
    throw new Error('PROMPT_REQUIRED');
  }
  if (body.prompt.length > MAX_PROMPT_CHARS) {
    throw new Error('PROMPT_TOO_LARGE');
  }

  const maxOutputTokens = body.maxOutputTokens == null
    ? MAX_OUTPUT_TOKENS
    : Math.min(MAX_OUTPUT_TOKENS, Math.max(1, Number(body.maxOutputTokens)));

  if (!Number.isFinite(maxOutputTokens)) throw new Error('INVALID_MAX_OUTPUT_TOKENS');

  return {
    provider: provider as AIProviderName,
    model: typeof body.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL,
    prompt: body.prompt.trim(),
    maxOutputTokens
  };
}

async function acquireLease(userId: string, provider: string) {
  const client = getPgClient();
  if (!client) throw new Error('DATABASE_CONNECTION_UNAVAILABLE');
  const requestId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + LEASE_TTL_MS);

  try {
    await client.connect();
    await client.query('BEGIN');
    // Transaction-scoped advisory lock makes the count check atomic across app instances.
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`ai-concurrency:${userId}`]);
    await client.query(`DELETE FROM public.zoal_ai_concurrency_leases WHERE expires_at <= now()`);
    const count = await client.query(
      `SELECT count(*)::int AS count
       FROM public.zoal_ai_concurrency_leases
       WHERE user_id = $1 AND expires_at > now()`,
      [userId]
    );

    if (count.rows[0].count >= MAX_CONCURRENT_PER_USER) {
      await client.query('ROLLBACK');
      return { acquired: false as const, requestId };
    }

    await client.query(
      `INSERT INTO public.zoal_ai_concurrency_leases
        (user_id, provider, request_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, provider, requestId, expiresAt.toISOString()]
    );
    await client.query('COMMIT');
    return { acquired: true as const, requestId };
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

async function releaseLease(requestId: string) {
  const client = getPgClient();
  if (!client) return;
  try {
    await client.connect();
    await client.query('DELETE FROM public.zoal_ai_concurrency_leases WHERE request_id = $1', [requestId]);
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

async function generateWithGemini(request: AIRequest) {
  const apiKey = await loadGeminiApiKey();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'zoal-ai-gateway' } }
  });

  const response = await ai.models.generateContent({
    model: request.model || DEFAULT_MODEL,
    contents: request.prompt,
    config: { maxOutputTokens: request.maxOutputTokens }
  });

  const text = response.text?.trim();
  if (!text) throw new Error('AI_EMPTY_RESPONSE');
  return text;
}

async function executeAI(req: Request, input: AIRequest) {
  const userId = getUserId(req);
  const lease = await acquireLease(userId, input.provider || 'gemini');

  if (!lease.acquired) {
    const error: any = new Error('AI_CONCURRENCY_LIMIT');
    error.statusCode = 429;
    throw error;
  }

  try {
    if (input.provider === 'gemini') return await generateWithGemini(input);
    throw new Error('PROVIDER_NOT_SUPPORTED');
  } finally {
    await releaseLease(lease.requestId);
  }
}

export async function aiGatewayGenerate(req: Request, res: Response) {
  try {
    const input = validateAIRequest(req.body);
    const text = await executeAI(req, input);
    const { ip, userAgent } = getRequestInfo(req);
    await logActivityAsync(getUserId(req), (req as any).user?.email || null, '[AI Gateway] Generation completed', ip, userAgent);
    return res.json({ success: true, provider: input.provider, model: input.model, text });
  } catch (error: any) {
    const status = error.statusCode || (
      error.message === 'AUTHENTICATED_USER_REQUIRED' ? 401 :
      error.message === 'PROMPT_REQUIRED' || error.message === 'PROMPT_TOO_LARGE' || error.message === 'PROVIDER_NOT_SUPPORTED' ? 400 :
      500
    );
    return res.status(status).json({ error: error.message || 'AI generation failed.' });
  }
}

export async function aiGatewayBatch(req: Request, res: Response) {
  try {
    if (!Array.isArray(req.body?.requests) || req.body.requests.length < 1 || req.body.requests.length > 4) {
      return res.status(400).json({ error: 'requests must contain between 1 and 4 AI requests.' });
    }

    // Intentionally concurrent: each request independently acquires a durable user lease.
    const inputs = req.body.requests.map(validateAIRequest);
    const results = await Promise.allSettled(inputs.map(input => executeAI(req, input)));

    return res.json({
      success: results.every(result => result.status === 'fulfilled'),
      results: results.map((result, index) => result.status === 'fulfilled'
        ? { index, success: true, provider: inputs[index].provider, model: inputs[index].model, text: result.value }
        : { index, success: false, error: result.reason?.message || 'AI generation failed.' })
    });
  } catch (error: any) {
    const status = error.message === 'AUTHENTICATED_USER_REQUIRED' ? 401 : 400;
    return res.status(status).json({ error: error.message || 'AI batch request failed.' });
  }
}

export async function getAIProviderStatus(_req: Request, res: Response) {
  const client = getPgClient();
  if (!client) return res.status(500).json({ error: 'DATABASE_CONNECTION_UNAVAILABLE' });
  try {
    await client.connect();
    const result = await client.query(
      `SELECT provider, credential_name, status, created_at, rotated_at, last_verified_at
       FROM public.zoal_ai_provider_credentials
       ORDER BY provider, credential_name`
    );
    return res.json({
      providers: result.rows,
      bootstrap: { geminiEnvConfigured: Boolean(process.env.GEMINI_API_KEY) },
      concurrency: { maxPerUser: MAX_CONCURRENT_PER_USER }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Provider status unavailable.' });
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

export async function rotateAIProviderKey(req: Request, res: Response) {
  const provider = req.params.provider;
  if (provider !== 'gemini') return res.status(400).json({ error: 'PROVIDER_NOT_SUPPORTED' });
  const apiKey = typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : '';
  if (!apiKey || apiKey.length < 20 || apiKey.length > 512) {
    return res.status(400).json({ error: 'INVALID_API_KEY' });
  }

  let encrypted;
  try {
    encrypted = encryptSecret(apiKey);
  } catch (error: any) {
    return res.status(503).json({ error: error.message || 'Credential encryption is not configured.' });
  }

  const userId = getUserId(req);
  const client = getPgClient();
  if (!client) return res.status(500).json({ error: 'DATABASE_CONNECTION_UNAVAILABLE' });

  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO public.zoal_ai_provider_credentials
        (provider, credential_name, secret_ref, encrypted_secret, iv, auth_tag, status, created_by, created_at, rotated_at)
       VALUES ($1, 'primary', 'GEMINI_API_KEY', $2, $3, $4, 'active', $5, now(), now())
       ON CONFLICT (provider, credential_name)
       DO UPDATE SET encrypted_secret = EXCLUDED.encrypted_secret,
                     iv = EXCLUDED.iv,
                     auth_tag = EXCLUDED.auth_tag,
                     status = 'active',
                     created_by = EXCLUDED.created_by,
                     rotated_at = now(),
                     last_verified_at = NULL`,
      [provider, encrypted.encryptedSecret, encrypted.iv, encrypted.authTag, userId]
    );
    await client.query('COMMIT');

    const { ip, userAgent } = getRequestInfo(req);
    await logActivityAsync(userId, (req as any).user?.email || null, '[AI Gateway] Gemini credential rotated', ip, userAgent);
    return res.json({ success: true, provider, credential: 'primary', status: 'active' });
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    return res.status(500).json({ error: error.message || 'Credential rotation failed.' });
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

export async function disableAIProvider(req: Request, res: Response) {
  const provider = req.params.provider;
  if (provider !== 'gemini') return res.status(400).json({ error: 'PROVIDER_NOT_SUPPORTED' });
  const client = getPgClient();
  if (!client) return res.status(500).json({ error: 'DATABASE_CONNECTION_UNAVAILABLE' });
  try {
    await client.connect();
    await client.query(
      `UPDATE public.zoal_ai_provider_credentials
       SET status = 'disabled', rotated_at = now()
       WHERE provider = $1 AND credential_name = 'primary'`,
      [provider]
    );
    const { ip, userAgent } = getRequestInfo(req);
    await logActivityAsync(getUserId(req), (req as any).user?.email || null, '[AI Gateway] Provider disabled', ip, userAgent);
    return res.json({ success: true, provider, status: 'disabled' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Provider disable failed.' });
  } finally {
    try { await client.end(); } catch (_) {}
  }
}

export function aiGatewaySecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  // Gateway endpoints must always be authenticated before any provider operation.
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
  }
  next();
}
