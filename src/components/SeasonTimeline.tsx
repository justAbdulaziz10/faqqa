import { arMonth } from "@/lib/format";

const DAY = 86_400_000;

export type SeasonDay = { date: string; rain: number; thunder: boolean; forecast: boolean };

/**
 * The truffle season on one line, right to left: Wasm start (16 Oct) → today → expected
 * truffle window → mid-April. Bars are the heaviest daily rain across all truffle grounds.
 */
export function SeasonTimeline({ seasonStart, today, days, emergence }: {
  seasonStart: string;
  today: string;
  days: SeasonDay[];
  emergence: { from: string; to: string } | null;
}) {
  const start = Date.parse(seasonStart);
  const end = Date.UTC(new Date(start).getUTCFullYear() + 1, 3, 15);
  const span = end - start;
  const pos = (iso: string) => Math.min(100, Math.max(0, ((Date.parse(iso) - start) / span) * 100));
  const dayWidth = (DAY / span) * 100;
  const max = Math.max(10, ...days.map((d) => d.rain));

  const ticks: { label: string; at: number }[] = [];
  let y = new Date(start).getUTCFullYear();
  let m = 10; // November
  while (Date.UTC(y, m, 1) < end) {
    ticks.push({ label: arMonth(m), at: ((Date.UTC(y, m, 1) - start) / span) * 100 });
    if (++m === 12) { m = 0; y++; }
  }
  const todayAt = pos(today);

  return (
    <figure className="w-full" aria-label="موسم الفقع: المطر من بداية الوسم، واليوم، والوقت المتوقع لطلوع الفقع">
      <div className="relative h-6 text-[12px] font-medium">
        <span className="absolute bottom-0 whitespace-nowrap text-bolt" style={{ right: `${todayAt}%`, transform: "translateX(50%)" }}>اليوم</span>
        {emergence && (
          <span className="absolute bottom-0 whitespace-nowrap text-dune" style={{ right: `${(pos(emergence.from) + pos(emergence.to)) / 2}%`, transform: "translateX(50%)" }}>
            وقت الفقع
          </span>
        )}
      </div>

      <div className="relative mt-2 h-16">
        {/* Expected truffle window: a band of dune colour behind the bars. */}
        {emergence && (
          <div
            className="absolute inset-y-0 rounded-md ring-1 ring-inset ring-dune/60"
            style={{
              right: `${pos(emergence.from)}%`,
              width: `${Math.max(1.5, pos(emergence.to) - pos(emergence.from))}%`,
              backgroundImage: "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-dune) 40%, transparent) 0 1.5px, transparent 1.5px 6px)",
            }}
          />
        )}
        {/* Daily rain, observed and forecast. */}
        {days.map((d) => (
          <div
            key={d.date}
            className={`absolute bottom-0 rounded-t-[1px] ${d.forecast ? "border border-b-0 border-dashed border-rain/80" : d.thunder ? "bg-bolt" : "bg-rain"}`}
            style={{ right: `${pos(d.date)}%`, width: `max(2px, calc(${dayWidth}% - 1px))`, height: `${d.rain > 0.2 ? Math.max(6, (d.rain / max) * 100) : 0}%` }}
          />
        ))}
        {/* Today. */}
        <div className="absolute -top-2 bottom-0 w-px bg-bolt" style={{ right: `${todayAt}%` }} />
        <div className="absolute inset-x-0 bottom-0 h-px bg-cream/30" />
      </div>

      <div className="relative mt-2 h-4 text-[11px] text-muted">
        {ticks.map((t) => (
          <span key={t.label} className="absolute" style={{ right: `${t.at}%`, transform: "translateX(50%)" }}>{t.label}</span>
        ))}
      </div>

      <figcaption className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-1.5 rounded-sm bg-rain" />مطر</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-1.5 rounded-sm bg-bolt" />مطر مع رعد</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-3 w-1.5 rounded-sm border border-dashed border-rain" />متوقع</span>
        <span>أعلى مطر يومي على مناطق الفقع من 16 أكتوبر</span>
      </figcaption>
    </figure>
  );
}
