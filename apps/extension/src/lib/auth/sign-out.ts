import { writeUsage } from '@/lib/billing/write-usage';
import { apiRequest } from './api-request';
import { writeAuth } from './write-auth';

export async function signOut(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  await writeAuth(null);
  await writeUsage(null);
}
