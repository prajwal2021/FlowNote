import '@/lib/core-env';
import '@/lib/ui-env';
import ReactDOM from 'react-dom/client';
import { startSidepanelVoiceHost } from '@/lib/voice/start-sidepanel-voice-host';
import { AuthGate } from '@/ui/auth/AuthGate';
import { App } from '@/ui/sidepanel/App';
import '@flownote/ui/global.css';

startSidepanelVoiceHost();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthGate>
    <App />
  </AuthGate>,
);
