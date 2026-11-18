import { audit, destroyUserSessions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireAdmin } from '@/lib/http';
import { deleteUser } from '@/lib/delete-user';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string }> };

async function lastActiveAdmin(id: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    "select count(*)::int as n from users where role = 'admin' and status = 'active' and id <> $1",
    [id],
  );
  return (row?.n ?? 0) === 0;
}

export async function PATCH(request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: unknown;
    role?: unknown;
    canUseAi?: unknown;
    name?: unknown;
  } | null;
  if (!body) return fail(400, 'Invalid request.');
  const target = await queryOne<{ role: string }>('select role from users where id = $1', [id]);
  if (!target) return fail(404, 'User not found.');
  const sets: string[] = [];
  const values: unknown[] = [id];
  const add = (column: string, value: unknown) => {
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  };
  if (body.status === 'active' || body.status === 'frozen') {
    if (body.status === 'frozen' && id === auth.user.id) return fail(400, 'You cannot freeze your own account.');
    if (body.status === 'frozen' && target.role === 'admin' && (await lastActiveAdmin(id))) return fail(400, 'At least one active admin is required.');
    add('status', body.status);
  }
  if (body.role === 'admin' || body.role === 'user') {
    if (body.role === 'user' && id === auth.user.id) return fail(400, 'You cannot remove your own admin role.');
    if (body.role === 'user' && target.role === 'admin' && (await lastActiveAdmin(id))) return fail(400, 'At least one active admin is required.');
    add('role', body.role);
  }
  if (typeof body.canUseAi === 'boolean') add('can_use_ai', body.canUseAi);
  if (typeof body.name === 'string') add('name', body.name.trim().slice(0, 120));
  if (sets.length === 0) return fail(400, 'Nothing to update.');
  await query(`update users set ${sets.join(', ')} where id = $1`, values);
  if (body.status === 'frozen') await destroyUserSessions(id);
  await audit(auth.user.id, 'user.update', id, body);
  return json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (id === auth.user.id) return fail(400, 'You cannot remove your own account.');
  const target = await queryOne<{ role: string }>('select role from users where id = $1', [id]);
  if (!target) return fail(404, 'User not found.');
  if (target.role === 'admin' && (await lastActiveAdmin(id))) return fail(400, 'At least one active admin is required.');
  await deleteUser(id);
  await audit(auth.user.id, 'user.delete', id);
  return json({ ok: true });
}
