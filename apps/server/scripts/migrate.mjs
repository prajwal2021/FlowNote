import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const { Pool } = createRequire(import.meta.url)('pg');
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const pool = new Pool({ connectionString: url });
const bundled = join(import.meta.dirname, 'schema.sql');
const schema = existsSync(bundled) ? bundled : join(import.meta.dirname, '..', 'db', 'schema.sql');
await pool.query(readFileSync(schema, 'utf8'));
await pool.end();
console.log('migrated');
