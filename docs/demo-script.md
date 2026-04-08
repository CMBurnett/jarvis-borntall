# Jarvis Platform — Executive Demo Script
### Goal: Executive Buy-In / Approval
### Format: Live Product Walkthrough (~50 minutes + Q&A)

---

## PRE-DEMO CHECKLIST

Before the meeting starts, make sure:
- [ ] Local dev stack is running: `supabase start`, Ollama, Next.js dev server
- [ ] Mailpit is running with at least one sample email in the inbox
- [ ] A demo order is in `pending_review` state (so the approval flow is ready to show)
- [ ] The reporting dashboards have data loaded (Sage 100 mock data seeded)
- [ ] An ISO assessment is partially complete (a few clauses evidenced, a few gaps)
- [ ] Browser is logged in, zoomed to ~110%, no distracting tabs
- [ ] Close Slack, notifications off

---

## OPENING — THE PROBLEM (5 min)

> *Don't touch the screen yet. Speak directly to the room.*

**Say:**

> "Before I show you anything, I want to describe a scenario that I'm betting sounds familiar.
>
> A customer emails in an order. Maybe it's a PDF attachment. Maybe it's just freeform text in the body — '200 units of the 3/8 hex bolt, same as last time.' Your order desk has to read it, figure out what SKU that maps to, key it into Sage, and get it out the door. That process takes time, it creates errors, and it's happening dozens of times a day.
>
> Meanwhile, your ISO audit is coming up and you're manually pulling evidence documents to map against 200-plus clauses. And when leadership asks for a sales trend by product line, someone has to run an ODBC report, paste it into Excel, and spend two hours formatting it.
>
> These are not small problems. They're operational drag — and they compound every day.
>
> Jarvis was built to solve all three of them, and to do it in a way that fits how you already operate — on your infrastructure, with your existing systems, without sending your business data to the cloud."

**Pause. Let that land.**

> "Let me show you what that looks like."

---

## 1. THE PLATFORM HOME (3 min)

**Navigate to:** `/` (Home dashboard)

**Say:**
> "This is the Jarvis command center. When anyone on your team logs in, they land here — and they immediately see the health of all three workflows in one place."

**Point out:**
- The status cards for each agent (Orders, ISO, Reporting)
- The activity feed / recent actions
- The top navigation sidebar

> "You've got one login, one interface. Order desk staff see their queue. Compliance managers see their audit status. Leadership sees the dashboards. Everyone works from the same platform."

---

## 2. ORDER PROCESSING AGENT (~15 min)

### 2a. The Email Queue (3 min)

**Navigate to:** Orders → Queue (`/apps/order-processing/queue`)

**Say:**
> "Here's the order queue. Jarvis is monitoring your email inbox in real time. When an order email arrives — text, PDF attachment, even a scanned image — it gets pulled in automatically."

**Show the Mailpit inbox** (briefly, in a new tab):
> "In development we're using a local email server, but in production this connects to your actual IMAP mailbox. The agent sees the same emails your team does."

**Back to the queue.**

> "Each row is an inbound order. You can see the extraction confidence — HIGH, MEDIUM, LOW. High confidence means the AI was certain about every field. Low means it hit something ambiguous and flagged it for a human."

**Key message:** *The AI handles the easy stuff automatically. It only asks a human when it genuinely needs one.*

---

### 2b. Opening an Order (5 min)

**Click into a pending order.**

**Say:**
> "Let's open this one. The customer sent a freeform email — no structured PO. Watch what Jarvis did with it."

**Walk through the order detail view:**

- **Email panel** (left): Show the raw email or attachment text
  > "Here's the original message — exactly as it arrived."

- **Extracted fields** (center):
  > "Jarvis read this with an LLM running locally — on your hardware — and extracted the customer, PO number, requested delivery date, and every line item. No templates. No structured format required."

- **SKU matching** (line items):
  > "This is the hard part in any order system. The customer wrote 'hex bolt 3/8, 200 units.' Jarvis searched your product catalog using vector similarity — semantic understanding, not keyword matching — and found the right SKU with 94% confidence. When it's not sure, it shows you the top candidates and asks you to confirm."

- **Sage 100 customer context:**
  > "It also pulled this customer's history from Sage 100. Pricing tier, open credit, last order. The agent knows your business context, not just the email."

---

### 2c. The Approval Flow (4 min)

**Point to the approve/reject bar at the bottom.**

**Say:**
> "Every order goes through a human review step before it touches Sage. The AI does the extraction and matching — the human stays in the decision seat for approval.

> If everything looks right, one click approves it. Jarvis writes the invoice directly to Sage 100 via the COM API. The order desk never has to key it in manually.

