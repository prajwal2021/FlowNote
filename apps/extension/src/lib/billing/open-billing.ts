import { i18n } from '@flownote/core/env';
import { apiRequest } from '@/lib/auth/api-request';
import { createTab } from '@/lib/browser-api/create-tab';

export async function openBilling(pro: boolean): Promise<string | null> {
  let response: Response;
  try {
    response = await apiRequest(pro ? '/api/billing/portal' : '/api/billing/checkout', { method: 'POST' });
  } catch {
    return i18n.t('account.serverUnreachable');
  }
  const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !body.url) return body.error ?? i18n.t('account.serverUnreachable');
  await createTab({ url: body.url });
  return null;
}
