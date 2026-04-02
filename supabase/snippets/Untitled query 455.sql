-- Order Processing Agent — Schema
-- All tables prefixed op_ to avoid collisions with other agents in the shared Supabase project.
-- Requires: pgvector extension (enabled by iso-ready migration or manually)

-- ── Orders ────────────────────────────────────────────────────────────────────

create type op_order_status as enum (
  'pending_extraction',
  'pending_review',
  'approved',
  'rejected',
  'exported'
);

create type op_sku_match_status as enum (
  'auto',
  'flagged',
  'human',
  'unmatched'
);

create type op_confidence as enum ('HIGH', 'MEDIUM', 'LOW');

create table op_orders (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid not null,
  status                op_order_status not null default 'pending_extraction',
  source                text not null default 'email',
  raw_email             text,
  received_at           timestamptz not null default now(),
  customer_name         text,
  po_number             text,
  delivery_date         date,
  shipping_address      text,
  special_instructions  text,
  extraction_confidence op_confidence,
  sage_customer_no      text,
  reviewed_by           uuid references auth.users(id),
  reviewed_at           timestamptz,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Line items ────────────────────────────────────────────────────────────────

create table op_line_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references op_orders(id) on delete cascade,
  raw_text         text,
  quantity         numeric,
  unit             text,
  description      text,
  confidence       op_confidence,
  sku_matched      text,
  sku_candidates   jsonb default '[]'::jsonb,
  sku_match_status op_sku_match_status,
  unit_price       numeric,
  line_total       numeric,
  override_note    text,
  sort_order       int not null default 0
);

-- ── SKU catalog ───────────────────────────────────────────────────────────────

create table op_sku_catalog (
  sku         text primary key,
  name        text not null,
  description text,
  unit        text,
  active      boolean not null default true,
  embedding   vector(768),  -- Ollama nomic-embed-text
  updated_at  timestamptz not null default now()
);

-- ── Audit log ─────────────────────────────────────────────────────────────────

create table op_audit_log (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid references op_orders(id) on delete set null,
  actor      text not null,  -- 'system' | user email
  action     text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index op_orders_org_status_idx on op_orders(org_id, status);
create index op_orders_received_at_idx on op_orders(received_at desc);
create index op_line_items_order_id_idx on op_line_items(order_id);
create index op_audit_log_order_id_idx on op_audit_log(order_id);
create index op_sku_catalog_active_idx on op_sku_catalog(active) where active = true;

-- ── SKU vector similarity search RPC ─────────────────────────────────────────

create or replace function match_sku_catalog(
  query_embedding vector(768),
  match_count     int default 3
)
returns table (
  sku        text,
  name       text,
  similarity float
)
language sql
stable
as $$
  select
    sku,
    name,
    1 - (embedding <=> query_embedding) as similarity
  from op_sku_catalog
  where active = true
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- ── Auto-update updated_at ────────────────────────────────────────────────────

create or replace function op_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger op_orders_updated_at
  before update on op_orders
  for each row execute function op_set_updated_at();
