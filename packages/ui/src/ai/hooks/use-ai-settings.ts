import { type AiChoice, aiChoice, SERVER } from '@flownote/core/capture/ai/keys';
import { AI_PROVIDERS, type AIModelOption, DEFAULT_AI_PROVIDER } from '@flownote/core/capture/ai/models';
import { localStorage } from '@flownote/core/env';
import { useCallback, useEffect, useState } from 'react';

const AI_KEYS = [
  'aiProvider',
  'aiModel',
  'aiBaseUrl',
  'aiServerUrl',
  'aiLanguage',
  'aiForSteps',
  'aiForGuide',
] as const;

export interface AiSettingsState {
  provider: AiChoice;
  model: string;
  forSteps: boolean;
  forGuide: boolean;
  models: AIModelOption[];
  defaultModel: string;
  setProvider: (provider: AiChoice) => void;
  setModel: (model: string) => void;
  setForSteps: (on: boolean) => void;
  setForGuide: (on: boolean) => void;
}

interface Options {
  onDirty?: (patch: Record<string, unknown>) => void;
  reloadOnFocus?: boolean;
}

function defaultModelFor(provider: AiChoice): string {
  return provider === SERVER ? '' : AI_PROVIDERS[provider].defaultModel;
}

export function useAiSettings({ onDirty, reloadOnFocus = false }: Options = {}): AiSettingsState {
  const [provider, setProviderState] = useState<AiChoice>(DEFAULT_AI_PROVIDER);
  const [model, setModelState] = useState(AI_PROVIDERS[DEFAULT_AI_PROVIDER].defaultModel);
  const [forSteps, setForStepsState] = useState(true);
  const [forGuide, setForGuideState] = useState(true);

  useEffect(() => {
    const load = () =>
      localStorage.get(AI_KEYS).then((stored) => {
        const next = aiChoice(stored);
        setProviderState(next);
        const listed = next !== SERVER && AI_PROVIDERS[next].models.some((entry) => entry.id === stored.aiModel);
        setModelState(listed ? (stored.aiModel as string) : defaultModelFor(next));
        setForStepsState(stored.aiForSteps !== false);
        setForGuideState(stored.aiForGuide !== false);
      });

    void load();
    if (!reloadOnFocus) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reloadOnFocus]);

  const dirty = useCallback(
    (patch: Record<string, unknown>) => {
      void localStorage.set(patch as never);
      onDirty?.(patch);
    },
    [onDirty],
  );

  const setProvider = useCallback(
    (next: AiChoice) => {
      const nextModel = defaultModelFor(next);
      setProviderState(next);
      setModelState(nextModel);
      dirty({ aiProvider: next, aiModel: nextModel, aiBaseUrl: '' });
    },
    [dirty],
  );

  const setModel = useCallback(
    (next: string) => {
      setModelState(next);
      dirty({ aiModel: next });
    },
    [dirty],
  );

  const setForSteps = useCallback(
    (on: boolean) => {
      setForStepsState(on);
      dirty({ aiForSteps: on });
    },
    [dirty],
  );

  const setForGuide = useCallback(
    (on: boolean) => {
      setForGuideState(on);
      dirty({ aiForGuide: on });
    },
    [dirty],
  );

  const config = provider === SERVER ? null : AI_PROVIDERS[provider];

  return {
    provider,
    model,
    forSteps,
    forGuide,
    models: config?.models ?? [],
    defaultModel: config?.defaultModel ?? '',
    setProvider,
    setModel,
    setForSteps,
    setForGuide,
  };
}
