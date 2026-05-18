# AI-Powered Permit & Application Processing Agent
## Product Requirements Document

---

## Overview

Permit and application submissions arrive in inconsistent formats — uploaded PDFs, paper scans, web forms, and email attachments — each with different field names, layouts, and completeness levels. Staff currently spend hours manually reading, interpreting, and routing each submission to the correct department before any actual review begins.

This agent reads submitted applications, extracts structured data from unstructured documents, checks completeness against each permit type's requirements, flags deficiencies back to the applicant, and routes complete applications to the correct department queue — all before a human ever touches the file.

**Key design constraints:**
- Lives inside Jarvis as a git submodule at `/agents/permit-processing/`
- Mounted at `/apps/permit-processing` in the main app
- Shared Supabase backend with org-level RLS isolation
- Uses Claude (Anthropic SDK) for document extraction and routing logic
- All AI calls go through `/src/lib/providers/llm.ts` — Ollama fallback supported

**Target outcome:** Reduce intake-to-routing time from days to minutes. Staff open a queue of complete, pre-validated applications sorted by permit type and urgency — not a pile of raw PDFs.

---

## The Core Problem

Municipal permit processing fails at intake. A building permit might require 12 fields; staff receive a PDF with 8 of them legible, 2 ambiguous, and 2 missing entirely. No one knows until someone reads the whole document. That read happens 2 days after submission. The applicant gets a rejection letter on day 4. They resubmit. The cycle repeats.

This system moves the completeness check to submission time — or within minutes of it — and gives applicants immediate, specific feedback: not "your application is incomplete" but "Section 3B requires a site plan with dimensions; your uploaded file does not contain one."

---

## System Architecture: 5 Layers

### Layer 1 — Submission Ingestion

Applications can arrive via multiple channels:

- **File upload** — PDF, DOCX, image (PNG/JPG) via the portal UI
- **Email attachment** — IMAP connector monitors a designated permits inbox
- **Web form** — Structured submissions from a public-facing form (Phase 2)

**Document handling:**
- PDFs run through `pdf-parse` for text extraction
- Scanned PDFs and image files run through `node-tesseract-ocr` for OCR
- Multi-page documents are chunked and processed in sections
- Raw extracted text is stored alongside the original file

---

### Layer 2 — AI Extraction

Claude reads the raw document text and extracts all permit-relevant fields into a structured JSON object. Each field gets a confidence score.

**Confidence levels:**
- `HIGH` — explicitly stated and unambiguous
- `MEDIUM` — implied, inferred from context, or partially legible
- `LOW` — absent, illegible, or contradictory

**Universal extracted fields (all permit types):**

```json
{
  "applicant_name": "...",
  "applicant_email": "...",
  "applicant_phone": "...",
  "applicant_address": "...",
  "property_address": "...",
  "parcel_number": "...",
  "permit_type_detected": "building | event | business_license | zoning | road_use | environmental | other",
  "project_description": "...",
  "estimated_cost": null,
  "start_date": null,
  "submission_date": "...",
  "supporting_documents_listed": ["site plan", "insurance certificate"],
  "confidence_scores": {
    "applicant_name": "HIGH",
    "parcel_number": "MEDIUM",
    "estimated_cost": "LOW"
  },
  "raw_text_excerpt": "..."
}
```

**Permit-type-specific fields are appended** based on the detected type (see Permit Types section below).

---

### Layer 3 — Completeness Validation

Each permit type has a `requirements` definition stored in the database (`pp_permit_types` table). After extraction, the agent evaluates the extracted fields against the requirements checklist.

**Validation rules:**
- Required field missing → `MISSING` flag
- Required field present but LOW confidence → `NEEDS_REVIEW` flag
- Required document not found in submission → `MISSING_DOCUMENT` flag
- Detected permit type doesn't match declared type → `TYPE_MISMATCH` warning

**Output: a validation report**

```json
{
  "status": "incomplete | complete | needs_review",
  "completion_score": 0.72,
  "flags": [
    {
      "field": "parcel_number",
      "severity": "error",
      "message": "Parcel number is required for building permits and could not be found in the submitted document."
    },
    {
      "field": "site_plan",
      "severity": "error",
      "message": "A site plan with dimensions is required. No document matching this description was found in the attachments."
    }
  ],
  "auto_routable": false
}
```

---

### Layer 4 — Routing & Assignment

When `auto_routable: true`, the agent routes the application to the correct department queue without human intervention.

