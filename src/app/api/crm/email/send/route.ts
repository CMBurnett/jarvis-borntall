import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@crm/lib/email/smtp'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to, subject, text, html, lead_id, inReplyTo, references } = await req.json()

  if (!to || !text) {
    return NextResponse.json({ error: 'to and text are required' }, { status: 400 })
  }

  const { messageId } = await sendEmail({ to, subject, text, html, inReplyTo, references })

  // Log the outbound email as an interaction if lead_id provided
  if (lead_id) {
    await supabase.from('crm_interactions').insert({
      lead_id,
      type: 'email_outbound',
      subject: subject || null,
      body: text,
      email_message_id: messageId,
    })
    await supabase
      .from('crm_leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', lead_id)
  }

  return NextResponse.json({ messageId })
}
