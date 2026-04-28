import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: lead_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('crm_lead_contacts')
    .insert({ ...body, lead_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: lead_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contactId, ...fields } = await req.json()
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  // If setting as primary, clear existing primaries first
  if (fields.is_primary) {
    await supabase
      .from('crm_lead_contacts')
      .update({ is_primary: false })
      .eq('lead_id', lead_id)
  }

  const { data, error } = await supabase
    .from('crm_lead_contacts')
    .update(fields)
    .eq('id', contactId)
    .eq('lead_id', lead_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
