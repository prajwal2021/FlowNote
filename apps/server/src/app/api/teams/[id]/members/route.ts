import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { isTeamRole, listTeamMembers, requireTeamMember, requireTeamOwner } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamMember(id, auth.user.id);
  if ('response' in access) return access.response;
  return json({ members: await listTeamMembers(id) });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamOwner(id, auth.user.id);
  if ('response' in access) return access.response;
  const body = (await request.json().catch(() => null)) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return fail(400, 'An email is required.');
  const role = isTeamRole(body?.role) ? body.role : 'member';
  const user = await queryOne<{ id: string }>('select id from users where email = $1', [email]);
  if (!user) return fail(404, 'No user with that email. Ask an admin to add them first.');
  if (await queryOne('select 1 from team_members where team_id = $1 and user_id = $2', [id, user.id])) {
    return fail(409, 'They are already in this team.');
  }
  await query('insert into team_members (team_id, user_id, role) values ($1, $2, $3)', [id, user.id, role]);
  await audit(auth.user.id, 'team.member-add', id, { userId: user.id, email, role });
  return json({ userId: user.id, email, role }, 201);
}
