import { audit } from '@/lib/auth';
import { claimRecording } from '@/lib/billing';
import { json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function POST() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { allowed, usage } = await claimRecording(auth.user.id);
  if (!allowed) {
    await audit(auth.user.id, 'billing.recording-limit', auth.user.id, usage);
    return json({ error: 'You have used all your free recordings. Upgrade to FlowNote Pro to keep recording.', usage }, 402);
  }
  return json({ usage });
}
