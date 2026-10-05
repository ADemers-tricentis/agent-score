// Order-support agent built on the Vercel AI SDK.
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

const openai = createOpenAI({ baseURL: process.env.OPENAI_BASE_URL });

const ORDERS: Record<string, { status: string; eta: string }> = {
  A100: { status: "shipped", eta: "Friday" },
};

const lookupOrder = tool({
  description: "Look up the status of an order by id.",
  inputSchema: z.object({ order_id: z.string() }),
  execute: async ({ order_id }) => ORDERS[order_id] ?? { status: "unknown" },
});

export async function run(question: string): Promise<string> {
  const { text } = await generateText({
    model: openai.chat("gpt-4o-mini"),
    system: "You are a concise order-support agent.",
    prompt: question,
    tools: { lookup_order: lookupOrder },
    stopWhen: stepCountIs(4),
  });
  return text;
}

console.log(await run(process.argv.slice(2).join(" ") || "Where is order A100?"));
