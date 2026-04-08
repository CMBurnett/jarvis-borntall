import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use untyped admin client for op_* tables (not yet in generated types)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: order, error } = await admin
    .from('op_orders')
    .select('*, op_line_items(*)')
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Generate public URLs for stored attachments (permanent — bucket must be public)
  const storedAttachments = ((order as unknown as { attachments: Array<{ filename: string; path: string; content_type: string }> }).attachments ?? [])
  const attachments = storedAttachments.map((a) => {
    const { data } = admin.storage.from('op-attachments').getPublicUrl(a.path)
    return { filename: a.filename, content_type: a.content_type, url: data.publicUrl }
  })

  // Reshape line_items from join alias
  const result = {
    ...order,
    line_items: (order as unknown as { op_line_items: unknown[] }).op_line_items ?? [],
    attachments,
  }
  return NextResponse.json(result)
}
