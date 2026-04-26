# Plan: /crm — Internal CRM with Supabase Auth + AI Email Agent

## Context
NextWave needs an internal sales CRM at `/crm` — not indexed, not publicly navigable — for managing leads and tracking the sales pipeline. It will use Supabase email OTP as the only auth mechanism. An AI-powered email agent will poll a connected inbox, match emails to leads, and use Claude to enrich the CRM with summaries, sentiment, and next-action suggestions. The existing site has no auth, no database, and no email infrastructure — this is a full greenfield addition.

---

## Dependencies to Install
```bash
npm install @supabase/supabase-js @supabase/ssr imapflow mailparser
npm install -D @types/mailparser
```

- `@supabase/supabase-js` + `@supabase/ssr` — auth + DB client (SSR-safe)
- `imapflow` — modern IMAP polling (replaces legacy `imap` package)
- `mailparser` — parse raw MIME email into structured data

---

## Environment Variables to Add (`.env.local` + `.env.example`)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EMAIL_IMAP_HOST=          # e.g. imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_IMAP_USER=          # monitored inbox address
EMAIL_IMAP_PASSWORD=      # app password (Gmail) or account password
EMAIL_POLL_SECRET=        # random secret to secure the poll endpoint
```

---

## Assessment Flow Integration
The existing `AssessmentDialog` (used on `/ai-services/[slug]` and `/industries/[industry]` pages) asks 4 questions:
1. **Q1** — "Which of these resonates most with your team right now?" (multi-select checkboxes with metric subtitles — questions vary per industry)
2. **Q2** — "How soon are you thinking about moving on this?" (4 options: Ready to move soon / Actively evaluating 3–6 months / Just exploring / Not sure yet)
3. **Q3** — "What would make this a clear win for your team?" (free text)
4. **Q4** — "Anything specific you'd like us to know before the call?" (free text, optional)

Currently `app/actions/assessment.ts` generates an AI brief and fires it to the Teams webhook but **doesn't persist anything**. The plan is to:
- Add Supabase write to `submitAssessment` — save answers + AI brief to a new `assessments` table
- Attempt to match the submitter's email against `lead_contacts.email` and link `lead_id`
- If no match: create a new `lead` record (status=`prospect`, source=`assessment`) and link it
- Surface assessments on the lead detail page as a distinct card above the interaction timeline
- Questions can change over time — store answers as JSONB so the schema never needs migration

---

## Supabase Schema (run in Supabase SQL editor)

The schema is designed around the two real prospect lists: **Municipality** and **Manufacturing/Industrial**. They share a common `leads` core but carry different metadata. A separate `lead_contacts` table handles the multiple-contacts-per-lead pattern present in both lists.

```sql
-- ── leads ──────────────────────────────────────────────────────────────────
create table leads (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),

  -- Core (both list types)
  name                text not null,          -- company or municipality name
  list_type           text,                   -- 'municipality' | 'manufacturing' | 'other'
  location            text,                   -- town/city
  county              text,                   -- Bucks, Montgomery, etc.
  website             text,
  phone               text,
  status              text default 'prospect', -- prospect | contacted | qualified | proposal | negotiating | won | lost
  priority            text,                   -- 'high' | 'tier1' | 'tier2' | 'tier3'
  pain_points         text,
  notes               text,
  next_action         text,
  last_contacted_at   timestamptz,

  -- Business intel (manufacturing-focused, nullable for municipalities)
  sector              text,                   -- e.g. "Defense/military precision components"
  employees           text,                   -- ranges: "200–500"
  revenue             text,                   -- ranges: "~$50–100M"
  ownership           text,                   -- Private | Family-owned | Public
  domain              text,                   -- actionmanufacturing.com
  email_format        text,                   -- "first.last@domain.com"
  outreach_channel    text,                   -- LinkedIn DM → Cold Email → Phone

  -- Outreach intelligence (manufacturing)
  ai_use_case_1       text,
  ai_use_case_2       text,
  ai_use_case_3       text,
  buying_trigger      text,
  outreach_hook       text,
  cold_email_subject  text,
  likely_objection    text,
  est_sales_cycle     text,                   -- "3–6 months"

  -- Municipality-specific
  population          text,                   -- "~60,000"
  municipality_type   text                    -- "Township (1st Class)" | "Borough" | etc.
);

