import type { AreaScore } from "@/lib/radar";
import { groundCosts } from "@/lib/ground";

/**
 * Why an area got its chance: what this season's weather gives, and how many points each
 * part of the ground (reputation, host plants, soil, grazing) takes off it.
 */
export function ScoreBreakdown({ area, compact = false }: { area: AreaScore; compact?: boolean }) {
  const costs = new Map(groundCosts(area.weatherScore, area.ground.factors).map((c) => [c.key, c.points]));
  return (
    <div className={compact ? "text-sm" : ""}>
      <p className="leading-7 text-cream/90">
        الجو هالموسم يعطيها <b className="num">{area.weatherScore}</b> من 100، والأرض تنزلها إلى <b className="num">{area.score}</b>.
      </p>
      <ul className={`mt-3 divide-y divide-mist/60 border-y border-mist/60 ${compact ? "text-[13px]" : "text-sm"}`}>
        {area.ground.factors.map((f) => {
          const cost = costs.get(f.key) ?? 0;
          return (
            <li key={f.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-2.5">
              <span className="font-medium">{f.label}</span>
              <span dir="ltr" className={`num text-end ${cost ? "text-alert/90" : "text-muted"}`}>{cost ? `−${cost}` : "0"}</span>
              <span className="col-span-2 flex items-center gap-3">
                <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-mist/60" role="img" aria-label={`الملاءمة ${Math.round(f.fit * 100)} من 100`}>
                  <span className="block h-full rounded-full bg-dune" style={{ width: `${Math.max(4, f.fit * 100)}%` }} />
                </span>
                <span className="leading-6 text-muted">{f.detail}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
