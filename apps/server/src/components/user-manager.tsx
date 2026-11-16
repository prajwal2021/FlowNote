'use client';

import { Check, Copy, Files, KeyRound, Snowflake, Sun, Trash2, UserPlus } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Field, Modal, Switch } from './ui';
import { withBase } from '@/lib/base-path';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'frozen';
  canUseAi: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  shareCount: number;
  aiRequests30d: number;
}

type Confirm = { kind: 'freeze' | 'unfreeze' | 'reset' | 'remove'; user: ManagedUser } | null;

const COPY = {
  freeze: { title: 'Freeze account', body: 'They are signed out immediately and cannot sign in until you unfreeze the account. Their shared links stop opening for them.', action: 'Freeze' },
  unfreeze: { title: 'Unfreeze account', body: 'They will be able to sign in again.', action: 'Unfreeze' },
  reset: { title: 'Reset password', body: 'A new temporary password is generated and shown once. They are signed out everywhere and must choose a new password at next sign in.', action: 'Reset password' },
  remove: { title: 'Remove user', body: 'This permanently deletes the account and every link they shared. This cannot be undone.', action: 'Remove user' },
} as const;

export function UserManager({ selfId }: { selfId: string }) {
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(withBase('/api/admin/users'));
    if (response.ok) setUsers((await response.json()).users);
    else setError('Could not load users.');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function call(url: string, method: string, body?: unknown) {
    setError('');
    const response = await fetch(withBase(url), { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? 'Something went wrong.');
      return null;
    }
    return data;
  }

  async function runConfirm() {
    if (!confirm) return;
    const { kind, user } = confirm;
    setConfirm(null);
    if (kind === 'remove') await call(`/api/admin/users/${user.id}`, 'DELETE');
    else if (kind === 'reset') {
      const data = await call(`/api/admin/users/${user.id}/reset-password`, 'POST');
      if (data) setSecret({ email: user.email, password: data.temporaryPassword });
    } else await call(`/api/admin/users/${user.id}`, 'PATCH', { status: kind === 'freeze' ? 'frozen' : 'active' });
    void load();
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await call('/api/admin/users', 'POST', {
      email: form.get('email'),
      name: form.get('name'),
      role: form.get('role'),
      canUseAi: form.get('canUseAi') === 'on',
    });
    if (!data) return;
    setCreating(false);
    setSecret({ email: data.email, password: data.temporaryPassword });
    void load();
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Manage users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Only people you add here can sign in. There is no public signup.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus size={15} /> Add user
        </Button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-sm font-medium text-status-bad-foreground">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium" title="Lets this user use FlowNote AI (the shared server key). Users can always add their own key instead.">FlowNote AI</th>
                <th className="px-3 py-3 font-medium">Last sign in</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users === null && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">Loading…</td>
                </tr>
              )}
              {users?.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{user.name || user.email}</div>
                    {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                    {user.mustChangePassword && <div className="mt-0.5 text-[11px] text-badge-edited-foreground">Temporary password not changed yet</div>}
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge tone={user.role === 'admin' ? 'red' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'User'}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge tone={user.status === 'active' ? 'green' : 'amber'}>{user.status === 'active' ? 'Active' : 'Frozen'}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <Switch
                      label={`FlowNote AI for ${user.email}`}
                      checked={user.canUseAi}
                      onChange={async (next) => {
                        await call(`/api/admin/users/${user.id}`, 'PATCH', { canUseAi: next });
                        void load();
                      }}
                    />
                    {user.canUseAi && <div className="mt-1 text-[11px] text-muted-foreground">{user.aiRequests30d} requests / 30 days</div>}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-muted-foreground">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={withBase(`/admin/guides?owner=${user.id}`)}
                        aria-label="View their guides"
                        title="View their guides"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Files size={15} />
                      </a>
                      <IconButton label="Reset password" onClick={() => setConfirm({ kind: 'reset', user })}>
                        <KeyRound size={15} />
                      </IconButton>
                      {user.id !== selfId && (
                        <>
                          <IconButton
                            label={user.status === 'active' ? 'Freeze account' : 'Unfreeze account'}
                            onClick={() => setConfirm({ kind: user.status === 'active' ? 'freeze' : 'unfreeze', user })}
                          >
                            {user.status === 'active' ? <Snowflake size={15} /> : <Sun size={15} />}
                          </IconButton>
                          <IconButton label="Remove user" danger onClick={() => setConfirm({ kind: 'remove', user })}>
                            <Trash2 size={15} />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating} title="Add a user" onClose={() => setCreating(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field name="email" label="Email" type="email" required autoFocus />
          <Field name="name" label="Name (optional)" />
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">Role</span>
            <select name="role" defaultValue="user" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="canUseAi" className="size-4 accent-[#CC0000]" />
            Allow FlowNote AI
          </label>
          <p className="text-xs text-muted-foreground">Without it, a user can still use AI by adding their own OpenAI key. If they add one, theirs is used first.</p>
          <p className="text-xs text-muted-foreground">A temporary password is generated and shown once. They must change it at first sign in.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit">Create user</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} title={confirm ? COPY[confirm.kind].title : ''} onClose={() => setConfirm(null)}>
        {confirm && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirm.user.email}</span>
              <br />
              {COPY[confirm.kind].body}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant={confirm.kind === 'remove' ? 'danger' : 'primary'} onClick={runConfirm}>{COPY[confirm.kind].action}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!secret} title="Temporary password" onClose={() => setSecret(null)}>
        {secret && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Give this to <span className="font-medium text-foreground">{secret.email}</span>. It is shown only once and they must change it when they sign in.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5">
              <code className="flex-1 select-all font-mono text-base tracking-wide">{secret.password}</code>
              <Button variant="outline" onClick={copySecret} className="h-8 px-3 text-xs">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setSecret(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function IconButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 text-muted-foreground transition-colors ${danger ? 'hover:bg-primary/10 hover:text-primary' : 'hover:bg-secondary hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
