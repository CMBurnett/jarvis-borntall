# AI-Powered Order Processing Agent
## Product Requirements Document

---

## Overview

Orders arrive by email in freeform, conversational language — often with ambiguous product descriptions, missing quantities, and unclear delivery dates. This agent reads those emails, extracts everything needed to build an invoice, resolves product ambiguity against the catalog, flags gaps, and presents a draft invoice to staff for single-click approval.

**Key design constraints:**
- Fully offline / on-premises — no data leaves the network
- Runs on Jarvis (Windows workstation, NVIDIA RTX 5000 Ada 32GB VRAM)
- Integrates with Sage 100 via ODBC (reads) and COM Business Object API (writes)
- Microsoft Access database as supplementary data source

**Target outcome:** Staff review and approve invoices in minutes rather than processing from scratch — with a clear audit trail of every decision made. 5–7 day manual workflow → same-day, with most orders requiring under 30 minutes of human touch.

---

## Why Freeform Email Is the Hard Problem

If orders arrived as structured forms or CSVs, basic tooling would suffice. Freeform email is harder — customers write things like *"can you send us the usual clips and another box of the red ones"* and expect someone to know what that means. This system learns to know what that means, improving with every order it processes.

---

## System Architecture: 4 Layers

### Layer 1 — Email Ingestion & Document Extraction

- **IMAP connector** monitors the order inbox for new emails
- **Attachment handling** — PDFs and images run through local OCR (Tesseract / PaddleOCR)
- **Email body** parsed directly as plain text
- Body and attachment content are concatenated and passed to the extraction layer together

**Phone order support (Phase 2):**
- Call transcription via Whisper (local) converts phone orders to text
- Transcribed text enters the same extraction pipeline as email content

---

### Layer 2 — LLM Extraction

A local LLM (qwen3.5:9b via Ollama) reads the raw email text and extracts all invoice-relevant fields. The model assigns a confidence level to every extracted field.

**Confidence levels:**
- `HIGH` — explicitly stated in clear terms
- `MEDIUM` — implied or inferable but not explicit
- `LOW` — absent, ambiguous, or contradictory

**Extracted fields:**

```json
{
  "customer_name": "...",
  "po_number": "...",
  "line_items": [
    {
      "description": "raw customer language verbatim",
      "quantity": 500,
      "unit": "units",
      "sku_guess": "blue 10mm widget"
    }
  ],
  "requested_delivery_date": "...",
  "shipping_address": "...",
  "special_instructions": "..."
}
```

> The `sku_guess` field captures the customer's raw product language verbatim — even if it doesn't match any catalog entry. This feeds directly into the fuzzy matching layer.

**Example system prompt structure:**

```
You are an invoice extraction assistant. Read the email below and extract
all information needed to create an invoice.

For each field, assign a confidence: HIGH, MEDIUM, or LOW.
- HIGH: explicitly stated in clear terms
- MEDIUM: implied or inferable but not explicit
- LOW: absent, ambiguous, or contradictory

[Customer order history from Sage 100 — last 5 orders]

Extract: customer_name, po_number, line_items[], requested_delivery_date,
shipping_address, special_instructions.

Return JSON only. For missing fields use null. Never hallucinate values.
```

**Unit disambiguation:** A normalization step resolves unit ambiguities (ml vs mg, lbs vs kg) using fuzzy matching against the product catalog before confidence is finalized.

---

### Layer 3 — Fuzzy SKU Matching & Vector Knowledge Base

Customer language is inconsistent. *"Blue 10mm widget"*, *"BLU-10"*, *"blue tens"*, *"10mm blue ones"* — all the same product. This layer resolves them through semantic similarity search against an embedded product catalog.

#### Vector DB Setup

The full product catalog (SKUs, descriptions, aliases, common misspellings) is embedded into a local vector store. When the LLM extracts a raw product description, a similarity search returns the top 3 candidate matches with confidence scores.

**Chunking strategy:**

```
├── Product catalog entries
│     → 1 chunk per SKU
│     → Include all aliases, synonyms, common misspellings
│     e.g. "Product: Blue Widget 10mm | SKU: BLU-10 | Aliases: BLU10, blue tens, 10mm blue"
│
├── Past invoices
│     → 1 chunk per LINE ITEM (not per invoice)
│     e.g. "Customer: Acme Corp | Item: Blue Widget 10mm | Qty: 500 | Date: Jan 2025"
│
├── Customer history
│     → 1 chunk per account, summarising ordering patterns and preferences
│
└── Unit conversion rules
      e.g. "1 ml = 1000 µl | Context: liquid medications"
```

**Chunking rules:**
- Keep chunks under ~512 tokens
- ~50 token overlap between adjacent chunks
- Include synonyms and common misspellings inside product chunks to improve retrieval recall
- Embed line items rather than whole invoices — retrieval is more precise

