"use client";

import { useState, useEffect } from "react";
import { Folder, Image, Loader2, Search, ChevronLeft, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    loadFolders();
  }, []);

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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-sm text-gray-500 mr-3">جاري تحميل مجلداتك...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
        <p className="font-medium mb-1">حدث خطأ</p>
        <p>{error}</p>
        <button onClick={loadFolders} className="mt-2 text-xs text-red-700 underline">
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
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن مجلد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            {filteredFolders.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                {searchQuery ? "لا توجد نتائج" : "لا توجد مجلدات في Drive"}
              </div>
            ) : (
              filteredFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => selectFolder(folder)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 text-right"
                >
                  <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{folder.name}</span>
                  <ChevronLeft className="w-4 h-4 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedFolder(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-800">{selectedFolder.name}</span>
            </div>
          </div>

          {loadingFiles ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري تحميل الصور...
            </div>
          ) : (
            <>
              {previewFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previewFiles.map((file) => (
                    <div key={file.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {file.thumbnailLink ? (
                        <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-700">
                <p className="font-medium">{previewFiles.length}+ صورة في هذا المجلد</p>
                <p className="text-xs text-indigo-500 mt-0.5">سيتم استيراد جميع الصور ومعالجتها تلقائياً</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={syncMode}
                  onChange={(e) => setSyncMode(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">وضع المزامنة</p>
                  <p className="text-xs text-gray-400">استيراد الصور الجديدة فقط (تجاهل المستوردة سابقاً)</p>
                </div>
              </label>

              <button
                onClick={startImport}
                disabled={importing}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {importing ? "جاري بدء الاستيراد..." : `ابدأ استيراد الصور من "${selectedFolder.name}"`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
