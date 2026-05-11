"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
      // 1. Get presigned URL from our API
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
      if (!res.ok) throw new Error("فشل الحصول على رابط الرفع");
      const { presignedUrl, photoId, storageKey } = await res.json();

      // 2. Upload directly to R2
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

      // 3. Confirm upload and trigger processing
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
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
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
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-indigo-500" : "text-gray-300"}`} />
        <p className="font-semibold text-gray-700 mb-1">اسحب وأفلت الصور هنا</p>
        <p className="text-sm text-gray-400">أو اضغط لاختيار الصور من جهازك</p>
        <p className="text-xs text-gray-300 mt-2">JPG, PNG, WEBP — حتى 20MB لكل صورة</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {files.length} ملف — {done} مكتمل {uploading > 0 && `— ${uploading} جاري الرفع`} {errors > 0 && `— ${errors} فشل`}
            </p>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              مسح القائمة
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <img
                    src={URL.createObjectURL(f.file)}
                    alt={f.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(f.file.size)}</p>
                  {f.status === "uploading" && (
                    <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                  {f.status === "error" && <p className="text-xs text-red-500 mt-0.5">{f.error}</p>}
                </div>
                <div className="flex-shrink-0">
                  {f.status === "done" && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {f.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {f.status === "uploading" && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                  {f.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
