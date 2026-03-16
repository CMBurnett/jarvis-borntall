"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { Settings, Sun, Moon, LogOut, User } from "lucide-react";
import { NAV_ENTRIES, getNavOrder } from "@/lib/nav-config";
import type { NavEntry } from "@/lib/nav-config";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Primary nav: Home + Chat
const primaryNav = NAV_ENTRIES.filter((e) => e.order <= 2);
// App nav: the 3 apps
const appNav = NAV_ENTRIES.filter((e) => e.order >= 3 && e.order <= 5);
// Bottom nav: Settings + Admin
const bottomNav = NAV_ENTRIES.filter((e) => e.order >= 6);

function NavItem({
  entry,
  active,
}: {
  entry: NavEntry;
  active: boolean;
}) {
  const Icon = entry.icon;
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          active
            ? "bg-brand-gradient text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        render={<Link href={entry.href} data-order={entry.order} />}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
        {active && <span className="sr-only">{entry.label} (current)</span>}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {entry.label}
      </TooltipContent>
    </Tooltip>
  );
}

function NavDivider() {
  return <div className="w-8 border-t border-border my-1" />;
}

export function NavSidebar({
  isAdmin = false,
  user,
}: {
  isAdmin?: boolean;
  user: SupabaseUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const currentOrder = getNavOrder(pathname);
  const isActive = (entry: NavEntry) => entry.order === currentOrder;

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "JV";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed left-3 top-3 bottom-3 z-40 flex w-16 flex-col rounded-2xl border border-border bg-card shadow-md">
      {/* Logo mark */}
      <div className="flex h-16 items-center justify-center shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
          <span className="text-primary-foreground font-semibold text-sm">J</span>
        </div>
      </div>

      {/* Primary nav: Home, Chat */}
      <nav className="flex flex-1 flex-col items-center gap-1.5 px-3 py-2">
        {primaryNav.map((entry) => (
          <NavItem key={entry.href} entry={entry} active={isActive(entry)} />
        ))}

        <NavDivider />

        {/* App shortcuts */}
        {appNav.map((entry) => (
          <NavItem key={entry.href} entry={entry} active={isActive(entry)} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-2 px-3 pb-4">
        {bottomNav
          .filter((entry) => !entry.adminOnly || isAdmin)
          .map((entry) => (
            <NavItem key={entry.href} entry={entry} active={isActive(entry)} />
          ))}

        <div className="w-8 border-t border-border my-0.5" />

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            render={
              <button
                aria-label="Toggle theme"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
            }
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Toggle theme
          </TooltipContent>
        </Tooltip>

        {/* User avatar + menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            render={<button />}
          >
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-brand-gradient text-primary-foreground text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
