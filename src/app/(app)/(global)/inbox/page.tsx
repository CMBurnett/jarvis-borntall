import { InboxFeed } from "@/components/inbox/InboxFeed"

export default function InboxPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 backdrop-blur-sm">
        <h1 className="text-sm font-semibold text-foreground">Inbox</h1>
        <span className="text-xs text-muted-foreground">
          Real-time signals across all contexts · click to mark read · hover to triage or archive
        </span>
      </div>
      <div className="flex flex-1 px-6 pb-6">
        <InboxFeed />
      </div>
    </div>
  )
}
