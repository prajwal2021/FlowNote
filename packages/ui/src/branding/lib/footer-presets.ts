import { i18n } from '@flownote/core/env';
import { defaultFooterLine } from '@flownote/core/export/branding';

export const footerPresets = () => [
  defaultFooterLine(),
  i18n.t('settings.footerPresetConfidential'),
  i18n.t('settings.footerPresetNoDistribute'),
];
