import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['apps/extension/src', 'packages', 'apps/desktop/src', 'apps/desktop/scripts'];
const UNDERSCORE_KEY = /\bi18n\.t\(\s*['"`][A-Za-z][A-Za-z0-9]*_/;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });

const problems = ROOTS.flatMap(walk).flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) => (UNDERSCORE_KEY.test(line) ? [`${relative('.', file)}:${index + 1}`] : [])),
);

if (problems.length > 0) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation key(s) use _ where both surfaces write a dot`);
  process.exit(1);
}

const LOCALES = 'packages/locales';
const STORE_LIMITS = { store_title: 45, description: 132 };

const tooLong = readdirSync(LOCALES)
  .filter((name) => name.endsWith('.yml'))
  .flatMap((name) => {
    const app = readFileSync(join(LOCALES, name), 'utf8').match(/^app:\n((?: {2}.*\n)+)/m)?.[1] ?? '';
    return Object.entries(STORE_LIMITS).flatMap(([key, max]) => {
      const value = app.match(new RegExp(`^ {2}${key}: "?(.*?)"?$`, 'm'))?.[1] ?? '';
      const length = [...value].length;
      return length > max ? [`${name} app.${key} is ${length} characters, the store limit is ${max}`] : [];
    });
  });

if (tooLong.length > 0) {
  console.error(tooLong.join('\n'));
  process.exit(1);
}

const defined = new Set();
let section = null;
for (const line of readFileSync(join(LOCALES, 'en.yml'), 'utf8').split('\n')) {
  const top = line.match(/^([A-Za-z][\w]*):\s*$/);
  if (top) section = top[1];
  const entry = line.match(/^ {2}([A-Za-z][\w]*):/);
  if (section && entry) defined.add(`${section}.${entry[1]}`);
}

const missing = ROOTS.flatMap(walk).flatMap((file) =>
  readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      [...line.matchAll(/\bi18n\.t\(([^)]*)\)/g)].flatMap((call) =>
        [...call[1].matchAll(/['"`]([A-Za-z]\w*\.[A-Za-z]\w*)['"`]/g)]
          .map((m) => m[1])
          .filter((key) => !defined.has(key))
          .map((key) => `${relative('.', file)}:${index + 1} ${key}`),
      ),
    ),
);

if (missing.length > 0) {
  console.error(missing.join('\n'));
  console.error(`\n${missing.length} translation key(s) are used but missing from packages/locales/en.yml`);
  process.exit(1);
}
