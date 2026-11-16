import { queryOne } from '@/lib/db';
import { json } from '@/lib/http';

export async function GET() {
  const db = await queryOne<{ ok: number }>('select 1 as ok').catch(() => null);
  return json({ ok: db?.ok === 1 }, db ? 200 : 503);
}
