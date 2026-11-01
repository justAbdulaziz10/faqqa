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
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setError("هذي الصيغة ما تنفع. استخدم صورة JPG أو PNG أو WEBP."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("الصورة كبيرة. الحد 15 ميجا."); return; }
    try { setImage(await toDataUrl(file)); } catch { setError("ما قدرنا نقرأ الصورة. جرب صورة ثانية."); }
  }

  async function analyze() {
    if (!image) { setError("اختر صورة الفقعة أول."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/identify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "ما قدرنا نفحص الصورة. جرب مرة ثانية.");
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="identify" className="mx-auto max-w-7xl scroll-mt-20 px-5 mt-20 md:mt-28" aria-labelledby="identify-title">
      <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <h2 id="identify-title" className="font-display text-4xl font-bold md:text-5xl">زبيدي ولا خلاسي؟</h2>
          <p className="mt-3 max-w-md leading-8 text-muted">صور الفقعة، ونقول لك نوعها وجودتها وسعرها التقريبي.</p>

        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className={`relative grid w-full place-items-center overflow-hidden rounded-[18px] border border-dashed border-mist bg-ink-2 transition hover:border-cream/50 ${image ? "aspect-[4/3]" : "h-64 md:h-80"}`}
            aria-label={image ? "غير الصورة" : "اختر صورة الفقعة"}
          >
            {image
              // eslint-disable-next-line @next/next/no-img-element -- local data URL preview
              ? <img src={image} alt="صورة الفقعة المرفوعة" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="flex flex-col items-center gap-3 px-6 text-center">
                  <svg viewBox="0 0 100 90" className="h-20 w-24 text-muted" fill="none" stroke="currentColor" aria-hidden>
                    <path d="M12 46 C8 24 30 10 50 12 C74 14 92 30 88 52 C85 74 62 84 42 80 C24 77 14 64 12 46 Z" strokeWidth="2" strokeDasharray="5 6" />
                    <g transform="translate(35 33)" strokeWidth="2.2" strokeLinejoin="round" className="text-cream"><path d="M2 8h6l3-5h10l3 5h6v18H2z" /><circle cx="17" cy="16" r="5" /></g>
                  </svg>
                  <span className="text-cream">صور الفقعة أو اختر صورة</span>
                  <span className="text-sm text-muted">JPG أو PNG أو WEBP</span>
                </span>}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="mt-4 flex items-center gap-4">
            <button type="button" onClick={analyze} disabled={loading || !image} data-empty={!image || undefined} className="btn-bolt flex items-center gap-2 px-6 py-3 disabled:cursor-not-allowed">
              {loading ? <><Spinner /> يفحص الصورة</> : "افحص الصورة"}
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
                    <p className="text-sm text-muted">{result.isTruffle ? "النوع" : "النتيجة"}</p>
                    <h3 className="mt-1 text-3xl font-semibold">{result.type}</h3>
                  </div>
                  {result.isTruffle && <p className="text-end text-sm text-muted">متأكد بنسبة<span className="num block text-2xl font-semibold text-cream">{Math.round(result.confidence)}٪</span></p>}
                </div>
                <p className="mt-4 leading-8 text-cream/90">{result.description}</p>
                {result.isTruffle && (
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-y border-mist py-4 text-sm">
                    <div><dt className="text-muted">الجودة</dt><dd className="mt-1 font-medium">{result.quality}</dd></div>
                    <div><dt className="text-muted">سعر الكيلو تقريبا</dt><dd className="num mt-1 font-medium">{result.priceRangeSar ? `${result.priceRangeSar.min} إلى ${result.priceRangeSar.max} ريال` : "ما نقدر نحدده"}</dd></div>
                    <div className="col-span-2"><dt className="text-muted">الطزاجة</dt><dd className="mt-1 leading-7">{result.freshness}</dd></div>
                  </dl>
                )}
                {result.warnings.length > 0 && <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-alert">{result.warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
                {result.tips.length > 0 && <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-muted marker:text-rain">{result.tips.map((t) => <li key={t}>{t}</li>)}</ul>}
                <p className="mt-5 text-xs text-muted">النتيجة تقريبية وقد تخطئ، والأسعار للاسترشاد. لا تعتمد عليها في الحكم على صلاحية الأكل.</p>
              </article>
            )}
          </div>
        </div>

        <ul className="divide-y divide-mist/70 border-y border-mist/70 lg:col-start-1 lg:row-start-2 lg:self-start">
            {TYPES.map((t) => (
              <li key={t.name} className="flex items-center gap-4 py-4">
                <span className="size-11 shrink-0 rounded-[46%_54%_42%_58%/55%_44%_56%_45%] shadow-[inset_-3px_-4px_6px_rgba(0,0,0,0.25)]" style={{ background: t.swatch, rotate: t.rotate }} aria-hidden />
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-muted">{t.desc}</p>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

const TYPES = [
  { name: "زبيدي", desc: "أبيض كريمي وحجمه كبير. الأغلى والأطيب.", swatch: "radial-gradient(circle at 35% 30%, #fbf4e4, #d9c6a2 70%, #a8916a)", rotate: "-8deg" },
  { name: "خلاسي", desc: "قشرته حمراء مائلة للبني. سعره متوسط.", swatch: "radial-gradient(circle at 35% 30%, #e7b9a0, #a8644a 70%, #6e3b2a)", rotate: "20deg" },
  { name: "جبي", desc: "داكن وصغير. الأرخص بينهم.", swatch: "radial-gradient(circle at 35% 30%, #8a7564, #4a382c 70%, #241a14)", rotate: "75deg" },
  { name: "هبر", desc: "فاتح وأصغر من الزبيدي، وسعره أقل منه.", swatch: "radial-gradient(circle at 35% 30%, #f3e9d2, #c9b48d 70%, #8f7a55)", rotate: "140deg" },
];
