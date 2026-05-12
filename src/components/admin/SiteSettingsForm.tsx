"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, Image as ImageIcon, AlertTriangle } from "lucide-react";
import type { SiteSettingsData } from "@/lib/site-settings";

const DEFAULT_SOCIAL: NonNullable<SiteSettingsData["socialLinks"]> = {};

export default function SiteSettingsForm({ initial }: { initial: SiteSettingsData }) {
  const [form, setForm] = useState({
    ...initial,
    socialLinks: initial.socialLinks ?? DEFAULT_SOCIAL,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function save() {
    setSaving(true);
    setError("");
    setDone(false);
    try {
      const res = await fetch("/api/admin/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Section title="الهوية الأساسية">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="اسم المنصة">
            <input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="الشعار التسويقي (Tagline)">
            <input
              value={form.siteTagline}
              onChange={(e) => setForm({ ...form, siteTagline: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="اللون الأساسي (Brand Color)">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-12 h-12 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0"
            />
            <input
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className={inputCls + " font-mono"}
              dir="ltr"
            />
          </div>
        </Field>
      </Section>

      <Section title="الشعارات والصور">
        <ImageField
          label="الشعار الرئيسي (Logo)"
          hint="يظهر في الـ navigation وصفحات الدخول"
          value={form.logoUrl ?? ""}
          onChange={(v) => setForm({ ...form, logoUrl: v })}
        />
        <ImageField
          label="شعار الفوتر"
          hint="ارفع الصورة على Cloudflare R2 أو أي خدمة CDN، ثم الصق الرابط هنا"
          value={form.footerLogoUrl ?? ""}
          onChange={(v) => setForm({ ...form, footerLogoUrl: v })}
        />
        <ImageField
          label="Favicon (16×16 / 32×32)"
          hint="أيقونة المتصفح الصغيرة"
          value={form.faviconUrl ?? ""}
          onChange={(v) => setForm({ ...form, faviconUrl: v })}
        />
        <ImageField
          label="OG Image (1200×630)"
          hint="صورة المعاينة عند مشاركة الرابط في الشبكات الاجتماعية"
          value={form.ogImageUrl ?? ""}
          onChange={(v) => setForm({ ...form, ogImageUrl: v })}
        />
      </Section>

      <Section title="معلومات التواصل">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="إيميل التواصل">
            <input
              type="email" dir="ltr"
              value={form.contactEmail ?? ""}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              placeholder="hello@kashef.app"
              className={inputCls}
            />
          </Field>
          <Field label="إيميل الدعم الفني">
            <input
              type="email" dir="ltr"
              value={form.supportEmail ?? ""}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              placeholder="support@kashef.app"
              className={inputCls}
            />
          </Field>
          <Field label="رقم الهاتف">
            <input
              dir="ltr"
              value={form.contactPhone ?? ""}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="+966 50 000 0000"
              className={inputCls}
            />
          </Field>
          <Field label="رقم WhatsApp">
            <input
              dir="ltr"
              value={form.whatsappNumber ?? ""}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              placeholder="966500000000"
              className={inputCls}
            />
          </Field>
        </div>
      </Section>

      <Section title="روابط الشبكات الاجتماعية">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(["twitter", "instagram", "facebook", "linkedin"] as const).map((key) => (
            <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
              <input
                dir="ltr"
                value={(form.socialLinks?.[key]) ?? ""}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...(form.socialLinks ?? {}), [key]: e.target.value } })
                }
                placeholder={`https://${key}.com/handle`}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title="وضع الصيانة" warn>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm font-bold text-zinc-900">تفعيل وضع الصيانة</p>
            <p className="text-xs text-zinc-500 mt-0.5">يحجب الموقع للزوار ويعرض رسالة الصيانة فقط</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, maintenanceMode: !form.maintenanceMode })}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              form.maintenanceMode
                ? "bg-red-500"
                : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                form.maintenanceMode ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </label>
        {form.maintenanceMode && (
          <Field label="رسالة الصيانة">
            <textarea
              rows={2}
              value={form.maintenanceMessage ?? ""}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
              placeholder="نقوم حالياً بأعمال صيانة، سنعود قريباً..."
              className={inputCls + " resize-none"}
            />
          </Field>
        )}
      </Section>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-lg">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ كل التغييرات
        </button>
        {done && (
          <span className="text-emerald-700 text-sm flex items-center gap-1.5 font-bold">
            <CheckCircle className="w-4 h-4" /> تم حفظ الإعدادات
          </span>
        )}
      </div>
    </div>
  );
}

function Section({ title, warn, children }: { title: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 space-y-4 ${
      warn ? "border-red-200" : "border-zinc-100"
    }`}>
      <h2 className={`font-bold text-base flex items-center gap-2 ${warn ? "text-red-700" : "text-zinc-900"}`}>
        {warn && <AlertTriangle className="w-4 h-4" />}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImageField({
  label, hint, value, onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-stretch gap-3">
        <div className="w-16 h-16 bg-zinc-100 border-2 border-zinc-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          {value ? (
            <img src={value} alt="" className="w-full h-full object-contain" />
          ) : (
            <ImageIcon className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="url" dir="ltr"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
          />
          {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
        </div>
      </div>
    </Field>
  );
}
