"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

export default function AdminMessageQuick({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [form, setForm] = useState({ subject: "", body: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function send() {
    if (!form.subject || !form.body) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDone(true);
      setForm({ subject: "", body: "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-600 font-medium">إرسال رسالة إلى <span className="text-amber-700 font-bold">{tenantName}</span></p>
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
        rows={4}
        className={inputCls + " resize-none"}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={send}
          disabled={loading || !form.subject || !form.body}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال
        </button>
        {done && (
          <span className="text-emerald-700 text-sm flex items-center gap-1 font-bold">
            <CheckCircle className="w-4 h-4" /> تم الإرسال
          </span>
        )}
        {error && <span className="text-red-700 text-sm font-medium">{error}</span>}
      </div>
    </div>
  );
}
