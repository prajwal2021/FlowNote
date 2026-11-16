import { describe, expect, it } from 'vitest';
import { systemAudioSupport } from '../system-audio';

describe('systemAudioSupport', () => {
  it('uses loopback on Windows regardless of version', () => {
    expect(systemAudioSupport('win32', '')).toBe('loopback');
  });

  it('uses the system picker on macOS 15 and later', () => {
    expect(systemAudioSupport('darwin', '15.0')).toBe('system-picker');
    expect(systemAudioSupport('darwin', '26.1')).toBe('system-picker');
  });

  it('is unsupported on macOS before 15, where the picker does not exist', () => {
    expect(systemAudioSupport('darwin', '14.6')).toBe('unsupported');
    expect(systemAudioSupport('darwin', '13.2')).toBe('unsupported');
  });

  it('is unsupported when the macOS version cannot be read', () => {
    expect(systemAudioSupport('darwin', '')).toBe('unsupported');
    expect(systemAudioSupport('darwin', 'unknown')).toBe('unsupported');
  });

  it('is unsupported on Linux', () => {
    expect(systemAudioSupport('linux', '')).toBe('unsupported');
  });
});