**Routing logic:**
- `permit_type_detected` maps to a department via the `pp_departments` table
- If type is ambiguous, routes to a triage queue for a human router to classify
- High-value or high-risk applications (estimated cost > threshold, environmental flag) auto-escalate to supervisor queue

**Department examples:**
- Building & Safety
- Planning & Zoning
- Business Licensing
- Public Works (road use)
- Environmental Compliance
- Events & Special Permits

**Assignment:**
- Round-robin assignment within a department queue (configurable per department)
- Overridable by department managers
- Estimated processing time displayed based on permit type SLA

---

### Layer 5 — Applicant Notification

**On submission received:**
- Confirmation email with application reference number and submission timestamp

**On incomplete submission:**
- Specific deficiency email listing every missing or flagged item
- Direct link back to their submission with inline annotations

**On routing complete:**
- Status update: "Your application has been assigned to [Department]. Estimated review time: X business days."

**On status change (review, approval, rejection):**
- Staff-triggered notifications from the review UI

---

## Permit Types Supported

### 1. Building Permit
Additional extracted fields: `contractor_name`, `contractor_license`, `structure_type`, `square_footage`, `floors`, `estimated_cost`, `zoning_designation`
Required documents: site plan, floor plan, contractor license copy

### 2. Business License
Additional fields: `business_name`, `business_type`, `dba_name`, `ein_or_ssn_last4`, `owner_name`, `employees_count`, `square_footage_of_premises`
Required documents: lease agreement or property deed, state business registration

### 3. Event Permit
Additional fields: `event_name`, `event_type`, `venue_address`, `expected_attendance`, `alcohol_service`, `amplified_sound`, `road_closures_required`, `event_start_datetime`, `event_end_datetime`
Required documents: insurance certificate ($1M+ general liability), site/venue layout

### 4. Zoning Variance
Additional fields: `current_zoning`, `requested_zoning`, `variance_reason`, `neighboring_properties_notified`
Required documents: site plan, property survey, hardship statement

### 5. Road Use Permit
Additional fields: `road_segment`, `closure_type`, `duration_days`, `traffic_control_plan`
Required documents: traffic control plan, insurance certificate

### 6. Environmental
Additional fields: `project_type`, `watershed_proximity`, `hazardous_materials`, `remediation_plan`
Required documents: environmental impact statement, site assessment

---

## Data Model

All tables use the `pp_` prefix and org-level RLS via `auth_org_id()`.

### `pp_permit_types`
Defines permit types and their requirements checklists.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organisations |
| `slug` | text | `building`, `event`, etc. |
| `name` | text | Display name |
| `department_id` | uuid | Default routing department |
| `required_fields` | jsonb | Array of field requirement objects |
| `required_documents` | jsonb | Array of document requirement objects |
| `sla_business_days` | int | Target review time |
| `fee_structure` | jsonb | Fee calculation rules |
| `created_at` | timestamptz | |

### `pp_departments`
Represents city departments that receive routed applications.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organisations |
| `name` | text | `Building & Safety`, etc. |
| `email` | text | Notification address |
| `assignment_mode` | text | `round_robin`, `manual` |
| `supervisor_user_id` | uuid | Escalation target |
| `created_at` | timestamptz | |

### `pp_applications`
Core application record — one per submission.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `org_id` | uuid | FK → organisations |
| `reference_number` | text | Human-readable ID (e.g. `BLD-2026-00142`) |
| `permit_type_id` | uuid | FK → pp_permit_types (after routing) |
| `detected_permit_type` | text | Raw AI classification before lookup |
| `department_id` | uuid | FK → pp_departments (null until routed) |
| `assigned_to` | uuid | FK → profiles (staff reviewer) |
| `status` | text | `received`, `processing`, `incomplete`, `complete`, `in_review`, `approved`, `rejected`, `withdrawn` |
| `submission_channel` | text | `upload`, `email`, `form` |
| `applicant_name` | text | |
| `applicant_email` | text | |
| `applicant_phone` | text | |
| `property_address` | text | |
| `parcel_number` | text | |
| `project_description` | text | |
| `extracted_data` | jsonb | Full AI extraction output |
| `validation_report` | jsonb | Completeness check output |
| `completion_score` | float4 | 0.0–1.0 |
| `auto_routed` | boolean | Whether AI routed without human intervention |
| `routing_notes` | text | AI reasoning for routing decision |
| `priority` | text | `standard`, `expedited`, `urgent` |
| `fee_amount` | numeric | Calculated fee |
| `fee_paid` | boolean | |
| `submitted_at` | timestamptz | |
| `routed_at` | timestamptz | |
| `reviewed_at` | timestamptz | |
| `decided_at` | timestamptz | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `pp_documents`
Tracks files attached to each application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK → pp_applications |
| `org_id` | uuid | |
| `file_name` | text | |
| `file_type` | text | `pdf`, `image`, `docx` |
| `storage_path` | text | Supabase Storage path |
| `extracted_text` | text | Raw OCR/parse output |
| `document_type_detected` | text | AI classification: `site_plan`, `insurance`, etc. |
| `page_count` | int | |
| `ocr_confidence` | float4 | Average OCR confidence |
| `uploaded_at` | timestamptz | |

