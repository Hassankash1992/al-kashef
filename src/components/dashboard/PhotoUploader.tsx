"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface UploadFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface Props {
  eventId: string;
  tenantId: string;
}

export default function PhotoUploader({ eventId, tenantId }: Props) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    const uploadFiles: UploadFile[] = imageFiles.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2),
      status: "pending",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
    uploadFiles.forEach(uploadFile);
  }, [eventId]);

  async function uploadFile(uf: UploadFile) {
    setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "uploading" } : f));
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
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "فشل الحصول على رابط الرفع");
      }
      const { presignedUrl, photoId } = await res.json();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", uf.file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 90);
          setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress } : f));
        }
      };
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error("فشل رفع الملف"));
        xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
        xhr.send(uf.file);
      });

      await fetch("/api/photos/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, eventId }),
      });

      setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "done", progress: 100 } : f));
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "error", error: err.message } : f));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const done = files.filter((f) => f.status === "done").length;
  const uploading = files.filter((f) => f.status === "uploading").length;
  const errors = files.filter((f) => f.status === "error").length;

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
          onChange={(e) => addFiles(e.target.files)}
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
        <p className="text-xs text-zinc-400 mt-3">JPG، PNG، WEBP — حتى 20MB لكل صورة</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 flex-wrap gap-2">
            <p className="text-sm font-semibold text-zinc-800">
              {files.length} ملف — <span className="text-emerald-700">{done} مكتمل</span>
              {uploading > 0 && <span className="text-amber-700"> · {uploading} جارٍ</span>}
              {errors > 0 && <span className="text-red-700"> · {errors} فشل</span>}
            </p>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-medium transition-colors"
            >
              مسح القائمة
            </button>
          </div>
          <div className="divide-y divide-zinc-50 max-h-80 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                  <img
                    src={URL.createObjectURL(f.file)}
                    alt={f.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-900 truncate font-medium">{f.file.name}</p>
                  <p className="text-xs text-zinc-500">{formatBytes(f.file.size)}</p>
                  {f.status === "uploading" && (
                    <div className="mt-1.5 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700 rounded-full transition-all"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                  {f.status === "error" && <p className="text-xs text-red-600 mt-0.5 font-medium">{f.error}</p>}
                </div>
                <div className="shrink-0">
                  {f.status === "done" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  {f.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {f.status === "uploading" && <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />}
                  {f.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-zinc-200" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
