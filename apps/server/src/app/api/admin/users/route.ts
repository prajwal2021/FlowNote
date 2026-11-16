import { audit, generatePassword, hashPassword } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireAdmin } from '@/lib/http';

export { OPTIONS } from '@/lib/cors';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const users = await query(
    `select id, email, name, role, status, can_use_ai as "canUseAi", must_change_password as "mustChangePassword",
            created_at as "createdAt", last_login_at as "lastLoginAt",
            (select count(*)::int from shares s where s.owner_id = users.id and s.revoked_at is null) as "shareCount",
            (select coalesce(sum(requests), 0)::int from ai_usage u where u.user_id = users.id and u.day > current_date - 30) as "aiRequests30d"
     from users order by created_at`,
  );
  return json({ users });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    name?: unknown;
    role?: unknown;
    canUseAi?: unknown;
  } | null;
  if (!body || typeof body.email !== 'string' || !EMAIL.test(body.email.trim())) return fail(400, 'A valid email is required.');
  const email = body.email.trim().toLowerCase();
  const role = body.role === 'admin' ? 'admin' : 'user';
  if (await queryOne('select 1 from users where email = $1', [email])) return fail(409, 'A user with this email already exists.');
  const password = generatePassword();
  const created = await queryOne<{ id: string }>(
    `insert into users (email, name, role, can_use_ai, password_hash, must_change_password)
     values ($1, $2, $3, $4, $5, true) returning id`,
    [email, typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '', role, body.canUseAi === true, await hashPassword(password)],
  );
  await audit(auth.user.id, 'user.create', created?.id ?? null, { email, role });
  return json({ id: created?.id, email, temporaryPassword: password }, 201);
}
