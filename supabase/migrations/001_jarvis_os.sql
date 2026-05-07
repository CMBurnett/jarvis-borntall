-- ============================================================
-- Jarvis OS — Initial Schema
-- Run this in Supabase SQL editor or via `supabase db push`
-- All tables have RLS enabled from day one. No exceptions.
-- ============================================================

-- ── Updated-at trigger function (shared) ─────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── contexts ─────────────────────────────────────────────────
create table if not exists contexts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  description   text not null default '',
  lifecycle_stage text not null default 'active_dev'
    check (lifecycle_stage in ('active_dev', 'stabilization', 'maintenance', 'paused')),
  security_tier smallint not null default 2
    check (security_tier in (1, 2, 3)),
  stack_summary text not null default '',
  repo_url      text,
  deploy_url    text,
  sprint_focus  text not null default '',
  claude_md_content text not null default '',
  models        jsonb not null default '[]',
  tools         jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table contexts enable row level security;
create policy "users manage own contexts"
  on contexts for all using (auth.uid() = user_id);

create trigger contexts_updated_at
  before update on contexts
  for each row execute function update_updated_at();

-- ── security_checks ──────────────────────────────────────────
create table if not exists security_checks (
  id              uuid primary key default gen_random_uuid(),
  context_id      uuid not null references contexts(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  category        text not null,
  check_key       text not null,
  label           text not null,
  status          text not null default 'pending'
    check (status in ('pass', 'warn', 'fail', 'pending', 'na')),
  last_checked_at timestamptz,
  notes           text,
  auto_checkable  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (context_id, check_key)
);

alter table security_checks enable row level security;
create policy "users manage own security_checks"
  on security_checks for all using (auth.uid() = user_id);

create trigger security_checks_updated_at
  before update on security_checks
  for each row execute function update_updated_at();

-- ── inbox_items ───────────────────────────────────────────────
create table if not exists inbox_items (
  id                      uuid primary key default gen_random_uuid(),
  context_id              uuid not null references contexts(id) on delete cascade,
  user_id                 uuid not null references auth.users(id) on delete cascade,
  source                  text not null
    check (source in ('sentry','vercel','supabase','github','uptime','anthropic','security_check','manual')),
  category                text not null
    check (category in ('error','deploy','security','performance','ai_alert','business_event','pr','info')),
  priority                text not null default 'normal'
    check (priority in ('urgent','high','normal','low')),
  title                   text not null,
  preview                 text not null default '',
  raw_payload             jsonb not null default '{}',
  agent_summary           text,
  agent_suggested_actions jsonb,
  is_read                 boolean not null default false,
  is_archived             boolean not null default false,
  needs_action            boolean not null default false,
  created_at              timestamptz not null default now()
);

alter table inbox_items enable row level security;
create policy "users manage own inbox_items"
  on inbox_items for all using (auth.uid() = user_id);

create index inbox_items_user_created on inbox_items (user_id, created_at desc);
create index inbox_items_context on inbox_items (context_id);

-- ── webhook_logs ──────────────────────────────────────────────
create table if not exists webhook_logs (
  id            uuid primary key default gen_random_uuid(),
  context_id    uuid references contexts(id) on delete set null,
  user_id       uuid references auth.users(id) on delete set null,
  source        text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  status        text not null default 'pending'
    check (status in ('pending','processed','failed','invalid_sig')),
  error_message text,
  raw_payload   jsonb not null default '{}'
);

alter table webhook_logs enable row level security;
create policy "users view own webhook_logs"
  on webhook_logs for all using (auth.uid() = user_id);

-- ── agent_runs ────────────────────────────────────────────────
create table if not exists agent_runs (
  id             uuid primary key default gen_random_uuid(),
  inbox_item_id  uuid references inbox_items(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  model_used     text not null,
  tokens_in      integer,
  tokens_out     integer,
  latency_ms     integer,
  result         jsonb,
  created_at     timestamptz not null default now()
);

alter table agent_runs enable row level security;
create policy "users view own agent_runs"
  on agent_runs for all using (auth.uid() = user_id);

-- ── user_preferences ─────────────────────────────────────────
create table if not exists user_preferences (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  notification_prefs  jsonb not null default '{}',
  updated_at          timestamptz not null default now()
);

alter table user_preferences enable row level security;
create policy "users manage own preferences"
  on user_preferences for all using (auth.uid() = user_id);

-- ── push_subscriptions ───────────────────────────────────────
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  keys       jsonb not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
create policy "users manage own push_subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────
-- Enable realtime for inbox so InboxFeed can stream new items
alter publication supabase_realtime add table inbox_items;
