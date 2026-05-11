"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";

interface PlanConfig {
  plan: string;
  displayName: string;
  maxEvents: number;
  maxPhotosPerEvent: number;
  maxStorageGB: number;
  maxTeamMembers: number;
  faceSearchEnabled: boolean;
  customDomainEnabled: boolean;
  watermarkRemoval: boolean;
  priceMonthly: number;
  priceYearly: number;
}

export default function PlanConfigEditor({ config }: { config: PlanConfig }) {
  const [form, setForm] = useState(config);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function save() {
    setLoading(true);
    setDone(false);
    setError("");
    try {
      const res = await fetch("/api/admin/system/plans", {
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
      setLoading(false);
    }
  }

  function num(val: string) { return parseInt(val) || 0; }
  function flt(val: string) { return parseFloat(val) || 0; }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Field label="الاسم بالعربي">
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="حد الفعاليات" hint="-1 = لا حد">
          <input type="number" value={form.maxEvents} onChange={(e) => setForm({ ...form, maxEvents: num(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="صور/فعالية" hint="-1 = لا حد">
          <input type="number" value={form.maxPhotosPerEvent} onChange={(e) => setForm({ ...form, maxPhotosPerEvent: num(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="تخزين GB" hint="-1 = لا حد">
          <input type="number" value={form.maxStorageGB} onChange={(e) => setForm({ ...form, maxStorageGB: flt(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="أعضاء الفريق" hint="-1 = لا حد">
          <input type="number" value={form.maxTeamMembers} onChange={(e) => setForm({ ...form, maxTeamMembers: num(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="السعر الشهري (ر.س)">
          <input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: flt(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="السعر السنوي (ر.س)">
          <input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: flt(e.target.value) })} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Toggle label="البحث بالوجه" value={form.faceSearchEnabled} onChange={(v) => setForm({ ...form, faceSearchEnabled: v })} />
        <Toggle label="الدومين المخصص" value={form.customDomainEnabled} onChange={(v) => setForm({ ...form, customDomainEnabled: v })} />
        <Toggle label="إزالة العلامة المائية" value={form.watermarkRemoval} onChange={(v) => setForm({ ...form, watermarkRemoval: v })} />
      </div>

      <div className="flex items-center gap-3 flex-wrap pt-2">
        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ {config.plan}
        </button>
        {done && (
          <span className="text-emerald-700 text-sm flex items-center gap-1 font-bold">
            <CheckCircle className="w-4 h-4" /> تم الحفظ
          </span>
        )}
        {error && <span className="text-red-700 text-sm font-medium">{error}</span>}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
        {label} {hint && <span className="text-zinc-400 font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
        value
          ? "bg-amber-50 border-amber-300 text-amber-800"
          : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"
      }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${value ? "bg-amber-500 ring-2 ring-amber-200" : "bg-zinc-300"}`} />
      {label}
    </button>
  );
}
