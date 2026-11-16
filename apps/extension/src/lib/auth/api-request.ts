import { readAuth } from './read-auth';
import { SERVER_URL } from './server-url';
import { writeAuth } from './write-auth';

export async function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = await readAuth();
  const headers = new Headers(init.headers);
  if (auth) headers.set('Authorization', `Bearer ${auth.token}`);
  const response = await fetch(`${SERVER_URL}${path}`, { ...init, headers });
  if (response.status === 401 && auth) await writeAuth(null);
  return response;
}
