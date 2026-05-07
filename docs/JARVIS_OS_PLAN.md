# Jarvis OS — Feature Plan & Build Spec
### Claude Code Context Document
*Cory M. Burnett | CMB Consulting*
*Version 1.0 — Generated from voice note + CMB Engineering Manual v0.1*

---

## What This Is

Jarvis OS is a cloud-based, AI-native work operating system built as a Next.js / Tailwind web app (PWA). It replaces the fragmented experience of juggling Vercel dashboards, Supabase tabs, Sentry, GitHub, and Claude sessions across four live products. Everything lives in one shell, with AI baked into the foundation — not added on top.

The metaphor: you have **contexts** (projects), and a **global layer** that sits above all of them. You operate globally (unified inbox, portfolio health, cross-product alerts) or you drop into a context and have everything you need for that product in one place — models, tools, prompts, agents, security status, runbook.

This document is the source of truth for Claude Code sessions building Jarvis OS. Paste it at the start of every session.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | |
| Styling | Tailwind CSS | |
| Auth | Supabase Auth | |
| Database | Supabase (Postgres) | RLS on all tables from day one |
| AI | Anthropic API (claude-sonnet-4 primary) | |
| Deployment | Vercel | |
| PWA | next-pwa or custom service worker | Push notifications target |
| Realtime | Supabase Realtime | For inbox + alert streaming |

---

## Information Architecture

```
Jarvis OS
├── Global Layer (cross-context)
│   ├── Unified Inbox          ← agent-triaged, all signals in one feed
│   ├── Portfolio View         ← all contexts, lifecycle stages, health
│   ├── Security Status        ← aggregate security state across products
│   └── Notifications          ← push + in-app
│
└── Context Layer (per-project)
    ├── Context Shell          ← drops you into a project workspace
    ├── Models Panel           ← assign models to roles for this context
    ├── Tools Panel            ← connected integrations for this context
    ├── Agents Panel           ← agents and prompts scoped to this context
    ├── Security Status        ← per-context checklist state
    ├── Runbook / CLAUDE.md    ← living doc, editable in-app
    └── Apps (see below)       ← IDE, Notes, Email, etc. embedded per context
```

---

## Phase 1 — Core Shell (Build First)

This is the MVP. Everything else layered on top.

### 1.1 Layout Shell

Three-panel layout:

- **Left sidebar** — global nav + context switcher. Fixed width ~220px. Contains: logo, global nav items (Unified Inbox, Portfolio View, Security Status, Notifications), and a scrollable context list.
- **Center panel** — primary workspace. Tabbed. Changes based on selected global view or active context.
- **Right rail** — context-specific config panel. Fixed width ~220px. Contains: active context info, model assignments, tools, security status summary, sprint focus. Collapses on mobile.

Responsive behavior:
- Mobile: sidebar becomes bottom tab bar (5 items max). Right rail moves to a slide-up drawer.
- Tablet: sidebar visible, right rail hidden by default, toggle to show.
- Desktop: full three-panel layout.

### 1.2 Context Data Model

Each context is a project/product. Stored in Supabase.

```typescript
interface Context {
  id: string
  name: string                          // e.g. "Mastrocco"
  description: string                   // one-liner
  lifecycle_stage: 'active_dev' | 'stabilization' | 'maintenance' | 'paused'
  security_tier: 1 | 2 | 3
  stack_summary: string                 // e.g. "Next.js 14, Supabase, Vercel"
  repo_url?: string
  deploy_url?: string
  sprint_focus: string                  // 2-3 sentences, current week
  claude_md_content: string             // full CLAUDE.md text, editable
  models: ContextModel[]
  tools: ContextTool[]
  created_at: string
  updated_at: string
}

interface ContextModel {
  model_id: string                      // e.g. "claude-sonnet-4-20250514"
  role: string                          // e.g. "Primary coding", "Security review"
  is_default: boolean
}

interface ContextTool {
  tool_name: string                     // e.g. "GitHub", "Supabase", "Stripe"
  tool_type: 'integration' | 'mcp' | 'custom'
  config: Record<string, string>        // non-secret config
  is_active: boolean
}
```

