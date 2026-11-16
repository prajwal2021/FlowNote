import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { GuideTable } from '@/components/guide-table';
import { TeamMembersPanel } from '@/components/team-members-panel';
import { TeamPublishForm } from '@/components/team-publish-form';
import { Badge } from '@/components/ui';
import { queryOne } from '@/lib/db';
import { requirePageUser } from '@/lib/require-page-user';
import { listPublishableGuides, listTeamGuides, listTeamMembers, memberRole } from '@/lib/teams';

export const dynamic = 'force-dynamic';

export default async function TeamLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser(`/teams/${id}`);
  const role = await memberRole(id, user.id);
  if (!role) notFound();
  const team = await queryOne<{ id: string; name: string }>('select id, name from teams where id = $1', [id]);
  if (!team) notFound();
  const { q } = await searchParams;
  const term = q?.trim() ?? '';
  const [guides, members, mine] = await Promise.all([
    listTeamGuides(id, term || undefined),
    listTeamMembers(id),
    listPublishableGuides(user.id, id),
  ]);

  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div>
          <Link href="/teams" className="text-xs text-muted-foreground hover:text-foreground">
            ← All teams
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold">{team.name}</h1>
            {role === 'owner' && <Badge tone="red">Owner</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Guides published here are readable by every member of this team.</p>
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Team library</h2>
            <TeamPublishForm teamId={id} guides={mine} />
          </div>
          <form className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={term}
              placeholder="Search this team's guides"
              className="h-9 w-72 rounded-lg border border-input bg-field px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
            />
            <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/30 hover:bg-primary/90">Search</button>
            {term && (
              <Link href={`/teams/${id}`} className="h-9 rounded-lg px-3 text-sm leading-9 text-muted-foreground hover:text-foreground">
                Clear
              </Link>
            )}
          </form>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
            <GuideTable rows={guides} showOwner />
          </div>
        </section>

        <TeamMembersPanel teamId={id} members={members} canManage={role === 'owner'} selfId={user.id} />
      </main>
    </>
  );
}
