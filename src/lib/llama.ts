import "server-only";
import { z } from "zod";

// All model calls go through a small authenticated Cloudflare Worker that runs
// Meta Llama on Workers AI (see /llama-worker). Keys never reach the browser.
export const TEXT_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
export const VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

export class LlamaError extends Error {
  constructor(message: string, public readonly kind: "config" | "upstream" | "invalid_output") {
    super(message);
  }
}

type Content = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
export type Message = { role: "system" | "user" | "assistant"; content: Content };

async function callLlama(messages: Message[], model: string, maxTokens: number): Promise<unknown> {
  const url = process.env.LLAMA_PROXY_URL;
  const secret = process.env.LLAMA_PROXY_SECRET;
  if (!url || !secret) throw new LlamaError("Llama proxy is not configured", "config");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.3, response_format: { type: "json_object" } }),
      signal: controller.signal,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as { response?: unknown; error?: string } | null;
    if (!res.ok || !data || data.error) throw new LlamaError(`Llama upstream error: ${data?.error ?? res.status}`, "upstream");
    return data.response;
  } catch (err) {
    if (err instanceof LlamaError) throw err;
    throw new LlamaError(`Llama request failed: ${(err as Error).message}`, "upstream");
  } finally {
    clearTimeout(timer);
  }
}

// Llama sometimes wraps JSON in prose or code fences; extract the first JSON object.
export function coerceJson(value: unknown): unknown {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;
  const fenced = value.replace(/```(?:json)?/gi, "");
  const startIdx = fenced.indexOf("{");
  const endIdx = fenced.lastIndexOf("}");
  if (startIdx === -1 || endIdx <= startIdx) return null;
  try { return JSON.parse(fenced.slice(startIdx, endIdx + 1)); } catch { return null; }
}

/**
 * Ask Llama for JSON, validate it with zod, and retry once with the validation
 * errors fed back to the model. Throws LlamaError("invalid_output") if it still fails.
 */
export async function askLlamaJson<T>(opts: {
  schema: z.ZodType<T>;
  messages: Message[];
  model?: string;
  maxTokens?: number;
  refine?: (value: T) => string | null;
}): Promise<{ data: T; attempts: number }> {
  const { schema, model = TEXT_MODEL, maxTokens = 1400, refine } = opts;
  const messages = [...opts.messages];
  let lastProblem = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const raw = await callLlama(messages, model, maxTokens);
    const parsed = schema.safeParse(coerceJson(raw));
    const problem = parsed.success ? refine?.(parsed.data) ?? null : z.prettifyError(parsed.error);
    if (parsed.success && !problem) return { data: parsed.data, attempts: attempt };
    lastProblem = problem ?? "unknown";
    messages.push(
      { role: "assistant", content: typeof raw === "string" ? raw : JSON.stringify(raw) },
      { role: "user", content: `ردك غير مطابق للمخطط المطلوب. المشاكل:\n${lastProblem}\nأعد الإرسال بصيغة JSON صحيحة فقط بدون أي نص إضافي.` },
    );
  }
  throw new LlamaError(`Llama returned invalid output: ${lastProblem}`, "invalid_output");
}
