import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { orderToCsv } from '@order-processing/lib/export/csv'
import { orderToJson } from '@order-processing/lib/export/json'
import type { Order } from '@order-processing/lib/types'

export async function GET(
  req: NextRequest,
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

  const format = req.nextUrl.searchParams.get('format') ?? 'csv'
  const fullOrder = {
    ...order,
    line_items: (order as unknown as { op_line_items: unknown[] }).op_line_items ?? [],
  } as Order

  if (format === 'json') {
    const json = orderToJson(fullOrder)
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="order-${id}.json"`,
      },
    })
  }

  const csv = orderToCsv(fullOrder)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="order-${id}.csv"`,
    },
  })
}
