# Jarvis OS — Build Progress
*Tracks sprint completion against `JARVIS_OS_PLAN.md`*
*Last updated: 2026-05-06*

---

## Sprint 1 — Shell + Context CRUD ✓

### Layout & Shell (complete)
- [x] Canvas layout — fixed dot-grid background, fixed left column, full-viewport canvas
- [x] `ContextPicker` — dropdown selector, sprint focus blurb, new context dialog
- [x] `ContextNav` — 2×grid icon cards with labels (Home, Inbox, Agents, Security, Runbook)
- [x] `UserMenu` — avatar + email trigger, dropdown (profile, settings, theme, sign out)
- [x] `/ → /inbox` redirect

### Data & Types
- [x] Type definitions: `lib/types/contexts.ts`, `lib/types/inbox.ts`, `lib/types/security.ts`
- [x] Supabase types extended (`lib/supabase/types.ts`) — all Jarvis OS tables
- [x] Migration: `supabase/migrations/001_jarvis_os.sql` — all tables, RLS, realtime
- [x] Mock data: `lib/data/mock-contexts.ts` — 4 contexts with lifecycle metadata

### Contexts API
- [x] `GET /api/contexts` — list user contexts
- [x] `POST /api/contexts` — create context
- [x] `GET /api/contexts/[id]` — get single (IDOR check)
- [x] `PATCH /api/contexts/[id]` — update (IDOR check, allowlist)
- [x] `DELETE /api/contexts/[id]` — delete (IDOR check)

### Context UI
- [x] Layout server-fetches real contexts, falls back to MOCK_CONTEXTS
- [x] New context dialog — name, description, lifecycle stage, POST to API, optimistic update
- [x] Context home page — lifecycle, security tier, sprint focus, models, tools, repo/deploy links
- [x] `/context/[id]`, `/context/[id]/runbook`, `/context/[id]/security`, `/context/[id]/agents` all routed

---

## Sprint 2 — Runbook + Security Checklist ✓

### Runbook
- [x] `RunbookEditor` — textarea + markdown preview toggle
- [x] Auto-save on blur (debounced 1.5s on change + immediate on blur) → `PATCH /api/contexts/[id]`
- [x] "Copy for Claude" button — copies full CLAUDE.md formatted for pasting into Claude Code
- [x] CLAUDE.md template pre-populated on first load
- [x] `lib/security/prompt-templates.ts` — 5 templates (General, IDOR, Webhook, RLS, AI Endpoint)

### Security Checklist
- [x] `lib/security/checklist-defaults.ts` — 21 checks across 6 categories
- [x] `GET /api/security/[contextId]` — auto-seeds defaults on first visit
- [x] `PATCH /api/security/[contextId]/[checkKey]` — update status + notes (IDOR check)
- [x] `ChecklistView` — live fetch, summary bar (total/pass/warn/fail + progress bar), grouped by category
- [x] `CheckRow` — expandable, status buttons (pass/warn/fail/pending/na), notes textarea, last-checked date

---

## Sprint 3 — Webhook Ingestion + Inbox ✓

### Webhooks
- [x] `lib/webhooks/validate-signature.ts` — Vercel, GitHub, Sentry, UptimeRobot (HMAC-SHA256, timing-safe)
- [x] `POST /api/webhooks/[contextId]/[source]` — validate sig → log → transform → create inbox_item
- [x] Payload transformers for: Vercel (deploy), GitHub (PR/push), Sentry (error), UptimeRobot (downtime)
- [x] `webhook_logs` table — all incoming requests logged (including invalid sigs)

### Inbox
- [x] `GET /api/inbox` — list items (filter by context, archived, limit)
- [x] `POST /api/inbox` — manual item creation (IDOR check)
- [x] `PATCH /api/inbox/[id]` — mark read/archived/needs_action (IDOR check)
- [x] `InboxFeed` — real data, Kanban columns by priority (Urgent/High/Normal/Low)
- [x] Supabase Realtime — new items stream in live via postgres_changes subscription
- [x] Mark read on click, archive on hover button

---

## Sprint 4 — Inbox Agent ✓

