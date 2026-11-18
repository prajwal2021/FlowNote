import { ensureCustomer } from '@/lib/billing';
import { fail, json, requireUser } from '@/lib/http';
import { publicUrl } from '@/lib/storage';
import { billingEnabled, stripe } from '@/lib/stripe';

export { OPTIONS } from '@/lib/cors';

export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (!billingEnabled()) return fail(503, 'Payments are not set up on this server yet.');
  try {
    const session = await stripe<{ url: string }>('/billing_portal/sessions', {
      customer: await ensureCustomer(auth.user.id),
      return_url: `${publicUrl()}/account`,
    });
    return json({ url: session.url });
  } catch (error) {
    console.error('billing portal failed', error);
    return fail(502, "Couldn't open billing. Try again in a moment.");
  }
}
