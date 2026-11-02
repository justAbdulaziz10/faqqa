import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRadar, type AreaScore } from "@/lib/radar";
import { AREAS, distanceKm } from "@/lib/areas";
import { arDate, arDateTime, arDays, scoreLabel, scoreText } from "@/lib/format";
import { RainBars } from "@/components/RainBars";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return AREAS.map((a) => ({ id: a.id }));
}

async function load(id: string) {
  const radar = await getRadar().catch(() => null);
  const area = radar?.areas.find((a) => a.id === id) ?? null;
  return { radar, area };
}

function whenText(area: AreaScore) {
  return area.emergenceWindow
    ? `الفقع متوقع في ${area.name} بين ${arDate(area.emergenceWindow.from)} و${arDate(area.emergenceWindow.to)}، بعد مطر وسم مجموعه ${area.wasmRain} ملم.`
    : `ما نزل على ${area.name} مطر كافي للحين. الفقع يحتاج 10 ملم أو أكثر من مطر الوسم، ويطلع بعده بشهرين تقريبا.`;
}

function rainAnswer(area: AreaScore) {
  const past = area.rainDays
    ? `من 16 أكتوبر نزل ${area.wasmRain} ملم خلال ${arDays(area.rainDays)}${area.thunderDays ? `، فيها رعد ${arDays(area.thunderDays)}` : " بدون رعد"}.`
    : "من 16 أكتوبر ما نزل مطر يذكر.";
  const next = area.forecastRain > 0 ? ` والمتوقع خلال أسبوع ${area.forecastRain} ملم.` : " وما فيه مطر متوقع هالأسبوع.";
  return past + next;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const base = AREAS.find((a) => a.id === id);
  if (!base) return {};
  const { area } = await load(id);
  const title = `الفقع في ${base.name}: متى يطلع هالسنة؟`;
  const description = area ? whenText(area) : `متى يطلع الفقع في ${base.name} (${base.region})، من بيانات مطر الوسم ورعده.`;
  return {
    title,
    description,
    alternates: { canonical: `/area/${id}` },
    openGraph: { title, description, url: `${SITE.url}/area/${id}` },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = AREAS.find((a) => a.id === id);
  if (!base) notFound();
  const { radar, area } = await load(id);

  const nearby = AREAS.filter((a) => a.id !== id)
    .map((a) => ({ ...a, km: distanceKm(base, a), score: radar?.areas.find((r) => r.id === a.id)?.score ?? null }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 4);

  const faq = area
    ? [
        { q: `متى يطلع الفقع في ${area.name}؟`, a: whenText(area) },
        { q: `كم نزل مطر على ${area.name} هالوسم؟`, a: rainAnswer(area) },
      ]
    : [];

  return (
    <article className="mx-auto max-w-3xl px-5 pb-10 pt-14 md:pt-20">
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <Link href="/#radar" className="text-sm text-muted hover:text-cream">كل المناطق</Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">الفقع في {base.name}</h1>
          <p className="mt-2 text-muted">{base.region}</p>
        </div>
        {area && (
          <div className="text-end">
            <div className="text-xs text-muted">الفرصة</div>
            <div className="mt-0.5 text-3xl font-semibold" style={{ color: scoreText(area.score) }}>{scoreLabel(area.score)}</div>
            <div className="num text-xs text-muted">{area.score} من 100</div>
          </div>
        )}
      </header>

      {area ? (
        <>
          <p className="mt-8 text-xl leading-9 text-cream/90">
            {area.emergenceWindow
              ? <>متوقع بين <b className="text-dune">{arDate(area.emergenceWindow.from)}</b> و<b className="text-dune">{arDate(area.emergenceWindow.to)}</b>.</>
              : <>ما نزل مطر كافي للحين، فما نتوقع فقع قريب.</>}
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${area.lat},${area.lon}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-bolt px-4 py-2 font-semibold text-ink transition hover:brightness-95">
              خذني لها
            </a>
            {area.emergenceWindow && (
              <a href={`/api/remind/${area.id}`} download={`faqqa-${area.id}.ics`} className="rounded-full border border-mist px-4 py-2 transition hover:border-cream/50">
                ذكرني بالموعد
              </a>
            )}
            <Link href={`/?area=${area.id}#radar`} className="rounded-full border border-mist px-4 py-2 transition hover:border-cream/50">
              شوفها على الخريطة
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-x-4 gap-y-6 border-y border-mist py-6 text-sm">
            <Stat label="مطر الوسم" value={`${area.wasmRain}`} unit="ملم" />
            <Stat label="أيام الرعد" value={`${area.thunderDays}`} />
            <Stat label="أيام المطر" value={`${area.rainDays}`} />
            <Stat label="رطوبة التربة" value={area.soilMoisture != null ? `${Math.round(area.soilMoisture * 100)}` : "-"} unit={area.soilMoisture != null ? "٪" : undefined} />
            <Stat label="الحرارة" value={area.meanTemp != null ? `${area.meanTemp}` : "-"} unit={area.meanTemp != null ? "°" : undefined} />
            <Stat label="متوقع هالأسبوع" value={`${area.forecastRain}`} unit="ملم" />
          </dl>

          <div className="mt-8">
            <RainBars daily={area.daily} />
          </div>

          <section className="mt-12 space-y-8">
            {faq.map((f) => (
              <div key={f.q}>
                <h2 className="font-display text-2xl font-bold">{f.q}</h2>
                <p className="mt-2 leading-8 text-muted">{f.a}</p>
              </div>
            ))}
          </section>
        </>
      ) : (
        <p className="mt-8 leading-8 text-muted">تعذر جلب بيانات المطر الحين. جرب بعد شوي.</p>
      )}

      <section className="mt-14">
        <h2 className="text-xl font-semibold">مناطق قريبة</h2>
        <ul className="mt-4 divide-y divide-mist/70 border-y border-mist/70">
          {nearby.map((n) => (
            <li key={n.id}>
              <Link href={`/area/${n.id}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 transition hover:bg-ink-2 md:px-2">
                <span><span className="font-medium">{n.name}</span><span className="ms-2 text-[13px] text-muted">{n.region}</span></span>
                <span className="num text-sm text-muted">{n.km} كم</span>
                <span className="w-16 text-end text-sm font-semibold" style={n.score != null ? { color: scoreText(n.score) } : undefined}>
                  {n.score != null ? scoreLabel(n.score) : "-"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {radar && <p className="mt-6 text-[13px] text-muted">آخر تحديث: {arDateTime(radar.generatedAt)}. التوقع اجتهاد من بيانات المطر، مو مضمون.</p>}
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
