import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { UserManager } from '@/components/user-manager';
import { requirePageUser } from '@/lib/require-page-user';

export default async function UsersPage() {
  const user = await requirePageUser('/admin/users');
  if (user.role !== 'admin') redirect('/');
  return (
    <>
      <AppHeader name={user.name} email={user.email} admin />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <UserManager selfId={user.id} />
      </main>
    </>
  );
}
