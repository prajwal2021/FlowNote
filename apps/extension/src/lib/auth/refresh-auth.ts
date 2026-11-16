import { apiRequest } from './api-request';
import { readAuth } from './read-auth';
import type { AuthUser } from './stored-auth';
import { writeAuth } from './write-auth';

export async function refreshAuth(): Promise<void> {
  const auth = await readAuth();
  if (!auth) return;
  let response: Response;
  try {
    response = await apiRequest('/api/auth/me');
  } catch {
    return;
  }
  if (!response.ok) return;
  const { user } = (await response.json()) as { user: AuthUser };
  await writeAuth({ token: auth.token, user });
}
