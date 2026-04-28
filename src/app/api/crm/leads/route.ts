import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('crm_leads')
    .select('*, crm_lead_contacts(*)')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Extract contact fields before inserting lead
  const {
    contact_name, contact_title, contact_email, contact_phone, contact_linkedin,
    ...leadFields
  } = body

  if (!leadFields.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data: lead, error: leadError } = await supabase
    .from('crm_leads')
    .insert(leadFields)
    .select()
    .single()

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 })

  // Insert primary contact if provided
  if (contact_name?.trim()) {
    await supabase.from('crm_lead_contacts').insert({
      lead_id: lead.id,
      name: contact_name,
      title: contact_title || null,
      email: contact_email || null,
      phone: contact_phone || null,
      linkedin_url: contact_linkedin || null,
      is_primary: true,
    })
  }

  return NextResponse.json(lead, { status: 201 })
}
