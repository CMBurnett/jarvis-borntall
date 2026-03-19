"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  ArrowLeft,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Circle,
  Clock,
  Play,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type {
  Assessment,
  Standard,
  StandardResult,
  ClauseResult,
  EvidenceItem,
} from "./types";
import {
  DEMO_ASSESSMENTS,
  AVAILABLE_STANDARDS,
  STANDARD_LABELS,
} from "./demo-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function statusDot(status: "conforming" | "partial" | "gap") {
  if (status === "conforming") return "bg-emerald-500";
  if (status === "partial") return "bg-amber-500";
  return "bg-red-500";
}

function priorityBadge(priority: "P1" | "P2" | "P3" | null) {
  if (!priority) return null;
  const styles = {
    P1: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800",
    P2: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
    P3: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800",
  };
  const labels = {
    P1: "P1 — Must fix",
    P2: "P2 — Should fix",
    P3: "P3 — Nice to fix",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
}

function statusBadge(status: "conforming" | "partial" | "gap") {
  const styles = {
    conforming: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
    partial: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
    gap: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800",
  };
  const labels = { conforming: "Conforming", partial: "Partial", gap: "Gap" };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function evidenceIcon(status: EvidenceItem["status"]) {
  if (status === "found")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  if (status === "partial")
    return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <X className="h-3.5 w-3.5 text-red-500 shrink-0" />;
}

function evidenceLabel(status: EvidenceItem["status"]) {
  if (status === "found") return "found";
  if (status === "partial") return "partial";
  return "not found";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Page Header ───────────────────────────────────────────────────────────────

function PageHeader({
  onBack,
  backHref,
  title,
  subtitle,
  action,
}: {
  onBack?: () => void;
  backHref?: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
        {onBack && !backHref && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Assessment List View ──────────────────────────────────────────────────────

function AssessmentList({
  assessments,
  onRun,
  onSelect,
}: {
  assessments: Assessment[];
  onRun: (standards: Standard[], docs: string[]) => void;
  onSelect: (a: Assessment) => void;
}) {
  const [selected, setSelected] = useState<Standard[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleStandard(s: Standard) {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setFiles((prev) => [...prev, ...names.filter((n) => !prev.includes(n))]);
    }
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f !== name));
  }

  const canRun = selected.length > 0 && files.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <PageHeader
        backHref="/apps"
        title="ISOReady"
        subtitle="ISO assessment and gap analysis"
      />

      {/* New assessment form */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        {/* Title + Run button row */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Create New Assessment</p>
          <Button
            size="sm"
            disabled={!canRun}
            onClick={() => onRun(selected, files)}
          >
            <Play className="h-3.5 w-3.5" data-icon="inline-start" />
            Run Assessment
          </Button>
        </div>

        {/* Standards grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {AVAILABLE_STANDARDS.map((s) => {
            const checked = selected.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleStandard(s)}
                className={`flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all duration-150 ${
                  checked
                    ? "border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
                    : "border-transparent bg-muted/40 hover:bg-muted/70 active:bg-muted dark:bg-muted/20 dark:hover:bg-muted/30"
                }`}
              >
                <div
                  className={`flex items-center justify-center h-4.5 w-4.5 rounded transition-all duration-150 ${
                    checked
                      ? "bg-blue-600 text-white dark:bg-blue-500"
                      : "border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-800"
                  }`}
                >
                  {checked && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {STANDARD_LABELS[s].short}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{s}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Upload area */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.txt"
            onChange={handleFiles}
            className="hidden"
          />

          {files.length === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-lg py-5 flex flex-col items-center gap-1.5 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <Upload className="h-5 w-5" />
              <p className="text-sm font-medium">Upload documents</p>
              <p className="text-[10px]">PDF, Excel, Word, CSV, TXT</p>
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {files.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-muted/60 text-xs text-foreground group/file"
                  >
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-48">{f}</span>
                    <button
                      onClick={() => removeFile(f)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add more files
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assessment history */}
      {assessments.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Previous Assessments
          </p>
          <div className="flex flex-col gap-2">
            {assessments.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect(a)}
                className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm flex items-center gap-4 transition-all duration-150 text-left w-full group hover:border-muted-foreground/30 hover:bg-muted/40 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.name}
                    </p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {a.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(a.date)}
                    </span>
                    <span>{a.documents.length} documents</span>
                    <span className="flex items-center gap-1.5">
                      {a.standards.map((s) => (
                        <span
                          key={s}
                          className={`font-medium ${STANDARD_LABELS[s].color}`}
                        >
                          {STANDARD_LABELS[s].short}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>

                {/* Score summary */}
                <div className="flex items-center gap-4 shrink-0">
                  {a.results.map((r) => (
                    <div key={r.standard} className="text-center">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {STANDARD_LABELS[r.standard].short}
                      </p>
                      <p
                        className={`text-lg font-semibold tabular-nums ${scoreColor(r.score)}`}
                      >
                        {r.score}%
                      </p>
                    </div>
                  ))}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Clause Detail Row ─────────────────────────────────────────────────────────

function ClauseRow({ clause }: { clause: ClauseResult }) {
  return (
    <AccordionItem value={`${clause.standard}-${clause.id}`} className="border-b border-border/50">
      <AccordionTrigger className="hover:no-underline px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot(clause.status)}`} />
          <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
            {clause.id}
          </span>
          <span className="text-sm text-foreground truncate flex-1">
            {clause.title}
          </span>
          {priorityBadge(clause.priority)}
          {statusBadge(clause.status)}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-4 pb-4 pt-1 ml-8 space-y-4">
          {/* Evidence checklist */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Evidence Checklist
            </p>
            <div className="space-y-1.5">
              {clause.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  {evidenceIcon(e.status)}
                  <span className="text-sm text-foreground">{e.name}</span>
                  <span className="text-xs text-muted-foreground">
                    — {evidenceLabel(e.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Gap + Action */}
          {clause.gap && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Gap
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {clause.gap}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Action Required
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {clause.actionRequired}
                </p>
              </div>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Standard Accordion Section ────────────────────────────────────────────────

function StandardSection({ result }: { result: StandardResult }) {
  const label = STANDARD_LABELS[result.standard];

  return (
    <AccordionItem value={result.standard} className="border-none">
      <AccordionTrigger className="hover:no-underline rounded-xl border border-border bg-card px-5 py-4 shadow-sm data-panel-open:rounded-b-none data-panel-open:border-b-0">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-base font-semibold ${label.color}`}>
                {label.short}
              </p>
              <span className="text-xs text-muted-foreground">
                {result.standard}
              </span>
            </div>
            {/* Score bar */}
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${scoreBarColor(result.score)}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <span
                className={`text-lg font-semibold tabular-nums ${scoreColor(result.score)}`}
              >
                {result.score}%
              </span>
            </div>
            {/* Summary counts */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                {result.conforming} Conforming
              </span>
              <span className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                {result.partial} Partial
              </span>
              <span className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                {result.gaps} Gap
              </span>
              <span className="text-muted-foreground/60">
                {result.totalClauses} clauses
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="rounded-b-xl border border-t-0 border-border bg-card shadow-sm overflow-hidden">
          {result.clauses.length > 0 ? (
            <Accordion>
              {result.clauses.map((clause) => (
                <ClauseRow key={`${clause.standard}-${clause.id}`} clause={clause} />
              ))}
            </Accordion>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Detailed clause data not available for this assessment.
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Assessment Detail View ────────────────────────────────────────────────────

function AssessmentDetail({
  assessment,
  onBack,
}: {
  assessment: Assessment;
  onBack: () => void;
}) {
  const avgScore =
    assessment.results.length > 0
      ? Math.round(
          assessment.results.reduce((s, r) => s + r.score, 0) /
            assessment.results.length
        )
      : 0;
  const totalClauses = assessment.results.reduce(
    (s, r) => s + r.totalClauses,
    0
  );
  const totalConforming = assessment.results.reduce(
    (s, r) => s + r.conforming,
    0
  );
  const totalPartial = assessment.results.reduce(
    (s, r) => s + r.partial,
    0
  );
  const totalGaps = assessment.results.reduce((s, r) => s + r.gaps, 0);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <PageHeader
        onBack={onBack}
        title={assessment.name}
        subtitle={`${formatDate(assessment.date)} · ${totalClauses} clauses assessed · ${assessment.standards.map((s) => STANDARD_LABELS[s].short).join(" + ")}`}
      />

      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-3">
        {assessment.results.map((r) => (
          <Card key={r.standard} size="sm">
            <CardContent className="pt-0">
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${STANDARD_LABELS[r.standard].color}`}
              >
                {STANDARD_LABELS[r.standard].short}
              </p>
              <p
                className={`text-3xl font-semibold mt-1 tabular-nums ${scoreColor(r.score)}`}
              >
                {r.score}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {r.totalClauses} clauses
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">
            Overall Readiness
          </p>
          <span
            className={`text-sm font-semibold tabular-nums ${scoreColor(avgScore)}`}
          >
            {avgScore}%
          </span>
        </div>
        {/* Stacked bar */}
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{
              width: `${(totalConforming / totalClauses) * 100}%`,
            }}
          />
          <div
            className="h-full bg-amber-500 transition-all"
            style={{
              width: `${(totalPartial / totalClauses) * 100}%`,
            }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{
              width: `${(totalGaps / totalClauses) * 100}%`,
            }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
            {totalConforming} Conforming
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
            {totalPartial} Partial
          </span>
          <span className="flex items-center gap-1.5">
            <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
            {totalGaps} Gap
          </span>
        </div>
      </div>

      {/* Documents assessed */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Documents Assessed ({assessment.documents.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {assessment.documents.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
            >
              <FileText className="h-3 w-3" />
              {d}
            </span>
          ))}
        </div>
      </div>

      <Separator />

      {/* Standard results as accordions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Results by Standard
        </p>
        <Accordion className="space-y-3">
          {assessment.results.map((r) => (
            <StandardSection key={r.standard} result={r} />
          ))}
        </Accordion>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type View =
  | { type: "list" }
  | { type: "detail"; assessment: Assessment };

export default function ISOReadyPage() {
  const [view, setView] = useState<View>({ type: "list" });

  function handleRunAssessment(standards: Standard[], docs: string[]) {
    // In a real app this would kick off an AI assessment.
    // For demo, navigate to the latest assessment detail.
    const latest = DEMO_ASSESSMENTS[0];
    setView({ type: "detail", assessment: latest });
  }

  if (view.type === "detail") {
    return (
      <AssessmentDetail
        assessment={view.assessment}
        onBack={() => setView({ type: "list" })}
      />
    );
  }

  return (
    <AssessmentList
      assessments={DEMO_ASSESSMENTS}
      onRun={handleRunAssessment}
      onSelect={(a) => setView({ type: "detail", assessment: a })}
    />
  );
}
