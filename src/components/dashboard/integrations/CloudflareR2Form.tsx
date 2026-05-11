"use client";

import { useState } from "react";
import { Loader2, TestTube, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  connected: boolean;
  onSuccess: () => void;
}

export default function CloudflareR2Form({ connected, onSuccess }: Props) {
  const [form, setForm] = useState({
    accountId: "",
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
    cdnUrl: "",
    setAsDefault: true,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all";

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/aws-s3/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessKeyId: form.accessKeyId,
          secretAccessKey: form.secretAccessKey,
          bucket: form.bucket,
          region: "auto",
          cdnUrl: form.cdnUrl,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: "خطأ في الشبكة" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/integrations/cloudflare-r2/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-xs text-zinc-700 mb-2 leading-relaxed">
        من Cloudflare Dashboard → R2 → Manage API Tokens، أنشئ Token بصلاحية <strong>Object Read &amp; Write</strong>.
      </p>

      <Field label="Account ID *" hint="من شاشة R2 Overview على اليمين">
        <input required type="text" dir="ltr" value={form.accountId}
          onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
          placeholder="abc123def456..."
          className={inputCls} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Access Key ID *">
          <input required type="text" dir="ltr" value={form.accessKeyId}
            onChange={(e) => setForm((f) => ({ ...f, accessKeyId: e.target.value }))}
            className={inputCls} />
        </Field>
        <Field label="Secret Access Key *">
          <input required type="password" dir="ltr" value={form.secretAccessKey}
            onChange={(e) => setForm((f) => ({ ...f, secretAccessKey: e.target.value }))}
            placeholder="••••••••••••••••••••"
            className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Bucket Name *">
          <input required type="text" dir="ltr" value={form.bucket}
            onChange={(e) => setForm((f) => ({ ...f, bucket: e.target.value }))}
            placeholder="my-photos"
            className={inputCls} />
        </Field>
        <Field label="Public URL / CDN *">
          <input required type="url" dir="ltr" value={form.cdnUrl}
            onChange={(e) => setForm((f) => ({ ...f, cdnUrl: e.target.value }))}
            placeholder="https://pub-xxx.r2.dev"
            className={inputCls} />
        </Field>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 font-semibold">
        <input type="checkbox" checked={form.setAsDefault}
          onChange={(e) => setForm((f) => ({ ...f, setAsDefault: e.target.checked }))}
          className="rounded border-zinc-300 text-amber-600 focus:ring-amber-400" />
        استخدم كتخزين افتراضي بدلاً من تخزين المنصة
      </label>

      {testResult && (
        <div className={`flex items-center gap-2 text-xs p-3 rounded-lg font-bold border ${
          testResult.ok
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {testResult.message}
        </div>
      )}

      {error && <p className="text-xs text-red-700 font-medium">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={handleTest} disabled={testing || !form.accessKeyId || !form.bucket}
          className="inline-flex items-center gap-1.5 text-xs bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 px-3 py-2 rounded-lg font-bold transition-colors disabled:opacity-50">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
          اختبار
        </button>
        <button type="submit" disabled={saving || !form.accountId || !form.accessKeyId || !form.bucket}
          className="flex-1 inline-flex items-center justify-center text-xs bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black py-2 rounded-lg font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50">
          {saving ? "جاري الحفظ..." : "حفظ وربط Cloudflare R2"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-700 mb-1 block">
        {label} {hint && <span className="text-zinc-400 font-normal">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}
