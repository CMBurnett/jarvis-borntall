import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import ReportClient from './ReportClient'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: engagement } = await admin
    .from('engagements')
    .select('*')
    .eq('id', id)
    .single()

  if (!engagement) notFound()

  const { data: assessments } = await admin
    .from('clause_assessments')
    .select(`
      *,
      iso_clauses (
        id, section, title, shall_text, evidence_types, complexity, as9100_specific, standard
      )
    `)
    .eq('engagement_id', id)
    .order('priority', { ascending: true })

  return <ReportClient engagement={engagement} assessments={assessments ?? []} />
}
