"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

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

  const pendingCount = stats.processed; // PROCESSED but not yet FACE_INDEXED
  const progress =
    stats.total > 0
      ? Math.round((stats.faceIndexed / stats.total) * 100)
      : 0;

  async function handleReindex() {
    setLoading(true);
    setDone(false);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/reindex`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي الصور"
          value={stats.total}
          icon={<Clock className="w-4 h-4" />}
          color="gray"
        />
        <StatCard
          label="مفهرسة"
          value={stats.faceIndexed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <StatCard
          label="في الانتظار"
          value={pendingCount}
          icon={<Clock className="w-4 h-4" />}
          color="yellow"
        />
        <StatCard
          label="فاشلة"
          value={stats.failed}
          icon={<AlertCircle className="w-4 h-4" />}
          color="red"
        />
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>تقدم الفهرسة</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Re-index controls */}
      {!rekognitionConfigured ? (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
          <p className="font-semibold mb-1">AWS Rekognition غير مهيأ</p>
          <p className="text-amber-600">أضف AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION إلى ملف .env لتفعيل الفهرسة.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleReindex}
            disabled={loading || stats.total === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            إعادة فهرسة جميع الصور
          </button>

          {done && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تم جدولة إعادة الفهرسة — ستبدأ العملية في الخلفية
            </p>
          )}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <p className="text-xs text-gray-400">
            ستتم إعادة فهرسة {stats.total} صورة في الخلفية. العملية قد تستغرق بضع دقائق.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "gray" | "green" | "yellow" | "red";
}) {
  const colors = {
    gray: "bg-gray-50 text-gray-600",
    green: "bg-green-50 text-green-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-center gap-1.5 text-xs mb-2 opacity-70">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString("ar-SA")}</p>
    </div>
  );
}
