import Anthropic from "@anthropic-ai/sdk"

const MODEL = "claude-haiku-4-5-20251001" // fast + cheap for triage

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface TriageResult {
  priority: "urgent" | "high" | "normal" | "low"
  agent_summary: string
  agent_suggested_actions: string[]
}

const ACTION_OPTIONS = [
  "Diagnose with Claude",
  "Open in context",
  "Log to runbook",
  "Run security check",
  "View in Sentry",
  "View deploy",
  "Snooze 24h",
  "Archive",
]

export async function triageInboxItem(
  contextName: string,
  source: string,
  title: string,
  rawPayload: Record<string, unknown>
): Promise<TriageResult> {
  const prompt = `You are the Jarvis inbox triage agent for a solo product engineer managing multiple SaaS products.

Incoming event:
- Product: ${contextName}
- Source: ${source}
- Title: ${title}
- Raw data: ${JSON.stringify(rawPayload, null, 2).slice(0, 2000)}

Tasks:
1. Assign priority:
   - urgent: production down, security breach, data loss
   - high: errors affecting users, deploy failure
   - normal: informational deploy, warning, PR
   - low: resolved events, routine info

2. Write a one-line plain-English summary (max 15 words, no technical jargon)

3. Suggest 2-3 actions from this list: ${ACTION_OPTIONS.join(", ")}

Respond in JSON only, no markdown:
{
  "priority": "urgent|high|normal|low",
  "agent_summary": "...",
  "agent_suggested_actions": ["...", "..."]
}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""

  try {
    const parsed = JSON.parse(text) as TriageResult
    return {
      priority: parsed.priority ?? "normal",
      agent_summary: parsed.agent_summary ?? title,
      agent_suggested_actions: parsed.agent_suggested_actions ?? ["Archive"],
    }
  } catch {
    // Fallback if JSON parse fails
    return {
      priority: "normal",
      agent_summary: title.slice(0, 80),
      agent_suggested_actions: ["Open in context", "Archive"],
    }
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
