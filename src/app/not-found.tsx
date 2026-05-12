import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500 mb-4 tracking-tight">404</p>
        <div className="inline-flex w-16 h-16 bg-white/5 border border-white/10 rounded-2xl items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">الصفحة غير موجودة</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          الرابط الذي تبحث عنه غير صحيح أو تم نقله.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 transition-all"
        >
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
