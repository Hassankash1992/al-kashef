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

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

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
      <div className="flex gap-2 flex-wrap">
        {[
          { val: "single", label: "مشترك واحد" },
          { val: "plan", label: "حسب الباقة" },
          { val: "all", label: "الجميع" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTarget(val as any)}
            className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-colors ${
              target === val
                ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {target === "single" && (
        <select
          value={form.tenantId}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
          className={inputCls + " appearance-none cursor-pointer"}
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
          className={inputCls + " appearance-none cursor-pointer"}
        >
          <option value="">اختر الباقة...</option>
          <option value="STARTER">مبتدئ</option>
          <option value="PRO">احترافي</option>
          <option value="AGENCY">وكالة</option>
        </select>
      )}

      {target === "all" && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-semibold">
          <Users className="w-4 h-4 shrink-0" />
          ستُرسل الرسالة لجميع المشتركين النشطين ({tenants.length})
        </div>
      )}

      <input
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        placeholder="عنوان الرسالة..."
        className={inputCls}
      />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        placeholder="محتوى الرسالة..."
        rows={5}
        className={inputCls + " resize-none"}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={send}
          disabled={loading || !form.subject || !form.body || (target === "single" && !form.tenantId) || (target === "plan" && !form.plan)}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:from-zinc-300 disabled:via-zinc-400 disabled:to-zinc-500 disabled:cursor-not-allowed text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال
        </button>
        {done !== null && (
          <span className="text-emerald-700 text-sm font-bold flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> أُرسلت لـ {done} مشترك
          </span>
        )}
        {error && <span className="text-red-700 text-sm font-medium">{error}</span>}
      </div>
    </div>
  );
}
