'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ChevronRight,
  Upload,
  FileText,
  X,
  Clock,
  Loader2,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogos } from '@/components/brand-logos'
import { createClient } from '@/lib/supabase/client'

// ── Constants ──────────────────────────────────────────────────────────────────

const STANDARDS = [
  { id: 'as9100',   short: 'AS9100',    full: 'AS9100 Rev D',   color: 'text-blue-600 dark:text-blue-400' },
  { id: 'iso9001',  short: 'ISO 9001',  full: 'ISO 9001:2015',  color: 'text-sky-600 dark:text-sky-400' },
  { id: 'iso14001', short: 'ISO 14001', full: 'ISO 14001:2015', color: 'text-teal-600 dark:text-teal-400' },
  { id: 'iso45001', short: 'ISO 45001', full: 'ISO 45001:2018', color: 'text-violet-600 dark:text-violet-400' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; pulse?: boolean }> = {
  ingesting:    { label: 'Ingesting',  color: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/20',            dot: 'bg-blue-500',    pulse: true },
  analysing:    { label: 'Analysing',  color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20',        dot: 'bg-amber-500',   pulse: true },
  interviewing: { label: 'Interview',  color: 'text-violet-700 dark:text-violet-300 bg-violet-500/10 border-violet-500/20',    dot: 'bg-violet-500' },
  complete:     { label: 'Complete',   color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
  error:        { label: 'Error',      color: 'text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20',                dot: 'bg-red-500' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface Assessment {
  id: string
  client_name: string
  status: string
  standards: string[]
  created_at: string
}

type RunStatus = 'idle' | 'submitting' | 'error'

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IsoReadyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  // Run form state
  const [selectedStandards, setSelectedStandards] = useState<string[]>(['as9100'])
  const [files, setFiles] = useState<File[]>([])
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Initial load
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[iso-ready] Auth user:', user?.id ?? 'NOT AUTHENTICATED')
      const { data, error: err } = await supabase
        .from('assessments')
        .select('id, client_name, status, standards, created_at')
        .order('created_at', { ascending: false })
      if (err) console.error('[iso-ready] Assessments query error:', err)
      console.log('[iso-ready] Loaded', data?.length ?? 0, 'assessments', data)
      setAssessments(data ?? [])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Realtime: INSERT adds to top of list, UPDATE refreshes status in-place
  useEffect(() => {
    const channel = supabase
      .channel('assessments-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'assessments' },
        (payload) => {
          setAssessments((prev) => {
            // Avoid duplicates if we already added it via refreshAssessments
            if (prev.some((a) => a.id === (payload.new as Assessment).id)) return prev
            return [payload.new as Assessment, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'assessments' },
        (payload) => {
          setAssessments((prev) =>
            prev.map((a) => (a.id === (payload.new as Assessment).id ? (payload.new as Assessment) : a))
          )
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll for status updates while any assessment is in-progress (fallback for realtime)
  useEffect(() => {
    const hasInProgress = assessments.some((a) => a.status === 'ingesting' || a.status === 'analysing')
    if (!hasInProgress) return
    const interval = setInterval(refreshAssessments, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessments])

  function toggleStandard(id: string) {
    setSelectedStandards((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) setFiles((prev) => [...prev, ...dropped])
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function refreshAssessments() {
    const { data, error: err } = await supabase
      .from('assessments')
      .select('id, client_name, status, standards, created_at')
      .order('created_at', { ascending: false })
    if (err) console.error('[iso-ready] Refresh error:', err)
    console.log('[iso-ready] Refreshed', data?.length ?? 0, 'assessments')
    if (data) setAssessments(data)
  }

  async function handleRun() {
    if (files.length === 0 || selectedStandards.length === 0) return
    setRunStatus('submitting')
    setError(null)

    try {
      const formData = new FormData()
      for (const f of files) {
        formData.append('files', f)
      }
      formData.append('standards', JSON.stringify(selectedStandards))

      const res = await fetch('/api/ingest', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')

      // Reset form and refresh the list to show the new assessment
      setFiles([])
      setSelectedStandards(['as9100'])
      setRunStatus('idle')
      await refreshAssessments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setRunStatus('error')
    }
  }

  const canRun = files.length > 0 && selectedStandards.length > 0
  const isSubmitting = runStatus === 'submitting'

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">ISO Ready</h1>
            <p className="text-xs text-muted-foreground">ISO gap analysis and audit readiness</p>
          </div>
        </div>
        <BrandLogos />
      </div>

      {/* New Assessment Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">

        {/* Title + Run button */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">New Assessment</p>
          <Button
            size="default"
            disabled={!canRun || isSubmitting}
            onClick={handleRun}
          >
            {isSubmitting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" data-icon="inline-start" />
              : <Play className="h-3.5 w-3.5" data-icon="inline-start" />
            }
            {isSubmitting ? 'Submitting…' : 'Run Assessment'}
          </Button>
        </div>

        {/* Standards grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {STANDARDS.map((s) => {
            const checked = selectedStandards.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleStandard(s.id)}
                disabled={isSubmitting}
                className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                  checked
                    ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
                    : 'border-transparent bg-muted/40 hover:bg-muted/70 dark:bg-muted/20 dark:hover:bg-muted/30'
                }`}
              >
                <div className={`flex items-center justify-center h-4 w-4 rounded shrink-0 transition-all duration-150 ${
                  checked
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800'
                }`}>
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{s.short}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.full}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? [])
            if (selected.length > 0) setFiles((prev) => [...prev, ...selected])
            e.target.value = ''
          }}
        />

        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {f.size >= 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`}
                </span>
                {!isSubmitting && (
                  <button
                    onClick={() => removeFile(i)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          disabled={isSubmitting}
          className="w-full border-2 border-dashed border-border rounded-lg py-6 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-5 w-5" />
          <p className="text-sm font-medium">{files.length > 0 ? 'Add more documents' : 'Upload documents'}</p>
          <p className="text-[10px] max-w-sm text-center leading-relaxed">
            Quality manual, procedures, work instructions, forms, records — upload everything referenced in your QMS.
            {' '}PDF, PNG, JPG or WEBP. Drag & drop or click.
          </p>
        </button>

        {/* Error */}
        {runStatus === 'error' && error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            <X className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Assessment list */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground/60 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading assessments…
        </div>
      ) : assessments.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Assessments
          </p>
          <div className="flex flex-col gap-2">
            {assessments.map((a) => {
              const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.ingesting
              const isLive = cfg.pulse
              return (
                <Link
                  key={a.id}
                  href={`/apps/iso-ready/assessments/${a.id}/report`}
                  className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm flex items-center gap-4 transition-all duration-150 group hover:border-muted-foreground/30 hover:bg-muted/40 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-medium text-foreground truncate">
                        {a.client_name}
                      </p>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isLive ? 'animate-pulse' : ''}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(a.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        {a.standards.map((stdId) => {
                          const std = STANDARDS.find((s) => s.id === stdId)
                          return std
                            ? <span key={stdId} className={`font-medium ${std.color}`}>{std.short}</span>
                            : null
                        })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-5 py-14 flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">No assessments yet</p>
          <p className="text-xs text-muted-foreground/60">Upload a document above to run your first gap analysis</p>
        </div>
      )}
    </div>
  )
}
