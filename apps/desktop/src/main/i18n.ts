import { translate } from '@flownote/core/i18n/translate';
import { APP_MESSAGES } from './app-messages';

export const mainI18n = {
  t(key: string, substitutions: string[] = []): string {
    return translate(APP_MESSAGES.en, key, substitutions);
  },
};
