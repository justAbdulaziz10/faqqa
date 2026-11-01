"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Radar, AreaScore } from "@/lib/radar";
import { arDate, scoreColor, SCALE } from "@/lib/format";
import { RainBars } from "./RainBars";

const RadarMap = dynamic(() => import("./RadarMap"), { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-none" /> });

export function RadarSection({ radar }: { radar: Radar }) {
  const [selectedId, setSelectedId] = useState<string>(radar.areas[0]?.id ?? "");
  const [showAll, setShowAll] = useState(false);
  const selected = radar.areas.find((a) => a.id === selectedId) ?? radar.areas[0];
  const list = showAll ? radar.areas : radar.areas.slice(0, 8);
  const maxRain = Math.max(10, ...radar.areas.map((a) => a.wasmRain));
  const updated = new Date(radar.generatedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

  return (
    <section id="radar" className="scroll-mt-20 mt-16 md:mt-24" aria-labelledby="radar-title">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5">
        <div>
          <h2 id="radar-title" className="font-display text-4xl md:text-5xl">وين شربت الأرض؟</h2>
          <p className="mt-3 max-w-2xl leading-8 text-muted">كل دائرة منطقة فقع معروفة. لونها وحجمها من مؤشر الاحتمال. اضغط أي منطقة تشوف مطرها يوم بيوم.</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted" aria-label="مفتاح الألوان">
          {[...SCALE].reverse().map((s) => (
            <li key={s.label} className="flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full" style={{ background: s.color }} />{s.label}</li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-8 max-w-7xl md:px-5">
        <div className="relative h-[62svh] min-h-[380px] overflow-hidden border-y border-mist md:h-[640px] md:rounded-[18px] md:border">
          <RadarMap areas={radar.areas} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        {selected && (
          <div className="px-5 md:absolute md:left-10 md:top-5 md:z-[500] md:max-h-[calc(100%-2.5rem)] md:w-[380px] md:overflow-y-auto md:px-0">
            <AreaPanel area={selected} />
          </div>
        )}
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-xl font-semibold">الترتيب الحين</h3>
          <p className="text-[13px] text-muted">تحديث {updated}</p>
        </div>
        <ol className="mt-4 divide-y divide-mist/70 border-y border-mist/70">
          {list.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => { setSelectedId(a.id); document.getElementById("radar")?.scrollIntoView({ behavior: "smooth" }); }}
                aria-current={a.id === selectedId}
                className="grid w-full grid-cols-[2rem_1fr_3rem] items-center gap-3 py-3 text-start transition hover:bg-ink-2 md:grid-cols-[2.5rem_14rem_1fr_6rem_3.5rem] md:gap-5 md:px-2"
              >
                <span className="num text-sm text-muted">{i + 1}</span>
                <span>
                  <span className="font-medium">{a.name}</span>
                  <span className="ms-2 text-[13px] text-muted">{a.region}</span>
                </span>
                <span className="hidden h-1.5 overflow-hidden rounded-full bg-mist/60 md:block" aria-hidden>
                  <span className="block h-full rounded-full bg-rain" style={{ width: `${(a.wasmRain / maxRain) * 100}%` }} />
                </span>
                <span className="num hidden text-sm text-muted md:block">{a.wasmRain} ملم</span>
                <span className="num text-end text-lg font-semibold" style={{ color: scoreColor(a.score) }}>{a.score}</span>
              </button>
            </li>
          ))}
        </ol>
        {radar.areas.length > 8 && (
          <button onClick={() => setShowAll((v) => !v)} className="mt-4 text-sm text-cream underline underline-offset-4 hover:text-bolt">
            {showAll ? "اعرض أول 8 فقط" : `اعرض كل المناطق (${radar.areas.length})`}
          </button>
        )}
      </div>
    </section>
  );
}

function AreaPanel({ area }: { area: AreaScore }) {
  return (
    <article className="panel mt-4 flex h-full flex-col gap-4 overflow-y-auto bg-ink-2/95 p-5 backdrop-blur md:mt-0" aria-live="polite">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold">{area.name}</h3>
          <p className="text-sm text-muted">{area.region}</p>
        </div>
        <div className="text-end">
          <div className="num text-4xl font-semibold leading-none" style={{ color: scoreColor(area.score) }}>{area.score}</div>
          <div className="mt-1 text-xs text-muted">{area.label} من 100</div>
        </div>
      </header>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-4 border-y border-mist py-4 text-sm">
        <Stat label="مطر الوسم" value={`${area.wasmRain}`} unit="ملم" />
        <Stat label="أيام رعد" value={`${area.thunderDays}`} />
        <Stat label="رطوبة التربة" value={area.soilMoisture != null ? `${Math.round(area.soilMoisture * 100)}` : "—"} unit={area.soilMoisture != null ? "٪" : undefined} />
        <Stat label="الحرارة" value={area.meanTemp != null ? `${area.meanTemp}` : "—"} unit={area.meanTemp != null ? "°" : undefined} />
        <Stat label="مطر الأسبوع الجاي" value={`${area.forecastRain}`} unit="ملم" />
        <Stat label="أيام ممطرة" value={`${area.rainDays}`} />
      </dl>
      <RainBars daily={area.daily} />
      <p className="text-sm leading-7 text-cream/90">
        {area.emergenceWindow
          ? <>الطلوع المتوقع بين <b className="text-dune">{arDate(area.emergenceWindow.from)}</b> و<b className="text-dune">{arDate(area.emergenceWindow.to)}</b>، بعد 60 إلى 75 يوم من أول مطر فعّال.</>
          : <>ما وصلها مطر فعّال (10 ملم) للحين، فما نتوقع طلوع قريب. تابعها بعد أي منخفض.</>}
      </p>
    </article>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-1 text-lg font-medium">{value}{unit ? <span className="ms-0.5 text-xs text-muted">{unit}</span> : null}</dd>
    </div>
  );
}
