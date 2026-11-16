import { actionSteps } from '@/core/guides/blocks';
import {
  duplicateGuide,
  getGuide,
  updateGuideDescription,
  updateGuideTitle,
  updateStepDescription,
} from '@/core/guides/service';
import { logger } from '@/core/logger';
import type { AiFailureUpdate } from './errors';
import { readAiCredentials } from './read-ai-credentials';
import { translateGuide } from './translate-guide';

export type TranslateGuideError = 'no-api-key' | 'no-content' | 'generation-failed' | 'save-failed';

export interface CreateTranslatedGuideResponse {
  guideId?: string;
  title?: string;
  error?: TranslateGuideError;
  failure?: AiFailureUpdate;
}

export async function createTranslatedGuide(guideId: string, language: string): Promise<CreateTranslatedGuideResponse> {
  try {
    const keys = await readAiCredentials();
    if (!keys) return { error: 'no-api-key' };

    const source = await getGuide(guideId);
    if (!source) return { error: 'no-content' };

    const steps = actionSteps(source.steps)
      .filter((step) => step.description)
      .map((step) => ({ id: step.id, description: step.description }));
    if (steps.length === 0 && !source.guide.title) return { error: 'no-content' };

    let failure: AiFailureUpdate | undefined;
    const translated = await translateGuide({
      title: source.guide.title,
      description: source.guide.description,
      steps,
      language,
      provider: keys.provider,
      model: keys.model,
      apiKey: keys.apiKey,
      baseUrl: keys.baseUrl,
      headers: keys.headers,
      onFailure: (reported) => {
        failure = { reason: reported.reason, status: reported.status, provider: keys.provider };
      },
    });
    if (!translated) return { error: 'generation-failed', failure };

    const copyId = await duplicateGuide(guideId);
    const copy = copyId ? await getGuide(copyId) : null;
    if (!copyId || !copy) return { error: 'save-failed' };

    await updateGuideTitle(copyId, translated.title);
    if (translated.description) await updateGuideDescription(copyId, translated.description);

    for (let index = 0; index < source.steps.length; index += 1) {
      const original = source.steps[index]!;
      const target = copy.steps[index];
      const text = translated.steps.get(original.id);
      if (!text || !target || target.description !== original.description) continue;
      await updateStepDescription(target.id, text, 'ai');
    }

    return { guideId: copyId, title: translated.title };
  } catch (err) {
    logger.error('Translated guide could not be saved', err);
    return { error: 'save-failed' };
  }
}
