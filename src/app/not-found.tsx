import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      <span className="text-6xl" aria-hidden>🏜️</span>
      <h1 className="mt-6 font-display text-4xl">ضعت في النفود؟</h1>
      <p className="mt-3 text-sand-dim">الصفحة اللي تدورها مب موجودة. الفقع ما طلع هنا.</p>
      <Link href="/" className="mt-8 rounded-full bg-ember px-6 py-3 font-semibold text-night hover:bg-dune">ارجع للرادار</Link>
    </div>
  );
}
