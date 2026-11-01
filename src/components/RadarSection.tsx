"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Radar } from "@/lib/radar";
import { arDate, scoreColor } from "@/lib/format";
import { RainBars } from "./RainBars";

const RadarMap = dynamic(() => import("./RadarMap"), { ssr: false, loading: () => <div className="skeleton h-full w-full" /> });

export function RadarSection({ radar }: { radar: Radar }) {
  const [selectedId, setSelectedId] = useState<string>(radar.areas[0]?.id ?? "");
  const selected = radar.areas.find((a) => a.id === selectedId) ?? radar.areas[0];

  return (
    <section id="radar" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-20">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ember">الرادار الحي</p>
          <h2 className="font-display text-3xl md:text-4xl">خريطة احتمال الفقع</h2>
          <p className="mt-2 max-w-2xl text-sand-dim">
            كل دائرة منطقة فقع معروفة. اللون والحجم = مؤشر الاحتمال من ١٠٠ حسب أمطار الوسم والرعد ورطوبة التربة والحرارة. اضغط أي منطقة للتفاصيل.
          </p>
        </div>
        <p className="text-xs text-sand-dim">آخر تحديث: {new Date(radar.generatedAt).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" })}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card relative h-[420px] overflow-hidden md:h-[540px]">
          <RadarMap areas={radar.areas} selectedId={selectedId} onSelect={setSelectedId} />
          <div className="pointer-events-none absolute bottom-3 right-3 z-[500] flex gap-2 rounded-full bg-night/85 px-3 py-1.5 text-[11px]">
            {[["ممتاز", 80], ["واعد", 50], ["ضعيف", 30], ["شبه معدوم", 0]].map(([l, s]) => (
              <span key={l} className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-full" style={{ background: scoreColor(s as number) }} />{l}</span>
            ))}
          </div>
        </div>

        {selected && (
          <article className="card flex flex-col gap-5 p-5" aria-live="polite">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-sand-dim">{selected.region}</p>
                <h3 className="font-display text-2xl">{selected.name}</h3>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl" style={{ color: scoreColor(selected.score) }}>{selected.score}</div>
                <div className="text-xs text-sand-dim">{selected.label}</div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="أمطار الوسم" value={`${selected.wasmRain} ملم`} />
              <Stat label="أيام الرعد" value={`${selected.thunderDays}`} />
              <Stat label="رطوبة التربة" value={selected.soilMoisture != null ? `${Math.round(selected.soilMoisture * 100)}٪` : "—"} />
              <Stat label="متوسط الحرارة" value={selected.meanTemp != null ? `${selected.meanTemp}°` : "—"} />
              <Stat label="مطر متوقع (٧ أيام)" value={`${selected.forecastRain} ملم`} />
              <Stat label="أيام ممطرة" value={`${selected.rainDays}`} />
            </dl>
            <RainBars daily={selected.daily} />
            <p className="rounded-xl bg-night/60 p-3 text-sm leading-7">
              {selected.emergenceWindow
                ? <>🍄 الطلوع المتوقع تقريباً بين <b className="text-ember">{arDate(selected.emergenceWindow.from)}</b> و <b className="text-ember">{arDate(selected.emergenceWindow.to)}</b> (٦٠–٧٥ يوماً بعد أول مطر وسم فعّال).</>
                : <>⏳ ما نزل مطر وسم فعّال (١٠ ملم) على المنطقة للحين، فالطلوع غير متوقع قريباً. تابع الرادار بعد أي منخفض.</>}
            </p>
          </article>
        )}
      </div>

      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {radar.areas.slice(0, 12).map((a, i) => (
          <li key={a.id}>
            <button
              onClick={() => setSelectedId(a.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition ${a.id === selectedId ? "border-ember bg-ember/10" : "border-sand/10 hover:bg-sand/5"}`}
            >
              <span className="truncate"><span className="text-sand-dim">{i + 1}.</span> {a.name}</span>
              <span className="font-semibold" style={{ color: scoreColor(a.score) }}>{a.score}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-night/50 p-3">
      <dt className="text-xs text-sand-dim">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
