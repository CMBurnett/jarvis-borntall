import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

interface MappedRow {
  lead: Record<string, string>
  contacts: Array<Record<string, string>>
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { listType, rows } = await req.json() as { listType: string; rows: MappedRow[] }

  if (!listType || !Array.isArray(rows)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let inserted = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.lead?.name) continue
    try {
      const { data: lead, error: leadErr } = await admin
        .from('crm_leads')
        .insert({ ...row.lead, list_type: listType })
        .select('id')
        .single()

      if (leadErr || !lead) {
        errors.push(`${row.lead.name}: ${leadErr?.message ?? 'insert failed'}`)
        continue
      }

      const contactRows = (row.contacts ?? [])
        .filter(c => c['name'])
        .map((c, i) => ({ ...c, lead_id: lead.id, is_primary: i === 0 }))

      if (contactRows.length > 0) {
        const { error: contactErr } = await admin.from('crm_lead_contacts').insert(contactRows)
        if (contactErr) errors.push(`${row.lead.name} contacts: ${contactErr.message}`)
      }

      inserted++
    } catch (err) {
      errors.push(`${row.lead.name}: ${String(err)}`)
    }
  }

  return NextResponse.json({ inserted, errors })
}
