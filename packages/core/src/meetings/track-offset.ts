export function trackOffsetSec(audioEpochMs: number | null, meetingStartedAt: number): number {
  if (audioEpochMs === null) return 0;
  return (audioEpochMs - meetingStartedAt) / 1000;
}
