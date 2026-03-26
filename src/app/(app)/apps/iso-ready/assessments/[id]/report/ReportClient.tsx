'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  X as XMark,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ClauseAssessment {
  id: string
  clause_id: string
  status: string
  evidence_summary: string | null
  gap_description: string | null
  action_item: string | null
  priority: number | null
  interview_questions: string[] | null
  evidence_checks: Record<string, boolean> | null
  iso_clauses: {
    standard: string
    section: string | null
    title: string | null
    evidence_types: string[] | null
  } | null
}

interface Assessment {
  id: string
  client_name: string
  status: string
  standards: string[]
  created_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STANDARD_LABELS: Record<string, string> = {
  as9100: 'AS9100 Rev D',
  iso9001: 'ISO 9001:2015',
  iso14001: 'ISO 14001:2015',
  iso45001: 'ISO 45001:2018',
}

const STANDARD_SHORT: Record<string, string> = {
  as9100: 'AS9100',
  iso9001: 'ISO 9001',
  iso14001: 'ISO 14001',
  iso45001: 'ISO 45001',
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'P1 — Must fix', color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20' },
  2: { label: 'P2 — Should fix', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  3: { label: 'P3 — Minor', color: 'text-muted-foreground bg-muted/50 border-border' },
}

const STATUS_CONFIG = {
  evidenced: { label: 'Evidenced', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  partial: { label: 'Partial', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20' },
  gap: { label: 'Gap', dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400', badge: 'text-red-700 dark:text-red-300 bg-red-500/10 border-red-500/20' },
} as const

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  evidenced: CheckCircle2,
  partial: AlertTriangle,
  gap: XCircle,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function normalizeStatus(raw: string): 'evidenced' | 'partial' | 'gap' {
  const lower = raw.toLowerCase().replace(/[-_\s]+/g, '')
  if (lower.includes('evidenced') || lower.includes('compliant') || lower.includes('conform')) return 'evidenced'
  if (lower.includes('partial')) return 'partial'
  return 'gap'
}

function parseClauseSection(clauseId: string): string {
  // e.g. "as9100-6.3" → "6", "iso9001-10.2.2" → "10"
  const match = clauseId.match(/-(\d+)/)
  return match?.[1] ?? '?'
}

function parseClauseNumber(clauseId: string): string {
  // e.g. "as9100-6.3" → "6.3", "iso9001-10.2.2" → "10.2.2"
  const match = clauseId.match(/-([\d.]+)/)
  return match?.[1] ?? clauseId
}

function formatEvidenceType(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ReportClient({ assessmentId }: { assessmentId: string }) {
  const supabase = createClient()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [clauses, setClauses] = useState<ClauseAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStandard, setFilterStandard] = useState<string>('all')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const clauseSelect = 'id, clause_id, status, evidence_summary, gap_description, action_item, priority, interview_questions, evidence_checks, iso_clauses(standard, section, title, evidence_types)'

  useEffect(() => {
    async function load() {
      const [aResult, cResult] = await Promise.all([
        supabase.from('assessments').select('*').eq('id', assessmentId).single(),
        supabase
          .from('clause_assessments')
          .select(clauseSelect)
          .eq('assessment_id', assessmentId)
          .order('clause_id'),
      ])
      if (aResult.data) setAssessment(aResult.data)
      if (cResult.data) setClauses(cResult.data as ClauseAssessment[])
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId])

  // Poll while assessment is still processing
  useEffect(() => {
    if (!assessment || (assessment.status !== 'ingesting' && assessment.status !== 'analysing')) return
    const interval = setInterval(async () => {
      const [aResult, cResult] = await Promise.all([
        supabase.from('assessments').select('*').eq('id', assessmentId).single(),
        supabase
          .from('clause_assessments')
          .select(clauseSelect)
          .eq('assessment_id', assessmentId)
          .order('clause_id'),
      ])
      if (aResult.data) setAssessment(aResult.data)
      if (cResult.data) setClauses(cResult.data as ClauseAssessment[])
    }, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.status])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading report...
      </div>
    )
  }

  if (!assessment) {
    return <div className="py-20 text-center text-muted-foreground">Assessment not found</div>
  }

  const isProcessing = assessment.status === 'ingesting' || assessment.status === 'analysing'

  // ── Compute stats ──────────────────────────────────────────────────────────

  const normalizedClauses = clauses.map((c) => ({
    ...c,
    _status: normalizeStatus(c.status),
    _standard: c.iso_clauses?.standard ?? clauseIdToStandard(c.clause_id),
    _section: c.iso_clauses?.section ?? parseClauseSection(c.clause_id),
    _title: c.iso_clauses?.title ?? '',
    _number: parseClauseNumber(c.clause_id),
  }))

  const totalCounts = { evidenced: 0, partial: 0, gap: 0 }
  const perStandard: Record<string, { evidenced: number; partial: number; gap: number; total: number }> = {}

  for (const c of normalizedClauses) {
    totalCounts[c._status]++
    if (!perStandard[c._standard]) perStandard[c._standard] = { evidenced: 0, partial: 0, gap: 0, total: 0 }
    perStandard[c._standard][c._status]++
    perStandard[c._standard].total++
  }

  // Available sections for filter
  const sections = [...new Set(normalizedClauses.map((c) => c._section))].sort((a, b) => Number(a) - Number(b))
  const standards = Object.keys(perStandard).sort()

  // Filter
  const filtered = normalizedClauses.filter((c) => {
    if (filterStandard !== 'all' && c._standard !== filterStandard) return false
    if (filterSection !== 'all' && c._section !== filterSection) return false
    if (filterStatus !== 'all' && c._status !== filterStatus) return false
    return true
  })

  // Sort: gaps first (P1 first), then partial, then evidenced
  const statusOrder = { gap: 0, partial: 1, evidenced: 2 }
  const sorted = [...filtered].sort((a, b) => {
    const sd = statusOrder[a._status] - statusOrder[b._status]
    if (sd !== 0) return sd
    return (a.priority ?? 3) - (b.priority ?? 3)
  })

  const totalAssessed = clauses.length

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 pt-1">
        <Link
          href="/apps/iso-ready"
          className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors shrink-0 mt-1"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Gap Analysis Report</p>
          <h1 className="text-xl font-semibold text-foreground leading-tight truncate">{assessment.client_name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(assessment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}&middot; {totalAssessed} clauses assessed
            {' '}&middot; {assessment.standards.map((s) => STANDARD_LABELS[s] ?? s.toUpperCase()).join(' + ')}
          </p>
        </div>
      </div>

      {/* Processing banner */}
      {isProcessing && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-sm text-blue-700 dark:text-blue-300">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          Assessment in progress — {clauses.length} clause{clauses.length !== 1 ? 's' : ''} assessed so far. Updates every 5s.
        </div>
      )}

      {/* Per-standard score cards */}
      {standards.length > 0 && (
        <div className={`grid gap-3 ${standards.length === 1 ? 'grid-cols-1' : standards.length === 2 ? 'grid-cols-2' : standards.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {standards.map((std) => {
            const s = perStandard[std]
            const pct = s.total > 0 ? Math.round((s.evidenced / s.total) * 100) : 0
            return (
              <button
                key={std}
                onClick={() => setFilterStandard(filterStandard === std ? 'all' : std)}
                className={`rounded-xl border p-4 text-center transition-colors cursor-pointer ${
                  filterStandard === std
                    ? 'border-foreground/30 bg-muted/50'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {STANDARD_LABELS[std] ?? std.toUpperCase()}
                </p>
                <p className="text-3xl font-bold text-foreground tabular-nums">{pct}%</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.total} clauses</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Status summary pills */}
      {totalAssessed > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {(['evidenced', 'partial', 'gap'] as const).map((s) => {
            const cfg = STATUS_CONFIG[s]
            const count = totalCounts[s]
            const active = filterStatus === s
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(active ? 'all' : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  active ? cfg.badge : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                {count} {cfg.label}
              </button>
            )
          })}
          <span className="text-xs text-muted-foreground ml-1 tabular-nums">{totalAssessed} total</span>
        </div>
      )}

      {/* Section filter */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">&sect;</span>
          <button
            onClick={() => setFilterSection('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              filterSection === 'all' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSection(filterSection === s ? 'all' : s)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterSection === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Clause list */}
      {sorted.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {sorted.map((c) => {
            const cfg = STATUS_CONFIG[c._status]
            const Icon = STATUS_ICON[c._status] ?? XCircle
            const pri = PRIORITY_LABELS[c.priority ?? 2]
            const isOpen = expandedId === c.id
            const evidenceChecks = c.evidence_checks as Record<string, boolean> | null
            const evidenceTypes = c.iso_clauses?.evidence_types

            return (
              <div key={c.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : c.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className="text-sm font-mono font-semibold text-foreground shrink-0 w-14 tabular-nums">
                    {c._number}
                  </span>
                  <span className="text-sm text-foreground flex-1 min-w-0 truncate">
                    {c._title}
                  </span>
                  {/* Standard badge */}
                  {standards.length > 1 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-border text-muted-foreground shrink-0">
                      {STANDARD_SHORT[c._standard] ?? c._standard.toUpperCase()}
                    </span>
                  )}
                  {/* Priority badge (gaps and partials only) */}
                  {c._status !== 'evidenced' && pri && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${pri.color}`}>
                      {pri.label}
                    </span>
                  )}
                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-border px-4 py-4 space-y-4 text-sm">
                    {/* Evidence checklist */}
                    {(evidenceChecks || evidenceTypes) && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                          Evidence Checklist
                        </p>
                        <div className="space-y-1.5">
                          {evidenceChecks ? (
                            Object.entries(evidenceChecks).map(([key, found]) => (
                              <div key={key} className="flex items-start gap-2">
                                {found ? (
                                  <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <XMark className="h-3.5 w-3.5 mt-0.5 text-red-500 shrink-0" />
                                )}
                                <span className={`text-sm ${found ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {formatEvidenceType(key)}
                                  {!found && <span className="text-muted-foreground/60 ml-1.5">— not found</span>}
                                </span>
                              </div>
                            ))
                          ) : evidenceTypes ? (
                            evidenceTypes.map((et) => (
                              <div key={et} className="flex items-start gap-2">
                                <XMark className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/40 shrink-0" />
                                <span className="text-sm text-muted-foreground">
                                  {formatEvidenceType(et)}
                                  <span className="text-muted-foreground/60 ml-1.5">— not assessed</span>
                                </span>
                              </div>
                            ))
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* Evidence summary */}
                    {c.evidence_summary && c.evidence_summary !== 'Unable to parse LLM assessment response' && c.evidence_summary !== 'Assessment failed due to error' && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Evidence</p>
                        <p className="text-foreground leading-relaxed">{c.evidence_summary}</p>
                      </div>
                    )}

                    {/* Gap + Action side by side for non-evidenced */}
                    {c._status !== 'evidenced' && (c.gap_description || c.action_item) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {c.gap_description && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Gap</p>
                            <p className="text-foreground leading-relaxed">{c.gap_description}</p>
                          </div>
                        )}
                        {c.action_item && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Action Required</p>
                            <p className="text-foreground leading-relaxed">{c.action_item}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interview questions */}
                    {c.interview_questions && c.interview_questions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Interview Questions</p>
                        <ul className="space-y-1">
                          {c.interview_questions.map((q, i) => (
                            <li key={i} className="text-foreground leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:h-1 before:w-1 before:rounded-full before:bg-muted-foreground/40">
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : !isProcessing ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-5 py-14 flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">
            {clauses.length > 0 ? 'No clauses match the current filters' : 'No clause assessments yet'}
          </p>
        </div>
      ) : null}

      {/* Filtered count */}
      {(filterStandard !== 'all' || filterSection !== 'all' || filterStatus !== 'all') && sorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {sorted.length} of {totalAssessed} clauses
          <button onClick={() => { setFilterStandard('all'); setFilterSection('all'); setFilterStatus('all') }} className="ml-2 underline hover:text-foreground transition-colors cursor-pointer">
            Clear filters
          </button>
        </p>
      )}
    </div>
  )
}

// ── Utilities ────────────────────────────────────────────────────────────────

function clauseIdToStandard(clauseId: string): string {
  // e.g. "as9100-6.3" → "as9100", "iso9001-10.2.2" → "iso9001"
  const match = clauseId.match(/^([a-z]+\d+)/)
  return match?.[1] ?? 'unknown'
}