### 1.3 Context Switcher

The left sidebar context list. Each item shows:
- Context name
- Status dot (green = active dev, amber = stabilization, gray = maintenance/paused)
- Lifecycle stage label
- On hover: quick actions (open, edit, view runbook)

Clicking a context sets it as the active context and updates the right rail. A "New context" item at the bottom opens a creation flow.

### 1.4 Right Rail — Context Config

Always reflects the active context. Sections:

**Active Context** — name, lifecycle stage, security tier badge.

**Models** — list of assigned models with roles. Each as a small pill with a colored dot. "+ add model" option opens a model picker (list of Anthropic models with a role label input).

**Tools** — chip list of connected integrations. Clicking a chip shows its config/status. "+ tools" opens tool connection flow.

**Security Status** — 5-6 key security checks as icon + label rows. Green check, amber warning, red error. Derived from the context's security checklist state. Tapping opens the full security checklist view.

**Sprint Focus** — editable text block. Inline edit on click.

---

## Phase 2 — Unified Inbox

The highest-value feature. A single feed of everything that needs attention across all products, triaged by an agent.

### 2.1 Inbox Item Schema

```typescript
interface InboxItem {
  id: string
  context_id: string                    // which product
  source: 'sentry' | 'vercel' | 'supabase' | 'github' | 'uptime' | 'anthropic' | 'security_check' | 'manual'
  category: 'error' | 'deploy' | 'security' | 'performance' | 'ai_alert' | 'business_event' | 'pr' | 'info'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  title: string
  preview: string
  raw_payload: Record<string, unknown>  // original webhook/API payload
  agent_summary?: string                // AI-generated triage note
  agent_suggested_actions?: string[]    // e.g. ["Diagnose with Claude", "Log to runbook"]
  is_read: boolean
  is_archived: boolean
  needs_action: boolean
  created_at: string
}
```

### 2.2 Inbox Tabs

- **All** — full feed, newest first
- **Needs action** — unresolved items flagged by agent or manually
- **PRs / deploys** — GitHub PRs and Vercel deploy events
- **AI alerts** — Anthropic Console anomalies, prompt failures, usage spikes
- **Security** — anything from the security checklist module

### 2.3 Inbox Agent

An agent runs on new inbox items and does three things:
1. Assigns priority based on source, category, and content
2. Writes a one-line `agent_summary` in plain language
3. Suggests 2-3 contextual actions (e.g. "Diagnose with Claude", "Open in context", "Log to runbook", "Snooze 24h")

Agent prompt template (stored in DB, editable):
```
You are the Jarvis inbox triage agent for a solo product engineer managing multiple SaaS products.

Incoming event:
- Product: {{context_name}}
- Source: {{source}}
- Raw data: {{raw_payload}}

Tasks:
1. Assign priority: urgent (production down / security breach), high (error affecting users), normal (deploy, warning, info), low (resolved, info only)
2. Write a one-line plain-English summary (max 15 words)
3. Suggest 2-3 actions from this list: [Diagnose with Claude, Open in context, Log to runbook, Run security check, View in Sentry, View deploy, Snooze 24h, Archive]

Respond in JSON only.
```

### 2.4 Signal Sources (Webhook Integrations)

Each source sends to a Jarvis webhook endpoint, keyed by context:

`POST /api/webhooks/[context_id]/[source]`

All webhook endpoints must validate the provider's signature header before processing. No exceptions.

Sources to support:
- **Vercel** — deploy success/failure, function errors
- **GitHub** — PR opened/merged, CI status
- **Sentry** — new errors, error spikes
- **UptimeRobot / Better Uptime** — downtime alerts
- **Supabase** (via pg_net or edge functions) — RLS denial spikes, slow query alerts
- **Anthropic Console** (manual poll or webhook) — usage anomalies, cost spikes
- **Internal security checks** — scheduled runs of the security checklist module

---

## Phase 3 — Security Module

Directly derived from CMB Engineering Manual v0.1, Section 3. This module makes the security checklists a living, tracked system rather than a static document.

### 3.1 Security Checklist State

