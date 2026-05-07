import { SecurityAggregate } from "@/components/security/SecurityAggregate"

export default function SecurityPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4">
        <h1 className="text-base font-semibold text-foreground">Security</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Aggregate security status across all contexts. Click any row to view its full checklist.
        </p>
      </div>
      <SecurityAggregate />
    </div>
  )
}
