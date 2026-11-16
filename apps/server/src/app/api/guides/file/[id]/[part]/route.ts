import { queryOne } from '@/lib/db';
import { fail, requireUser } from '@/lib/http';
import { getObject, guideKey } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; part: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id, part } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || (part !== 'html' && part !== 'bundle')) return fail(404, 'Not found.');
  const guide = await queryOne<{ owner_id: string; title: string }>('select owner_id, title from guides where id = $1', [id]);
  if (!guide || (guide.owner_id !== auth.user.id && auth.user.role !== 'admin')) return fail(404, 'Not found.');
  const object = await getObject(guideKey(id, part));
  if (!object) return fail(404, 'Not found.');
  const safe = guide.title.replace(/[^\w.\- ]+/g, '_').slice(0, 100) || 'guide';
  const html = part === 'html';
  return new Response(object.body, {
    headers: {
      'Content-Type': html ? 'text/html; charset=utf-8' : 'application/octet-stream',
      'Content-Length': String(object.size),
      'Content-Disposition': `${html ? 'inline' : 'attachment'}; filename="${safe}.${html ? 'html' : 'flownote'}"`,
      'Content-Security-Policy': "sandbox allow-scripts allow-popups; frame-ancestors 'self'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
