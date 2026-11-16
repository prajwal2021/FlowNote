import { readTranscriptionSettings } from '@flownote/core/capture/voice/read-transcription-settings';
import { readVoiceSettings } from '@flownote/core/capture/voice/read-voice-settings';
import { logger } from '@flownote/core/logger';
import { finishMeeting } from '@flownote/core/meetings/finish-meeting';
import { meetingStore } from '@flownote/core/meetings/meeting-store';
import { readMeetingAi } from '@flownote/core/meetings/read-meeting-ai';
import type { MeetingSource } from '@flownote/core/meetings/types';
import { MeetingRecorder } from './meeting-recorder';

export interface MeetingSessionEvents {
  onLevel(speaker: 'me' | 'others', level: number): void;
  onEnded(meetingId: string): void;
  onProgress(done: number, total: number): void;
}

export class MeetingSession {
  private recorder: MeetingRecorder | null = null;
  private meetingId: string | null = null;
  private startedAt = 0;

  constructor(private readonly events: MeetingSessionEvents) {}

  get activeMeetingId(): string | null {
    return this.meetingId;
  }

  async start(sourceId: string | null, title: string): Promise<string> {
    const support = await window.flownote.meetings.systemAudio();
    if (sourceId) await window.flownote.meetings.choose(sourceId);

    const meetingId = crypto.randomUUID();
    const recorder = new MeetingRecorder({
      onFrame: (atSec, blob, width, height, mimeType) => {
        void meetingStore
          .addFrame({ id: crypto.randomUUID(), meetingId, atSec, blob, width, height, mimeType })
          .catch((error) => logger.error('meetings: a frame could not be saved', error));
      },
      onLevel: (speaker, level) => this.events.onLevel(speaker, level),
      onEnded: () => void this.stop(),
    });

    const voice = await readVoiceSettings();
    try {
      await recorder.start(voice.microphoneId, support !== 'unsupported');
    } catch (error) {
      await window.flownote.meetings.choose(null);
      recorder.release();
      throw error;
    }

    const name = title || recorder.sourceLabel;
    const source: MeetingSource = { app: { name }, window: { title: recorder.sourceLabel || null } };
    await meetingStore.createMeeting(meetingId, name, source, !recorder.capturedSystemAudio);
    await window.flownote.meetings.choose(null);

    this.recorder = recorder;
    this.meetingId = meetingId;
    this.startedAt = Date.now();
    return meetingId;
  }

  notified(): void {
    if (this.meetingId) void meetingStore.markNotified(this.meetingId);
  }

  async stop(): Promise<void> {
    const recorder = this.recorder;
    const meetingId = this.meetingId;
    const startedAt = this.startedAt;
    this.recorder = null;
    this.meetingId = null;
    if (!recorder || !meetingId) return;

    const tracks = recorder.stop();
    await meetingStore.endMeeting(meetingId);
    this.events.onEnded(meetingId);

    try {
      await finishMeeting({
        meetingId,
        startedAt,
        tracks: [
          ...(tracks.mine
            ? [{ speaker: 'me' as const, audio: tracks.mine, audioEpochMs: tracks.mine.audioEpochMs }]
            : []),
          ...(tracks.theirs
            ? [{ speaker: 'others' as const, audio: tracks.theirs, audioEpochMs: tracks.theirs.audioEpochMs }]
            : []),
        ],
        transcription: await readTranscriptionSettings(),
        ai: await readMeetingAi(),
        onProgress: (done, total) => this.events.onProgress(done, total),
      });
    } catch (error) {
      logger.error('meetings: the recording could not be processed', error);
      await meetingStore.setMeetingStatus(meetingId, 'failed', 'processing-failed');
    }
  }
}
