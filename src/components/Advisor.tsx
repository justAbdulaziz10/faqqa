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
  "أبي أروح للزبيدي، وش أفضل منطقة الحين؟",
];

export function Advisor() {
  const [question, setQuestion] = useState("");
  const [originId, setOriginId] = useState("riyadh");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!question.trim()) { setError("اكتب سؤالك أولاً 👆"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch("/api/advisor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, originId }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error?.message ?? "تعذر الحصول على رد. حاول مرة ثانية.");
      setResult(data.result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="advisor" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24">
      <header className="mb-6">
        <p className="text-sm text-ember">مدعوم بـ Meta Llama 4</p>
        <h2 className="font-display text-3xl md:text-4xl">اسأل فقّاع</h2>
        <p className="mt-2 max-w-2xl text-sand-dim">اكتب سؤالك بالعامية، و Llama يقرأ بيانات المناخ الحية لكل المناطق ويعطيك خطة طلعة مبنية على الأرقام.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submit} className="card flex flex-col gap-4 p-5" noValidate>
          <label className="text-sm font-medium" htmlFor="origin">مدينتك</label>
          <select id="origin" value={originId} onChange={(e) => setOriginId(e.target.value)} className="rounded-xl border border-sand/15 bg-night px-3 py-3 outline-none focus:border-ember">
            {ORIGINS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <label className="text-sm font-medium" htmlFor="q">سؤالك</label>
          <textarea
            id="q" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={600} rows={5}
            placeholder="مثال: طالعين الويكند من الرياض، وين احتمال الفقع أعلى؟"
            aria-invalid={!!error && !question.trim()}
            className="resize-none rounded-xl border border-sand/15 bg-night px-3 py-3 leading-7 outline-none placeholder:text-sand-dim/60 focus:border-ember"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} onClick={() => setQuestion(ex)} className="rounded-full border border-sand/15 px-3 py-1.5 text-xs text-sand-dim hover:border-ember hover:text-sand">{ex}</button>
            ))}
          </div>
          <button type="submit" disabled={loading} className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-ember px-5 py-3 font-semibold text-night transition hover:bg-dune disabled:cursor-wait disabled:opacity-70">
            {loading ? <><Spinner /> Llama يحلل البيانات…</> : "حلّل واقترح لي ✨"}
          </button>
          {error && <p role="alert" className="rounded-xl border border-rust/40 bg-rust/10 p-3 text-sm text-[#f3b7a6]">{error}</p>}
        </form>

        <div className="card min-h-[340px] p-5" aria-live="polite" aria-busy={loading}>
          {loading && <Loading />}
          {!loading && !result && (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-sand-dim">
              <span className="text-5xl" aria-hidden>🍄</span>
              <p>هنا بتظهر خطة طلعتك: أفضل المناطق، والتوقيت، ونصائح السلامة.</p>
            </div>
          )}
          {!loading && result && <AdvisorView result={result} />}
        </div>
      </div>
    </section>
  );
}

function AdvisorView({ result }: { result: Result }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-sand-dim">
          <span className="rounded-full bg-sand/10 px-2 py-0.5">ثقة {result.confidence}</span>
          <span>Llama 4 Scout</span>
        </div>
        <h3 className="font-display text-2xl text-ember">{result.headline}</h3>
        <p className="mt-2 leading-8">{result.summary}</p>
      </div>
      <ol className="grid gap-3">
        {result.recommendations.map((r, i) => (
          <li key={r.areaId} className="rounded-2xl border border-sand/10 bg-night/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-ember/15 font-display text-ember">{i + 1}</span>
                <div>
                  <h4 className="font-semibold">{r.area.name}</h4>
                  <p className="text-xs text-sand-dim">{r.area.region}{r.area.distanceKm != null ? ` · تقريباً ${r.area.distanceKm} كم بالسيارة` : ""}</p>
                </div>
              </div>
              <span className="font-display text-2xl" style={{ color: scoreColor(r.area.score) }}>{r.area.score}</span>
            </div>
            <p className="mt-3 text-sm leading-7">{r.why}</p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-lg bg-sand/5 p-2">⏰ {r.bestTime}</p>
              <p className="rounded-lg bg-sand/5 p-2">💡 {r.tip}</p>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${r.area.lat},${r.area.lon}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-dune underline-offset-4 hover:underline">افتح الموقع التقريبي في الخرائط ↗</a>
          </li>
        ))}
      </ol>
      <p className="rounded-xl bg-moss/10 p-3 text-sm leading-7">🌦️ {result.seasonOutlook}</p>
      <ul className="grid gap-1 text-sm text-sand-dim">
        {result.safety.map((s) => <li key={s}>⚠️ {s}</li>)}
      </ul>
      <p className="text-[11px] text-sand-dim/80">تقدير تقريبي من نموذج تجريبي وليس دقيقاً ١٠٠٪. تأكد دائماً من حالة الطقس والطرق قبل الطلعة.</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-sm text-ember"><Spinner /> نجمع أمطار الوسم والرعد ورطوبة التربة… و Llama يفكر</p>
      <div className="skeleton h-8 w-2/3" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-28 w-full" />
      <div className="skeleton h-28 w-full" />
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}
