'use client';

import { Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Badge, Button, Field, Modal } from './ui';
import { withBase } from '@/lib/base-path';

export interface PanelMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'member';
}

export function TeamMembersPanel({ teamId, members, canManage, selfId }: { teamId: string; members: PanelMember[]; canManage: boolean; selfId: string }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setError('');
    const response = await fetch(withBase(url), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? 'Something went wrong.');
      return false;
    }
    router.refresh();
    return true;
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await call(`/api/teams/${teamId}/members`, 'POST', { email: form.get('email'), role: form.get('role') });
    if (ok) setInviting(false);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold">Members</h2>
        {canManage && (
          <Button variant="outline" onClick={() => setInviting(true)}>
            <UserPlus size={15} /> Invite
          </Button>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-sm font-medium text-status-bad-foreground">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Person</th>
              <th className="px-3 py-3 font-medium">Role</th>
              {canManage && <th className="px-5 py-3 text-right font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => (
              <tr key={member.userId} className="transition-colors hover:bg-secondary/40">
                <td className="px-5 py-3.5">
                  <div className="font-medium">{member.name || member.email}</div>
                  {member.name && <div className="text-xs text-muted-foreground">{member.email}</div>}
                </td>
                <td className="px-3 py-3.5">
                  {canManage ? (
                    <select
                      aria-label={`Role for ${member.email}`}
                      value={member.role}
                      onChange={(event) => void call(`/api/teams/${teamId}/members/${member.userId}`, 'PATCH', { role: event.target.value })}
                      className="h-8 rounded-lg border border-input bg-card px-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
                    >
                      <option value="member">Member</option>
                      <option value="owner">Owner</option>
                    </select>
                  ) : (
                    <Badge tone={member.role === 'owner' ? 'red' : 'neutral'}>{member.role === 'owner' ? 'Owner' : 'Member'}</Badge>
                  )}
                </td>
                {canManage && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      {member.userId !== selfId && (
                        <button
                          aria-label={`Remove ${member.email}`}
                          title="Remove from team"
                          onClick={() => void call(`/api/teams/${teamId}/members/${member.userId}`, 'DELETE')}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={inviting} title="Invite a member" onClose={() => setInviting(false)}>
        <form onSubmit={invite} className="space-y-4">
          <Field name="email" label="Email" type="email" required autoFocus />
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">Role</span>
            <select name="role" defaultValue="member" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20">
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">They need a FlowNote account already. There is no public signup.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setInviting(false)}>
              Cancel
            </Button>
            <Button type="submit">Invite</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
