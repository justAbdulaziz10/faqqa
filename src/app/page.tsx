import Link from "next/link";
import { buildRadar, type Radar } from "@/lib/radar";
import { RadarSection } from "@/components/RadarSection";
import { Advisor } from "@/components/Advisor";
import { Identify } from "@/components/Identify";
import { arDate } from "@/lib/format";

export const revalidate = 10800;

export default async function Home() {
  let radar: Radar | null = null;
  try { radar = await buildRadar(); } catch (err) { console.error("[home] radar failed", err); }

  const top = radar?.areas[0];
  const totalRain = radar ? Math.max(...radar.areas.map((a) => a.wasmRain)) : 0;
  const thunderAreas = radar ? radar.areas.filter((a) => a.thunderDays > 0).length : 0;

  return (
    <>
      <section className="desert-sky grain relative overflow-hidden">
        <div className="stars absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-16 md:pt-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-ember/30 bg-ember/10 px-3 py-1 text-xs text-ember">
              <span className="relative inline-flex size-2"><span className="pulse-ring absolute inline-flex size-full rounded-full bg-ember" /><span className="relative inline-flex size-2 rounded-full bg-ember" /></span>
              موسم الوسم {radar ? `· اليوم ${radar.daysIntoSeason} من الموسم` : ""}
            </p>
            <h1 className="font-display text-5xl leading-tight md:text-7xl">
              وين يطلع <span className="text-ember">الفقع</span>
              <br />هالسنة؟
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-9 text-sand-dim">
              «الفقع يطلع بعد رعد الوسم»… فقّاع يحوّل هالحكمة لأرقام: يقرأ أمطار الوسم والرعد ورطوبة التربة من نماذج المناخ العالمية، و <b className="text-sand">Llama</b> يقولك وين الاحتمال أعلى ومتى.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#advisor" className="rounded-full bg-ember px-6 py-3 font-semibold text-night transition hover:bg-dune">اسأل فقّاع ✨</Link>
              <Link href="#radar" className="rounded-full border border-sand/20 px-6 py-3 transition hover:bg-sand/5">شوف الرادار</Link>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-sm text-sand-dim">الوضع الآن من بيانات المناخ الحية</p>
            {radar && top ? (
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <HeroStat label="أعلى منطقة الآن" value={top.name} hint={`${top.score}/100 · ${top.label}`} />
                <HeroStat label="أعلى أمطار وسم" value={`${totalRain} ملم`} hint={`منذ ${arDate(radar.seasonStart)}`} />
                <HeroStat label="مناطق سمعت رعد" value={`${thunderAreas} من ${radar.areas.length}`} hint="منذ بداية الوسم" />
                <HeroStat label="الطلوع المتوقع" value={top.emergenceWindow ? arDate(top.emergenceWindow.from) : "بانتظار المطر"} hint={top.emergenceWindow ? `إلى ${arDate(top.emergenceWindow.to)}` : "ما نزل مطر فعّال للحين"} />
              </dl>
            ) : (
              <p role="alert" className="mt-4 rounded-xl border border-rust/40 bg-rust/10 p-3 text-sm">تعذر جلب بيانات المناخ الآن. حدّث الصفحة بعد قليل.</p>
            )}
            <p className="mt-5 border-t border-sand/10 pt-4 text-[11px] leading-6 text-sand-dim">
              ⚠️ تقديرات تقريبية من نموذج تجريبي وليست دقيقة ١٠٠٪ · مشروع شخصي لمعسكر أكاديمية طويق
            </p>
          </div>
        </div>
      </section>

      {radar ? <RadarSection radar={radar} /> : null}
      <Advisor />
      <Identify />

      <section className="mx-auto max-w-6xl px-4 pt-24">
        <div className="card grid gap-6 p-6 md:grid-cols-3">
          {[
            ["١. بيانات حية", "أمطار يومية، أيام رعد، رطوبة التربة، الحرارة، وتوقعات ٧ أيام لكل منطقة فقع معروفة من نماذج ECMWF وDWD عبر Open-Meteo."],
            ["٢. نموذج تقييم", "معادلة شفافة تعطي كل منطقة درجة من ١٠٠، وتحسب نافذة الطلوع المتوقعة بعد ٦٠–٧٥ يوماً من أول مطر فعّال."],
            ["٣. عقل Llama", "Llama 4 يقرأ الأرقام ويجاوب سؤالك بخطة منظمة (JSON) نتحقق منها قبل عرضها، ويتعرف على الفقع من الصور."],
          ].map(([t, d]) => (
            <div key={t}><h3 className="font-display text-xl text-ember">{t}</h3><p className="mt-2 text-sm leading-7 text-sand-dim">{d}</p></div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-rust/30 bg-rust/5 p-5 text-sm leading-7">
          <b>تنبيه مهم:</b> فقّاع مشروع شخصي تجريبي بنيته ضمن متطلبات معسكر أكاديمية طويق. النتائج تقديرية <b>وليست دقيقة ١٠٠٪</b>، ولا تضمن وجود الفقع في أي مكان. التزم بأنظمة البيئة والمحميات، ولا تدخل الأودية وقت السيول. <Link href="/terms" className="text-dune underline">الشروط وإخلاء المسؤولية</Link>
        </div>
      </section>
    </>
  );
}

function HeroStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl bg-night/60 p-4">
      <dt className="text-xs text-sand-dim">{label}</dt>
      <dd className="mt-1 font-display text-2xl text-sand">{value}</dd>
      <dd className="text-xs text-sand-dim">{hint}</dd>
    </div>
  );
}
