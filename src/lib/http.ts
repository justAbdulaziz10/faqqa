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
