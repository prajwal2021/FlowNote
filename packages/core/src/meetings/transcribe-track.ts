import { buildBatches, mergeGaps } from '@/core/capture/voice/batching';
import { detectSpeechByEnergy } from '@/core/capture/voice/energy-gate';
import type { TranscriptionResponse } from '@/core/capture/voice/types';
import { encodeWav } from '@/core/capture/voice/wav';
import { logger } from '@/core/logger';
import type { TrackLine } from './merge-tracks';

export interface TrackAudio {
  pcm: Int16Array;
  sampleRate: number;
}

function sliceSpeech(pcm: Int16Array, segments: readonly { start: number; end: number }[], rate: number): Int16Array {
  const parts = segments.map((s) =>
    pcm.subarray(Math.max(0, Math.floor(s.start * rate)), Math.min(pcm.length, Math.ceil(s.end * rate))),
  );
  const out = new Int16Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export async function transcribeTrack(
  audio: TrackAudio,
  transcribe: (wav: Blob) => Promise<TranscriptionResponse>,
  onProgress?: (done: number, total: number) => void,
): Promise<TrackLine[]> {
  const { pcm, sampleRate } = audio;
  if (pcm.length === 0 || sampleRate <= 0) return [];

  const speech = mergeGaps(await detectSpeechByEnergy(pcm, sampleRate));
  const { batches } = buildBatches(speech);
  const lines: TrackLine[] = [];

  for (const [index, batch] of batches.entries()) {
    let response: TranscriptionResponse;
    try {
      response = await transcribe(encodeWav(sliceSpeech(pcm, batch.segments, sampleRate), sampleRate));
    } catch (error) {
      logger.error('meetings: a transcription batch failed', error);
      onProgress?.(index + 1, batches.length);
      continue;
    }

    let consumed = 0;
    for (const segment of response.segments ?? []) {
      const text = segment.text.trim();
      if (!text) continue;
      const spoken = findAbsolute(batch.segments, segment.start);
      lines.push({ start: spoken, end: spoken + Math.max(0, segment.end - segment.start), text });
      consumed += 1;
    }
    if (consumed === 0 && response.text?.trim()) {
      const first = batch.segments[0];
      if (first) lines.push({ start: first.start, end: batch.end, text: response.text.trim() });
    }
    onProgress?.(index + 1, batches.length);
  }

  return lines.sort((a, b) => a.start - b.start);
}

function findAbsolute(segments: readonly { start: number; end: number }[], offsetInBatch: number): number {
  let remaining = offsetInBatch;
  for (const segment of segments) {
    const span = segment.end - segment.start;
    if (remaining <= span) return segment.start + Math.max(0, remaining);
    remaining -= span;
  }
  const last = segments[segments.length - 1];
  return last ? last.end : 0;
}
