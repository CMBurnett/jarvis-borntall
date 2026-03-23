import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMProvider } from '@iso-ready/lib/providers/llm/index'
import { getEmbeddingProvider } from '@iso-ready/lib/providers/embeddings/index'
import { chunkText } from '@iso-ready/lib/ingest/chunk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const llm = getLLMProvider()
    const embedder = getEmbeddingProvider()
    const supabase = await createClient()
    const admin = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: userData } = await admin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'No organisation found' }, { status: 400 })
    }

    const orgId = userData.org_id

    const formData = await request.formData()
    const file = formData.get('file') as File
    const engagementId = formData.get('engagement_id') as string

    if (!file || !engagementId) {
      return NextResponse.json({ error: 'Missing file or engagement_id' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const storagePath = `${orgId}/${engagementId}/${crypto.randomUUID()}-${file.name}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await admin.storage
      .from('documents')
      .upload(storagePath, fileBuffer, { contentType: file.type })

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    const { data: document, error: docError } = await admin
      .from('documents')
      .insert({
        engagement_id: engagementId,
        org_id: orgId,
        storage_path: storagePath,
        filename: file.name,
        doc_type: 'uploaded',
        status: 'processing',
      })
      .select()
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    const extractedText = await llm.extractText(fileBuffer, file.type)
    const chunks = chunkText(extractedText)

    const BATCH_SIZE = 10
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE)

      const clauseTags = await Promise.all(
        batch.map((chunk) => llm.tagClauses(chunk.content))
      )

      const embeddings = await embedder.embed(batch.map((c) => c.content))

      const rows = batch.map((chunk, idx) => ({
        engagement_id: engagementId,
        org_id: orgId,
        document_id: document.id,
        chunk_index: chunk.chunkIndex,
        content: chunk.content,
        likely_clauses: clauseTags[idx],
        [embedder.columnName]: embeddings[idx],
      }))

      await admin.from('document_chunks').insert(rows)
    }

    await admin.from('documents').update({ status: 'done' }).eq('id', document.id)

    return NextResponse.json({
      success: true,
      documentId: document.id,
      chunksCreated: chunks.length,
    })

  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
