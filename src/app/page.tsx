import Link from "next/link";
import { getRadar, type Radar } from "@/lib/radar";
import { arDate } from "@/lib/format";
import { RadarSection } from "@/components/RadarSection";
import { Advisor } from "@/components/Advisor";
import { Identify } from "@/components/Identify";
import { SeasonTimeline, type SeasonDay } from "@/components/SeasonTimeline";
import { CityProvider } from "@/components/CityProvider";
import { FieldGuide } from "@/components/FieldGuide";
import { SITE } from "@/lib/site";

const DAY = 86_400_000;

/** Heaviest rain per day across all grounds, so the season strip shows the whole region. */
function seasonDays(radar: Radar): SeasonDay[] {
  const byDate = new Map<string, SeasonDay>();
  for (const a of radar.areas) {
    for (const d of a.daily) {
      const cur = byDate.get(d.date) ?? { date: d.date, rain: 0, thunder: false, forecast: d.forecast };
      cur.rain = Math.max(cur.rain, d.rain);
      cur.thunder ||= d.thunder;
      byDate.set(d.date, cur);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function verdict(radar: Radar, today: string) {
  const first = radar.areas
    .filter((a) => a.emergenceWindow)
    .sort((a, b) => a.emergenceWindow!.from.localeCompare(b.emergenceWindow!.from))[0];
  if (!first?.emergenceWindow) {
    return { window: null, areaId: null, title: "الموسم لسا بدري", share: "الموسم لسا بدري على الفقع.", detail: "ما نزل مطر كافي على أي منطقة للحين. الفقع يحتاج 10 ملم أو أكثر من مطر الوسم." };
  }
  const w = first.emergenceWindow;
  const days = Math.round((Date.parse(w.from) - Date.parse(today)) / DAY);
  if (days > 0) {
    return { window: w, areaId: first.id, share: `أول فقع متوقع بعد ${days} يوم،`, title: <>أول فقع متوقع بعد <span className="num text-bolt">{days}</span> يوم</>, detail: `في ${first.name} وما حولها، بين ${arDate(w.from)} و${arDate(w.to)}.` };
  }
  return { window: w, areaId: first.id, title: "وقت الفقع بدأ", share: "وقت الفقع بدأ!", detail: `أقرب منطقة متوقع فيها الفقع الحين: ${first.name}.` };
}

export default async function Home() {
  let radar: Radar | null = null;
  try { radar = await getRadar(); } catch (err) { console.error("[home] radar failed", err); }
  const today = radar?.generatedAt.slice(0, 10) ?? "";
  const v = radar ? verdict(radar, today) : null;

  return (
    <CityProvider>
      <section className="hero-photo relative isolate overflow-hidden">
        <div className="flash pointer-events-none absolute inset-0 -z-10 mix-blend-screen" aria-hidden />
        <div className="mx-auto flex min-h-[calc(100svh-60px)] max-w-7xl flex-col justify-end px-5 pb-10 pt-24 md:pb-14">
          <h1 className="font-display text-[44px] font-bold leading-[1.2] text-cream sm:text-6xl md:text-[80px] md:leading-[1.15]">
            وين الفقع هالسنة؟
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-cream/80">
            نتابع مطر الوسم ورعده في {radar?.areas.length ?? 24} منطقة فقع، ونقول لك وين تروح ومتى.
          </p>

          {v ? (
            <div className="mt-8 max-w-xl border-s-2 border-bolt ps-4">
              <p className="font-display text-2xl font-semibold leading-snug md:text-3xl">{v.title}</p>
              <p className="mt-1.5 leading-7 text-cream/75">{v.detail}</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${v.share} ${v.detail}\n${SITE.url}${v.areaId ? `/?area=${v.areaId}#radar` : ""}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-bolt underline decoration-bolt/40 underline-offset-4 hover:decoration-bolt"
              >
                أرسل التوقع لربعك في واتساب
              </a>
            </div>
          ) : (
            <p role="alert" className="mt-8 max-w-xl rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">بيانات المطر ما وصلت. حدث الصفحة بعد دقائق.</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="#radar" className="btn-bolt px-7 py-3.5">شوف الخريطة</Link>
            <Link href="#advisor" className="text-cream underline decoration-cream/30 underline-offset-8 transition hover:decoration-bolt">اسأل فقاع</Link>
          </div>

          {radar && (
            <div className="mt-14 max-w-4xl">
              <SeasonTimeline seasonStart={radar.seasonStart} today={today} days={seasonDays(radar)} emergence={v?.window ?? null} />
            </div>
          )}
        </div>
      </section>

      {radar ? <RadarSection radar={radar} /> : null}
      <FieldGuide />
      <Advisor context={radar ? [...radar.areas].sort((a, b) => b.score - a.score).slice(0, 3).map(({ id, name, region, score, wasmRain, thunderDays }) => ({ id, name, region, score, wasmRain, thunderDays })) : []} />
      <Identify />
    </CityProvider>
  );
}
