"use client";

import { useRef, useState } from "react";
import type { Identify as IdentifyResult } from "@/lib/schemas";
import { Spinner } from "./Advisor";

// Downscale in the browser so uploads stay small and fast.
async function toDataUrl(file: File, maxSide = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function Identify() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);

  async function onFile(file?: File) {
    setError(null); setResult(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setError("الصيغة غير مدعومة. استخدم صورة JPG أو PNG أو WEBP."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("الصورة كبيرة جداً (الحد 15 ميجا)."); return; }
    try { setImage(await toDataUrl(file)); } catch { setError("تعذر قراءة الصورة. جرّب صورة ثانية."); }
  }

  async function analyze() {
    if (!image) { setError("اختر صورة الفقعة أول."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/identify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "تعذر تحليل الصورة. حاول مرة ثانية.");
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="identify" className="mx-auto max-w-7xl scroll-mt-28 px-5 pt-28" aria-labelledby="identify-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 id="identify-title" className="font-display text-4xl md:text-5xl">زبيدي ولا خلاسي؟</h2>
          <p className="mt-3 max-w-md leading-8 text-muted">صوّر الفقعة، و Llama 4 يتعرف على نوعها ويقدّر جودتها وسعرها، وينبهك لو فيها تلف.</p>

          <ul className="mt-8 divide-y divide-mist/70 border-y border-mist/70">
            {TYPES.map((t) => (
              <li key={t.name} className="flex items-center gap-4 py-4">
                <span className="size-10 shrink-0 rounded-full" style={{ background: t.swatch }} aria-hidden />
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted">{t.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[18px] border border-dashed border-mist bg-ink-2 transition hover:border-cream/50"
            aria-label={image ? "غيّر الصورة" : "اختر صورة الفقعة"}
          >
            {image
              // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
              ? <img src={image} alt="صورة الفقعة المرفوعة" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="flex flex-col items-center gap-3 px-6 text-center">
                  <svg viewBox="0 0 24 24" className="size-9 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  <span className="text-cream">صوّر أو اختر صورة</span>
                  <span className="text-sm text-muted">أو اسحبها هنا. JPG أو PNG أو WEBP</span>
                </span>}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={analyze} disabled={loading || !image} className="btn-bolt flex items-center gap-2 px-6 py-3 disabled:cursor-not-allowed">
              {loading ? <><Spinner /> يفحص الصورة</> : "تعرّف على الفقعة"}
            </button>
            {image && !loading && <button type="button" onClick={() => { setImage(null); setResult(null); }} className="text-sm text-muted underline underline-offset-4 hover:text-cream">صورة ثانية</button>}
          </div>
          {error && <p role="alert" className="mt-4 text-sm text-alert">{error}</p>}

          <div aria-live="polite" aria-busy={loading}>
            {loading && <div className="mt-8 flex flex-col gap-3"><div className="skeleton h-10 w-1/2" /><div className="skeleton h-20" /></div>}
            {!loading && result && (
              <article className="mt-8 border-t border-mist pt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{result.isTruffle ? "النوع المتوقع" : "النتيجة"}</p>
                    <h3 className="mt-1 text-3xl font-semibold">{result.type}</h3>
                  </div>
                  {result.isTruffle && <p className="text-end text-sm text-muted">ثقة النموذج<span className="num block text-2xl font-semibold text-cream">{Math.round(result.confidence)}٪</span></p>}
                </div>
                <p className="mt-4 leading-8 text-cream/90">{result.description}</p>
                {result.isTruffle && (
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-mist py-4 text-sm">
                    <div><dt className="text-muted">الجودة</dt><dd className="mt-1 font-medium">{result.quality}</dd></div>
                    <div><dt className="text-muted">السعر التقريبي للكيلو</dt><dd className="num mt-1 font-medium">{result.priceRangeSar ? `${result.priceRangeSar.min} إلى ${result.priceRangeSar.max} ريال` : "ما يمدي نقدّر"}</dd></div>
                    <div className="col-span-2"><dt className="text-muted">الطزاجة</dt><dd className="mt-1 leading-7">{result.freshness}</dd></div>
                  </dl>
                )}
                {result.warnings.length > 0 && <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-alert">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
                {result.tips.length > 0 && <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-muted marker:text-rain">{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
                <p className="mt-5 text-xs text-muted">التعرف من الصورة تقديري وقد يخطئ، والأسعار استرشادية. لا تعتمد عليه في الحكم على صلاحية الأكل.</p>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const TYPES = [
  { name: "زبيدي", desc: "أبيض مائل للكريمي وحجمه كبير. الأغلى والأطيب.", swatch: "radial-gradient(circle at 35% 30%, #fbf4e4, #d9c6a2 70%, #a8916a)" },
  { name: "خلاسي", desc: "قشرته محمرّة مائلة للبني، وداخله أغمق. سعره متوسط إلى غالي.", swatch: "radial-gradient(circle at 35% 30%, #e7b9a0, #a8644a 70%, #6e3b2a)" },
  { name: "جبي", desc: "داكن يميل للأسود وأصغر حجماً. الأرخص بينهم.", swatch: "radial-gradient(circle at 35% 30%, #8a7564, #4a382c 70%, #241a14)" },
];
