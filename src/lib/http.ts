import { NextResponse } from "next/server";
import { LlamaError } from "./llama";

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export function failFromError(err: unknown) {
  console.error("[faqqa]", err);
  if (err instanceof LlamaError) {
    if (err.kind === "config") return fail(503, "llama_unconfigured", "خدمة الذكاء الاصطناعي متوقفة الحين. جرب بعدين.");
    if (err.kind === "quota") return fail(503, "llama_quota", "Llama خلص حصته المجانية مؤقتا. جرب بعد كم ساعة.");
    if (err.kind === "invalid_output") return fail(502, "llama_invalid", "Llama رجع رد ناقص مرتين. جرب مرة ثانية.");
    return fail(502, "llama_unavailable", "ما قدرنا نوصل لـ Llama الحين. جرب بعد شوي.");
  }
  return fail(500, "internal", "صار خطأ غير متوقع. جرب مرة ثانية.");
}

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "anon";
}

// Fair share of the free model quota: a daily cap per person (per server instance, best effort).
const daily = new Map<string, number>();
const DAILY = {
  advisor: { limit: 40, message: "وصلت حد اليوم من الأسئلة (40 سؤال). يرجع بكرة إن شاء الله." },
  identify: { limit: 15, message: "وصلت حد اليوم لفحص الصور (15 صورة). يرجع بكرة إن شاء الله." },
};
export function dailyLimited(req: Request, scope: keyof typeof DAILY) {
  const key = `${scope}|${clientIp(req)}|${new Date().toISOString().slice(0, 10)}`;
  const count = (daily.get(key) ?? 0) + 1;
  if (daily.size > 20_000) daily.clear();
  daily.set(key, count);
  return count > DAILY[scope].limit ? fail(429, "daily_limit", DAILY[scope].message) : null;
}

// Best-effort per-IP limiter (per server instance) to protect the free Llama quota.
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, limit = 8, windowMs = 60_000) {
  const ip = clientIp(req);
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > limit ? fail(429, "rate_limited", "طلبات كثيرة في وقت قصير. انتظر دقيقة وجرب مرة ثانية.") : null;
}
