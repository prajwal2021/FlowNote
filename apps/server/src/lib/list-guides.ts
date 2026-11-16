import { query } from './db';
import type { GuideRow } from '@/components/guide-table';

export async function listGuides(opts: { ownerId?: string; q?: string }): Promise<GuideRow[]> {
  const params: unknown[] = [];
  const where: string[] = [];
  if (opts.ownerId) {
    params.push(opts.ownerId);
    where.push(`g.owner_id = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q}%`);
    where.push(`g.title ilike $${params.length}`);
  }
  return query<GuideRow>(
    `select g.id, g.title, g.step_count as "stepCount", g.client_updated_at as "updatedAt", g.deleted_by_user as "deleted",
            g.has_files as "hasFiles", u.id as "ownerId", u.email as "ownerEmail", u.name as "ownerName"
     from guides g join users u on u.id = g.owner_id
     ${where.length ? `where ${where.join(' and ')}` : ''}
     order by g.client_updated_at desc nulls last limit 1000`,
    params,
  );
}
