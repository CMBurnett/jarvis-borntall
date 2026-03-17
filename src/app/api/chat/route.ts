import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type UIMessage } from "ai";
import { buildDemoContext } from "@/lib/data/demo-context";

const demoContext = buildDemoContext(["all"]);

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

function toModelMessages(uiMessages: UIMessage[]) {
  return uiMessages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.parts
      .filter((p): p is Extract<(typeof m.parts)[number], { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join(""),
  }));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: ollama(process.env.OLLAMA_MODEL ?? "qwen3.5:9b"),
    system: `You are Jarvis, an AI assistant for business operations at a mid-size industrial manufacturing and distribution company.

INSTRUCTIONS:
- Answer questions using ONLY the business data provided below. The data is complete and authoritative — do not say data is missing if it exists in the context.
- Be concise and direct. Lead with the answer, then add supporting detail if relevant.
- All monetary values are in USD. Always format with $ sign (e.g. $112,800.00).
- IMPORTANT: When asked about a customer's balance, credit, revenue, or any customer-specific data, ALWAYS check the CUSTOMERS section first. Each customer record contains: currentBalance, creditLimit, ytdRevenue, terms, status, contact info, and notes. Do NOT look in the financial summary for per-customer data — it only has aggregates.
- When asked about orders, check SALES ORDERS and INVOICES.
- When asked about compliance or audit readiness, check COMPLIANCE GAPS and AUDIT READINESS.
- Never output raw tokens like <|endoftext|> or <|im_start|> — just stop cleanly.
- Use markdown formatting (bold, tables, lists) when it helps readability.

${demoContext}`,
    messages: toModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
