import { i18n } from '@flownote/core/env';
import { AppearanceSettings, Switch } from '@flownote/ui';
import { Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { Row } from './Row';

const LOGIN_HINT = navigator.userAgent.includes('Mac') ? 'desktop.startAtLoginHintMac' : 'desktop.startAtLoginHint';

export function GeneralSettings({ onSaved }: { onSaved: () => void }) {
  const [atLogin, setAtLogin] = useState(false);

  useEffect(() => {
    window.flownote.openAtLogin.get().then(setAtLogin);
  }, []);

  return (
    <>
      <AppearanceSettings />

      <Card icon={Power} title={i18n.t('desktop.cardStartup')}>
        <Row label={i18n.t('desktop.startAtLogin')} hint={i18n.t(LOGIN_HINT)}>
          <Switch
            checked={atLogin}
            label={i18n.t('desktop.startAtLogin')}
            onChange={async (next) => {
              setAtLogin(await window.flownote.openAtLogin.set(next));
              onSaved();
            }}
          />
        </Row>
      </Card>
    </>
  );
}
