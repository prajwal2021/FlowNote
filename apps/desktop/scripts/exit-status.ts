import { writeFileSync } from 'node:fs';

export function writeExitStatus(code: number): void {
  const at = process.argv.indexOf('--status');
  const path = at === -1 ? null : process.argv[at + 1];
  if (path) writeFileSync(path, String(code));
}
