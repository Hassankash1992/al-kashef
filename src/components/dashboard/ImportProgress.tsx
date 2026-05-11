"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface JobResult {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  status: "running" | "completed" | "failed";
  currentFile?: string;
  error?: string;
}

interface Job {
  id: string;
  status: string;
  result: JobResult | null;
  error: string | null;
}

interface Props {
  jobId: string;
  onComplete?: () => void;
}

export default function ImportProgress({ jobId, onComplete }: Props) {
  const [job, setJob] = useState<Job | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data);

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          clearInterval(intervalRef.current);
          if (data.status === "COMPLETED" && onComplete) {
            setTimeout(onComplete, 1500);
          }
        }
      } catch {}
    }

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  if (!job) {
    return (
      <div className="flex items-center gap-3 py-4 px-4 bg-white border border-zinc-100 rounded-2xl">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-sm text-zinc-700 font-medium">جاري تتبع حالة الاستيراد...</span>
      </div>
    );
  }

  const result = job.result;
  const isRunning = job.status === "PROCESSING" || job.status === "PENDING";
  const isCompleted = job.status === "COMPLETED";
  const isFailed = job.status === "FAILED";

  const progress = result && result.total > 0
    ? Math.round(((result.processed + result.failed + result.skipped) / result.total) * 100)
    : isRunning ? 5 : 100;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        {isRunning && <Loader2 className="w-5 h-5 animate-spin text-amber-600 shrink-0" />}
        {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
        {isFailed && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 text-sm">
            {isRunning && "جاري الاستيراد..."}
            {isCompleted && "اكتمل الاستيراد"}
            {isFailed && "فشل الاستيراد"}
          </p>
          {result?.currentFile && isRunning && (
            <p className="text-xs text-zinc-500 truncate mt-0.5 font-mono">{result.currentFile}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? "bg-emerald-500" :
              isFailed ? "bg-red-400" :
              "bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-amber-700 font-bold">{progress}%</span>
          {result && (
            <span className="text-zinc-600 font-medium">
              {result.total > 0 ? `${result.processed + result.failed}/${result.total}` : "..."}
            </span>
          )}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="مستوردة" value={result.processed} variant="success" />
          <Stat label="مُتجاهلة" value={result.skipped} variant="default" />
          <Stat label="فاشلة" value={result.failed} variant="danger" />
        </div>
      )}

      {isFailed && (job.error || result?.error) && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-medium">{job.error || result?.error}</p>
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium leading-relaxed">
          ✓ تم استيراد <strong>{result?.processed}</strong> صورة بنجاح. سيتم معالجتها وإنشاء الـ thumbnails في الخلفية.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, variant }: { label: string; value: number; variant: "success" | "default" | "danger" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    default: "bg-zinc-50 text-zinc-700 border-zinc-200",
    danger: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`rounded-xl p-3 text-center border ${styles[variant]}`}>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-xs font-semibold mt-0.5">{label}</p>
    </div>
  );
}
