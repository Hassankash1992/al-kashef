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

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="اسم الشركة">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="الـ Slug (رابط الشركة)">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputCls + " font-mono"}
            dir="ltr"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="الباقة">
          <select
            value={form.plan}
            onChange={(e) => setForm({ ...form, plan: e.target.value })}
            className={inputCls + " appearance-none cursor-pointer"}
          >
            <option value="STARTER">مبتدئ</option>
            <option value="PRO">احترافي</option>
            <option value="AGENCY">وكالة</option>
          </select>
        </Field>
        <Field label="الحالة">
          <select
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
            className={inputCls + " appearance-none cursor-pointer"}
          >
            <option value="active">نشط</option>
            <option value="inactive">موقوف</option>
          </select>
        </Field>
        <Field label="اللون الأساسي">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-11 h-11 rounded-xl border-2 border-zinc-200 cursor-pointer shrink-0"
            />
            <input
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className={inputCls + " font-mono"}
              dir="ltr"
            />
          </div>
        </Field>
      </div>

      <Field label="ملاحظات داخلية" hint="لا يراها المشترك">
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className={inputCls + " resize-none"}
          placeholder="ملاحظات، تواصل سابق، سبب الإيقاف..."
        />
      </Field>

      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
        {success && (
          <span className="text-emerald-700 text-sm flex items-center gap-1 font-bold">
            <CheckCircle className="w-4 h-4" /> تم الحفظ
          </span>
        )}
        {error && (
          <span className="text-red-700 text-sm flex items-center gap-1 font-medium">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        )}
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
