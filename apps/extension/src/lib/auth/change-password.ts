import { i18n } from '@flownote/core/env';
import { apiRequest } from './api-request';
import { refreshAuth } from './refresh-auth';

export async function changePassword(currentPassword: string, newPassword: string): Promise<string | null> {
  let response: Response;
  try {
    response = await apiRequest('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch {
    return i18n.t('account.serverUnreachable');
  }
  if (!response.ok)
    return (
      ((await response.json().catch(() => ({}))) as { error?: string }).error ?? i18n.t('account.serverUnreachable')
    );
  await refreshAuth();
  return null;
}
