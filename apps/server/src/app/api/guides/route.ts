import { query } from '@/lib/db';
import { json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const guides = await query(
    `select id, client_id as "clientId", title, step_count as "stepCount", client_updated_at as "updatedAt", deleted_by_user as "deleted"
     from guides where owner_id = $1 order by client_updated_at desc nulls last limit 1000`,
    [auth.user.id],
  );
  return json({ guides });
}
