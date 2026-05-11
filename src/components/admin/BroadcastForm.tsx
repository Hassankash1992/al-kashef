"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle, Users } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  plan: string;
}

export default function BroadcastForm({ tenants }: { tenants: Tenant[] }) {
  const [target, setTarget] = useState<"all" | "plan" | "single">("single");
  const [form, setForm] = useState({
    tenantId: "",
    plan: "",
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function send() {
    if (!form.subject || !form.body) return;
    setLoading(true);
    setError("");
    setDone(null);

    const payload: any = { subject: form.subject, body: form.body };
    if (target === "single") payload.tenantId = form.tenantId;
    if (target === "plan") payload.plan = form.plan;

    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDone(data.sent);
      setForm({ tenantId: "", plan: "", subject: "", body: "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* نوع الإرسال */}
      <div className="flex gap-2">
        {[
          { val: "single", label: "مشترك واحد" },
          { val: "plan", label: "حسب الباقة" },
          { val: "all", label: "الجميع" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTarget(val as any)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              target === val ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* تحديد المستلم */}
      {target === "single" && (
        <select
          value={form.tenantId}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">اختر مشتركاً...</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.plan})</option>
          ))}
        </select>
      )}

      {target === "plan" && (
        <select
          value={form.plan}
          onChange={(e) => setForm({ ...form, plan: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="">اختر الباقة...</option>
          <option value="STARTER">مبتدئ (STARTER)</option>
          <option value="PRO">احترافي (PRO)</option>
          <option value="AGENCY">وكالة (AGENCY)</option>
        </select>
      )}

      {target === "all" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
          <Users className="w-4 h-4 shrink-0" />
          ستُرسل الرسالة لجميع المشتركين النشطين ({tenants.length})
        </div>
      )}

      <input
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        placeholder="عنوان الرسالة..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="محتوى الرسالة..."
        rows={5}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={send}
          disabled={loading || !form.subject || !form.body || (target === "single" && !form.tenantId) || (target === "plan" && !form.plan)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال
        </button>
        {done !== null && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> أُرسلت لـ {done} مشترك
          </span>
        )}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    </div>
  );
}
