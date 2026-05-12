"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LifeBuoy, X, Plus, MessageCircle, Loader2, Send, ChevronLeft } from "lucide-react";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "new">("list");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!open) return;
    loadTickets();
  }, [open]);

  // Poll for unread badge
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/support/tickets");
        if (res.ok) {
          const data = await res.json();
          const total = data.reduce((sum: number, t: any) => sum + (t.unreadByClient || 0), 0);
          setUnread(total);
        }
      } catch {}
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      if (res.ok) setTickets(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 left-5 z-40 group"
        aria-label="الدعم الفني"
      >
        <div className="absolute inset-0 bg-amber-400 blur-xl opacity-50 group-hover:opacity-80 transition-opacity rounded-full" />
        <div className="relative w-14 h-14 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 rounded-full shadow-2xl shadow-amber-500/40 flex items-center justify-center transition-all hover:scale-110">
          {open ? (
            <X className="w-6 h-6 text-black" strokeWidth={2.5} />
          ) : (
            <LifeBuoy className="w-6 h-6 text-black" strokeWidth={2.5} />
          )}
          {!open && unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 left-5 right-5 sm:right-auto sm:w-96 z-40 bg-white rounded-2xl border-2 border-amber-200 shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 130px)" }} dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-bold mb-0.5">EventFace Support</p>
                <h3 className="font-bold text-base">{view === "new" ? "تذكرة جديدة" : "الدعم الفني"}</h3>
              </div>
              {view === "new" && (
                <button onClick={() => setView("list")} className="text-zinc-300 hover:text-amber-400 transition-colors">
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {view === "list" ? (
              <TicketsList
                tickets={tickets}
                loading={loading}
                onNew={() => setView("new")}
              />
            ) : (
              <NewTicketForm
                onCreated={() => { setView("list"); loadTickets(); }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TicketsList({ tickets, loading, onNew }: { tickets: any[]; loading: boolean; onNew: () => void }) {
  return (
    <div>
      <div className="p-4 border-b border-zinc-100">
        <button
          onClick={onNew}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          فتح تذكرة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center px-6">
          <MessageCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-700 font-bold mb-1">لا توجد تذاكر</p>
          <p className="text-zinc-500 text-xs">افتح تذكرة جديدة للتواصل مع الدعم</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className="block p-4 hover:bg-amber-50/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-zinc-900 text-sm flex-1 truncate">{t.subject}</p>
                {t.unreadByClient > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {t.unreadByClient}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <StatusDot status={t.status} />
                <span>{t._count?.messages ?? 0} رسالة</span>
                <span>·</span>
                <span>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString("ar-SA") : "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: "bg-blue-500",
    AWAITING_ADMIN: "bg-amber-500",
    AWAITING_CLIENT: "bg-purple-500",
    RESOLVED: "bg-emerald-500",
    CLOSED: "bg-zinc-400",
  };
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status] ?? "bg-zinc-300"}`} />;
}

function NewTicketForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ subject: "", body: "", priority: "NORMAL", category: "general" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send() {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  return (
    <div className="p-4 space-y-3">
      <input
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        placeholder="موضوع التذكرة..."
        className={inputCls}
      />
      <select
        value={form.priority}
        onChange={(e) => setForm({ ...form, priority: e.target.value })}
        className={inputCls + " appearance-none cursor-pointer"}
      >
        <option value="LOW">منخفض</option>
        <option value="NORMAL">عادي</option>
        <option value="HIGH">مهم</option>
        <option value="URGENT">عاجل جداً</option>
      </select>
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={5}
        placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
        className={inputCls + " resize-none"}
      />
      {error && <p className="text-red-700 text-xs font-semibold">{error}</p>}
      <button
        onClick={send}
        disabled={sending || !form.subject.trim() || !form.body.trim()}
        className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        إرسال التذكرة
      </button>
    </div>
  );
}
