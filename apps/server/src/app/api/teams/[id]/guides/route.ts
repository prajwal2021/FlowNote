import { audit } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { fail, json, requireUser } from '@/lib/http';
import { listTeamGuides, requireTeamMember, UUID } from '@/lib/teams';

export { OPTIONS } from '@/lib/cors';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamMember(id, auth.user.id);
  if ('response' in access) return access.response;
  const q = new URL(request.url).searchParams.get('q')?.trim();
  return json({ guides: await listTeamGuides(id, q || undefined) });
}

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ('response' in auth) return auth.response;
  const { id } = await params;
  const access = await requireTeamMember(id, auth.user.id);
  if ('response' in access) return access.response;
  const body = (await request.json().catch(() => null)) as { guideId?: unknown } | null;
  const guideId = typeof body?.guideId === 'string' ? body.guideId : '';
  if (!UUID.test(guideId)) return fail(400, 'A guide id is required.');
  const guide = await queryOne<{ owner_id: string; title: string }>('select owner_id, title from guides where id = $1', [guideId]);
  if (!guide) return fail(404, 'Guide not found.');
  if (guide.owner_id !== auth.user.id) return fail(403, 'Only the guide owner can publish it to a team.');
  await query('update guides set team_id = $2 where id = $1', [guideId, id]);
  await audit(auth.user.id, 'team.guide-publish', id, { guideId, title: guide.title });
  return json({ ok: true, guideId, teamId: id }, 201);
}
