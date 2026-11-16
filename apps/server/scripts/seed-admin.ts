import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD are required');
if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');
const pool = new Pool({ connectionString: DATABASE_URL });
const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
const email = ADMIN_EMAIL.trim().toLowerCase();
await pool.query(
  `insert into users (email, name, role, can_use_ai, password_hash, must_change_password)
   values ($1, 'Administrator', 'admin', true, $2, true)
   on conflict (email) do update set role = 'admin', status = 'active', password_hash = $2, must_change_password = true, failed_attempts = 0, locked_until = null`,
  [email, hash],
);
await pool.end();
console.log(`admin ready: ${email} (must change password at first login)`);
