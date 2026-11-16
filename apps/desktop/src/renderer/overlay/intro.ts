import { showStartNotification } from '@flownote/core/capture/start-notification';

export function intro(): void {
  void showStartNotification().then(() => window.flownoteOverlay.command('intro:done'));
}
