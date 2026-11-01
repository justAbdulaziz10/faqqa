import type { AreaScore } from "@/lib/radar";
import { arDate } from "@/lib/format";

export function RainBars({ daily }: { daily: AreaScore["daily"] }) {
  const max = Math.max(5, ...daily.map((d) => d.rain));
  const first = daily[0]?.date;
  const last = daily[daily.length - 1]?.date;
  return (
    <figure>
      <figcaption className="mb-2 text-xs text-muted">المطر اليومي من بداية الوسم</figcaption>
      <div className="flex h-20 items-end gap-[2px] border-b border-mist" role="img" aria-label="أمطار يومية منذ بداية الوسم مع توقعات الأسبوع القادم">
        {daily.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end">
            <div
              className={`w-full rounded-t-[2px] ${d.forecast ? "border border-b-0 border-dashed border-rain/70" : d.thunder ? "bg-bolt" : "bg-rain"}`}
              style={{ height: `${d.rain > 0 ? Math.max(4, (d.rain / max) * 100) : 0}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] text-cream group-hover:block">
              {arDate(d.date)}: {d.rain} ملم{d.thunder ? "، رعد" : ""}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        {first && <span>{arDate(first)}</span>}
        {last && <span>{arDate(last)}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm bg-rain" /> مطر</span>
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm bg-bolt" /> مطر مع رعد</span>
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm border border-dashed border-rain/70" /> متوقع</span>
      </div>
    </figure>
  );
}
