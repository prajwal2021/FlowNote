import type { TranscriptionSettings } from '@/core/capture/voice/read-transcription-settings';
import { createTranscriber } from '@/core/capture/voice/transcribe';
import { logger } from '@/core/logger';
import { generateMeetingInsights, type MeetingAiConfig } from './generate-meeting-insights';
import { meetingStore } from './meeting-store';
import { mergeTracks, type Track } from './merge-tracks';
import { trackOffsetSec } from './track-offset';
import { type TrackAudio, transcribeTrack } from './transcribe-track';
import type { MeetingSpeaker } from './types';

interface MeetingTrackInput {
  speaker: MeetingSpeaker;
  audio: TrackAudio;
  audioEpochMs: number | null;
}

export interface FinishMeetingInput {
  meetingId: string;
  startedAt: number;
  tracks: readonly MeetingTrackInput[];
  transcription: TranscriptionSettings;
  ai: MeetingAiConfig | null;
  onProgress?: (done: number, total: number) => void;
}

export async function finishMeeting(input: FinishMeetingInput): Promise<void> {
  const { meetingId, startedAt, tracks, transcription, ai } = input;

  if (!transcription.apiKey) {
    await meetingStore.setMeetingStatus(meetingId, 'failed', 'no-api-key');
    return;
  }

  const transcribe = createTranscriber(transcription);
  const done = new Map<MeetingSpeaker, number>();
  const totals = new Map<MeetingSpeaker, number>();
  const report = () => {
    const finished = [...done.values()].reduce((sum, value) => sum + value, 0);
    const total = [...totals.values()].reduce((sum, value) => sum + value, 0);
    if (total > 0) input.onProgress?.(finished, total);
  };

  const built: Track[] = [];
  for (const track of tracks) {
    if (track.audio.pcm.length === 0) continue;
    const lines = await transcribeTrack(track.audio, transcribe, (finished, total) => {
      done.set(track.speaker, finished);
      totals.set(track.speaker, total);
      report();
    });
    built.push({ speaker: track.speaker, offsetSec: trackOffsetSec(track.audioEpochMs, startedAt), lines });
  }

  const segments = mergeTracks(meetingId, built, () => crypto.randomUUID());
  await meetingStore.addSegments(segments);

  if (segments.length === 0) {
    await meetingStore.setMeetingStatus(meetingId, 'failed', 'no-speech');
    return;
  }

  await meetingStore.setMeetingStatus(meetingId, 'ready');

  if (!ai) return;
  try {
    const insights = await generateMeetingInsights(meetingId, segments, ai);
    if (insights) await meetingStore.saveInsights(insights);
  } catch (error) {
    logger.error('meetings: insights could not be generated', error);
  }
}
