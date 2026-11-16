import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { isTeamRole, otherOwnerExists, requireTeamOwner, type TeamRole, UUID } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id, userId } = await params;
  const access = await requireTeamOwner(id, auth.user.id);
  if ('response' in access) return access.response;
  if (!UUID.test(userId)) return fail(404, 'They are not in this team.');
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  if (!isTeamRole(body?.role)) return fail(400, 'A role of owner or member is required.');
  const role: TeamRole = body.role;
  const current = await queryOne<{ role: TeamRole }>('select role from team_members where team_id = $1 and user_id = $2', [id, userId]);
  if (!current) return fail(404, 'They are not in this team.');
  if (current.role === 'owner' && role === 'member' && !(await otherOwnerExists(id, userId))) {
    return fail(400, 'A team needs at least one owner.');
  }
  await query('update team_members set role = $3 where team_id = $1 and user_id = $2', [id, userId, role]);
  await audit(auth.user.id, 'team.member-role', id, { userId, role });
  return json({ ok: true, role });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id, userId } = await params;
  const access = await requireTeamOwner(id, auth.user.id);
  if ('response' in access) return access.response;
  if (!UUID.test(userId)) return fail(404, 'They are not in this team.');
  const current = await queryOne<{ role: TeamRole }>('select role from team_members where team_id = $1 and user_id = $2', [id, userId]);
  if (!current) return fail(404, 'They are not in this team.');
  if (current.role === 'owner' && !(await otherOwnerExists(id, userId))) return fail(400, 'A team needs at least one owner.');
  await query('delete from team_members where team_id = $1 and user_id = $2', [id, userId]);
  await query('update guides set team_id = null where team_id = $1 and owner_id = $2', [id, userId]);
  await audit(auth.user.id, 'team.member-remove', id, { userId });
  return json({ ok: true });
}
