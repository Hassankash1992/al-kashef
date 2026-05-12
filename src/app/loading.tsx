import { Camera, Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-400 blur-xl opacity-50 rounded-2xl animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-2xl">
            <Camera className="w-8 h-8 text-black" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Loader2 className="w-4 h-4 animate-spin" />
          جارٍ التحميل...
        </div>
      </div>
    </div>
  );
}
