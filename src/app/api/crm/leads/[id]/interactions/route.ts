import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enrichNote } from '@crm/lib/enrichment/claude'
import { sendEmail } from '@crm/lib/email/smtp'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: lead_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, subject, body: text, to } = body

  if (!type || !text?.trim()) {
    return NextResponse.json({ error: 'type and body are required' }, { status: 400 })
  }

  // Fetch lead name for enrichment context
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('name')
    .eq('id', lead_id)
    .single()

  const leadName = lead?.name ?? 'Unknown'

  let ai_summary: string | null = null
  let ai_next_action: string | null = null
  let messageId: string | null = null

  // AI enrichment for notes
  if (type === 'note') {
    const enrichment = await enrichNote(text, leadName).catch(() => null)
    if (enrichment) {
      ai_summary = enrichment.summary
      ai_next_action = enrichment.nextAction
    }
  }

  // Send outbound email via SMTP
  if (type === 'email_outbound' && to) {
    const sent = await sendEmail({
      to,
      subject: subject || `Following up — ${leadName}`,
      text,
    }).catch(() => null)

    if (sent) messageId = sent.messageId
  }

  const { data, error } = await supabase
    .from('crm_interactions')
    .insert({
      lead_id,
      type,
      subject: subject || null,
      body: text,
      email_message_id: messageId,
      ai_summary,
      ai_next_action,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_contacted_at on the lead
  await supabase
    .from('crm_leads')
    .update({ last_contacted_at: new Date().toISOString() })
    .eq('id', lead_id)

  return NextResponse.json(data, { status: 201 })
}
