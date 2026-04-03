import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SIDECAR = process.env.REPORTING_SIDECAR_URL ?? 'http://localhost:8002'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const search = req.nextUrl.searchParams.toString()
  const url = `${SIDECAR}/reporting/presets/${slug}${search ? `?${search}` : ''}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
