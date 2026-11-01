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
    if (file.size > 15 * 1024 * 1024) { setError("الصورة كبيرة جداً (الحد ١٥ ميجا)."); return; }
    try { setImage(await toDataUrl(file)); } catch { setError("تعذر قراءة الصورة. جرّب صورة ثانية."); }
  }

  async function analyze() {
    if (!image) { setError("ارفع صورة الفقعة أولاً 📷"); return; }
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
    <section id="identify" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24">
      <header className="mb-6">
        <p className="text-sm text-ember">Llama 4 Vision</p>
        <h2 className="font-display text-3xl md:text-4xl">صوّر فقعتك</h2>
        <p className="mt-2 max-w-2xl text-sand-dim">زبيدي ولا خلاسي ولا جبي؟ ارفع صورة، و Llama يتعرف على النوع ويقدّر الجودة والسعر التقريبي وينبهك لعلامات التلف.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card flex flex-col gap-4 p-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-sand/20 bg-night/60 transition hover:border-ember"
            aria-label="اختر صورة الفقعة"
          >
            {image
              ? <img src={image} alt="صورة الفقعة المرفوعة" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="flex flex-col items-center gap-2 text-sand-dim"><span className="text-4xl" aria-hidden>📷</span>اضغط للتصوير أو اسحب الصورة هنا</span>}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex gap-2">
            <button type="button" onClick={analyze} disabled={loading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3 font-semibold text-night transition hover:bg-dune disabled:cursor-wait disabled:opacity-70">
              {loading ? <><Spinner /> Llama يفحص الصورة…</> : "تعرّف على الفقعة 🔍"}
            </button>
            {image && !loading && <button type="button" onClick={() => { setImage(null); setResult(null); }} className="rounded-xl border border-sand/15 px-4 text-sm hover:bg-sand/5">صورة ثانية</button>}
          </div>
          {error && <p role="alert" className="rounded-xl border border-rust/40 bg-rust/10 p-3 text-sm text-[#f3b7a6]">{error}</p>}
        </div>

        <div className="card min-h-[300px] p-5" aria-live="polite" aria-busy={loading}>
          {loading && <div className="flex flex-col gap-3"><div className="skeleton h-10 w-1/2" /><div className="skeleton h-20" /><div className="skeleton h-24" /></div>}
          {!loading && !result && (
            <div className="grid h-full gap-3 text-sm text-sand-dim sm:grid-cols-3">
              {[["زبيدي", "أبيض كريمي، الأغلى"], ["خلاسي", "محمر، متوسط إلى غالي"], ["جبي", "داكن، الأرخص"]].map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-night/50 p-4"><b className="font-display text-lg text-sand">{t}</b><p className="mt-1">{d}</p></div>
              ))}
            </div>
          )}
          {!loading && result && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-sand-dim">{result.isTruffle ? "النوع المتوقع" : "النتيجة"}</p>
                  <h3 className="font-display text-3xl text-ember">{result.type}</h3>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl">{Math.round(result.confidence)}٪</div>
                  <div className="text-xs text-sand-dim">ثقة النموذج</div>
                </div>
              </div>
              <p className="leading-8">{result.description}</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-night/50 p-3"><dt className="text-xs text-sand-dim">الجودة</dt><dd className="font-semibold">{result.quality}</dd></div>
                <div className="rounded-xl bg-night/50 p-3"><dt className="text-xs text-sand-dim">السعر التقريبي للكيلو</dt><dd className="font-semibold">{result.priceRangeSar ? `${result.priceRangeSar.min}–${result.priceRangeSar.max} ريال` : "—"}</dd></div>
                <div className="col-span-2 rounded-xl bg-night/50 p-3"><dt className="text-xs text-sand-dim">الطزاجة</dt><dd>{result.freshness}</dd></div>
              </dl>
              {result.warnings.length > 0 && <ul className="grid gap-1 rounded-xl border border-rust/30 bg-rust/10 p-3 text-sm">{result.warnings.map((w) => <li key={w}>⚠️ {w}</li>)}</ul>}
              {result.tips.length > 0 && <ul className="grid gap-1 text-sm text-sand-dim">{result.tips.map((t) => <li key={t}>💡 {t}</li>)}</ul>}
              <p className="text-[11px] text-sand-dim/80">التعرف من الصورة تقديري وقد يخطئ. الأسعار استرشادية وتتغير حسب الموسم والسوق.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
