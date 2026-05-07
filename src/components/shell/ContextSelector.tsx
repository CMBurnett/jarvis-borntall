"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LIFECYCLE_STAGE_COLORS,
  LIFECYCLE_STAGE_LABELS,
} from "@/lib/data/mock-contexts"
import type { Context } from "@/lib/types/contexts"
import {
  Home,
  Inbox,
  Bot,
  ShieldCheck,
  BookOpen,
  Plus,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Dialog, DialogContent } from "@/components/ui/dialog"

// ─── Per-context nav items ─────────────────────────────────
const CONTEXT_NAV = [
  { label: "Home",     icon: Home,        href: (id: string) => `/context/${id}` },
  { label: "Inbox",    icon: Inbox,       href: (_id: string) => `/inbox` },
  { label: "Agents",   icon: Bot,         href: (id: string) => `/context/${id}/agents` },
  { label: "Security", icon: ShieldCheck, href: (id: string) => `/context/${id}/security` },
  { label: "Runbook",  icon: BookOpen,    href: (id: string) => `/context/${id}/runbook` },
]

// ─── Shared module-level context store ────────────────────
type Listener = (ctx: Context) => void
const listeners = new Set<Listener>()
let _activeContext: Context | null = null

function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
function setGlobalContext(ctx: Context) {
  _activeContext = ctx
  listeners.forEach((fn) => fn(ctx))
}
function getDefaultContext(contexts: Context[], pathname: string): Context {
  const urlId = pathname.match(/^\/context\/([^/]+)/)?.[1] ?? null
  return contexts.find((c) => c.id === urlId) ?? contexts[0]
}

function useActiveContext(contexts: Context[]) {
  const pathname = usePathname()
  const [activeContext, setActive] = useState<Context>(() => {
    if (_activeContext) return _activeContext
    return getDefaultContext(contexts, pathname)
  })

  useEffect(() => subscribe((ctx) => setActive(ctx)), [])

  function select(ctx: Context) {
    setGlobalContext(ctx)
    setActive(ctx)
  }

  return { activeContext, select }
}

// ─── Dropdown list ─────────────────────────────────────────
function ContextDropdown({
  contexts,
  activeContext,
  onSelect,
  onNew,
}: {
  contexts: Context[]
  activeContext: Context
  onSelect: (ctx: Context) => void
  onNew?: () => void
}) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      <div className="py-1">
        {contexts.map((ctx) => (
          <button
            key={ctx.id}
            onClick={() => onSelect(ctx)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors"
          >
            <span className={cn("h-2 w-2 rounded-full shrink-0", LIFECYCLE_STAGE_COLORS[ctx.lifecycle_stage])} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{ctx.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{LIFECYCLE_STAGE_LABELS[ctx.lifecycle_stage]}</p>
            </div>
            {ctx.id === activeContext.id && (
              <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-border py-1">
        <button onClick={onNew} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New context
        </button>
      </div>
    </div>
  )
}

// ─── New Context Dialog ────────────────────────────────────
function NewContextDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (ctx: Context) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [stage, setStage] = useState<Context["lifecycle_stage"]>("active_dev")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/contexts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), lifecycle_stage: stage }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to create context")
        return
      }
      const created = await res.json()
      onCreated({
        ...created,
        models: created.models ?? [],
        tools: created.tools ?? [],
      })
      setName("")
      setDescription("")
      setStage("active_dev")
      onClose()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <h2 className="text-sm font-semibold text-foreground mb-4">New context</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mastrocco"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-liner"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Lifecycle stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Context["lifecycle_stage"])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="active_dev">Active Dev</option>
              <option value="stabilization">Stabilization</option>
              <option value="maintenance">Maintenance</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 transition-opacity"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── 1. Context picker card ────────────────────────────────
export function ContextPicker({ contexts: initialContexts }: { contexts: Context[] }) {
  const { activeContext, select } = useActiveContext(initialContexts)
  const [contexts, setContexts] = useState(initialContexts)
  const [open, setOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const router = useRouter()

  // Keep local list in sync if server re-passes new contexts
  useEffect(() => { setContexts(initialContexts) }, [initialContexts])

  function handleCreated(ctx: Context) {
    setContexts((prev) => [ctx, ...prev])
    select(ctx)
    router.push(`/context/${ctx.id}`)
  }

  return (
    <div className="relative z-30 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-lg">
      {/* Dropdown trigger */}
      <div className="relative px-2 py-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors",
            open ? "bg-muted" : "hover:bg-muted/60"
          )}
        >
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", LIFECYCLE_STAGE_COLORS[activeContext.lifecycle_stage])} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground leading-tight">{activeContext.name}</p>
            <p className="truncate text-[10px] text-muted-foreground mt-px">
              {LIFECYCLE_STAGE_LABELS[activeContext.lifecycle_stage]}
            </p>
          </div>
          <ChevronDown className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150",
            open && "rotate-180"
          )} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="relative z-50">
              <ContextDropdown
                contexts={contexts}
                activeContext={activeContext}
                onSelect={(ctx) => { select(ctx); setOpen(false) }}
                onNew={() => { setOpen(false); setNewOpen(true) }}
              />
            </div>
          </>
        )}
      </div>

      {/* Sprint focus */}
      {activeContext.sprint_focus && (
        <div className="px-5 pb-3">
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2 border-l-2 border-brand/30 pl-2">
            {activeContext.sprint_focus}
          </p>
        </div>
      )}

      <NewContextDialog open={newOpen} onClose={() => setNewOpen(false)} onCreated={handleCreated} />
    </div>
  )
}

// ─── 2. Context nav card (icon-only + tooltip labels) ──────
export function ContextNav({ contexts }: { contexts: Context[] }) {
  const { activeContext } = useActiveContext(contexts)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/inbox") return pathname === "/inbox"
    if (href === `/context/${activeContext.id}`) return pathname === `/context/${activeContext.id}`
    return pathname.startsWith(href)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {CONTEXT_NAV.map(({ label, icon: Icon, href }) => {
        const resolvedHref = href(activeContext.id)
        const active = isActive(resolvedHref)
        return (
          <Tooltip key={label}>
            <TooltipTrigger render={<span />}>
              <Link
                href={resolvedHref}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-3.5 transition-colors",
                  active
                    ? "bg-brand-gradient border-transparent text-primary-foreground shadow-sm"
                    : "border-border bg-card/90 backdrop-blur-md text-foreground/50 hover:text-foreground hover:bg-card shadow-lg"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {label}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
