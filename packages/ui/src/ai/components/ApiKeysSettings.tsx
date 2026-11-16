import { i18n } from '@flownote/core/env';
import { KeyRound } from 'lucide-react';
import { SettingsCard } from '../../common/components/SettingsCard';
import type { ApiKeysState } from '../hooks/use-api-keys';
import type { ValidateKey } from '../types';
import { ProviderKeyRow } from './ProviderKeyRow';

interface ApiKeysSettingsProps {
  state: ApiKeysState;
  validate: ValidateKey;
  title?: string;
}

export function ApiKeysSettings({ state, validate, title }: ApiKeysSettingsProps) {
  if (!state.loaded) return null;
  return (
    <SettingsCard icon={KeyRound} title={title} className={title ? 'pb-1' : 'py-1'}>
      {state.orgAccess && (
        <p className="mb-2 rounded-lg bg-icon-tile px-3 py-2 text-[11.5px] leading-snug text-primary-text">
          {i18n.t('account.orgKeyNote')}
        </p>
      )}
      <div className="@container divide-y divide-secondary">
        <ProviderKeyRow
          provider="openai"
          value={state.keys.openai ?? ''}
          onChange={(value) => state.setKey('openai', value)}
          validate={validate}
        />
      </div>
    </SettingsCard>
  );
}
