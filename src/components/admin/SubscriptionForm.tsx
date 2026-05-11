"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  tenantId: string;
  current: {
    plan: string;
    status: string;
    billingCycle: string;
    amount: number;
    currency: string;
    currentPeriodEnd: string | null;
  } | null;
}

export default function SubscriptionForm({ tenantId, current }: Props) {
  const [form, setForm] = useState({
    plan: current?.plan ?? "STARTER",
    status: current?.status ?? "ACTIVE",
    billingCycle: current?.billingCycle ?? "MONTHLY",
    amount: current?.amount ?? 0,
    currency: current?.currency ?? "SAR",
    currentPeriodEnd: current?.currentPeriodEnd
      ? new Date(current.currentPeriodEnd).toISOString().split("T")[0]
      : "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function save() {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          currentPeriodEnd: form.currentPeriodEnd || null,
        }),
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
        <Field label="حالة الاشتراك">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className={inputCls + " appearance-none cursor-pointer"}
          >
            <option value="TRIALING">تجريبي</option>
            <option value="ACTIVE">نشط</option>
            <option value="PAST_DUE">متأخر</option>
            <option value="CANCELLED">ملغي</option>
            <option value="EXPIRED">منتهي</option>
          </select>
        </Field>
        <Field label="دورة الفوترة">
          <select
            value={form.billingCycle}
            onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
            className={inputCls + " appearance-none cursor-pointer"}
          >
            <option value="MONTHLY">شهري</option>
            <option value="YEARLY">سنوي</option>
          </select>
        </Field>
        <Field label="المبلغ والعملة">
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className={inputCls}
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={inputCls + " w-24 appearance-none cursor-pointer"}
            >
              <option value="SAR">ر.س</option>
              <option value="USD">USD</option>
              <option value="AED">د.إ</option>
            </select>
          </div>
        </Field>
        <Field label="تاريخ انتهاء الدورة الحالية">
          <input
            type="date"
            value={form.currentPeriodEnd}
            onChange={(e) => setForm({ ...form, currentPeriodEnd: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <button
          onClick={save}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:from-zinc-300 disabled:via-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          تطبيق التغييرات
        </button>
        {success && (
          <span className="text-emerald-700 text-sm flex items-center gap-1 font-bold">
            <CheckCircle className="w-4 h-4" /> تم التحديث
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
