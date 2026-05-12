"use client";

import { useState } from "react";
import { Save, Loader2, CheckCircle, MessageCircle, ExternalLink } from "lucide-react";

interface Props {
  initial: {
    enabled: boolean;
    phoneNumberId: string;
    accessTokenMasked: string;
    businessAccountId: string;
    webhookSecret: string;
    testNumber: string;
    rateLimitPerMin: number;
  };
}

export default function WhatsAppForm({ initial }: Props) {
  const [form, setForm] = useState({
    enabled: initial.enabled,
    phoneNumberId: initial.phoneNumberId,
    accessToken: "",
    businessAccountId: initial.businessAccountId,
    webhookSecret: "",
    testNumber: initial.testNumber,
    rateLimitPerMin: initial.rateLimitPerMin,
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
      const payload: any = {
        enabled: form.enabled,
        phoneNumberId: form.phoneNumberId,
        businessAccountId: form.businessAccountId,
        testNumber: form.testNumber,
        rateLimitPerMin: form.rateLimitPerMin,
      };
      if (form.accessToken) payload.accessToken = form.accessToken;
      if (form.webhookSecret) payload.webhookSecret = form.webhookSecret;

      const res = await fetch("/api/admin/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : "https://your-domain.com/api/webhooks/whatsapp";

  return (
    <div className="space-y-5">
      {/* Setup Guide */}
      <div className="bg-gradient-to-l from-amber-50 to-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5">
        <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          خطوات الربط
        </h3>
        <ol className="text-sm text-amber-900 space-y-1.5 list-decimal mr-5 leading-relaxed">
          <li>اذهب إلى <a href="https://developers.facebook.com/" target="_blank" className="text-amber-800 underline font-bold">Facebook Developers <ExternalLink className="w-3 h-3 inline" /></a> وأنشئ تطبيق WhatsApp Business</li>
          <li>أضف Phone Number في WhatsApp → Setup</li>
          <li>انسخ <strong>Phone Number ID</strong> و <strong>WhatsApp Business Account ID</strong></li>
          <li>أنشئ <strong>Permanent Access Token</strong> من System Users</li>
          <li>اضبط الـ Webhook URL: <code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs">{webhookUrl}</code></li>
        </ol>
      </div>

      {/* Toggle */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-base font-bold text-zinc-900">تفعيل WhatsApp API</p>
            <p className="text-xs text-zinc-500 mt-0.5">عند التفعيل، ستُرسل التنبيهات المجدولة عبر WhatsApp تلقائياً</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, enabled: !form.enabled })}
            className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${
              form.enabled
                ? "bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700"
                : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
                form.enabled ? "right-1" : "left-1"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Credentials */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 space-y-4">
        <h3 className="font-bold text-zinc-900">بيانات الاعتماد</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number ID *">
            <input
              dir="ltr"
              value={form.phoneNumberId}
              onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
              placeholder="123456789012345"
              className={inputCls + " font-mono"}
            />
          </Field>
          <Field label="WhatsApp Business Account ID">
            <input
              dir="ltr"
              value={form.businessAccountId}
              onChange={(e) => setForm({ ...form, businessAccountId: e.target.value })}
              placeholder="123456789012345"
              className={inputCls + " font-mono"}
            />
          </Field>
        </div>

        <Field label="Access Token *" hint={initial.accessTokenMasked ? `محفوظ حالياً: ${initial.accessTokenMasked} — اتركه فارغاً للإبقاء عليه` : "EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}>
          <input
            type="password" dir="ltr"
            value={form.accessToken}
            onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
            placeholder={initial.accessTokenMasked || "EAAxxxxxxxxxxxxxxxxxxxxx"}
            className={inputCls + " font-mono"}
          />
        </Field>

        <Field label="Webhook Verify Token (Secret)" hint={initial.webhookSecret ? "محفوظ — اتركه فارغاً للإبقاء عليه" : "أنشئ كلمة سرية واستخدمها في إعدادات الـ Webhook على Meta"}>
          <input
            type="password" dir="ltr"
            value={form.webhookSecret}
            onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
            placeholder={initial.webhookSecret || "your-secret-string"}
            className={inputCls + " font-mono"}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="رقم اختبار" hint="رقم سعودي بصيغة دولية بدون +">
            <input
              dir="ltr"
              value={form.testNumber}
              onChange={(e) => setForm({ ...form, testNumber: e.target.value })}
              placeholder="966500000000"
              className={inputCls + " font-mono"}
            />
          </Field>
          <Field label="حد الإرسال (رسالة/دقيقة)">
            <input
              type="number" dir="ltr"
              min={1}
              max={1000}
              value={form.rateLimitPerMin}
              onChange={(e) => setForm({ ...form, rateLimitPerMin: parseInt(e.target.value) || 80 })}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="flex items-center gap-3 sticky bottom-4 bg-white p-4 rounded-2xl border border-zinc-100 shadow-lg">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </button>
        {done && (
          <span className="text-emerald-700 text-sm flex items-center gap-1.5 font-bold">
            <CheckCircle className="w-4 h-4" /> تم الحفظ
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
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
