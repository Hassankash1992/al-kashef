"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { slugify } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "WEDDING", label: "زواج" },
  { value: "CONFERENCE", label: "مؤتمر" },
  { value: "GRADUATION", label: "تخرج" },
  { value: "CORPORATE", label: "فعالية شركة" },
  { value: "BIRTHDAY", label: "عيد ميلاد" },
  { value: "OTHER", label: "أخرى" },
];

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    type: "WEDDING",
    date: "",
    description: "",
    downloadEnabled: true,
    faceSearchEnabled: true,
    galleryPublic: true,
    password: "",
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      router.push(`/events/${data.id}/photos`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/events" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">فعالية جديدة</h1>
          <p className="text-gray-500 text-sm">أنشئ فعالية وابدأ رفع الصور</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            معلومات الفعالية
          </h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">اسم الفعالية *</label>
            <input
              type="text"
              required
              placeholder="مثال: زواج أحمد ومريم"
              value={form.name}
              onChange={handleNameChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">رابط الفعالية *</label>
            <input
              type="text"
              required
              placeholder="ahmad-mariam-wedding"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-xs text-gray-400">سيكون رابط الفعالية: /g/شركتك/{form.slug || "رابط-الفعالية"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">نوع الفعالية</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">تاريخ الفعالية</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">وصف اختياري</label>
            <textarea
              rows={3}
              placeholder="وصف مختصر للفعالية..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">إعدادات الخصوصية والتحكم</h2>

          <Toggle
            label="تفعيل البحث بالوجه"
            desc="يسمح للضيوف بالبحث عن صورهم عبر السيلفي"
            checked={form.faceSearchEnabled}
            onChange={(v) => setForm((f) => ({ ...f, faceSearchEnabled: v }))}
          />
          <Toggle
            label="معرض عام"
            desc="يسمح للضيوف بتصفح جميع صور الفعالية"
            checked={form.galleryPublic}
            onChange={(v) => setForm((f) => ({ ...f, galleryPublic: v }))}
          />
          <Toggle
            label="السماح بالتحميل"
            desc="يسمح للضيوف بتحميل الصور"
            checked={form.downloadEnabled}
            onChange={(v) => setForm((f) => ({ ...f, downloadEnabled: v }))}
          />

          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-medium text-gray-700">كلمة مرور للمعرض (اختياري)</label>
            <input
              type="text"
              placeholder="اتركه فارغاً لعدم الحماية"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dir="ltr"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !form.name || !form.slug}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "جاري الإنشاء..." : "إنشاء الفعالية والمتابعة لرفع الصور"}
          </button>
          <Link href="/events" className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-indigo-600" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${checked ? "right-0.5" : "left-0.5"}`} />
      </button>
    </label>
  );
}
