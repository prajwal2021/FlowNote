import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { requireTeamMember, UUID } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string; guideId: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id, guideId } = await params;
  const access = await requireTeamMember(id, auth.user.id);
  if ('response' in access) return access.response;
  if (!UUID.test(guideId)) return fail(404, 'Guide not found in this team.');
  const guide = await queryOne<{ owner_id: string }>('select owner_id from guides where id = $1 and team_id = $2', [guideId, id]);
  if (!guide) return fail(404, 'Guide not found in this team.');
  if (guide.owner_id !== auth.user.id && access.role !== 'owner') return fail(403, 'Only the guide owner or a team owner can remove it.');
  await query('update guides set team_id = null where id = $1', [guideId]);
  await audit(auth.user.id, 'team.guide-unpublish', id, { guideId });
  return json({ ok: true });
}