Each context has a security checklist. State is stored per-check in Supabase.

```typescript
interface SecurityCheck {
  id: string
  context_id: string
  category: 'auth_authz' | 'input_data' | 'ai_specific' | 'race_conditions' | 'secrets' | 'exposure'
  check_key: string                     // unique slug, e.g. "idor_check", "webhook_sig"
  label: string                         // human-readable
  status: 'pass' | 'warn' | 'fail' | 'pending' | 'na'
  last_checked_at?: string
  notes?: string
  auto_checkable: boolean               // can be verified programmatically
}
```

### 3.2 Checklist Categories

Mirrors Section 3.3 of the CMB Engineering Manual:

- Authentication & Authorization (IDOR, RLS, server-side checks, API key hygiene)
- Input & Data Handling (validation, parameterized queries, XSS, file upload)
- AI-Specific (prompt injection, rate limiting, AI data exposure, least privilege)
- Race Conditions & Idempotency (coupon limits, billing ops, idempotency keys)
- Secrets & Environment (git history scan, .env hygiene, service role keys)
- Exposure & Configuration (admin routes, CORS, rate limiting on auth, webhook signatures)

### 3.3 Security Status Views

**Right rail summary** — 5-6 most important checks as pass/warn/fail icons. Tapping opens the full view.

**Full checklist view** — per-context, all checks organized by category. Each check has: status toggle, notes field, last-checked timestamp, and a "Review with Claude" button that pre-loads the relevant prompt from Section 3.5 of the Engineering Manual.

**Monthly review trigger** — on the first Monday of each month, an inbox item fires: "Monthly security review due for [context]." Links to the full checklist.

### 3.4 Pre-Built Claude Prompt Templates

Stored in DB, accessible from any security check. Templates from CMB Engineering Manual Section 3.5:

- General Security Review
- IDOR Audit
- Webhook Handler Review
- Supabase RLS Review
- AI Endpoint Review

Each template has a "Launch review" button that opens a Claude session (or Claude Code) pre-populated with the template and the context's CLAUDE.md content.

---

## Phase 4 — Runbook / CLAUDE.md Editor

Each context has a living runbook. In-app editor, syncs to Supabase.

### 4.1 CLAUDE.md Structure

Follows the template from CMB Engineering Manual Section 4.1:

```markdown
## Product Name
## Lifecycle Stage
## Security Tier
## Stack & Key Versions
## Key Environment Variable Names (never values)
## External Services & Dependencies
## Architecture Overview
## Key Files & Entry Points
## How to Deploy
## How to Roll Back
## Observability Setup
## Common Issues & Known Fixes
## Current Sprint Focus
## Open Security Notes
## Known Technical Debt
```

### 4.2 Editor Features

- Markdown editor with preview toggle
- "Copy for Claude session" button — copies the runbook + current sprint focus to clipboard, formatted for pasting into Claude Code
- Auto-save on blur
- Last-edited timestamp + diff view (stretch goal)
- Quick-edit mode for Sprint Focus field (inline, no full editor required)

---

## Phase 5 — Portfolio View

The top-level dashboard. One row per context.

### 5.1 Portfolio Row

Each context shown as a card row with:
- Name + lifecycle stage badge
- Security tier indicator
- Last deploy status (from Vercel integration)
- Open inbox items count
- Active error count (from Sentry)
- Uptime status (from uptime monitor)
- Sprint focus (truncated, tap to expand)
- Quick actions: Open context, Edit runbook, Run security check

### 5.2 Weekly Stage Assignment

Every Monday, a prompt appears at the top of the Portfolio View: "Assign lifecycle stages for this week." Each context shows a dropdown to set/confirm its stage. This is the CMB Engineering Manual Section 1.2 habit, enforced by the UI.

Stage changes are logged with a timestamp.

---

## Phase 6 — PWA + Push Notifications

### 6.1 PWA Setup

- `manifest.json` with name, icons, theme color, display: standalone
- Service worker (via next-pwa or custom) for offline shell and asset caching
- "Add to home screen" prompt on first visit (mobile)
- App should feel native when launched from home screen — no browser chrome

