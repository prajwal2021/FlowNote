import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { AiFailureUpdate } from '@flownote/core/capture/ai/errors';
import type { CaptureInsert } from '@flownote/core/capture/capture-insert';
import { captureStateUpdate } from '@flownote/core/capture/capture-state-update';
import { isLive } from '@flownote/core/capture/is-live';
import { CaptureState, captureMachine } from '@flownote/core/capture/machine';
import { shortcutLabel } from '@flownote/core/capture/shortcut-label';
import { NARRATION_SETTLE_MS } from '@flownote/core/capture/voice/narration-settle-ms';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  protocol,
  screen,
  session,
  shell,
  Tray,
} from 'electron';
import { createActor } from 'xstate';
import { registerAiFetch } from './ai-fetch';
import { APP_ICON_SCHEME, registerAppIconProtocol } from './app-icon';
import { ask } from './ask';
import { InputHook } from './capture/input-hook';
import { DesktopRecorder, frameFor } from './capture/recorder';
import { grabDisplay } from './capture/screenshot';
import { registerScreenshotProtocol, SCREENSHOT_SCHEME, sweepScreenshots } from './capture/screenshot-store';
import { type CaptureMode, type CaptureSettings, loadSettings, saveSettings } from './capture/settings';
import { mainI18n } from './i18n';
import type { DesktopStateUpdate } from './ipc';
import { currentSystemAudio } from './meetings/current-system-audio';
import { chooseMeetingSource, registerDisplayMedia } from './meetings/display-media';
import { meetingSources } from './meetings/meeting-sources';
import { CaptureOverlay, type OverlayCommand, type OverlayNarration, type OverlayStep } from './overlay';
import {
  askMicrophone,
  captureWasHeld,
  holdCapture,
  microphoneAccess,
  type PermissionKind,
  readPermissions,
  requestPermission,
} from './permissions';
import { bindShortcuts, type ShortcutName, shortcutMap, unbindShortcuts } from './shortcuts';

if (process.platform === 'linux' && !InputHook.unsupportedSession()) delete process.env.WAYLAND_DISPLAY;

const FINISH_TIMEOUT_MS = NARRATION_SETTLE_MS + 15_000;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let overlay: CaptureOverlay | null = null;
let recorder: DesktopRecorder | null = null;
const capture = createActor(captureMachine).start();
let ending = false;
let insert: CaptureInsert | null = null;
let describing = true;
let captureSettings: CaptureSettings | null = null;
let steps: OverlayStep[] = [];

let pendingStart: (() => void) | null = captureWasHeld()
  ? () => mainWindow?.webContents.send('flownote:capture:openSheet')
  : null;

const BUNDLE_SUFFIX = '.flownote';

function bundleArg(argv: string[]): string | null {
  return argv.find((arg) => arg.toLowerCase().endsWith(BUNDLE_SUFFIX)) ?? null;
}

let openedFile = bundleArg(process.argv);

function openBundle(path: string | null): void {
  if (!path) return;
  openedFile = path;
  if (!app.isReady()) return;
  showWindow();
  mainWindow?.webContents.send('flownote:app:fileOpened');
}

let screenWarmed = false;

function warmScreenCapture(): void {
  if (process.platform !== 'darwin' || screenWarmed) return;
  screenWarmed = true;
  void grabDisplay(screen.getCursorScreenPoint()).catch(() => undefined);
}

async function explainWayland(): Promise<void> {
  await dialog.showMessageBox({
    type: 'info',
    message: mainI18n.t('desktop.cannotRecord'),
    detail: mainI18n.t('desktop.needsX11'),
    buttons: [mainI18n.t('common.close')],
    defaultId: 0,
    cancelId: 0,
  });
}

function whenPermitted(start: () => void): void {
  if (InputHook.unsupportedSession()) {
    void explainWayland();
    return;
  }
  const granted = readPermissions();
  if (granted.accessibility && granted.screen) {
    warmScreenCapture();
    start();
    return;
  }
  pendingStart = start;
  holdCapture(true);
  showWindow();
  mainWindow?.webContents.send('flownote:permissions:show');
}

