import { i18n } from '@flownote/core/env';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth/sign-out';
import { useAuth } from './hooks/use-auth';
import { PlanCard } from './PlanCard';

export function SettingsFooter() {
  const auth = useAuth();
  return (
    <>
      {auth.status === 'signed-in' && <PlanCard />}
      {auth.status === 'signed-in' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-[11px] text-muted-foreground">
          <span className="min-w-0 flex-1 truncate">{i18n.t('account.signedInAs', [auth.auth.user.email])}</span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 font-semibold text-foreground transition-colors hover:bg-card"
          >
            <LogOut size={12} />
            {i18n.t('account.signOut')}
          </button>
        </div>
      )}
    </>
  );
}
