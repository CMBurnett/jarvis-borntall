/**
 * Local embedding provider — uses Ollama bge-m3 (1024 dims).
 *
 * Writes to `embedding_bge` column and uses `match_chunks_bge` RPC.
 * bge-m3 has 8192 token context and requires no task prefix.
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL ?? 'bge-m3'

export interface EmbeddingProvider {
  /** DB column to write embeddings into */
  columnName: string
  /** Supabase RPC function for similarity search */
  matchFunction: string
  /** Generate embeddings for a batch of texts (for indexing/storage) */
  embed(texts: string[]): Promise<number[][]>
  /** Generate a single embedding for a search query */
  embedQuery(text: string): Promise<number[]>
}

// bge-m3 context is 8192 tokens. Conservative cap at ~6K chars.
const MAX_CHARS = 6000

async function embedSingle(text: string): Promise<number[]> {
  const truncated = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text
  console.log(`[embed] Sending ${truncated.length} chars to ${EMBEDDING_MODEL}`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3 * 60 * 1000)
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: truncated,
    }),
  })
  clearTimeout(timeout)
  if (!res.ok) {
    const body = await res.text()
    console.error(`[embed] FAILED on input of ${truncated.length} chars, first 100:`, truncated.slice(0, 100))
    throw new Error(`Ollama embed failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  const embedding = data.embeddings?.[0]
  if (!embedding) throw new Error('No embedding returned from Ollama')
  return embedding
}

function createOllamaEmbeddingProvider(): EmbeddingProvider {
  return {
    columnName: 'embedding_bge',
    matchFunction: 'match_chunks_bge',

    async embed(texts) {
      const embeddings: number[][] = []
      for (const text of texts) {
        // bge-m3 needs no prefix
        const embedding = await embedSingle(text)
        embeddings.push(embedding)
      }
      return embeddings
    },

    async embedQuery(text) {
      // bge-m3 needs no prefix
      return embedSingle(text)
    },
  }
}

// ── Singleton export ────────────────────────────────────────────────────────

let _instance: EmbeddingProvider | null = null

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!_instance) _instance = createOllamaEmbeddingProvider()
  return _instance
}
