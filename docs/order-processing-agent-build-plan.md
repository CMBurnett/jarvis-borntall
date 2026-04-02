# Order Processing Agent — Submodule Build Plan

## Context

The Jarvis platform already has a stub UI for an Order Processing app (`src/app/(app)/apps/order-processing/page.tsx`) with hardcoded mock data and no real functionality. The goal is to build this out into a fully functional AI agent — per the PRD at `docs/order-processing-agent-prd.md` — and extract it into its own GitHub repo (`CMBurnett/order-processing`) wired in as a git submodule at `agents/order-processing`, exactly like ISOReady.

**Scope: Phase 1 only** — email ingestion, OCR, LLM extraction, fuzzy SKU matching, human review UI, CSV/JSON export on approval. No Sage 100 write (COM API). No phone order transcription.

**Fully offline** — all AI inference via Ollama on Jarvis (localhost:11434). No external API calls. No cloud dependencies for the agent logic.

---

## Stack Alignment with iso-ready

iso-ready already has a battle-tested offline-capable provider abstraction. Order processing reuses it directly:

| Component | iso-ready | Order Processing |
|---|---|---|
| LLM | Ollama via `openai` SDK (OpenAI-compat) | Same — `@iso-ready/lib/providers/llm/` |
| Model | `qwen3.5:9b` (configurable via `OLLAMA_LLM_MODEL`) | Same |
| Embeddings | Ollama `nomic-embed-text` (768-dim) | Same — `@iso-ready/lib/providers/embeddings/` |
| Vector store | pgvector in Supabase (RPC functions) | Same pattern — new `op_sku_catalog` table |
| Vector client | `@supabase/supabase-js` `.rpc()` calls | Same |

**No ChromaDB. No sentence-transformers. No Python ML libraries.**

The only reason Python is needed at all is Sage 100 ODBC (`pyodbc` is a CPython C extension — no Node equivalent). Everything else runs in TypeScript inside Next.js API routes, exactly like iso-ready.

---

## Architecture

```
Email inbox (IMAP)
  ← polled by Next.js API route using imapflow (Node)
  → attachments: OCR via node-tesseract-ocr (wraps Tesseract binary)
  → raw text passed to LLM extraction

LLM extraction (Ollama qwen3:8b, localhost:11434)
  → structured JSON: customer_name, po_number, line_items[], delivery_date, etc.
  → confidence: HIGH / MEDIUM / LOW per field
  → uses Sage 100 customer history as context (fetched from Python sidecar)

SKU matching (pgvector in Supabase)
  → each line item description embedded via Ollama nomic-embed-text
  → cosine similarity search against op_sku_catalog table
  → top-3 candidates, confidence threshold routing (≥0.90 auto, 0.75–0.89 flag, <0.75 human)

Python sidecar (minimal — Sage ODBC only, localhost:8001)
  → GET /sage/customer/{name}    → last 5–10 orders from Sage 100 AR/SO tables
  → GET /sage/sku-catalog        → full SKU list (for catalog seeding)
  → POST /sage/seed-catalog      → one-time: pull all SKUs, embed, write to op_sku_catalog

Supabase (state store + vector store)
  → op_orders, op_line_items, op_sku_catalog (with embedding vector(768)), op_audit_log

Review UI (Next.js, re-exported into Jarvis at /apps/order-processing)
  → Queue: pending orders list + metrics
  → Detail: side-by-side email + extracted form, confidence badges, SKU picker, approve bar
  → One-click Approve → CSV/JSON export → audit log
```

---

## Submodule Structure (`agents/order-processing/`)