**Embedding pipeline (fully offline):**

```python
from sentence_transformers import SentenceTransformer
import chromadb

model = SentenceTransformer('all-MiniLM-L6-v2')  # ~80MB, CPU-friendly
client = chromadb.PersistentClient(path="./orderdb")
collection = client.get_or_create_collection("products")

chunks = chunk_catalog(products)
embeddings = model.encode(chunks)

collection.add(
    embeddings=embeddings,
    documents=chunks,
    ids=[f"chunk_{i}" for i in range(len(chunks))]
)
```

**Candidate matching:**

```python
raw_description = "blue 10mm widget"
results = collection.query(query_texts=[raw_description], n_results=3)

# Returns:
# [(SKU-123, "Blue Widget 10mm",  0.94),
#  (SKU-124, "Blue Widget 12mm",  0.81),
#  (SKU-129, "Blue Cap 10mm",     0.72)]
```

**Confidence thresholds:**

| Score | Action |
|---|---|
| ≥ 0.90 | Auto-select — HIGH confidence |
| 0.75 – 0.89 | Flag for review — show match, ask for confirmation |
| < 0.75 | RED — human must identify the product |

**Self-improving catalog:** Every time a reviewer corrects a product match, that correction is written back as a new alias in the catalog. The system gets more accurate with every order processed.

---

### Layer 3b — Customer History Context (Sage 100 via ODBC)

Before the LLM extracts fields, the system pulls the customer's last 5–10 orders from Sage 100 and includes them as context in the extraction prompt. This does two things:

1. Improves SKU matching — the model pattern-matches against what this customer typically orders
2. Surfaces anomalies — *"this customer usually orders 500 units but this email says 5 — flag it"*

**Sage 100 key tables:**

| Table | Use |
|---|---|
| `AR_Customer` | Customer lookup, account details |
| `SO_SalesOrderHeader` | Historical orders |
| `SO_SalesOrderDetail` | Historical line items |
| `IM_ItemMaster` | Product catalog |
| `IM_PricingTable` | Pricing data |
| `AR_InvoiceHistoryHeader` | Invoice history |

**Microsoft Access** may hold supplementary product catalog, pricing, or customer records — extract and pipe into the embedding pipeline the same way as Sage data.

---

### Layer 4 — Confidence Scoring, Gap Detection & Review UI

Every extracted field carries a confidence score. Fields are colour-coded in the review interface:

- 🟢 **GREEN** — High confidence, auto-drafted
- 🟡 **YELLOW** — Medium confidence, flagged for quick confirmation
- 🔴 **RED** — Low confidence or missing, requires human input

**Structured gap list:**

Where the system cannot resolve a field, it produces a plain-language gap list rather than silently guessing:

```
⚠️  Gaps requiring clarification:

1. PRODUCT UNCLEAR — "the usual clips" found in email.
   Top catalog match: SKU-445 Spring Clip 8mm (72% confidence).
   Please confirm or correct.

2. QUANTITY MISSING — No quantity specified for SKU-201 Red Cap.

3. DELIVERY DATE AMBIGUOUS — Email says "end of month."
   Interpreted as April 30 — please confirm.
```

**Optional: Auto-generated clarification reply**

The gap list can be converted into a draft reply email pre-populated with exactly the questions that need answering. Staff review and send.

**Review UI — staff workflow:**

- Side-by-side view: original email on the left, drafted invoice on the right
- Inline editing of any flagged field
- One-click **Approve** → pushes draft invoice to Sage 100 (COM API) or exports for manual entry (Phase 1)
- Full audit trail: confidence scores, reviewer actions, timestamps — logged per invoice

---

## End-to-End Processing Flow

```
Email arrives (with or without attachments)
        ↓
IMAP connector pulls email + attachments
        ↓
OCR extracts text from attachments (Tesseract / PaddleOCR)
        ↓
Customer history pulled from Sage 100 via ODBC
        ↓
LLM extracts fields + assigns confidence per field
Unit disambiguation applied (unit normalization)
        ↓
Fuzzy SKU matching against embedded product catalog (vector DB)
        ↓
Gap detection — missing / ambiguous fields identified
        ↓
   ┌──────────────────────────────────────┐
   │  All fields GREEN                    │ → Auto-draft invoice
   │  Any YELLOW or RED fields            │ → Flag for human review
   └──────────────────────────────────────┘
        ↓
Staff reviews in UI — edits flagged fields, confirms gaps
        ↓
One-click Approve
        ↓
Phase 1: Export draft for manual Sage entry
Phase 2: Push directly to Sage 100 via COM Business Object API
```

---

## Phased Rollout

### Phase 1 — Extract & Review (No Sage Write)

- Deploy email ingestion, OCR, LLM extraction, and review UI
- ODBC read from Sage 100 for customer history and pricing context
- Staff review every invoice in the UI — approve exports a structured draft (CSV or JSON)
- Measure field-level extraction accuracy
- Build out catalog aliases from every reviewer correction
- **Goal:** Prove extraction quality. Demonstrate the time save. Build the test set.