### 6.2 Push Notifications

Use the Web Push API via Supabase Edge Functions or a lightweight push service (e.g. web-push npm package on a Vercel edge function).

Notification triggers:
- Urgent inbox item arrives (production down, security breach)
- New high-priority error (Sentry spike)
- Weekly Monday portfolio review reminder
- Monthly security review reminder
- Deploy failure

Notification payload:
```json
{
  "title": "Mastrocco — Sentry spike",
  "body": "14 new errors in /api/orders in the last 10 min",
  "icon": "/icons/icon-192.png",
  "data": { "context_id": "...", "inbox_item_id": "..." }
}
```

Tapping a notification opens Jarvis OS and deep-links to the relevant inbox item or context.

### 6.3 Notification Preferences

Per-context, per-category toggles. Stored in user preferences in Supabase. Defaults: urgent = always on, high = on, normal = off, low = off.

---

## Phase 7 — Embedded Apps (Stretch / Future)

Each context will eventually support embedded micro-apps in the center panel. These are not Phase 1. Document them here for architectural awareness.

### 7.1 Target Embedded Apps

- **Notes** — lightweight markdown notepad scoped to a context. Replaces scattered Notion pages.
- **IDE / Claude Code** — embed or deep-link to VS Code / Claude Code with the context's repo pre-loaded. Stretch: use the Claude Code VS Code extension via URI scheme.
- **Email** — context-scoped email view (Gmail API). Show only threads tagged or filtered to a product.
- **Terminal** — stretch goal. Cloud shell for running commands (npm audit, git log scans) against a repo.

### 7.2 App Slot Architecture

The center panel tab bar should be designed from day one to support additional tabs. Phase 1 tabs: Inbox, Overview, Runbook. Future tabs: Notes, Code, Email, Terminal. Tab config stored per context in DB.

---

## Observability for Jarvis OS Itself

Jarvis OS is a product and should be instrumented like one.

- **Frontend errors** — Sentry (free tier)
- **API errors** — Sentry + Vercel function logs
- **Uptime** — UptimeRobot or Better Uptime (simple HTTP check)
- **Webhook processing** — log all incoming webhooks to a Supabase table: `[context_id, source, received_at, processed_at, status, error_message]`. This is the audit trail and debugging surface.
- **Agent runs** — log all inbox agent invocations: `[item_id, model_used, tokens_in, tokens_out, latency_ms, result]`
- **AI usage** — Anthropic Console, reviewed monthly

---

## Security Requirements for Jarvis OS

Jarvis OS is Tier 1 (accounts + sensitive business data). All CMB Engineering Manual security requirements apply.

### Non-Negotiable from Day One

- RLS on every Supabase table — no exceptions, no "add later"
- All webhook endpoints validate provider signature headers before processing
- No secrets in source code or committed `.env` files
- IDOR check on every API route that fetches a resource by ID — verify user owns it server-side
- Rate limiting on all API routes, aggressive limits on auth endpoints
- Input validation on all user-submitted data before hitting DB or AI model

### Supabase Tables Requiring RLS (initial)

- `contexts` — user owns their own contexts
- `inbox_items` — user owns items for their contexts
- `security_checks` — user owns checks for their contexts
- `runbooks` — user owns their context runbooks
- `context_models` — scoped to context owner
- `context_tools` — scoped to context owner
- `webhook_logs` — scoped to context owner
- `user_preferences` — user owns their own prefs
- `push_subscriptions` — user owns their own subscriptions

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-side only, never in client bundle

# Anthropic
ANTHROPIC_API_KEY=                 # server-side only

# Webhook secrets (one per integration)
WEBHOOK_SECRET_VERCEL=
WEBHOOK_SECRET_GITHUB=
WEBHOOK_SECRET_SENTRY=
WEBHOOK_SECRET_UPTIME=

# Push notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

---

## Key File Paths (Target Structure)

