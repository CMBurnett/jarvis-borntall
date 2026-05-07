"use client"

import { useState, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Copy, Eye, Edit3, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const CLAUDE_MD_TEMPLATE = `## Product Name
<!-- e.g. Mastrocco -->

## Lifecycle Stage
<!-- active_dev | stabilization | maintenance | paused -->

## Security Tier
<!-- 1 = accounts/payments, 2 = standard SaaS, 3 = internal/low-risk -->

## Stack & Key Versions
<!-- e.g. Next.js 16, Supabase, Vercel, Anthropic claude-sonnet-4-6 -->

## Key Environment Variable Names
<!-- Never values — names only -->

## External Services & Dependencies
<!-- Stripe, Sentry, UptimeRobot, etc. -->

## Architecture Overview
<!-- Brief description of how the system is structured -->

## Key Files & Entry Points
<!-- Most important files and what they do -->

## How to Deploy
<!-- Steps or just "git push to main → Vercel auto-deploys" -->

## How to Roll Back
<!-- e.g. revert commit + redeploy, or Vercel instant rollback -->

## Observability Setup
<!-- Sentry DSN, uptime monitors, Vercel logs -->

## Common Issues & Known Fixes
<!-- Recurring problems and their solutions -->

## Current Sprint Focus
<!-- 2-3 sentences on what's being built this week -->

## Open Security Notes
<!-- Any pending security work or known risks -->

## Known Technical Debt
<!-- Things to fix later -->
`

interface RunbookEditorProps {
  contextId: string
  initialContent: string
}

export function RunbookEditor({ contextId, initialContent }: RunbookEditorProps) {
  const [content, setContent] = useState(initialContent || CLAUDE_MD_TEMPLATE)
  const [mode, setMode] = useState<"edit" | "preview">("edit")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (value: string) => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/contexts/${contextId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claude_md_content: value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [contextId])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setContent(value)
    // Debounced auto-save on change
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(value), 1500)
  }

  function handleBlur() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    save(content)
  }

  async function copyForClaude() {
    const text = `# Context for Claude Code\n\n${content}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1">
          <button
            onClick={() => setMode("edit")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
              mode === "edit"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={() => setMode("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
              mode === "preview"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          <button
            onClick={copyForClaude}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy for Claude"}
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === "edit" ? (
        <textarea
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          spellCheck={false}
          className="min-h-[600px] w-full rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
        />
      ) : (
        <div className="min-h-[600px] rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-6 py-5 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