function resource(file: string): string {
  return app.isPackaged ? join(process.resourcesPath, file) : join(__dirname, '../../resources', file);
}

function opensAtLogin(): boolean {
  return app.getLoginItemSettings().openAtLogin;
}

function setOpenAtLogin(enabled: boolean): void {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: enabled });
  refreshTrayMenu();
}

let restoreAfterCapture = false;

function enterCapture(): void {
  mainWindow?.webContents.setBackgroundThrottling(false);
  if (!mainWindow?.isVisible()) return;
  restoreAfterCapture = true;
  mainWindow.hide();
}

function leaveCapture(finished: boolean): void {
  mainWindow?.webContents.setBackgroundThrottling(true);
  if (finished || restoreAfterCapture) showWindow();
  restoreAfterCapture = false;
}

function trayIcon(recording: boolean): Electron.NativeImage {
  const icon = nativeImage.createFromPath(resource(recording ? 'tray-recording32.png' : 'icon32.png'));
  return process.platform === 'darwin' ? icon.resize({ width: 16, height: 16 }) : icon;
}

function refreshTray(): void {
  if (!tray) return;
  const recording = isLive(capture.getSnapshot().value);
  tray.setImage(trayIcon(recording));
  tray.setToolTip(recording ? mainI18n.t('desktop.trayRecording') : 'FlowNote');
}

function showWindow(): void {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

const SPLASH_MIN_MS = 1500;
const SPLASH_MAX_WAIT_MS = 3000;
let splash: BrowserWindow | null = null;
let splashShownAt: number | null = null;

function openSplash(): void {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    center: true,
  });
  splash.once('ready-to-show', () => {
    splash?.show();
    splashShownAt = Date.now();
  });
  splash.on('closed', () => {
    splash = null;
  });
  if (process.env.ELECTRON_RENDERER_URL) splash.loadURL(`${process.env.ELECTRON_RENDERER_URL}/splash.html`);
  else splash.loadFile(join(__dirname, '../renderer/splash.html'));
}

function closeSplash(then: () => void): void {
  const close = () => {
    if (splash && !splash.isDestroyed()) splash.close();
    then();
  };
  if (!splash || splash.isDestroyed()) {
    then();
    return;
  }
  if (splashShownAt === null) {
    const giveUp = setTimeout(close, SPLASH_MAX_WAIT_MS);
    splash.once('show', () => {
      clearTimeout(giveUp);
      setTimeout(close, SPLASH_MIN_MS);
    });
    return;
  }
  setTimeout(close, Math.max(0, SPLASH_MIN_MS - (Date.now() - splashShownAt)));
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    icon: resource(process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    backgroundColor: '#FEF2F2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    closeSplash(() => {
      if (!app.getLoginItemSettings().wasOpenedAsHidden) mainWindow?.show();
    });
  });

  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function openInWindow(target: 'library' | 'capture' | 'settings'): void {
  showWindow();
  mainWindow?.webContents.send('flownote:app:open', target);
}

function refreshTrayMenu(): void {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: mainI18n.t('library.allGuides'), click: () => openInWindow('library') },
      { label: mainI18n.t('capture.startCapture'), click: () => openInWindow('capture') },
      { label: mainI18n.t('settings.title'), click: () => openInWindow('settings') },
      { type: 'separator' },
      { label: mainI18n.t('desktop.version', [app.getVersion()]), enabled: false },
      { type: 'separator' },
      { label: mainI18n.t('desktop.trayQuit'), click: () => quit() },
    ]),
  );
}

function createTray(): void {
  tray = new Tray(trayIcon(false));
  tray.setToolTip('FlowNote');
  tray.on('click', () => {
    if (isLive(capture.getSnapshot().value)) overlay?.run('stop');
    else showWindow();
  });
  refreshTrayMenu();
}

