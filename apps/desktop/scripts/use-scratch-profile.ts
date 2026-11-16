import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { app } from 'electron';

export function useScratchProfile(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), `flownote-check-${name}-`));
  app.setPath('userData', dir);
  app.setPath('sessionData', dir);
  return dir;
}
