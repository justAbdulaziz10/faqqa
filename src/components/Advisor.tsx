"use client";

import { useState } from "react";
import { ORIGINS } from "@/lib/areas";
import type { Advisor as AdvisorResult } from "@/lib/schemas";
import { scoreColor } from "@/lib/format";

type Rec = AdvisorResult["recommendations"][number] & {
  area: { id: string; name: string; region: string; lat: number; lon: number; score: number; label: string; distanceKm: number | null };
};
type Result = Omit<AdvisorResult, "recommendations"> & { recommendations: Rec[] };

const EXAMPLES = [
  "طالعين الخميس العصر ونرجع الجمعة، وين أقرب مكان فيه أمل؟",
  "متى يبدأ يطلع الفقع هالسنة؟",
  "أبي زبيدي، وش أفضل منطقة الحين؟",
];

export function Advisor() {
  const [question, setQuestion] = useState("");
  const [originId, setOriginId] = useState("riyadh");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e?: React.FormEvent, q = question) {
    e?.preventDefault();
    if (!q.trim()) { setError("اكتب سؤالك أول، أو اختر واحد من الأمثلة."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/advisor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, originId }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "ما وصلنا رد. جرّب مرة ثانية.");
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="advisor" className="mx-auto max-w-3xl scroll-mt-28 px-5 pt-28" aria-labelledby="advisor-title">
      <h2 id="advisor-title" className="font-display text-4xl md:text-5xl">اسأل فقّاع</h2>
      <p className="mt-3 leading-8 text-muted">اكتب سؤالك بالعامية. Meta Llama 4 يقرأ أرقام اليوم لكل المناطق ويرد عليك بخطة طلعة.</p>

      <form onSubmit={submit} className="field mt-8 p-2" noValidate>
        <label htmlFor="q" className="sr-only">سؤالك</label>
        <textarea
          id="q" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} rows={3}
          placeholder="مثلاً: طالعين الويكند، وين احتمال الفقع أعلى؟"
          aria-invalid={!!error && !question.trim()}
          aria-describedby={error ? "advisor-error" : undefined}
          className="block w-full resize-none bg-transparent px-3 py-2 text-lg leading-8 outline-none placeholder:text-muted/70"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 px-2 pt-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            طالع من
            <select value={originId} onChange={(e) => setOriginId(e.target.value)} className="rounded-lg bg-cloud px-2 py-1.5 text-cream outline-none focus-visible:ring-2 focus-visible:ring-bolt">
              {ORIGINS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <button type="submit" disabled={loading} className="btn-bolt flex items-center gap-2 px-5 py-2.5 text-sm">
            {loading ? <><Spinner /> يحلل الأرقام</> : "اسأل"}
          </button>
        </div>
      </form>

      {!result && !loading && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="أمثلة">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <button type="button" onClick={() => { setQuestion(ex); submit(undefined, ex); }} className="rounded-full border border-mist px-3.5 py-1.5 text-[13px] text-muted transition hover:border-cream/50 hover:text-cream">{ex}</button>
            </li>
          ))}
        </ul>
      )}

      {error && <p id="advisor-error" role="alert" className="mt-4 text-sm text-alert">{error}</p>}

      <div aria-live="polite" aria-busy={loading}>
        {loading && <Loading />}
        {!loading && result && <Plan result={result} />}
      </div>
    </section>
  );
}

function Plan({ result }: { result: Result }) {
  return (
    <article className="mt-10">
      <p className="text-sm text-muted">ثقة Llama: {result.confidence}</p>
      <h3 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">{result.headline}</h3>
      <p className="mt-3 text-lg leading-9 text-cream/90">{result.summary}</p>

      <ol className="mt-8 border-t border-mist">
        {result.recommendations.map((r) => (
          <li key={r.areaId} className="grid gap-3 border-b border-mist py-6 md:grid-cols-[1fr_auto]">
            <div>
              <h4 className="text-xl font-semibold">{r.area.name}<span className="ms-2 text-sm font-normal text-muted">{r.area.region}{r.area.distanceKm != null ? `، تقريباً ${r.area.distanceKm} كم` : ""}</span></h4>
              <p className="mt-2 leading-8 text-cream/90">{r.why}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">متى</dt><dd className="leading-7">{r.bestTime}</dd></div>
                <div><dt className="text-muted">نصيحة</dt><dd className="leading-7">{r.tip}</dd></div>
              </dl>
              <a href={`https://www.google.com/maps/search/?api=1&query=${r.area.lat},${r.area.lon}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-rain underline-offset-4 hover:underline">افتح الموقع التقريبي في الخرائط</a>
            </div>
            <div className="num text-4xl font-semibold md:text-end" style={{ color: scoreColor(r.area.score) }}>{r.area.score}<span className="ms-1 text-sm font-normal text-muted">/100</span></div>
          </li>
        ))}
      </ol>

      <p className="mt-6 leading-8"><span className="text-muted">الموسم: </span>{result.seasonOutlook}</p>
      <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-muted marker:text-dune">
        {result.safety.map((s) => <li key={s}>{s}</li>)}
      </ul>
      <p className="mt-6 text-xs text-muted">رد مولّد بالذكاء الاصطناعي من أرقام تقديرية، وليس دقيقاً 100٪. تأكد من الطقس والطريق قبل تطلع.</p>
    </article>
  );
}

function Loading() {
  return (
    <div className="mt-10 flex flex-col gap-3">
      <p className="text-sm text-muted">Llama يقرأ مطر كل منطقة ويوزن المسافة…</p>
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-32 w-full" />
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
