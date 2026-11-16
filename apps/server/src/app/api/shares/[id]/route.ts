import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { deleteObject, shareKey } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail(404, 'Share not found.');
  const share = await queryOne<{ owner_id: string }>('select owner_id from shares where id = $1 and revoked_at is null', [id]);
  if (!share || (share.owner_id !== auth.user.id && auth.user.role !== 'admin')) return fail(404, 'Share not found.');
  await query('update shares set revoked_at = now() where id = $1', [id]);
  await deleteObject(shareKey(id));
  await audit(auth.user.id, 'share.revoke', id);
  return json({ ok: true });
}