> If something's wrong — wrong SKU, wrong quantity — the reviewer corrects it right here. That correction feeds back as a training signal."

**Demonstrate:** Click approve (or show the correction flow if an item is flagged).

**Key message for executives:**
> "We're not replacing your order desk. We're removing the part of their job that's just manual transcription — which is the part that causes errors and delays."

**ROI anchor:**
> "If your team processes 30 orders a day and this saves 8 minutes per order, that's 4 hours back every single day. That's before you count the reduction in keying errors."

---

### 2d. Audit Trail (2 min)

**Scroll to the audit log at the bottom of the order.**

> "Every action is logged — who approved, what was changed, when. Full traceability for compliance and dispute resolution."

---

## 3. BUSINESS INTELLIGENCE & REPORTING (~12 min)

**Navigate to:** Reporting (`/apps/reporting`)

**Say:**
> "Your Sage 100 system has years of operational data in it. But getting a useful answer out of it usually means a custom ODBC report, an IT ticket, or someone's personal Excel spreadsheet.

> Jarvis gives you a better interface for that data."

---

### 3a. Pre-built Dashboards (4 min)

**Navigate to the dashboard list.**

> "These are preset dashboards. They're built on top of your live Sage data."

**Click through 2-3 presets:**

- **KPI tiles**: Revenue MTD, open orders, on-time delivery rate
  > "The metrics your leadership team asks about in every weekly review — in one view, always current."

- **Sales trend** (bar/line chart):
  > "Revenue by month, by product line, by customer segment. This is the kind of analysis that used to take someone a morning to pull together."

- **Financial summary:**
  > "Margins, costs, invoices outstanding. This pulls from the same data your accounting team works with — no separate export required."

**Key message:**
> "These dashboards are always live. No one has to run a report. No one has to email the data to leadership on Monday morning."

---

### 3b. Natural Language Query (5 min)

**Navigate to a new/custom dashboard, or use the NL query input.**

**Say:**
> "But here's where it gets interesting for ad-hoc questions."

**Type a query:** `Show me top 10 customers by revenue this quarter`

> "I'm typing a plain English question. No SQL. No report builder. Watch what happens."

*Wait for the chart to render.*

> "Jarvis interpreted that question, mapped it to a query against your Sage data, and built the visualization. The underlying report spec is editable if you want to refine it — filter by region, change the date range, add a comparison period."

**Try a second query:** `Compare product line margins year over year`

> "Any question you'd normally call IT about, you can now answer yourself in about 30 seconds."

**Key message:**
> "This isn't a BI tool you have to learn. If you can describe what you want to know, you can get the answer."

---

### 3c. Save and Share (2 min)

> "Any dashboard you build can be saved and shared with your team. Custom reports built by one person become available to everyone — no file attachments, no 'use this version of the spreadsheet.'"

---

## 4. ISO / COMPLIANCE AGENT (~10 min)

**Navigate to:** ISO-Ready (`/apps/iso-ready`)

**Say:**
> "Now — compliance. If you're maintaining ISO 9001 or AS9100 certification, you know what audit prep looks like. Weeks of gathering evidence, manually mapping documents to clauses, and praying nothing has a gap.

> Jarvis automates the evidence gathering and gives you a real-time view of your compliance posture — not just at audit time, but continuously."

---

### 4a. Assessment Dashboard (3 min)

**Navigate to the dashboard (`/apps/iso-ready/dashboard`).**

> "Here's an active assessment. You can see at a glance how many clauses are evidenced, how many are partial, and where the gaps are. Color-coded by priority."

**Point to the status breakdown:**
> "Green is evidenced — we have documentation that satisfies the clause requirement. Yellow is partial — evidence exists but it's incomplete. Red is a gap — no evidence found."

> "This view alone is worth hours of prep time before an audit. You know exactly where to focus."

---

### 4b. Document Upload & Evidence Matching (4 min)

**Navigate to Upload.**

> "The way you feed Jarvis is by uploading your existing documentation. Quality manuals, SOPs, training records, calibration logs — whatever you have."

*Show or describe the upload process.*

> "Jarvis chunks each document and creates semantic embeddings — a vector representation of the content. When it assesses a clause, it searches those embeddings to find relevant passages."

**Click into a specific clause assessment.**

> "Take clause 7.1.5.1 — monitoring and measuring resources. Jarvis found this section in your calibration procedure manual, this table in your equipment log, and assessed it as 'evidenced.' It shows you exactly which passages it used and why.

> If it's a gap, it tells you what kind of evidence is missing and gives you a suggested action item."

**Key message:**
> "Your audit prep goes from weeks to days. And you're not doing it once a year — you have a live compliance dashboard year-round."

