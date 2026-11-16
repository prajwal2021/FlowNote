import { redirect } from 'next/navigation';
import { currentUser, type SessionUser } from './auth';

export async function requirePageUser(next = '/'): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.mustChangePassword) redirect(`/change-password?next=${encodeURIComponent(next)}`);
  return user;
}
