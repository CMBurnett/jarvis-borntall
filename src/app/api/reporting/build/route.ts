import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractIntent } from '@reporting/lib/intent/builder'

const SIDECAR = process.env.REPORTING_SIDECAR_URL ?? 'http://localhost:8002'

async function fetchPresets() {
  try {
    const res = await fetch(`${SIDECAR}/reporting/presets`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const presets = await fetchPresets()
  const intent = await extractIntent(prompt, presets)
  return NextResponse.json(intent)
}
