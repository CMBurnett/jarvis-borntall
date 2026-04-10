"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ShieldCheck,
  BarChart3,
  FileCheck2,
  ArrowUpRight,
  Send,
} from "lucide-react";
import { PRESET_DEFINITIONS } from "@reporting/lib/presets";

// ── Types (exported so page.tsx can import them) ──────────────────────────────

export type ISOSummary = {
  id: string;
  client_name: string;
  status: string;
  standards: string[];
  created_at: string;
  gaps: number;
  partial: number;
  evidenced: number;
} | null;

export type OrderSummary = {
  pendingReview: number;
  approvedToday: number;
  recentOrders: {
    id: string;
    customer_name: string | null;
    po_number: string | null;
    status: string;
    received_at: string;
  }[];
};

export type ReportingSummary = {
  savedDashboards: {
    id: string;
    name: string;
    source: string;
    preset_slug: string | null;
    created_at: string;
  }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CardHeader({
  gradient,
  icon: Icon,
  title,
  href,
}: Readonly<{
  gradient: string;
  icon: React.ElementType;
  title: string;
  href: string;
}>) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div
          className={`h-7 w-7 rounded-lg bg-linear-to-br ${gradient} flex items-center justify-center shrink-0`}
        >
          <Icon className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Open <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function KPIChip({
  label,
  value,
  color = "text-foreground",
}: Readonly<{
  label: string;
  value: number;
  color?: string;
}>) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ISOStatusBadge({ status }: Readonly<{ status: string }>) {
  const map: Record<string, { label: string; cls: string }> = {
    complete:   { label: "Complete",   cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    processing: { label: "Processing", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    ingesting:  { label: "Ingesting",  cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function OrderStatusBadge({ status }: Readonly<{ status: string }>) {
  const map: Record<string, { label: string; cls: string }> = {
    pending_review:     { label: "Review",   cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    pending_extraction: { label: "Parsing",  cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    approved:           { label: "Approved", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    rejected:           { label: "Rejected", cls: "bg-rose-500/10 text-rose-500" },
    exported:           { label: "Exported", cls: "bg-muted text-muted-foreground" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HomeContent({
  name,
  isoSummary,
  orderSummary,
  reportingSummary,
}: Readonly<{
  name: string;
  isoSummary: ISOSummary;
  orderSummary: OrderSummary;
  reportingSummary: ReportingSummary;
}>) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [reportPrompt, setReportPrompt] = useState("");

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
    setDateStr(formatDate(new Date()));
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateStr(formatDate(new Date()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const pelsealLogo = resolvedTheme === "dark" ? "/pelseal-home-white.svg" : "/pelseal-home-color.svg";
  const jarvisLogo  = resolvedTheme === "dark" ? "/jarvis-white.svg"       : "/jarvis-black.svg";

  function handleBuildReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reportPrompt.trim()) return;
    router.push(`/apps/reporting?prompt=${encodeURIComponent(reportPrompt.trim())}`);
  }

return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">{mounted ? dateStr : "\u00A0"}</p>
          <h1 className="text-2xl font-semibold text-foreground mt-0.5">
            {mounted ? `${greeting}, Gary` : "\u00A0"}
          </h1>
        </div>
        {mounted && (
          <div className="flex items-center gap-3">
            <Image src={pelsealLogo} alt="Pelseal" width={120} height={32} className="h-8 w-auto" priority />
            <Image src={jarvisLogo}  alt="Jarvis"  width={80}  height={24} className="h-5 w-auto opacity-50" priority />
          </div>
        )}
      </div>

      {/* 2-column content */}
      <div className="grid grid-cols-2 gap-4 items-start">
        {/* Left column — ISO + Orders */}
        <div className="flex flex-col gap-4">
          {/* ISO Ready */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-4">
            <CardHeader
              gradient="from-blue-500 to-indigo-500"
              icon={ShieldCheck}
              title="ISO Ready"
              href="/apps/iso-ready"
            />

            {isoSummary ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{isoSummary.client_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isoSummary.standards.map((s) => s.toUpperCase()).join(" · ")}
                      {" · "}
                      {timeAgo(isoSummary.created_at)}
                    </p>
                  </div>
                  <ISOStatusBadge status={isoSummary.status} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <KPIChip label="Gaps"      value={isoSummary.gaps}      color="text-rose-500" />
                  <KPIChip label="Partial"   value={isoSummary.partial}   color="text-amber-500" />
                  <KPIChip label="Evidenced" value={isoSummary.evidenced} color="text-emerald-500" />
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No assessments yet.</p>
            )}
          </div>

          {/* Order Processing */}
          <div className="rounded-xl border border-border bg-card shadow-sm p-4">
            <CardHeader
              gradient="from-teal-500 to-cyan-500"
              icon={FileCheck2}
              title="Order Processing"
              href="/apps/order-processing"
            />

            <div className="grid grid-cols-2 gap-2 mb-4">
              <KPIChip label="Pending Review" value={orderSummary.pendingReview} color="text-amber-500" />
              <KPIChip label="Approved Today" value={orderSummary.approvedToday} color="text-emerald-500" />
            </div>

            {orderSummary.recentOrders.length > 0 ? (
              <div className="space-y-1">
                {orderSummary.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/apps/order-processing/orders/${order.id}`}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {order.customer_name ?? "Unknown customer"}
                        {order.po_number ? ` - PO ${order.po_number}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {timeAgo(order.received_at)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No recent orders.</p>
            )}
          </div>
        </div>

        {/* Right column — Reporting */}
        <div>
          <div className="rounded-xl border border-border bg-card shadow-sm p-4">
            <CardHeader
              gradient="from-emerald-500 to-teal-500"
              icon={BarChart3}
              title="Reporting"
              href="/apps/reporting"
            />

            {/* NL prompt */}
            <form onSubmit={handleBuildReport} className="mb-5">
              <textarea
                value={reportPrompt}
                onChange={(e) => setReportPrompt(e.target.value)}
                placeholder={'Describe the report you want — e.g. "Show me which customers had declining revenue last quarter"'}
                rows={3}
                className="w-full text-sm rounded-lg border border-border bg-muted/40 px-3 py-2 resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              />
              <button
                type="submit"
                disabled={!reportPrompt.trim()}
                className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3 w-3" />
                Build Report
              </button>
            </form>

            {/* Dashboards list — presets first, then custom */}
            <div className="border-t border-border pt-4 space-y-4">
              {/* Presets — 2-col grid */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Presets
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_DEFINITIONS.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/apps/reporting/${p.slug}`}
                      className="group flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/70 hover:border-border/80 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground leading-tight">{p.title}</span>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                        {p.description.split("—")[0].trim()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Custom reports */}
              {reportingSummary.savedDashboards.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Custom Reports
                  </p>
                  <div className="space-y-1">
                    {reportingSummary.savedDashboards.map((d) => (
                      <Link
                        key={d.id}
                        href={`/apps/reporting/${d.id}`}
                        className="group flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:bg-muted/70 hover:border-border/80 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">{d.name}</span>
                        </div>
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
