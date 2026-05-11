"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Search, Download, Share2, X, ZoomIn, ChevronRight, ChevronLeft, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  thumbUrl: string;
  previewUrl: string;
  fullUrl: string;
  name: string;
  similarity?: number;
}

interface Props {
  tenant: { name: string; logo: string | null; primaryColor: string };
  event: {
    id: string;
    name: string;
    description: string | null;
    date: string | null;
    password: string | null;
    downloadEnabled: boolean;
    faceSearchEnabled: boolean;
    shareEnabled: boolean;
    galleryPublic: boolean;
  };
  photos: Photo[];
  tenantSlug: string;
  eventSlug: string;
}

export default function GalleryView({ tenant, event, photos, tenantSlug, eventSlug }: Props) {
  const [unlocked, setUnlocked] = useState(!event.password);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [mode, setMode] = useState<"home" | "gallery" | "face-search" | "results">("home");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [displayPhotos, setDisplayPhotos] = useState(photos);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const brandColor = tenant.primaryColor || "#6366f1";

  function checkPassword() {
    if (passwordInput === event.password) {
      setUnlocked(true);
    } else {
      setPasswordError(true);
      setTimeout(() => setPasswordError(false), 2000);
    }
  }

  async function handleSelfie(file: File) {
    setSearching(true);
    setSearchError("");
    setQualityIssues([]);
    setMode("results");
    try {
      const formData = new FormData();
      formData.append("selfie", file);
      formData.append("eventId", event.id);
      const res = await fetch("/api/gallery/face-search", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.qualityIssues?.length) setQualityIssues(data.qualityIssues);
        throw new Error(data.error || "حدث خطأ أثناء البحث");
      }
      setSearchResults(data.photos || []);
    } catch (err: any) {
      setSearchError(err.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function retrySearch() {
    setSearchError("");
    setQualityIssues([]);
    setSearchResults([]);
    setMode("home");
  }

  function downloadPhoto(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">معرض محمي</h2>
          <p className="text-gray-500 text-sm mb-6">{event.name}</p>
          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkPassword()}
            className={cn("w-full border rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2", passwordError ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-indigo-300")}
          />
          {passwordError && <p className="text-red-500 text-xs mb-3">كلمة مرور غير صحيحة</p>}
          <button onClick={checkPassword} style={{ background: brandColor }} className="w-full text-white font-semibold py-3 rounded-xl text-sm transition-opacity hover:opacity-90">
            دخول
          </button>
        </div>
      </div>
    );
  }

  const resultsPhotos = mode === "results" ? searchResults : displayPhotos;
  const isGalleryMode = mode === "gallery" || mode === "results";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="h-8 object-contain" />
          ) : (
            <div className="h-8 px-3 rounded-lg text-white text-sm font-bold flex items-center" style={{ background: brandColor }}>
              {tenant.name[0]}
            </div>
          )}
          <span className="font-semibold text-gray-800">{tenant.name}</span>
        </div>
      </header>

      {/* Home view */}
      {mode === "home" && (
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
          {event.date && <p className="text-gray-400 mb-2">{event.date}</p>}
          {event.description && <p className="text-gray-600 mb-8 text-sm leading-relaxed">{event.description}</p>}

          <div className="space-y-3 max-w-xs mx-auto">
            {event.faceSearchEnabled && (
              <>
                <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ background: brandColor }}
                  className="w-full flex items-center justify-center gap-3 text-white font-semibold py-4 rounded-2xl text-base hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-5 h-5" />
                  التقط سيلفي وابحث عن صورك
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  رفع صورة من جهازك
                </button>
              </>
            )}
            {event.galleryPublic && (
              <button onClick={() => setMode("gallery")} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3.5 rounded-2xl text-sm hover:bg-gray-50 transition-colors">
                <Search className="w-4 h-4" />
                تصفح المعرض ({photos.length} صورة)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gallery / Results */}
      {isGalleryMode && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setMode("home")} className="text-gray-400 hover:text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex-1">
              {mode === "results" && !searching && (
                <h2 className="font-bold text-gray-900">
                  {searchResults.length > 0 ? `وجدنا ${searchResults.length} صورة لك` : "لم نجد صور مطابقة"}
                </h2>
              )}
              {mode === "gallery" && <h2 className="font-bold text-gray-900">المعرض — {photos.length} صورة</h2>}
              {searching && <h2 className="font-bold text-gray-900">جاري البحث...</h2>}
            </div>
            {event.faceSearchEnabled && mode === "gallery" && (
              <button onClick={() => cameraInputRef.current?.click()} style={{ color: brandColor }} className="text-sm font-medium flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> ابحث بالوجه
              </button>
            )}
          </div>

          {searching && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: brandColor }} />
              <p className="text-gray-500">جاري تحليل صورتك والبحث...</p>
            </div>
          )}

          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-4">
              <p className="text-red-700 font-semibold text-sm mb-1">{searchError}</p>
              {qualityIssues.length > 1 && (
                <ul className="text-red-600 text-xs space-y-0.5 mt-2 list-disc list-inside">
                  {qualityIssues.slice(1).map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={retrySearch}
                className="mt-3 text-xs font-semibold text-red-700 underline"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {!searching && (
            <>
              {resultsPhotos.length === 0 && mode === "results" && (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-gray-600 font-medium mb-2">لم نعثر على صور مطابقة</p>
                  <p className="text-gray-400 text-sm mb-6">حاول بصورة أوضح للوجه مع إضاءة جيدة</p>
                  <button onClick={retrySearch} className="text-sm font-medium underline" style={{ color: brandColor }}>
                    حاول مرة أخرى
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {resultsPhotos.map((photo, idx) => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setLightbox(idx)}>
                    <img src={photo.thumbUrl} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {mode === "results" && photo.similarity != null && (
                      <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        {photo.similarity}%
                      </span>
                    )}
                    {event.downloadEnabled && (
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.fullUrl, photo.name); }}
                        className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {mode === "results" && searchResults.length > 0 && event.downloadEnabled && (
                <div className="mt-6 text-center">
                  <button className="inline-flex items-center gap-2 font-semibold py-3 px-6 rounded-xl text-white text-sm" style={{ background: brandColor }}>
                    <Download className="w-4 h-4" />
                    تحميل جميع صوري ({searchResults.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-xl p-2" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          {lightbox > 0 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}>
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          {lightbox < resultsPhotos.length - 1 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2" onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}>
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          <img
            src={resultsPhotos[lightbox]?.previewUrl}
            alt={resultsPhotos[lightbox]?.name || ""}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {event.downloadEnabled && (
            <button
              className="absolute bottom-6 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); downloadPhoto(resultsPhotos[lightbox].fullUrl, resultsPhotos[lightbox].name); }}
            >
              <Download className="w-4 h-4" /> تحميل
            </button>
          )}
        </div>
      )}
    </div>
  );
}
