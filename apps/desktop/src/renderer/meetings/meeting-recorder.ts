import { MicRecorder, type MicRecording } from '@flownote/core/capture/voice/mic-recorder';
import { assetUrl } from '@flownote/core/env';
import { logger } from '@flownote/core/logger';
import { grabFrame } from './meeting-frames';

const FRAME_INTERVAL_MS = 15_000;

export interface MeetingTracks {
  mine: MicRecording | null;
  theirs: MicRecording | null;
  startedAt: number;
}

export interface MeetingRecorderEvents {
  onFrame(atSec: number, blob: Blob, width: number, height: number, mimeType: string): void;
  onLevel(speaker: 'me' | 'others', level: number): void;
  onEnded(): void;
}

export class MeetingRecorder {
  private display: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private mine: MicRecorder | null = null;
  private theirs: MicRecorder | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private active = false;
  private label = '';

  constructor(private readonly events: MeetingRecorderEvents) {}

  get recording(): boolean {
    return this.active;
  }

  get capturedSystemAudio(): boolean {
    return this.theirs !== null;
  }

  get sourceLabel(): string {
    return this.label;
  }

  async start(microphoneId: string | undefined, wantSystemAudio: boolean): Promise<void> {
    if (this.active) throw new Error('A meeting is already being recorded');
    this.startedAt = Date.now();

    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: wantSystemAudio });
    this.display = display;

    for (const track of display.getVideoTracks()) {
      this.label = track.label || this.label;
      track.addEventListener('ended', () => {
        if (this.active) this.events.onEnded();
      });
    }

    const video = document.createElement('video');
    video.srcObject = new MediaStream(display.getVideoTracks());
    video.muted = true;
    await video.play().catch(() => undefined);
    this.video = video;

    const systemTracks = display.getAudioTracks();
    if (systemTracks.length > 0) {
      const theirs = new MicRecorder(assetUrl('mic-frames.js'), {
        onEpoch: () => undefined,
        onLevel: (level) => this.events.onLevel('others', level),
        onStreamEnded: () => undefined,
      });
      try {
        await theirs.start(undefined, new MediaStream(systemTracks));
        this.theirs = theirs;
      } catch (error) {
        theirs.release();
        logger.error('meetings: system audio could not be recorded', error);
      }
    }

    const mine = new MicRecorder(assetUrl('mic-frames.js'), {
      onEpoch: () => undefined,
      onLevel: (level) => this.events.onLevel('me', level),
      onStreamEnded: () => undefined,
    });
    try {
      await mine.start(microphoneId);
      this.mine = mine;
    } catch (error) {
      mine.release();
      logger.error('meetings: the microphone could not be recorded', error);
    }

    this.active = true;
    void this.captureFrame();
    this.timer = setInterval(() => void this.captureFrame(), FRAME_INTERVAL_MS);
  }

  stop(): MeetingTracks {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;

    const tracks: MeetingTracks = {
      mine: this.mine ? this.mine.stop() : null,
      theirs: this.theirs ? this.theirs.stop() : null,
      startedAt: this.startedAt,
    };

    this.mine = null;
    this.theirs = null;
    this.release();
    return tracks;
  }

  release(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.mine?.release();
    this.theirs?.release();
    this.mine = null;
    this.theirs = null;
    for (const track of this.display?.getTracks() ?? []) track.stop();
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.display = null;
    this.active = false;
  }

  private async captureFrame(): Promise<void> {
    const video = this.video;
    if (!video || !this.active) return;
    const frame = await grabFrame(video).catch(() => null);
    if (!frame) return;
    const atSec = Math.max(0, (Date.now() - this.startedAt) / 1000);
    this.events.onFrame(atSec, frame.blob, frame.width, frame.height, frame.mimeType);
  }
}
