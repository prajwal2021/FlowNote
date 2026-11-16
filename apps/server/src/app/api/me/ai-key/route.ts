import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { decryptSecret, encryptSecret } from '@/lib/secrets';

export { OPTIONS } from '@/lib/cors';

interface Row {
  openai_key_enc: string | null;
  updatedAt: number;
}

async function current(userId: string): Promise<Row | null> {
  return queryOne<Row>(
    'select openai_key_enc, (extract(epoch from updated_at) * 1000)::float8 as "updatedAt" from user_ai_keys where user_id = $1',
    [userId],
  );
}

export async function GET() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const row = await current(auth.user.id);
  let key: string | null = null;
  if (row?.openai_key_enc) {
    try {
      key = decryptSecret(row.openai_key_enc);
    } catch {
      key = null;
    }
  }
  return json({ key, updatedAt: row?.updatedAt ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { key?: unknown } | null;
  const key = typeof body?.key === 'string' ? body.key.trim() : '';
  if (key.length < 8 || key.length > 400 || /\s/.test(key)) return fail(400, 'That does not look like an API key.');
  await query(
    `insert into user_ai_keys (user_id, openai_key_enc, updated_at) values ($1, $2, now())
     on conflict (user_id) do update set openai_key_enc = excluded.openai_key_enc, updated_at = now()`,
    [auth.user.id, encryptSecret(key)],
  );
  const row = await current(auth.user.id);
  return json({ updatedAt: row?.updatedAt ?? null });
}

export async function DELETE() {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  await query(
    `insert into user_ai_keys (user_id, openai_key_enc, updated_at) values ($1, null, now())
     on conflict (user_id) do update set openai_key_enc = null, updated_at = now()`,
    [auth.user.id],
  );
  const row = await current(auth.user.id);
  return json({ updatedAt: row?.updatedAt ?? null });
}
