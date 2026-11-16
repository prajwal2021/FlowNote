import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const detached = args[0] === '--detached';
const target = detached ? args[1] : args[0];
const electron = spawnSync('node', ['-p', "require('electron')"], { encoding: 'utf8' }).stdout.trim();
const headless = process.platform === 'linux' && spawnSync('sh', ['-c', 'command -v xvfb-run']).status === 0;

function runDetached() {
  const bundle = electron.replace(/\.app\/Contents\/MacOS\/[^/]+$/, '.app');
  const dir = mkdtempSync(join(tmpdir(), 'flownote-run-'));
  const out = join(dir, 'out.log');
  const err = join(dir, 'err.log');
  const status = join(dir, 'status');
  spawnSync('open', [
    '-a', bundle, '--wait-apps', '--stdout', out, '--stderr', err,
    '--args', resolve(target), '--status', status,
  ]);
  if (existsSync(out)) process.stdout.write(readFileSync(out, 'utf8'));
  if (existsSync(err)) process.stderr.write(readFileSync(err, 'utf8'));
  const reported = existsSync(status) ? Number.parseInt(readFileSync(status, 'utf8').trim(), 10) : Number.NaN;
  rmSync(dir, { recursive: true, force: true });
  if (!Number.isInteger(reported)) {
    process.stderr.write('the check exited without reporting a status\n');
    return 1;
  }
  return reported;
}

const status =
  detached && process.platform === 'darwin'
    ? runDetached()
    : headless
      ? spawnSync('xvfb-run', ['-a', '-s', '-screen 0 1920x1080x24', electron, target], { stdio: 'inherit' }).status
      : spawnSync(electron, [target], { stdio: 'inherit' }).status;

process.exit(status ?? 1);
