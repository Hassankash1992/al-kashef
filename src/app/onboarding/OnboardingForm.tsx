"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Check } from "lucide-react";

export default function OnboardingForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ غير متوقع");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-amber-400 blur-xl opacity-50 rounded-2xl" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl">
              <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">EventFace</h1>
          <p className="text-xs sm:text-sm text-amber-400/80 mt-1.5 font-medium">منصة معارض الفعاليات الذكية</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-amber-100">
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-1.5">مرحباً بك</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              أدخل اسم شركتك أو استوديوك لإنشاء حسابك
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="company-name" className="block text-sm font-semibold text-zinc-800 mb-2">
                اسم الشركة / الاستوديو
              </label>
              <input
                id="company-name"
                type="text"
                required
                autoFocus
                minLength={2}
                placeholder="مثال: استوديو النور للتصوير"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              />
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                تقدر تغيّر الاسم لاحقاً من الإعدادات
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="w-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:from-zinc-300 disabled:via-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" strokeWidth={3} />
                  <span>إنشاء الحساب والمتابعة</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          © 2026 EventFace. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
