/**
 * Local LLM provider — uses Ollama for document extraction, clause tagging,
 * and gap assessment. Replaces the @iso-ready Anthropic provider.
 */

import { PDFParse } from 'pdf-parse'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen3.5:9b'

// ── Ollama chat helper ──────────────────────────────────────────────────────

async function chat(
  system: string,
  user: string,
  options?: { temperature?: number; num_predict?: number }
): Promise<string> {
  const MAX_RETRIES = 3
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // Use streaming mode to avoid Node undici HeadersTimeoutError during model cold-load.
    // Ollama returns headers immediately when streaming, then sends chunks as the model generates.
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        keep_alive: '10m',
        options: {
          temperature: options?.temperature ?? 0.2,
          num_predict: options?.num_predict ?? 8192,
        },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Ollama chat failed (${res.status}): ${text}`)
    }

    // Collect streamed NDJSON chunks into final response
    let content = ''
    let buffer = '' // buffer for partial lines spanning read boundaries
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body from Ollama')
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last element — it may be an incomplete line
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const chunk = JSON.parse(line)
          if (chunk.message?.content) content += chunk.message.content
        } catch {
          // malformed line, skip
        }
      }
    }
    // Process any remaining buffered content
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer)
        if (chunk.message?.content) content += chunk.message.content
      } catch {
        // incomplete final chunk
      }
    }
    const result = content.trim()
    if (result.length > 0) return result
    // Empty response — wait with exponential backoff before retry
    const delay = attempt * 5000 // 5s, 10s, 15s
    console.warn(`[llm] Empty response from Ollama (attempt ${attempt}/${MAX_RETRIES}), waiting ${delay / 1000}s before retry...`)
    await new Promise((r) => setTimeout(r, delay))
  }
  return '' // all retries exhausted
}

function parseJSON<T>(raw: string): T {
  let text = raw
  // Strip <think>...</think> blocks (qwen3.5 reasoning)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '')
  // Strip markdown fences
  text = text.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/gi, '')
  // Strip model stop tokens and anything after them
  text = text.replace(/<\|endoftext\|>[\s\S]*/i, '')
  text = text.replace(/<\|im_start\|>[\s\S]*/i, '')
  text = text.replace(/<\|im_end\|>[\s\S]*/i, '')
  text = text.trim()

  // Extract the first balanced JSON object by tracking brace depth
  const start = text.indexOf('{')
  if (start !== -1) {
    let depth = 0
    let inString = false
    let escape = false
    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"' && !escape) { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          return JSON.parse(text.slice(start, i + 1))
        }
      }
    }
  }

  // Fallback: try to find a JSON array
  const arrStart = text.indexOf('[')
  if (arrStart !== -1) {
    let depth = 0
    let inString = false
    let escape = false
    for (let i = arrStart; i < text.length; i++) {
      const ch = text[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inString) { escape = true; continue }
      if (ch === '"' && !escape) { inString = !inString; continue }
      if (inString) continue
      if (ch === '[') depth++
      else if (ch === ']') {
        depth--
        if (depth === 0) {
          return JSON.parse(text.slice(arrStart, i + 1))
        }
      }
    }
  }

  return JSON.parse(text)
}

// ── Provider interface ──────────────────────────────────────────────────────

export interface LLMProvider {
  extractText(
    buffer: Buffer,
    mimeType: string
  ): Promise<{ text: string; title?: string; org_name?: string }>

  tagClausesBatch(chunks: string[]): Promise<string[][]>

  assessClause(
    clause: {
      id: string
      title: string
      shall_text: string
      evidence_types: string[]
      standard: string
    },
    evidenceChunks: { id: string; content: string; similarity: number }[]
  ): Promise<ClauseAssessmentResult>

  assessClauseBatch(
    items: {
      clause: { id: string; title: string; shall_text: string; evidence_types: string[]; standard: string }
      chunks: { id: string; content: string; similarity: number }[]
    }[]
  ): Promise<ClauseAssessmentResult[]>
}

interface ClauseAssessmentResult {
  status: 'evidenced' | 'partial' | 'gap'
  evidence_summary: string
  gap_description: string
  action_item: string
  priority: 1 | 2 | 3
  interview_questions: string[]
  source_chunk_ids: string[]
  evidence_checks?: Record<string, boolean> | null
}

// ── Implementation ──────────────────────────────────────────────────────────

function createOllamaLLMProvider(): LLMProvider {
  return {
    async extractText(buffer, mimeType) {
      // PDF: use pdf-parse for text extraction, then LLM for metadata
      if (mimeType === 'application/pdf') {
        console.log('[llm] pdf-parse: parsing PDF...')
        const parser = new PDFParse({ data: buffer })
        const result = await parser.getText()
        // TextResult contains pages — join all page text
        const text = (result as { pages: { text: string }[] }).pages.map((p: { text: string }) => p.text).join('\n')
        console.log('[llm] pdf-parse: done,', text.length, 'chars extracted')

        // Ask LLM to extract title and org name from first ~2000 chars
        console.log('[llm] Asking Ollama for metadata extraction...')
        const sample = text.slice(0, 2000)
        const metaRaw = await chat(
          `You extract metadata from document text. Return ONLY a JSON object with keys "title" and "org_name". If unknown, use null.`,
          `Extract the document title and organization name from this text:\n\n${sample}`
        )
        console.log('[llm] Ollama metadata response:', metaRaw.slice(0, 200))
        let title: string | undefined
        let org_name: string | undefined
        try {
          const meta = parseJSON<{ title?: string | null; org_name?: string | null }>(metaRaw)
          title = meta.title ?? undefined
          org_name = meta.org_name ?? undefined
        } catch {
          // Metadata extraction is best-effort
        }

        return { text, title, org_name }
      }

      // Images: use Ollama vision if the model supports it, otherwise return placeholder
      if (mimeType.startsWith('image/')) {
        const base64 = buffer.toString('base64')
        const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
              {
                role: 'user',
                content: 'Extract all text visible in this image. Return the raw text only, no commentary.',
                images: [base64],
              },
            ],
          }),
        })
        if (!res.ok) {
          throw new Error(`Ollama vision failed (${res.status}): ${await res.text()}`)
        }
        const data = await res.json()
        const text = (data.message?.content ?? '').trim()
        return { text }
      }

      throw new Error(`Unsupported mime type: ${mimeType}`)
    },

    async tagClausesBatch(chunks) {
      const results: string[][] = []
      for (const chunk of chunks) {
        const raw = await chat(
          `You are an ISO standards expert. Given a text chunk from a quality management document, identify which ISO clause numbers it likely relates to. Return ONLY a JSON array of clause ID strings like ["4.1","7.5.1","8.1"]. If uncertain, return an empty array.`,
          chunk.slice(0, 1500)
        )
        try {
          const tags = parseJSON<string[]>(raw)
          results.push(Array.isArray(tags) ? tags : [])
        } catch {
          results.push([])
        }
      }
      return results
    },

    async assessClause(clause, evidenceChunks) {
      const evidenceText = evidenceChunks.length > 0
        ? evidenceChunks.map((c, i) => `[Chunk ${i + 1} (sim: ${c.similarity.toFixed(3)})]:\n${c.content}`).join('\n\n')
        : '(No matching evidence found in uploaded documents)'

      const systemPrompt = `You are an ISO compliance auditor. Assess whether the provided evidence satisfies the given ISO clause requirement.

IMPORTANT: Respond with ONLY a valid JSON object. No markdown, no explanations, no analysis text before or after the JSON. Your entire response must be a single JSON object.

The JSON object must have these exact keys:
{
  "status": "evidenced" | "partial" | "gap",
  "evidence_summary": "brief summary of what evidence was found",
  "gap_description": "what is missing (empty string if fully evidenced)",
  "action_item": "recommended next step to close any gap (empty string if fully evidenced)",
  "priority": 1 | 2 | 3,
  "interview_questions": ["question 1", "question 2"],
  "source_chunk_ids": [],
  "evidence_checks": {"evidence_type_name": true | false}
}`

      const userPrompt = `CLAUSE: ${clause.id} — ${clause.title} (${clause.standard})
REQUIREMENT: ${clause.shall_text}
EXPECTED EVIDENCE TYPES: ${clause.evidence_types.join(', ') || 'None specified'}

DOCUMENT EVIDENCE:
${evidenceText}

Respond with ONLY a JSON object, no other text.`

      let raw = await chat(systemPrompt, userPrompt)

      // If the model returned prose instead of JSON, ask it to convert
      if (raw.length > 0 && !raw.trimStart().startsWith('{')) {
        console.warn('[llm] Response was not JSON, requesting conversion...')
        raw = await chat(
          'Convert the following analysis into a single JSON object with these keys: status, evidence_summary, gap_description, action_item, priority, interview_questions, source_chunk_ids, evidence_checks. Return ONLY the JSON object, nothing else.',
          raw
        )
      }

      try {
        console.log('[llm] Raw LLM response (first 500):', raw.slice(0, 500))
        const parsed = parseJSON<Record<string, unknown>>(raw)

        // Normalize status — LLM sometimes returns "Compliant", "Non-Compliant", etc.
        const rawStatus = String(parsed.status ?? 'gap').toLowerCase().replace(/[-_\s]+/g, '')
        let status: 'evidenced' | 'partial' | 'gap' = 'gap'
        if (rawStatus.includes('evidenced') || rawStatus.includes('compliant') || rawStatus.includes('conform')) status = 'evidenced'
        else if (rawStatus.includes('partial')) status = 'partial'

        // Normalize priority — LLM sometimes returns "Low", "High", "Medium" etc.
        let priority: 1 | 2 | 3 = 2
        const rawPriority = parsed.priority
        if (typeof rawPriority === 'number' && rawPriority >= 1 && rawPriority <= 3) {
          priority = rawPriority as 1 | 2 | 3
        } else if (typeof rawPriority === 'string') {
          const p = rawPriority.toLowerCase()
          if (p.includes('critical') || p.includes('high')) priority = 1
          else if (p.includes('low') || p.includes('minor')) priority = 3
        }

        // Normalize evidence_checks — LLM sometimes returns array instead of object
        let evidenceChecks: Record<string, boolean> | null = null
        if (parsed.evidence_checks && typeof parsed.evidence_checks === 'object' && !Array.isArray(parsed.evidence_checks)) {
          evidenceChecks = parsed.evidence_checks as Record<string, boolean>
        }

        const result: ClauseAssessmentResult = {
          status,
          evidence_summary: String(parsed.evidence_summary ?? ''),
          gap_description: String(parsed.gap_description ?? ''),
          action_item: String(parsed.action_item ?? ''),
          priority,
          interview_questions: Array.isArray(parsed.interview_questions) ? parsed.interview_questions.map(String) : [],
          source_chunk_ids: Array.isArray(parsed.source_chunk_ids) ? parsed.source_chunk_ids.map(String) : [],
          evidence_checks: evidenceChecks,
        }

        // Map source_chunk_ids to actual chunk IDs from evidence
        const validChunkIds = evidenceChunks.map((c) => c.id)
        result.source_chunk_ids = result.source_chunk_ids.filter((id) =>
          validChunkIds.includes(id)
        )
        // If LLM didn't return real IDs, use chunks above a similarity threshold
        if (result.source_chunk_ids.length === 0) {
          result.source_chunk_ids = evidenceChunks
            .filter((c) => c.similarity > 0.3)
            .map((c) => c.id)
        }

        return result
      } catch (parseErr) {
        // Fallback if LLM returns bad JSON
        console.error('[llm] JSON parse failed. Raw response:', raw.slice(0, 1000))
        console.error('[llm] Parse error:', parseErr)
        return {
          status: 'gap',
          evidence_summary: 'Unable to parse LLM assessment response',
          gap_description: 'Assessment failed — manual review required',
          action_item: 'Re-run assessment or review manually',
          priority: 2,
          interview_questions: ['What evidence exists for this clause?'],
          source_chunk_ids: evidenceChunks.filter((c) => c.similarity > 0.3).map((c) => c.id),
          evidence_checks: null,
        }
      }
    },

    async assessClauseBatch(items) {
      // Build a single prompt with all clauses to assess in one LLM call
      const clausePrompts = items.map((item, idx) => {
        const evidenceText = item.chunks.length > 0
          ? item.chunks.slice(0, 3).map((c, j) => `  [Chunk ${j + 1}]: ${c.content.slice(0, 500)}`).join('\n')
          : '  (No matching evidence)'
        return `--- CLAUSE ${idx + 1} ---
ID: ${item.clause.id}
TITLE: ${item.clause.title} (${item.clause.standard})
REQUIREMENT: ${item.clause.shall_text}
EXPECTED EVIDENCE: ${item.clause.evidence_types.join(', ') || 'None specified'}
DOCUMENT EVIDENCE:
${evidenceText}`
      }).join('\n\n')

      const raw = await chat(
        `You are an ISO compliance auditor. You will assess multiple clauses at once.

For EACH clause, determine if the evidence satisfies the requirement.
Return ONLY a JSON array with one object per clause, in order. Each object has:
- "status": "evidenced" | "partial" | "gap"
- "evidence_summary": brief summary (1-2 sentences)
- "gap_description": what is missing (empty string if evidenced)
- "action_item": next step to close gap (empty string if evidenced)
- "priority": 1 (critical) | 2 (important) | 3 (minor)
- "interview_questions": array of 1-2 questions
- "evidence_checks": object mapping evidence_type to true/false

Return a JSON array of ${items.length} objects. No other text.`,
        clausePrompts
      )

      try {
        const results = parseJSON<ClauseAssessmentResult[]>(raw)
        // Fix up source_chunk_ids for each result
        return items.map((item, idx) => {
          const result = results[idx] ?? {
            status: 'gap' as const,
            evidence_summary: 'Not assessed',
            gap_description: 'Batch parse error',
            action_item: 'Manual review required',
            priority: 2 as const,
            interview_questions: [],
            evidence_checks: null,
          }
          return {
            ...result,
            source_chunk_ids: item.chunks.filter((c) => c.similarity > 0.3).map((c) => c.id),
          }
        })
      } catch {
        // Fallback: return gap for all clauses
        return items.map((item) => ({
          status: 'gap' as const,
          evidence_summary: 'Unable to parse batch LLM response',
          gap_description: 'Assessment failed — manual review required',
          action_item: 'Re-run assessment or review manually',
          priority: 2 as const,
          interview_questions: ['What evidence exists for this clause?'],
          source_chunk_ids: item.chunks.filter((c) => c.similarity > 0.3).map((c) => c.id),
          evidence_checks: null,
        }))
      }
    },
  }
}

// ── Singleton export ────────────────────────────────────────────────────────

let _instance: LLMProvider | null = null

export function getLLMProvider(): LLMProvider {
  if (!_instance) _instance = createOllamaLLMProvider()
  return _instance
}
