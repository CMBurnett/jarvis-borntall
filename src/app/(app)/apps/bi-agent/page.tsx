import { BarChart3, TrendingUp, TrendingDown, Database, ArrowUp } from "lucide-react";

const METRICS = [
  { label: "Revenue MTD",    value: "$284k",  delta: "+12%",  up: true },
  { label: "Orders Shipped", value: "1,042",  delta: "+8%",   up: true },
  { label: "Avg Order Value", value: "$2,730", delta: "-3%",  up: false },
  { label: "Outstanding",    value: "$47k",   delta: "+21%",  up: false },
];

const QUERIES = [
  { q: "How many times did we sell to Pelseal Ltd last year?", a: "32 orders · $94,200 total · last order 14 Feb" },
  { q: "Top 5 products by margin this month?", a: "PL-220, PL-440, HX-100, FX-900, GX-12 — avg 38% margin" },
  { q: "Which customers haven't ordered in 90+ days?", a: "11 customers identified — report ready to export" },
];

export default function BIAgentPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">Business Intelligence</h1>
            <p className="text-xs text-muted-foreground">Sage 100 · Access DB · Natural language queries</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="h-3.5 w-3.5" />
          Last synced 4 min ago
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map(({ label, value, delta, up }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold text-foreground mt-1.5 tabular-nums">{value}</p>
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? "text-emerald-600" : "text-destructive"}`}>
              {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-4">Revenue — Last 12 Months</p>
        <div className="flex items-end gap-2 h-28">
          {[62, 55, 71, 68, 80, 74, 82, 78, 88, 84, 92, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-linear-to-t from-violet-500 to-purple-600 opacity-80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          {["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      {/* Recent queries */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Recent Queries</p>
        <div className="flex flex-col gap-2">
          {QUERIES.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground mb-1.5">"{q}"</p>
              <p className="text-sm font-medium text-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Query input */}
      <div className="rounded-xl border border-border bg-card shadow-sm flex items-center gap-3 px-4 py-3">
        <input readOnly placeholder="Ask a question about your data…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-linear-to-br from-violet-500 to-purple-600 text-white shrink-0">
          <ArrowUp className="h-3 w-3" />
          Ask
        </button>
      </div>
    </div>
  );
}
