"use client";

import { useEffect, useState } from "react";
import type { Advisor as AdvisorResult } from "@/lib/schemas";
import { driveHours, scoreText, scoreLabel } from "@/lib/format";
import { CitySelect, useCity } from "./CityProvider";

type Rec = AdvisorResult["recommendations"][number] & {
  area: { id: string; name: string; region: string; lat: number; lon: number; score: number; label: string; distanceKm: number | null };
};
type Result = Omit<AdvisorResult, "recommendations"> & { recommendations: Rec[]; fallback?: boolean };

const EXAMPLES = [
  "وين أقرب مكان فيه أمل هالويكند؟",
  "متى يبدأ الفقع هالسنة؟",
  "أبغى زبيدي، وين أروح؟",
];

export type AdvisorContext = { id: string; name: string; region: string; score: number; wasmRain: number; thunderDays: number }[];

export function Advisor({ context = [] }: { context?: AdvisorContext }) {
  const [question, setQuestion] = useState("");
  const { city } = useCity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e?: React.FormEvent, q = question) {
    e?.preventDefault();
    if (!q.trim()) { setError("اكتب سؤالك أو اختر مثال من تحت."); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/advisor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, originId: city.id }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "ما وصل رد. جرب مرة ثانية.");
      setResult({ ...data.result, fallback: !!data.fallback });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const examples = (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="أمثلة">
      {EXAMPLES.map((ex) => (
        <li key={ex}>
          <button type="button" onClick={() => { setQuestion(ex); submit(undefined, ex); }} className="rounded-full border border-mist px-3.5 py-1.5 text-[13px] text-muted transition hover:border-cream/50 hover:text-cream">{ex}</button>
        </li>
      ))}
    </ul>
  );

  return (
    <section id="advisor" className="mx-auto max-w-7xl scroll-mt-20 px-5 mt-20 md:mt-28" aria-labelledby="advisor-title">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,48rem)_1fr]">
      <div>
      <h2 id="advisor-title" className="font-display text-4xl font-bold md:text-5xl">اسأل فقاع</h2>
      <p className="mt-3 leading-8 text-muted">اسأل عن طلعتك، ويرد عليك Llama بخطة مبنية على مطر اليوم في كل المناطق.</p>

      <form onSubmit={submit} className="field mt-8 p-2" noValidate>
        <label htmlFor="q" className="sr-only">سؤالك</label>
        <textarea
          id="q" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} rows={3}
          placeholder="مثلا: طالعين الخميس ونرجع الجمعة، وين نروح؟"
          aria-invalid={!!error && !question.trim()}
          aria-describedby={error ? "advisor-error" : undefined}
          className="block w-full resize-none bg-transparent px-3 py-2 text-lg leading-8 outline-none placeholder:text-muted/70"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 px-2 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="city-advisor" className="text-muted">طالع من</label>
            <CitySelect id="city-advisor" />
          </div>
          <button type="submit" disabled={loading} className="btn-bolt flex items-center gap-2 px-5 py-2.5 text-sm">
            {loading ? <><Spinner /> يفكر</> : "اسأل"}
          </button>
        </div>
      </form>

      {!result && !loading && examples}

      {error && <p id="advisor-error" role="alert" className="mt-4 text-sm text-alert">{error}</p>}

      <div aria-live="polite" aria-busy={loading}>
        {loading && <Loading city={city.name} />}
        {!loading && result && (result.kind === "reply" ? <><Reply result={result} />{examples}</> : <Plan result={result} />)}
      </div>
      </div>

      {context.length > 0 && (
        <aside className="hidden self-start border-s border-mist/70 ps-8 pt-28 lg:block" aria-label="البيانات اللي يقرأها فقاع">
          <p className="text-sm text-muted">قبل ما يرد، يقرأ فقاع مطر كل المناطق. الأعلى الحين:</p>
          <ol className="mt-4 space-y-4">
            {context.map((a) => (
              <li key={a.id}>
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-sm font-semibold" style={{ color: scoreText(a.score) }}>{scoreLabel(a.score)}</span>
                </p>
                <p className="num text-[13px] text-muted">{a.region}، {a.wasmRain} ملم{a.thunderDays === 1 ? "، يوم رعد" : a.thunderDays === 2 ? "، يومين رعد" : a.thunderDays > 2 ? `، ${a.thunderDays} أيام رعد` : ""}</p>
              </li>
            ))}
          </ol>
        </aside>
      )}
      </div>
    </section>
  );
}

