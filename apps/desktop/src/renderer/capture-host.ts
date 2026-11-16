import { finishGuide } from '@flownote/core/capture/ai/finish-guide';
import { mergeRecording } from '@flownote/core/capture/ai/merge-recording';
import { CaptureState } from '@flownote/core/capture/machine';
import { i18n, localStorage } from '@flownote/core/env';
import { getMostCommonApp } from '@flownote/core/guides/most-common-app';
import {
  allScreenshotIds,
  deleteStep,
  getStepsForGuide,
  permanentlyDeleteGuide,
  softDeleteGuide,
} from '@flownote/core/guides/service';
import { DesktopCaptureSink } from './capture-sink';
import { desktopNarration as narration } from './desktop-narration';

const sink = new DesktopCaptureSink(narration);

allScreenshotIds().then((ids) => window.flownote.screenshots.sweep(ids));

window.flownote.onRequest('flownote:capture:createGuide', (payload) => sink.createGuide(payload));
window.flownote.onRequest('flownote:capture:captureStep', (payload) => sink.captureStep(payload));

window.flownote.capture.onStateUpdate(async ({ command, state, currentGuideId, narrationWasLive }) => {
  if (command === 'narration:start' || command === 'narration:stop') {
    await localStorage.set({ voiceEnabled: command === 'narration:start' });
  }
  if (!currentGuideId) return;
  const recording = state === CaptureState.RECORDING;
  if (
    command === 'start' ||
    (command === 'resume' && narrationWasLive) ||
    (command === 'narration:start' && recording)
  ) {
    narration.start(currentGuideId);
  } else if (command === 'pause') narration.stop();
  else if (command === 'narration:stop') narration.turnOff();
});

window.flownote.onRequest('flownote:capture:deleteStep', async (payload) => {
  const { guideId, stepId } = payload;
  await deleteStep(guideId, stepId);
  return true;
});

async function appTitle(guideId: string): Promise<string> {
  const app = getMostCommonApp(await getStepsForGuide(guideId))?.name;
  return app ? i18n.t('desktop.guideInApp', [app]) : i18n.t('guide.newGuide');
}

window.flownote.onRequest('flownote:capture:finishGuide', async (payload) => {
  await finishGuide(payload, { fallbackTitle: appTitle, settleNarration: () => narration.settle() });
  return true;
});

window.flownote.onRequest('flownote:capture:discardRecording', async (payload) => {
  const { guideId, staging } = payload;
  narration.turnOff();
  if (staging) await permanentlyDeleteGuide(guideId);
  else await softDeleteGuide(guideId);
  return true;
});

window.flownote.onRequest('flownote:capture:mergeGuideInto', async (payload) => {
  const { guideId, insertTargetGuideId, insertAtIndex } = payload;
  await mergeRecording(guideId, { insertTargetGuideId, insertAtIndex }, () => narration.settle());
  return true;
});

window.flownote.onRequest('flownote:check:cleanup', async (payload) => {
  for (const id of payload) await permanentlyDeleteGuide(id);
  return true;
});
