"use client";

import { useState } from "react";
import { CheckCircle, Loader2, TestTube } from "lucide-react";

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
      <p className="text-xs text-gray-500 mb-3">
        ننصح بإنشاء IAM User منفصل بصلاحية <code className="bg-gray-100 px-1 rounded">s3:GetObject s3:PutObject s3:DeleteObject</code> فقط على هذا الـ Bucket.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Access Key ID *</label>
          <input required type="text" dir="ltr" value={form.accessKeyId}
            onChange={(e) => setForm((f) => ({ ...f, accessKeyId: e.target.value }))}
            placeholder="AKIAIOSFODNN7EXAMPLE"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Secret Access Key *</label>
          <input required type="password" dir="ltr" value={form.secretAccessKey}
            onChange={(e) => setForm((f) => ({ ...f, secretAccessKey: e.target.value }))}
            placeholder="••••••••••••••••••••••••••••••••••••••••"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Bucket Name *</label>
          <input required type="text" dir="ltr" value={form.bucket}
            onChange={(e) => setForm((f) => ({ ...f, bucket: e.target.value }))}
            placeholder="my-photos-bucket"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Region *</label>
          <select required value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            dir="ltr"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            {AWS_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">CDN URL (اختياري)</label>
        <input type="url" dir="ltr" value={form.cdnUrl}
          onChange={(e) => setForm((f) => ({ ...f, cdnUrl: e.target.value }))}
          placeholder="https://cdn.yoursite.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <p className="text-xs text-gray-400 mt-0.5">إذا كنت تستخدم CloudFront أو CDN آخر أمام S3</p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.setAsDefault}
          onChange={(e) => setForm((f) => ({ ...f, setAsDefault: e.target.checked }))}
          className="rounded border-gray-300 text-indigo-600" />
        <span className="text-xs text-gray-700">استخدم كتخزين افتراضي بدلاً من تخزين المنصة</span>
      </label>

      {testResult && (
        <div className={`flex items-center gap-2 text-xs p-2.5 rounded-lg ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {testResult.message}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleTest} disabled={testing || !form.accessKeyId || !form.bucket}
          className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube className="w-3.5 h-3.5" />}
          اختبار الاتصال
        </button>
        <button type="submit" disabled={saving || !form.accessKeyId || !form.secretAccessKey || !form.bucket}
          className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50">
          {saving ? "جاري الحفظ..." : "حفظ وربط AWS S3"}
        </button>
      </div>
    </form>
  );
}
