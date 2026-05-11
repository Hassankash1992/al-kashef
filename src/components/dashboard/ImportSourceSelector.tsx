"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Cloud, RefreshCw, FolderTree } from "lucide-react";
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

  if (activeJobId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-bold">
          <Cloud className="w-4 h-4" />
          الاستيراد من Google Drive قيد التنفيذ...
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
      {driveConnected && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900">Google Drive</p>
              {driveEmail && <p className="text-xs text-zinc-500 font-mono truncate">{driveEmail}</p>}
            </div>
            {lastSyncAt && (
              <p className="text-xs text-zinc-500 font-medium">
                آخر مزامنة: {format(lastSyncAt, "d MMM", { locale: ar })}
              </p>
            )}
          </div>
          <div className="p-5">
            <DriveFolderPicker eventId={eventId} onImportStarted={setActiveJobId} />
          </div>
        </div>
      )}

      {driveConnected && lastDriveFolderId && (
        <div className="bg-gradient-to-l from-amber-50 to-amber-50/50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-zinc-900 font-bold mb-1">المزامنة السريعة</p>
          <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
            استيراد الصور الجديدة فقط من آخر مجلد تم ربطه، بدون الحاجة لاختياره من جديد.
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
            className="inline-flex items-center gap-2 text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-2 rounded-lg font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            مزامنة الآن
          </button>
        </div>
      )}
    </div>
  );
}
