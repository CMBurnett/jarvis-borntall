"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Blocks,
  Settings,
  ShieldCheck,
  Bell,
  Database,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/apps", icon: Blocks, label: "Apps" },
  { href: "/data", icon: Database, label: "Data" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
];

const bottomItems = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/admin", icon: ShieldCheck, label: "Admin" },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        render={<Link href={href} />}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={active ? 2 : 1.75} />
        {active && <span className="sr-only">{label} (current)</span>}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function NavSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo mark */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-primary-foreground font-semibold text-sm">J</span>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-1 flex-col items-center gap-1.5 px-3 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Bottom nav */}
      <nav className="flex flex-col items-center gap-1.5 px-3 py-4 border-t border-sidebar-border">
        {bottomItems
          .filter((item) => item.href !== "/admin" || isAdmin)
          .map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
      </nav>
    </aside>
  );
}
