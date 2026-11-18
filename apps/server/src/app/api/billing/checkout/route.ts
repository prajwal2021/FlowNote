import { audit } from '@/lib/auth';
import { ensureCustomer, usageFor } from '@/lib/billing';
import { fail, json, requireUser } from '@/lib/http';
import { publicUrl } from '@/lib/storage';
import { billingEnabled, stripe } from '@/lib/stripe';

export { OPTIONS } from '@/lib/cors';

export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!billingEnabled()) return fail(503, 'Payments are not set up on this server yet.');
  const usage = await usageFor(auth.user.id);
  if (usage?.plan === 'pro') return fail(409, 'You are already on FlowNote Pro.');
  try {
    const customer = await ensureCustomer(auth.user.id);
    const session = await stripe<{ url: string }>('/checkout/sessions', {
      mode: 'subscription',
      customer,
      client_reference_id: auth.user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID ?? '', quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${publicUrl()}/account?status=success`,
      cancel_url: `${publicUrl()}/account?status=cancelled`,
    });
    await audit(auth.user.id, 'billing.checkout-started', auth.user.id);
    return json({ url: session.url });
  } catch (error) {
    console.error('checkout failed', error);
    return fail(502, "Couldn't open checkout. Try again in a moment.");
  }
}
