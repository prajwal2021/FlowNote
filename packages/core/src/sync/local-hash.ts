import { getGuide } from '@/core/guides/service';

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function localGuideHash(guideId: string): Promise<string | null> {
  const data = await getGuide(guideId);
  if (!data) return null;
  const { guide, steps, screenshots } = data;
  const shots = [...screenshots.values()].map((shot) => ({
    id: shot.id,
    stepId: shot.stepId,
    width: shot.width,
    height: shot.height,
    edits: shot.edits ?? null,
  }));
  const payload = {
    title: guide.title,
    description: guide.description ?? '',
    deletedAt: guide.deletedAt,
    starred: guide.starred,
    steps: steps.map(({ aiPending: _aiPending, narratedDescription: _narrated, ...rest }) => rest),
    shots,
  };
  return sha256(JSON.stringify(payload));
}
