"use client";

import { useState } from "react";
import { CheckCircle, Loader2, TestTube, AlertCircle } from "lucide-react";

interface Props {
  connected: boolean;
  onSuccess: () => void;
}

export default function AWSS3Form({ connected, onSuccess }: Props) {
  const [form, setForm] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    bucket: "",
    region: "us-east-1",
    cdnUrl: "",
    setAsDefault: true,
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
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
        body: JSON.stringify(form),
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
      const res = await fetch("/api/integrations/aws-s3/connect", {
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

  const AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
    "me-south-1", "af-south-1",
  ];

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <p className="text-xs text-zinc-700 mb-2 leading-relaxed">
        ننصح بإنشاء IAM User منفصل بصلاحية{" "}
        <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-bold">s3:GetObject s3:PutObject s3:DeleteObject</code>{" "}
        فقط على هذا الـ Bucket.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Access Key ID *">
          <input required type="text" dir="ltr" value={form.accessKeyId}
            onChange={(e) => setForm((f) => ({ ...f, accessKeyId: e.target.value }))}
            placeholder="AKIAIOSFODNN7EXAMPLE"
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
            placeholder="my-photos-bucket"
            className={inputCls} />
        </Field>
        <Field label="Region *">
          <select required value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            dir="ltr"
            className={inputCls + " appearance-none cursor-pointer"}>
            {AWS_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <Field label="CDN URL (اختياري)" hint="إذا كنت تستخدم CloudFront أو CDN آخر">
        <input type="url" dir="ltr" value={form.cdnUrl}
          onChange={(e) => setForm((f) => ({ ...f, cdnUrl: e.target.value }))}
          placeholder="https://cdn.yoursite.com"
          className={inputCls} />
      </Field>

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
          اختبار الاتصال
        </button>
        <button type="submit" disabled={saving || !form.accessKeyId || !form.secretAccessKey || !form.bucket}
          className="flex-1 inline-flex items-center justify-center text-xs bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black py-2 rounded-lg font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50">
          {saving ? "جاري الحفظ..." : "حفظ وربط AWS S3"}
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
