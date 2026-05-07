"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import {
  Inbox,
  LayoutGrid,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  LogOut,
  User,
  Plus,
} from "lucide-react"
import {
  MOCK_CONTEXTS,
  LIFECYCLE_STAGE_COLORS,
  LIFECYCLE_STAGE_LABELS,
} from "@/lib/data/mock-contexts"
import type { Context } from "@/lib/types/contexts"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const GLOBAL_NAV = [
  { href: "/inbox",     label: "Inbox",     icon: Inbox },
  { href: "/portfolio", label: "Portfolio", icon: LayoutGrid },
  { href: "/security",  label: "Security",  icon: ShieldCheck },
]

function GlobalNavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-brand-gradient text-primary-foreground font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
      {label}
    </Link>
  )
}

function ContextListItem({
  context,
  active,
}: {
  context: Context
  active: boolean
}) {
  return (
    <Link
      href={`/context/${context.id}`}
      className={cn(
        "flex items-start gap-2 rounded-lg px-2.5 py-2 transition-colors group",
        active
          ? "bg-sidebar-accent"
          : "hover:bg-sidebar-accent"
      )}
    >
      <span
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-full",
          LIFECYCLE_STAGE_COLORS[context.lifecycle_stage]
        )}
      />
      <div className="min-w-0">
        <p className="truncate text-sm text-sidebar-foreground leading-tight">{context.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {LIFECYCLE_STAGE_LABELS[context.lifecycle_stage]}
        </p>
      </div>
    </Link>
  )
}

export function Sidebar({
  isAdmin = false,
  user,
  contexts = MOCK_CONTEXTS,
  activeContextId,
}: {
  isAdmin?: boolean
  user: SupabaseUser
  contexts?: Context[]
  activeContextId?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "JV"

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <aside className="fixed left-3 top-3 bottom-3 z-40 hidden md:flex w-56 flex-col rounded-2xl border border-border bg-card shadow-md">
      {/* Logo */}
      <div className="flex h-12 shrink-0 items-center px-4 border-b border-border">
        <span className="text-sm font-semibold tracking-tight text-foreground">Jarvis OS</span>
      </div>

      {/* Global nav */}
      <nav className="flex flex-col gap-0.5 px-2 pt-3 pb-2">
        {GLOBAL_NAV.map((item) => (
          <GlobalNavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href || pathname.startsWith(item.href + "/")}
          />
        ))}
      </nav>

      <div className="mx-3 border-t border-border" />

      {/* Context list */}
      <div className="flex flex-1 flex-col overflow-hidden px-2 pt-2 pb-1">
        <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contexts
        </p>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {contexts.map((ctx) => (
            <ContextListItem
              key={ctx.id}
              context={ctx}
              active={activeContextId === ctx.id || pathname === `/context/${ctx.id}` || pathname.startsWith(`/context/${ctx.id}/`)}
            />
          ))}
        </div>
        <button className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full">
          <Plus className="h-3.5 w-3.5" />
          New context
        </button>
      </div>

      <div className="mx-3 border-t border-border" />

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 px-2 py-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-sidebar-accent text-sidebar-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.75} />
          Settings
        </Link>

        {/* Theme toggle */}
        <button
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full outline-none"
            render={<button />}
          >
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-brand-gradient text-primary-foreground text-[9px] font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs">{user.email}</span>
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
  )
}
