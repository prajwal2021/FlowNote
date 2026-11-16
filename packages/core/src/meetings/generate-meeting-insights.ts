import { generateObject, jsonSchema } from 'ai';
import { createModel } from '@/core/capture/ai/provider';
import { logger } from '@/core/logger';
import { formatTranscript } from './format-transcript';
import { MEETING_INSIGHTS_PROMPT } from './meeting-prompts';
import type { MeetingActionItem, MeetingInsights, MeetingSegment } from './types';

const TIMEOUT_MS = 90_000;
const MAX_OUTPUT_TOKENS = 4096;

interface RawInsights {
  summary: string;
  takeaways: string[];
  decisions: string[];
  actionItems: { text: string; owner?: string | null; due?: string | null; mine?: boolean; atSec?: number | null }[];
}

const insightsSchema = jsonSchema<RawInsights>({
  type: 'object',
  properties: {
    summary: { type: 'string' },
    takeaways: { type: 'array', items: { type: 'string' } },
    decisions: { type: 'array', items: { type: 'string' } },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          owner: { type: ['string', 'null'] },
          due: { type: ['string', 'null'] },
          mine: { type: 'boolean' },
          atSec: { type: ['number', 'null'] },
        },
        required: ['text', 'owner', 'due', 'mine', 'atSec'],
        additionalProperties: false,
      },
    },
  },
  required: ['summary', 'takeaways', 'decisions', 'actionItems'],
  additionalProperties: false,
});

function toActionItem(raw: RawInsights['actionItems'][number]): MeetingActionItem | null {
  const text = raw.text?.trim();
  if (!text) return null;
  return {
    text,
    owner: raw.owner?.trim() || null,
    due: raw.due?.trim() || null,
    mine: raw.mine === true,
    atSec: typeof raw.atSec === 'number' && Number.isFinite(raw.atSec) ? Math.max(0, raw.atSec) : null,
  };
}

export interface MeetingAiConfig {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  youLabel: string;
  othersLabel: string;
}

export async function generateMeetingInsights(
  meetingId: string,
  segments: readonly MeetingSegment[],
  config: MeetingAiConfig,
): Promise<MeetingInsights | null> {
  if (segments.length === 0) return null;

  const prompt = MEETING_INSIGHTS_PROMPT.replace('{{you}}', config.youLabel)
    .replace('{{others}}', config.othersLabel)
    .replace('{{transcript}}', () => formatTranscript(segments, config.youLabel, config.othersLabel));

  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: createModel(config.provider, config.model, config.apiKey, config.baseUrl, config.headers),
      schema: insightsSchema,
      prompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      abortSignal: deadline.signal,
    });
    const summary = object.summary?.trim();
    if (!summary) return null;
    return {
      meetingId,
      summary,
      takeaways: (object.takeaways ?? []).map((line) => line.trim()).filter(Boolean),
      decisions: (object.decisions ?? []).map((line) => line.trim()).filter(Boolean),
      actionItems: (object.actionItems ?? [])
        .map(toActionItem)
        .filter((item): item is MeetingActionItem => item !== null),
      generatedAt: Date.now(),
      model: config.model,
    };
  } catch (error) {
    logger.error('meetings: insight generation failed', error);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
