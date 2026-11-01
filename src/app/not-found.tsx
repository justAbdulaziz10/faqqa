import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
      
      <h1 className="mt-6 font-display text-4xl font-bold">ضعت في النفود؟</h1>
      <p className="mt-3 text-muted">الصفحة اللي تدورها مو موجودة.</p>
      <Link href="/" className="mt-8 btn-bolt px-6 py-3">ارجع للرئيسية</Link>
    </div>
  );
}
