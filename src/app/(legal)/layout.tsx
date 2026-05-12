import Link from "next/link";
import { Camera } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-amber-50/20" dir="rtl">
      <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-zinc-900">EventFace</span>
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <article className="prose prose-zinc max-w-none prose-headings:font-bold prose-headings:text-zinc-900 prose-p:leading-relaxed prose-p:text-zinc-700 prose-a:text-amber-700 prose-strong:text-zinc-900">
          {children}
        </article>
      </main>
      <footer className="border-t border-zinc-200/50 py-6 text-center text-xs text-zinc-500">
        © 2026 EventFace. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
