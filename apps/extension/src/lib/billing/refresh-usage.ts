import { apiRequest } from '@/lib/auth/api-request';
import { readAuth } from '@/lib/auth/read-auth';
import type { Usage } from './stored-usage';
import { writeUsage } from './write-usage';

export async function refreshUsage(): Promise<void> {
  if (!(await readAuth())) return writeUsage(null);
  const response = await apiRequest('/api/billing/usage').catch(() => null);
  if (!response?.ok) return;
  const { usage } = (await response.json()) as { usage: Usage };
  const limited = usage.recordingLimit !== null && usage.recordingsUsed >= usage.recordingLimit;
  await writeUsage(usage, limited);
}
