import { type SystemAudioSupport, systemAudioSupport } from './system-audio';

export function currentSystemAudio(): SystemAudioSupport {
  return systemAudioSupport(process.platform, process.platform === 'darwin' ? process.getSystemVersion() : '');
}
