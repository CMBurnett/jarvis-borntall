import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST — called by the NextWave marketing site after a user submits an AssessmentDialog.
// Secured by CRM_ASSESSMENT_API_KEY (not Supabase session — external caller).
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  const expectedKey = process.env.CRM_ASSESSMENT_API_KEY

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, company, source_slug, source_type, answers, resonates_with, timeline, win_criteria, additional_notes, ai_brief } = body

  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Match submitter email to existing lead contacts
  let leadId: string | null = null

  const { data: contact } = await admin
    .from('crm_lead_contacts')
    .select('lead_id')
    .ilike('email', email)
    .maybeSingle()

  if (contact?.lead_id) {
    leadId = contact.lead_id
  } else {
    // Create a new lead + contact from the assessment submission
    const { data: newLead } = await admin
      .from('crm_leads')
      .insert({
        name: company || name || 'Assessment submission',
        list_type: 'other',
        status: 'prospect',
      })
      .select()
      .single()

    if (newLead) {
      leadId = newLead.id
      await admin.from('crm_lead_contacts').insert({
        lead_id: newLead.id,
        name: name || email,
        email,
        is_primary: true,
      })
    }
  }

  const { data, error } = await admin
    .from('crm_assessments')
    .insert({
      lead_id: leadId,
      name,
      email,
      company,
      source_slug,
      source_type,
      answers,
      resonates_with,
      timeline,
      win_criteria,
      additional_notes,
      ai_brief,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, lead_id: leadId }, { status: 201 })
}
