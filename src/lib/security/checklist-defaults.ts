import type { SecurityCheck } from "@/lib/types/security"

type CheckTemplate = Omit<SecurityCheck, "id" | "context_id" | "last_checked_at" | "notes"> & {
  status: "pending"
}

export const CHECKLIST_DEFAULTS: CheckTemplate[] = [
  // ── Auth & Authorization ──────────────────────────────────
  {
    category: "auth_authz",
    check_key: "idor_check",
    label: "IDOR: every API route verifies user owns the resource",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "auth_authz",
    check_key: "rls_enabled",
    label: "RLS enabled on all Supabase tables",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "auth_authz",
    check_key: "server_side_auth",
    label: "Auth checks run server-side, not client-side only",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "auth_authz",
    check_key: "api_key_hygiene",
    label: "API keys rotated and scoped to minimum permissions",
    status: "pending",
    auto_checkable: false,
  },

  // ── Input & Data Handling ─────────────────────────────────
  {
    category: "input_data",
    check_key: "input_validation",
    label: "All user inputs validated with Zod before DB/AI",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "input_data",
    check_key: "parameterized_queries",
    label: "No raw SQL string concatenation — parameterized only",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "input_data",
    check_key: "xss_prevention",
    label: "No dangerouslySetInnerHTML without sanitization",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "input_data",
    check_key: "file_upload_validation",
    label: "File uploads: type, size, and content validated",
    status: "pending",
    auto_checkable: false,
  },

  // ── AI-Specific ───────────────────────────────────────────
  {
    category: "ai_specific",
    check_key: "prompt_injection",
    label: "AI endpoints guard against prompt injection",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "ai_specific",
    check_key: "ai_rate_limiting",
    label: "AI endpoints have rate limiting",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "ai_specific",
    check_key: "ai_data_exposure",
    label: "PII / sensitive data not passed raw to AI models",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "ai_specific",
    check_key: "ai_least_privilege",
    label: "AI agent tools use least-privilege permissions",
    status: "pending",
    auto_checkable: false,
  },

  // ── Race Conditions & Idempotency ─────────────────────────
  {
    category: "race_conditions",
    check_key: "billing_idempotency",
    label: "Billing operations are idempotent (Stripe idempotency keys)",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "race_conditions",
    check_key: "coupon_limits",
    label: "Coupon / discount codes have DB-level usage limits",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "race_conditions",
    check_key: "idempotency_keys",
    label: "Webhook handlers are idempotent — duplicate events safe",
    status: "pending",
    auto_checkable: false,
  },

  // ── Secrets & Environment ─────────────────────────────────
  {
    category: "secrets",
    check_key: "git_history_scan",
    label: "Git history scanned for accidentally committed secrets",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "secrets",
    check_key: "env_hygiene",
    label: ".env files not committed; .gitignore verified",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "secrets",
    check_key: "service_role_key",
    label: "Supabase service role key never in client bundle",
    status: "pending",
    auto_checkable: false,
  },

  // ── Exposure & Configuration ──────────────────────────────
  {
    category: "exposure",
    check_key: "admin_routes",
    label: "Admin routes protected by role check, not security-by-obscurity",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "exposure",
    check_key: "cors_config",
    label: "CORS configured — not wildcard in production",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "exposure",
    check_key: "auth_rate_limiting",
    label: "Auth endpoints (login, signup, reset) are rate limited",
    status: "pending",
    auto_checkable: false,
  },
  {
    category: "exposure",
    check_key: "webhook_signatures",
    label: "All webhook endpoints validate provider signatures",
    status: "pending",
    auto_checkable: false,
  },
]

export const CATEGORY_LABELS: Record<string, string> = {
  auth_authz:      "Auth & Authorization",
  input_data:      "Input & Data Handling",
  ai_specific:     "AI-Specific",
  race_conditions: "Race Conditions & Idempotency",
  secrets:         "Secrets & Environment",
  exposure:        "Exposure & Configuration",
}

export const CATEGORY_ORDER = [
  "auth_authz",
  "input_data",
  "ai_specific",
  "race_conditions",
  "secrets",
  "exposure",
]