```
├── manifest.json
├── package.json          # imapflow, node-tesseract-ocr, openai, @supabase/supabase-js
├── tsconfig.json
├── next.config.ts
│
├── lib/
│   ├── types.ts          # Order, LineItem, SKUMatch, ExtractionResult, ConfidenceLevel, AuditEvent
│   ├── providers/        # Re-exports from @iso-ready/lib/providers/ (LLM + embeddings)
│   │   ├── llm.ts        # getLLMProvider() — wraps iso-ready, forces OLLAMA_* env vars
│   │   └── embeddings.ts # getEmbeddingProvider() — same
│   ├── extraction/
│   │   ├── extractor.ts  # LLM prompt + structured output parse + Pydantic-style Zod validation
│   │   └── confidence.ts # HIGH/MEDIUM/LOW rollup logic
│   ├── matching/
│   │   ├── sku-matcher.ts   # Embed description → Supabase RPC match_sku_catalog → threshold routing
│   │   └── sage-context.ts  # HTTP client → Python sidecar GET /sage/customer/{name}
│   ├── ingestion/
│   │   ├── imap.ts       # imapflow: poll UNSEEN, fetch raw emails, return EmailMessage[]
│   │   ├── parser.ts     # Extract text body + attachment buffers from raw MIME
│   │   └── ocr.ts        # node-tesseract-ocr: image → text; pdf-parse for text PDFs, fallback OCR
│   └── export/
│       ├── csv.ts        # Approved order → CSV string
│       └── json.ts       # Approved order → JSON
│
├── app/
│   ├── queue/page.tsx    # Review queue (server component, Supabase op_orders)
│   └── orders/[id]/
│       ├── page.tsx      # Side-by-side review (client component)
│       └── components/
│           ├── email-panel.tsx     # Raw email / OCR text, scrollable
│           ├── order-form.tsx      # Extracted fields with confidence color-coding
│           ├── sku-match-row.tsx   # Per-line-item candidate picker (auto/flagged/human)
│           └── approve-bar.tsx     # Sticky footer: Approve / Reject
│
├── service/              # Python sidecar — Sage ODBC only
│   ├── pyproject.toml / requirements.txt   # fastapi, uvicorn, pyodbc, pydantic-settings
│   ├── main.py           # FastAPI app, localhost:8001
│   ├── config.py         # pydantic-settings: SAGE_ODBC_DSN
│   └── sage/
│       ├── odbc.py       # pyodbc connection pool, AR_Customer, SO_SalesOrderDetail, IM_ItemMaster
│       └── routes.py     # GET /sage/customer/{name}, GET /sage/sku-catalog, GET /health
│
├── supabase/migrations/
│   ├── 001_order_processing_schema.sql   # op_orders, op_line_items, op_sku_catalog (vector(768)), op_audit_log
│   └── 002_order_processing_rls.sql      # org_id-scoped RLS + match_sku_catalog RPC function
│
└── scripts/
    ├── seed-sku-catalog.ts    # npx ts-node: calls Python sidecar → embeds all SKUs → upserts op_sku_catalog
    └── start_service.sh       # Windows: activates venv, starts uvicorn on 8001
```

---

## Changes to Jarvis (Main Repo)

| File | Change |
|---|---|
| `.gitmodules` | Add `[submodule "agents/order-processing"]` → `CMBurnett/order-processing` |
| `tsconfig.json` | Add `@order-processing/*` path alias; add `agents/order-processing` to `exclude` |
| `src/app/(app)/apps/order-processing/page.tsx` | Replace stub with re-export: `export { default } from '@order-processing/app/queue/page'` |
| `src/app/(app)/apps/order-processing/orders/[id]/page.tsx` | New re-export from `@order-processing/app/orders/[id]/page` |
| `src/app/api/order-processing/ingest/route.ts` | New: triggers IMAP poll + extraction pipeline |
| `src/app/api/order-processing/[id]/approve/route.ts` | New: auth-gated → marks approved, triggers export, writes audit log |
| `src/app/api/order-processing/[id]/reject/route.ts` | New: auth-gated → marks rejected, writes audit log |
| `src/app/api/order-processing/[id]/export/route.ts` | New: streams CSV/JSON file to browser |
| `.env.local` | Add `ORDER_PROCESSING_SERVICE_URL=http://localhost:8001` (Sage sidecar) |

**No changes needed** to `src/app/(app)/apps/page.tsx` — order-processing is already listed as active.

---

## Provider Reuse from iso-ready

The LLM and embedding providers from `@iso-ready/lib/providers/` are imported directly:

```typescript
// agents/order-processing/lib/providers/llm.ts
import { getLLMProvider } from '@iso-ready/lib/providers/llm/index'
export { getLLMProvider }
// Env vars: LLM_PROVIDER=ollama, OLLAMA_LLM_MODEL=qwen3.5:9b, OLLAMA_BASE_URL=http://localhost:11434
```

This means order-processing automatically gets the same offline/online toggle iso-ready has, for free, with no duplicated code. **For this project, always deploy with `LLM_PROVIDER=ollama` and `EMBEDDING_PROVIDER=ollama`.**

---

## Supabase Tables (all prefixed `op_`)

- `op_orders` — one row per inbound email; status: `pending_extraction → pending_review → approved/rejected → exported`; fields: customer_name, po_number, delivery_date, shipping_address, special_instructions, extraction_confidence (overall), raw_email, sage_customer_no
- `op_line_items` — one row per extracted line item; `sku_candidates jsonb` [{sku, name, score}…], `sku_match_status` (auto/flagged/human/unmatched), `sku_matched text`, `embedding vector(768)` for line item re-matching
- `op_sku_catalog` — SKU master with `embedding vector(768)` (Ollama nomic-embed-text); source of truth for SKU vector search; updated by seed script from Sage ODBC
- `op_audit_log` — append-only per order (ingested, extracted, matched, field_edited, sku_corrected, approved, rejected, exported)