-- ── lead_contacts ──────────────────────────────────────────────────────────
-- Replaces the messy "secondary contact buried in notes" pattern in the CSVs.
-- Every contact for a lead lives here — primary and secondary.
create table lead_contacts (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  lead_id      uuid references leads(id) on delete cascade,
  name         text not null,
  title        text,
  email        text,
  phone        text,
  linkedin_url text,
  is_primary   boolean default false,
  notes        text
);

-- ── interactions ──────────────────────────────────────────────────────────
create table interactions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  lead_id           uuid references leads(id) on delete cascade,
  type              text,    -- email_inbound | email_outbound | call | note | meeting
  subject           text,
  body              text,
  email_message_id  text unique,   -- deduplication key for email sync
  ai_summary        text,
  ai_next_action    text,
  ai_sentiment      text           -- positive | neutral | negative
);

-- ── assessments ───────────────────────────────────────────────────────────
-- Captures responses from AssessmentDialog on /ai-services and /industries pages.
-- JSONB answers field keeps this schema-stable as questions evolve.
create table assessments (
  id               uuid primary key default gen_random_uuid(),
  submitted_at     timestamptz default now(),
  lead_id          uuid references leads(id) on delete set null,
  -- Submitter info (collected in dialog before questions)
  name             text,
  email            text,
  company          text,
  -- Source context
  source_slug      text,   -- the /ai-services/[slug] or /industries/[industry] that triggered it
  source_type      text,   -- 'campaign' | 'industry'
  -- Answers (JSONB — stable across question changes)
  answers          jsonb,
  -- Denormalized for current question set (easier to display without parsing JSONB)
  resonates_with   text[],   -- Q1 multi-select labels
  timeline         text,     -- Q2 single select
  win_criteria     text,     -- Q3 free text
  additional_notes text,     -- Q4 free text (optional)
  -- AI brief already generated by existing assessment.ts
  ai_brief         text
);

