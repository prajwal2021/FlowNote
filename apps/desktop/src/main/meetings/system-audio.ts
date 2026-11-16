export type SystemAudioSupport = 'loopback' | 'system-picker' | 'unsupported';

const MIN_MACOS_SYSTEM_PICKER = 15;

export function systemAudioSupport(platform: string, macProductVersion: string): SystemAudioSupport {
  if (platform === 'win32') return 'loopback';
  if (platform !== 'darwin') return 'unsupported';
  const major = Number.parseInt(macProductVersion.split('.')[0] ?? '', 10);
  return Number.isInteger(major) && major >= MIN_MACOS_SYSTEM_PICKER ? 'system-picker' : 'unsupported';
}
