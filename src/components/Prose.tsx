import Link from "next/link";

export function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-14 md:pt-20">
      <Link href="/" className="text-sm text-sand-dim hover:text-sand">→ الرئيسية</Link>
      <p className="mt-6 text-sm text-ember">{eyebrow}</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{title}</h1>
      {intro ? <p className="mt-4 text-lg leading-9 text-sand-dim">{intro}</p> : null}
      <div className="mt-10 flex flex-col gap-10">{children}</div>
    </article>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-sand">{title}</h2>
      <div className="mt-3 space-y-3 leading-8 text-sand-dim [&_b]:text-sand [&_code]:rounded [&_code]:bg-night-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-ember [&_li]:ms-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-rust/40 bg-rust/10 p-5 leading-8">{children}</div>;
}
