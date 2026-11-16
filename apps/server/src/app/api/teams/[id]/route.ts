import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { listTeamMembers, requireTeamMember, requireTeamOwner } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamMember(id, auth.user.id);
  if ('response' in access) return access.response;
  const team = await queryOne<{ id: string; name: string }>('select id, name from teams where id = $1', [id]);
  if (!team) return fail(404, 'Team not found.');
  return json({ team, role: access.role, members: await listTeamMembers(id) });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamOwner(id, auth.user.id);
  if ('response' in access) return access.response;
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!name) return fail(400, 'A team name is required.');
  await query('update teams set name = $2 where id = $1', [id, name]);
  await audit(auth.user.id, 'team.rename', id, { name });
  return json({ ok: true, name });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamOwner(id, auth.user.id);
  if ('response' in access) return access.response;
  await query('update guides set team_id = null where team_id = $1', [id]);
  await query('delete from teams where id = $1', [id]);
  await audit(auth.user.id, 'team.delete', id);
  return json({ ok: true });
}
