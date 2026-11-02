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

const STORE = "faqqa-chat";
const MAX_HISTORY = 6;

/** What the model said in a turn, short enough to send back as conversation memory. */
function memoryOf(r: Result) {
  const names = r.recommendations.map((x) => x.area.name);
  return `${r.headline}. ${r.summary}${names.length ? ` رشحت: ${names.join("، ")}.` : ""}`.slice(0, 800);
}

function suggestionsFor(turns: Turn[]) {
  const last = turns.at(-1)?.result;
  const top = last?.recommendations[0]?.area.name;
  const asked = new Set(turns.map((t) => t.q));
  const list = last && top
    ? ["وش آخذ معي للطلعة؟", "فيه مكان أقرب لي؟", `متى أفضل وقت أروح ${top}؟`]
    : EXAMPLES;
  return list.filter((q) => !asked.has(q));
}

export function Advisor({ context = [] }: { context?: AdvisorContext }) {
  const [question, setQuestion] = useState("");
  const { city } = useCity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; q: string } | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // The conversation survives a reload until the user starts a new one.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
        if (Array.isArray(saved?.turns)) setTurns(saved.turns);
      } catch { /* a corrupt or blocked store just means a fresh chat */ }
      setRestored(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      if (turns.length) localStorage.setItem(STORE, JSON.stringify({ turns: turns.slice(-30) }));
      else localStorage.removeItem(STORE);
    } catch { /* private mode: the chat still works, it just won't persist */ }
  }, [turns, restored]);

  // Keep the newest message in view inside the chat, without moving the page.
  useEffect(() => {
    const log = logRef.current;
    if (!log) return;
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (pending || error) log.scrollTo({ top: log.scrollHeight, behavior });
    else if (lastRef.current) log.scrollTo({ top: lastRef.current.offsetTop - 12, behavior });
  }, [turns.length, pending, error, restored]);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || loading) return;
    setLoading(true); setError(null); setPending(q); setQuestion("");
    try {
      const history = turns.slice(-MAX_HISTORY).map((t) => ({ q: t.q.slice(0, 600), a: memoryOf(t.result) }));
      const res = await fetch("/api/advisor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: q, originId: city.id, history }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "ما وصل رد. جرب مرة ثانية.");
      setTurns((t) => [...t, { id: Date.now(), q, result: { ...data.result, fallback: !!data.fallback } }]);
    } catch (err) {
      setError({ message: (err as Error).message, q });
    } finally {
      setLoading(false); setPending(null);
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function reset() {
    setTurns([]); setError(null); setQuestion("");
    inputRef.current?.focus({ preventScroll: true });
  }

  const suggestions = loading || error ? [] : suggestionsFor(turns);
  const empty = !question.trim();

  return (
    <section id="advisor" className="mx-auto mt-20 max-w-7xl scroll-mt-20 px-5 md:mt-28" aria-labelledby="advisor-title">
      <div className="grid gap-16 lg:grid-cols-[minmax(0,48rem)_1fr]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <h2 id="advisor-title" className="font-display text-4xl font-bold md:text-5xl">اسأل فقاع</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <label htmlFor="city-advisor" className="text-muted">طالع من</label>
                <CitySelect id="city-advisor" />
              </span>
              {turns.length > 0 && (
                <button type="button" onClick={reset} disabled={loading} className="text-muted underline-offset-4 hover:text-cream hover:underline disabled:opacity-50">محادثة جديدة</button>
              )}
            </div>
          </div>

          <div className="panel mt-6 flex h-[min(76svh,760px)] min-h-[460px] flex-col overflow-hidden">
            <div ref={logRef} role="log" aria-live="polite" aria-busy={loading} aria-label="المحادثة مع فقاع" className="relative flex-1 space-y-7 overflow-y-auto overscroll-contain px-3 py-5 md:px-6 md:py-6">
              <Said>
                <p className="font-semibold leading-8">هلا، أنا فقاع</p>
                <p className="leading-8 text-cream/85">أقرأ مطر الوسم ورعده في 24 منطقة، وأقول لك وين تروح ومتى. اسألني عن طلعتك، أو عن أنواع الفقع وأسعاره، وكمل السالفة براحتك.</p>
              </Said>

              {turns.map((t, i) => (
                <div key={t.id} ref={i === turns.length - 1 ? lastRef : undefined} className="space-y-5">
                  <Asked q={t.q} />
                  <Answer result={t.result} />
                </div>
              ))}

              {pending && (
                <div className="space-y-5">
                  <Asked q={pending} />
                  <Typing />
                </div>
              )}

              {error && (
                <div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-2 ps-10 text-sm md:ps-15">
                  <span className="text-alert">{error.message}</span>
                  <button type="button" onClick={() => send(error.q)} className="text-cream underline underline-offset-4 hover:text-bolt">جرب مرة ثانية</button>
                </div>
              )}

              {suggestions.length > 0 && (
                <ul className="flex flex-wrap gap-2 ps-10 md:ps-15" aria-label="اقتراحات">
                  {suggestions.map((s) => (
                    <li key={s}>
                      <button type="button" onClick={() => send(s)} className="rounded-full border border-mist px-3.5 py-1.5 text-[13px] text-muted transition hover:border-cream/50 hover:text-cream">{s}</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(question); }} className="border-t border-mist/70 p-3" noValidate>
              <div className="field flex items-end gap-2 p-1.5 ps-3">
                <label htmlFor="q" className="sr-only">رسالتك لفقاع</label>
                <textarea
                  id="q" ref={inputRef} value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} rows={1}
                  placeholder={turns.length ? "كمل السالفة، مثلا: طيب والقصيم؟" : "مثلا: طالعين الخميس ونرجع الجمعة، وين نروح؟"}
                  className="field-sizing-content block max-h-40 min-h-10 w-full resize-none bg-transparent py-1.5 leading-7 outline-none placeholder:text-muted/70"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(question); } }}
                />
                <button type="submit" aria-label="أرسل" disabled={loading || empty} data-empty={empty && !loading ? "" : undefined} className="btn-bolt grid size-10 shrink-0 place-items-center">
                  {loading ? <Spinner /> : <SendIcon />}
                </button>
              </div>
              <p className="mt-2 px-1 text-[11px] text-muted">فقاع يجتهد وقد يخطئ. تأكد من الطقس والطريق قبل تطلع.</p>
            </form>
          </div>
        </div>

        {context.length > 0 && (
          <aside className="sticky top-24 hidden self-start border-s border-mist/70 ps-8 pt-16 lg:block" aria-labelledby="advisor-context">
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
    <p className="ms-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-se-sm bg-cloud px-4 py-2.5 leading-7 text-cream">
      <span className="sr-only">سألت: </span>{q}
    </p>
  );
}

/** One message from Faqqa: the avatar beside plain text, the way chat apps show the assistant. */
function Said({ children }: { children: React.ReactNode }) {
  return (
    <article className="flex gap-2.5 md:gap-4">
      <FaqqaAvatar />
      <div className="min-w-0 flex-1 md:pt-1">{children}</div>
    </article>
  );
}

function Answer({ result }: { result: Result }) {
  return (
    <Said>
      {result.fallback && <p className="mb-1 text-[13px] text-muted">Llama مشغول الحين، فهذا رد سريع من بيانات المطر مباشرة.</p>}
      <p className="font-semibold leading-8">{result.headline}</p>
      <p className="leading-8 text-cream/85">{result.summary}</p>

      {result.recommendations.length > 0 && (
        <ol className="mt-4 divide-y divide-mist/70 rounded-xl border border-mist/70">
          {result.recommendations.map((r) => (
            <li key={r.areaId} className="p-3.5 md:p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-semibold">{r.area.name}</h4>
                <span className="shrink-0 text-sm font-semibold" style={{ color: scoreText(r.area.score) }}>{scoreLabel(r.area.score)}</span>
              </div>
              <p className="num text-[13px] text-muted">{r.area.region}{r.area.distanceKm != null ? `، ${r.area.distanceKm} كم، ${driveHours(r.area.distanceKm)} سواقة` : ""}</p>
              <p className="mt-1.5 leading-7 text-cream/90">{r.why}</p>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted">متى تروح</dt><dd className="leading-6">{r.bestTime}</dd></div>
                <div><dt className="text-muted">نصيحة</dt><dd className="leading-6">{r.tip}</dd></div>
              </dl>
              <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <MapLink id={r.areaId} className="text-rain underline-offset-4 hover:underline">شوفها على الخريطة</MapLink>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${r.area.lat},${r.area.lon}`} target="_blank" rel="noopener noreferrer" className="text-rain underline-offset-4 hover:underline">خذني لها</a>
              </p>
            </li>
          ))}
        </ol>
      )}

      {result.seasonOutlook && <p className="mt-4 text-sm leading-7"><span className="text-muted">عن الموسم: </span>{result.seasonOutlook}</p>}
      {result.safety.length > 0 && (
        <details className="group mt-3 text-sm">
          <summary className="w-fit cursor-pointer text-muted marker:text-dune hover:text-cream">قبل لا تطلع</summary>
          <ul className="mt-2 list-disc space-y-1 ps-5 leading-7 text-cream/80 marker:text-dune">
            {result.safety.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </details>
      )}
    </Said>
  );
}

function Typing() {
  return (
    <Said>
      <p className="flex h-8 items-center gap-1.5" aria-label="فقاع يكتب">
        {[0, 150, 300].map((d) => <span key={d} className="size-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />)}
      </p>
    </Said>
  );
}

function SendIcon() {
  // Points left: in a right-to-left chat, messages travel toward the start of the line.
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

/** The site mark (bolt over a truffle on a dune) as the advisor's face. */
function FaqqaAvatar() {
  return (
    <svg viewBox="0 0 40 40" className="size-8 shrink-0 rounded-full md:size-11" aria-hidden>
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

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
