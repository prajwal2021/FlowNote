'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button } from './ui';
import { withBase } from '@/lib/base-path';

export function TeamPublishForm({ teamId, guides }: { teamId: string; guides: { id: string; title: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (guides.length === 0) {
    return <p className="text-xs text-muted-foreground">All of your guides are already in this team.</p>;
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const guideId = String(new FormData(event.currentTarget).get('guideId') ?? '');
    setBusy(true);
    setError('');
    const response = await fetch(withBase(`/api/teams/${teamId}/guides`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? 'Could not publish that guide.');
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={publish} className="flex flex-wrap items-center gap-2">
      <select
        name="guideId"
        aria-label="Guide to publish"
        className="h-9 w-72 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
      >
        {guides.map((guide) => (
          <option key={guide.id} value={guide.id}>
            {guide.title}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" disabled={busy}>
        <Upload size={15} /> Publish to team
      </Button>
      {error && <span role="alert" className="text-sm font-medium text-status-bad-foreground">{error}</span>}
    </form>
  );
}
