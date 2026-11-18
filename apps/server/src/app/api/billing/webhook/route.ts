import { audit } from '@/lib/auth';
import { applySubscription, type StripeSubscription } from '@/lib/billing';
import { query, queryOne } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { stripe, verifyStripeSignature } from '@/lib/stripe';

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

const SUBSCRIPTION_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return fail(503, 'Webhook secret is not set.');
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), secret)) return fail(400, 'Bad signature.');
  const event = JSON.parse(payload) as StripeEvent;
  const fresh = await queryOne('insert into stripe_events (id) values ($1) on conflict do nothing returning id', [event.id]);
  if (!fresh) return json({ received: true, duplicate: true });

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { customer?: string; client_reference_id?: string; subscription?: string };
      if (session.customer && session.client_reference_id) {
        await query('update users set stripe_customer_id = coalesce(stripe_customer_id, $2) where id = $1', [
          session.client_reference_id,
          session.customer,
        ]);
      }
      if (session.subscription) {
        await applySubscription(await stripe<StripeSubscription>(`/subscriptions/${session.subscription}`, {}, 'GET'));
      }
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      await applySubscription(event.data.object as unknown as StripeSubscription);
    }
  } catch (error) {
    await query('delete from stripe_events where id = $1', [event.id]);
    console.error('stripe webhook failed', event.type, error);
    return fail(500, 'Webhook handling failed.');
  }
  await audit(null, 'billing.webhook', event.type, { id: event.id });
  return json({ received: true });
}
