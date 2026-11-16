import { desktopCapturer, type Session } from 'electron';
import { currentSystemAudio } from './current-system-audio';

let chosenSourceId: string | null = null;

export function chooseMeetingSource(sourceId: string | null): void {
  chosenSourceId = sourceId;
}

export function registerDisplayMedia(session: Session): void {
  const support = currentSystemAudio();

  session.setDisplayMediaRequestHandler(
    (_request, callback) => {
      if (!chosenSourceId) {
        callback({});
        return;
      }
      const wanted = chosenSourceId;
      void desktopCapturer
        .getSources({ types: ['window', 'screen'] })
        .then((sources) => {
          const source = sources.find((candidate) => candidate.id === wanted);
          if (!source) {
            callback({});
            return;
          }
          callback(support === 'loopback' ? { video: source, audio: 'loopback' } : { video: source });
        })
        .catch(() => callback({}));
    },
    { useSystemPicker: support === 'system-picker' },
  );
}
