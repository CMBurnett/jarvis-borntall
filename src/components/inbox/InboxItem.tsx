"use client"

import type { InboxItem } from "@/lib/types/inbox"

export function InboxItem({ item }: { item: InboxItem }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 flex flex-col gap-1 text-sm">
      <p className="font-medium text-foreground truncate">{item.title}</p>
      <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
      <p className="text-[10px] text-muted-foreground">[Inbox Item — Sprint 3]</p>
    </div>
  )
}