function Reply({ result }: { result: Result }) {
  return (
    <article className="mt-8 flex gap-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cloud" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5 text-bolt" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>
      </span>
      <div className="min-w-0 rounded-2xl rounded-ss-sm bg-ink-2 px-5 py-4 ring-1 ring-mist/70">
        <h3 className="font-semibold leading-8">{result.headline}</h3>
        <p className="mt-1 leading-8 text-cream/85">{result.summary}</p>
      </div>
    </article>
  );
}

function Plan({ result }: { result: Result }) {
  return (
    <article className="mt-10">
      {result.fallback
        ? <p className="text-sm text-muted">Llama مشغول الحين، فهذا رد سريع من بيانات المطر مباشرة.</p>
        : <p className="text-sm text-muted">ثقة الرد: {result.confidence}</p>}
      <h3 className="mt-2 text-2xl font-semibold leading-snug md:text-3xl">{result.headline}</h3>
      <p className="mt-3 text-lg leading-9 text-cream/90">{result.summary}</p>

      <ol className="mt-8 border-t border-mist">
        {result.recommendations.map((r) => (
          <li key={r.areaId} className="grid gap-3 border-b border-mist py-6 md:grid-cols-[1fr_auto]">
            <div>
              <h4 className="text-xl font-semibold">{r.area.name}<span className="ms-2 text-sm font-normal text-muted">{r.area.region}{r.area.distanceKm != null ? `، ${r.area.distanceKm} كم، ${driveHours(r.area.distanceKm)} سواقة` : ""}</span></h4>
              <p className="mt-2 leading-8 text-cream/90">{r.why}</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">متى تروح</dt><dd className="leading-7">{r.bestTime}</dd></div>
                <div><dt className="text-muted">نصيحة</dt><dd className="leading-7">{r.tip}</dd></div>
              </dl>
              <a href={`https://www.google.com/maps/search/?api=1&query=${r.area.lat},${r.area.lon}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-rain underline-offset-4 hover:underline">افتح المكان في خرائط قوقل</a>
            </div>
            <div className="md:text-end">
              <div className="text-xs text-muted">الفرصة</div>
              <div className="text-xl font-semibold" style={{ color: scoreText(r.area.score) }}>{scoreLabel(r.area.score)}</div>
            </div>
          </li>
        ))}
      </ol>

      {result.seasonOutlook && <p className="mt-6 leading-8"><span className="text-muted">عن الموسم: </span>{result.seasonOutlook}</p>}
      <ul className="mt-4 list-disc space-y-1 ps-5 text-sm leading-7 text-muted marker:text-dune">
        {result.safety.map((s) => <li key={s}>{s}</li>)}
      </ul>
      <p className="mt-6 text-xs text-muted">الرد من الذكاء الاصطناعي وقد يخطئ. تأكد من الطقس والطريق قبل الطلعة.</p>
    </article>
  );
}

function Loading({ city }: { city: string }) {
  const steps = ["يقرأ مطر الوسم في 24 منطقة", `يحسب المسافة من ${city}`, "يقارن الرعد ورطوبة التربة", "يكتب لك الجواب"];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 1800);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="mt-10 flex flex-col gap-3">
      <ol className="flex flex-col gap-1.5 text-sm" aria-hidden>
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-2 transition-colors duration-300 ${i < step ? "text-muted" : i === step ? "text-cream" : "text-muted/40"}`}>
            <span className={`size-1.5 rounded-full ${i < step ? "bg-rain" : i === step ? "animate-pulse bg-bolt" : "bg-mist"}`} />
            {s}
          </li>
        ))}
      </ol>
      <p className="sr-only">فقاع يجهز الجواب</p>
      <div className="skeleton mt-2 h-8 w-2/3" />
      <div className="skeleton h-20 w-full" />
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
