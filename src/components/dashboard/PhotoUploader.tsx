"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2, Clock } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface UploadFile {
  file: File;
  id: string;          // unique client-side id
  photoId?: string;    // server-side Photo.id (set ONCE after presign)
  status: "queued" | "uploading" | "processing" | "done" | "error";
  progress: number;
  attempts: number;
  error?: string;
}

interface Props {
  eventId: string;
  tenantId: string;
}

const MAX_CONCURRENT = 2;        // throttle to avoid Face++ rate limits
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function PhotoUploader({ eventId }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<UploadFile[]>([]);
  const claimed = useRef<Set<string>>(new Set()); // synchronous claim — no race condition

  useEffect(() => { filesRef.current = files; }, [files]);

  function updateFile(id: string, patch: Partial<UploadFile>) {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f));
  }

  // Claim & process next available file
  const tryStartNext = useCallback(async () => {
    if (claimed.current.size >= MAX_CONCURRENT) return;
    const next = filesRef.current.find(
      (f) => f.status === "queued" && !claimed.current.has(f.id)
    );
    if (!next) return;
    claimed.current.add(next.id); // synchronous claim
    updateFile(next.id, { status: "uploading", progress: 0 });
    uploadFile(next)
      .finally(() => {
        claimed.current.delete(next.id);
        // Drain remaining slots
        for (let i = 0; i < MAX_CONCURRENT; i++) {
          setTimeout(() => tryStartNext(), 0);
        }
      });
  }, []);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid: UploadFile[] = [];
    Array.from(newFiles).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX_FILE_SIZE) return;
      valid.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        status: "queued",
        progress: 0,
        attempts: 0,
      });
    });
    setFiles((prev) => [...prev, ...valid]);
    // Start processing
    for (let i = 0; i < MAX_CONCURRENT; i++) {
      setTimeout(() => tryStartNext(), 50 * i);
    }
  }, [tryStartNext]);

  /**
   * Upload one file:
   *   1. Presign (creates Photo row) — ONCE, no retry
   *   2. PUT to R2 — retry on transient errors (idempotent, same URL)
   *   3. Notify server — retry on transient errors (idempotent on photoId)
   */
  async function uploadFile(uf: UploadFile) {
    let photoId: string | undefined;
    let presignedUrl: string | undefined;

    // ─── Step 1: Presign (ONCE) ─────────────────────────────────────────────
    try {
      const res = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          filename: uf.file.name,
          contentType: uf.file.type,
          size: uf.file.size,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تجهيز الرفع");
      presignedUrl = data.presignedUrl;
      photoId = data.photoId;
      updateFile(uf.id, { photoId });
    } catch (err: any) {
      updateFile(uf.id, { status: "error", error: err?.message ?? "فشل التجهيز" });
      return;
    }

    if (!presignedUrl || !photoId) {
      updateFile(uf.id, { status: "error", error: "بيانات ناقصة من الخادم" });
      return;
    }

    // ─── Step 2: Upload to R2 (with retry — idempotent) ─────────────────────
    let r2Success = false;
    let r2Error: string | undefined;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await uploadToR2(presignedUrl, uf.file, (p) => updateFile(uf.id, { progress: p }));
        r2Success = true;
        break;
      } catch (err: any) {
        r2Error = err?.message ?? "فشل الرفع";
        if (attempt < MAX_RETRIES) {
          updateFile(uf.id, { error: `إعادة المحاولة ${attempt + 1}...`, attempts: attempt });
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    if (!r2Success) {
      updateFile(uf.id, { status: "error", error: r2Error });
      return;
    }

    // ─── Step 3: Notify server (with retry — idempotent on photoId) ─────────
    updateFile(uf.id, { status: "processing", progress: 95, error: undefined });
    let notifySuccess = false;
    let notifyError: string | undefined;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch("/api/photos/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId, eventId }),
        });
        if (res.ok) {
          notifySuccess = true;
          break;
        }
        const data = await res.json().catch(() => ({}));
        notifyError = data.error || `HTTP ${res.status}`;
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
      } catch (err: any) {
        notifyError = err?.message ?? "خطأ في الشبكة";
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
      }
    }

    if (notifySuccess) {
      updateFile(uf.id, { status: "done", progress: 100, error: undefined });
    } else {
      // R2 upload succeeded but notify failed — photo exists, just stuck in UPLOADED
      // Mark as "done" anyway since photo IS uploaded; user can re-trigger processing later
      updateFile(uf.id, { status: "done", progress: 100, error: `رُفعت لكن المعالجة فشلت: ${notifyError}` });
    }
  }

  function uploadToR2(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.timeout = 180_000;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 90));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`فشل الرفع (HTTP ${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
      xhr.ontimeout = () => reject(new Error("انتهت مهلة الرفع"));
      xhr.onabort = () => reject(new Error("أُلغي الرفع"));
      xhr.send(file);
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const queued = files.filter((f) => f.status === "queued").length;
  const uploading = files.filter((f) => f.status === "uploading").length;
  const processing = files.filter((f) => f.status === "processing").length;
  const done = files.filter((f) => f.status === "done").length;
  const errors = files.filter((f) => f.status === "error").length;
  const totalDone = done + errors;
  const overallProgress = files.length > 0 ? Math.round((totalDone / files.length) * 100) : 0;

  function retryAll() {
    setFiles((prev) => prev.map((f) =>
      f.status === "error" ? { ...f, status: "queued", error: undefined, attempts: 0, photoId: undefined } : f
    ));
    setTimeout(() => tryStartNext(), 100);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all overflow-hidden group ${
          isDragging
            ? "border-amber-400 bg-amber-50"
            : "border-zinc-300 bg-white hover:border-amber-400 hover:bg-amber-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); if (inputRef.current) inputRef.current.value = ""; }}
        />
        <div className={`inline-flex w-14 h-14 sm:w-16 sm:h-16 rounded-2xl items-center justify-center mb-4 transition-all ${
          isDragging
            ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-lg shadow-amber-500/30"
            : "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 group-hover:from-amber-200 group-hover:to-amber-100"
        }`}>
          <Upload className={`w-6 h-6 sm:w-7 sm:h-7 ${isDragging ? "text-black" : "text-amber-600"}`} strokeWidth={2.5} />
        </div>
        <p className="font-bold text-zinc-900 text-base sm:text-lg mb-1">اسحب وأفلت الصور هنا</p>
        <p className="text-sm text-zinc-500">أو اضغط لاختيار الصور من جهازك</p>
        <p className="text-xs text-zinc-400 mt-3">JPG، PNG، WEBP — حتى 20MB · {MAX_CONCURRENT} متوازي</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 bg-gradient-to-l from-amber-50/50 to-white">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="text-sm font-bold text-zinc-900">
                {totalDone} / {files.length} · <span className="text-amber-700">{overallProgress}%</span>
              </p>
              <div className="flex items-center gap-2 text-xs">
                {queued > 0 && <Pill icon={Clock} label={`${queued} انتظار`} color="zinc" />}
                {uploading > 0 && <Pill icon={Loader2} label={`${uploading} جارٍ`} color="amber" spin />}
                {processing > 0 && <Pill icon={Loader2} label={`${processing} يعالج`} color="blue" spin />}
                {done > 0 && <Pill icon={CheckCircle} label={`${done} مكتمل`} color="emerald" />}
                {errors > 0 && (
                  <button onClick={retryAll} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors} فشل · إعادة
                  </button>
                )}
              </div>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-2 border-b border-zinc-100">
            <p className="text-xs text-zinc-500">رفع متوازي ذكي · بدون تكرار</p>
            <button
              onClick={() => setFiles((prev) => prev.filter((f) => f.status !== "done"))}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-medium"
            >
              مسح المكتملة
            </button>
          </div>

          <div className="divide-y divide-zinc-50 max-h-96 overflow-y-auto">
            {files.map((f) => <FileRow key={f.id} file={f} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function FileRow({ file: f }: { file: UploadFile }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
        <img src={URL.createObjectURL(f.file)} alt={f.file.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-900 truncate font-medium">{f.file.name}</p>
        <p className="text-xs text-zinc-500">{formatBytes(f.file.size)}</p>
        {(f.status === "uploading" || f.status === "processing") && (
          <div className="mt-1.5 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700 rounded-full transition-all"
              style={{ width: `${f.progress}%` }}
            />
          </div>
        )}
        {f.status === "error" && <p className="text-xs text-red-600 mt-0.5 font-medium">{f.error}</p>}
        {f.status === "uploading" && f.error && <p className="text-xs text-amber-700 mt-0.5">{f.error}</p>}
      </div>
      <div className="shrink-0">
        {f.status === "queued" && <Clock className="w-5 h-5 text-zinc-400" />}
        {f.status === "uploading" && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
        {f.status === "processing" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
        {f.status === "done" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
        {f.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
      </div>
    </div>
  );
}

function Pill({ icon: Icon, label, color, spin }: { icon: any; label: string; color: string; spin?: boolean }) {
  const styles: Record<string, string> = {
    zinc: "bg-zinc-100 text-zinc-700 border-zinc-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${styles[color]}`}>
      <Icon className={`w-3 h-3 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
