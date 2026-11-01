import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-sand/10 bg-night-2">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-xl"><Logo className="size-7" /> فقّاع</div>
          <p className="text-sm leading-7 text-sand-dim">
            مشروع شخصي تجريبي بناه {SITE.author} ضمن متطلبات معسكر أكاديمية طويق مع Meta وStartupbootcamp. التقديرات تقريبية وليست دقيقة ١٠٠٪.
          </p>
        </div>
        <nav aria-label="روابط" className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/about" className="text-sand-dim hover:text-sand">كيف يشتغل فقّاع</Link>
          <Link href="/terms" className="text-sand-dim hover:text-sand">الشروط وإخلاء المسؤولية</Link>
          <Link href="/privacy" className="text-sand-dim hover:text-sand">الخصوصية</Link>
          <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="text-sand-dim hover:text-sand">الكود المصدري</a>
        </nav>
        <div className="flex flex-wrap items-start gap-3 md:justify-end">
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-sand/15 px-4 py-2 text-sm hover:bg-sand/5">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>
            GitHub
          </a>
          <a href={SITE.coffee} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#ffdd00] px-4 py-2 text-sm font-semibold text-night hover:brightness-95">
            ☕ ادعمني بقهوة
          </a>
        </div>
      </div>
      <div className="border-t border-sand/10 py-4 text-center text-xs text-sand-dim">
        البيانات المناخية: Open-Meteo (ECMWF, DWD) · الخرائط: OpenStreetMap و CARTO · الذكاء الاصطناعي: Meta Llama 4
      </div>
    </footer>
  );
}
