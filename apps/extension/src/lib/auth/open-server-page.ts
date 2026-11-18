import { createTab } from '@/lib/browser-api/create-tab';
import { SERVER_URL } from './server-url';

export async function openServerPage(path: string): Promise<void> {
  await createTab({ url: `${SERVER_URL}${path}` });
}
