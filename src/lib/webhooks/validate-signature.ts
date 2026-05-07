import crypto from "crypto"

// ── Generic HMAC-SHA256 validator ─────────────────────────────
// Most providers (Vercel, GitHub, Sentry, UptimeRobot) use HMAC-SHA256.
// Provider-specific logic below handles header names and formats.

function hmacSha256(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex")
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

// ── Vercel ───────────────────────────────────────────────────
// Header: x-vercel-signature
// Value:  hex HMAC-SHA256 of raw body
export function validateVercelSignature(
  rawBody: string,
  header: string | null
): boolean {
  const secret = process.env.WEBHOOK_SECRET_VERCEL
  if (!secret || !header) return false
  const expected = hmacSha256(secret, rawBody)
  return timingSafeEqual(expected, header)
}

// ── GitHub ───────────────────────────────────────────────────
// Header: x-hub-signature-256
// Value:  "sha256=" + hex HMAC-SHA256
export function validateGitHubSignature(
  rawBody: string,
  header: string | null
): boolean {
  const secret = process.env.WEBHOOK_SECRET_GITHUB
  if (!secret || !header) return false
  const expected = `sha256=${hmacSha256(secret, rawBody)}`
  return timingSafeEqual(expected, header)
}

// ── Sentry ───────────────────────────────────────────────────
// Header: sentry-hook-signature
// Value:  hex HMAC-SHA256
export function validateSentrySignature(
  rawBody: string,
  header: string | null
): boolean {
  const secret = process.env.WEBHOOK_SECRET_SENTRY
  if (!secret || !header) return false
  const expected = hmacSha256(secret, rawBody)
  return timingSafeEqual(expected, header)
}

// ── UptimeRobot ───────────────────────────────────────────────
// UptimeRobot sends an alertApiKey in the POST body, not a header.
// Validate by comparing body.alertApiKey against the stored secret.
export function validateUptimeSignature(
  parsedBody: Record<string, unknown>
): boolean {
  const secret = process.env.WEBHOOK_SECRET_UPTIME
  if (!secret) return false
  const provided = parsedBody.alertApiKey as string | undefined
  if (!provided) return false
  return timingSafeEqual(secret, provided)
}

// ── Router ───────────────────────────────────────────────────
export type WebhookSource = "vercel" | "github" | "sentry" | "uptime"

export function validateWebhookSignature(
  source: WebhookSource,
  rawBody: string,
  headers: Headers,
  parsedBody?: Record<string, unknown>
): boolean {
  switch (source) {
    case "vercel":
      return validateVercelSignature(rawBody, headers.get("x-vercel-signature"))
    case "github":
      return validateGitHubSignature(rawBody, headers.get("x-hub-signature-256"))
    case "sentry":
      return validateSentrySignature(rawBody, headers.get("sentry-hook-signature"))
    case "uptime":
      return validateUptimeSignature(parsedBody ?? {})
    default:
      return false
  }
}
