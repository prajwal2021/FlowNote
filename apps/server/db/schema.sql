
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'frozen')),
  can_use_ai boolean not null default false,
  password_hash text not null,
  must_change_password boolean not null default false,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null default 'web' check (kind in ('web', 'api')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on sessions(user_id);

create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  owner_id uuid not null references users(id) on delete cascade,
  title text not null,
  kind text not null default 'document' check (kind in ('guide', 'document', 'video', 'file')),
  mime text not null,
  size bigint not null,
  file_name text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index if not exists shares_owner_idx on shares(owner_id);

create table if not exists audit_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  target text,
  detail jsonb
);

create table if not exists guides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  client_id text not null,
  title text not null,
  description text not null default '',
  step_count integer not null default 0,
  client_created_at timestamptz,
  client_updated_at timestamptz,
  synced_at timestamptz not null default now(),
  deleted_by_user boolean not null default false,
  has_files boolean not null default false,
  unique (owner_id, client_id)
);
create index if not exists guides_owner_idx on guides(owner_id);
create index if not exists guides_updated_idx on guides(client_updated_at desc);

alter table guides add column if not exists content_hash text;
alter table guides add column if not exists has_snapshot boolean not null default false;

create table if not exists user_ai_keys (
  user_id uuid primary key references users(id) on delete cascade,
  openai_key_enc text,
  updated_at timestamptz not null default now()
);

create table if not exists ai_usage (
  user_id uuid not null references users(id) on delete cascade,
  day date not null default current_date,
  requests integer not null default 0,
  primary key (user_id, day)
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  added_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists team_members_user_idx on team_members(user_id);

alter table guides add column if not exists team_id uuid references teams(id) on delete set null;
create index if not exists guides_team_idx on guides(team_id);

alter table users alter column can_use_ai set default true;
