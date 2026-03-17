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

  const result = await streamText({
    model: ollama(process.env.OLLAMA_MODEL ?? "qwen3.5:9b"),
    system: `You are Jarvis, an AI assistant for business operations at a mid-size industrial manufacturing and distribution company. You help with compliance, business intelligence, and order processing. Be concise and helpful. Answer questions using the business data provided below. When referencing data, be specific with numbers, dates, and names. All monetary values in the data are in USD — always format them with a $ sign (e.g. $47,250.00).

${demoContext}`,
    messages: toModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
