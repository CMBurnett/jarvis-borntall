-- Lead enrichment columns
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS enrichment_status text,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_error text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS tech_stack text[],
  ADD COLUMN IF NOT EXISTS apollo_org_id text;

-- Contact enrichment columns
ALTER TABLE crm_lead_contacts
  ADD COLUMN IF NOT EXISTS email_verified boolean,
  ADD COLUMN IF NOT EXISTS email_status text,
  ADD COLUMN IF NOT EXISTS email_confidence integer,
  ADD COLUMN IF NOT EXISTS enrichment_source text,
  ADD COLUMN IF NOT EXISTS apollo_person_id text;

CREATE UNIQUE INDEX IF NOT EXISTS crm_lead_contacts_apollo_person_id_idx
  ON crm_lead_contacts (apollo_person_id)
  WHERE apollo_person_id IS NOT NULL;