function stateUpdate(command: OverlayCommand | null, guideId: string | null): DesktopStateUpdate {
  const snapshot = capture.getSnapshot();
  return {
    command,
    ...captureStateUpdate(snapshot),
    currentGuideId: guideId,
    narrationWasLive: snapshot.context.narrationWasLive,
  };
}

function broadcastState(command: OverlayCommand, guideId: string | null): void {
  mainWindow?.webContents.send('flownote:capture:stateUpdate', stateUpdate(command, guideId));
}

function applyShortcuts(): void {
  setImmediate(() => {
    if (!overlay) return;
    bindShortcuts(
      shortcutMap((captureSettings ?? loadSettings()).shortcuts, isLive(capture.getSnapshot().value)),
      onShortcut,
    );
  });
}

function onShortcut(name: ShortcutName): void {
  if (!overlay) return;
  const state = capture.getSnapshot().value;
  if (name === 'record') {
    if (state === CaptureState.IDLE) {
      whenPermitted(() => {
        insert = null;
        enterCapture();
        overlay?.run('start');
      });
      return;
    }
    overlay.run(state === CaptureState.ARMED ? 'start' : 'stop');
    return;
  }
  if (name === 'pause') {
    if (state === CaptureState.RECORDING) overlay.run('pause');
    else if (state === CaptureState.PAUSED) overlay.run('resume');
    return;
  }
  recorder?.captureNow(screen.getCursorScreenPoint());
}

function recordingGuideId(): string | null {
  return capture.getSnapshot().context.currentGuideId;
}

async function endRecording(command: 'stop' | 'discard'): Promise<string | null> {
  recorder?.stop();
  await recorder?.drain();
  const { currentGuideId: guideId, insertTargetGuideId, insertAtIndex } = capture.getSnapshot().context;
  insert = null;
  overlay?.reset();
  if (!guideId) return null;
  const app = mainWindow?.webContents ?? null;
  if (command === 'discard') {
    await ask(app, 'flownote:capture:discardRecording', { guideId, staging: insertTargetGuideId !== null }).catch(
      () => undefined,
    );
    return null;
  }
  if (insertTargetGuideId !== null && insertAtIndex !== null) {
    await ask(
      app,
      'flownote:capture:mergeGuideInto',
      { guideId, insertTargetGuideId, insertAtIndex },
      FINISH_TIMEOUT_MS,
    ).catch(() => undefined);
    return insertTargetGuideId;
  }
  void ask(app, 'flownote:capture:finishGuide', guideId, FINISH_TIMEOUT_MS).catch(() => undefined);
  return guideId;
}

async function onOverlayCommand(command: OverlayCommand): Promise<void> {
  let finished: string | null = null;
  if (command.startsWith('mode:')) {
    captureSettings = saveSettings({ captureMode: command.slice(5) as CaptureMode });
    overlay?.refresh();
    return;
  }
  if (command === 'narration:start' || command === 'narration:stop') {
    if (command === 'narration:stop' || (await askMicrophone())) broadcastState(command, recordingGuideId());
    return;
  }
  if (command === 'deleteStep') {
    const removed = steps.pop();
    const guideId = recordingGuideId();
    if (removed && guideId) {
      capture.send({ type: 'STEP_REMOVED' });
      await ask(mainWindow?.webContents ?? null, 'flownote:capture:deleteStep', {
        guideId,
        stepId: removed.id,
      }).catch(() => undefined);
    }
    overlay?.showStep(steps.at(-1) ?? null);
    return;
  }
  if (command === 'stop' || command === 'discard') {
    if (ending) return;
    ending = true;
    try {
      finished = await endRecording(command);
    } finally {
      ending = false;
    }
  } else if (command === 'start') {
    steps = [];
    overlay?.setAiFailure(null);
    const { currentGuideId: guideId, insertTargetGuideId } = capture.getSnapshot().context;
    try {
      await ask(mainWindow?.webContents ?? null, 'flownote:capture:createGuide', {
        guideId,
        staging: insertTargetGuideId !== null,
      });
    } catch (error) {
      overlay?.reset();
      dialog.showErrorBox(mainI18n.t('desktop.cannotRecord'), error instanceof Error ? error.message : String(error));
      return;
    }
    const started = await recorder?.start();
    if (started && !started.ok) {
      overlay?.reset();
      dialog.showErrorBox(mainI18n.t('desktop.cannotRecord'), started.detail);
      return;
    }
  } else if (command === 'pause') {
    recorder?.pause();
  } else if (command === 'disarm' || command === 'cancelEdit') {
    insert = null;
  }
  broadcastState(command, finished ?? recordingGuideId());
  applyShortcuts();
  refreshTray();
  if (command === 'stop' || command === 'discard' || command === 'disarm' || command === 'cancelEdit') {
    leaveCapture(Boolean(finished));
  }
}

