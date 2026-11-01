import type { AreaScore } from "@/lib/radar";
import { arDate } from "@/lib/format";

export function RainBars({ daily }: { daily: AreaScore["daily"] }) {
  const max = Math.max(5, ...daily.map((d) => d.rain));
  return (
    <figure>
      <div className="flex h-24 items-end gap-[3px]" role="img" aria-label="أمطار يومية منذ بداية الوسم مع توقعات الأسبوع القادم">
        {daily.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div
              className={`w-full rounded-t ${d.forecast ? "bg-sand/25 border border-dashed border-sand/40" : d.thunder ? "bg-ember" : "bg-dune/80"}`}
              style={{ height: `${Math.max(3, (d.rain / max) * 96)}px` }}
            />
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-night px-2 py-1 text-[10px] text-sand group-hover:block">
              {arDate(d.date)}: {d.rain} ملم{d.thunder ? " ⚡" : ""}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-3 text-[11px] text-sand-dim">
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm bg-dune/80" /> مطر</span>
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm bg-ember" /> يوم رعد</span>
        <span className="flex items-center gap-1"><i className="inline-block size-2 rounded-sm border border-dashed border-sand/40" /> توقعات</span>
      </figcaption>
    </figure>
  );
}
