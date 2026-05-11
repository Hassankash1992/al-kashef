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
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Field label="اسم الباقة بالعربي">
          <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="حد الفعاليات (-1 = لا حد)">
          <input type="number" value={form.maxEvents} onChange={(e) => setForm({ ...form, maxEvents: num(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="صور/فعالية (-1 = لا حد)">
          <input type="number" value={form.maxPhotosPerEvent} onChange={(e) => setForm({ ...form, maxPhotosPerEvent: num(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="تخزين GB (-1 = لا حد)">
          <input type="number" value={form.maxStorageGB} onChange={(e) => setForm({ ...form, maxStorageGB: flt(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="أعضاء الفريق (-1 = لا حد)">
          <input type="number" value={form.maxTeamMembers} onChange={(e) => setForm({ ...form, maxTeamMembers: num(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="السعر الشهري (ر.س)">
          <input type="number" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: flt(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
        <Field label="السعر السنوي (ر.س)">
          <input type="number" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: flt(e.target.value) })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <Toggle label="البحث بالوجه (Rekognition)"
          value={form.faceSearchEnabled} onChange={(v) => setForm({ ...form, faceSearchEnabled: v })} />
        <Toggle label="الدومين المخصص"
          value={form.customDomainEnabled} onChange={(v) => setForm({ ...form, customDomainEnabled: v })} />
        <Toggle label="إزالة العلامة المائية"
          value={form.watermarkRemoval} onChange={(v) => setForm({ ...form, watermarkRemoval: v })} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button onClick={save} disabled={loading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ {config.plan}
        </button>
        {done && <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> تم</span>}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
        value ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
      }`}>
      <span className={`w-3 h-3 rounded-full ${value ? "bg-green-500" : "bg-gray-300"}`} />
      {label}
    </button>
  );
}
