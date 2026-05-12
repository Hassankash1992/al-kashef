"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check } from "lucide-react";

const EVENT_TYPES = [
  { value: "WEDDING", label: "زواج" },
  { value: "CONFERENCE", label: "مؤتمر" },
  { value: "GRADUATION", label: "تخرج" },
  { value: "CORPORATE", label: "فعالية شركة" },
  { value: "BIRTHDAY", label: "عيد ميلاد" },
  { value: "OTHER", label: "أخرى" },
];

const EVENT_STATUSES = [
  {
    value: "DRAFT",
    label: "مسودة",
    desc: "غير منشورة — لا يراها الضيوف",
    color: "bg-amber-50 text-amber-800 border-amber-300 ring-amber-200",
    activeColor: "bg-amber-500 text-white border-amber-500",
    dot: "bg-amber-500",
  },
  {
    value: "ACTIVE",
    label: "نشطة",
    desc: "منشورة ومتاحة للضيوف",
    color: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200",
    activeColor: "bg-emerald-500 text-white border-emerald-500",
    dot: "bg-emerald-500",
  },
  {
    value: "ARCHIVED",
    label: "مؤرشفة",
    desc: "محفوظة — لا يصل لها أحد",
    color: "bg-zinc-50 text-zinc-700 border-zinc-300 ring-zinc-200",
    activeColor: "bg-zinc-700 text-white border-zinc-700",
    dot: "bg-zinc-500",
  },
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
    if (!confirm("هل أنت متأكد من حذف هذه الفعالية وجميع صورها؟ لا يمكن التراجع.")) return;
    setLoading(true);
    try {
      await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      router.push("/events");
    } catch {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Event info */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 space-y-5">
        <h2 className="font-bold text-zinc-900 text-base">معلومات الفعالية</h2>

        <Field label="اسم الفعالية">
          <input
            type="text" required value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="نوع الفعالية">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className={inputCls + " appearance-none cursor-pointer"}
            >
              {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="الحالة">
            <div className="grid grid-cols-3 gap-2">
              {EVENT_STATUSES.map((s) => {
                const active = form.status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s.value }))}
                    className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                      active ? s.activeColor + " shadow-md" : s.color + " hover:ring-4"
                    }`}
                    title={s.desc}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : s.dot}`} />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
              {EVENT_STATUSES.find((s) => s.value === form.status)?.desc}
            </p>
          </Field>
        </div>

        <Field label="تاريخ الفعالية">
          <input
            type="date" value={form.date} dir="ltr"
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={inputCls}
          />
        </Field>

        <Field label="وصف اختياري">
          <textarea
            rows={3} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputCls + " resize-none"}
          />
        </Field>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h2 className="font-bold text-zinc-900 text-base">الخصوصية والتحكم</h2>

        {[
          { key: "faceSearchEnabled", label: "تفعيل البحث بالوجه", desc: "يسمح للضيوف بالبحث عن صورهم بالسيلفي" },
          { key: "galleryPublic", label: "معرض عام", desc: "يسمح للضيوف بتصفح جميع الصور" },
          { key: "downloadEnabled", label: "السماح بالتحميل", desc: "يسمح للضيوف بتحميل الصور" },
          { key: "watermarkEnabled", label: "علامة مائية", desc: "إضافة علامة مائية على الصور" },
        ].map(({ key, label, desc }) => (
          <Toggle
            key={key}
            label={label}
            desc={desc}
            checked={form[key as keyof typeof form] as boolean}
            onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
          />
        ))}

        <Field label="كلمة مرور (اختياري)" hint="اتركها فارغة إذا لا تريد حماية">
          <input
            type="text" value={form.password} dir="ltr" placeholder="••••••••"
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className={inputCls}
          />
        </Field>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit" disabled={saving}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : "حفظ الإعدادات"}
        </button>
        <button
          type="button" onClick={handleDelete} disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          حذف الفعالية
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-zinc-800 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  label, desc, checked, onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer py-1">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          checked
            ? "bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700"
            : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
