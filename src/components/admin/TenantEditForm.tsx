"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    isActive: boolean;
    notes: string | null;
    primaryColor: string;
  };
}

export default function TenantEditForm({ tenant }: Props) {
  const [form, setForm] = useState({
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    isActive: tenant.isActive,
    notes: tenant.notes ?? "",
    primaryColor: tenant.primaryColor,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="اسم الشركة">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </Field>
        <Field label="الـ Slug (رابط الشركة)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
            dir="ltr"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="الباقة">
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="STARTER">مبتدئ (STARTER)</option>
            <option value="PRO">احترافي (PRO)</option>
            <option value="AGENCY">وكالة (AGENCY)</option>
          </select>
        </Field>
        <Field label="الحالة">
          <select
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="active">نشط ✅</option>
            <option value="inactive">موقوف ❌</option>
          </select>
        </Field>
        <Field label="اللون الأساسي">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <input
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
              dir="ltr"
            />
          </div>
        </Field>
      </div>

      <Field label="ملاحظات داخلية (لا يراها المشترك)">
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="ملاحظات، تواصل سابق، سبب الإيقاف..."
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
        {success && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> تم الحفظ
          </span>
        )}
        {error && (
          <span className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
