"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Sun, Moon, LogOut, User, Bell, BellOff, Loader2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { usePushNotifications } from "@/lib/push/use-push"

export function UserMenu({ user }: { user: SupabaseUser }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { state: pushState, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications()

  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : "JV"

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-lg px-3.5 py-3 outline-none hover:bg-card transition-colors shrink-0"
        render={<button />}
      >
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-brand-gradient text-primary-foreground text-[10px] font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-medium text-foreground">
            {user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User"}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
        </div>
        <Settings className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
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
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        {pushState !== "unsupported" && pushState !== "denied" && (
          <DropdownMenuItem
            onClick={() => (pushState === "subscribed" ? unsubscribe() : subscribe())}
            disabled={pushLoading}
          >
            {pushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pushState === "subscribed" ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {pushState === "subscribed" ? "Disable notifications" : "Enable notifications"}
          </DropdownMenuItem>
        )}
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
  )
}