```
/app
  /layout.tsx                      # shell layout, sidebar + right rail
  /page.tsx                        # redirects to /inbox
  /(global)
    /inbox/page.tsx                # unified inbox
    /portfolio/page.tsx            # portfolio view
    /security/page.tsx             # aggregate security status
  /(context)/[contextId]
    /page.tsx                      # context overview
    /runbook/page.tsx              # CLAUDE.md editor
    /security/page.tsx             # per-context security checklist
/components
  /shell
    /Sidebar.tsx
    /RightRail.tsx
    /TopBar.tsx
  /inbox
    /InboxFeed.tsx
    /InboxItem.tsx
    /InboxFilters.tsx
  /context
    /ContextCard.tsx
    /ModelPicker.tsx
    /ToolChips.tsx
    /SecuritySummary.tsx
  /security
    /ChecklistView.tsx
    /CheckRow.tsx
    /PromptLauncher.tsx
  /runbook
    /RunbookEditor.tsx
/lib
  /supabase/
    /client.ts
    /server.ts
  /anthropic/
    /client.ts
    /inbox-agent.ts
  /webhooks/
    /validate-signature.ts         # provider signature validation (all providers)
    /process-vercel.ts
    /process-github.ts
    /process-sentry.ts
  /security/
    /checklist-defaults.ts         # default check definitions
    /prompt-templates.ts           # Claude prompt templates from Engineering Manual
  /push/
    /send-notification.ts
/api
  /webhooks/[contextId]/[source]/route.ts
  /inbox/route.ts
  /contexts/route.ts
  /contexts/[id]/route.ts
  /security/[contextId]/route.ts
  /push/subscribe/route.ts
```

---

## Build Order (Recommended Sprint Sequence)

### Sprint 1 — Shell + Context CRUD
- Three-panel layout (sidebar, center, right rail)
- Supabase auth (login/logout)
- Context data model + RLS policies
- Context CRUD (create, read, update, delete)
- Context switcher in sidebar
- Right rail rendering context config
- Responsive layout (mobile bottom nav, tablet)

### Sprint 2 — Runbook + Security Checklist
- CLAUDE.md / runbook editor per context
- Security checklist state (all checks, all categories)
- Security status summary in right rail
- "Copy for Claude session" button
- Pre-built prompt templates (Section 3.5)

### Sprint 3 — Webhook Ingestion + Inbox
- Webhook endpoints for Vercel, GitHub, Sentry, UptimeRobot
- Signature validation on all webhook routes
- Inbox item schema + Supabase table + RLS
- Inbox feed UI (all tabs)
- Manual inbox item creation

### Sprint 4 — Inbox Agent
- Anthropic API integration for triage agent
- Agent runs on new inbox items (background job or edge function)
- Agent summary + suggested actions displayed on items
- Agent run logging

### Sprint 5 — Portfolio View + Monday Rhythm
- Portfolio dashboard (all contexts, health row)
- Weekly stage assignment prompt (Monday trigger)
- Stage change history log

### Sprint 6 — PWA + Push Notifications
- PWA manifest + service worker
- Web Push subscription flow
- Push notification triggers (urgent inbox items, weekly review)
- Notification preferences per context

### Sprint 7 — Polish + Observability
- Sentry integration for Jarvis OS itself
- Webhook processing audit log UI
- Agent usage log UI
- Mobile UX pass

---

## Current Sprint Focus

Sprint 1 — Shell + Context CRUD. Building the three-panel layout, Supabase auth, context data model with RLS, and the context switcher. No inbox or security module yet. Goal: a working shell where you can create, switch between, and edit contexts.

---

## Open Questions / Decisions Pending

- Push notification service: self-hosted web-push on Vercel Edge vs. managed service (Novu, OneSignal). Lean toward self-hosted to keep the stack simple.
- Claude Code integration: deep-link via URI scheme (`vscode://`) or fully embedded webview. Start with URI deep-link, embedded is a later stretch goal.
- Webhook polling fallback: for sources without webhook support (Anthropic Console usage), use a scheduled Vercel cron job to poll the API daily.
- Mobile IDE: on mobile, the code/IDE tab is read-only (runbook + context info). Full IDE only on desktop.

---

*Jarvis OS Build Spec · v1.0 · Feed this document at the start of every Claude Code session for this repo.*
