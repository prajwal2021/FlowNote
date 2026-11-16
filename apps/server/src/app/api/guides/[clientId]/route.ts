import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { guideKey, putObject } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

const CLIENT_ID = /^[\w-]{8,64}$/;
const MAX_FILE = 300 * 1024 * 1024;

interface Meta {
  title?: string;
  description?: string;
  stepCount?: number;
  createdAt?: number;
  updatedAt?: number;
  deleted?: boolean;
  hash?: string;
  baseHash?: string | null;
}

function toDate(value: unknown): Date | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value) : null;
}

const PARTS = [
  ['html', 'text/html'],
  ['bundle', 'application/octet-stream'],
  ['snapshot', 'application/zip'],
] as const;

export async function PUT(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { clientId } = await params;
  if (!CLIENT_ID.test(clientId)) return fail(400, 'Invalid guide id.');
  const form = await request.formData().catch(() => null);
  if (!form) return fail(400, 'Expected multipart form data.');
  let meta: Meta;
  try {
    meta = JSON.parse(String(form.get('meta') ?? '{}')) as Meta;
  } catch {
    return fail(400, 'Invalid metadata.');
  }
  const files = PARTS.map(([name]) => form.get(name)).filter((f): f is File => f instanceof File);
  if (files.some((f) => f.size > MAX_FILE)) return fail(413, 'Guide is too large.');

  const existing = await queryOne<{ content_hash: string | null }>('select content_hash from guides where owner_id = $1 and client_id = $2', [
    auth.user.id,
    clientId,
  ]);
  if (existing && meta.baseHash !== undefined && existing.content_hash && existing.content_hash !== meta.baseHash && existing.content_hash !== meta.hash) {
    return fail(409, 'This guide changed elsewhere. Sync again.');
  }

  const row = await queryOne<{ id: string }>(
    `insert into guides (owner_id, client_id, title, description, step_count, client_created_at, client_updated_at, deleted_by_user, has_files, content_hash, has_snapshot)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     on conflict (owner_id, client_id) do update set
       title = excluded.title,
       description = excluded.description,
       step_count = excluded.step_count,
       client_updated_at = excluded.client_updated_at,
       deleted_by_user = excluded.deleted_by_user,
       has_files = guides.has_files or excluded.has_files,
       has_snapshot = guides.has_snapshot or excluded.has_snapshot,
       content_hash = coalesce(excluded.content_hash, guides.content_hash),
       synced_at = now()
     returning id`,
    [
      auth.user.id,
      clientId,
      String(meta.title ?? 'Untitled').slice(0, 300),
      String(meta.description ?? '').slice(0, 2000),
      Number.isInteger(meta.stepCount) ? meta.stepCount : 0,
      toDate(meta.createdAt),
      toDate(meta.updatedAt),
      meta.deleted === true,
      form.get('html') instanceof File,
      typeof meta.hash === 'string' ? meta.hash.slice(0, 128) : null,
      form.get('snapshot') instanceof File,
    ],
  );
  if (!row) return fail(500, 'Could not save the guide.');
  for (const [name, type] of PARTS) {
    const file = form.get(name);
    if (file instanceof File) await putObject(guideKey(row.id, name), Buffer.from(await file.arrayBuffer()), type);
  }
  return json({ id: row.id });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { clientId } = await params;
  await query('update guides set deleted_by_user = true, synced_at = now() where owner_id = $1 and client_id = $2', [auth.user.id, clientId]);
  return json({ ok: true });
}
