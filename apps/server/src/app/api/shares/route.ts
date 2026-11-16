import { randomBytes, randomUUID } from 'node:crypto';
import { Readable, Transform } from 'node:stream';
import { query } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { deleteObject, publicUrl, putObject, shareKey } from '@/lib/storage';

export { OPTIONS } from '@/lib/cors';

const MAX_BYTES = 1024 * 1024 * 1024;
const KINDS = new Set(['guide', 'document', 'video', 'file']);
const MIMES = /^[a-z]+\/[a-z0-9.+-]+$/i;

export async function GET(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const all = new URL(request.url).searchParams.get('all') === '1' && auth.user.role === 'admin';
  const rows = await query<{ token: string }>(
    `select s.id, s.token, s.title, s.kind, s.mime, s.size::float as size, s.created_at as "createdAt",
            u.email as "ownerEmail"
     from shares s join users u on u.id = s.owner_id
     where s.revoked_at is null ${all ? '' : 'and s.owner_id = $1'}
     order by s.created_at desc limit 500`,
    all ? [] : [auth.user.id],
  );
  return json({ shares: rows.map((row) => ({ ...row, url: `${publicUrl()}/s/${row.token}` })) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  if (auth.user.mustChangePassword) return fail(403, 'Change your password before sharing.');
  const mime = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!MIMES.test(mime)) return fail(400, 'A content type is required.');
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) return fail(413, 'File is too large (limit 1 GB).');
  if (!request.body) return fail(400, 'No file received.');
  const decode = (name: string) => {
    const raw = request.headers.get(name);
    try {
      return raw ? decodeURIComponent(raw) : '';
    } catch {
      return raw ?? '';
    }
  };
  const title = decode('x-flownote-title').trim().slice(0, 200) || 'Untitled';
  const kindHeader = decode('x-flownote-kind');
  const kind = KINDS.has(kindHeader) ? kindHeader : 'file';
  const fileName = decode('x-flownote-file-name').replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'file';
  const id = randomUUID();
  let size = 0;
  const counter = new Transform({
    transform(chunk, _enc, callback) {
      size += chunk.length;
      if (size > MAX_BYTES) callback(new Error('too large'));
      else callback(null, chunk);
    },
  });
  const source = Readable.fromWeb(request.body as never);
  source.on('error', (error) => counter.destroy(error));
  try {
    await putObject(shareKey(id), source.pipe(counter), mime);
  } catch {
    await deleteObject(shareKey(id));
    return fail(413, 'Upload failed or file is too large.');
  }
  if (size === 0) {
    await deleteObject(shareKey(id));
    return fail(400, 'The file is empty.');
  }
  const token = randomBytes(24).toString('base64url');
  await query('insert into shares (id, token, owner_id, title, kind, mime, size, file_name) values ($1, $2, $3, $4, $5, $6, $7, $8)', [
    id,
    token,
    auth.user.id,
    title,
    kind,
    mime,
    size,
    fileName,
  ]);
  return json({ id, url: `${publicUrl()}/s/${token}` }, 201);
}
