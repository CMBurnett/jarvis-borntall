import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, ArrowUpRight } from "lucide-react";

const GAPS = [
  { id: "G-041", standard: "ISO 9001", clause: "8.5.1", title: "Process control documentation incomplete", severity: "critical", due: "Mar 22" },
  { id: "G-038", standard: "ISO 9001", clause: "9.1.2", title: "Customer satisfaction survey not conducted Q1", severity: "high", due: "Mar 28" },
  { id: "G-035", standard: "ISO 14001", clause: "6.1.1", title: "Environmental risk register out of date", severity: "high", due: "Apr 1" },
  { id: "G-029", standard: "ISO 9001", clause: "7.2",   title: "3 operators missing competency records", severity: "medium", due: "Apr 5" },
  { id: "G-027", standard: "ISO 14001", clause: "8.1",  title: "Chemical storage procedure not reviewed", severity: "medium", due: "Apr 10" },
];

const METRICS = [
  { label: "Open Gaps",     value: "14",  sub: "3 critical",        color: "text-destructive" },
  { label: "Closed MTD",    value: "8",   sub: "vs 6 last month",   color: "text-emerald-600" },
  { label: "Next Audit",    value: "17d", sub: "April 2nd",         color: "text-amber-600" },
  { label: "Readiness",     value: "73%", sub: "↑4% this week",     color: "text-foreground" },
];

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  high:     "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  medium:   "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
};

export default function ISOReadyPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">ISOReady</h1>
            <p className="text-xs text-muted-foreground">ISO 9001 · ISO 14001 · Audit prep</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Connected
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`text-2xl font-semibold mt-1.5 tabular-nums ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Audit readiness bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground">Audit Readiness Score</p>
          <span className="text-sm font-semibold text-foreground">73%</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-500" style={{ width: "73%" }} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 31 requirements met</span>
          <span className="flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> 14 gaps remaining</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Audit in 17 days</span>
        </div>
      </div>

      {/* Gap list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Open Gaps</p>
        <div className="flex flex-col gap-2">
          {GAPS.map((gap) => (
            <div key={gap.id} className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">{gap.id}</span>
              <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{gap.standard} §{gap.clause}</span>
              <p className="text-sm text-foreground flex-1 min-w-0 truncate">{gap.title}</p>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${SEVERITY_STYLES[gap.severity]}`}>
                {gap.severity}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">{gap.due}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
