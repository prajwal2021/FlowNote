import { query } from '@/lib/db';
import { json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const guides = await query(
    `select client_id as "clientId", content_hash as hash, deleted_by_user as deleted, has_snapshot as "hasSnapshot",
            (extract(epoch from client_updated_at) * 1000)::float8 as "updatedAt"
     from guides where owner_id = $1`,
    [auth.user.id],
  );
  return json({ guides });
}
