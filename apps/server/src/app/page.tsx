import { AppHeader } from '@/components/app-header';
import { SharesList } from '@/components/shares-list';
import { requirePageUser } from '@/lib/require-page-user';

export default async function HomePage() {
  const user = await requirePageUser('/');
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin={user.role === 'admin'} />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Record guides in the FlowNote extension, then share them from here or from the extension.</p>
        </div>
        <SharesList admin={user.role === 'admin'} />
      </main>
    </>
  );
}
