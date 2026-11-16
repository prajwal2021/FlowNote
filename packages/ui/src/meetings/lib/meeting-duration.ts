export function meetingDuration(startedAt: number, endedAt: number | null): number {
  if (endedAt === null) return 0;
  return Math.max(0, Math.round((endedAt - startedAt) / 1000));
}