**`match_sku_catalog` RPC function** (mirrors iso-ready's `match_chunks_local`):
```sql
create function match_sku_catalog(query_embedding vector(768), match_count int)
returns table (sku text, name text, similarity float)
language sql as $$
  select sku, name, 1 - (embedding <=> query_embedding) as similarity
  from op_sku_catalog
  where active = true
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## Python Sidecar (Sage ODBC Only — Minimal)

The Python service is deliberately small. Its only job is to bridge `pyodbc` (Windows CPython) to the TypeScript layer:

```
GET /health                          → { status: "ok" }
GET /sage/customer/{name}            → last 5–10 orders (AR_Customer + SO tables)
GET /sage/sku-catalog                → all active SKUs (IM_ItemMaster)
```

No embeddings, no LLM, no vector store — all of that lives in TypeScript. The sidecar is a thin ODBC wrapper.

**Sage 100 tables read (ODBC, read-only):**
- `AR_Customer` — customer lookup, account details, pricing tier
- `SO_SalesOrderHeader` + `SO_SalesOrderDetail` — order history
- `IM_ItemMaster` — product catalog for SKU seeding

---

## Key Design Decisions

- **No ChromaDB, no sentence-transformers**: pgvector + Ollama nomic-embed-text is already proven in iso-ready and keeps the stack consistent
- **Reuse iso-ready providers directly**: `@iso-ready/lib/providers/` imported via tsconfig alias — no duplicated provider code
- **Python sidecar is minimal**: Only handles Sage ODBC; everything else is TypeScript in the Next.js process
- **Ollama is the only LLM/embedding backend**: No Anthropic/OpenAI keys needed — fully offline by default
- **Auth boundary**: Python sidecar is localhost-only, no auth. Jarvis API routes validate Supabase session before calling sidecar.
- **Self-improving catalog**: Every SKU correction by a reviewer writes a new alias to `op_sku_catalog`, re-embedded and available on next search
- **Existing stub is the design foundation**: Copy `src/app/(app)/apps/order-processing/page.tsx` into the submodule as queue page starting point — pixel-perfect, no design drift

---

## Build Sequence (Phase 1)

1. **Repo skeleton + Jarvis wiring** — Create GitHub repo, add submodule, tsconfig alias, re-export stubs, confirm `npm run build` passes
2. **Supabase schema** — `op_orders`, `op_line_items`, `op_sku_catalog` (vector(768)), `op_audit_log`, `match_sku_catalog` RPC, RLS policies
3. **Python sidecar** — FastAPI, `/health`, `/sage/customer/{name}`, `/sage/sku-catalog`; test ODBC connection to Sage
4. **SKU catalog seeding** — `scripts/seed-sku-catalog.ts`: pulls from sidecar, embeds via Ollama, upserts `op_sku_catalog`
5. **Email ingestion + OCR** — `imapflow` IMAP poller in `lib/ingestion/imap.ts`; `node-tesseract-ocr` OCR; creates `op_orders` rows
6. **LLM extraction** — Ollama qwen3:8b extracts structured fields + confidence; Sage customer history as context
7. **SKU matching** — embed line item descriptions, call `match_sku_catalog` RPC, apply threshold routing
8. **Review UI** — Queue page (real data), detail page (side-by-side, confidence badges, SKU picker, inline edit, approve bar)
9. **Approve + export** — CSV/JSON export on approval, audit log for every state transition

---

## manifest.json

```json
{
  "slug": "order-processing",
  "name": "Order Processing",
  "description": "Email-to-invoice automation with AI extraction, fuzzy SKU matching, and human review queue. Integrates with Sage 100 via ODBC.",
  "icon": "FileCheck2",
  "version": "0.1.0",
  "mountType": "route",
  "entryPoint": "/apps/order-processing",
  "permissions": ["supabase:read", "supabase:write", "service:order-processing"]
}
```

---

## Critical Files

- `/Users/cmb/builds/jarvis/tsconfig.json`
- `/Users/cmb/builds/jarvis/.gitmodules`
- `/Users/cmb/builds/jarvis/src/app/(app)/apps/order-processing/page.tsx` (existing stub → becomes re-export)
- `/Users/cmb/builds/jarvis/agents/iso-ready/lib/providers/llm/index.ts` (reused)
- `/Users/cmb/builds/jarvis/agents/iso-ready/lib/providers/embeddings/index.ts` (reused)
- `/Users/cmb/builds/jarvis/agents/iso-ready/supabase/migrations/` (reference for pgvector + RPC pattern)

---

## Verification

- `npm run build` in Jarvis passes with new path alias and re-exports
- `curl http://localhost:8001/health` returns `{"status":"ok"}`
- Seed script runs: SKUs appear in `op_sku_catalog` with `embedding` populated
- Send test email → row appears in `op_orders` with raw_email + OCR text
- Extraction runs → fields populated with confidence scores within ~15s (Ollama cold start)
- Line item descriptions matched → `sku_candidates` populated, auto-routed items have `sku_matched`
- Open `/apps/order-processing` → queue shows live orders with real metrics
- Open order detail → side-by-side view, edit YELLOW/RED fields, approve → CSV written, audit log updated
