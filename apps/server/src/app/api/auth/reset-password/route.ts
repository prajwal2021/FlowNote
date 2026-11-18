import { audit, destroyUserSessions, hashPassword, hashToken, validatePassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;
  if (!body || typeof body.token !== 'string') return fail(400, 'This reset link is invalid.');
  const problem = validatePassword(body.password);
  if (problem) return fail(400, problem);
  const reset = await queryOne<{ user_id: string }>(
    `update password_resets set used_at = now()
     where token_hash = $1 and used_at is null and expires_at > now() returning user_id`,
    [hashToken(body.token)],
  );
  if (!reset) return fail(400, 'This reset link has expired or was already used. Ask for a new one.');
  await query(
    `update users set password_hash = $2, must_change_password = false, email_verified = true,
       failed_attempts = 0, locked_until = null where id = $1`,
    [reset.user_id, await hashPassword(body.password as string)],
  );
  await query('update password_resets set used_at = now() where user_id = $1 and used_at is null', [reset.user_id]);
  await destroyUserSessions(reset.user_id);
  await audit(reset.user_id, 'password.reset', reset.user_id);
  return json({ ok: true });
}