### Phase 2 — Assisted Automation

- Add COM API write — approved invoices push directly into Sage 100
- Auto-approve threshold introduced for consistently clean orders (≥ 90% field confidence)
- Human reviews flagged orders only
- Clarification reply drafts activated for RED-field orders
- Track straight-through processing (STP) rate

### Phase 3 — Full Integration & Optimisation

- Phone order support via local Whisper transcription
- Reporting dashboard: extraction accuracy, review time, straight-through rate
- Auto-approve threshold tuned based on observed accuracy
- Exception handling workflows for persistent edge cases

---

## Offline Stack

| Component | Tool | Notes |
|---|---|---|
| LLM | qwen3.5:9b via Ollama | Local inference, no cloud calls |
| Embeddings | `sentence-transformers` (all-MiniLM-L6-v2) | CPU-friendly, ~80MB |
| Vector DB | ChromaDB or Qdrant | Fully local persistence |
| OCR | Tesseract / PaddleOCR | No internet required |
| Speech-to-text | Whisper (local) | Phase 2 — phone order transcription |
| Sage read | pyodbc + Sage 100 ODBC driver | Customer history, pricing context |
| Sage write | Sage 100 COM Business Object API | Phase 2 — invoice posting |
| Orchestration | Custom Python agent (or LangChain local) | No external API required |
| Review UI | Next.js — Jarvis local web server | Browser-accessible on LAN |
| Legacy DB | Microsoft Access (.mdb/.accdb) via pyodbc | Supplementary catalog / pricing |

---

## Evaluation & Iteration

**Key metrics:**

| Metric | Target |
|---|---|
| Field extraction accuracy | ≥ 0.90 across clean emails |
| SKU match precision (top-1) | ≥ 0.85 |
| Gap detection recall (real gaps caught) | ≥ 0.90 |
| False positive gap rate | < 0.15 |

**Ground truth test set:** Collect 20–30 real or representative freeform order emails and manually annotate the correct extraction (customer, line items, quantities, SKUs, delivery dates). These are eval cases before the first client demo.

**Iteration loop:** Same eval harness used for the ISO Compliance Agent — vary one prompt element per run, score against ground truth, promote if improved. Runs overnight on Jarvis.

**Continuous improvement:** Every reviewer correction (wrong SKU, wrong quantity, missed field) is logged, becomes a new test case, and may be written back as a catalog alias. Accuracy compounds over time.

---

## Discovery Questions (Pre-Build)

Before scoping the full build, confirm the following with the client:

**Order workflow:**
- Walk through the full life of an order — from arrival to invoice sent. Who touches it and when?
- What are the most common sources of ambiguity? (wrong units, unclear products, missing quantities?)
- Typical volume: orders per day/week, line items per order on average?
- Percentage arriving by email vs. phone vs. other?
- What does a "problem order" look like, and how long does it take to resolve?

**Email content:**
- What does a typical order email actually look like? Can we see 5–10 examples?
- Do customers reference SKUs / part numbers, or purely descriptive language?
- Are attachments typically PDFs, images, or Word docs? Or mostly body text?
- Who sends clarification emails back to customers — same person processing the order?

**Sage 100:**
- Which version of Sage 100, and is it hosted locally?
- What do they currently use Sage for — invoicing, stock, customer records, pricing, all of the above?
- How do orders currently get into Sage? Manual entry, CSV import, or something else?
- Are there existing ODBC connections set up, or is that net new?

**Microsoft Access:**
- What data lives in Access — catalog, pricing, customer records, order history, or a mix?
- Is it actively maintained or largely a static legacy store?
- File location — local machine, shared network drive, or server?
- Are there linked tables between Access and Sage?

**Infrastructure:**
- Single site or multiple locations needing access?
- Who manages IT — internal team, MSP, or ad hoc?

**Success criteria:**
- What does "good" look like — speed, accuracy, headcount reduction, cash flow, something else?
- Are there compliance or audit requirements around how orders and invoices are recorded?
- Is there a timeline pressure driving this?

---

## Open Technical Decisions

These should be resolved early in Phase 1:

1. **ODBC connectivity** — verify pyodbc connection from Jarvis to Sage 100 server before agent development begins (prerequisite for all ERP work)
2. **Access DB mapping** — table structure discovery, overlap with Sage, extraction pipeline into vector DB
3. **Confidence threshold calibration** — thresholds may need to differ per field type (e.g. quantity vs. SKU vs. date)
4. **Clarification reply format** — confirm whether the draft reply email feature is in scope for Phase 1 or Phase 2
5. **Invoice export format** — for Phase 1 manual entry, confirm whether CSV, JSON, or a formatted PDF draft is most useful to staff
