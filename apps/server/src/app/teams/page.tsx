import { Users } from 'lucide-react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { GuideTable, type GuideRow } from '@/components/guide-table';
import { TeamCreator } from '@/components/team-creator';
import { Badge } from '@/components/ui';
import { requirePageUser } from '@/lib/require-page-user';
import { listMyTeams, searchMyTeamGuides } from '@/lib/teams';

export const dynamic = 'force-dynamic';

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageUser('/teams');
  const { q } = await searchParams;
  const term = q?.trim() ?? '';
  const [teams, hits] = await Promise.all([listMyTeams(user.id), term ? searchMyTeamGuides(user.id, term) : Promise.resolve([])]);

  const grouped = new Map<string, { name: string; rows: GuideRow[] }>();
  for (const hit of hits) {
    const group = grouped.get(hit.teamId) ?? { name: hit.teamName, rows: [] };
    group.rows.push(hit);
    grouped.set(hit.teamId, group);
  }

  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Teams</h1>
            <p className="mt-1 text-sm text-muted-foreground">A team library is a shared shelf: publish one of your guides into it and every member can read it.</p>
          </div>
          <TeamCreator />
        </div>

        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={term}
            placeholder="Search guides across all your teams"
            className="h-9 w-80 rounded-lg border border-input bg-field px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
          />
          <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90">Search</button>
          {term && (
            <Link href="/teams" className="h-9 rounded-lg px-3 text-sm leading-9 text-muted-foreground hover:text-foreground">
              Clear
            </Link>
          )}
        </form>

        {term ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {hits.length === 0 ? 'No guides match that search.' : `${hits.length} guide${hits.length === 1 ? '' : 's'} matching “${term}” by title or description.`}
            </p>
            {[...grouped.entries()].map(([teamId, group]) => (
              <section key={teamId} className="space-y-2">
                <Link href={`/teams/${teamId}`} className="text-sm font-semibold hover:underline">
                  {group.name}
                </Link>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
                  <GuideTable rows={group.rows} showOwner />
                </div>
              </section>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <section className="flex flex-col items-center rounded-2xl border border-border bg-card px-5 py-14 text-center shadow-sm shadow-black/[0.03]">
            <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-icon-tile text-primary">
              <Users size={20} />
            </span>
            <p className="text-sm font-medium">No teams yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">Create a team to share guides with colleagues without making a public link.</p>
          </section>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03] transition-colors hover:bg-secondary/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{team.name}</span>
                  {team.role === 'owner' && <Badge tone="red">Owner</Badge>}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {team.memberCount} member{team.memberCount === 1 ? '' : 's'} · {team.guideCount} guide{team.guideCount === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