let isQuitting = false;

function quit(): void {
  isQuitting = true;
  app.quit();
}

protocol.registerSchemesAsPrivileged([
  { scheme: SCREENSHOT_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
  { scheme: APP_ICON_SCHEME, privileges: { standard: true, secure: true } },
]);

app.on('open-file', (event, path) => {
  event.preventDefault();
  openBundle(path);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    showWindow();
    openBundle(bundleArg(argv));
  });

  app.whenReady().then(() => {
    if (process.platform === 'darwin' && !app.isPackaged) {
      const dockIcon = nativeImage.createFromPath(resource('icon.png'));
      if (!dockIcon.isEmpty()) app.dock?.setIcon(dockIcon);
    }
    if (!app.getLoginItemSettings().wasOpenedAsHidden) openSplash();
    registerScreenshotProtocol();
    registerAppIconProtocol();
    registerAiFetch();
    ipcMain.handle('flownote:openAtLogin:get', () => opensAtLogin());
    ipcMain.handle('flownote:openAtLogin:set', (_event, enabled: boolean) => {
      setOpenAtLogin(Boolean(enabled));
      return opensAtLogin();
    });
    ipcMain.handle('flownote:version', () => app.getVersion());
    ipcMain.handle('flownote:app:takeOpenedFile', async () => {
      const path = openedFile;
      openedFile = null;
      if (!path) return null;
      try {
        return { name: basename(path), bytes: await readFile(path) };
      } catch {
        return null;
      }
    });
    ipcMain.handle('flownote:screenshots:sweep', (_event, keep: string[]) => sweepScreenshots(keep));
    registerDisplayMedia(session.defaultSession);
    ipcMain.handle('flownote:meetings:sources', () => meetingSources());
    ipcMain.handle('flownote:meetings:systemAudio', () => currentSystemAudio());
    ipcMain.handle('flownote:meetings:choose', (_event, sourceId: string | null) => {
      chooseMeetingSource(sourceId);
    });

    captureSettings = loadSettings();
    const labelOf = (accelerator: string | null) =>
      accelerator ? shortcutLabel(accelerator, process.platform === 'darwin') : null;
    overlay = new CaptureOverlay(
      capture,
      (command) => void onOverlayCommand(command),
      () => (captureSettings ?? loadSettings()).captureMode,
      {
        insert: () => insert,
        introFrame: async () => {
          const { captureMode } = captureSettings ?? loadSettings();
          const region = overlay?.region ?? { x: 0, y: 0, width: 0, height: 0 };
          return frameFor(captureMode === 'area' ? 'area' : 'screen', screen.getCursorScreenPoint(), region, null);
        },
        shortcuts: () => {
          const { shortcuts } = captureSettings ?? loadSettings();
          return { record: labelOf(shortcuts.record), capture: labelOf(shortcuts.capture) };
        },
      },
    );
    recorder = new DesktopRecorder(
      () => overlay?.region ?? { x: 0, y: 0, width: 0, height: 0 },
      (fn) => {
        overlay?.setBusy(true);
        return overlay ? overlay.withHidden(fn) : fn();
      },
      async (request) => {
        const guideId = recordingGuideId();
        if (!guideId) return undefined;
        const reply = await ask(mainWindow?.webContents ?? null, 'flownote:capture:captureStep', {
          ...request,
          guideId,
        }).catch(() => undefined);
        if (reply?.stepId && reply.title) {
          const step: OverlayStep = {
            id: reply.stepId,
            number: steps.length + 1 + (insert?.afterStep ?? 0),
            title: reply.title,
            action: request.action,
            src: request.image?.src ?? '',
            source: 'heuristic',
            pending: reply.pending === true,
            app: request.elementMeta.app?.name ?? null,
          };
          steps.push(step);
          capture.send({ type: 'USER_ACTION' });
          describing = step.pending;
          overlay?.showStep(step);
          if (step.pending) overlay?.setProgress(95, 3500);
        }
        return reply;
      },
      {
        settings: () => captureSettings ?? loadSettings(),
        ignores: (point) => overlay?.ignores(point) ?? false,
        drained: () => overlay?.setBusy(false),
        progress: (fraction, ms) => overlay?.setProgress(Math.round(fraction * (describing ? 45 : 100)), ms),
        aimed: (aim) => overlay?.setPrint({ aim }),
        saved: (src) => overlay?.setPrint({ src }),
        recording: () => capture.getSnapshot().value === CaptureState.RECORDING,
      },
    );

    ipcMain.handle('flownote:capture:settings:get', () => captureSettings ?? loadSettings());
    ipcMain.handle('flownote:capture:settings:set', (_event, patch: Partial<CaptureSettings>) => {
      captureSettings = saveSettings(patch);
      overlay?.refresh();
      applyShortcuts();
      return captureSettings;
    });
    ipcMain.on('flownote:capture:narration', (_event, narration: OverlayNarration | null) =>
      overlay?.setNarration(narration),
    );
    ipcMain.on(
      'flownote:capture:described',
      (
        _event,
        stepId: string,
        description: string | null,
        failure: AiFailureUpdate | null,
        source: 'ai' | 'narration' = 'ai',
      ) => {
        if (failure) overlay?.setAiFailure(failure);
        const step = steps.find((candidate) => candidate.id === stepId);
        if (!step) return;
        if (description) {
          step.title = description;
          step.source = source;
        }
        step.pending = false;
        if (step === steps.at(-1)) {
          overlay?.setProgress(100, 200);
          overlay?.showStep(step);
        }
      },
    );
    ipcMain.handle('flownote:capture:region', () => overlay?.region);
    ipcMain.handle('flownote:capture:getState', () => stateUpdate(null, recordingGuideId()));
    ipcMain.handle('flownote:capture:edit', (_event, target?: CaptureInsert) => {
      whenPermitted(() => {
        insert = target ?? null;
        enterCapture();
        overlay?.edit();
      });
    });
    ipcMain.handle('flownote:capture:arm', (_event, target?: CaptureInsert) => {
      whenPermitted(() => {
        insert = target ?? null;
        enterCapture();
        overlay?.arm();
      });
    });
    ipcMain.handle('flownote:permissions:get', () => {
      if (pendingStart) holdCapture(true);
      return { ...readPermissions(), pending: pendingStart !== null };
    });
    ipcMain.handle('flownote:permissions:request', (_event, kind: PermissionKind) => requestPermission(kind));
    ipcMain.handle('flownote:microphone:get', () => microphoneAccess());
    ipcMain.handle('flownote:microphone:request', async () => {
      await askMicrophone();
      return microphoneAccess();
    });
    ipcMain.on('flownote:permissions:continue', () => {
      const start = pendingStart;
      pendingStart = null;
      holdCapture(false);
      warmScreenCapture();
      start?.();
    });
    ipcMain.on('flownote:permissions:cancel', () => {
      pendingStart = null;
      holdCapture(false);
    });
    ipcMain.on('flownote:permissions:restart', () => {
      app.relaunch();
      quit();
    });

    applyShortcuts();
    createWindow();
    createTray();
  });

  app.on('activate', () => showWindow());
  app.on('before-quit', () => {
    isQuitting = true;
    unbindShortcuts();
    recorder?.stop();
    overlay?.destroy();
  });
  app.on('window-all-closed', () => {});
}
