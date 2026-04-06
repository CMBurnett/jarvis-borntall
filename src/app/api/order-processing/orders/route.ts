import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the org_id for this user
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return NextResponse.json({ orders: [] })

  const { data } = await admin
    .from('op_orders')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('received_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ orders: data ?? [] })
}