### `pp_flags`
Individual deficiency flags on an application.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK → pp_applications |
| `field_name` | text | Which field/document is flagged |
| `flag_type` | text | `MISSING`, `NEEDS_REVIEW`, `MISSING_DOCUMENT`, `TYPE_MISMATCH` |
| `severity` | text | `error`, `warning`, `info` |
| `message` | text | Human-readable description |
| `resolved` | boolean | Cleared by resubmission or staff override |
| `resolved_by` | uuid | FK → profiles |
| `resolved_at` | timestamptz | |
| `created_at` | timestamptz | |

### `pp_audit_log`
Immutable event log — every status change, routing decision, and notification.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK → pp_applications |
| `org_id` | uuid | |
| `event_type` | text | `submitted`, `extraction_complete`, `validation_complete`, `routed`, `assigned`, `status_changed`, `notification_sent`, `flag_raised`, `flag_resolved` |
| `actor_type` | text | `ai`, `staff`, `applicant`, `system` |
| `actor_id` | uuid | User ID or null for AI/system |
| `payload` | jsonb | Event-specific data |
| `created_at` | timestamptz | |

### `pp_notifications`
Tracks applicant-facing email notifications.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `application_id` | uuid | FK → pp_applications |
| `type` | text | `received`, `incomplete`, `routed`, `status_update`, `decision` |
| `recipient_email` | text | |
| `subject` | text | |
| `body` | text | |
| `sent_at` | timestamptz | |
| `delivery_status` | text | `sent`, `failed`, `bounced` |

---

## UI Pages & Components

### App Navigation (CRMNav-style)

The agent gets a top nav with tabs:
- **Queue** — Incoming applications pending AI processing or routing
- **Applications** — All applications (filterable by status, type, department, date)
- **Departments** — Department queues with assigned workloads
- **Permit Types** — Configure requirements checklists per permit type
- **Settings** — IMAP config, notification templates, routing rules

---

### `/apps/permit-processing` → Queue

The primary work surface. Three columns:

**Column 1: Received**
New submissions — AI processing in progress or completed. Badge shows completion score.

**Column 2: Incomplete**
Applications flagged with errors. Expandable rows show specific flags. Staff can send deficiency notice or override and force-advance.

**Column 3: Ready to Route**
Complete applications awaiting routing confirmation. One-click routing or manual re-assignment.

---

### `/apps/permit-processing/applications`

Full application list with:
- Status badge (`received`, `incomplete`, `in_review`, `approved`, `rejected`)
- Completion score bar
- Department assignment
- Assigned reviewer
- Days since submission
- SLA indicator (green/yellow/red based on permit type SLA)

Filters: permit type, department, status, date range, assigned staff

---

### `/apps/permit-processing/applications/[id]`

Application detail view — the main reviewer interface.

**Left panel:**
- Application metadata (reference number, permit type, dates, fee status)
- Applicant contact info
- Property / parcel info
- Status timeline (audit log events rendered as a vertical timeline)

**Center panel:**
- Extracted data fields displayed with confidence indicators
  - `HIGH` → green dot
  - `MEDIUM` → yellow dot
  - `LOW` → red dot + editable override
- Validation flags listed with descriptions
- Staff can mark flags resolved with a note

**Right panel:**
- Document viewer — preview uploaded files inline (PDF embed, image display)
- Document classification badges (what the AI identified each file as)
- Upload additional documents

**Actions:**
- Send deficiency notice (pre-populated from flags, editable)
- Route to department (dropdown + assign staff)
- Approve / Reject (with reason note)
- Request additional info

---

### `/apps/permit-processing/departments`

Per-department view:
- Queue size and average age
- Staff members and current assignment load
- SLA compliance rate (last 30 days)
- Department-level settings (assignment mode, notification email)

