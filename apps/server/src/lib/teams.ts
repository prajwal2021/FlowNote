import type { NextResponse } from 'next/server';
import { query, queryOne } from './db';
import { fail } from './http';
import type { GuideRow } from '@/components/guide-table';

export type TeamRole = 'owner' | 'member';

export interface TeamSummary {
  id: string;
  name: string;
  role: TeamRole;
  memberCount: number;
  guideCount: number;
  createdAt: Date;
}

export interface TeamMemberRow {
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  addedAt: Date;
}

export const UUID = /^[0-9a-f-]{36}$/;

export function isTeamRole(value: unknown): value is TeamRole {
  return value === 'owner' || value === 'member';
}

export async function memberRole(teamId: string, userId: string): Promise<TeamRole | null> {
  if (!UUID.test(teamId)) return null;
  const row = await queryOne<{ role: TeamRole }>('select role from team_members where team_id = $1 and user_id = $2', [teamId, userId]);
  return row?.role ?? null;
}

export async function requireTeamMember(teamId: string, userId: string): Promise<{ role: TeamRole } | { response: NextResponse }> {
  const role = await memberRole(teamId, userId);
  return role ? { role } : { response: fail(403, 'You are not a member of this team.') };
}

export async function requireTeamOwner(teamId: string, userId: string): Promise<{ role: TeamRole } | { response: NextResponse }> {
  const result = await requireTeamMember(teamId, userId);
  if ('response' in result) return result;
  return result.role === 'owner' ? result : { response: fail(403, 'Only a team owner can do this.') };
}

export async function otherOwnerExists(teamId: string, userId: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    "select count(*)::int as n from team_members where team_id = $1 and role = 'owner' and user_id <> $2",
    [teamId, userId],
  );
  return (row?.n ?? 0) > 0;
}

export function listMyTeams(userId: string): Promise<TeamSummary[]> {
  return query<TeamSummary>(
    `select t.id, t.name, m.role, t.created_at as "createdAt",
            (select count(*)::int from team_members tm where tm.team_id = t.id) as "memberCount",
            (select count(*)::int from guides g where g.team_id = t.id and not g.deleted_by_user) as "guideCount"
     from team_members m join teams t on t.id = m.team_id
     where m.user_id = $1
     order by t.name`,
    [userId],
  );
}

export function listTeamMembers(teamId: string): Promise<TeamMemberRow[]> {
  return query<TeamMemberRow>(
    `select u.id as "userId", u.email, u.name, m.role, m.added_at as "addedAt"
     from team_members m join users u on u.id = m.user_id
     where m.team_id = $1
     order by m.role, u.email`,
    [teamId],
  );
}

export function listTeamGuides(teamId: string, q?: string): Promise<GuideRow[]> {
  const params: unknown[] = [teamId];
  let search = '';
  if (q) {
    params.push(`%${q}%`);
    search = `and (g.title ilike $${params.length} or g.description ilike $${params.length})`;
  }
  return query<GuideRow>(
    `select g.id, g.title, g.step_count as "stepCount", g.client_updated_at as "updatedAt", g.deleted_by_user as "deleted",
            g.has_files as "hasFiles", u.id as "ownerId", u.email as "ownerEmail", u.name as "ownerName"
     from guides g join users u on u.id = g.owner_id
     where g.team_id = $1 and not g.deleted_by_user ${search}
     order by g.client_updated_at desc nulls last limit 1000`,
    params,
  );
}

export function searchMyTeamGuides(userId: string, q: string): Promise<(GuideRow & { teamId: string; teamName: string })[]> {
  return query<GuideRow & { teamId: string; teamName: string }>(
    `select g.id, g.title, g.step_count as "stepCount", g.client_updated_at as "updatedAt", g.deleted_by_user as "deleted",
            g.has_files as "hasFiles", u.id as "ownerId", u.email as "ownerEmail", u.name as "ownerName",
            t.id as "teamId", t.name as "teamName"
     from guides g
     join users u on u.id = g.owner_id
     join teams t on t.id = g.team_id
     join team_members m on m.team_id = t.id and m.user_id = $1
     where not g.deleted_by_user and (g.title ilike $2 or g.description ilike $2)
     order by t.name, g.client_updated_at desc nulls last limit 1000`,
    [userId, `%${q}%`],
  );
}

export function listPublishableGuides(userId: string, teamId: string): Promise<{ id: string; title: string }[]> {
  return query<{ id: string; title: string }>(
    `select id, title from guides
     where owner_id = $1 and not deleted_by_user and (team_id is null or team_id <> $2)
     order by client_updated_at desc nulls last limit 200`,
    [userId, teamId],
  );
}
