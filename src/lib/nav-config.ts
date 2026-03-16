import {
  Home,
  Bot,
  ShieldCheck,
  BarChart3,
  FileCheck2,
  Settings,
  ShieldAlert,
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
  { order: 1, href: "/",                       label: "Home",                   icon: Home },
  { order: 2, href: "/chat",                   label: "Chat",                   icon: Bot },
  { order: 3, href: "/apps/compliance-ready",  label: "ISOReady",               icon: ShieldCheck },
  { order: 4, href: "/apps/bi-agent",          label: "Business Intelligence",  icon: BarChart3 },
  { order: 5, href: "/apps/order-processing",  label: "Order Processing",       icon: FileCheck2 },
  { order: 6, href: "/settings",               label: "Settings",               icon: Settings },
  { order: 7, href: "/admin",                  label: "Admin",                  icon: ShieldAlert, adminOnly: true },
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
