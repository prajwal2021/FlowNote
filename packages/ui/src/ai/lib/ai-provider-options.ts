import { type AiChoice, KEY_PROVIDER_LABELS } from '@flownote/core/capture/ai/keys';
import type { ProviderOption } from '../components/ProviderSelect';

export function aiProviderOptions(available: (choice: AiChoice) => boolean): ProviderOption<AiChoice>[] {
  return [{ value: 'openai', label: KEY_PROVIDER_LABELS.openai, logo: 'openai', available: available('openai') }];
}
