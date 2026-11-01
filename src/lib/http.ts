import { NextResponse } from "next/server";
import { LlamaError } from "./llama";

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function failFromError(err: unknown) {
  console.error("[faqqa]", err);
  if (err instanceof LlamaError) {
    if (err.kind === "config") return fail(503, "llama_unconfigured", "خدمة الذكاء الاصطناعي غير مهيأة حالياً. حاول لاحقاً.");
    if (err.kind === "invalid_output") return fail(502, "llama_invalid", "Llama أرجع رداً غير مكتمل مرتين. حاول مرة ثانية.");
    return fail(502, "llama_unavailable", "تعذر الوصول إلى Llama الآن. حاول بعد لحظات.");
  }
  return fail(500, "internal", "صار خطأ غير متوقع. حاول مرة ثانية.");
}

// Best-effort per-IP limiter (per server instance) to protect the free Llama quota.
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, limit = 8, windowMs = 60_000) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit ? fail(429, "rate_limited", "طلبات كثيرة خلال وقت قصير. انتظر دقيقة وحاول مرة ثانية.") : null;
}
