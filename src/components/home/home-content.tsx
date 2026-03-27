"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ChatBlock } from "@/components/chat/chat-block";
import {
  ShieldCheck,
  Gauge,
  FileCheck2,
  ArrowUpRight,
  Truck,
  Wrench,
  ClipboardList,
} from "lucide-react";

const APPS = [
  {
    id: "iso-ready",
    name: "ISOReady",
    description: "ISO gap analysis, audit prep, and compliance tracking.",
    Icon: ShieldCheck,
    gradient: "from-blue-500 to-indigo-500",
    status: "active" as const,
    stats: "ISO 9001 · 14 gaps open",
  },
  {
    id: "bi-agent",
    name: "BI Dashboard",
    description: "Real-time KPIs, revenue trends, and operational metrics.",
    Icon: Gauge,
    gradient: "from-violet-500 to-purple-600",
    status: "active" as const,
    stats: "Revenue · Orders · Inventory",
  },
  {
    id: "order-processing",
    name: "Order Processing",
    description: "Email-to-invoice automation with exception review.",
    Icon: FileCheck2,
    gradient: "from-teal-500 to-cyan-500",
    status: "active" as const,
    stats: "Sage 100 · Email",
  },
  {
    id: "shipping",
    name: "Shipping & Logistics",
    description: "Carrier management, tracking, and delivery optimization.",
    Icon: Truck,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
  {
    id: "maintenance",
    name: "Maintenance Tracker",
    description: "Equipment maintenance schedules and work order management.",
    Icon: Wrench,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
  {
    id: "quality",
    name: "Quality Control",
    description: "Inspection checklists, NCR tracking, and CAPA workflows.",
    Icon: ClipboardList,
    gradient: "from-gray-400 to-gray-500",
    status: "inactive" as const,
    stats: "Coming soon",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HomeContent({ name }: { name: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
    setDateStr(formatDate(new Date()));

    // Update every minute for live clock
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateStr(formatDate(new Date()));
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const pelsealLogo =
    resolvedTheme === "dark"
      ? "/pelseal-home-white.svg"
      : "/pelseal-home-color.svg";

  const jarvisLogo =
    resolvedTheme === "dark"
      ? "/jarvis-white.svg"
      : "/jarvis-black.svg";

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Title row */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">
            {mounted ? dateStr : "\u00A0"}
          </p>
          <h1 className="text-2xl font-semibold text-foreground mt-0.5">
            {mounted ? `${greeting}, Gary` : "\u00A0"}
          </h1>
        </div>
        <div className="flex items-center">
          {mounted && (
            <div className="flex items-center gap-3">
              <Image
                src={pelsealLogo}
                alt="Pelseal logo"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
              <span className="text-muted-foreground/50 text-2xl font-light">+</span>
              <Image
                src={jarvisLogo}
                alt="Jarvis logo"
                width={80}
                height={24}
                className="h-5 w-auto opacity-50"
                priority
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat — centered, own row */}
      <ChatBlock />

      {/* Apps — compact grid */}
      <div className="grid grid-cols-3 gap-3">
        {APPS.map((app) => {
          const isActive = app.status === "active";
          return isActive ? (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="group rounded-xl border border-border shadow-sm px-4 py-3 flex items-center gap-3 transition-colors bg-card/60 hover:bg-card cursor-pointer"
            >
              <div
                className={`h-9 w-9 rounded-lg bg-linear-to-br ${app.gradient} flex items-center justify-center shrink-0`}
              >
                <app.Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {app.name}
                  </span>
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
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {app.stats}
                </p>
              </div>
              {isActive && (
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Open App
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Link>
          ) : (
            <div
              key={app.id}
              className="group rounded-xl border border-border shadow-sm px-4 py-3 flex items-center gap-3 transition-colors bg-card/60 cursor-default"
            >
              <div
                className={`h-9 w-9 rounded-lg bg-linear-to-br ${app.gradient} flex items-center justify-center shrink-0`}
              >
                <app.Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{app.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                    Inactive
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{app.stats}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
