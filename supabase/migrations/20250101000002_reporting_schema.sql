-- Reporting agent schema
-- Prefix: rp_

create table if not exists rp_dashboards (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null,
  name         text not null,
  source       text not null default 'custom' check (source in ('preset', 'custom')),
  preset_slug  text,
  connector    text not null default 'sage100',
  spec         jsonb not null default '{}'::jsonb,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists rp_dashboards_org_idx on rp_dashboards(org_id);
create index if not exists rp_dashboards_org_source_idx on rp_dashboards(org_id, source);

-- Reuse the updated_at trigger function from migration 001
create trigger rp_dashboards_updated_at
  before update on rp_dashboards
  for each row execute function op_set_updated_at();
