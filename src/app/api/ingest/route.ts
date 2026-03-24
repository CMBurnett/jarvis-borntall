import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMProvider } from '@iso-ready/lib/providers/llm/index'
import { getEmbeddingProvider } from '@iso-ready/lib/providers/embeddings/index'
import { chunkText } from '@iso-ready/lib/ingest/chunk'
import { NextResponse } from 'next/server'

// ── Background job ─────────────────────────────────────────────────────────────
// Runs after the HTTP response is sent — no browser connection required.

async function runBackgroundProcessing(params: {
  assessmentId: string
  orgId: string
  documentId: string
  fileBuffer: Buffer
  mimeType: string
  standards: string[]
  jobId: string
}) {
  const { assessmentId, orgId, documentId, fileBuffer, mimeType, standards, jobId } = params
  const admin = createAdminClient()
  const llm = getLLMProvider()
  const embedder = getEmbeddingProvider()

  try {
    await admin.from('processing_jobs').update({ status: 'running' }).eq('id', jobId)

    // ── Extract text + metadata ───────────────────────────────────────────────
    const extracted = await llm.extractText(fileBuffer, mimeType)
    const extractedText = extracted.text

    // Update client_name now that we have real metadata
    if (extracted.title || extracted.org_name) {
      const clientName = extracted.title && extracted.org_name
        ? `${extracted.title} — ${extracted.org_name}`
        : extracted.title || extracted.org_name || ''
      if (clientName) {
        await admin.from('assessments').update({ client_name: clientName }).eq('id', assessmentId)
      }
    }

    // ── Ingest: chunk → embed → tag ──────────────────────────────────────────
    const chunks = chunkText(extractedText)
    const BATCH_SIZE = 10
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)
      const [clauseTags, embeddings] = await Promise.all([
        llm.tagClausesBatch(batch.map((c) => c.content)),
        embedder.embed(batch.map((c) => c.content)),
      ])
      const rows = batch.map((chunk, idx) => ({
        assessment_id: assessmentId,
        org_id: orgId,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        likely_clauses: clauseTags[idx],
        [embedder.columnName]: embeddings[idx],
      }))
      await admin.from('document_chunks').insert(rows)
    }
    await admin.from('documents').update({ status: 'done' }).eq('id', documentId)

    // ── Assess: load clauses → embed → gap analysis ──────────────────────────
    await admin.from('assessments').update({ status: 'analysing' }).eq('id', assessmentId)

    const clauseStandards = [...new Set(
      standards.flatMap((s) => (s === 'as9100' ? ['as9100', 'iso9001'] : [s]))
    )]
    const { data: clauses } = await admin
      .from('iso_clauses')
      .select('id, standard, title, shall_text, evidence_types')
      .in('standard', clauseStandards)

    if (!clauses || clauses.length === 0) throw new Error('No clauses found. Has iso_clauses been seeded?')

    const EMBED_BATCH = 50
    const clauseEmbeddings: number[][] = []
    for (let i = 0; i < clauses.length; i += EMBED_BATCH) {
      const batch = clauses.slice(i, i + EMBED_BATCH)
      const embs = await embedder.embed(batch.map((c) => `${c.title}: ${c.shall_text}`))
      clauseEmbeddings.push(...embs)
    }

    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i]
      const { data: chunks } = await admin.rpc(embedder.matchFunction, {
        query_embedding: clauseEmbeddings[i],
        assessment_id: assessmentId,
        match_count: 5,
      })
      const evidenceChunks = (chunks ?? []).map(
        (c: { id: string; content: string; similarity: number }) => ({
          id: c.id, content: c.content, similarity: c.similarity,
        })
      )
      const result = await llm.assessClause(
        {
          id: clause.id,
          title: clause.title,
          shall_text: clause.shall_text,
          evidence_types: clause.evidence_types ?? [],
          standard: clause.standard,
        },
        evidenceChunks
      )
      await admin.from('clause_assessments').upsert(
        {
          assessment_id: assessmentId,
          org_id: orgId,
          clause_id: clause.id,
          provider: 'anthropic',
          status: result.status,
          evidence_summary: result.evidence_summary,
          gap_description: result.gap_description,
          action_item: result.action_item,
          priority: result.priority,
          interview_questions: result.interview_questions,
          source_chunk_ids: result.source_chunk_ids,
          evidence_checks: result.evidence_checks ?? null,
        },
        { onConflict: 'assessment_id,clause_id,provider' }
      )
    }

    // ── Done ──────────────────────────────────────────────────────────────────
    await Promise.all([
      admin.from('assessments').update({ status: 'complete' }).eq('id', assessmentId),
      admin.from('processing_jobs')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', jobId),
    ])
  } catch (err) {
    console.error('Background processing error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await Promise.all([
      admin.from('assessments').update({ status: 'error' }).eq('id', assessmentId),
      admin.from('processing_jobs').update({ status: 'error', error: msg }).eq('id', jobId),
    ])
  }
}

// ── Fast path handler ──────────────────────────────────────────────────────────
// Uploads file, extracts text+metadata, creates records, fires background job,
// returns {assessmentId} immediately (~5-10s).

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: userData } = await admin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData?.org_id) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })
    const orgId = userData.org_id

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const standardsRaw = formData.get('standards') as string | null
    const standards: string[] = standardsRaw ? JSON.parse(standardsRaw) : ['as9100']

    // Upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `${orgId}/${crypto.randomUUID()}-${file.name}`
    const { error: storageError } = await admin.storage
      .from('documents')
      .upload(storagePath, fileBuffer, { contentType: file.type })
    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

    // Use filename as initial title — background job will update with real metadata
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    const clientName = `${baseName} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

    // Create assessment record — appears in realtime list immediately
    const { data: assessment, error: asmtError } = await admin
      .from('assessments')
      .insert({ org_id: orgId, client_name: clientName, status: 'ingesting', standards })
      .select('id')
      .single()
    if (asmtError || !assessment) return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
    const assessmentId = assessment.id

    // Create document record
    const { data: document, error: docError } = await admin
      .from('documents')
      .insert({
        assessment_id: assessmentId,
        org_id: orgId,
        storage_path: storagePath,
        filename: file.name,
        doc_type: 'uploaded',
        status: 'processing',
      })
      .select('id')
      .single()
    if (docError || !document) return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })

    // Create processing job record
    const { data: job, error: jobError } = await admin
      .from('processing_jobs')
      .insert({
        assessment_id: assessmentId,
        org_id: orgId,
        job_type: 'ingest_and_assess',
        status: 'queued',
        payload: { standards, filename: file.name },
      })
      .select('id')
      .single()
    if (jobError || !job) return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 })

    // Fire background processing — response returns before this completes
    after(async () => {
      await runBackgroundProcessing({
        assessmentId,
        orgId,
        documentId: document.id,
        fileBuffer,
        mimeType: file.type,
        standards,
        jobId: job.id,
      })
    })

    return NextResponse.json({ success: true, assessmentId })

  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
