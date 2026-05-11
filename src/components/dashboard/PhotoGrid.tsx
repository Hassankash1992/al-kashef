"use client";

import { useState } from "react";
import { Trash2, ZoomIn, CheckCircle, Loader2, AlertCircle, X, ImageOff } from "lucide-react";

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
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm py-16 text-center">
        <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
          <ImageOff className="w-7 h-7 text-zinc-400" />
        </div>
        <p className="text-zinc-700 font-bold">لا توجد صور بعد</p>
        <p className="text-zinc-500 text-sm mt-1">ارفع صورك من المنطقة بالأعلى</p>
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
    if (!confirm(`حذف ${selected.size} صورة؟ لا يمكن التراجع.`)) return;
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
    if (status === "PROCESSED" || status === "FACE_INDEXED")
      return <div className="bg-emerald-500 rounded-full p-1"><CheckCircle className="w-3 h-3 text-white" /></div>;
    if (status === "PROCESSING")
      return <div className="bg-amber-500 rounded-full p-1"><Loader2 className="w-3 h-3 text-white animate-spin" /></div>;
    if (status === "FAILED")
      return <div className="bg-red-500 rounded-full p-1"><AlertCircle className="w-3 h-3 text-white" /></div>;
    return null;
  };

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-zinc-900 text-white rounded-xl px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold flex-1">{selected.size} صورة محددة</p>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-zinc-300 hover:text-white font-medium transition-colors"
          >
            إلغاء التحديد
          </button>
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "جاري الحذف..." : "حذف المحددة"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all bg-zinc-100 ${
              selected.has(photo.id)
                ? "border-amber-500 ring-2 ring-amber-200"
                : "border-transparent hover:border-amber-300"
            }`}
            onClick={() => toggleSelect(photo.id)}
          >
            <img
              src={photo.url}
              alt={photo.originalName || "صورة"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(photo); }}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur rounded-lg p-1.5 shadow-md"
            >
              <ZoomIn className="w-3.5 h-3.5 text-zinc-800" />
            </button>
            {selected.has(photo.id) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
            )}
            <div className="absolute bottom-2 left-2">{statusIcon(photo.status)}</div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.fullUrl}
            alt={lightbox.originalName || ""}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
