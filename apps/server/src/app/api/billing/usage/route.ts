import { usageFor } from '@/lib/billing';
import { fail, json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const usage = await usageFor(auth.user.id);
  return usage ? json({ usage }) : fail(404, 'Account not found.');
}
