import { FileCheck2, Mail, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";

const ORDERS = [
  { id: "ORD-2841", customer: "Pelseal Ltd",       items: 4, value: "$3,200", status: "approved",  received: "9:14am" },
  { id: "ORD-2840", customer: "Brennan Seals",     items: 2, value: "$780",   status: "review",    received: "8:52am" },
  { id: "ORD-2839", customer: "Anglo Nordic",      items: 7, value: "$6,100", status: "approved",  received: "8:31am" },
  { id: "ORD-2838", customer: "Euro Seals GmbH",   items: 1, value: "$220",   status: "exception", received: "7:55am" },
  { id: "ORD-2837", customer: "Precision Polymer", items: 3, value: "$1,890", status: "approved",  received: "7:40am" },
];

const METRICS = [
  { label: "Processed Today", value: "18",  sub: "avg 4 min each" },
  { label: "Awaiting Review", value: "3",   sub: "manual check needed" },
  { label: "Exceptions",      value: "1",   sub: "price mismatch" },
  { label: "Invoiced",        value: "$38k", sub: "today's total" },
];

const STATUS_STYLES: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
  approved:  { cls: "text-emerald-600", label: "Auto-approved", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  review:    { cls: "text-amber-600",   label: "Needs review",  icon: <Clock className="h-3.5 w-3.5" /> },
  exception: { cls: "text-destructive", label: "Exception",     icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

export default function OrderProcessingPage() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
            <FileCheck2 className="h-4 w-4 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">Order Processing</h1>
            <p className="text-xs text-muted-foreground">Sage 100 · Email integration · Auto-invoice</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          Watching inbox · last email 6 min ago
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {METRICS.map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold text-foreground mt-1.5 tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline visual */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm font-semibold text-foreground mb-4">Today&apos;s Pipeline</p>
        <div className="flex items-center gap-1">
          {[
            { label: "Email received", count: 22, color: "bg-muted" },
            { label: "Parsed",         count: 21, color: "bg-teal-200 dark:bg-teal-900/50" },
            { label: "Matched",        count: 19, color: "bg-teal-300 dark:bg-teal-800/60" },
            { label: "Auto-approved",  count: 18, color: "bg-linear-to-r from-teal-500 to-cyan-500" },
          ].map(({ label, count, color }, i) => (
            <div key={i} className="flex-1">
              <div className={`h-10 rounded-lg ${color} flex items-center justify-center`}>
                <span className="text-sm font-semibold text-foreground">{count}</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order list */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Today&apos;s Orders</p>
        <div className="flex flex-col gap-2">
          {ORDERS.map((order) => {
            const s = STATUS_STYLES[order.status];
            return (
              <div key={order.id} className="rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{order.id}</span>
                <p className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{order.customer}</p>
                <span className="text-xs text-muted-foreground">{order.items} items</span>
                <span className="text-sm font-semibold text-foreground w-16 text-right">{order.value}</span>
                <span className={`flex items-center gap-1 text-xs font-medium ${s.cls} w-32`}>
                  {s.icon} {s.label}
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">{order.received}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
