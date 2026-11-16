import type { MeetingSegment, MeetingSpeaker } from './types';

export interface TrackLine {
  start: number;
  end: number;
  text: string;
}

export interface Track {
  speaker: MeetingSpeaker;
  offsetSec: number;
  lines: TrackLine[];
}

const MERGE_GAP_S = 1.2;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function mergeTracks(meetingId: string, tracks: readonly Track[], id: () => string): MeetingSegment[] {
  const flat = tracks.flatMap((track) =>
    track.lines
      .map((line) => ({
        speaker: track.speaker,
        start: line.start + track.offsetSec,
        end: line.end + track.offsetSec,
        text: clean(line.text),
      }))
      .filter((line) => line.text !== '' && line.end > line.start && line.end > 0)
      .map((line) => ({ ...line, start: Math.max(0, line.start) })),
  );

  flat.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Omit<MeetingSegment, 'id' | 'meetingId'>[] = [];
  for (const line of flat) {
    const last = merged[merged.length - 1];
    if (last && last.speaker === line.speaker && line.start - last.end <= MERGE_GAP_S) {
      last.end = Math.max(last.end, line.end);
      last.text = `${last.text} ${line.text}`;
      continue;
    }
    merged.push({ ...line });
  }

  return merged.map((segment) => ({ id: id(), meetingId, ...segment }));
}
