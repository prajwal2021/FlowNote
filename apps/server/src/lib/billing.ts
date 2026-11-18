import { query, queryOne } from './db';
import { billingEnabled, stripe } from './stripe';

export interface Usage {
  plan: 'free' | 'pro';
  recordingsUsed: number;
  recordingLimit: number | null;
  renewsAt: string | null;
  billingEnabled: boolean;
}

interface BillingRow {
  role: 'admin' | 'user';
  recordings_used: number;
  subscription_status: string | null;
  current_period_end: Date | null;
  stripe_customer_id: string | null;
  email: string;
}

const PAID_STATUSES = ['active', 'trialing', 'past_due'];

function freeRecordingLimit(): number {
  const limit = Number(process.env.FREE_RECORDING_LIMIT ?? 5);
  return Number.isInteger(limit) && limit >= 0 ? limit : 5;
}

function toUsage(row: BillingRow): Usage {
  const pro = row.role === 'admin' || PAID_STATUSES.includes(row.subscription_status ?? '');
  const enabled = billingEnabled();
  return {
    plan: pro ? 'pro' : 'free',
    recordingsUsed: row.recordings_used,
    recordingLimit: pro || !enabled ? null : freeRecordingLimit(),
    renewsAt: row.current_period_end?.toISOString() ?? null,
    billingEnabled: enabled,
  };
}

async function billingRow(userId: string): Promise<BillingRow | null> {
  return queryOne<BillingRow>(
    `select role, recordings_used, subscription_status, current_period_end, stripe_customer_id, email from users where id = $1`,
    [userId],
  );
}

export async function usageFor(userId: string): Promise<Usage | null> {
  const row = await billingRow(userId);
  return row ? toUsage(row) : null;
}

export async function claimRecording(userId: string): Promise<{ allowed: boolean; usage: Usage | null }> {
  const enforce = billingEnabled();
  const claimed = await queryOne<BillingRow>(
    `update users set recordings_used = recordings_used + 1
     where id = $1 and (not $2 or role = 'admin' or subscription_status = any($3) or recordings_used < $4)
     returning role, recordings_used, subscription_status, current_period_end, stripe_customer_id, email`,
    [userId, enforce, PAID_STATUSES, freeRecordingLimit()],
  );
  if (claimed) return { allowed: true, usage: toUsage(claimed) };
  return { allowed: false, usage: await usageFor(userId) };
}

export async function ensureCustomer(userId: string): Promise<string> {
  const row = await billingRow(userId);
  if (!row) throw new Error('user not found');
  if (row.stripe_customer_id) return row.stripe_customer_id;
  const customer = await stripe<{ id: string }>('/customers', { email: row.email, metadata: { user_id: userId } });
  const saved = await queryOne<{ stripe_customer_id: string }>(
    `update users set stripe_customer_id = coalesce(stripe_customer_id, $2) where id = $1 returning stripe_customer_id`,
    [userId, customer.id],
  );
  return saved?.stripe_customer_id ?? customer.id;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number }[] };
}

export async function applySubscription(subscription: StripeSubscription): Promise<void> {
  const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
  await query(
    `update users set subscription_id = $2, subscription_status = $3, current_period_end = $4
     where stripe_customer_id = $1`,
    [subscription.customer, subscription.id, subscription.status, periodEnd ? new Date(periodEnd * 1000) : null],
  );
}
