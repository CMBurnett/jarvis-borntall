import {
  Home,
  MessagesSquare,
  Gauge,
  Rocket,
  Settings,
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
  { order: 2, href: "/chat",                   label: "Chat",                   icon: MessagesSquare },
  { order: 3, href: "/apps/bi-agent",          label: "BI Dashboard",           icon: Gauge },
  { order: 4, href: "/apps",                   label: "Apps",                   icon: Rocket },
  { order: 5, href: "/settings",               label: "Settings",               icon: Settings },
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
