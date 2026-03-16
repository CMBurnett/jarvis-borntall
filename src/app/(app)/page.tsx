import Link from "next/link";
import { isSupabaseConfigured, DEV_USER } from "@/lib/supabase/dev";
import { createClient } from "@/lib/supabase/server";
import { ChatBlock } from "@/components/chat/chat-block";
import {
  ShieldCheck,
  BarChart3,
  FileCheck2,
  TrendingUp,
  Users,
  Clock,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

const METRICS = [
  { label: "Active Apps", value: "3", sub: "of 3 deployed", Icon: Cpu },
  { label: "Platform Uptime", value: "99.9%", sub: "last 30 days", Icon: TrendingUp },
  { label: "Active Users", value: "12", sub: "+2 this week", Icon: Users },
  { label: "Avg. Response", value: "1.2s", sub: "model latency", Icon: Clock },
];

const APPS = [
  {
    id: "compliance-ready",
    name: "ISOReady",
    description:
      "ISO gap analysis, audit prep, and compliance tracking across standards and regulatory frameworks.",
    Icon: ShieldCheck,
    gradient: "from-blue-500 to-indigo-500",
    ringColor: "border-blue-500/20",
    status: "active" as const,
    stats: "ISO 9001 · 14 gaps open",
    lastUsed: "2 hours ago",
  },
  {
    id: "bi-agent",
    name: "Business Intelligence Agent",
    description:
      "Ask plain-English questions and get instant answers from your Sage 100 and Access database. No reports, no SQL, no waiting. \u201cHow many times did we sell to this customer last year?\u201d \u2014 answered in seconds.",
    Icon: BarChart3,
    gradient: "from-violet-500 to-purple-600",
    ringColor: "border-violet-500/20",
    status: "active" as const,
    stats: "Sage 100 · Access DB",
    lastUsed: "1 hour ago",
  },
  {
    id: "order-processing",
    name: "Order Processing Agent",
    description:
      "Automates the order-to-invoice pipeline end to end. Orders arriving by email are parsed, matched against your product catalog and pricing, and drafted into invoices — with your team reviewing only the exceptions.",
    Icon: FileCheck2,
    gradient: "from-teal-500 to-cyan-500",
    ringColor: "border-teal-500/20",
    status: "active" as const,
    stats: "Sage 100 · Email integration",
    lastUsed: "32 min ago",
  },
];

export default async function HomePage() {
  let name = "there";

  if (!isSupabaseConfigured()) {
    const fullName = DEV_USER.user_metadata?.full_name as string | undefined;
    name = fullName?.split(" ")[0] ?? "Dev";
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fullName = user?.user_metadata?.full_name as string | undefined;
    name =
      fullName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  }

  const greeting = getGreeting();
  const dateStr = formatDate(new Date());

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
          <h1 className="text-2xl font-semibold text-foreground mt-0.5">
            {greeting}, {name}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          All systems operational
        </div>
      </div>

      {/* Chat */}
      <ChatBlock />

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {METRICS.map(({ label, value, sub, Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-card shadow-sm p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
                <p className="text-2xl font-semibold text-foreground mt-1.5 tabular-nums">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Apps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Apps
          </p>
          <Link
            href="/apps"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {APPS.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-5 flex-1">
                {/* Icon + name row */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative shrink-0">
                    <div
                      className={`h-11 w-11 rounded-xl bg-linear-to-br ${app.gradient} flex items-center justify-center shadow-md`}
                    >
                      <app.Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                    </div>
                    <div
                      className={`absolute -inset-0.75 rounded-[15px] border ${app.ringColor} pointer-events-none`}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground leading-tight">
                        {app.name}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </div>

                {/* Stats line */}
                <p className="text-xs text-muted-foreground tabular-nums">
                  {app.stats}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-border/60 px-5 py-3 bg-muted/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Used {app.lastUsed}
                </span>
                <Link
                  href={`/apps/${app.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "beta" | "inactive" }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  if (status === "beta") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
        Beta
      </span>
    );
  }
  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
