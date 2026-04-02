/**
 * Simple text chunker for document ingestion.
 * Replaces @iso-ready/lib/ingest/chunk.
 *
 * Splits on paragraph boundaries, targeting ~800 tokens (~3200 chars) per chunk
 * with ~200 char overlap for context continuity.
 * Falls back to sentence/hard splits when paragraphs are too large.
 */

const TARGET_SIZE = 3200
const OVERLAP = 200

export interface Chunk {
  chunkIndex: number
  content: string
}

/**
 * Split a large block of text into smaller pieces at sentence boundaries.
 * If no sentence boundaries exist, hard-split at TARGET_SIZE.
 */
function splitLargeBlock(block: string): string[] {
  if (block.length <= TARGET_SIZE) return [block]

  const pieces: string[] = []
  let remaining = block

  while (remaining.length > TARGET_SIZE) {
    // Try to split at a sentence boundary (. ! ? followed by space or newline)
    let splitAt = -1
    const searchWindow = remaining.slice(0, TARGET_SIZE)

    // Look for the last sentence-ending punctuation within the target window
    for (let i = searchWindow.length - 1; i >= TARGET_SIZE * 0.3; i--) {
      if ('.!?'.includes(searchWindow[i]) && (i + 1 >= searchWindow.length || /\s/.test(searchWindow[i + 1]))) {
        splitAt = i + 1
        break
      }
    }

    // Fall back to splitting at last newline
    if (splitAt === -1) {
      const lastNewline = searchWindow.lastIndexOf('\n', TARGET_SIZE)
      if (lastNewline > TARGET_SIZE * 0.3) {
        splitAt = lastNewline + 1
      }
    }

    // Hard split as last resort
    if (splitAt === -1) {
      splitAt = TARGET_SIZE
    }

    pieces.push(remaining.slice(0, splitAt).trim())
    // Apply overlap
    const overlapStart = Math.max(0, splitAt - OVERLAP)
    remaining = remaining.slice(overlapStart).trim()
  }

  if (remaining.trim()) {
    pieces.push(remaining.trim())
  }

  return pieces
}

export function chunkText(text: string): Chunk[] {
  if (!text || text.trim().length === 0) return []

  // Normalise whitespace
  const normalised = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  // Split on double newlines (paragraph boundaries)
  const paragraphs = normalised.split(/\n\n+/)

  const chunks: Chunk[] = []
  let current = ''

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    // If a single paragraph exceeds target, break it down further
    if (trimmed.length > TARGET_SIZE) {
      // Flush current buffer first
      if (current.trim()) {
        chunks.push({ chunkIndex: chunks.length, content: current.trim() })
        current = ''
      }
      // Split the large paragraph
      const subChunks = splitLargeBlock(trimmed)
      for (const sub of subChunks) {
        chunks.push({ chunkIndex: chunks.length, content: sub })
      }
      continue
    }

    if (current.length + trimmed.length + 2 > TARGET_SIZE && current.length > 0) {
      chunks.push({ chunkIndex: chunks.length, content: current.trim() })
      // Start next chunk with overlap from end of current
      const overlapText = current.slice(-OVERLAP).trim()
      current = overlapText ? overlapText + '\n\n' + trimmed : trimmed
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed
    }
  }

  // Final chunk
  if (current.trim()) {
    chunks.push({ chunkIndex: chunks.length, content: current.trim() })
  }

  return chunks
}
