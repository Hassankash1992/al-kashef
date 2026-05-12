"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-2xl items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          نعتذر عن الإزعاج — يبدو أن هناك مشكلة. حاول مرة أخرى أو ارجع للصفحة الرئيسية.
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-zinc-600 mb-6 bg-white/5 border border-white/10 rounded-lg p-2">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30"
          >
            <RefreshCw className="w-4 h-4" />
            حاول مرة أخرى
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
