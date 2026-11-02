import "server-only";
import { z } from "zod";
import { getVercelOidcToken } from "@vercel/oidc";

// All model calls run Meta Llama 4 Scout on the server; keys never reach the browser.
export const TEXT_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
export const VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

export class LlamaError extends Error {
  constructor(message: string, public readonly kind: "config" | "upstream" | "quota" | "invalid_output") {
    super(message);
  }
}

type Content = string | ({ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } })[];
export type Message = { role: "system" | "user" | "assistant"; content: Content };

// Providers, tried in order, each only when configured:
// 1. Groq free tier (GROQ_API_KEY): no card on file, so it can never bill.
// 2. Vercel AI Gateway (AI_GATEWAY_ENABLED=1 or AI_GATEWAY_API_KEY); its free credits need a card on the team.
// 3. A Cloudflare Worker proxy to Workers AI (LLAMA_PROXY_URL + LLAMA_PROXY_SECRET).
// LLAMA_PROVIDER=proxy forces the proxy (the verify harness uses this with its local stub).
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";
const GATEWAY_MODEL = "meta/llama-4-scout";

// When a provider says it is out of quota (or not set up), skip it for a while so fallbacks answer instantly.
const skipUntil = { groq: 0, gateway: 0, proxy: 0 };
type ProviderName = keyof typeof skipUntil;
const nextUtcMidnight = () => { const d = new Date(); d.setUTCHours(24, 0, 0, 0); return d.getTime(); };

type Body = { messages: Message[]; max_tokens: number; temperature: number; response_format: { type: "json_object" } };

async function post(url: string, token: string, body: object): Promise<{ status: number; data: Record<string, unknown> | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    return { status: res.status, data: (await res.json().catch(() => null)) as Record<string, unknown> | null };
  } catch (err) {
    throw new LlamaError(`Llama request failed: ${(err as Error).message}`, "upstream");
  } finally {
    clearTimeout(timer);
  }
}

/** Pulls the reply out of an OpenAI-style chat completion. */
function completionText(data: Record<string, unknown> | null) {
  const choices = data?.choices as { message?: { content?: unknown } }[] | undefined;
  return choices?.[0]?.message?.content ?? null;
}

async function viaGroq(body: Body): Promise<unknown> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new LlamaError("Groq is not configured", "config");
  const { status, data } = await post(GROQ_URL, key, { ...body, model: GROQ_MODEL });
  const error = data?.error as { type?: string; code?: string; message?: string } | undefined;
  if (status === 200 && !error) return completionText(data);
  if (status === 429) {
    // Free-tier limits: per-minute ones clear quickly, the daily one resets at 00:00 UTC.
    const daily = /per day|RPD|TPD/i.test(error?.message ?? "");
    skipUntil.groq = daily ? nextUtcMidnight() : Date.now() + 60_000;
    throw new LlamaError(`Groq rate limit (${daily ? "daily" : "per minute"})`, "quota");
  }
  throw new LlamaError(`Groq error ${status}: ${error?.code ?? error?.type ?? "unknown"}`, "upstream");
}

async function viaGateway(body: Body): Promise<unknown> {
  let token = process.env.AI_GATEWAY_API_KEY;
  if (!token && process.env.AI_GATEWAY_ENABLED !== "1") throw new LlamaError("AI Gateway is not enabled", "config");
  if (!token) {
    try { token = await getVercelOidcToken(); } catch { throw new LlamaError("AI Gateway has no credentials", "config"); }
  }
  const { status, data } = await post(GATEWAY_URL, token, { ...body, model: GATEWAY_MODEL });
  const error = data?.error as { type?: string; message?: string } | undefined;
  if (status === 200 && !error) return completionText(data);
  const type = error?.type ?? "";
  if (type === "customer_verification_required") {
    skipUntil.gateway = Date.now() + 10 * 60_000;
    throw new LlamaError("AI Gateway needs a card on file to unlock free credits", "config");
  }
  if (status === 402 || /insufficient_funds|quota/.test(type)) {
    skipUntil.gateway = Date.now() + 30 * 60_000;
    throw new LlamaError(`AI Gateway credits used up (${type})`, "quota");
  }
  throw new LlamaError(`AI Gateway error ${status}: ${type || error?.message || "unknown"}`, "upstream");
}

async function viaProxy(body: Body, model: string): Promise<unknown> {
  const url = process.env.LLAMA_PROXY_URL;
  const secret = process.env.LLAMA_PROXY_SECRET;
  if (!url || !secret) throw new LlamaError("Llama proxy is not configured", "config");
  const { status, data } = await post(url, secret, { ...body, model });
  // Workers AI's free plan has a daily allocation that resets at 00:00 UTC.
  if (/\b4006\b|daily free allocation/i.test(String(data?.detail ?? ""))) {
    skipUntil.proxy = nextUtcMidnight();
    throw new LlamaError("Llama daily allocation used up", "quota");
  }
  if (status !== 200 || !data || data.error) throw new LlamaError(`Llama upstream error: ${data?.error ?? status}`, "upstream");
  return data.response;
}

async function callLlama(messages: Message[], model: string, maxTokens: number): Promise<unknown> {
  const body: Body = { messages, max_tokens: maxTokens, temperature: 0.3, response_format: { type: "json_object" } };
  const order: ProviderName[] = process.env.LLAMA_PROVIDER === "proxy" ? ["proxy"] : ["groq", "gateway", "proxy"];
  const errors: LlamaError[] = [];
  for (const name of order) {
    if (Date.now() < skipUntil[name]) { errors.push(new LlamaError(`${name} skipped`, name === "gateway" ? "config" : "quota")); continue; }
    try {
      return name === "groq" ? await viaGroq(body) : name === "gateway" ? await viaGateway(body) : await viaProxy(body, model);
    } catch (err) {
      if (!(err instanceof LlamaError)) throw err;
      if (err.kind !== "config") console.error(`[llama] ${name} failed:`, err.message);
      errors.push(err);
    }
  }
  // Report the most useful reason: out of quota beats a generic outage beats "not configured".
  throw errors.find((e) => e.kind === "quota") ?? errors.find((e) => e.kind === "upstream") ?? errors[0] ?? new LlamaError("No Llama provider", "config");
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
