import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMProvider } from '@/lib/providers/llm'
import { getEmbeddingProvider } from '@/lib/providers/embeddings'
import { chunkText } from '@/lib/providers/chunk'
import { NextResponse } from 'next/server'

// ── Background job ─────────────────────────────────────────────────────────────
// Runs after the HTTP response is sent — no browser connection required.

interface FileInput {
  documentId: string
  fileBuffer: Buffer
  mimeType: string
  filename: string
}

async function runBackgroundProcessing(params: {
  assessmentId: string
  orgId: string
  files: FileInput[]
  standards: string[]
  jobId: string
}) {
  const { assessmentId, orgId, files, standards, jobId } = params
  const admin = createAdminClient()
  const llm = getLLMProvider()
  const embedder = getEmbeddingProvider()

  try {
    console.log(`[ingest] ▶ Background job ${jobId} starting for assessment ${assessmentId} (${files.length} file${files.length > 1 ? 's' : ''})`)
    await admin.from('processing_jobs').update({ status: 'running' }).eq('id', jobId)

    // ── Process each file: extract → chunk → embed ──────────────────────────
    let clientName = ''
    for (let fi = 0; fi < files.length; fi++) {
      const { documentId, fileBuffer, mimeType, filename } = files[fi]
      console.log(`[ingest] 📄 [${fi + 1}/${files.length}] Extracting text from ${filename} (${(fileBuffer.length / 1024).toFixed(0)} KB)...`)
      const extracted = await llm.extractText(fileBuffer, mimeType)
      const extractedText = extracted.text
      console.log('[ingest] ✓ Extracted', extractedText.length, 'chars, title:', extracted.title ?? '(none)', ', org:', extracted.org_name ?? '(none)')

      // Use the first file's metadata as the assessment name
      if (fi === 0 && (extracted.title || extracted.org_name)) {
        clientName = extracted.title && extracted.org_name
          ? `${extracted.title} — ${extracted.org_name}`
          : extracted.title || extracted.org_name || ''
        if (clientName) {
          await admin.from('assessments').update({ client_name: clientName }).eq('id', assessmentId)
        }
      }

      // Chunk and embed
      const chunks = chunkText(extractedText)
      console.log(`[ingest] 🔪 [${fi + 1}/${files.length}] Split into ${chunks.length} chunks`)
      const BATCH_SIZE = 10
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE)
        const batchNum = Math.floor(i / BATCH_SIZE) + 1
        const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)
        console.log(`[ingest] 📐 [${fi + 1}/${files.length}] Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)
        const embeddings = await embedder.embed(batch.map((c) => c.content))
        const rows = batch.map((chunk, idx) => ({
          assessment_id: assessmentId,
          org_id: orgId,
          document_id: documentId,
          chunk_index: chunk.chunkIndex,
          content: chunk.content,
          [embedder.columnName]: embeddings[idx],
        }))
        const { error: insertErr } = await admin.from('document_chunks').insert(rows)
        if (insertErr) console.error(`[ingest] ✗ Chunk insert error:`, insertErr)
      }
      await admin.from('documents').update({ status: 'done' }).eq('id', documentId)
    }
    console.log(`[ingest] ✓ All files ingested`)

    // ── Assess: load clauses → embed → gap analysis ──────────────────────────
    console.log(`[ingest] 🔍 Starting assessment phase...`)
    await admin.from('assessments').update({ status: 'analysing' }).eq('id', assessmentId)

    const clauseStandards = [...new Set(
      standards.flatMap((s) => (s === 'as9100' ? ['as9100', 'iso9001'] : [s]))
    )]
    const { data: clauses } = await admin
      .from('iso_clauses')
      .select('id, standard, title, shall_text, evidence_types')
      .in('standard', clauseStandards)

    if (!clauses || clauses.length === 0) throw new Error('No clauses found. Has iso_clauses been seeded?')
    console.log(`[ingest] 📋 Loaded ${clauses.length} clauses for standards: ${clauseStandards.join(', ')}`)

    // Embed clause queries for similarity search
    console.log(`[ingest] 📐 Embedding ${clauses.length} clause queries...`)
    const clauseEmbeddings: number[][] = []
    for (const clause of clauses) {
      const emb = await embedder.embedQuery(`${clause.title}: ${clause.shall_text}`)
      clauseEmbeddings.push(emb)
    }
    console.log(`[ingest] ✓ Clause embeddings done`)

    // Warm up the LLM before assessment loop — forces model into VRAM
    console.log(`[ingest] 🔥 Warming up LLM...`)
    await llm.assessClause(
      { id: 'warmup', title: 'Warmup', shall_text: 'Test', evidence_types: [], standard: 'test' },
      [{ id: 'warmup', content: 'This is a warmup call.', similarity: 1.0 }]
    )
    console.log(`[ingest] ✓ LLM warm`)

    // Assess each clause individually — one LLM call per clause for reliable JSON
    let failedClauses = 0
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i]
      console.log(`[ingest] 📊 Assessing clause ${i + 1}/${clauses.length}: ${clause.id} — ${clause.title}`)

      try {
        const rpcPayload = {
          query_embedding: clauseEmbeddings[i],
          assessment_id: assessmentId,
          match_count: 5,
        }
        const { data: matched, error: rpcErr } = await admin.rpc(embedder.matchFunction, rpcPayload)
        if (rpcErr) console.error(`[ingest] ✗ RPC match error for ${clause.id}:`, rpcErr)
        if (!matched || matched.length === 0) {
          console.warn(`[ingest] ⚠ No chunks matched for ${clause.id} (rpc: ${embedder.matchFunction}, assessment: ${assessmentId}, embedding dims: ${clauseEmbeddings[i].length}, error: ${rpcErr ? JSON.stringify(rpcErr) : 'none'})`)
        }

        const evidenceChunks = (matched ?? []).map(
          (c: { id: string; content: string; similarity: number }) => ({
            id: c.id, content: c.content, similarity: c.similarity,
          })
        )
        console.log(`[ingest] 🔎 ${clause.id}: ${evidenceChunks.length} evidence chunks matched${evidenceChunks.length > 0 ? ` (top sim: ${evidenceChunks[0].similarity.toFixed(3)})` : ''}`)

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
            provider: 'ollama',
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
        console.log(`[ingest] ✓ ${clause.id}: ${result.status}`)
      } catch (clauseErr) {
        failedClauses++
        console.error(`[ingest] ✗ Clause ${clause.id} failed (${failedClauses} total failures):`, clauseErr instanceof Error ? clauseErr.message : clauseErr)
        // Upsert a fallback so it's visible in the report
        await admin.from('clause_assessments').upsert(
          {
            assessment_id: assessmentId,
            org_id: orgId,
            clause_id: clause.id,
            provider: 'ollama',
            status: 'gap',
            evidence_summary: 'Assessment failed due to error',
            gap_description: `Error: ${clauseErr instanceof Error ? clauseErr.message : 'Unknown error'} — manual review required`,
            action_item: 'Re-run assessment for this clause',
            priority: 2,
            interview_questions: ['What evidence exists for this clause?'],
            source_chunk_ids: [],
            evidence_checks: null,
          },
          { onConflict: 'assessment_id,clause_id,provider' }
        )
      }
    }
    if (failedClauses > 0) console.warn(`[ingest] ⚠ ${failedClauses}/${clauses.length} clauses had errors`)

    // ── Done ──────────────────────────────────────────────────────────────────
    console.log(`[ingest] ✅ Assessment ${assessmentId} complete!`)
    await Promise.all([
      admin.from('assessments').update({ status: 'complete' }).eq('id', assessmentId),
      admin.from('processing_jobs')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', jobId),
    ])
  } catch (err) {
    console.error(`[ingest] ✗ Background processing error:`, err)
    const msg = err instanceof Error ? err.message : 'Unknown error'
    await Promise.all([
      admin.from('assessments').update({ status: 'error' }).eq('id', assessmentId),
      admin.from('processing_jobs').update({ status: 'error', error: msg }).eq('id', jobId),
    ])
  }
}

// ── Fast path handler ──────────────────────────────────────────────────────────
// Uploads files, creates records, fires background job,
// returns {assessmentId} immediately.

export async function POST(request: Request) {
  console.log(`[ingest] POST /api/ingest received`)
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log(`[ingest] ✗ Unauthorised — no user session`)
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    console.log(`[ingest] 👤 User: ${user.id}`)

    const { data: userData } = await admin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()
    if (!userData?.org_id) return NextResponse.json({ error: 'No organisation found' }, { status: 400 })
    const orgId = userData.org_id

    const formData = await request.formData()
    const rawFiles = formData.getAll('files') as File[]
    if (rawFiles.length === 0) return NextResponse.json({ error: 'Missing files' }, { status: 400 })

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    for (const f of rawFiles) {
      if (!allowedTypes.includes(f.type)) {
        return NextResponse.json({ error: `Unsupported file type: ${f.name}` }, { status: 400 })
      }
    }

    const standardsRaw = formData.get('standards') as string | null
    const standards: string[] = standardsRaw ? JSON.parse(standardsRaw) : ['as9100']

    // Use first filename as initial title — background job will update with real metadata
    const baseName = rawFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
    const suffix = rawFiles.length > 1 ? ` +${rawFiles.length - 1} more` : ''
    const clientName = `${baseName}${suffix} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`

    // Create assessment record — appears in list immediately
    const { data: assessment, error: asmtError } = await admin
      .from('assessments')
      .insert({ org_id: orgId, client_name: clientName, status: 'ingesting', standards })
      .select('id')
      .single()
    if (asmtError || !assessment) return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 })
    const assessmentId = assessment.id

    // Upload and create document records for each file
    const fileInputs: FileInput[] = []
    for (const file of rawFiles) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const storagePath = `${orgId}/${crypto.randomUUID()}-${file.name}`
      const { error: storageError } = await admin.storage
        .from('documents')
        .upload(storagePath, fileBuffer, { contentType: file.type })
      if (storageError) {
        console.error(`[ingest] ✗ Storage upload failed for ${file.name}:`, storageError.message)
        continue
      }

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
      if (docError || !document) {
        console.error(`[ingest] ✗ Document record failed for ${file.name}:`, docError)
        continue
      }

      fileInputs.push({ documentId: document.id, fileBuffer, mimeType: file.type, filename: file.name })
    }

    if (fileInputs.length === 0) {
      return NextResponse.json({ error: 'No files could be uploaded' }, { status: 500 })
    }

    console.log(`[ingest] 📁 Uploaded ${fileInputs.length} file(s) for assessment ${assessmentId}`)

    // Create processing job record
    const { data: job, error: jobError } = await admin
      .from('processing_jobs')
      .insert({
        assessment_id: assessmentId,
        org_id: orgId,
        job_type: 'ingest_and_assess',
        status: 'queued',
        payload: { standards, filenames: fileInputs.map((f) => f.filename) },
      })
      .select('id')
      .single()
    if (jobError || !job) return NextResponse.json({ error: 'Failed to create processing job' }, { status: 500 })

    // Fire background processing — response returns before this completes
    console.log(`[ingest] 🚀 Firing background job ${job.id} for assessment ${assessmentId}`)
    after(async () => {
      await runBackgroundProcessing({
        assessmentId,
        orgId,
        files: fileInputs,
        standards,
        jobId: job.id,
      })
    })

    console.log(`[ingest] ✓ Fast path done — returning assessmentId ${assessmentId}`)
    return NextResponse.json({ success: true, assessmentId })

  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
