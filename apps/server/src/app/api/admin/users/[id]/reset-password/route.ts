import { audit, destroyUserSessions, generatePassword, hashPassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireAdmin } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  if (!(await queryOne('select 1 from users where id = $1', [id]))) return fail(404, 'User not found.');
  const password = generatePassword();
  await query('update users set password_hash = $2, must_change_password = true where id = $1', [
    id,
    await hashPassword(password),
  ]);
  await destroyUserSessions(id);
  await audit(auth.user.id, 'user.reset-password', id);
  return json({ temporaryPassword: password });
}
