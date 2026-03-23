import { createClient } from '@/lib/supabase/server'

type Engagement = {
  id: string
  client_name: string
  status: string
  created_at: string
  standards: string[] | null
}

export default async function IsoReadyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: engagements } = await supabase
    .from('engagements')
    .select('id, client_name, status, created_at, standards')
    .order('created_at', { ascending: false }) as { data: Engagement[] | null }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">ISO Ready</h1>
            <p className="text-gray-500 mt-1 text-sm">Signed in as {user?.email}</p>
          </div>
          <a
            href="/apps/iso-ready/dashboard/upload"
            className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            New Upload
          </a>
        </div>

        {!engagements?.length ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-sm">No engagements yet. Upload a document to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {engagements.map(eng => (
              <a
                key={eng.id}
                href={`/apps/iso-ready/dashboard/engagements/${eng.id}/report`}
                className="block bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{eng.client_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(eng.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {eng.standards?.length ? ` · ${eng.standards.join(', ')}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    eng.status === 'complete'
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : 'border-gray-200 text-gray-500 bg-gray-50'
                  }`}>
                    {eng.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
