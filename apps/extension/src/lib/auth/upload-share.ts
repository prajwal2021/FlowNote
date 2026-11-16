import { i18n } from '@flownote/core/env';
import { apiRequest } from './api-request';

interface ShareMeta {
  title: string;
  kind: 'guide' | 'document' | 'video' | 'file';
  fileName: string;
}

export async function uploadShare(blob: Blob, meta: ShareMeta): Promise<{ url: string }> {
  let response: Response;
  try {
    response = await apiRequest('/api/shares', {
      method: 'POST',
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'X-FlowNote-Title': encodeURIComponent(meta.title),
        'X-FlowNote-Kind': meta.kind,
        'X-FlowNote-File-Name': encodeURIComponent(meta.fileName),
      },
      body: blob,
    });
  } catch {
    throw new Error(i18n.t('account.serverUnreachable'));
  }
  const body = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !body.url) throw new Error(body.error ?? i18n.t('account.serverUnreachable'));
  return { url: body.url };
}
