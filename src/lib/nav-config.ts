import {
  Inbox,
  LayoutGrid,
  ShieldCheck,
  FileCheck2,
  BarChart3,
  Settings,
  Users,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavEntry = {
  order: number;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only show in admin panel */
  adminOnly?: boolean;
};

export const NAV_ENTRIES: NavEntry[] = [
  // Jarvis OS global nav (orders 1–3)
  { order: 1, href: "/inbox",     label: "Inbox",     icon: Inbox },
  { order: 2, href: "/portfolio", label: "Portfolio", icon: LayoutGrid },
  { order: 3, href: "/security",  label: "Security",  icon: ShieldCheck },
  { order: 4, href: "/agents",    label: "Agents",    icon: Bot },
  // Existing apps (orders 10–13 — gap is safe, AnimatedMain no-ops undefined entries)
  { order: 10, href: "/apps/iso-ready",        label: "ISO Ready",        icon: ShieldCheck },
  { order: 11, href: "/apps/order-processing", label: "Order Processing", icon: FileCheck2 },
  { order: 12, href: "/apps/reporting",        label: "Reporting",        icon: BarChart3 },
  { order: 13, href: "/apps/crm",             label: "CRM",              icon: Users },
  // Settings
  { order: 20, href: "/settings", label: "Settings", icon: Settings },
];

export function getNavOrder(pathname: string): number {
  const exact = NAV_ENTRIES.find((e) => e.href === pathname);
  if (exact) return exact.order;
  const prefix = NAV_ENTRIES.find((e) => e.href !== "/" && pathname.startsWith(e.href));
  return prefix?.order ?? 1;
}

export function getNavEntryByOrder(order: number): NavEntry | undefined {
  return NAV_ENTRIES.find((e) => e.order === order);
}

/** Returns the order numbers between prevOrder and newOrder (exclusive). */
export function getIntermediateOrders(prevOrder: number, newOrder: number): number[] {
  if (Math.abs(newOrder - prevOrder) <= 1) return [];
  const dir = newOrder > prevOrder ? 1 : -1;
  const result: number[] = [];
  for (let i = prevOrder + dir; dir > 0 ? i < newOrder : i > newOrder; i += dir) {
    result.push(i);
  }
  return result;
}
