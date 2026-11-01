"use client";

import { useEffect, useRef, useState } from "react";
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

type Turn = { id: number; q: string; result: Result };

export function Advisor({ context = [] }: { context?: AdvisorContext }) {
  const [question, setQuestion] = useState("");
  const { city } = useCity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const last = turns.at(-1);

  useEffect(() => {
    if (!turns.length && !pending) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    latestRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [turns.length, pending]);

  async function submit(e?: React.FormEvent, q = question) {
    e?.preventDefault();
    q = q.trim();
    if (!q) { setError("اكتب سؤالك أو اختر مثال من تحت."); return; }
    setLoading(true); setError(null); setPending(q);
    try {
      const history = turns.slice(-3).map((t) => ({ q: t.q.slice(0, 600), a: `${t.result.headline}. ${t.result.summary}`.slice(0, 800) }));
      const res = await fetch("/api/advisor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, originId: city.id, history }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "ما وصل رد. جرب مرة ثانية.");
      setTurns((t) => [...t, { id: Date.now(), q, result: { ...data.result, fallback: !!data.fallback } }]);
      setQuestion("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false); setPending(null);
    }
  }

  function reset() {
    setTurns([]); setError(null); setQuestion("");
    inputRef.current?.focus();
  }

  const examples = (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="أمثلة">
      {EXAMPLES.map((ex) => (
        <li key={ex}>
          <button type="button" disabled={loading} onClick={() => { setQuestion(ex); submit(undefined, ex); }} className="rounded-full border border-mist px-3.5 py-1.5 text-[13px] text-muted transition hover:border-cream/50 hover:text-cream disabled:opacity-50">{ex}</button>
        </li>
      ))}
    </ul>
  );

  const form = (
    <form onSubmit={submit} className="field mt-8 p-2" noValidate>
      <label htmlFor="q" className="sr-only">{turns.length ? "سؤالك التالي" : "سؤالك"}</label>
      <textarea
        id="q" ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} rows={turns.length ? 2 : 3}
        placeholder={turns.length ? "كمل السالفة، مثلا: طيب والقصيم؟" : "مثلا: طالعين الخميس ونرجع الجمعة، وين نروح؟"}
        aria-invalid={!!error && !question.trim()}
        aria-describedby={error ? "advisor-error" : undefined}
        className="block w-full resize-none bg-transparent px-3 py-2 text-lg leading-8 outline-none placeholder:text-muted/70"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!loading) submit(); } }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist/70 px-2 pt-2">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="city-advisor" className="text-muted">طالع من</label>
          <CitySelect id="city-advisor" />
        </div>
        <div className="flex items-center gap-3">
          {turns.length > 0 && !loading && (
            <button type="button" onClick={reset} className="text-sm text-muted underline-offset-4 hover:text-cream hover:underline">سؤال جديد</button>
          )}
          <button type="submit" disabled={loading} className="btn-bolt flex items-center gap-2 px-5 py-2.5 text-sm">
            {loading ? <><Spinner /> يفكر</> : "اسأل"}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <section id="advisor" className="mx-auto max-w-7xl scroll-mt-20 px-5 mt-20 md:mt-28" aria-labelledby="advisor-title">
      <h2 id="advisor-title" className="font-display text-4xl font-bold md:text-5xl">اسأل فقاع</h2>
      <div className="grid gap-16 lg:grid-cols-[minmax(0,48rem)_1fr]">
      <div>

      <Bubble>
        <p className="font-semibold leading-8">هلا، أنا فقاع</p>
        <p className="mt-1 leading-8 text-cream/85">أقرأ مطر الوسم ورعده في 24 منطقة، وأقول لك وين تروح ومتى. اسألني عن طلعتك، أو عن أنواع الفقع وأسعاره.</p>
      </Bubble>

      {!turns.length && !pending && <>{form}{!error && examples}</>}

      <div aria-live="polite" aria-busy={loading}>
        {turns.map((t) => {
          const isLast = t === last && !pending;
          return (
            <div key={t.id} ref={isLast ? latestRef : undefined} className="scroll-mt-24">
              <Asked q={t.q} />
              {t.result.kind === "reply" || !isLast ? <Reply result={t.result} /> : <Plan result={t.result} />}
            </div>
          );
        })}
        {pending && (
          <div ref={latestRef} className="scroll-mt-24">
            <Asked q={pending} />
            <Loading city={city.name} />
          </div>
        )}
      </div>

      {error && <p id="advisor-error" role="alert" className="mt-4 text-sm text-alert">{error}</p>}

      {(turns.length > 0 || pending) && (
        <>
          {form}
          {last?.result.kind === "reply" && !loading && examples}
        </>
      )}
      </div>

      {context.length > 0 && (
        <aside className="sticky top-24 hidden self-start border-s border-mist/70 ps-8 pt-6 lg:block" aria-labelledby="advisor-context">
          <h3 id="advisor-context" className="text-sm font-semibold text-muted">الأعلى فرصة الحين</h3>
          <ol className="mt-5 space-y-5">
            {context.map((a) => (
              <li key={a.id}>
                <p className="flex items-baseline justify-between gap-3">
                  <MapLink id={a.id} className="font-medium underline-offset-4 hover:underline">{a.name}</MapLink>
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

function Asked({ q }: { q: string }) {
  return (
    <p className="mt-10 ms-auto w-fit max-w-[85%] rounded-2xl rounded-se-sm bg-cloud px-4 py-2.5 leading-7 text-cream">
      <span className="sr-only">سألت: </span>{q}
    </p>
  );
}

function Reply({ result }: { result: Result }) {
  return (
    <Bubble>
      <h3 className="font-semibold leading-8">{result.headline}</h3>
      <p className="mt-1 leading-8 text-cream/85">{result.summary}</p>
    </Bubble>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <article className="mt-6 flex gap-3 md:gap-4">
      <FaqqaAvatar />
      <div className="min-w-0 rounded-2xl rounded-ss-sm bg-ink-2 px-5 py-4 ring-1 ring-mist/70">{children}</div>
    </article>
  );
}

/** The site mark (bolt over a truffle on a dune) as the advisor's face. */
function FaqqaAvatar() {
  return (
    <svg viewBox="0 0 40 40" className="size-10 shrink-0 rounded-full md:size-11" aria-hidden>
      <rect width="40" height="40" fill="#1c2944" />
      <path d="M23.5 6 16.5 17h5L17.5 25l9-12h-5.4L24.5 6z" fill="#f4e7a1" />
      <path d="M0 33c7-4 12-5 20-5s13 1 20 5v7H0z" fill="#e0794a" />
      <ellipse cx="20" cy="30" rx="7.5" ry="5.2" fill="#efe7d6" />
    </svg>
  );
}

/** Opens an area on the radar map in place; still a real link for new tabs and no-JS. */
function MapLink({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={`/?area=${id}#radar`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        dispatchEvent(new CustomEvent("faqqa:area", { detail: id }));
      }}
      className={className}
    >
      {children}
    </a>
  );
}

function Plan({ result }: { result: Result }) {
  return (
    <article className="mt-6">
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
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <MapLink id={r.areaId} className="text-rain underline-offset-4 hover:underline">شوفها على الخريطة</MapLink>
                <a href={`https://www.google.com/maps/search/?api=1&query=${r.area.lat},${r.area.lon}`} target="_blank" rel="noopener noreferrer" className="text-rain underline-offset-4 hover:underline">افتحها في خرائط قوقل</a>
              </p>
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
    <div className="mt-6 flex flex-col gap-3">
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
