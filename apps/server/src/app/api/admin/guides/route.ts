import { fail, json, requireAdmin } from '@/lib/http';
import { listGuides } from '@/lib/list-guides';

export { OPTIONS } from '@/lib/cors';

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const url = new URL(request.url);
  const owner = url.searchParams.get('owner');
  if (owner && !/^[0-9a-f-]{36}$/.test(owner)) return fail(400, 'Invalid owner.');
  const guides = await listGuides({ ownerId: owner ?? undefined, q: url.searchParams.get('q')?.trim() || undefined });
  return json({ guides });
}
