// node --env-file=.env.local scripts/test-hunter.mjs [domain]
// e.g. node --env-file=.env.local scripts/test-hunter.mjs 3m.com
import 'dotenv/config'

const domain = process.argv[2] ?? '3m.com'
const apiKey = process.env.HUNTER_API_KEY

if (!apiKey) {
  console.error('HUNTER_API_KEY not set in .env.local')
  process.exit(1)
}

const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${apiKey}`
const res = await fetch(url)
const data = await res.json()

console.log('Status:', res.status)
console.log(JSON.stringify(data, null, 2).slice(0, 3000))
