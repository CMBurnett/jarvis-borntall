import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { fetchUnseenEmails } from '@crm/lib/ingestion/imap'
import { parseEmail } from '@crm/lib/ingestion/parser'
import { enrichEmail } from '@crm/lib/enrichment/claude'

// GET ?log=1 — return recent sync log entries (used by settings page)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (req.nextUrl.searchParams.get('log') === '1') {
    const { data } = await supabase
      .from('crm_email_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ logs: data ?? [] })
  }

  return NextResponse.json({ logs: [] })
}

// POST — poll IMAP, match emails to leads, enrich with Claude
export async function POST(req: NextRequest) {
  // Accept either a bearer secret (for external callers) or an authenticated session
  const authHeader = req.headers.get('authorization')
  const bearerSecret = authHeader?.replace('Bearer ', '')
  const validSecret = process.env.CRM_EMAIL_POLL_SECRET

  let authed = false

  if (validSecret && bearerSecret === validSecret) {
    authed = true
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) authed = true
  }

  if (!authed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use service role for writes since the request may come from outside a session
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let emailsFound = 0
  let emailsMatched = 0
  let emailsSkipped = 0
  let syncError: string | null = null

  try {
    const rawEmails = await fetchUnseenEmails()
    emailsFound = rawEmails.length

    for (const { raw } of rawEmails) {
      const parsed = await parseEmail(raw)

      if (!parsed.fromEmail || !parsed.messageId) {
        emailsSkipped++
        continue
      }

      // Check for existing interaction (deduplication)
      const { data: existing } = await admin
        .from('crm_interactions')
        .select('id')
        .eq('email_message_id', parsed.messageId)
        .maybeSingle()

      if (existing) { emailsSkipped++; continue }

      // Match sender email to lead contacts (case-insensitive)
      const { data: contact } = await admin
        .from('crm_lead_contacts')
        .select('lead_id')
        .ilike('email', parsed.fromEmail)
        .maybeSingle()

      if (!contact?.lead_id) { emailsSkipped++; continue }

      // Fetch lead name for enrichment context
      const { data: lead } = await admin
        .from('crm_leads')
        .select('name')
        .eq('id', contact.lead_id)
        .single()

      const body = parsed.textBody ?? ''
      const enrichment = await enrichEmail({
        from: parsed.from ?? parsed.fromEmail,
        subject: parsed.subject,
        body: body.slice(0, 4000),
        leadName: lead?.name ?? 'Unknown',
      }).catch(() => null)

      // Insert interaction
      await admin.from('crm_interactions').insert({
        lead_id: contact.lead_id,
        type: 'email_inbound',
        subject: parsed.subject,
        body,
        email_message_id: parsed.messageId,
        ai_summary: enrichment?.summary ?? null,
        ai_next_action: enrichment?.nextAction ?? null,
        ai_sentiment: enrichment?.sentiment ?? null,
      })

      // Update lead's last_contacted_at
      await admin
        .from('crm_leads')
        .update({ last_contacted_at: parsed.date?.toISOString() ?? new Date().toISOString() })
        .eq('id', contact.lead_id)

      emailsMatched++
    }
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err)
  }

  // Log the sync run
  await admin.from('crm_email_sync_log').insert({
    emails_found: emailsFound,
    emails_matched: emailsMatched,
    emails_skipped: emailsSkipped,
    error: syncError,
  })

  if (syncError) {
    return NextResponse.json({ error: syncError, emails_found: emailsFound }, { status: 500 })
  }

  return NextResponse.json({ processed: emailsFound, matched: emailsMatched, skipped: emailsSkipped })
}
