const MOYASAR_BASE_URL = (process.env.MOYASAR_BASE_URL || 'https://api.moyasar.com/v1').replace(/\/$/, '');

function requireSecretKey() {
  const key = process.env.MOYASAR_SECRET_KEY?.trim();
  if (!key) throw new Error('MOYASAR_SECRET_KEY is not configured.');
  return key;
}

async function moyasarRequest(path: string, init: RequestInit = {}) {
  const secret = requireSecretKey();
  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${MOYASAR_BASE_URL}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(15000),
  });

  const text = await response.text();
  let payload: any = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Moyasar request failed with HTTP ${response.status}`;
    const error = new Error(message) as Error & { status?: number; payload?: any };
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function getMoyasarPayment(paymentId: string) {
  if (!paymentId || !/^[0-9a-f-]{20,}$/i.test(paymentId)) throw new Error('Invalid Moyasar payment ID.');
  return moyasarRequest(`/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${requireSecretKey()}:`).toString('base64')}` }
  });
}

export async function refundMoyasarPayment(paymentId: string, amountMinor?: number) {
  if (!paymentId || !/^[0-9a-f-]{20,}$/i.test(paymentId)) throw new Error('Invalid Moyasar payment ID.');
  const body = typeof amountMinor === 'number' ? JSON.stringify({ amount: amountMinor }) : undefined;
  return moyasarRequest(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${requireSecretKey()}:`).toString('base64')}` },
    body,
  });
}

export function isMoyasarConfigured() {
  return Boolean(process.env.MOYASAR_SECRET_KEY?.trim() && process.env.MOYASAR_PUBLISHABLE_KEY?.trim());
}
