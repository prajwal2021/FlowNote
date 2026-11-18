import { createHmac, timingSafeEqual } from 'node:crypto';

type Params = { [key: string]: string | number | boolean | Params | Params[] | undefined };

function encode(params: Params, form = new URLSearchParams(), prefix = ''): URLSearchParams {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) value.forEach((item, index) => encode(item, form, `${name}[${index}]`));
    else if (typeof value === 'object') encode(value, form, name);
    else form.append(name, String(value));
  }
  return form;
}

export function billingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export async function stripe<T>(path: string, params: Params = {}, method: 'GET' | 'POST' | 'DELETE' = 'POST'): Promise<T> {
  const body = method === 'GET' ? undefined : encode(params);
  const query = method === 'GET' ? `?${encode(params)}` : '';
  const response = await fetch(`https://api.stripe.com/v1${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY ?? ''}`,
      ...(body && { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    body,
  });
  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(`Stripe ${path} failed: ${json.error?.message ?? response.status}`);
  return json;
}

const TOLERANCE_SECONDS = 300;

export function verifyStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = header.split(',').map((part) => part.split('=') as [string, string]);
  const timestamp = parts.find(([k]) => k === 't')?.[1];
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex'));
  return signatures.some((signature) => {
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
