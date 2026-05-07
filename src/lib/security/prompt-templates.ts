export interface PromptTemplate {
  key: string
  title: string
  description: string
  prompt: (claudeMd: string) => string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    key: "general_security",
    title: "General Security Review",
    description: "Full security audit across all CMB Engineering Manual categories",
    prompt: (claudeMd) => `You are performing a security review for a solo product engineer managing multiple SaaS products.

## Context
${claudeMd}

## Task
Review this codebase for security issues across all of the following categories:
1. Authentication & Authorization (IDOR, RLS, server-side checks, API key hygiene)
2. Input & Data Handling (validation, parameterized queries, XSS, file upload)
3. AI-Specific (prompt injection, rate limiting, data exposure, least privilege)
4. Race Conditions & Idempotency (billing ops, coupon limits, idempotency keys)
5. Secrets & Environment (git history, .env hygiene, service role keys)
6. Exposure & Configuration (admin routes, CORS, rate limiting, webhook signatures)

For each issue found:
- Severity: critical / high / medium / low
- Location: file + line if possible
- Description: what the issue is
- Fix: specific code change to resolve it

Focus on real issues, not theoretical ones. Be concise.`,
  },
  {
    key: "idor_audit",
    title: "IDOR Audit",
    description: "Check every API route for insecure direct object reference vulnerabilities",
    prompt: (claudeMd) => `You are auditing API routes for IDOR (Insecure Direct Object Reference) vulnerabilities.

## Context
${claudeMd}

## Task
Review every API route that fetches a resource by ID. For each route:
1. Does it verify the authenticated user owns or has permission to access the resource?
2. Is the check happening server-side (not just client-side)?
3. Could an attacker access another user's data by changing the ID in the request?

List every route that has an IDOR risk or that you could not confirm is protected.
For each: route path, what it fetches, and the specific fix needed.`,
  },
  {
    key: "webhook_review",
    title: "Webhook Handler Review",
    description: "Audit all webhook endpoints for signature validation and idempotency",
    prompt: (claudeMd) => `You are auditing webhook handlers for security.

## Context
${claudeMd}

## Task
Review all webhook endpoint handlers (typically in /api/webhooks/ or similar):
1. Does each endpoint validate the provider's signature header before processing?
2. Are handlers idempotent — safe to receive the same event twice?
3. Are raw payloads logged for debugging?
4. Is there any path where a malicious payload could trigger unintended behavior?

For each webhook endpoint found, assess all four points.
Flag any endpoint that processes payload data before validating the signature as CRITICAL.`,
  },
  {
    key: "rls_review",
    title: "Supabase RLS Review",
    description: "Verify Row Level Security policies on all tables",
    prompt: (claudeMd) => `You are reviewing Supabase Row Level Security configuration.

## Context
${claudeMd}

## Task
1. List all Supabase tables referenced in this codebase
2. For each table, determine if RLS should be enabled (almost always yes)
3. Flag any table that appears to have RLS disabled or missing policies
4. Review any anon/public access patterns — are they intentional and minimal?
5. Check if the service role key is used anywhere in client-side code (critical issue if so)

Also review the Supabase client initialization — is the server client properly isolated from the browser client?`,
  },
  {
    key: "ai_endpoint_review",
    title: "AI Endpoint Review",
    description: "Audit all AI/LLM API endpoints for prompt injection and data exposure",
    prompt: (claudeMd) => `You are auditing AI/LLM endpoints for security issues.

## Context
${claudeMd}

## Task
Review all endpoints that call AI models (Anthropic, OpenAI, etc.):
1. **Prompt injection**: Can user-supplied data manipulate the system prompt or override instructions?
2. **Data exposure**: Is PII or sensitive business data included in prompts without necessity?
3. **Rate limiting**: Are AI endpoints protected against abuse (cost attacks)?
4. **Output validation**: Is AI-generated content treated as trusted data anywhere it shouldn't be?
5. **Least privilege**: Do AI agent tools (function calls, MCP) have more permissions than needed?

For each issue: severity, location, and specific remediation.`,
  },
]
