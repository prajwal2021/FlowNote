import { queryOne } from '@/lib/db';
import { fail, requireUser } from '@/lib/http';
import { getObject, shareKey } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { token } = await params;
  const share = await queryOne<{ id: string; mime: string; file_name: string; kind: string }>(
    'select id, mime, file_name, kind from shares where token = $1 and revoked_at is null',
    [token],
  );
  if (!share) return fail(404, 'This link is no longer available.');
  const object = await getObject(shareKey(share.id));
  if (!object) return fail(404, 'This link is no longer available.');
  const inline = share.mime === 'text/html' || share.mime === 'application/pdf' || share.mime.startsWith('video/') || share.mime.startsWith('image/');
  return new Response(object.body, {
    headers: {
      'Content-Type': share.mime,
      'Content-Length': String(object.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${share.file_name}"`,
      'Content-Security-Policy': share.mime === 'application/pdf' ? "frame-ancestors 'self'" : "sandbox allow-scripts allow-popups; frame-ancestors 'self'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
