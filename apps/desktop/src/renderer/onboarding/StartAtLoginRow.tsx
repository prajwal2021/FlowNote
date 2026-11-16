import { i18n } from '@flownote/core/env';
import { OnboardingRow, Switch } from '@flownote/ui';
import { useEffect, useState } from 'react';
import { LoginPicture } from './LoginPicture';

const MAC = navigator.userAgent.includes('Mac');

export function StartAtLoginRow() {
  const [atLogin, setAtLogin] = useState(false);

  useEffect(() => {
    void window.flownote.openAtLogin.get().then(setAtLogin);
  }, []);

  return (
    <OnboardingRow
      picture={<LoginPicture mac={MAC} />}
      title={i18n.t('desktop.startAtLogin')}
      hint={i18n.t(MAC ? 'desktop.startAtLoginHintMac' : 'desktop.startAtLoginHint')}
      control={
        <Switch
          checked={atLogin}
          label={i18n.t('desktop.startAtLogin')}
          onChange={async (next) => setAtLogin(await window.flownote.openAtLogin.set(next))}
        />
      }
    />
  );
}
