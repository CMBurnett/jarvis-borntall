-- ── CRM Schema ────────────────────────────────────────────────────────────────
-- Tables prefixed crm_ to avoid collisions with other agents.

-- ── crm_leads ─────────────────────────────────────────────────────────────────
create table crm_leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  -- Core (both list types)
  name                text not null,
  list_type           text,                   -- 'municipality' | 'manufacturing' | 'other'
  location            text,
  county              text,
  website             text,
  phone               text,
  status              text default 'prospect', -- prospect | contacted | qualified | proposal | negotiating | won | lost
  priority            text,
  pain_points         text,
  notes               text,
  next_action         text,
  last_contacted_at   timestamptz,

  -- Manufacturing-focused intel (nullable for municipalities)
  sector              text,
  employees           text,
  revenue             text,
  ownership           text,
  domain              text,
  email_format        text,
  outreach_channel    text,
  ai_use_case_1       text,
  ai_use_case_2       text,
  ai_use_case_3       text,
  buying_trigger      text,
  outreach_hook       text,
  cold_email_subject  text,
  likely_objection    text,
  est_sales_cycle     text,

  -- Municipality-specific
  population          text,
  municipality_type   text
);

-- ── crm_lead_contacts ─────────────────────────────────────────────────────────
create table crm_lead_contacts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  lead_id      uuid references crm_leads(id) on delete cascade,
  name         text not null,
  title        text,
  email        text,
  phone        text,
  linkedin_url text,
  is_primary   boolean default false,
  notes        text
);

-- ── crm_interactions ──────────────────────────────────────────────────────────
create table crm_interactions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  lead_id           uuid references crm_leads(id) on delete cascade,
  type              text,    -- email_inbound | email_outbound | call | note | meeting
  subject           text,
  body              text,
  email_message_id  text unique,   -- deduplication key for email sync
  ai_summary        text,
  ai_next_action    text,
  ai_sentiment      text,          -- positive | neutral | negative
  actioned_at       timestamptz    -- set when user marks as reviewed in inbox
);

-- ── crm_assessments ───────────────────────────────────────────────────────────
-- Populated by the NextWave site via POST /api/crm/assessments
create table crm_assessments (
  id               uuid primary key default gen_random_uuid(),
  submitted_at     timestamptz default now(),
  lead_id          uuid references crm_leads(id) on delete set null,
  name             text,
  email            text,
  company          text,
  source_slug      text,
  source_type      text,   -- 'campaign' | 'industry'
  answers          jsonb,
  resonates_with   text[],
  timeline         text,
  win_criteria     text,
  additional_notes text,
  ai_brief         text
);

-- ── crm_email_sync_log ────────────────────────────────────────────────────────
create table crm_email_sync_log (
  id               uuid primary key default gen_random_uuid(),
  synced_at        timestamptz default now(),
  emails_found     int default 0,
  emails_matched   int default 0,
  emails_skipped   int default 0,
  error            text
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index crm_leads_status_idx          on crm_leads(status);
create index crm_leads_list_type_idx       on crm_leads(list_type);
create index crm_leads_updated_at_idx      on crm_leads(updated_at desc);
create index crm_lead_contacts_email_idx   on crm_lead_contacts(lower(email));
create index crm_lead_contacts_lead_id_idx on crm_lead_contacts(lead_id);
create index crm_interactions_lead_id_idx  on crm_interactions(lead_id);
create index crm_interactions_inbox_idx    on crm_interactions(type, actioned_at, created_at desc);
create index crm_assessments_lead_id_idx   on crm_assessments(lead_id);
create index crm_assessments_email_idx     on crm_assessments(lower(email));

-- ── updated_at trigger ────────────────────────────────────────────────────────
create or replace function crm_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger crm_leads_updated_at
  before update on crm_leads
  for each row execute function crm_set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table crm_leads           enable row level security;
alter table crm_lead_contacts   enable row level security;
alter table crm_interactions    enable row level security;
alter table crm_assessments     enable row level security;
alter table crm_email_sync_log  enable row level security;

-- Allow all operations for authenticated users (internal tool)
create policy "crm_leads_auth"           on crm_leads           for all to authenticated using (true) with check (true);
create policy "crm_lead_contacts_auth"   on crm_lead_contacts   for all to authenticated using (true) with check (true);
create policy "crm_interactions_auth"    on crm_interactions    for all to authenticated using (true) with check (true);
create policy "crm_assessments_auth"     on crm_assessments     for all to authenticated using (true) with check (true);
create policy "crm_email_sync_log_auth"  on crm_email_sync_log  for all to authenticated using (true) with check (true);

-- Service role bypass for the assessment ingest endpoint (NextWave site → jarvis)
create policy "crm_assessments_service"    on crm_assessments   for insert to service_role with check (true);
create policy "crm_leads_service"          on crm_leads         for all    to service_role using (true) with check (true);
create policy "crm_lead_contacts_service"  on crm_lead_contacts for all    to service_role using (true) with check (true);
create policy "crm_interactions_service"   on crm_interactions  for all    to service_role using (true) with check (true);
