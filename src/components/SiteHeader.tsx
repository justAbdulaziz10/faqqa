import Link from "next/link";
import { Logo } from "./Logo";

const NAV: { href: string; label: string; desktop?: boolean }[] = [
  { href: "/#radar", label: "الخريطة" },
  { href: "/#advisor", label: "اسأل فقاع" },
  { href: "/#identify", label: "صور فقعتك" },
  { href: "/about", label: "عن فقاع", desktop: true },
];

export function SiteHeader() {
  return (
    <>
      <p className="bg-ink-2 px-4 py-1.5 text-center text-[12px] leading-5 text-muted">
        مشروع تجريبي لأكاديمية طويق. الأرقام تقريبية وليست دقيقة 100٪.{" "}
        <Link href="/terms" className="text-cream underline underline-offset-4">الشروط</Link>
      </p>
      <header className="sticky top-0 z-[1000] border-b border-mist/60 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-cream" aria-label="فقاع، الصفحة الرئيسية">
          <Logo className="size-8" />
          <span className="font-display text-2xl font-bold leading-none">فقاع</span>
        </Link>
        <nav aria-label="التنقل الرئيسي" className="-mx-2 flex items-center gap-1 overflow-x-auto text-[13px] md:text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`${n.desktop ? "hidden md:inline-block" : ""} whitespace-nowrap rounded-full px-2.5 py-1.5 text-muted transition hover:bg-cloud hover:text-cream md:px-3`}>
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      </header>
    </>
  );
}
