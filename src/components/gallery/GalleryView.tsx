"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Search, Download, X, ZoomIn, ChevronRight, ChevronLeft, Loader2, Lock, ImageOff, ArrowRight, Sparkles } from "lucide-react";
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

export default function GalleryView({ tenant, event, photos }: Props) {
  const [unlocked, setUnlocked] = useState(!event.password);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [mode, setMode] = useState<"home" | "gallery" | "face-search" | "results">("home");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Photo[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const brandColor = tenant.primaryColor || "#f59e0b";

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

  // Password screen
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-amber-100">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-amber-700" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-1">معرض محمي</h2>
          <p className="text-zinc-500 text-sm mb-6">{event.name}</p>
          <input
            type="password"
            placeholder="أدخل كلمة المرور"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkPassword()}
            className={cn(
              "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-4 transition-all",
              passwordError
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-zinc-200 focus:border-amber-400 focus:ring-amber-100"
            )}
          />
          {passwordError && <p className="text-red-600 text-xs mb-3 font-semibold">كلمة مرور غير صحيحة</p>}
          <button
            onClick={checkPassword}
            className="w-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  const resultsPhotos = mode === "results" ? searchResults : photos;
  const isGalleryMode = mode === "gallery" || mode === "results";

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-amber-50/20" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          {tenant.logo ? (
            <img src={tenant.logo} alt={tenant.name} className="h-9 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-xl text-black text-base font-bold flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${brandColor}, #b45309)` }}>
              {tenant.name[0]}
            </div>
          )}
          <span className="font-bold text-zinc-900 text-base">{tenant.name}</span>
        </div>
      </header>

      {/* Home view */}
      {mode === "home" && (
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold text-amber-700 mb-4">
            <Sparkles className="w-3 h-3" />
            {photos.length} صورة متاحة
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-zinc-900 mb-3 tracking-tight">{event.name}</h1>
          {event.date && <p className="text-zinc-500 mb-2 text-sm sm:text-base">{event.date}</p>}
          {event.description && (
            <p className="text-zinc-600 mb-8 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">{event.description}</p>
          )}

          <div className="space-y-3 max-w-xs mx-auto mt-8">
            {event.faceSearchEnabled && (
              <>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])}
                />
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black font-bold py-4 rounded-2xl text-base transition-all shadow-xl shadow-amber-500/30 hover:scale-[1.02]"
                >
                  <Camera className="w-5 h-5" strokeWidth={2.5} />
                  التقط سيلفي وابحث عن صورك
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleSelfie(e.target.files[0])}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-3 bg-white border-2 border-zinc-200 hover:border-amber-300 text-zinc-800 font-semibold py-3.5 rounded-2xl text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  رفع صورة من جهازك
                </button>
              </>
            )}
            {event.galleryPublic && (
              <button
                onClick={() => setMode("gallery")}
                className="w-full inline-flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
              >
                <Search className="w-4 h-4" />
                تصفّح المعرض كاملاً
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gallery / Results */}
      {isGalleryMode && (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setMode("home")}
              className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              {mode === "results" && !searching && (
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">
                  {searchResults.length > 0 ? `وجدنا ${searchResults.length} صورة لك ✨` : "لم نجد صور مطابقة"}
                </h2>
              )}
              {mode === "gallery" && (
                <h2 className="font-bold text-zinc-900 text-base sm:text-lg">المعرض — {photos.length} صورة</h2>
              )}
              {searching && <h2 className="font-bold text-zinc-900 text-base">جاري البحث...</h2>}
            </div>
            {event.faceSearchEnabled && mode === "gallery" && (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> ابحث بالوجه
              </button>
            )}
          </div>

          {searching && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-50 rounded-full" />
                <Loader2 className="relative w-12 h-12 animate-spin text-amber-600 mb-4" />
              </div>
              <p className="text-zinc-700 font-semibold mt-4">جاري تحليل صورتك والبحث...</p>
              <p className="text-zinc-500 text-xs mt-1">قد يستغرق الأمر بضع ثوان</p>
            </div>
          )}

          {searchError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-4">
              <p className="text-red-800 font-bold text-sm mb-1">{searchError}</p>
              {qualityIssues.length > 1 && (
                <ul className="text-red-700 text-xs space-y-1 mt-3 list-disc list-inside">
                  {qualityIssues.slice(1).map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
              <button
                onClick={retrySearch}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                حاول مرة أخرى
              </button>
            </div>
          )}

          {!searching && (
            <>
              {resultsPhotos.length === 0 && mode === "results" && !searchError && (
                <div className="text-center py-16">
                  <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-4">
                    <Search className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-900 font-bold mb-1">لم نعثر على صور مطابقة</p>
                  <p className="text-zinc-500 text-sm mb-6">حاول بصورة أوضح للوجه مع إضاءة جيدة</p>
                  <button
                    onClick={retrySearch}
                    className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
                  >
                    حاول مرة أخرى
                  </button>
                </div>
              )}

              {resultsPhotos.length === 0 && mode === "gallery" && (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-100">
                  <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
                    <ImageOff className="w-7 h-7 text-zinc-400" />
                  </div>
                  <p className="text-zinc-700 font-bold">لا توجد صور بعد</p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {resultsPhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all bg-zinc-100 border border-zinc-100 hover:border-amber-300"
                    onClick={() => setLightbox(idx)}
                  >
                    <img src={photo.thumbUrl} alt={photo.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {mode === "results" && photo.similarity != null && (
                      <span className="absolute top-2 right-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-black text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
                        {photo.similarity}%
                      </span>
                    )}
                    {event.downloadEnabled && (
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPhoto(photo.fullUrl, photo.name); }}
                        className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur rounded-lg p-1.5 shadow-md"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-800" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {lightbox > 0 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          {lightbox < resultsPhotos.length - 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <img
            src={resultsPhotos[lightbox]?.previewUrl}
            alt={resultsPhotos[lightbox]?.name || ""}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {event.downloadEnabled && (
            <button
              className="absolute bottom-6 left-1/2 -translate-x-1/2 text-black bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl shadow-amber-500/40"
              onClick={(e) => { e.stopPropagation(); downloadPhoto(resultsPhotos[lightbox].fullUrl, resultsPhotos[lightbox].name); }}
            >
              <Download className="w-4 h-4" /> تحميل الصورة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
