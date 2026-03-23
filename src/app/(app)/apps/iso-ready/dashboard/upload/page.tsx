'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STANDARDS = [
  { id: 'as9100',   label: 'AS9100 Rev D',    description: 'Aerospace Quality Management' },
  { id: 'iso14001', label: 'ISO 14001:2015',  description: 'Environmental Management' },
  { id: 'iso45001', label: 'ISO 45001:2018',  description: 'OH&S Management' },
]

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [engagementId, setEngagementId] = useState('')
  const [selectedStandards, setSelectedStandards] = useState<string[]>(['as9100'])
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ chunksCreated: number; documentId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleStandard(id: string) {
    setSelectedStandards(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !engagementId || selectedStandards.length === 0) return

    setStatus('uploading')
    setError(null)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any
      const { error: updateError } = await supabase
        .from('engagements')
        .update({ standards: selectedStandards })
        .eq('id', engagementId)

      if (updateError) {
        setError(`Could not update engagement standards: ${updateError.message}`)
        setStatus('error')
        return
      }

      setStatus('processing')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('engagement_id', engagementId)

      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        setStatus('error')
        return
      }

      setResult(data)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href="/apps/iso-ready/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← Dashboard
          </a>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Upload Document</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Upload a quality document to extract and index its content against selected ISO standards.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement ID</label>
            <input
              type="text"
              value={engagementId}
              onChange={(e) => setEngagementId(e.target.value)}
              placeholder="paste engagement UUID here"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">Temporary — engagement picker coming soon</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Standards to assess</label>
            <div className="space-y-2">
              {STANDARDS.map(std => (
                <label
                  key={std.id}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedStandards.includes(std.id)
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedStandards.includes(std.id)}
                    onChange={() => toggleStandard(std.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{std.label}</div>
                    <div className="text-xs text-gray-500">{std.description}</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedStandards.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Select at least one standard.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document</label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-700"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG or WEBP</p>
          </div>

          <button
            type="submit"
            disabled={!file || !engagementId || selectedStandards.length === 0 || status === 'processing'}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'uploading' && 'Updating engagement...'}
            {status === 'processing' && 'Extracting & indexing — this may take a minute...'}
            {(status === 'idle' || status === 'done' || status === 'error') && 'Upload & Process'}
          </button>
        </form>

        {status === 'done' && result && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">Document processed</p>
            <p className="text-green-700 text-sm mt-1">{result.chunksCreated} chunks created and indexed</p>
            <p className="text-green-600 text-xs mt-1 font-mono">{result.documentId}</p>
            <a
              href="/apps/iso-ready/dashboard"
              className="inline-block mt-3 text-sm text-green-800 underline"
            >
              Back to dashboard
            </a>
          </div>
        )}

        {status === 'error' && error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
