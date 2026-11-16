import { generateObject, jsonSchema } from 'ai';
import { sanitizeGuideTitle } from '@/core/guides/title';
import { logger } from '@/core/logger';
import { type AiFailure, describeAiFailure } from './errors';
import { TRANSLATE_GUIDE_PROMPT } from './prompts';
import { createModel } from './provider';

interface TranslatableStep {
  id: string;
  description: string;
}

export interface TranslateGuideOptions {
  title: string;
  description?: string;
  steps: TranslatableStep[];
  language: string;
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  onFailure?: (failure: AiFailure) => void;
}

export interface TranslatedGuide {
  title: string;
  description?: string;
  steps: Map<string, string>;
}

const TRANSLATE_CHUNK_SIZE = 8;
const TRANSLATE_TIMEOUT_MS = 90_000;

const translationSchema = jsonSchema<{
  title?: string | null;
  description?: string | null;
  steps?: { id: string; text: string }[] | null;
}>({
  type: 'object',
  properties: {
    title: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, text: { type: 'string' } },
        required: ['id', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['title', 'description', 'steps'],
  additionalProperties: false,
});

function chunkSteps(steps: TranslatableStep[]): TranslatableStep[][] {
  if (steps.length === 0) return [[]];
  const chunks: TranslatableStep[][] = [];
  for (let start = 0; start < steps.length; start += TRANSLATE_CHUNK_SIZE) {
    chunks.push(steps.slice(start, start + TRANSLATE_CHUNK_SIZE));
  }
  return chunks;
}

function buildTranslatePrompt(
  language: string,
  title: string,
  description: string | undefined,
  steps: TranslatableStep[],
): string {
  const sections: string[] = [];
  if (title) sections.push(`Guide title:\n${title}`);
  if (description) sections.push(`Guide description:\n${description}`);
  if (steps.length > 0) {
    sections.push(
      `Steps, each as [id] followed by the instruction:\n${steps.map((s) => `[${s.id}] ${s.description}`).join('\n')}`,
    );
  }
  return TRANSLATE_GUIDE_PROMPT.replaceAll('{{language}}', () => language).replace('{{content}}', () =>
    sections.join('\n\n'),
  );
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function collectTranslations(
  entries: { id: string; text: string }[] | null | undefined,
  chunk: TranslatableStep[],
  into: Map<string, string>,
): void {
  const wanted = new Set(chunk.map((step) => step.id));
  for (const entry of entries ?? []) {
    const text = cleanText(entry?.text);
    if (!text || typeof entry?.id !== 'string' || !wanted.has(entry.id)) continue;
    into.set(entry.id, text);
  }
}

export async function translateGuide(options: TranslateGuideOptions): Promise<TranslatedGuide | null> {
  const { title, description, steps, language } = options;
  if (!title && !description && steps.length === 0) return null;

  const model = createModel(options.provider, options.model, options.apiKey, options.baseUrl, options.headers);
  const translated = new Map<string, string>();
  let translatedTitle = '';
  let translatedDescription = '';

  const chunks = chunkSteps(steps);
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]!;
    const first = index === 0;
    const prompt = buildTranslatePrompt(language, first ? title : '', first ? description : undefined, chunk);
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), TRANSLATE_TIMEOUT_MS);

    try {
      const { object } = await generateObject({
        model,
        schema: translationSchema,
        prompt,
        maxOutputTokens: 4096,
        abortSignal: deadline.signal,
      });
      if (first) {
        translatedTitle = cleanText(object.title);
        translatedDescription = cleanText(object.description);
      }
      collectTranslations(object.steps, chunk, translated);
    } catch (err) {
      logger.error('Guide translation failed', err);
      options.onFailure?.(describeAiFailure(err));
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    title: sanitizeGuideTitle(translatedTitle) || title,
    description: translatedDescription || description,
    steps: translated,
  };
}