-- ── email_sync_log ────────────────────────────────────────────────────────
create table email_sync_log (
  id               uuid primary key default gen_random_uuid(),
  synced_at        timestamptz default now(),
  emails_found     int default 0,
  emails_matched   int default 0
);
```

Enable Row Level Security on all tables. Single-user tool — policy: allow all operations for authenticated users.

---

## CSV Column Mapping

| Municipality CSV column | → leads / lead_contacts field |
|---|---|
| Municipality | `leads.name` |
| Type | `leads.municipality_type` |
| County | `leads.county` |
| Est. Population | `leads.population` |
| Website | `leads.website` |
| Phone | `leads.phone` |
| CRM Status | `leads.status` |
| Priority | `leads.priority` |
| Key Pain Points / Notes | `leads.pain_points` |
| Contact Name | `lead_contacts.name` (is_primary=true) |
| Contact Title | `lead_contacts.title` |
| Email | `lead_contacts.email` |
| Last Contacted | `leads.last_contacted_at` |
| Next Action | `leads.next_action` (secondary contact info currently here goes to a 2nd `lead_contacts` row) |

| Manufacturing CSV column | → leads / lead_contacts field |
|---|---|
| Company | `leads.name` |
| Town | `leads.location` |
| Category / Sector | `leads.sector` |
| Employees | `leads.employees` |
| Revenue | `leads.revenue` |
| Website | `leads.website` |
| Ownership | `leads.ownership` |
| Priority | `leads.priority` |
| Decision Maker | `lead_contacts.name` (is_primary=true) |
| Title | `lead_contacts.title` |
| LinkedIn Search URL | `lead_contacts.linkedin_url` |
| Domain | `leads.domain` |
| Email Format | `leads.email_format` |
| Best Email Guess | `lead_contacts.email` |
| Alt Contact / Next Title | `lead_contacts.notes` on a 2nd contact row |
| Best Outreach Channel | `leads.outreach_channel` |
| Primary/Secondary/Tertiary AI Use Case | `leads.ai_use_case_1/2/3` |
| Buying Trigger / Why Now | `leads.buying_trigger` |
| Outreach Hook | `leads.outreach_hook` |
| Cold Email Subject Line | `leads.cold_email_subject` |
| Likely Objection | `leads.likely_objection` |
| Est. Sales Cycle | `leads.est_sales_cycle` |
| Key Pain Points | `leads.pain_points` |
| Original Notes | `leads.notes` |

---

## Files to Create / Modify

### New Files
| File | Purpose |
|------|---------|
| `middleware.ts` | Protect all `/crm` routes (redirect to `/crm/login` if no session) |
| `lib/supabase/client.ts` | Browser Supabase client (for client components) |
| `lib/supabase/server.ts` | Server Supabase client (for server components + actions) |
| `lib/crm-types.ts` | Shared TypeScript types for Lead, LeadContact, Interaction, Assessment |
| `app/crm/layout.tsx` | CRM shell: sidebar nav, no public header/footer |
| `app/crm/login/page.tsx` | OTP login: email input → OTP code entry → session |
| `app/crm/page.tsx` | Redirect → `/crm/leads` |
| `app/crm/leads/page.tsx` | Leads list: search, status filter, list_type filter |
| `app/crm/leads/new/page.tsx` | Add lead form (adapts fields based on list_type selection) |
| `app/crm/leads/[id]/page.tsx` | Lead detail: info card, contacts, assessment, interaction timeline |
| `app/crm/leads/[id]/AssessmentCard.tsx` | Displays assessment answers + AI brief (collapsible) |
| `app/crm/pipeline/page.tsx` | Kanban board by status |
| `app/crm/import/page.tsx` | CSV import: paste/upload → preview → insert for both list types |
| `app/crm/settings/page.tsx` | Email sync config + "Sync Now" button + last sync log |
| `app/actions/crm.ts` | Server actions: createLead, updateLead, deleteLead, addNote, upsertContact |
| `app/api/email/poll/route.ts` | POST: poll IMAP → match on lead_contacts.email → Claude enrichment |
| `components/crm/CRMNav.tsx` | Sidebar: Leads, Pipeline, Import, Settings, Sign Out |
| `components/crm/LeadTable.tsx` | Sortable leads table with status + priority badges |
| `components/crm/LeadForm.tsx` | Add/edit lead (shows municipality or manufacturing fields based on list_type) |
| `components/crm/ContactsCard.tsx` | List + inline-add contacts for a lead |
| `components/crm/PipelineBoard.tsx` | Kanban columns with lead cards |
| `components/crm/InteractionFeed.tsx` | Chronological timeline of emails/notes/calls |
| `components/crm/ImportWizard.tsx` | CSV paste/upload → column map → preview table → confirm import |

### Modified Files
| File | Change |
|------|--------|
| `components/ClientLayout.tsx` | Add `pathname.startsWith('/crm')` to `isFullscreen` check — hides public nav/footer |
| `app/robots.ts` | Add `Disallow: /crm` |
| `app/actions/assessment.ts` | Add Supabase write after existing Teams webhook — save assessment + match/create lead |

---

## Implementation Details

### 1. Middleware (`middleware.ts`)
Uses `@supabase/ssr` `createServerClient` pattern. Checks for valid Supabase session on any `/crm` path that isn't `/crm/login`. Redirects unauthenticated users to `/crm/login`. Also refreshes the session cookie on each request (required by Supabase SSR).

```ts
// Matcher: matches all /crm/* routes
export const config = { matcher: ['/crm/:path*'] }
```

### 2. Auth Flow (`app/crm/login/page.tsx`)
Two-step client component:
1. **Step 1** — Enter email → calls `supabase.auth.signInWithOtp({ email })` → shows "check your email"
2. **Step 2** — Enter 6-digit OTP code → calls `supabase.auth.verifyOtp({ email, token, type: 'email' })` → redirects to `/crm/leads`

Styled in the site's navy/teal aesthetic with the NextWave logo.

### 3. CRM Layout (`app/crm/layout.tsx`)
Server component. Checks session server-side (belt-and-suspenders alongside middleware). Renders:
- Left sidebar (240px): logo, nav links, user email, sign-out button
- Main content area (flex-1)
- Full dark navy background, no public Navigation or Footer

### 4. Leads Pages
- **List** (`/crm/leads`): Server component. Fetches leads + primary contact joined. Filters: free-text search (name/company/contact), status dropdown, list_type toggle (All / Municipality / Manufacturing). "Add Lead" + "Import CSV" buttons.
- **Add** (`/crm/leads/new`): Selects `list_type` first; form adapts to show relevant fields. Municipality form: name, type, county, population, phone, website, status, priority, pain_points, next_action, notes. Manufacturing form: name, sector, location, employees, revenue, ownership, domain, email_format, outreach_channel, ai_use_cases, buying_trigger, outreach_hook, cold_email_subject, likely_objection, est_sales_cycle, pain_points, notes. Primary contact always shown at bottom (name, title, email, phone, linkedin_url).
- **Detail** (`/crm/leads/[id]`): Left column: editable lead info (all fields for its list_type). Right column: `AssessmentCard` (if any assessments linked — shows Q1–Q4 answers + AI brief, collapsible), then `ContactsCard`, then `InteractionFeed` + "Add Note" / "Log Call" form.

### 5. Import Wizard (`/crm/import`)
Client component `ImportWizard`. Supports both list types:
1. Select list type (Municipality / Manufacturing)
2. Paste CSV text or upload `.csv` file
3. Auto-map columns using known header names from the column mapping table above
4. Preview table (first 10 rows) with mapped fields highlighted
5. "Import N leads" button → calls `importLeads` server action → bulk-inserts to `leads` + `lead_contacts`
6. For Municipality rows where "Next Action" column contains a pipe-separated secondary contact string, parse it into a second `lead_contacts` row

### 6. Pipeline (`/crm/pipeline`)
Client component. Fetches all leads with primary contact. Groups into columns: Prospect → Contacted → Qualified → Proposal → Negotiating → Won → Lost. Cards show: name, location, primary contact name, priority badge, last contacted date. Clicking a card opens the lead detail. Status change via dropdown on card → `updateLead` server action.

### 7. Assessment Persistence (`app/actions/assessment.ts` update)
After the existing Teams webhook fire, add:
1. Initialize Supabase server client
2. Check `lead_contacts` for a row where `email = answers.email` (ilike, case-insensitive)
3. If match found: use that `lead_id`
4. If no match: insert a new `leads` row (`name`, `company` from answers, `status='prospect'`, `list_type='other'`) + a `lead_contacts` row — capture the `lead_id`
5. Insert into `assessments` table with all fields + linked `lead_id`
6. Failures are swallowed (same graceful degradation pattern already in the file) so a DB outage doesn't break the user-facing dialog

The `AssessmentAnswers` type in `assessment.ts` already has `name`, `email`, `company`. The 4 question answers map to `resonates_with`, `timeline`, `win_criteria`, `additional_notes` and are also stored wholesale in `answers` (JSONB).

### 8. Email Agent (`app/api/email/poll/route.ts`)
POST endpoint secured by `EMAIL_POLL_SECRET` header. Steps:
1. Connect to IMAP via `imapflow`, open INBOX, fetch unseen messages from last 7 days
2. Parse each with `mailparser` → extract `from`, `subject`, `text/plain`, `date`, `messageId`
3. For each email: query `lead_contacts` table for matching `email` address (catches all contacts, not just primaries)
4. If match found: join to `leads` to get `lead_id`; insert `interaction` row; call Claude (`claude-haiku-4-5-20251001`) with email body to extract `ai_summary`, `ai_next_action`, `ai_sentiment`; update lead's `last_contacted_at` and `updated_at`
5. If no match: skip (future: surface as "unmatched email" for manual review)
6. Insert row into `email_sync_log` with counts
7. Return `{ processed, matched, skipped }` JSON

Claude prompt (reuses existing pattern from `app/actions/assessment.ts`):
```
You are a sales CRM assistant. Given an inbound email, extract:
1. A 1-2 sentence summary
2. Recommended next action (one sentence)
3. Sentiment: positive, neutral, or negative
Return JSON only: { summary, nextAction, sentiment }
```

"Sync Now" button on `/crm/settings` calls this endpoint from the client.

---

## Styling Notes
- CRM uses the same navy/teal token system (`bg-navy-950`, `text-teal-light`, etc.)
- Status badges: color-coded (prospect=gray, contacted=blue, qualified=amber, proposal=teal, won=green, lost=red)
- Tables: `bg-white/5 border border-white/10` card pattern (matches existing page sections)
- Sidebar: `bg-navy-900` with `border-r border-white/10`

---

## Verification
1. Visit `/crm` without auth → redirected to `/crm/login` ✓
2. Enter email → receive OTP → enter code → land on `/crm/leads` ✓
3. Add a lead → appears in list and pipeline ✓
4. Import a CSV → leads + contacts created correctly ✓
5. `/crm` does not appear in `robots.txt` allow list ✓
6. Public site nav/footer hidden on all `/crm/*` routes ✓
7. Submit assessment dialog → row in `assessments` table, linked to lead ✓
8. POST `/api/email/poll` with correct secret → fetches emails, creates interactions, updates leads ✓
9. Lead detail shows assessment card + AI summary after email sync ✓
10. `npx tsc --noEmit` — no type errors ✓
