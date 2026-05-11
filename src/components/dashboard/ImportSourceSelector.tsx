"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, RefreshCw } from "lucide-react";
import DriveFolderPicker from "./DriveFolderPicker";
import ImportProgress from "./ImportProgress";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Props {
  eventId: string;
  driveConnected: boolean;
  driveEmail: string | null;
  lastDriveFolderId: string | null;
  lastSyncAt: Date | null;
}

export default function ImportSourceSelector({
  eventId, driveConnected, driveEmail, lastDriveFolderId, lastSyncAt,
}: Props) {
  const router = useRouter();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<"google-drive" | null>(
    driveConnected ? "google-drive" : null
  );

  if (activeJobId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <Cloud className="w-4 h-4" />
          الاستيراد من Google Drive قيد التنفيذ
        </div>
        <ImportProgress
          jobId={activeJobId}
          onComplete={() => {
            router.push(`/events/${eventId}/photos`);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Drive */}
      {driveConnected && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
            <span className="text-xl">🗂️</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Google Drive</p>
              {driveEmail && <p className="text-xs text-gray-400 font-mono">{driveEmail}</p>}
            </div>
            {lastSyncAt && (
              <p className="text-xs text-gray-400">
                آخر مزامنة: {format(lastSyncAt, "d MMM", { locale: ar })}
              </p>
            )}
          </div>
          <div className="p-5">
            <DriveFolderPicker eventId={eventId} onImportStarted={setActiveJobId} />
          </div>
        </div>
      )}

      {/* Re-sync hint if previously synced */}
      {driveConnected && lastDriveFolderId && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 font-medium mb-1">المزامنة السريعة</p>
          <p className="text-xs text-gray-400 mb-3">
            استيراد الصور الجديدة فقط من آخر مجلد تم ربطه، بدون الحاجة لاختيار المجلد مجدداً.
          </p>
          <button
            onClick={async () => {
              const res = await fetch("/api/integrations/google-drive/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, folderId: lastDriveFolderId, syncMode: true }),
              });
              const data = await res.json();
              if (res.ok) setActiveJobId(data.jobId);
            }}
            className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            مزامنة الآن
          </button>
        </div>
      )}
    </div>
  );
}
