import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runEnrichmentAgent } from '@crm/lib/enrichment/agent'
import type { EnrichEvent, Lead } from '@crm/lib/types'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .select('*, crm_lead_contacts(*)')
    .eq('id', id)
    .single()

  if (leadError || !lead) return new Response('Not found', { status: 404 })
  if (lead.list_type !== 'manufacturing') {
    return new Response('Enrichment is only available for manufacturing leads', { status: 422 })
  }
  if (!lead.domain && !lead.website) {
    return new Response('Lead has no domain or website', { status: 422 })
  }
  if (lead.enrichment_status === 'running') {
    return new Response('Enrichment already in progress', { status: 409 })
  }

  await supabase
    .from('crm_leads')
    .update({ enrichment_status: 'running', enrichment_error: null })
    .eq('id', id)

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: EnrichEvent) {
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`)
      }

      try {
        const finalMessage = await runEnrichmentAgent(
          lead as unknown as Lead,
          supabase,
          send,
        )

        await supabase
          .from('crm_leads')
          .update({ enrichment_status: 'ai_enriched', enriched_at: new Date().toISOString() })
          .eq('id', id)

        send({ type: 'done', message: finalMessage })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        await supabase
          .from('crm_leads')
          .update({ enrichment_status: 'failed', enrichment_error: message })
          .eq('id', id)
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