---

### `/apps/permit-processing/permit-types`

Configuration UI for permit type requirements:
- Drag-and-drop field requirement builder
- Required document checklist editor
- SLA days setting
- Fee structure editor (flat, tiered, calculated)
- Test extraction against a sample document

---

## API Routes

### Intake
| Method | Route | Description |
|---|---|---|
| POST | `/api/permit-processing/submit` | Accept application upload (file + metadata) |
| POST | `/api/permit-processing/ingest-email` | Triggered by IMAP poll — processes email attachments |

### Applications
| Method | Route | Description |
|---|---|---|
| GET | `/api/permit-processing/applications` | List applications (with filters) |
| GET | `/api/permit-processing/applications/[id]` | Get application detail |
| PATCH | `/api/permit-processing/applications/[id]` | Update status, assignment, notes |
| POST | `/api/permit-processing/applications/[id]/route` | Trigger/confirm routing |
| POST | `/api/permit-processing/applications/[id]/notify` | Send applicant notification |
| POST | `/api/permit-processing/applications/[id]/flags/[flagId]/resolve` | Resolve a flag |

### AI Processing
| Method | Route | Description |
|---|---|---|
| POST | `/api/permit-processing/extract` | Run extraction on a document |
| POST | `/api/permit-processing/validate` | Run completeness check on extracted data |
| POST | `/api/permit-processing/classify-document` | Identify document type from file |

### Configuration
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/permit-processing/permit-types` | List / create permit types |
| PATCH | `/api/permit-processing/permit-types/[id]` | Update permit type requirements |
| GET/POST | `/api/permit-processing/departments` | List / create departments |
| PATCH | `/api/permit-processing/departments/[id]` | Update department config |

---

## Agent Architecture

### `agents/permit-processing/manifest.json`

```json
{
  "slug": "permit-processing",
  "name": "Permit & Application Processing",
  "description": "AI-powered intake, extraction, validation, and routing for municipal permit applications",
  "entry": "/apps/permit-processing",
  "version": "1.0.0",
  "permissions": {
    "supabase": ["read", "write"],
    "email": ["imap", "smtp"],
    "storage": ["read", "write"]
  }
}
```

### Directory Structure

```
agents/permit-processing/
├── manifest.json
├── package.json
├── tsconfig.json
├── next.config.ts
├── app/
│   ├── page.tsx                    # Queue (default view)
│   ├── layout.tsx                  # PermitNav wrapper
│   ├── applications/
│   │   ├── page.tsx                # All applications list
│   │   └── [id]/
│   │       └── page.tsx            # Application detail
│   ├── departments/
│   │   └── page.tsx
│   ├── permit-types/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── components/
│   ├── PermitNav.tsx
│   ├── ApplicationQueue.tsx         # Three-column kanban queue
│   ├── ApplicationTable.tsx
│   ├── ApplicationDetail.tsx
│   ├── ExtractionPanel.tsx          # Extracted fields with confidence indicators
│   ├── ValidationFlags.tsx          # Flag list + resolve actions
│   ├── DocumentViewer.tsx           # Inline PDF/image preview
│   ├── RoutingPanel.tsx             # Department + staff assignment
│   ├── StatusTimeline.tsx           # Audit log as timeline
│   ├── DeficiencyNoticeModal.tsx    # Editable notification modal
│   └── PermitTypeEditor.tsx         # Requirements checklist builder
├── lib/
│   ├── extraction/
│   │   ├── claude.ts               # Claude extraction prompt + parser
│   │   ├── documents.ts            # PDF/OCR extraction helpers
│   │   └── types.ts                # Extraction result types
│   ├── validation/
│   │   ├── engine.ts               # Completeness check logic
│   │   └── rules.ts                # Per-permit-type rule sets
│   ├── routing/
│   │   └── router.ts               # Department routing logic
│   ├── notifications/
│   │   └── smtp.ts                 # Applicant notification emails
│   └── ingestion/
│       └── imap.ts                 # Email attachment polling
└── supabase/
    └── migrations/
        └── 001_permit_processing_schema.sql
