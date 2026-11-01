import { NextResponse } from "next/server";
import { LlamaError } from "./llama";

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function failFromError(err: unknown) {
  console.error("[faqqa]", err);
  if (err instanceof LlamaError) {
    if (err.kind === "config") return fail(503, "llama_unconfigured", "خدمة الذكاء الاصطناعي متوقفة الحين. جرب بعدين.");
    if (err.kind === "invalid_output") return fail(502, "llama_invalid", "Llama رجع رد ناقص مرتين. جرب مرة ثانية.");
    return fail(502, "llama_unavailable", "ما قدرنا نوصل لـ Llama الحين. جرب بعد شوي.");
  }
  return fail(500, "internal", "صار خطأ غير متوقع. جرب مرة ثانية.");
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
  return recent.length > limit ? fail(429, "rate_limited", "طلبات كثيرة في وقت قصير. انتظر دقيقة وجرب مرة ثانية.") : null;
}
