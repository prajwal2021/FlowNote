import { json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  return json({ user: auth.user });
}
