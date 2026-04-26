# Constituent Service AI — PRD v2.0

**Product:** Jarvis Platform — Constituent Service AI Submodule
**Version:** 2.0 | **Status:** Draft | **Stack:** Next.js · Tailwind · Framer Motion · Supabase
**Author:** NextWave Consulting, Inc.
**Supersedes:** v1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [User Roles & Personas](#3-user-roles--personas)
4. [Channel Specifications](#4-channel-specifications)
5. [Agent Design](#5-agent-design)
6. [Ontology & Dynamic Intent System](#6-ontology--dynamic-intent-system)
7. [Data Model](#7-data-model-supabase)
8. [API Design](#8-api-design-nextjs-route-handlers)
9. [Admin Dashboard](#9-admin-dashboard-ui)
10. [Embeddable Chat Widget](#10-embeddable-chat-widget)
11. [Onboarding & Import Pipeline](#11-onboarding--import-pipeline)
12. [Third-Party Integrations](#12-third-party-integrations)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Recommended File Structure](#14-recommended-file-structure)
15. [Implementation Milestones](#15-implementation-milestones)
16. [Open Questions & Decisions](#16-open-questions--decisions)
17. [Success Metrics](#17-success-metrics)

---

## 1. Overview

The Constituent Service AI is a Jarvis platform submodule that deploys a configurable, multi-channel AI agent for local government clients. It handles resident inquiries 24/7 across web chat, SMS, email, and voice — returning accurate answers about permits, services, hours, payments, and events — without consuming staff time on routine questions.

**Deployment model:** Each municipal client receives their own isolated deployment — a dedicated Supabase project, a dedicated Next.js instance (or subdomain), and dedicated channel credentials (Twilio, SendGrid). There is no shared multi-tenant infrastructure. This simplifies the data model, eliminates cross-client data risk, and makes each deployment fully self-contained.

**Target outcome:** Reduce inbound call and email volume by 40%+ within 90 days of go-live. Auto-resolve ≥ 85% of inquiries without staff involvement. Staff only handle escalated, genuinely complex issues — and receive full conversation context when they do.

### 1.1 Goals

- Deploy a production-ready instance for a new municipal client in under 2 weeks
- Support four inbound channels: web chat, SMS, email, and voice IVR
- Drive all agent behavior from database configuration — no code changes required to onboard a new client or customize an existing one
- Provide an admin dashboard for staff to monitor conversations, manage knowledge, tune intent configuration, and handle escalations
- Make onboarding a repeatable, scriptable pipeline: crawl site → fill checklist → run import → go live

### 1.2 Non-Goals (v1)

- Transactional processing (permit applications, payments initiated by the agent) — v2
- Permitting or CRM system write-back (Accela, Tyler Incode, Salesforce) — v2
- Multi-language support beyond English — v2
- Custom fine-tuned models — uses Claude API with RAG throughout

---

## 2. Architecture Philosophy

### 2.1 Single-Tenant Per Deployment

Every client is a fully independent deployment with its own infrastructure:

```
Client A (Conshohocken Borough)      Client B (Lansdale Borough)
├── Supabase project A               ├── Supabase project B
├── Next.js instance / subdomain A   ├── Next.js instance / subdomain B
├── Twilio credentials A             ├── Twilio credentials B
└── SendGrid subaccount A            └── SendGrid subaccount B
```

**What this means for the codebase:**

- No `tenant_id` column anywhere in the schema — every table belongs to one municipality
- RLS policies are role-based only (`staff`, `admin`, `service`) — not tenant-partitioned
- The Supabase URL and anon key are environment variables baked into each deployment
- Spinning up a new client = provisioning a new Supabase project + running the import pipeline

**Jarvis Ops:** NextWave manages client deployments from an internal Ops Dashboard (out of scope for this PRD, tracked separately). The client only ever sees their own Admin Dashboard.

### 2.2 Configuration as Data

Agent behavior lives entirely in Supabase — not in code. The application layer is generic and identical across every deployment. What makes a deployment "Conshohocken" vs. "Lansdale" is the data.

```
Application code      ──  Generic. Identical across all deployments. Ships once.
       ↓
Config tables         ──  municipality_config, intents, escalation_routes.
       ↓                  Defines WHO the agent is and HOW it routes.
Knowledge chunks      ──  The actual content the agent answers from.
                          Populated per client from their site + documents.
```

The practical result: enabling a new service type, adjusting an escalation path, toggling a channel on or off — all done via the admin dashboard. Zero code deployments needed post-launch.

### 2.3 Ontology as the Design Contract

The base ontology file (`municipal-constituent-ai-base-ontology.md`) is the shared design artifact across all client engagements. It defines the full universe of intent domains, labels, resolution tiers, and escalation buckets that the application code understands.

Per-client onboarding is the act of:
1. Selecting which base intents apply to this municipality
2. Adding any municipality-specific intents not in the base
3. Configuring the escalation routes for each bucket
4. Populating the knowledge base

The `intents` table in Supabase is the runtime representation of the ontology for a given deployment.

---

## 3. User Roles & Personas

| Role | Description |
|---|---|
| **Resident / Citizen** | End user submitting inquiries via any channel. Anonymous — not logged in. Expects instant, accurate answers. |
| **Staff Agent** | Municipal employee who handles escalated tickets, reviews conversation logs, and manages the knowledge base via the admin dashboard. |
| **Admin** | Department head or IT lead. Full configuration access: channels, intent settings, escalation routing, branding. |
| **Jarvis Ops** | NextWave internal. Provisions new deployments, manages Supabase projects, monitors system health across all clients. Not surfaced in the client-facing UI. |

---

## 4. Channel Specifications

All four channel adapters share the same `AgentService` core and knowledge base. Each adapter normalizes inbound messages into a standard `ChannelMessage` object and formats outbound responses to channel-specific constraints.

---

### 4.1 Web Chat

#### Entry Point

- Embeddable `<script>` tag that mounts a React chat widget on the client's existing website
- Widget served from Jarvis CDN; configured via `data-*` attributes (primary color, position, greeting)
- Supports floating launcher button or full inline embed

#### Conversation Flow

1. Resident opens widget → greeting message displayed immediately with quick-reply chips
2. Resident types or taps a chip → message sent to `/api/channels/chat/message`
3. Agent processes → response streamed back token-by-token via SSE
4. Conversation continues until resolved or escalation triggered
5. On escalation: resident offered option to leave name and contact info; ticket created with full transcript

#### Technical Requirements

| Requirement | Detail |
|---|---|
| Streaming | Server-Sent Events via Next.js Route Handler; token-by-token from Claude API |
| Session persistence | Anonymous session; conversation stored in `conversations`; resumable via `localStorage` session token |
| Accessibility | WCAG 2.1 AA — keyboard navigable, `aria-live` regions, sufficient contrast |
| Mobile | Fully responsive; launcher collapses to full-screen sheet on mobile |
| Rate limiting | 10 messages/min per session via Edge Function middleware |
| Widget isolation | Shadow DOM to prevent host page CSS bleed |

---

### 4.2 SMS

#### Entry Point

- Client provisions a Twilio phone number via admin dashboard (or ports existing number)
- Resident texts the number — no app required
- Twilio webhook POSTs to `/api/channels/sms/inbound`

#### Conversation Flow

1. Inbound SMS → Twilio webhook → adapter normalizes to `ChannelMessage`
2. Agent processes → response constrained to ≤ 280 chars (1 segment) preferred; max 3 segments
3. Response sent via Twilio SMS API
4. `STOP` / `UNSTOP` / `HELP` keywords handled per TCPA before reaching agent
5. Escalation: resident offered a callback request via SMS reply

#### Technical Requirements

| Requirement | Detail |
|---|---|
| Provider | Twilio Programmable SMS |
| Webhook security | Twilio signature validation on every inbound request |
| Opt-out compliance | STOP / UNSTOP / HELP auto-handled before agent sees message |
| Threading | Keyed on `from_number`; 24-hour inactivity window resets session |
| Tone | System prompt instructs plain text, ≤ 280 chars, no markdown, no lists |

---

### 4.3 Email

#### Entry Point

- Client configures a monitored mailbox (e.g., `services@municipality.gov`) in admin dashboard
- Inbound mail forwarded via SendGrid Inbound Parse webhook to `/api/channels/email/inbound`
- Fallback: Gmail or Outlook OAuth polling for clients who cannot modify DNS/MX records

#### Conversation Flow

1. Email arrives → SendGrid parses → adapter extracts sender, subject, body (HTML stripped), thread ID
2. Agent generates a full email-formatted response: greeting, 2–5 sentence answer, sign-off
3. Response sent via SendGrid Transactional API (or client SMTP) from the monitored address
4. Thread continuity maintained via `Message-ID` / `In-Reply-To` headers
5. Escalation: ticket created, staff notified, staff reply address CC'd

#### Technical Requirements

| Requirement | Detail |
|---|---|
| Inbound | SendGrid Inbound Parse (primary); Gmail/Outlook OAuth polling (fallback) |
| Outbound | SendGrid Transactional API; client can supply SMTP credentials |
| Threading | `In-Reply-To` + `References` headers stitch replies into existing conversation records |
| Filtering | Auto-replies (`X-Auto-Response-Suppress`) and spam-scored messages silently dropped |
| Attachments | Logged but not processed by agent in v1; staff notified on escalation |
| Tone | System prompt instructs formal, professional email register with greeting and sign-off |

---

### 4.4 Voice (IVR)

#### Entry Point

- Client provisions a Twilio Voice number via admin dashboard
- Caller dials → Twilio executes TwiML served by `/api/channels/voice/twiml`
- IVR menu configurable in admin dashboard (department options + AI assistant option)

#### Conversation Flow

1. Call connects → TwiML greeting played via `<Say>` TTS
2. Resident speaks → Twilio STT transcribes → text posted to `/api/channels/voice/gather`
3. Agent generates response (≤ 35 words, no lists, natural speech)
4. Response played via `<Say>` → loop continues
5. Escalation: `<Dial>` warm transfer to configured staff queue number, or callback request recorded

#### Technical Requirements

| Requirement | Detail |
|---|---|
| Provider | Twilio Programmable Voice; TwiML served dynamically |
| STT | Twilio `<Gather input="speech">`; DTMF keypad fallback |
| TTS | Amazon Polly via Twilio `<Say>` — Joanna (en-US) default; configurable |
| Latency | < 3s perceived from end of speech to TTS start |
| Response length | ≤ 35 words per turn; system prompt enforces this |
| Call recording | Optional; requires disclosure played before recording begins |
| Warm transfer | `<Dial>` verb to staff queue number set in admin dashboard |
| Timeouts | 5s silence re-prompts; 3 consecutive timeouts end call gracefully |

---

## 5. Agent Design

### 5.1 Processing Pipeline

Every inbound message, regardless of channel, flows through the same pipeline:

```
Inbound message (any channel)
        │
        ▼
┌─────────────────┐
│ Channel Adapter │  Normalizes to ChannelMessage { channel, content, session_id }
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ ConversationService │  Load/create conversation + message history from Supabase
└────────┬────────────┘
         │
         ▼
┌──────────────────┐
│ IntentClassifier │  Single fast Claude call → intent_label, confidence, domain
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│  Intent Config Lookup│  Load matching intent row from `intents` table
│  (from Supabase)     │  → get tier (T1/T2/T3), escalation_bucket, custom_response
└────────┬─────────────┘
         │
    ┌────┴────┐
    │  Tier?  │
    └────┬────┘
    T3 ──┤──────────────────────────────► EscalationRouter (immediate)
    T2 ──┤──► KnowledgeRetriever ───────► AgentService ──► EscalationRouter (after answer)
    T1 ──┘──► KnowledgeRetriever ───────► AgentService ──► Response
                                                  │
                                                  ▼
                                           AuditLogger
                                           Channel Adapter (format + send)
```

### 5.2 Component Responsibilities

| Component | Responsibility |
|---|---|
| **ChannelAdapter** | Normalize inbound to `ChannelMessage`; format outbound response to channel constraints (length, markdown, tone) |
| **ConversationService** | Load or create `conversation` + `messages` history; enforce session window and rate limits |
| **IntentClassifier** | Fast single-turn Claude call with structured JSON output: `{ intent_label, confidence, domain }` |
| **IntentConfigService** | Query `intents` table for the matched label; return tier, escalation bucket, any custom response override |
| **KnowledgeRetriever** | pgvector cosine similarity search scoped to the intent's domain; return top-5 chunks above threshold |
| **AgentService** | Main Claude API call; system prompt + history + retrieved chunks; streams response; detects escalation signal in output |
| **EscalationRouter** | Create `escalation_ticket`; notify staff via configured route (email, Slack, PagerDuty); attach transcript |
| **AuditLogger** | Append-only write to `audit_logs`: message, intent, tier, confidence, latency, tokens, escalation flag |

### 5.3 System Prompt Structure

The system prompt is assembled at runtime from three layers:

```
[1] BASE PROMPT (hardcoded)
    Core identity, safety rules, emergency handling,
    out-of-scope redirect behavior.

[2] MUNICIPALITY CONTEXT (from municipality_config table)
    "You are [name]'s virtual assistant."
    "Borough Hall is at [address], open [hours]."
    "Phone: [phone]. Website: [url]."

[3] CHANNEL RULES (from channel parameter)
    chat:  "Respond in 1–4 sentences. Markdown allowed."
    sms:   "Respond in ≤ 280 characters. Plain text only. No lists."
    email: "Respond with greeting, 2–5 sentence answer, sign-off."
    voice: "Respond in ≤ 35 words. No lists. Speak naturally."
```

The base prompt includes hardcoded escalation signal instructions:

```
When you cannot fully resolve the inquiry, or when the following
conditions are met, output a JSON escalation signal on the LAST line
of your response (after your answer to the resident):

{"escalate": true, "bucket": "[escalation_bucket]", "reason": "..."}

Escalate when:
- The question requires account-specific data you cannot access
- The issue involves safety, legal, or emergency concerns  
- The resident has expressed frustration more than once
- The topic is outside your configured knowledge areas
- The intent tier is T2 or T3 (you will be told this in context)

EMERGENCY RULE: If the message contains any reference to a fire,
gas leak, medical emergency, or immediate safety threat — stop
immediately and respond only: "Please call 911 right now."
Do not attempt any other response.
```

### 5.4 Intent Classification

The classifier is a lightweight, fast Claude call that runs before the main agent call. It returns structured JSON:

```json
{
  "intent_label": "trash.missed_pickup",
  "confidence": 0.91,
  "domain": "trash"
}
```

**Confidence thresholds:**

| Score | Action |
|---|---|
| ≥ 0.85 | Proceed with matched intent config |
| 0.65 – 0.84 | Proceed but append "Did I answer your question?" to response |
| < 0.65 | Treat as `general.clarify` — ask one clarifying question before proceeding |

### 5.5 Knowledge Retrieval

- pgvector cosine similarity search on `knowledge_chunks`
- Query: the resident's message (embedded with `text-embedding-3-small`)
- Scoped by `domain` column where possible (reduces noise for high-confidence intents)
- Returns top-5 chunks with `similarity >= 0.72`
- Chunks injected into agent context as: `"Relevant knowledge:\n\n[chunk 1]\n\n[chunk 2]..."`
- If no chunks meet threshold: agent answers from municipality_config only and flags low-confidence

---

## 6. Ontology & Dynamic Intent System

### 6.1 How It Works

The `intents` table is the runtime representation of the ontology. It is seeded during onboarding from the base ontology file and the client's configuration checklist. After go-live, it is managed via the admin dashboard.

Every intent has:

- A **label** matching the base ontology taxonomy (e.g., `trash.missed_pickup`)
- A **domain** for grouping and knowledge scoping (e.g., `trash`)
- A **tier** that controls resolution behavior (T1 / T2 / T3)
- An **escalation_bucket** that maps to an `escalation_routes` row
- An optional **custom_response** that short-circuits the agent for simple static answers
- An **enabled** flag for toggling without deletion

### 6.2 Resolution Tier Behavior

| Tier | Name | Agent Behavior |
|---|---|---|
| **T1** | Auto-resolve | Full KnowledgeRetriever + AgentService call. Response sent directly to resident. No staff involvement unless agent self-escalates. |
| **T2** | Guided escalation | KnowledgeRetriever + AgentService call. Agent provides best partial answer + captures resident contact info + creates escalation ticket. Staff follows up. |
| **T3** | Hard escalation | No KnowledgeRetriever or AgentService call. EscalationRouter fires immediately. Agent delivers a single configured message (e.g., "Please call 911" or "This requires L&I staff — let me connect you"). |

### 6.3 Custom Response Override

For intents where the answer is always the same short string (e.g., borough hall hours, main phone number), the `custom_response` field bypasses the full agent pipeline entirely:

```
IntentClassifier → IntentConfigService → custom_response exists?
                                              │
                                         YES ─┘──► Return custom_response directly
                                         NO  ──────► KnowledgeRetriever → AgentService
```

This reduces latency and token cost for the highest-volume, lowest-complexity intents.

### 6.4 Escalation Bucket System

Escalation buckets are named strings that map to one or more notification routes in `escalation_routes`. The bucket names are defined in the base ontology and consistent across all deployments. The routes (email addresses, webhook URLs, phone numbers) are deployment-specific.

**Standard bucket names (from base ontology):**

```
escalation.emergency          → 911 (hardcoded, not a DB route)
escalation.li                 → Licenses & Inspections staff
escalation.zoning             → Zoning Officer
escalation.public_services    → Public Works / DPW
escalation.police             → Police non-emergency
escalation.recreation         → Recreation department
escalation.manager            → Borough/Township Manager
escalation.tax                → Tax collector (often external)
escalation.utility.water      → Water provider (external redirect)
escalation.utility.sewer      → Sewer authority (external redirect)
escalation.utility.electric   → Electric/gas provider (external redirect)
escalation.county             → County government (external redirect)
```

External redirect buckets (`utility.*`, `escalation.county`) never create an internal ticket. They return a response with the third-party's contact information.

### 6.5 Adding Municipality-Specific Intents

The base ontology covers ~95 intents across 14 domains. Some clients will have services not in the base (e.g., a municipal golf course, a borough-run ferry, a specific grant program). These are added as custom intent rows in the `intents` table with a label prefixed `custom.*` to distinguish them from base ontology labels.

Custom intents are added via the admin dashboard's Intent Manager and immediately active on save. No code change or redeployment needed.

---

## 7. Data Model (Supabase)

### 7.1 Schema Overview

```
municipality_config     ← Who this deployment is. Name, address, hours, branding.
intents                 ← What the agent knows how to handle. The ontology at runtime.
escalation_routes       ← Where to send escalations. Per bucket, per channel.
knowledge_chunks        ← What the agent answers from. Content + pgvector embeddings.
conversations           ← Resident sessions, one per channel interaction.
messages                ← Individual turns within a conversation.
escalation_tickets      ← Tickets created on T2/T3 escalation.
audit_logs              ← Append-only event log. Analytics + billing source.
```

### 7.2 Table Definitions

```sql
-- ─────────────────────────────────────────────────────────────
-- Municipality identity and top-level configuration
-- ─────────────────────────────────────────────────────────────
CREATE TABLE municipality_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name                text NOT NULL,           -- "Borough of Conshohocken"
  short_name          text NOT NULL,           -- "Conshohocken"
  municipality_type   text NOT NULL,           -- 'borough' | 'township' | 'city'
  county              text NOT NULL,
  state               text NOT NULL DEFAULT 'PA',

  -- Contact
  address             text NOT NULL,
  phone               text NOT NULL,
  fax                 text,
  email               text,
  website_url         text NOT NULL,
  hours               text NOT NULL,           -- "Mon–Fri, 8:30 AM–4:30 PM"
  hours_structured    jsonb,                   -- { mon: {open: "08:30", close: "16:30"}, ... }

  -- Channel flags
  chat_enabled        boolean DEFAULT true,
  sms_enabled         boolean DEFAULT false,
  email_enabled       boolean DEFAULT false,
  voice_enabled       boolean DEFAULT false,

  -- Branding
  primary_color       text DEFAULT '#1a4d8f',
  logo_url            text,
  chat_greeting       text,                    -- Widget opening message
  chat_quick_replies  jsonb,                   -- ["Trash schedule", "Parking permits", ...]

  -- Agent config
  agent_persona       text,                    -- Override default persona string
  knowledge_updated_at timestamptz,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);


-- ─────────────────────────────────────────────────────────────
-- Intent registry — the ontology as data
-- ─────────────────────────────────────────────────────────────
CREATE TABLE intents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  label               text NOT NULL UNIQUE,    -- 'trash.missed_pickup'
  domain              text NOT NULL,           -- 'trash'
  display_name        text NOT NULL,           -- "Missed trash pickup"
  description         text,                    -- Human-readable description for admin UI

  -- Resolution
  tier                text NOT NULL            -- 'T1' | 'T2' | 'T3'
                      CHECK (tier IN ('T1','T2','T3')),
  custom_response     text,                    -- If set, bypasses agent entirely
  escalation_bucket   text,                    -- Maps to escalation_routes.bucket

  -- Knowledge scoping
  knowledge_domains   text[],                  -- Domains to scope RAG retrieval to

  -- Flags
  enabled             boolean DEFAULT true,
  is_base_ontology    boolean DEFAULT true,    -- false = custom/municipality-specific

  -- Metadata
  example_utterances  text[],                  -- For classifier training / admin UI
  notes               text,                    -- Internal notes

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_intents_label   ON intents (label);
CREATE INDEX idx_intents_domain  ON intents (domain);
CREATE INDEX idx_intents_enabled ON intents (enabled);


-- ─────────────────────────────────────────────────────────────
-- Escalation routing — contacts behind each bucket
-- ─────────────────────────────────────────────────────────────
CREATE TABLE escalation_routes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  bucket              text NOT NULL,           -- 'escalation.li'
  label               text NOT NULL,           -- "Licenses & Inspections"
  channel             text NOT NULL            -- 'email' | 'slack' | 'pagerduty' | 'phone' | 'external_redirect'
                      CHECK (channel IN ('email','slack','pagerduty','phone','external_redirect')),
  destination         text NOT NULL,           -- Email addr, webhook URL, phone number, or external URL
  is_external         boolean DEFAULT false,   -- true = no ticket created, just redirect resident
  external_message    text,                    -- Message shown to resident for external redirects
  priority            int DEFAULT 1,
  active              boolean DEFAULT true,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_escalation_routes_bucket ON escalation_routes (bucket);


-- ─────────────────────────────────────────────────────────────
-- Knowledge base — content chunks with pgvector embeddings
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE knowledge_chunks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title               text NOT NULL,           -- "Trash & Recycling Collection Schedule"
  content             text NOT NULL,           -- Full text of the knowledge chunk
  domain              text NOT NULL,           -- Matches intents.domain for scoped retrieval
  source_type         text NOT NULL            -- 'faq' | 'page' | 'pdf' | 'url' | 'manual'
                      CHECK (source_type IN ('faq','page','pdf','url','manual')),
  source_ref          text,                    -- URL or filename
  source_url          text,                    -- Canonical link to show resident if relevant

  -- Vector
  embedding           vector(1536),

  -- Freshness
  last_updated_at     timestamptz DEFAULT now(),
  review_after        timestamptz,             -- Populated to flag stale chunks

  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_domain ON knowledge_chunks (domain);
CREATE INDEX idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- ─────────────────────────────────────────────────────────────
-- Conversations — one per resident session, per channel
-- ─────────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  channel             text NOT NULL            -- 'chat' | 'sms' | 'email' | 'voice'
                      CHECK (channel IN ('chat','sms','email','voice')),
  status              text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','resolved','escalated')),

  -- Channel-specific identifiers
  session_token       text,                    -- Web chat: localStorage token
  phone_e164          text,                    -- SMS / Voice: E.164 formatted number
  email_address       text,                    -- Email channel
  email_thread_id     text,                    -- Email In-Reply-To thread reference

  -- Resident contact (captured on escalation)
  resident_name       text,
  resident_contact    text,

  -- Resolution
  resolved_at         timestamptz,
  resolution_type     text,                    -- 'auto' | 'escalated' | 'abandoned'

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_channel      ON conversations (channel);
CREATE INDEX idx_conversations_session      ON conversations (session_token);
CREATE INDEX idx_conversations_phone        ON conversations (phone_e164);
CREATE INDEX idx_conversations_email        ON conversations (email_address);
CREATE INDEX idx_conversations_status       ON conversations (status);


-- ─────────────────────────────────────────────────────────────
-- Messages — individual turns within a conversation
-- ─────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,

  role                text NOT NULL            -- 'user' | 'assistant'
                      CHECK (role IN ('user','assistant')),
  content             text NOT NULL,

  -- Classification results
  intent_label        text,                    -- Matched intent label
  intent_confidence   float,                   -- Classifier confidence score
  intent_tier         text,                    -- T1 / T2 / T3 at time of message

  -- Performance
  latency_ms          int,
  token_usage         jsonb,                   -- { input_tokens, output_tokens }

  -- Escalation
  escalated           boolean DEFAULT false,
  escalation_bucket   text,

  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages (conversation_id);
CREATE INDEX idx_messages_intent       ON messages (intent_label);


-- ─────────────────────────────────────────────────────────────
-- Escalation tickets
-- ─────────────────────────────────────────────────────────────
CREATE TABLE escalation_tickets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid NOT NULL REFERENCES conversations (id),

  status              text NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','in_progress','resolved','closed')),
  priority            text DEFAULT 'normal'
                      CHECK (priority IN ('low','normal','high','urgent')),

  bucket              text NOT NULL,           -- Escalation bucket that triggered this
  reason              text NOT NULL,           -- Agent-generated escalation reason
  assigned_to         uuid,                    -- References auth.users

  -- Full transcript snapshot at escalation time
  transcript          jsonb NOT NULL,

  -- Staff workflow
  internal_notes      jsonb DEFAULT '[]',      -- Array of { author, note, created_at }
  staff_reply         text,                    -- Optional direct reply back to resident
  staff_reply_sent_at timestamptz,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  resolved_at         timestamptz
);

CREATE INDEX idx_tickets_status         ON escalation_tickets (status);
CREATE INDEX idx_tickets_bucket         ON escalation_tickets (bucket);
CREATE INDEX idx_tickets_conversation   ON escalation_tickets (conversation_id);


-- ─────────────────────────────────────────────────────────────
-- Audit log — append-only, source of truth for analytics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid REFERENCES conversations (id),

  event_type          text NOT NULL,
  -- Event types:
  --   message.inbound         Resident message received
  --   message.outbound        Agent response sent
  --   intent.classified       Intent classification result
  --   escalation.created      Escalation ticket created
  --   escalation.resolved     Ticket resolved by staff
  --   knowledge.miss          No chunks met similarity threshold
  --   session.started         New conversation created
  --   session.ended           Conversation resolved or abandoned

  channel             text,
  intent_label        text,
  intent_tier         text,
  latency_ms          int,
  token_usage         jsonb,
  payload             jsonb,                   -- Full event payload for debugging

  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_event      ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_channel    ON audit_logs (channel);
CREATE INDEX idx_audit_logs_intent     ON audit_logs (intent_label);
CREATE INDEX idx_audit_logs_created    ON audit_logs (created_at DESC);
```

### 7.3 Row Level Security

```sql
-- Staff: read conversations + messages + tickets for their assigned work
-- Cannot modify intents, escalation_routes, or municipality_config
CREATE POLICY staff_read_conversations ON conversations
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

CREATE POLICY staff_read_messages ON messages
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

CREATE POLICY staff_update_tickets ON escalation_tickets
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' IN ('staff', 'admin'));

-- Admin: full access to config tables
CREATE POLICY admin_all_intents ON intents
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_routes ON escalation_routes
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_knowledge ON knowledge_chunks
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY admin_all_config ON municipality_config
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Service role: used only by server-side Route Handlers
-- Bypasses RLS — never expose this key client-side
-- Set via SUPABASE_SERVICE_ROLE_KEY environment variable only

-- Anonymous: can INSERT new conversations + messages (web chat widget)
-- SELECT restricted to own session_token
CREATE POLICY anon_insert_conversations ON conversations
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY anon_read_own_conversation ON conversations
  FOR SELECT TO anon
  USING (session_token = current_setting('request.jwt.claims', true)::jsonb ->> 'session_token');
```

### 7.4 Seed Data — Intent Import

The `intents` table is seeded from the base ontology on deployment. See Section 11 (Onboarding Pipeline) for the import script specification. The full list of base intent labels is defined in `municipal-constituent-ai-base-ontology.md`.

---

## 8. API Design (Next.js Route Handlers)

### 8.1 Channel Inbound Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/channels/chat/message` | None (session token) | Accepts `{ session_token, content }`. Returns SSE stream. |
| `POST /api/channels/sms/inbound` | Twilio sig validation | Twilio webhook. Returns TwiML `<Response>`. |
| `POST /api/channels/email/inbound` | SendGrid webhook secret | SendGrid Inbound Parse. Sends reply via API. |
| `POST /api/channels/voice/twiml` | Twilio sig validation | Returns initial TwiML for call flow. |
| `POST /api/channels/voice/gather` | Twilio sig validation | Receives STT result. Returns next TwiML. |

### 8.2 Admin API Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/admin/conversations` | JWT (staff/admin) | Paginated list; filters: channel, status, date, intent. |
| `GET /api/admin/conversations/:id` | JWT (staff/admin) | Full detail with messages and ticket. |
| `GET /api/admin/tickets` | JWT (staff/admin) | Open tickets with filters. |
| `PATCH /api/admin/tickets/:id` | JWT (staff/admin) | Update status, assignee, add note, send staff reply. |
| `GET /api/admin/intents` | JWT (admin) | Full intent list with enabled/disabled state. |
| `PATCH /api/admin/intents/:id` | JWT (admin) | Toggle enabled, update tier, set custom_response. |
| `POST /api/admin/intents` | JWT (admin) | Create custom intent (label prefixed `custom.*`). |
| `GET /api/admin/knowledge` | JWT (admin) | List chunks with domain, source, freshness. |
| `POST /api/admin/knowledge` | JWT (admin) | Create/upsert chunk. Triggers embedding job. |
| `DELETE /api/admin/knowledge/:id` | JWT (admin) | Delete chunk and embedding. |
| `POST /api/admin/knowledge/scrape` | JWT (admin) | Queue URL scrape job. Returns `job_id`. |
| `GET /api/admin/knowledge/scrape/:job_id` | JWT (admin) | Poll scrape job status. |
| `GET /api/admin/escalation-routes` | JWT (admin) | List all routes by bucket. |
| `PUT /api/admin/escalation-routes/:bucket` | JWT (admin) | Upsert all routes for a bucket. |
| `GET /api/admin/config` | JWT (admin) | Get municipality_config. |
| `PATCH /api/admin/config` | JWT (admin) | Update municipality_config fields. |
| `GET /api/admin/analytics/summary` | JWT (staff/admin) | KPIs: volume, resolution rate, escalation rate, avg latency — by channel + date range. |
| `GET /api/admin/analytics/intents` | JWT (staff/admin) | Intent frequency breakdown + top unresolved intents. |

---

## 9. Admin Dashboard (UI)

Next.js App Router, Tailwind CSS, Framer Motion. Accessible at `/admin`.

### 9.1 Pages

| Page | Access | Description |
|---|---|---|
| **Overview** | Staff + Admin | KPI cards (conversations today, auto-resolution %, open tickets, avg response time). Channel volume bar chart. Recent activity feed. |
| **Conversations** | Staff + Admin | Paginated table with search, channel badge, status badge, intent label, date filter. Click row → detail slide-over with full transcript and intent/confidence metadata. |
| **Tickets** | Staff + Admin | Kanban board: open / in progress / resolved. `dnd-kit` drag-and-drop. Card shows channel, bucket, reason, age, assignee. Click → detail with transcript, internal notes, staff reply form. |
| **Knowledge Base** | Admin | Chunk list with domain badge, source badge, `last_updated_at`, staleness indicator (> 30 days). Inline edit. Add → slide-over form (manual, URL scrape, PDF upload). Preview Chat pane to test queries against live knowledge. |
| **Intent Manager** | Admin | Full intent list grouped by domain. Toggle enabled/disabled per intent. Edit tier, custom_response, escalation bucket. Add custom intent. Visual indicator: T1 (green) / T2 (amber) / T3 (red). |
| **Escalation Routes** | Admin | Table by bucket. For each bucket: channel selector (email/slack/phone), destination field, active toggle. External redirect buckets show the resident-facing message editor. |
| **Settings — Channels** | Admin | Tab group: Chat (embed snippet, color, greeting, quick-reply chips), SMS (Twilio number, test SMS), Email (mailbox address, SMTP/SendGrid config), Voice (Twilio number, TTS voice, warm transfer number, IVR menu editor). |
| **Settings — Municipality** | Admin | Edit municipality_config fields: name, address, hours, phone, website. Hours editor with per-day open/close times. |
| **Settings — Branding** | Admin | Logo upload, primary color picker, widget preview (live). |

### 9.2 Intent Manager Detail

The Intent Manager is the operational heart of the dynamic ontology system. Key behaviors:

- Intents are grouped by domain with a collapsible accordion
- Each row shows: label, display name, tier badge, enabled toggle, escalation bucket, custom response indicator
- Tier badge is color-coded: T1 green / T2 amber / T3 red
- Disabling an intent routes matching messages to `general.clarify` instead
- Custom response field: if set, a ⚡ icon appears; if empty, agent uses full RAG pipeline
- "Add Custom Intent" button opens a form: label (auto-prefixed `custom.`), display name, domain, tier, escalation bucket, example utterances
- Changes save immediately; no redeployment required

### 9.3 Knowledge Preview Chat

A split-panel view in the Knowledge Base page:

- Left: chunk list with edit/delete
- Right: chat interface that calls the agent in "preview mode" (no conversation persisted, no audit log entry)
- Shows which chunks were retrieved for each message (similarity scores displayed)
- Lets admins validate knowledge coverage before going live and after any content update

### 9.4 Authentication

- Supabase Auth: email/password; optional SSO via WorkOS
- Custom JWT claims: `role` = `staff` or `admin`
- `admin`-only pages protected by Next.js middleware
- `httpOnly` cookie session; refresh token rotation enabled

---

## 10. Embeddable Chat Widget

### 10.1 Embed Snippet

```html
<script
  src="https://[deployment-subdomain].jarvis.nextwave.com/widget/chat.js"
  data-primary-color="#1a4d8f"
  data-position="bottom-right"
  async
></script>
```

No `data-tenant-id` needed — each deployment has its own widget URL. The widget bundle is deployment-specific but built from the same codebase.

### 10.2 Technical Stack

| Concern | Approach |
|---|---|
| Framework | React 18, `useReducer` for conversation state |
| Styling | Tailwind CSS scoped in Shadow DOM — no host page style bleed |
| Animation | Framer Motion spring animation on open/close, message entrance, typing indicator |
| Streaming | `EventSource` consuming SSE from `/api/channels/chat/message` |
| Bundle size | Target < 80KB gzipped |
| Theming | CSS custom properties from `data-primary-color` at mount time |
| Accessibility | `aria-live` for incoming messages, focus trap, `Esc` to close |
| Quick replies | Loaded from `municipality_config.chat_quick_replies` via API on widget mount |

---

## 11. Onboarding & Import Pipeline

This is the mechanism that makes "configuration as data" real. A new client goes from zero to live knowledge base in a single scripted run.

### 11.1 Inputs

1. **Base ontology file** — `municipal-constituent-ai-base-ontology.md`
   The canonical list of all intent labels, tiers, domains, and escalation buckets.

2. **Client config file** — `[slug]-config.json`
   The filled-in onboarding checklist. JSON representation of everything in Section 9 of the base ontology (municipality identity, which intents apply, all contacts, schedules, providers).

   ```json
   {
     "slug": "conshohocken",
     "name": "Borough of Conshohocken",
     "short_name": "Conshohocken",
     "municipality_type": "borough",
     "county": "Montgomery",
     "address": "400 Fayette Street, Conshohocken, PA 19428",
     "phone": "(610) 828-1092",
     "hours": "Mon–Fri, 8:30 AM–4:30 PM",
     "website_url": "https://www.conshohockenpa.gov",
     "primary_color": "#1a4d8f",
     "chat_quick_replies": [
       "Trash pickup schedule",
       "Parking permits",
       "Building permits",
       "Pay a bill or ticket",
       "Upcoming events",
       "Borough hours"
     ],
     "intents_disabled": [
       "transport.local_shuttle",
       "snow.school_closings"
     ],
     "intents_custom": [
       {
         "label": "custom.conshohocken_cab",
         "display_name": "Conshohocken Cab shuttle",
         "domain": "transport",
         "tier": "T1",
         "escalation_bucket": null,
         "example_utterances": [
           "Tell me about the Conshohocken Cab",
           "Shuttle hours",
           "How do I ride the cab?"
         ]
       }
     ],
     "escalation_routes": {
       "escalation.li": {
         "channel": "email",
         "destination": "buildinginspector@conshohockenpa.gov"
       },
       "escalation.public_services": {
         "channel": "phone",
         "destination": "(610) 828-1092"
       },
       "escalation.utility.water": {
         "channel": "external_redirect",
         "is_external": true,
         "external_message": "Water service is provided by Aqua Pennsylvania. Please contact them directly at 1-877-987-2782 or visit aquaamerica.com."
       }
     },
     "providers": {
       "water": { "name": "Aqua Pennsylvania", "phone": "1-877-987-2782", "website": "https://www.aquaamerica.com" },
       "sewer": { "name": "Conshohocken Sewer Authority", "phone": "610-828-0979", "website": "https://www.conshohockensa.com" },
       "electric": { "name": "PECO", "phone": "1-800-494-4000", "emergency_phone": "1-800-841-4141", "website": "https://www.peco.com" }
     }
   }
   ```

3. **Knowledge source files** — PDFs, markdown files, or a URL list to scrape
   Structured as a manifest:

   ```json
   {
     "sources": [
       { "type": "url",    "url": "https://www.conshohockenpa.gov/departments/public-services/residential-trash-recycling/", "domain": "trash" },
       { "type": "url",    "url": "https://www.conshohockenpa.gov/living-visiting/parking/",                                "domain": "parking" },
       { "type": "pdf",    "path": "./docs/fee-schedule-2026.pdf",                                                          "domain": "permits" },
       { "type": "manual", "title": "Borough Hall Hours", "content": "Borough Hall is open Monday through Friday, 8:30 AM to 4:30 PM. Closed on federal holidays.", "domain": "general" }
     ]
   }
   ```

### 11.2 Import Script Specification

`packages/onboarding/src/import.ts`

**Inputs:** `--config [slug]-config.json` `--sources [slug]-sources.json` `--supabase-url` `--supabase-service-key`

**Steps:**

```
Step 1 — Validate config
  Parse [slug]-config.json against config schema
  Fail fast on missing required fields

Step 2 — Seed municipality_config
  INSERT into municipality_config from config fields
  Upsert on conflict (idempotent re-runs)

Step 3 — Seed intents
  Load base ontology intent list (hardcoded in packages/onboarding/src/base-ontology.ts)
  For each base intent:
    - enabled = true UNLESS label in config.intents_disabled
    - INSERT with base defaults
  For each config.intents_custom:
    - INSERT with is_base_ontology = false
  Upsert on label conflict

Step 4 — Seed escalation_routes
  For each bucket in config.escalation_routes:
    INSERT escalation_route row
  Upsert on bucket conflict

Step 5 — Process knowledge sources
  For each source in sources manifest:
    url:    Fetch page → extract main content → chunk (800 token chunks, 100 token overlap)
    pdf:    Parse PDF → extract text → chunk
    manual: Use content as-is (single chunk)
  For each chunk:
    Call OpenAI embeddings API → vector(1536)
    INSERT into knowledge_chunks

Step 6 — Report
  Print summary:
    ✓ municipality_config seeded
    ✓ [N] intents seeded ([X] disabled, [Y] custom)
    ✓ [N] escalation routes seeded
    ✓ [N] knowledge chunks created from [M] sources
    Total time: Xs
```

**Re-run behavior:** All steps are idempotent. Re-running the import script updates existing rows without duplicating. Safe to re-run after config changes.

### 11.3 Knowledge Chunking Strategy

| Source type | Chunk size | Overlap | Strategy |
|---|---|---|---|
| Web page | 800 tokens | 100 tokens | Split on paragraph boundaries first, then token limit |
| PDF (text) | 800 tokens | 100 tokens | Same as web page |
| PDF (scanned/image) | N/A v1 | — | Flag for manual review; OCR in v2 |
| FAQ pairs | 1 pair = 1 chunk | None | Question + answer together, never split |
| Manual entry | As-is | None | Admin writes the chunk; no splitting |

Each chunk stores `source_url` so the agent can include a "learn more" link in responses where appropriate.

### 11.4 Ongoing Knowledge Maintenance

After go-live, knowledge is maintained via the admin dashboard. The import script is for initial seeding only.

| Trigger | Recommended action |
|---|---|
| New meeting dates published | Edit the meetings knowledge chunk in admin UI |
| Holiday trash schedule | Update trash holiday schedule chunk annually |
| Fee schedule updated | Re-scrape or manually update fee schedule chunk |
| Staff contact changes | Update contact chunk via admin UI |
| New service or program | Add new knowledge chunk via admin UI; optionally add custom intent |
| Intent getting low auto-resolve rate | Review coverage in Preview Chat; add/edit knowledge chunks |

---

## 12. Third-Party Integrations

| Integration | Role | Config location |
|---|---|---|
| **Anthropic Claude API** | LLM for agent responses + intent classification. Model: `claude-sonnet-4-6`. | `ANTHROPIC_API_KEY` env var |
| **OpenAI Embeddings** | `text-embedding-3-small` for knowledge chunk embedding. | `OPENAI_API_KEY` env var |
| **Supabase** | Postgres + pgvector, Auth, RLS, Edge Functions, Storage (PDF uploads), Realtime (admin live ticket updates). | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` env vars |
| **Twilio** | SMS (Programmable Messaging) + Voice (Programmable Voice, TwiML, STT). | Stored in `municipality_config` or env vars; webhook URLs configured in Twilio console |
| **SendGrid** | Inbound Parse (email ingestion) + Transactional Email (outbound replies). | `SENDGRID_API_KEY` env var; webhook configured in SendGrid console |
| **Vercel** | Hosting, CDN, Edge Functions. One project per client deployment. | Vercel dashboard per deployment |
| **Slack** (optional) | Incoming Webhook for escalation notifications. | `escalation_routes` table, bucket channel = 'slack' |

---

## 13. Non-Functional Requirements

### 13.1 Performance Targets

| Metric | Target |
|---|---|
| Chat first token | < 800ms p95 from submission to first streamed token |
| Chat full response | < 4s p95 for a 2–4 sentence T1 response |
| Intent classification | < 600ms p95 (fast model, short prompt) |
| SMS end-to-end | < 5s from Twilio webhook receipt to delivery |
| Email response | < 60s from inbound receipt to reply sent |
| Voice perceived latency | < 3s from end of speech to TTS playback |
| Admin dashboard LCP | < 2s on conversations list |
| Import script (100 sources) | < 5 minutes total |

### 13.2 Availability & Reliability

- 99.9% uptime target on all channel inbound endpoints
- Twilio/SendGrid webhooks must respond within 10s; idempotency keys on all webhook handlers
- Circuit breaker on Claude API: if unavailable, return a graceful fallback message and auto-create a T2 escalation ticket
- All database writes use transactions where multiple tables are affected

### 13.3 Security

- All Twilio webhooks: signature validation before any processing
- SendGrid inbound: webhook secret header validation
- All admin API routes: Supabase JWT session validated server-side
- Service role key never exposed to client — server-side Route Handlers only
- Resident PII (phone, email) encrypted at rest via Supabase column encryption
- Audit logs use anonymized session identifiers — no PII in plaintext log entries
- GDPR/CCPA: configurable retention period (default 90 days); nightly purge Edge Function
- API keys for all third parties stored in environment variables — never in the database

### 13.4 Scalability

- Stateless Route Handlers scale horizontally on Vercel — no server-side session state
- `ivfflat` pgvector index supports ~1M knowledge chunks before partitioning needed
- Supabase connection pooling via PgBouncer
- Each client is an isolated deployment — one client's load never affects another

---

## 14. Recommended File Structure

```
constituent-service-ai/
│
├── apps/
│   ├── web/                              # Next.js app — admin dashboard + all API routes
│   │   ├── app/
│   │   │   ├── (admin)/                  # Auth-gated admin UI
│   │   │   │   ├── overview/
│   │   │   │   ├── conversations/
│   │   │   │   ├── tickets/
│   │   │   │   ├── knowledge/
│   │   │   │   ├── intents/              # Intent Manager
│   │   │   │   ├── escalation-routes/
│   │   │   │   └── settings/
│   │   │   │       ├── channels/
│   │   │   │       ├── municipality/
│   │   │   │       └── branding/
│   │   │   └── api/
│   │   │       ├── channels/
│   │   │       │   ├── chat/message/route.ts
│   │   │       │   ├── sms/inbound/route.ts
│   │   │       │   ├── email/inbound/route.ts
│   │   │       │   └── voice/
│   │   │       │       ├── twiml/route.ts
│   │   │       │       └── gather/route.ts
│   │   │       └── admin/
│   │   │           ├── conversations/route.ts
│   │   │           ├── tickets/route.ts
│   │   │           ├── intents/route.ts
│   │   │           ├── knowledge/route.ts
│   │   │           ├── escalation-routes/route.ts
│   │   │           ├── config/route.ts
│   │   │           └── analytics/route.ts
│   │   └── middleware.ts                 # Auth guard + session validation
│   │
│   └── widget/                           # Embeddable chat widget (separate Vite build)
│       ├── src/
│       │   ├── ChatWidget.tsx
│       │   ├── hooks/useConversation.ts
│       │   └── components/
│       │       ├── MessageList.tsx
│       │       ├── QuickReplies.tsx
│       │       ├── InputBar.tsx
│       │       └── TypingIndicator.tsx
│       └── vite.config.ts                # Outputs chat.js UMD bundle
│
├── packages/
│   ├── agent/                            # Core agent logic — shared by all channel routes
│   │   └── src/
│   │       ├── AgentService.ts
│   │       ├── IntentClassifier.ts
│   │       ├── IntentConfigService.ts    # Reads intents + escalation_routes from Supabase
│   │       ├── KnowledgeRetriever.ts
│   │       ├── EscalationRouter.ts
│   │       ├── ConversationService.ts
│   │       ├── AuditLogger.ts
│   │       └── prompts/
│   │           ├── base.ts               # Hardcoded base prompt + safety rules
│   │           ├── municipality.ts       # Builds municipality context block from DB
│   │           └── channel-rules.ts      # Per-channel length/tone/format rules
│   │
│   ├── channel-adapters/                 # Normalize inbound / format outbound per channel
│   │   └── src/
│   │       ├── types.ts                  # ChannelMessage interface
│   │       ├── chat.ts
│   │       ├── sms.ts
│   │       ├── email.ts
│   │       └── voice.ts
│   │
│   ├── onboarding/                       # Import pipeline — runs once per new deployment
│   │   └── src/
│   │       ├── import.ts                 # Main entry point (CLI)
│   │       ├── base-ontology.ts          # Hardcoded base intent list (source of truth)
│   │       ├── validators.ts             # Config JSON schema validation
│   │       ├── chunker.ts                # Text chunking logic
│   │       ├── scraper.ts                # URL content extraction
│   │       ├── embedder.ts               # OpenAI embeddings API wrapper
│   │       └── types.ts                  # Config file + source manifest types
│   │
│   └── db/                               # Supabase client + generated types
│       └── src/
│           ├── client.ts                 # createClient wrapper (server vs browser)
│           └── types/                    # Output of `supabase gen types typescript`
│
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql       # All table definitions
│   │   ├── 0002_rls_policies.sql         # All RLS policies
│   │   └── 0003_pgvector_index.sql       # ivfflat index on knowledge_chunks.embedding
│   └── functions/
│       └── purge-old-data/               # Nightly data retention Edge Function
│
└── clients/                              # Per-client config files (not deployed — ops use only)
    └── conshohocken/
        ├── config.json                   # Filled-in onboarding checklist
        └── sources.json                  # Knowledge source manifest
```

---

## 15. Implementation Milestones

| Milestone | Timeline | Key Deliverables |
|---|---|---|
| **M1 — Foundation** | Week 1–2 | Supabase schema + RLS + seed migrations, `AgentService` + `IntentClassifier` + `IntentConfigService` core, web chat channel end-to-end with streaming, basic admin conversation list |
| **M2 — SMS & Email** | Week 3–4 | Twilio SMS adapter + webhook validation, SendGrid email adapter, `EscalationRouter` v1 (email notifications), admin tickets Kanban view |
| **M3 — Voice** | Week 5–6 | Twilio Voice + TwiML, STT/TTS, warm transfer, voice-tuned agent prompting (≤ 35 words), voice timeout handling |
| **M4 — Knowledge & RAG** | Week 7–8 | pgvector setup + ivfflat index, knowledge editor UI, PDF upload + chunking, URL scraper, retrieval integrated into pipeline, Knowledge Preview Chat |
| **M5 — Dynamic Ontology** | Week 9–10 | `intents` table fully wired to agent pipeline, Intent Manager UI, custom response override, escalation routes editor, `IntentConfigService` replacing hardcoded routing |
| **M6 — Onboarding Pipeline** | Week 11–12 | `import.ts` script, config JSON schema + validator, `base-ontology.ts` seeded with all ~95 base intents, end-to-end test with Conshohocken config |
| **M7 — Admin Polish** | Week 13–14 | Analytics dashboard (KPI cards, intent breakdown, unresolved analysis), branding/settings UIs, widget build pipeline, knowledge staleness indicators |
| **M8 — Hardening** | Week 15–16 | Security audit (webhook sig validation, RLS review), performance testing (p95 latency targets), GDPR retention job, documentation, Conshohocken pilot go-live |

---

## 16. Open Questions & Decisions

| Question | Context & Options | Decision needed by |
|---|---|---|
| **Embedding provider** | OpenAI `text-embedding-3-small` (cheap, well-supported) vs. Supabase `pgai` (fewer external deps, GA coming). If `pgai`, embeddings live entirely inside Postgres. | Before M4 |
| **Voice STT** | Twilio built-in STT vs. Deepgram for better accuracy on government/permit terminology. Twilio simpler; Deepgram more accurate on domain vocab. | Before M3 |
| **Email fallback** | SendGrid Inbound Parse requires client DNS/MX changes — many municipalities can't do this easily. Gmail/Outlook OAuth polling fallback needs scoping. | Before M2 |
| **Widget hosting** | Per-deployment widget URL (current proposal) vs. single global `chat.js` that reads config from an API call at mount time. Single URL is operationally simpler but adds a config fetch on every widget load. | Before M7 |
| **Permit status (v2 scope)** | Multiple clients will want permit status lookups. Accela and Tyler Incode both have APIs. Does this scope into late M6 or stay firmly v2? | Before M6 |
| **`base-ontology.ts` maintenance** | The hardcoded base intent list in `packages/onboarding/src/base-ontology.ts` will drift from the MD file over time. Should the MD file be the canonical source (parsed at import time) or the TypeScript file? Recommend: TypeScript is canonical at runtime; MD is the human-readable design doc kept in sync manually. | Before M5 |
| **Ops Dashboard** | How does NextWave manage all client deployments? A lightweight internal dashboard that tracks Supabase projects, Vercel deployments, and health status per client. Out of scope for v1 but needs planning. | Before v2 |

---

## 17. Success Metrics

| Metric | Target | Measured by |
|---|---|---|
| Auto-resolution rate | ≥ 85% of conversations closed without escalation within 90 days | `audit_logs` — conversations with no escalation event |
| Inbound call reduction | ≥ 40% reduction vs. 90-day pre-launch baseline | Client-reported call volume |
| Chat first token latency | p95 ≤ 800ms | `audit_logs.latency_ms` on `message.outbound` events |
| Chat full response | p95 ≤ 4s | Measured in `messages.latency_ms` |
| Resident satisfaction | Average CSAT ≥ 4.0 / 5.0 | Post-conversation rating widget (v2 feature; tracked manually in pilot) |
| Staff escalation close time | Escalated tickets resolved within 4 business hours on average | `escalation_tickets.resolved_at - created_at` |
| Knowledge coverage | < 10% of intents classified as `general.clarify` or `out_of_scope.*` after Phase 2 knowledge build | `audit_logs` intent label distribution |
| Onboarding time | New client live in ≤ 10 business days from signed contract | Internal tracking |
| System availability | ≥ 99.9% uptime on all inbound channel endpoints | Vercel analytics + uptime monitor |

---

## Appendix A — Related Documents

| Document | Description |
|---|---|
| `municipal-constituent-ai-base-ontology.md` | Full intent taxonomy, domain inventory, escalation bucket definitions, per-client configuration checklist, municipality type customization guide |
| `conshohocken-ontology.md` | Conshohocken-specific ontology — intent applicability, source URLs, contacts, schedules. First completed client instance of the base ontology. |
| `clients/conshohocken/config.json` | Onboarding config for Conshohocken (to be completed with client) |
| `clients/conshohocken/sources.json` | Knowledge source manifest for Conshohocken (derived from site crawl) |

---

*Constituent Service AI PRD v2.0 — NextWave Consulting, Inc.*
*Single-tenant architecture · Dynamic ontology · Configuration as data*
