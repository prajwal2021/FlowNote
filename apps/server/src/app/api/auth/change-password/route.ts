import bcrypt from 'bcryptjs';
import { audit, hashPassword, validatePassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { currentPassword?: unknown; newPassword?: unknown } | null;
  if (!body || typeof body.currentPassword !== 'string') return fail(400, 'Current password is required.');
  const problem = validatePassword(body.newPassword);
  if (problem) return fail(400, problem);
  const row = await queryOne<{ password_hash: string }>('select password_hash from users where id = $1', [auth.user.id]);
  if (!row || !(await bcrypt.compare(body.currentPassword, row.password_hash))) return fail(403, 'Current password is incorrect.');
  if (body.currentPassword === body.newPassword) return fail(400, 'Choose a different password.');
  await query('update users set password_hash = $2, must_change_password = false where id = $1', [
    auth.user.id,
    await hashPassword(body.newPassword as string),
  ]);
  await audit(auth.user.id, 'password.change', auth.user.id);
  return json({ ok: true });
}
