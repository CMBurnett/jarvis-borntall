import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { orderToCsv } from '@order-processing/lib/export/csv'
import { orderToJson } from '@order-processing/lib/export/json'
import type { Order } from '@order-processing/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = (await req.json()) as Order

  // Persist any reviewer edits made in the UI back to Supabase
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin
    .from('op_orders')
    .update({
      status: 'approved',
      customer_name: order.customer_name,
      po_number: order.po_number,
      delivery_date: order.delivery_date,
      shipping_address: order.shipping_address,
      special_instructions: order.special_instructions,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  // Update line items with reviewer SKU selections
  for (const item of order.line_items ?? []) {
    await admin
      .from('op_line_items')
      .update({
        sku_matched: item.sku_matched,
        sku_match_status: item.sku_match_status,
        override_note: item.override_note,
      })
      .eq('id', item.id)
  }

  // Audit log
  await admin.from('op_audit_log').insert({
    order_id: id,
    actor: user.email ?? user.id,
    action: 'approved',
    payload: { reviewer: user.email },
  })

  // Generate CSV export
  const csv = orderToCsv(order)
  const json = orderToJson(order)

  // Mark as exported
  await admin
    .from('op_orders')
    .update({ status: 'exported', updated_at: new Date().toISOString() })
    .eq('id', id)

  await admin.from('op_audit_log').insert({
    order_id: id,
    actor: 'system',
    action: 'exported',
    payload: { format: 'csv' },
  })

  return NextResponse.json({ ok: true, csv, json })
}
