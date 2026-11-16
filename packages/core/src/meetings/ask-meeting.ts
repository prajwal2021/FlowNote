import { generateObject, jsonSchema } from 'ai';
import { createModel } from '@/core/capture/ai/provider';
import { logger } from '@/core/logger';
import { formatTranscript } from './format-transcript';
import type { MeetingAiConfig } from './generate-meeting-insights';
import { MEETING_ANSWER_PROMPT } from './meeting-prompts';
import type { MeetingAnswer, MeetingSegment } from './types';

const TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1536;

const answerSchema = jsonSchema<{ answer: string; citations: number[] }>({
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citations: { type: 'array', items: { type: 'number' } },
  },
  required: ['answer', 'citations'],
  additionalProperties: false,
});

export async function askMeeting(
  question: string,
  segments: readonly MeetingSegment[],
  config: MeetingAiConfig,
): Promise<MeetingAnswer | null> {
  const asked = question.trim();
  if (!asked || segments.length === 0) return null;

  const prompt = MEETING_ANSWER_PROMPT.replace('{{you}}', config.youLabel)
    .replace('{{others}}', config.othersLabel)
    .replace('{{transcript}}', () => formatTranscript(segments, config.youLabel, config.othersLabel))
    .replace('{{question}}', () => asked);

  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: createModel(config.provider, config.model, config.apiKey, config.baseUrl, config.headers),
      schema: answerSchema,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: deadline.signal,
    });
    const answer = object.answer?.trim();
    if (!answer) return null;
    const last = segments[segments.length - 1];
    const limit = last ? last.end : 0;
    return {
      question: asked,
      answer,
      citations: (object.citations ?? [])
        .filter((at) => Number.isFinite(at) && at >= 0 && at <= limit)
        .map((at) => Math.round(at)),
      askedAt: Date.now(),
    };
  } catch (error) {
    logger.error('meetings: answering failed', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
