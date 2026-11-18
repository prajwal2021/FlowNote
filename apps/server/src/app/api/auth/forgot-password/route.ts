import { randomBytes } from 'node:crypto';
import { audit, clientIp, hashToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { sendPasswordReset } from '@/lib/mail';

export { OPTIONS } from '@/lib/cors';

const RESETS_PER_HOUR = 3;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  if (!body || typeof body.email !== 'string') return fail(400, 'Email is required.');
  const email = body.email.trim().toLowerCase();
  const user = await queryOne<{ id: string; email: string }>(
    `select id, email from users where email = $1 and status = 'active'`,
    [email],
  );
  if (user) {
    const recent = await queryOne<{ n: number }>(
      `select count(*)::int as n from password_resets where user_id = $1 and created_at > now() - interval '1 hour'`,
      [user.id],
    );
    if ((recent?.n ?? 0) < RESETS_PER_HOUR) {
      const token = randomBytes(32).toString('base64url');
      await query(
        `insert into password_resets (token_hash, user_id, expires_at) values ($1, $2, now() + interval '1 hour')`,
        [hashToken(token), user.id],
      );
      await audit(user.id, 'password.reset-requested', user.email, { ip: await clientIp() });
      try {
        await sendPasswordReset(user.email, token);
      } catch (error) {
        console.error('password reset mail failed', error);
        return fail(502, "We couldn't send the email. Try again in a few minutes.");
      }
    }
  }
  return json({ ok: true });
}
