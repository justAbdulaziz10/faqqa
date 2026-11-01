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
  const [retryable, setRetryable] = useState(true);
  const [result, setResult] = useState<IdentifyResult | null>(null);

  async function onFile(file?: File) {
    setError(null); setResult(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { setError("هذي الصيغة ما تنفع. استخدم صورة JPG أو PNG أو WEBP."); return; }
    if (file.size > 15 * 1024 * 1024) { setError("الصورة كبيرة. الحد 15 ميجا."); return; }
    let url: string;
    try { url = await toDataUrl(file); } catch { setError("ما قدرنا نقرأ الصورة. جرب صورة ثانية."); return; }
    setImage(url);
    analyze(url);
  }

  // Picking a photo starts the check; the button only shows to retry after an error.
  async function analyze(image: string) {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/identify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        // Retrying can't help when the daily model quota is used up or the photo itself was rejected.
        setRetryable(!["llama_quota", "invalid_input"].includes(data?.error?.code));
        throw new Error(data?.error?.message ?? "ما قدرنا نفحص الصورة. جرب مرة ثانية.");
      }
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const active = result?.isTruffle && result.type !== "غير محدد" ? result.type : null;

  return (
    <section id="identify" className="mx-auto max-w-7xl scroll-mt-20 px-5 mt-20 md:mt-28" aria-labelledby="identify-title">
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[1.15fr_1fr] lg:grid-rows-[auto_1fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <h2 id="identify-title" className="font-display text-4xl font-bold md:text-5xl">زبيدي ولا خلاسي؟</h2>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="relative mx-auto w-full max-w-[17rem] md:max-w-[22rem]">
          <Bezel spinning={loading} />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
            className="group relative grid aspect-square w-full place-items-center overflow-hidden rounded-full border border-dashed border-mist bg-ink-2 outline-offset-[18px] transition hover:border-cream/50"
            aria-label={image ? "غير الصورة" : "اختر صورة الفقعة"}
          >
            {image
              ? <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                  <img src={image} alt="صورة الفقعة المرفوعة" className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${loading ? "brightness-75 saturate-50" : ""}`} />
                  {loading && <span className="scan absolute inset-0" aria-hidden />}
                </>
              : <span className="flex flex-col items-center gap-3 px-7 text-center">
                  <svg viewBox="0 0 32 32" className="size-9 text-cream transition group-hover:text-bolt" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
                    <path d="M3 10h6l3-5h8l3 5h6v17H3z" /><circle cx="16" cy="17" r="5.5" />
                  </svg>
                  <span className="text-cream">صور الفقعة أو اختر صورة</span>
                  <span className="text-sm text-muted">وحدة بس، قريبة، في ضوء النهار</span>
                </span>}
          </button>
          </div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          <div className="mt-8 flex min-h-12 items-center justify-center gap-5">
            {loading && <p className="flex items-center gap-2 text-sm text-muted"><Spinner /> يفحص الصورة</p>}
            {image && !loading && error && retryable && <button type="button" onClick={() => analyze(image)} className="btn-bolt px-6 py-3">افحصها مرة ثانية</button>}
            {image && !loading && <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-muted underline underline-offset-4 hover:text-cream">صورة ثانية</button>}
          </div>
          {error && <p role="alert" className="mt-4 text-center text-sm text-alert">{error}</p>}
          <div aria-live="polite" aria-busy={loading}>
            {loading && <div className="mt-8 flex flex-col gap-3"><div className="skeleton h-10 w-1/2" /><div className="skeleton h-20" /></div>}
            {!loading && result && (
              <article className="mt-8 border-t border-mist pt-6">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{result.isTruffle ? "النوع" : "النتيجة"}</p>
                    <h3 className="mt-1 font-display text-3xl font-bold">{!result.isTruffle ? "ما هي فقعة" : result.type === "غير محدد" ? "ما قدرنا نحدد نوعها" : result.type}</h3>
                  </div>
                  {result.isTruffle && <p className="text-end text-sm text-muted">متأكد بنسبة<span className="num block text-2xl font-semibold text-cream">{Math.round(result.confidence)}٪</span></p>}
                </div>
                <p className="mt-4 leading-8 text-cream/90">{result.description}</p>
                {!result.isTruffle && <p className="mt-2 text-sm leading-7 text-muted">جرب صورة قريبة لفقعة وحدة، في ضوء النهار، وخلفيتها سادة.</p>}
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

        <SpecimenPlate active={active} />
      </div>
    </section>
  );
}

/** Radar-scope ticks around the photo lens; turns slowly while a photo is being checked. */
function Bezel({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="-110 -110 220 220" className={`pointer-events-none absolute -inset-5 size-[calc(100%+2.5rem)] text-mist ${spinning ? "bezel-spin" : ""}`} aria-hidden>
      {Array.from({ length: 72 }, (_, i) => {
        const major = i % 6 === 0;
        return <line key={i} x1="0" y1={-108} x2="0" y2={major ? -100 : -104} stroke="currentColor" strokeWidth={major ? 1.4 : 0.8} opacity={major ? 0.9 : 0.5} transform={`rotate(${i * 5})`} />;
      })}
      <path d="M0 -108 L-3 -114 L3 -114 Z" className="fill-bolt" />
    </svg>
  );
}

function SpecimenPlate({ active }: { active: string | null }) {
  return (
    <figure className="self-start rounded-[22px] bg-sand px-4 pb-6 pt-8 text-ink lg:col-start-1 lg:row-start-2 md:px-8">
      <div className="grid grid-cols-4 items-end gap-2 border-b-2 border-dotted border-ink/25 pb-1 md:gap-6">
        {TYPES.map((t) => (
          <div key={t.name} className={`flex justify-center transition-opacity duration-500 ${active && active !== t.name ? "opacity-30" : ""}`}>
            <Truffle type={t} />
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-4 gap-2 md:gap-6">
        {TYPES.map((t) => {
          const on = active === t.name;
          return (
            <div key={t.name} className={`text-center transition-opacity duration-500 ${active && !on ? "opacity-40" : ""}`}>
              <dt className="font-display text-lg font-bold md:text-2xl">
                {t.name}
                {on && <span className="mx-auto mt-1 block w-fit rounded-full bg-ink px-2 py-0.5 font-sans text-[11px] font-semibold text-bolt">فقعتك</span>}
              </dt>
              <dd className="mt-1 hidden text-[13px] leading-6 text-ink/70 sm:block">{t.desc}</dd>
              <dd className="num mt-1 text-[12px] font-semibold leading-5 text-ink/80 md:text-[13px]">{t.price}</dd>
            </div>
          );
        })}
      </dl>
      <figcaption className="mt-5 text-center text-[12px] text-ink/60">الأحجام نسبية. الأسعار بالريال للكيلو، تقريبية وتتغير مع الموسم.</figcaption>
    </figure>
  );
}

const BLOBS = [
  "M20 58 C14 40 26 24 44 22 C52 14 68 16 76 28 C88 34 90 52 82 64 C78 78 60 84 46 80 C30 82 18 72 20 58 Z",
  "M18 54 C16 36 32 22 50 24 C66 20 84 32 84 50 C88 66 74 82 56 80 C40 86 22 74 18 54 Z",
  "M24 60 C18 44 30 28 46 30 C56 22 74 28 78 42 C86 54 80 72 64 76 C50 84 30 78 24 60 Z",
  "M22 52 C22 36 36 26 52 28 C68 28 80 40 78 56 C78 70 64 80 50 78 C34 80 22 68 22 52 Z",
];
const SPECKS = [[38, 40], [58, 34], [66, 52], [44, 62], [54, 70], [32, 54], [70, 64]];

function Truffle({ type }: { type: (typeof TYPES)[number] }) {
  const id = `tr-${type.key}`;
  return (
    <svg viewBox="10 10 84 84" style={{ width: `${type.size}%` }} className="h-auto overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={id} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={type.colors[0]} />
          <stop offset="0.6" stopColor={type.colors[1]} />
          <stop offset="1" stopColor={type.colors[2]} />
        </radialGradient>
      </defs>
      <ellipse cx="52" cy="84" rx="30" ry="5" fill="#0f1729" opacity="0.18" />
      <g transform={`rotate(${type.rotate} 52 52)`}>
        <path d={BLOBS[type.blob]} fill={`url(#${id})`} stroke={type.colors[2]} strokeWidth="1.2" />
        {SPECKS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.6} fill={type.colors[2]} opacity="0.55" />)}
        <ellipse cx="40" cy="36" rx="9" ry="5" fill="#fff" opacity="0.18" transform="rotate(-25 40 36)" />
      </g>
    </svg>
  );
}

const TYPES = [
  { key: "zubaidi", name: "زبيدي", desc: "أبيض كريمي وكبير. الأغلى والأطيب.", price: "250 إلى 700", size: 100, blob: 0, rotate: -6, colors: ["#fbf3e2", "#dcc7a0", "#9c8460"] },
  { key: "khalasi", name: "خلاسي", desc: "أحمر مائل للبني.", price: "150 إلى 400", size: 84, blob: 1, rotate: 18, colors: ["#ecbea4", "#a9654a", "#683626"] },
  { key: "jibi", name: "جبي", desc: "داكن وصغير.", price: "50 إلى 150", size: 62, blob: 2, rotate: 60, colors: ["#94806e", "#4d3a2e", "#211710"] },
  { key: "hobar", name: "هبر", desc: "صغير وأبيض، يطلع بدري.", price: "سعره يختلف", size: 46, blob: 3, rotate: 120, colors: ["#f8f0de", "#d6c39d", "#97815b"] },
];
