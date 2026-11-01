"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[faqqa] page error", error); }, [error]);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <h1 className="font-display text-4xl font-bold">صار خلل بسيط</h1>
      <p className="mt-3 leading-8 text-muted">الصفحة ما اكتملت. جرب مرة ثانية، وإذا تكرر ارجع بعد شوي.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className="btn-bolt px-6 py-3">جرب مرة ثانية</button>
        <Link href="/" className="text-cream underline decoration-cream/30 underline-offset-8 hover:decoration-bolt">ارجع للرئيسية</Link>
      </div>
    </div>
  );
}