- [x] `lib/anthropic/inbox-agent.ts` — `triageInboxItem()` using claude-haiku-4-5 (fast + cheap)
- [x] `POST /api/inbox/[id]/triage` — runs agent, updates item, logs to `agent_runs`
- [x] Agent summary shown in inbox card with Bot icon
- [x] Suggested actions rendered as pills on card
- [x] "Triage" button on hover on unprocessed items
- [x] `agent_runs` table — model, tokens (in/out), latency_ms, result
- [x] Push notification fired for urgent items after triage

---

## Sprint 5 — Portfolio View ✓

- [x] Portfolio page — all contexts as rows (status dot, lifecycle, security tier, sprint focus)
- [x] Real data fetch server-side, falls back to MOCK_CONTEXTS in dev
- [x] Repo + deploy links shown inline
- [x] Stack summary shown on wide viewports
- [x] Links directly to `/context/[id]`

### Pending
- [ ] Weekly stage assignment prompt (Monday trigger)
- [ ] Stage change history log
- [ ] Open inbox item count per context (requires join)
- [ ] Last deploy status per context (requires Vercel API integration)

---

## Sprint 6 — PWA + Push Notifications ✓

- [x] `lib/push/send-notification.ts` — `sendPushNotification()` + `sendPushToUser()` helpers
- [x] `POST /api/push/subscribe` — store/upsert Web Push subscription
- [x] `DELETE /api/push/subscribe` — remove subscription
- [x] `push_subscriptions` table with RLS
- [x] `npm install web-push` — installed
- [x] `GET /api/push/vapid-public-key` — returns public key for browser subscription
- [x] `lib/push/use-push.ts` — `usePushNotifications()` hook (subscribe, unsubscribe, state)
- [x] Service worker (`/public/sw.js`) — push event handler + notification click handler
- [x] "Enable/Disable notifications" item in `UserMenu` (visible when supported + not denied)
- [x] Push trigger wired — urgent inbox items after triage fire `sendPushToUser()`

### Pending
- [ ] PWA manifest icons (manifest.json references icons that need actual image files)
- [ ] Set VAPID env vars to activate (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL)

---

## Sprint 7 — Polish + Observability ✓

- [x] `GET /api/webhook-logs` — filtered by user ownership via context join
- [x] `GET /api/agent-runs` — filtered by user_id
- [x] `GET /api/security/aggregate` — per-context security check counts
- [x] `WebhookLogsTable` — table of recent webhook_logs with valid/invalid indicators
- [x] `AgentRunsLog` — table of agent_runs with latency, token counts, priority result
- [x] `SecurityAggregate` — cross-context security summary with progress bars, links to context checklist
- [x] Global `/security` page — real aggregate status across all contexts
- [x] Global `/agents` page — agent runs + webhook logs across all contexts (nav order 4)
- [x] `/context/[id]/agents` page — real agent panel (runs + webhook logs scoped to context)

### Pending
- [ ] Sentry integration (add SENTRY_DSN to env, install @sentry/nextjs)
- [ ] Mobile UX pass (bottom nav real icons, touch targets, responsive layout)

---

## Env Vars Required

```
# Supabase (required to use real DB)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (required for inbox triage agent)
ANTHROPIC_API_KEY=

# Webhook secrets (one per integration)
WEBHOOK_SECRET_VERCEL=
WEBHOOK_SECRET_GITHUB=
WEBHOOK_SECRET_SENTRY=
WEBHOOK_SECRET_UPTIME=

# Push notifications (web-push installed — set these to activate)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

## To Activate Real DB

1. Run `supabase/migrations/001_jarvis_os.sql` in your Supabase SQL editor
2. Set the env vars above
3. Restart dev server — layout will fetch real contexts instead of MOCK_CONTEXTS
4. Create your first real context via the "New context" dialog

## To Activate Push Notifications

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` in `.env.local`
3. Restart dev server
4. Click "Enable notifications" in the UserMenu dropdown

---

## Architecture Notes

- All API routes use IDOR checks: `.eq("user_id", user.id)` on every fetch
- Webhook route uses `createAdminClient()` (service role) since there's no user session
- Inbox triage uses `claude-haiku-4-5-20251001` — cheap and fast for background classification
- `MOCK_CONTEXTS` used as fallback when Supabase not configured or contexts table empty
- `InboxFeed` subscribes to `postgres_changes` for real-time streaming without polling
- Push notifications use dynamic `import("web-push")` to avoid SSR issues
- `usePushNotifications()` hook registers `/public/sw.js` service worker on subscribe
- Security aggregate queries all user contexts + their checks in two queries, merges in-memory
