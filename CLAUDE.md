# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server (includes NODE_OPTIONS for large HTTP headers)
npm run build    # production build
npm run lint     # ESLint
```

There is no test suite. No `npm test` command exists.

After cloning, initialize submodules:
```bash
git submodule update --init --recursive
```

## Architecture

**Jarvis** is a Next.js 16 (App Router) internal business operations platform. The main app lives in `src/` and hosts four AI-powered tools as git submodules under `agents/`.

### Submodule-as-agent pattern

Each agent in `agents/` is an independent git repository (own `package.json`, `tsconfig.json`, `supabase/` migrations):

| Agent | Submodule repo | Mount path |
|-------|---------------|------------|
| `agents/crm` | CMBurnett/crm | `/apps/crm` |
| `agents/order-processing` | CMBurnett/order-processing | `/apps/order-processing` |
| `agents/iso-ready` | CMBurnett/iso-ready | `/apps/iso-ready` |
| `agents/reporting` | CMBurnett/reporting | `/apps/reporting` |

The root `tsconfig.json` maps path aliases so the main app can import directly from agent code:

```
@/*          → src/*
@crm/*       → agents/crm/*
@order-processing/* → agents/order-processing/*
@iso-ready/* → agents/iso-ready/*
@reporting/* → agents/reporting/*
```

API routes in `src/app/api/` import from agent libs (e.g., `import { runEnrichmentAgent } from '@crm/lib/enrichment/agent'`). Agent UI pages live only in `src/app/(app)/apps/` — the agents don't serve their own Next.js pages in this setup.

### Authentication

Auth is Supabase-based with a dev bypass: if `NEXT_PUBLIC_SUPABASE_URL` is unset or doesn't start with `http`, the app runs without auth and injects a `DEV_USER` (`src/lib/supabase/dev.ts`). This is checked in both middleware (`src/proxy.ts`) and the app layout (`src/app/(app)/layout.tsx`).

User roles: `admin` | `user`, stored in `profiles.role`. Admin status gates certain nav items.

### AI / LLM providers

- **Chat** (`/chat`): Ollama via AI SDK (`qwen3.5:9b` default), streams responses over Vercel AI SDK's `streamText`
- **ISO Ready ingest** (`/api/ingest`): Ollama for text extraction and clause gap assessment; Ollama `bge-m3` for embeddings stored in pgvector (`embedding_bge` column, `match_chunks_bge` RPC)
- **CRM enrichment** (`/api/crm/leads/[id]/enrich`): Anthropic Claude via `@anthropic-ai/sdk` with tool use (Apollo, Hunter, Snov, Prospeo for contact discovery)
- **Order processing ingest** (`/api/order-processing/ingest`): Ollama for field extraction from email/OCR content

LLM and embedding providers are abstracted in `src/lib/providers/llm.ts` and `src/lib/providers/embeddings.ts`. Env vars: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_EMBEDDING_MODEL`.

### Database

Supabase Postgres. Migrations live in `supabase/migrations/` at the root (for the main schema) — agent submodules each have their own `supabase/` dirs for their tables.

Key table groups:
- Core: `profiles`, `instance_config`, `apps`, `app_usage`, `app_favorites`, `model_config`
- ISO Ready: `organisations`, `assessments`, `documents`, `document_chunks`, `clause_assessments`, `iso_clauses`, `processing_jobs`
- Order Processing: `op_orders`, `op_line_items`
- CRM: `crm_leads`, `crm_lead_contacts`

The admin client (`src/lib/supabase/admin.ts`) uses `SUPABASE_SERVICE_ROLE_KEY` and bypasses RLS — used in background jobs and server-side ingestion. The regular server client (`src/lib/supabase/server.ts`) respects RLS and is used in API routes with user context.

### Background processing

The ISO Ready ingest pipeline (`/api/ingest`) uses Next.js `after()` to run the full extract→chunk→embed→assess pipeline after returning `{assessmentId}` to the client immediately. Progress is tracked via `processing_jobs` table status (`queued` → `running` → `done` | `error`).

CRM enrichment (`/api/crm/leads/[id]/enrich`) uses SSE (`text/event-stream`) to stream enrichment events back to the UI in real time.

## UI Quality Gate
Before building any screen or component, call agentOS_build with your planned layout.
Only proceed if fit_score ≥ 70. If lower, revise based on the patches and call again.

### UI components

shadcn/ui components in `src/components/ui/` (based on `@base-ui/react`). Layout components in `src/components/layout/`. All styling via Tailwind CSS v4. `components.json` configures shadcn.

### Demo / dev data

`src/lib/data/` contains static mock data for the chat context (Sage ERP customers, orders, financial summaries). The chat route builds this into the system prompt via `buildDemoContext()`. This is demo data for the Ollama chat feature — not used by the other agents.

## Environment variables

Required for full functionality:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY          # CRM enrichment agent
OLLAMA_BASE_URL            # defaults to http://localhost:11434
OLLAMA_MODEL               # defaults to qwen3.5:9b
OLLAMA_EMBEDDING_MODEL     # defaults to bge-m3
```

CRM email polling:
```
CRM_IMAP_HOST / CRM_IMAP_PORT / CRM_IMAP_SECURE / CRM_IMAP_USER / CRM_IMAP_PASSWORD
CRM_SMTP_HOST / CRM_SMTP_PORT / CRM_SMTP_SECURE / CRM_SMTP_USER / CRM_SMTP_PASSWORD
CRM_EMAIL_POLL_SECRET
```

CRM contact enrichment APIs:
```
HUNTER_API_KEY
APOLLO_API_KEY
SNOV_CLIENT_ID / SNOV_CLIENT_SECRET
PROSPEO_API_KEY
```

Order processing IMAP:
```
IMAP_HOST / IMAP_PORT / IMAP_SECURE / IMAP_USER / IMAP_PASSWORD
```
