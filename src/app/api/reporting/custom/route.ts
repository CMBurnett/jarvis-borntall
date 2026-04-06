import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportSpecSchema } from '@reporting/lib/schema'
import { isMockMode, runCustom } from '@/lib/reporting/mock-adapter'

const SIDECAR = process.env.REPORTING_SIDECAR_URL ?? 'http://localhost:8002'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ReportSpecSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid ReportSpec', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  if (isMockMode()) {
    try {
      return NextResponse.json(runCustom(parsed.data))
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 422 })
    }
  }

  try {
    const res = await fetch(`${SIDECAR}/reporting/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