```

---

## AI Prompt Design (Extraction)

The extraction prompt is structured to produce consistent JSON output with confidence scores. Claude is given:

1. **System context** — the permit type (if known), the municipality name, and the expected field schema
2. **Document text** — the full extracted/OCR'd text of the submission
3. **Instruction** — extract all fields, assign confidence, identify document types present

The response is parsed into the `ExtractionResult` type. Fields that cannot be found are returned as `null` with `LOW` confidence rather than omitted, so the validation layer has a complete map to check against.

**Routing prompt** (separate call, fired after extraction):
Claude is given the extracted data summary and a list of departments with their routing criteria. It returns a department recommendation with a confidence score and a one-sentence reasoning note. Routing decisions below 0.85 confidence are held for human review.

---

## Wiring into Jarvis Main App

### 1. Nav entry (`/src/lib/nav-config.ts`)

Add to `NAV_ENTRIES`:
```ts
{
  slug: 'permit-processing',
  label: 'Permits',
  icon: 'ClipboardCheck',
  href: '/apps/permit-processing',
}
```

### 2. Route mount (`/src/app/(app)/apps/permit-processing/`)

- `layout.tsx` — imports and renders `PermitNav` from `@permit-processing`
- `page.tsx` and sub-routes re-export from the agent package

### 3. Path alias (`tsconfig.json`)

```json
"@permit-processing": ["agents/permit-processing"]
```

### 4. Home dashboard widget (`/src/app/(app)/page.tsx`)

Add a summary card:
- Applications received today
- Pending routing (complete but unrouted)
- Average completion score (last 7 days)
- Applications by status (small donut or bar)

---

## Supabase Migration: `20250101000008_permit_processing_schema.sql`

Creates all `pp_` tables with:
- `org_id` foreign keys to `organisations`
- RLS policies using `auth_org_id()` helper (matching existing pattern)
- Indexes on `status`, `department_id`, `permit_type_id`, `submitted_at`
- Default data: standard permit types (building, business_license, event, zoning, road_use, environmental) with placeholder requirement sets
- Reference number generation function: `generate_permit_reference(type_slug text) → text`

---

## Notifications (Email Templates)

Four templates, stored as configurable text in `instance_config` or the permit settings UI:

1. **Receipt** — "We received your application. Reference: [ref]. We will review it within [SLA] business days."
2. **Deficiency Notice** — "Your application is missing the following required information: [bulleted flag list]. Please resubmit with corrections."
3. **Routing Confirmation** — "Your application has been assigned to [Department] for review. Estimated response: [SLA]."
4. **Decision** — "Your permit application [ref] has been [approved/rejected]. [Reason/conditions]."

---

## Out of Scope (Phase 1)

- **Online public portal** — a citizen-facing web form for direct submission (Phase 2)
- **Fee payment integration** — processing fees online (Phase 2)
- **GIS / parcel lookup** — automatic parcel validation against county GIS data (Phase 2)
- **Workflow approvals with multi-department sign-off** — sequential approval chains (Phase 2)
- **Mobile app** — (Phase 3)
- **Integration with existing permit management systems** (Accela, Tyler Technologies) — depends on municipality

---

## Acceptance Criteria

| # | Criteria |
|---|---|
| 1 | A submitted PDF building permit is extracted, validated, and in the queue within 60 seconds of upload |
| 2 | Extraction identifies at least 80% of clearly stated fields with HIGH confidence |
| 3 | A complete application is routed to the correct department with no staff intervention |
| 4 | An incomplete application generates a deficiency email listing every specific missing item |
| 5 | Every action (extraction, routing, notification, status change) is recorded in the audit log |
| 6 | Staff can override any AI decision with a note, and the override is logged |
| 7 | The home dashboard card shows live application counts |
| 8 | Permit type requirements are configurable by admins without code changes |

---

## Build Sequence

1. **Database** — Migration with all `pp_` tables, RLS policies, reference number function
2. **Document extraction lib** — `lib/extraction/` (PDF parse + OCR + Claude extraction prompt)
3. **Validation engine** — `lib/validation/` (rules + completeness scorer)
4. **API routes** — `/submit`, `/extract`, `/validate`, `/applications` CRUD
5. **Queue UI** — Three-column `ApplicationQueue` with status cards
6. **Application detail UI** — `ExtractionPanel`, `ValidationFlags`, `DocumentViewer`, `StatusTimeline`
7. **Routing logic + panel** — Department assignment, AI routing call, `RoutingPanel` component
8. **Notifications** — SMTP integration, `DeficiencyNoticeModal`, notification templates
9. **IMAP ingestion** — Email attachment polling (reuse pattern from CRM agent)
10. **Configuration UI** — Permit type editor, department management
11. **Jarvis wiring** — Nav entry, route mounts, tsconfig alias, home dashboard card
