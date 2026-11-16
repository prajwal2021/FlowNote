const SAMPLE_GUIDE_PREFIX = 'sample-';

export function isSampleGuide(guideId: string): boolean {
  return guideId.startsWith(SAMPLE_GUIDE_PREFIX);
}
