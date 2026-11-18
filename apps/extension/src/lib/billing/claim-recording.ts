import { logger } from '@flownote/core/logger';
import { apiRequest } from '@/lib/auth/api-request';
import type { Usage } from './stored-usage';
import { writeUsage } from './write-usage';

export async function claimRecording(): Promise<boolean> {
  let response: Response;
  try {
    response = await apiRequest('/api/billing/recordings', { method: 'POST' });
  } catch (err) {
    logger.error('Could not reach the server to count this recording', err);
    return true;
  }
  const body = (await response.json().catch(() => ({}))) as { usage?: Usage };
  if (response.status === 402) {
    await writeUsage(body.usage ?? null, true);
    return false;
  }
  if (body.usage) await writeUsage(body.usage, false);
  return response.status !== 401;
}
