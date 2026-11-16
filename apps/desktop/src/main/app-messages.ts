import type { Messages } from '@flownote/core/i18n/translate';
import en from '@flownote/locales/en.yml';
import type { AppLocale } from './app-locale';

export const APP_MESSAGES: Record<AppLocale, Messages> = { en: en as Messages };
