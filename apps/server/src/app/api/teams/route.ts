import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { listMyTeams } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  return json({ teams: await listMyTeams(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!name) return fail(400, 'A team name is required.');
  const created = await queryOne<{ id: string }>('insert into teams (name, created_by) values ($1, $2) returning id', [name, auth.user.id]);
  if (!created) return fail(500, 'Could not create the team.');
  await query("insert into team_members (team_id, user_id, role) values ($1, $2, 'owner')", [created.id, auth.user.id]);
  await audit(auth.user.id, 'team.create', created.id, { name });
  return json({ id: created.id, name, role: 'owner' }, 201);
}
