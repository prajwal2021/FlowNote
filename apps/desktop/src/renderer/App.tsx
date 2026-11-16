import type { CaptureInsert } from '@flownote/core/capture/capture-insert';
import { i18n, localStorage } from '@flownote/core/env';
import {
  AppFrame,
  GuidePage,
  LibraryContent,
  MeetingDetail,
  MeetingsList,
  navigate,
  SearchModal,
  TooltipProvider,
  useFullview,
  useRoute,
  VoiceNotice,
} from '@flownote/ui';
import { useCallback, useEffect, useState } from 'react';
import { CaptureSheet } from './CaptureSheet';
import { DesktopOnboarding } from './DesktopOnboarding';
import { GuideZoom } from './GuideZoom';
import { useNarrationUpdate } from './hooks/use-narration-update';
import { MeetingSheet } from './meetings/MeetingSheet';
import { PermissionsDialog } from './PermissionsDialog';
import { REOPEN_SETTINGS } from './settings/lib/reopen-settings';
import { SettingsDialog } from './settings/SettingsDialog';

export function App() {
  const route = useRoute();
  const narration = useNarrationUpdate();
  const [settingsOpen, setSettingsOpen] = useState(() => sessionStorage.getItem(REOPEN_SETTINGS) !== null);
  const [settingsOnKeys, setSettingsOnKeys] = useState(false);
  const [sheet, setSheet] = useState<{ insert?: CaptureInsert } | null>(null);
  const [guideKey, setGuideKey] = useState(0);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [meetingSheet, setMeetingSheet] = useState(false);
  const [version, setVersion] = useState('');
  const setImportFile = useFullview((s) => s.setImportFile);

  useEffect(() => {
    const take = () =>
      void window.flownote.openedFile.take().then((opened) => {
        if (!opened) return;
        setSettingsOpen(false);
        setSheet(null);
        navigate({ page: 'library', category: 'all' });
        setImportFile(new File([new Uint8Array(opened.bytes)], opened.name));
      });
    take();
    window.flownote.openedFile.onOpen(take);
  }, [setImportFile]);

  useEffect(() => {
    void window.flownote.version().then(setVersion);
    window.flownote.permissions.onShow(() => setPermissionsOpen(true));
    window.flownote.capture.onOpenSheet(() => setSheet({}));
    window.flownote.onOpen((target) => {
      setSettingsOpen(target === 'settings');
      setSheet(target === 'capture' ? {} : null);
      if (target === 'library') navigate({ page: 'library', category: 'all' });
    });
    void window.flownote.permissions.get().then((found) => found.pending && setPermissionsOpen(true));
  }, []);

  const closePermissions = useCallback((granted: boolean) => {
    setPermissionsOpen(false);
    if (granted) window.flownote.permissions.continue();
    else window.flownote.permissions.cancel();
  }, []);

  useEffect(() => {
    void localStorage.get(['onboardingCompleted']).then((stored) => setOnboarded(stored.onboardingCompleted === true));
  }, []);

  useEffect(() => {
    window.flownote.capture.onStateUpdate(({ command, currentGuideId: id }) => {
      if (command !== 'stop' || !id) return;
      setSettingsOpen(false);
      setSheet(null);
      navigate({ page: 'guide', guideId: id });
      setGuideKey((n) => n + 1);
    });
  }, []);

  if (onboarded === null) return null;

  if (!onboarded) {
    return (
      <TooltipProvider>
        <DesktopOnboarding onFinish={() => setOnboarded(true)} />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <AppFrame
        route={route}
        onStartCapture={() => setSheet({})}
        onSettings={() => setSettingsOpen(true)}
        version={version && i18n.t('desktop.version', [version])}
        guideActions={
          route.page === 'guide' ? (
            <GuideZoom guideId={route.guideId} onDone={() => setGuideKey((n) => n + 1)} />
          ) : undefined
        }
      >
        {route.page === 'guide' ? (
          <GuidePage
            key={guideKey}
            guideId={route.guideId}
            initialStepId={route.stepId}
            initialTool={route.tool}
            copied={route.copied}
            onCaptureMore={(insert) => setSheet({ insert })}
          />
        ) : route.page === 'meetings' ? (
          <MeetingsList onStart={() => setMeetingSheet(true)} />
        ) : route.page === 'meeting' ? (
          <MeetingDetail key={route.meetingId} meetingId={route.meetingId} />
        ) : (
          <main className="flex-1 flex flex-col py-8 px-6">
            <LibraryContent category={route.category} />
          </main>
        )}
      </AppFrame>
      <SearchModal />
      <SettingsDialog
        open={settingsOpen}
        startOnKeys={settingsOnKeys}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) setSettingsOnKeys(false);
        }}
      />
      <VoiceNotice
        update={narration.update}
        seenLive={narration.seenLive}
        onOpenSettings={() => {
          setSettingsOnKeys(true);
          setSettingsOpen(true);
        }}
      />
      {sheet && <CaptureSheet insert={sheet.insert} onClose={() => setSheet(null)} />}
      {meetingSheet && (
        <MeetingSheet
          onClose={() => setMeetingSheet(false)}
          onRecorded={(meetingId) => {
            setMeetingSheet(false);
            navigate({ page: 'meeting', meetingId });
          }}
        />
      )}
      <PermissionsDialog open={permissionsOpen} onClose={closePermissions} />
    </TooltipProvider>
  );
}
