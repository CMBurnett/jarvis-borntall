import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SIDECAR = process.env.REPORTING_SIDECAR_URL ?? 'http://localhost:8002'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${SIDECAR}/reporting/presets`)
    if (!res.ok) return NextResponse.json({ error: 'Sidecar error' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
