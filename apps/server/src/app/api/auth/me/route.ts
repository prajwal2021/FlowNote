import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { audit } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { deleteUser } from '@/lib/delete-user';
import { fail, json, requireUser } from '@/lib/http';
import { SESSION_COOKIE } from '@/lib/session-config';

export { OPTIONS } from '@/lib/cors';

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  return json({ user: auth.user });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { password?: unknown; confirm?: unknown } | null;
  const row = await queryOne<{ password_hash: string | null; role: string }>('select password_hash, role from users where id = $1', [
    auth.user.id,
  ]);
  if (!row) return fail(404, 'Account not found.');
  if (row.role === 'admin') return fail(400, 'Admins cannot delete their own account here. Ask another admin.');
  if (row.password_hash) {
    if (typeof body?.password !== 'string' || !(await bcrypt.compare(body.password, row.password_hash)))
      return fail(403, 'Password is incorrect.');
  } else if (body?.confirm !== auth.user.email) {
    return fail(400, 'Type your email address to confirm.');
  }
  try {
    await deleteUser(auth.user.id);
  } catch (error) {
    console.error('account deletion failed', error);
    return fail(502, "Couldn't cancel your subscription, so the account was not deleted. Try again or contact support.");
  }
  await audit(null, 'user.self-delete', auth.user.id);
  (await cookies()).set(SESSION_COOKIE, '', { path: process.env.NEXT_PUBLIC_BASE_PATH || '/', maxAge: 0 });
  return json({ ok: true });
}
