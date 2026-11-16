import { desktopCapturer } from 'electron';

export interface MeetingSourceOption {
  id: string;
  name: string;
  kind: 'window' | 'screen';
  thumbnail: string;
  appIcon: string | null;
}

const THUMBNAIL = { width: 320, height: 200 };

export async function meetingSources(): Promise<MeetingSourceOption[]> {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: THUMBNAIL,
    fetchWindowIcons: true,
  });

  return sources
    .filter((source) => source.name.trim() !== '')
    .map((source) => ({
      id: source.id,
      name: source.name,
      kind: source.id.startsWith('screen:') ? ('screen' as const) : ('window' as const),
      thumbnail: source.thumbnail.isEmpty() ? '' : source.thumbnail.toDataURL(),
      appIcon: source.appIcon && !source.appIcon.isEmpty() ? source.appIcon.toDataURL() : null,
    }));
}
