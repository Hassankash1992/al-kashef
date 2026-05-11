"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle, Loader2, Image, AlertCircle } from "lucide-react";

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
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data);

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setPolling(false);
          clearInterval(intervalRef.current);
          if (data.status === "COMPLETED" && onComplete) {
            setTimeout(onComplete, 1500);
          }
        }
      } catch {
        // Network error — keep polling
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 2000);
    return () => clearInterval(intervalRef.current);
  }, [jobId]);

  if (!job) {
    return (
      <div className="flex items-center gap-3 py-4">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="text-sm text-gray-600">جاري تتبع حالة الاستيراد...</span>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        {isRunning && <Loader2 className="w-5 h-5 animate-spin text-indigo-500 flex-shrink-0" />}
        {isCompleted && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
        {isFailed && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
        <div className="flex-1">
          <p className="font-medium text-gray-800 text-sm">
            {isRunning && "جاري الاستيراد..."}
            {isCompleted && "اكتمل الاستيراد"}
            {isFailed && "فشل الاستيراد"}
          </p>
          {result?.currentFile && isRunning && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{result.currentFile}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : isFailed ? "bg-red-400" : "bg-indigo-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{progress}%</span>
          {result && <span>{result.total > 0 ? `${result.processed + result.failed}/${result.total}` : "..."}</span>}
        </div>
      </div>

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="مستوردة" value={result.processed} color="green" />
          <Stat label="مُتجاهلة" value={result.skipped} color="gray" />
          <Stat label="فاشلة" value={result.failed} color="red" />
        </div>
      )}

      {isFailed && (job.error || result?.error) && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{job.error || result?.error}</p>
        </div>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
          تم استيراد {result?.processed} صورة بنجاح. سيتم معالجتها وإنشاء thumbnails في الخلفية.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: "text-green-700 bg-green-50",
    gray: "text-gray-600 bg-gray-50",
    red: "text-red-600 bg-red-50",
  };
  return (
    <div className={`rounded-xl p-2.5 text-center ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
