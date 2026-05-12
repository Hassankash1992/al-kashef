"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2, Hash } from "lucide-react";

interface Stats {
  total: number;
  faceIndexed: number;
  processed: number;
  processing: number;
  failed: number;
  uploaded: number;
}

interface Props {
  eventId: string;
  stats: Stats;
  rekognitionConfigured: boolean;
}

export default function FaceIndexingPanel({ eventId, stats, rekognitionConfigured }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const pendingCount = stats.processed;
  const progress = stats.total > 0 ? Math.round((stats.faceIndexed / stats.total) * 100) : 0;

  async function handleReindex() {
    setLoading(true);
    setDone(false);
    setError("");
    try {
      let totalProcessed = 0;
      let totalFailed = 0;
      let lastRemaining = -1;
      let stuckCount = 0;
      let safetyLoop = 0;

      while (safetyLoop < 30) {
        safetyLoop++;
        const res = await fetch(`/api/events/${eventId}/reindex`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "حدث خطأ");
        totalProcessed += data.processed ?? 0;
        totalFailed += data.failed ?? 0;

        if (data.done) break;

        // Detect stuck loop: remaining count not decreasing
        if (data.remaining === lastRemaining) {
          stuckCount++;
          if (stuckCount >= 2) {
            // Stop trying — show errors
            const errMsg = data.errors?.[0] ?? "فشلت الفهرسة لجميع الصور";
            throw new Error(`توقفت الفهرسة: ${errMsg}`);
          }
        } else {
          stuckCount = 0;
          lastRemaining = data.remaining;
        }

        // Wait between batches (Face++ rate limit)
        await new Promise((r) => setTimeout(r, 1000));
      }
      setDone(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="إجمالي" value={stats.total} icon={Hash} variant="default" />
        <StatCard label="مفهرسة" value={stats.faceIndexed} icon={CheckCircle2} variant="success" />
        <StatCard label="في الانتظار" value={pendingCount} icon={Clock} variant="warning" />
        <StatCard label="فاشلة" value={stats.failed} icon={AlertCircle} variant="danger" />
      </div>

      {stats.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-700 font-semibold">تقدم الفهرسة</span>
            <span className="text-amber-700 font-bold">{progress}%</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!rekognitionConfigured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900 mb-1">AWS Rekognition غير مهيأ</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              أضف <code className="bg-amber-100 px-1 rounded">AWS_ACCESS_KEY_ID</code>،
              <code className="bg-amber-100 px-1 rounded mx-1">AWS_SECRET_ACCESS_KEY</code>،
              <code className="bg-amber-100 px-1 rounded">AWS_REGION</code> في إعدادات البيئة.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleReindex}
            disabled={loading || stats.total === 0}
            className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:from-zinc-300 disabled:via-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            إعادة فهرسة جميع الصور
          </button>

          {done && (
            <p className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تم جدولة إعادة الفهرسة — ستبدأ في الخلفية
            </p>
          )}
          {error && (
            <p className="text-sm text-red-700 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <p className="text-xs text-zinc-500 leading-relaxed">
            ستتم إعادة فهرسة {stats.total} صورة في الخلفية — قد تستغرق العملية بضع دقائق حسب العدد.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: number;
  icon: any;
  variant: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "bg-zinc-50 border-zinc-200 text-zinc-900",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    danger: "bg-red-50 border-red-200 text-red-900",
  };
  const iconVariants = {
    default: "text-zinc-500",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${variants[variant]}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${iconVariants[variant]}`} />
        <span className="text-xs font-semibold opacity-80">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold tracking-tight">{value.toLocaleString("ar-SA")}</p>
    </div>
  );
}
