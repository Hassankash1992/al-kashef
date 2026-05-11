"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ArrowRight, Loader2, Lock } from "lucide-react";
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/events"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">فعالية جديدة</h1>
          <p className="text-zinc-500 text-sm mt-0.5">أنشئ فعالية وابدأ برفع الصور</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event info */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 space-y-5">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2 text-base">
            <CalendarDays className="w-4 h-4 text-amber-600" />
            معلومات الفعالية
          </h2>

          <Field label="اسم الفعالية" required>
            <input
              type="text"
              required
              placeholder="مثال: زواج أحمد ومريم"
              value={form.name}
              onChange={handleNameChange}
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
            />
          </Field>

          <Field label="رابط الفعالية" required hint={`الرابط: /g/[شركتك]/${form.slug || "..."}`}>
            <input
              type="text"
              required
              placeholder="ahmad-mariam-wedding"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              dir="ltr"
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 font-mono transition-all"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="نوع الفعالية">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all appearance-none cursor-pointer"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Field label="تاريخ الفعالية">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
                dir="ltr"
              />
            </Field>
          </div>

          <Field label="وصف اختياري">
            <textarea
              rows={3}
              placeholder="وصف مختصر للفعالية..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 resize-none transition-all"
            />
          </Field>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2 text-base">
            <Lock className="w-4 h-4 text-amber-600" />
            الخصوصية والتحكم
          </h2>

          <Toggle
            label="تفعيل البحث بالوجه"
            desc="يسمح للضيوف بالبحث عن صورهم عبر السيلفي"
            checked={form.faceSearchEnabled}
            onChange={(v) => setForm((f) => ({ ...f, faceSearchEnabled: v }))}
          />
          <Toggle
            label="معرض عام"
            desc="يسمح للضيوف بتصفّح جميع صور الفعالية"
            checked={form.galleryPublic}
            onChange={(v) => setForm((f) => ({ ...f, galleryPublic: v }))}
          />
          <Toggle
            label="السماح بالتحميل"
            desc="يسمح للضيوف بتحميل الصور إلى أجهزتهم"
            checked={form.downloadEnabled}
            onChange={(v) => setForm((f) => ({ ...f, downloadEnabled: v }))}
          />

          <Field label="كلمة مرور للمعرض (اختياري)" hint="اتركها فارغة إذا لا تريد حماية">
            <input
              type="text"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              dir="ltr"
            />
          </Field>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading || !form.name || !form.slug}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:from-zinc-300 disabled:via-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...
              </>
            ) : (
              "إنشاء الفعالية والمتابعة لرفع الصور"
            )}
          </button>
          <Link
            href="/events"
            className="px-5 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl transition-colors text-sm text-center"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-zinc-800 block">
        {label}
        {required && <span className="text-amber-600 mr-1">*</span>}
      </label>
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
