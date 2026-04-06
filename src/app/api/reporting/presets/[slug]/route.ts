import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isMockMode, runPreset } from '@/lib/reporting/mock-adapter'

const SIDECAR = process.env.REPORTING_SIDECAR_URL ?? 'http://localhost:8002'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  if (isMockMode()) {
    try {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
      return NextResponse.json(runPreset(slug, searchParams))
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 400 })
    }
  }

  const search = req.nextUrl.searchParams.toString()
  const url = `${SIDECAR}/reporting/presets/${slug}${search ? `?${search}` : ''}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail }, { status: res.status })
    }
    return NextResponse.json(await res.json())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
