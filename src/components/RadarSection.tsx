"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { Radar, AreaScore } from "@/lib/radar";
import { distanceKm } from "@/lib/areas";
import { arDate, arDateTime, scoreColor, scoreLabel, SCALE } from "@/lib/format";
import { RainBars } from "./RainBars";
import { CitySelect, useCity } from "./CityProvider";

const RadarMap = dynamic(() => import("./RadarMap"), { ssr: false, loading: () => <div className="skeleton h-full w-full rounded-none" /> });

type Sort = "score" | "near";

export function RadarSection({ radar }: { radar: Radar }) {
  const { city } = useCity();
  const [selectedId, setSelectedId] = useState<string>(radar.areas[0]?.id ?? "");
  const [sort, setSort] = useState<Sort>("score");
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const withKm = radar.areas.map((a) => ({ ...a, km: distanceKm(city, a) }));
    return sort === "near" ? withKm.sort((a, b) => a.km - b.km) : withKm;
  }, [radar.areas, city, sort]);
  const selected = rows.find((a) => a.id === selectedId) ?? rows[0];
  const list = showAll ? rows : rows.slice(0, 8);
  const maxRain = Math.max(10, ...radar.areas.map((a) => a.wasmRain));

  return (
    <section id="radar" className="mt-16 scroll-mt-20 md:mt-24" aria-labelledby="radar-title">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5">
        <div>
          <h2 id="radar-title" className="font-display text-4xl font-bold md:text-5xl">خريطة المطر</h2>
          <p className="mt-3 max-w-xl leading-8 text-muted">كل دائرة منطقة فقع. لونها وحجمها يوضحون الفرصة. اضغط على أي منطقة وتطلع لك تفاصيلها.</p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted" aria-label="الفرصة">
          <li className="text-cream/80">الفرصة:</li>
          {SCALE.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full" style={{ background: s.color }} />{s.label}</li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-8 max-w-7xl md:px-5">
        <div className="relative h-[62svh] min-h-[380px] overflow-hidden border-y border-mist md:h-[640px] md:rounded-[18px] md:border">
          <RadarMap areas={radar.areas} selectedId={selected?.id ?? null} onSelect={setSelectedId} city={city} />
        </div>
        {selected && (
          <div className="px-5 md:absolute md:left-10 md:top-5 md:z-[500] md:max-h-[calc(100%-2.5rem)] md:w-[380px] md:overflow-y-auto md:px-0">
            <AreaPanel area={selected} km={selected.km} cityName={city.name} />
          </div>
        )}
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h3 className="text-xl font-semibold">كل المناطق</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="city-list" className="text-muted">أنا في</label>
            <CitySelect id="city-list" />
            <div role="radiogroup" aria-label="الترتيب" className="flex rounded-lg border border-mist p-0.5">
              {([["score", "الأعلى فرصة"], ["near", "الأقرب لي"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={sort === k}
                  onClick={() => setSort(k)}
                  className={`rounded-md px-3 py-1 transition ${sort === k ? "bg-cloud text-cream" : "text-muted hover:text-cream"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ol className="mt-4 divide-y divide-mist/70 border-y border-mist/70">
          {list.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => { setSelectedId(a.id); document.getElementById("radar")?.scrollIntoView({ behavior: "smooth" }); }}
                aria-current={a.id === selected?.id}
                className="grid w-full grid-cols-[1.75rem_1fr_auto] items-center gap-3 py-3 text-start transition hover:bg-ink-2 md:grid-cols-[2.5rem_15rem_1fr_6rem_6rem_4.5rem] md:gap-5 md:px-2"
              >
                <span className="num text-sm text-muted">{i + 1}</span>
                <span className="min-w-0">
                  <span className="font-medium">{a.name}</span>
                  <span className="ms-2 text-[13px] text-muted">{a.region}</span>
                  <span className="num block text-[12px] text-muted md:hidden">{kmText(a.km)}، {a.wasmRain} ملم</span>
                </span>
                <span className="hidden h-1.5 overflow-hidden rounded-full bg-mist/60 md:block" aria-hidden>
                  <span className="block h-full rounded-full bg-rain" style={{ width: `${(a.wasmRain / maxRain) * 100}%` }} />
                </span>
                <span className="num hidden text-sm text-muted md:block">{a.wasmRain} ملم</span>
                <span className="num hidden text-sm text-muted md:block">{kmText(a.km)}</span>
                <span className="text-end text-sm font-semibold" style={{ color: scoreColor(a.score) }}>{scoreLabel(a.score)}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13px] text-muted">
          {rows.length > 8 ? (
            <button onClick={() => setShowAll((v) => !v)} className="text-sm text-cream underline underline-offset-4 hover:text-bolt">
              {showAll ? "عرض أقل" : `عرض كل المناطق (${rows.length})`}
            </button>
          ) : <span />}
          <span>آخر تحديث: {arDateTime(radar.generatedAt)}. المسافات تقريبية بالسيارة.</span>
        </div>
      </div>
    </section>
  );
}

function AreaPanel({ area, km, cityName }: { area: AreaScore; km: number; cityName: string }) {
  return (
    <article className="panel mt-4 flex flex-col gap-4 bg-ink-2/95 p-5 backdrop-blur md:mt-0" aria-live="polite">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl font-bold">{area.name}</h3>
          <p className="text-sm text-muted">{area.region}، {km < 15 ? <>قريبة من {cityName}</> : <>تبعد عن {cityName} <span className="num">{km}</span> كم</>}</p>
        </div>
        <div className="text-end">
          <div className="text-xs text-muted">الفرصة</div>
          <div className="mt-0.5 text-xl font-semibold" style={{ color: scoreColor(area.score) }}>{scoreLabel(area.score)}</div>
          <div className="num text-xs text-muted">{area.score} من 100</div>
        </div>
      </header>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-4 border-y border-mist py-4 text-sm">
        <Stat label="مطر الوسم" value={`${area.wasmRain}`} unit="ملم" />
        <Stat label="أيام الرعد" value={`${area.thunderDays}`} />
        <Stat label="أيام المطر" value={`${area.rainDays}`} />
        <Stat label="رطوبة التربة" value={area.soilMoisture != null ? `${Math.round(area.soilMoisture * 100)}` : "-"} unit={area.soilMoisture != null ? "٪" : undefined} />
        <Stat label="الحرارة" value={area.meanTemp != null ? `${area.meanTemp}` : "-"} unit={area.meanTemp != null ? "°" : undefined} />
        <Stat label="متوقع هالأسبوع" value={`${area.forecastRain}`} unit="ملم" />
      </dl>
      <RainBars daily={area.daily} />
      <p className="text-sm leading-7 text-cream/90">
        {area.emergenceWindow
          ? <>الفقع متوقع هنا بين <b className="text-dune">{arDate(area.emergenceWindow.from)}</b> و<b className="text-dune">{arDate(area.emergenceWindow.to)}</b>.</>
          : <>ما نزل عليها مطر كافي للحين، فما نتوقع فقع قريب.</>}
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${area.lat},${area.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-bolt px-4 py-2 font-semibold text-ink transition hover:brightness-95"
        >
          خذني لها
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText(area))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-mist px-4 py-2 transition hover:border-cream/50"
        >
          أرسلها لربعك
        </a>
      </div>
    </article>
  );
}

function shareText(area: AreaScore) {
  const when = area.emergenceWindow ? ` الفقع متوقع بين ${arDate(area.emergenceWindow.from)} و${arDate(area.emergenceWindow.to)}.` : "";
  return `${area.name} (${area.region}): فرصة الفقع ${scoreLabel(area.score)}.${when}\nhttps://faqqa.vercel.app/#radar`;
}

const kmText = (km: number) => (km < 15 ? "قريبة منك" : `${km} كم`);

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-1 text-lg font-medium">{value}{unit ? <span className="ms-0.5 text-xs text-muted">{unit}</span> : null}</dd>
    </div>
  );
}
