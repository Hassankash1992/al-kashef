"use client";

import { useState } from "react";
import { Trash2, ZoomIn, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Photo {
  id: string;
  url: string;
  fullUrl: string;
  originalName: string | null;
  status: string;
  createdAt: Date;
}

interface Props {
  photos: Photo[];
  eventId: string;
}

export default function PhotoGrid({ photos, eventId }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
        <div className="text-gray-300 text-5xl mb-3">📷</div>
        <p className="text-gray-500 font-medium">لا توجد صور بعد</p>
        <p className="text-gray-400 text-sm mt-1">ارفع صورك من المنطقة أعلاه</p>
      </div>
    );
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      await fetch(`/api/events/${eventId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: Array.from(selected) }),
      });
      setSelected(new Set());
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  }

  const statusIcon = (status: string) => {
    if (status === "PROCESSED" || status === "FACE_INDEXED") return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (status === "PROCESSING") return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    if (status === "FAILED") return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    return null;
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <p className="text-sm text-indigo-700 font-medium flex-1">{selected.size} صورة محددة</p>
          <button onClick={() => setSelected(new Set())} className="text-xs text-indigo-500 hover:text-indigo-700">
            إلغاء التحديد
          </button>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "جاري الحذف..." : "حذف المحددة"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all ${
              selected.has(photo.id) ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-gray-200"
            }`}
            onClick={() => toggleSelect(photo.id)}
          >
            <img
              src={photo.url}
              alt={photo.originalName || "صورة"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(photo); }}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
            </button>
            {selected.has(photo.id) && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className="absolute bottom-2 left-2">{statusIcon(photo.status)}</div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.fullUrl}
            alt={lightbox.originalName || ""}
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
