"use client"

const TABS = ["All", "Needs action", "PRs / deploys", "AI alerts", "Security"]

export function InboxFilters() {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2">
      {TABS.map((tab) => (
        <button
          key={tab}
          className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          {tab}
        </button>
      ))}
      <span className="ml-2 text-[10px] text-muted-foreground">[Inbox Filters — Sprint 3]</span>
    </div>
  )
}
