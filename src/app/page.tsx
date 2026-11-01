import Link from "next/link";
import { getRadar, type Radar } from "@/lib/radar";
import { RadarSection } from "@/components/RadarSection";
import { Advisor } from "@/components/Advisor";
import { Identify } from "@/components/Identify";
import { SeasonTimeline } from "@/components/SeasonTimeline";

export default async function Home() {
  let radar: Radar | null = null;
  try { radar = await getRadar(); } catch (err) { console.error("[home] radar failed", err); }

  const wettest = radar ? [...radar.areas].sort((a, b) => b.wasmRain - a.wasmRain)[0] : null;
  const thunderAreas = radar ? radar.areas.filter((a) => a.thunderDays > 0).length : 0;
  const firstWindow = radar?.areas.map((a) => a.emergenceWindow).filter((w): w is NonNullable<typeof w> => !!w).sort((a, b) => a.from.localeCompare(b.from))[0] ?? null;

  return (
    <>
      <section className="hero-photo relative isolate overflow-hidden">
        <div className="flash pointer-events-none absolute inset-0 -z-10 mix-blend-screen" aria-hidden />
        <div className="mx-auto flex min-h-[calc(100svh-96px)] max-w-7xl flex-col justify-end px-5 pb-10 pt-28 md:pb-14">
          <div className="max-w-2xl">
            <h1 className="font-display text-[56px] leading-[1.15] text-cream sm:text-7xl md:text-[96px] md:leading-[1.1]">
              الفقع يطلع
              <br />
              بعد رعد الوسم
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-cream/85">
              فقّاع يتابع المطر والرعد ورطوبة التربة على {radar?.areas.length ?? 24} منطقة فقع في المملكة من نماذج المناخ العالمية، ويقولك وين الأرض شربت هالسنة.
            </p>
            {radar && wettest && (
              <p className="mt-4 max-w-xl leading-8 text-muted">
                اليوم <span className="num text-cream">{radar.daysIntoSeason}</span> من الوسم. أكثر منطقة جاها مطر: <b className="font-semibold text-cream">{wettest.name}</b> بـ <span className="num text-cream">{wettest.wasmRain}</span> ملم
                {thunderAreas > 0 ? <>، وسمعت الرعد {thunderAreas === 1 ? "منطقة وحدة" : <><span className="num">{thunderAreas}</span> مناطق</>}.</> : "، وما رعدت على أي منطقة للحين."}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="#radar" className="btn-bolt px-7 py-3.5">افتح الرادار</Link>
              <Link href="#advisor" className="text-cream underline decoration-cream/30 underline-offset-8 transition hover:decoration-bolt">اسأل فقّاع وين تروح</Link>
            </div>
          </div>
          {radar ? (
            <div className="mt-14 max-w-4xl">
              <SeasonTimeline seasonStart={radar.seasonStart} today={radar.generatedAt.slice(0, 10)} emergence={firstWindow} />
            </div>
          ) : (
            <p role="alert" className="mt-10 max-w-xl rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">بيانات المناخ ما وصلت الحين. حدّث الصفحة بعد دقائق.</p>
          )}
        </div>
      </section>

      {radar ? <RadarSection radar={radar} /> : null}
      <Advisor />
      <Identify />

      <section className="mx-auto max-w-7xl px-5 pt-28" aria-labelledby="how">
        <h2 id="how" className="font-display text-4xl md:text-5xl">من المطر إلى الجواب</h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            ["المطر والرعد", "كل ساعة يسحب فقّاع أمطار كل منطقة من 16 أكتوبر، وأيام الرعد، ورطوبة التربة، والحرارة، وتوقعات أسبوع من نماذج ECMWF وDWD."],
            ["المؤشر", "معادلة مكشوفة تعطي كل منطقة درجة من 100، وتحسب موعد الطلوع: 60 إلى 75 يوم بعد أول 10 ملم."],
            ["Llama", "Meta Llama 4 يقرأ الأرقام ويرد على سؤالك بخطة، ويتعرف على الفقع من الصورة. كل رد يمر على تحقق قبل ما يوصلك."],
          ].map(([t, d], i) => (
            <li key={t} className="border-t border-mist pt-5">
              <span className="num text-sm text-bolt">{i + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 leading-8 text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-sm text-muted">
          تفاصيل المعادلة وحدودها في <Link href="/about" className="text-cream underline underline-offset-4">كيف يشتغل فقّاع</Link>.
        </p>
      </section>
    </>
  );
}
