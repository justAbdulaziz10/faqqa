import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-mist bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_auto]">
        <div className="max-w-md">
          <div className="flex items-center gap-2.5"><Logo className="size-7" /><span className="font-display text-2xl leading-none">فقّاع</span></div>
          <p className="mt-4 text-sm leading-7 text-muted">
            مشروع شخصي سويته لأنه مطلوب في معسكر أكاديمية طويق مع Meta وStartupbootcamp. الأرقام تقديرية من نموذج تجريبي، وليست دقيقة 100٪، وما تضمن وجود الفقع في أي مكان.
          </p>
        </div>
        <nav aria-label="روابط الموقع" className="grid content-start gap-2.5 text-sm">
          <Link href="/about" className="text-muted hover:text-cream">كيف يشتغل فقّاع</Link>
          <Link href="/terms" className="text-muted hover:text-cream">الشروط وإخلاء المسؤولية</Link>
          <Link href="/privacy" className="text-muted hover:text-cream">الخصوصية</Link>
          <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-cream">الكود على GitHub</a>
        </nav>
        <div className="flex flex-wrap content-start items-start gap-3">
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-mist px-4 py-2 text-sm transition hover:border-cream/50">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.550-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.050 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.770 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"/></svg>
            GitHub
          </a>
          <a href={SITE.coffee} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#ffdd00] px-4 py-2 text-sm font-semibold text-[#1a1a1a] transition hover:brightness-95">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v2M12 3v2" /></svg>
            اشترِ لي قهوة
          </a>
        </div>
      </div>
      <p className="border-t border-mist px-5 py-4 text-center text-xs leading-6 text-muted">
        المناخ: Open-Meteo (ECMWF وDWD) · الأقمار الصناعية: Esri وMaxar · الذكاء الاصطناعي: Meta Llama 4 · صورة الواجهة مولّدة بالذكاء الاصطناعي
      </p>
    </footer>
  );
}
