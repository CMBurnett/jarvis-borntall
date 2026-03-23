import Link from "next/link";
import {
  ShieldCheck,
  LayoutDashboard,
  FileCheck2,
  Truck,
  Wrench,
  ClipboardList,
  ArrowUpRight,
  Rocket,
} from "lucide-react";

const APPS = [
  {
    id: "iso-ready",
    name: "ISO Ready",
    description: "AI-powered ISO compliance gap analysis and audit readiness platform. Upload documents, assess clauses, and generate gap reports.",
    Icon: ShieldCheck,
    gradient: "from-blue-500 to-indigo-500",
    status: "active" as const,
    stats: "AS9100 · ISO 14001 · ISO 45001",
  },
  {
    id: "bi-agent",
    name: "BI Dashboard",
    description: "Real-time KPIs, revenue trends, and operational metrics pulled from Sage 100.",
    Icon: LayoutDashboard,
    gradient: "from-violet-500 to-purple-600",
    status: "active" as const,
    stats: "Revenue · Orders · Inventory",
  },
  {
    id: "order-processing",
    name: "Order Processing",
    description: "Email-to-invoice automation with exception review. Orders are parsed, matched, and drafted automatically.",
    Icon: FileCheck2,
    gradient: "from-teal-500 to-cyan-500",
    status: "active" as const,
    stats: "Sage 100 · Email",
  },
  {
    id: "shipping",
    name: "Shipping & Logistics",
    description: "Carrier management, shipment tracking, and delivery route optimization.",
    Icon: Truck,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
  {
    id: "maintenance",
    name: "Maintenance Tracker",
    description: "Equipment maintenance schedules, preventive work orders, and downtime logging.",
    Icon: Wrench,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
  {
    id: "quality",
    name: "Quality Control",
    description: "Inspection checklists, non-conformance reports, and CAPA workflow management.",
    Icon: ClipboardList,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
];

export default function AppsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 pt-1">
        <div className="h-9 w-9 rounded-xl bg-linear-to-br from-orange-500 to-rose-500 flex items-center justify-center shrink-0">
          <Rocket className="h-4 w-4 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Apps</h1>
          <p className="text-xs text-muted-foreground">All available tools and agents for your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {APPS.map((app) => {
          const isActive = app.status === "active";
          return isActive ? (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group rounded-xl border border-border bg-card hover:bg-muted/30 shadow-sm p-5 flex gap-4 transition-colors"
            >
              <AppCardContent app={app} />
            </Link>
          ) : (
            <div
              key={app.id}
              className="rounded-xl border border-border bg-muted/30 shadow-sm p-5 flex gap-4 opacity-60"
            >
              <AppCardContent app={app} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppCardContent({ app }: { app: (typeof APPS)[number] }) {
  const isActive = app.status === "active";
  return (
    <>
      <div
        className={`h-10 w-10 rounded-lg bg-linear-to-br ${app.gradient} flex items-center justify-center shrink-0`}
      >
        <app.Icon className="h-4.5 w-4.5 text-white" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{app.name}</span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
              Inactive
            </span>
          )}
          {isActive && (
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{app.description}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1.5">{app.stats}</p>
      </div>
    </>
  );
}
