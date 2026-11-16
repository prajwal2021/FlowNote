import type { TranslateGuideError } from '@flownote/core/capture/ai/create-translated-guide';
import type { AiFailureUpdate } from '@flownote/core/capture/ai/errors';
import { i18n } from '@flownote/core/env';
import { useCallback, useState } from 'react';
import { translation } from '../../env';

export interface TranslateGuide {
  available: boolean;
  running: boolean;
  failure: AiFailureUpdate | null;
  error: string | null;
  done: string | null;
  translate: (language: string) => Promise<void>;
  dismiss: () => void;
}

const ERROR_KEYS: Record<TranslateGuideError, string> = {
  'no-api-key': 'translate.noApiKey',
  'no-content': 'translate.noContent',
  'generation-failed': 'translate.failed',
  'save-failed': 'translate.saveFailed',
};

export function useTranslateGuide(guideId: string): TranslateGuide {
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<AiFailureUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const translate = useCallback(
    async (language: string) => {
      setRunning(true);
      setFailure(null);
      setError(null);
      setDone(null);
      try {
        const result = await translation.translate(guideId, language);
        if (result.error) {
          if (result.failure) setFailure(result.failure);
          else setError(i18n.t(ERROR_KEYS[result.error]));
          return;
        }
        setDone(i18n.t('translate.created', [result.title ?? '']));
      } catch {
        setError(i18n.t('translate.failed'));
      } finally {
        setRunning(false);
      }
    },
    [guideId],
  );

  const dismiss = useCallback(() => {
    setFailure(null);
    setError(null);
    setDone(null);
  }, []);

  return { available: translation.available(), running, failure, error, done, translate, dismiss };
}
