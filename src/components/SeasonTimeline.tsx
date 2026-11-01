import { arDate, arMonth } from "@/lib/format";

const DAY = 86_400_000;

/** The Wasm season as a line: rain season start → today → expected emergence → end of season. */
export function SeasonTimeline({ seasonStart, today, emergence }: { seasonStart: string; today: string; emergence: { from: string; to: string } | null }) {
  const start = Date.parse(seasonStart);
  const end = Date.UTC(new Date(start).getUTCFullYear() + 1, 3, 15); // mid-April
  const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - start) / (end - start)) * 100));
  const ticks: { label: string; at: number }[] = [];
  for (let t = Date.UTC(new Date(start).getUTCFullYear(), 10, 1); t < end; t = Date.UTC(new Date(t).getUTCFullYear(), new Date(t).getUTCMonth() + 1, 1)) {
    ticks.push({ label: arMonth(new Date(t).getUTCMonth()), at: ((t - start) / (end - start)) * 100 });
  }
  const todayAt = pos(today);
  const daysLeft = emergence ? Math.round((Date.parse(emergence.from) - Date.parse(today)) / DAY) : null;

  return (
    <figure className="w-full" aria-label="خط موسم الوسم">
      <div className="relative h-14">
        {/* track */}
        <div className="absolute inset-x-0 top-7 h-px bg-cream/25" />
        {/* elapsed */}
        <div className="absolute top-7 h-px bg-rain" style={{ right: 0, width: `${todayAt}%` }} />
        {/* emergence window */}
        {emergence && (
          <div className="absolute top-[22px] h-3 rounded-full bg-dune/80" style={{ right: `${pos(emergence.from)}%`, width: `${Math.max(2, pos(emergence.to) - pos(emergence.from))}%` }} />
        )}
        {/* month ticks */}
        {ticks.map((t) => (
          <span key={t.label} className="absolute top-10 text-[11px] text-muted" style={{ right: `${t.at}%`, transform: "translateX(50%)" }}>{t.label}</span>
        ))}
        {/* start */}
        <span className="absolute top-0 hidden text-[11px] text-rain md:block" style={{ right: 0 }}>بداية الوسم</span>
        {/* today */}
        <span className="absolute top-[23px] size-[9px] rounded-full bg-bolt ring-4 ring-bolt/25" style={{ right: `calc(${todayAt}% - 4px)` }} />
        <span className="absolute top-0 whitespace-nowrap text-[11px] font-medium text-bolt" style={{ right: `${todayAt}%`, transform: "translateX(50%)" }}>اليوم</span>
        {emergence && (
          <span className="absolute top-0 whitespace-nowrap text-[11px] font-medium text-dune" style={{ right: `${pos(emergence.from)}%` }}>موعد الطلوع المتوقع</span>
        )}
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        {emergence && daysLeft != null
          ? daysLeft > 0
            ? <>إذا صدقت الحسبة، أول فقع متوقع بعد <b className="num text-cream">{daysLeft}</b> يوم تقريباً، بين {arDate(emergence.from)} و{arDate(emergence.to)}.</>
            : <>نافذة الطلوع المتوقعة مفتوحة الحين: من {arDate(emergence.from)} إلى {arDate(emergence.to)}.</>
          : <>ما نزل مطر وسم فعّال (10 ملم) على أي منطقة للحين، فموعد الطلوع ما تحدد.</>}
      </figcaption>
    </figure>
  );
}
