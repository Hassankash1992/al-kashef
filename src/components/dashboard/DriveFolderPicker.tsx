"use client";

import { useState, useEffect } from "react";
import { Folder, Image as ImageIcon, Loader2, Search, ChevronLeft, X, Download } from "lucide-react";

interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  thumbnailLink?: string;
}

interface Props {
  eventId: string;
  onImportStarted: (jobId: string) => void;
}

export default function DriveFolderPicker({ eventId, onImportStarted }: Props) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [previewFiles, setPreviewFiles] = useState<DriveFile[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [syncMode, setSyncMode] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadFolders(); }, []);

  async function loadFolders() {
    setLoadingFolders(true);
    setError("");
    try {
      const res = await fetch("/api/integrations/google-drive/folders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFolders(data.folders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFolders(false);
    }
  }

  async function selectFolder(folder: DriveFolder) {
    setSelectedFolder(folder);
    setLoadingFiles(true);
    setPreviewFiles([]);
    try {
      const res = await fetch(`/api/integrations/google-drive/files?folderId=${folder.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreviewFiles(data.files.slice(0, 8));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function startImport() {
    if (!selectedFolder) return;
    setImporting(true);
    setError("");
    try {
      const res = await fetch("/api/integrations/google-drive/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, folderId: selectedFolder.id, syncMode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onImportStarted(data.jobId);
    } catch (err: any) {
      setError(err.message);
      setImporting(false);
    }
  }

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingFolders) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        <span className="text-sm text-zinc-600 font-medium">جاري تحميل مجلداتك...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        <p className="font-bold mb-1">حدث خطأ</p>
        <p className="mb-2">{error}</p>
        <button onClick={loadFolders} className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!selectedFolder ? (
        <>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن مجلد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 pr-9 pl-4 py-2.5 border-2 border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
            />
          </div>

          <div className="border border-zinc-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            {filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                {searchQuery ? "لا توجد نتائج" : "لا توجد مجلدات في Drive"}
              </div>
            ) : (
              filteredFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => selectFolder(folder)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50/50 transition-colors border-b border-zinc-100 last:border-0 text-right group"
                >
                  <Folder className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-sm text-zinc-900 flex-1 font-medium truncate">{folder.name}</span>
                  <ChevronLeft className="w-4 h-4 text-zinc-300 group-hover:text-amber-500" />
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedFolder(null)} className="w-7 h-7 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Folder className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="font-bold text-zinc-900 truncate">{selectedFolder.name}</span>
            </div>
          </div>

          {loadingFiles ? (
            <div className="flex items-center gap-2 text-sm text-zinc-600 py-4 font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل الصور...
            </div>
          ) : (
            <>
              {previewFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previewFiles.map((file) => (
                    <div key={file.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200">
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-zinc-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <p className="font-bold text-amber-900">{previewFiles.length}+ صورة في هذا المجلد</p>
                <p className="text-xs text-amber-700 mt-0.5">سيتم استيراد جميع الصور ومعالجتها تلقائياً</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                <input type="checkbox" checked={syncMode}
                  onChange={(e) => setSyncMode(e.target.checked)}
                  className="rounded border-zinc-300 text-amber-600 focus:ring-amber-400 w-4 h-4" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900">وضع المزامنة</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">استيراد الصور الجديدة فقط (تجاهل المستوردة سابقاً)</p>
                </div>
              </label>

              <button
                onClick={startImport}
                disabled={importing}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {importing ? "جاري بدء الاستيراد..." : `ابدأ استيراد "${selectedFolder.name}"`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
