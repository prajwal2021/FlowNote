import { queryOne } from '@/lib/db';
import { fail, requireUser } from '@/lib/http';
import { getObject, guideKey } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { clientId } = await params;
  const guide = await queryOne<{ id: string; has_snapshot: boolean }>('select id, has_snapshot from guides where owner_id = $1 and client_id = $2', [
    auth.user.id,
    clientId,
  ]);
  if (!guide?.has_snapshot) return fail(404, 'No snapshot for this guide.');
  const object = await getObject(guideKey(guide.id, 'snapshot'));
  if (!object) return fail(404, 'No snapshot for this guide.');
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': String(object.size),
      'Cache-Control': 'private, no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
