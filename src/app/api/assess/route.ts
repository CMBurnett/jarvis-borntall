import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLLMProvider } from '@/lib/providers/llm'
import { getEmbeddingProvider } from '@/lib/providers/embeddings'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { assessmentId } = await request.json()
    if (!assessmentId) return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const admin = createAdminClient()
    const llm = getLLMProvider()
    const embedder = getEmbeddingProvider()

    const { data: assessment } = await admin
      .from('assessments')
      .select('id, org_id, standards')
      .eq('id', assessmentId)
      .single()

    if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })

    await admin.from('assessments').update({ status: 'analysing' }).eq('id', assessmentId)

    // AS9100 encompasses both 'as9100'-specific clauses and the 'iso9001' base
    const standards = assessment.standards as string[]
    const clauseStandards = [...new Set(standards.flatMap(s => s === 'as9100' ? ['as9100', 'iso9001'] : [s]))]

    const { data: clauses } = await admin
      .from('iso_clauses')
      .select('id, standard, title, shall_text, evidence_types')
      .in('standard', clauseStandards)

    if (!clauses || clauses.length === 0) {
      return NextResponse.json(
        { error: 'No clauses found. Has the iso_clauses table been seeded?' },
        { status: 400 }
      )
    }

    // Embed all clause queries (using search_query prefix for nomic)
    const clauseEmbeddings: number[][] = []
    for (const clause of clauses) {
      const emb = await embedder.embedQuery(`${clause.title}: ${clause.shall_text}`)
      clauseEmbeddings.push(emb)
    }

    // Assess each clause
    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i]
      const embedding = clauseEmbeddings[i]

      const { data: chunks } = await admin.rpc(embedder.matchFunction, {
        query_embedding: embedding,
        assessment_id: assessmentId,
        match_count: 5,
      })

      const evidenceChunks = (chunks ?? []).map((c: { id: string; content: string; similarity: number }) => ({
        id: c.id,
        content: c.content,
        similarity: c.similarity,
      }))

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
          org_id: assessment.org_id,
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
    }

    await admin.from('assessments').update({ status: 'complete' }).eq('id', assessmentId)

    return NextResponse.json({ success: true, assessed: clauses.length })

  } catch (error) {
    console.error('Assess error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
