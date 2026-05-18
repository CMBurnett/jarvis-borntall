// Quick test: node scripts/test-snov.mjs <domain>
// e.g. node scripts/test-snov.mjs 3m.com
import 'dotenv/config'

const domain = process.argv[2] ?? '3m.com'
const clientId = process.env.SNOV_CLIENT_ID
const clientSecret = process.env.SNOV_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('SNOV_CLIENT_ID and SNOV_CLIENT_SECRET must be set in .env.local')
  process.exit(1)
}

// 1. Get token
const tokenRes = await fetch('https://api.snov.io/v1/oauth/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
})
const tokenData = await tokenRes.json()
console.log('Token response:', tokenRes.status, tokenData.access_token ? `got token (${tokenData.expires_in}s)` : tokenData)

if (!tokenData.access_token) process.exit(1)

const token = tokenData.access_token

const paths = [
  '/v1/get-domain-emails-with-info',
  '/v2/get-domain-emails-with-info',
  '/v1/domain-emails-with-info',
  '/v2/domain-emails-with-info',
  '/v1/get-domain-emails',
  '/v2/domain-search',
  '/v1/domain-search',
]

for (const path of paths) {
  const qs = new URLSearchParams({ access_token: token, domain, type: 'all', limit: '5' })
  const r = await fetch(`https://api.snov.io${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: qs,
  })
  const d = await r.json()
  const preview = JSON.stringify(d).slice(0, 120)
  console.log(`[POST ${path}] ${r.status} — ${preview}`)
}
