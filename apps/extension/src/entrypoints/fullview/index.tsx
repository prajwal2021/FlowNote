import '@/lib/core-env';
import '@/lib/ui-env';
import ReactDOM from 'react-dom/client';
import { AuthGate } from '@/ui/auth/AuthGate';
import { FullViewApp } from '@/ui/fullview/App';
import '@flownote/ui/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthGate>
    <FullViewApp />
  </AuthGate>,
);
