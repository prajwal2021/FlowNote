'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button, Field, Modal } from './ui';
import { withBase } from '@/lib/base-path';

export function TeamCreator() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name') ?? '');
    setBusy(true);
    setError('');
    const response = await fetch(withBase('/api/teams'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? 'Could not create the team.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={15} /> New team
      </Button>
      <Modal open={open} title="Create a team" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-4">
          <Field name="name" label="Team name" required autoFocus maxLength={120} />
          {error && <p role="alert" className="rounded-lg bg-status-bad px-3 py-2 text-sm font-medium text-status-bad-foreground">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              Create team
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
