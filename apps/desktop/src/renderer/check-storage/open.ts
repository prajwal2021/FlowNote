import { db } from '@flownote/core/guides/db';
import type { CheckResult } from './types';

export async function open(): Promise<CheckResult> {
  await db.open();
  const tables = db.tables.map((t) => t.name).sort();
  const expected = [
    'guideMerges',
    'guides',
    'meetingFrames',
    'meetingInsights',
    'meetingSegments',
    'meetings',
    'screenshots',
    'snapshots',
    'steps',
    'transcripts',
    'voiceClips',
  ];
  return {
    name: 'FlowNoteDB opens',
    ok: db.verno === 6 && expected.every((t) => tables.includes(t)),
    detail: `v${db.verno}, tables: ${tables.join(', ')}`,
  };
}
