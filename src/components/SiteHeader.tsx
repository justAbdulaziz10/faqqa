import Link from "next/link";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#radar", label: "الرادار" },
  { href: "/#advisor", label: "اسأل فقّاع" },
  { href: "/#identify", label: "صوّر فقعتك" },
  { href: "/about", label: "كيف يشتغل" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-sand/10 bg-night/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl text-sand">
          <Logo /> فقّاع
        </Link>
        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-2 text-sand-dim transition hover:bg-sand/5 hover:text-sand">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/#advisor" className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-night transition hover:bg-dune">
          ابدأ الآن
        </Link>
      </div>
    </header>
  );
}