---

### 4c. Gap Report (2 min)

**Navigate to the report view for the assessment.**

> "When you're ready, Jarvis generates a full gap analysis report — clause by clause, with evidence citations, gap descriptions, and priority ranking. Export-ready for your audit team or your external auditor."

---

## 5. ARCHITECTURE & SECURITY (5 min)

> *This is the section that matters most for getting sign-off. Speak to IT concerns proactively.*

**Say:**
> "I want to spend a few minutes on something that I know will come up: where does the data go?

> The answer is: nowhere. Jarvis runs entirely on your infrastructure. The AI models run locally using Ollama — there's no API call to OpenAI, no data sent to any cloud service. Your orders, your customer data, your compliance documents — none of it leaves your network.

> The database is PostgreSQL running in Supabase, which you self-host. Authentication is managed on-premises. The whole platform can run air-gapped if needed."

**Draw or reference a simple architecture:**

```
[Your Email Server]  →  [Jarvis (on-prem)]  →  [Sage 100]
[Your Documents]     →  [Local LLM (Ollama)] →  [PostgreSQL]
[Your Team Browsers] →  [Next.js App]        →  [Reports/Dashboards]
```

> "There's also a cloud fallback available — if you want to use the Anthropic API or OpenAI for higher-accuracy extraction on certain workflows, that's configurable per agent. But the default is fully local."

**Security posture:**
> "Role-based access control is built in. Order desk staff see orders. Compliance managers see assessments. Executives see dashboards. Admins configure the system. Supabase Auth handles the identity layer with full SSO support if needed."

---

## 6. CLOSE & THE ASK (5 min)

> *Bring it back to business value, then make a specific ask.*

**Say:**
> "So let's zoom back out.

> Three problems — order processing, compliance, and reporting — that today involve significant manual effort, human error, and lag time. Jarvis addresses all three from a single platform, running on your existing infrastructure, integrated with Sage 100 and your email.

> The AI is local. Your data stays yours. Your team stays in control of every decision — the system handles the routine work and flags the exceptions."

**State the value clearly:**
> - Order processing: estimated **[X hours/day]** saved in manual data entry and error correction
> - Reporting: ad-hoc business questions answered in **seconds instead of days**
> - ISO compliance: audit prep time reduced from **weeks to days**, with year-round visibility

> "What I'm proposing is a pilot. Pick one workflow — I'd suggest order processing because the ROI is most measurable — run it for 60 days with a real subset of orders. We instrument it, we track the time savings and error rate, and we have real data to make a go/no-go decision on full rollout."

---

## ANTICIPATED QUESTIONS

**"What happens if the AI gets it wrong?"**
> Every order goes through human review before touching Sage. The AI can't approve anything on its own. It can flag, suggest, and extract — the human approves.

**"Do we need to retrain our staff?"**
> The order desk interface is designed to feel like a standard order review screen. Most users are productive within a day. There's no technical knowledge required.

**"What's the integration lift with Sage 100?"**
> Sage 100 integration uses the standard COM API for writes and ODBC for reads — both well-documented and already supported by your Sage installation. No customizations to Sage required.

**"What if we want to use our cloud AI provider?"**
> The LLM provider is configurable per agent. You can use Ollama locally, point to Anthropic's API, or use OpenAI — or mix and match. Switching is a config change, not a code change.

**"What does deployment look like?"**
> The platform runs as a standard Node.js / Next.js application. It can run on an existing Windows or Linux server, in Docker, or in a VM. Infrastructure requirements are modest — it's designed for on-premises hardware you likely already have.

**"How does it handle documents in different formats?"**
> Order processing handles email body text, PDFs, and scanned images (via OCR). ISO-Ready handles PDFs and common document formats. Additional format support can be added as an extension.

---

## TIMING GUIDE

| Section | Time |
|---|---|
| Opening — The Problem | 5 min |
| Platform Home | 3 min |
| Order Processing | 15 min |
| Reporting & BI | 12 min |
| ISO / Compliance | 10 min |
| Architecture & Security | 5 min |
| Close & The Ask | 5 min |
| **Total** | **~55 min** |
| Buffer / Q&A | +15 min |

---

## DEMO ENVIRONMENT NOTES

- **App URL**: `http://localhost:3000`
- **Supabase Studio**: `http://127.0.0.1:54323`
- **Mailpit**: `http://127.0.0.1:54324`
- **Ollama**: `http://localhost:11434`

If you hit a loading state or slow LLM response during the demo:
> "The response time you're seeing here is from a local model running on this laptop. In a production deployment on dedicated hardware, this is significantly faster."
