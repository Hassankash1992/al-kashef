"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { Trash2 } from "lucide-react";

const EVENT_TYPES = [
  { value: "WEDDING", label: "زواج" },
  { value: "CONFERENCE", label: "مؤتمر" },
  { value: "GRADUATION", label: "تخرج" },
  { value: "CORPORATE", label: "فعالية شركة" },
  { value: "BIRTHDAY", label: "عيد ميلاد" },
  { value: "OTHER", label: "أخرى" },
];

const EVENT_STATUSES = [
  { value: "DRAFT", label: "مسودة" },
  { value: "ACTIVE", label: "نشطة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
];

interface EventData {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  date: Date | null;
  status: string;
  password: string | null;
  downloadEnabled: boolean;
  faceSearchEnabled: boolean;
  galleryPublic: boolean;
  watermarkEnabled: boolean;
}

export default function EventSettingsForm({ event }: { event: EventData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: event.name,
    slug: event.slug,
    type: event.type,
    date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
    description: event.description || "",
    status: event.status,
    password: event.password || "",
    downloadEnabled: event.downloadEnabled,
    faceSearchEnabled: event.faceSearchEnabled,
    galleryPublic: event.galleryPublic,
    watermarkEnabled: event.watermarkEnabled,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية وجميع صورها؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setLoading(true);
    try {
      await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      router.push("/events");
    } catch {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">معلومات الفعالية</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">اسم الفعالية</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">نوع الفعالية</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الحالة</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {EVENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">تاريخ الفعالية</label>
          <input type="date" value={form.date} dir="ltr"
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">وصف اختياري</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">الخصوصية والتحكم</h2>

        {[
          { key: "faceSearchEnabled", label: "تفعيل البحث بالوجه", desc: "يسمح للضيوف بالبحث عن صورهم" },
          { key: "galleryPublic", label: "معرض عام", desc: "يسمح بتصفح جميع الصور" },
          { key: "downloadEnabled", label: "السماح بالتحميل", desc: "يسمح للضيوف بتحميل الصور" },
          { key: "watermarkEnabled", label: "Watermark", desc: "إضافة علامة مائية على الصور" },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <button type="button" onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form[key as keyof typeof form] ? "bg-indigo-600" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${form[key as keyof typeof form] ? "right-0.5" : "left-0.5"}`} />
            </button>
          </label>
        ))}

        <div className="space-y-1.5 pt-2">
          <label className="text-sm font-medium text-gray-700">كلمة مرور (اختياري)</label>
          <input type="text" value={form.password} dir="ltr" placeholder="اتركه فارغاً لعدم الحماية"
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-600">تم حفظ الإعدادات بنجاح</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
        <button type="button" onClick={handleDelete} disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm disabled:opacity-50">
          <Trash2 className="w-4 h-4" />
          حذف
        </button>
      </div>
    </form>
  );
}
