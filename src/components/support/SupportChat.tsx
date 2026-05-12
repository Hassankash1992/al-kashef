"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Lock, Pin, AlertTriangle, CheckCircle, MessageCircle, Eye, X } from "lucide-react";

type ViewerType = "ADMIN" | "CLIENT";

interface Message {
  id: string;
  fromType: string;
  fromName: string | null;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  pinnedByAdmin: boolean;
  assignedTo?: string | null;
}

interface Props {
  ticket: Ticket;
  initialMessages: Message[];
  viewerType: ViewerType;
}

export default function SupportChat({ ticket, initialMessages, viewerType }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [pinned, setPinned] = useState(ticket.pinnedByAdmin);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/tickets/${ticket.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages.length !== messages.length) {
            setMessages(data.messages);
          }
        }
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [ticket.id, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), isInternal: viewerType === "ADMIN" ? isInternal : false }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages([...messages, newMsg]);
        setBody("");
        setIsInternal(false);
      }
    } finally {
      setSending(false);
    }
  }

  async function updateTicket(data: any) {
    const res = await fetch(`/api/support/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) router.refresh();
  }

  const isClosed = status === "CLOSED" || status === "RESOLVED";

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Admin controls */}
      {viewerType === "ADMIN" && (
        <div className="px-4 sm:px-5 py-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); updateTicket({ status: e.target.value }); }}
            className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="OPEN">مفتوحة</option>
            <option value="AWAITING_ADMIN">بانتظار الرد</option>
            <option value="AWAITING_CLIENT">بانتظار العميل</option>
            <option value="RESOLVED">محلولة</option>
            <option value="CLOSED">مغلقة</option>
          </select>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); updateTicket({ priority: e.target.value }); }}
            className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="LOW">منخفض</option>
            <option value="NORMAL">عادي</option>
            <option value="HIGH">مهم</option>
            <option value="URGENT">عاجل جداً</option>
          </select>
          <button
            onClick={() => { setPinned(!pinned); updateTicket({ pinnedByAdmin: !pinned }); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors flex items-center gap-1 ${
              pinned
                ? "bg-zinc-900 text-amber-400 border-zinc-900"
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            <Pin className="w-3 h-3" />
            {pinned ? "مثبتة" : "تثبيت"}
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/30">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">لا توجد رسائل بعد — ابدأ المحادثة</p>
          </div>
        ) : messages.map((m) => {
          const isMine =
            (viewerType === "ADMIN" && m.fromType === "ADMIN") ||
            (viewerType === "CLIENT" && m.fromType === "CLIENT");
          const isInternal = m.isInternal;

          if (isInternal && viewerType !== "ADMIN") return null;

          return (
            <div key={m.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[80%] ${isInternal ? "border-2 border-dashed border-amber-300" : ""}`}>
                {isInternal && (
                  <p className="text-[10px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> ملاحظة داخلية (لا يراها العميل)
                  </p>
                )}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  isInternal
                    ? "bg-amber-50 text-zinc-900"
                    : isMine
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-200 text-zinc-900"
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 px-2">
                  <span className="font-semibold">
                    {m.fromType === "ADMIN" ? (m.fromName || "الدعم الفني") : (m.fromName || "العميل")}
                  </span>
                  <span>·</span>
                  <span>{new Date(m.createdAt).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="border-t border-zinc-100 p-4 sm:p-5 bg-zinc-100 text-center text-sm text-zinc-600 flex items-center justify-center gap-2 font-bold">
          <Lock className="w-4 h-4" />
          هذه التذكرة {status === "RESOLVED" ? "محلولة" : "مغلقة"}
          {viewerType === "ADMIN" && (
            <button
              onClick={() => { setStatus("OPEN"); updateTicket({ status: "OPEN" }); }}
              className="text-amber-700 hover:text-amber-800 underline mr-2"
            >
              فتح من جديد
            </button>
          )}
        </div>
      ) : (
        <div className="border-t border-zinc-100 p-3 sm:p-4 bg-white space-y-2">
          {viewerType === "ADMIN" && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-zinc-300 text-amber-600 focus:ring-amber-400"
              />
              <span className="text-zinc-700 font-semibold">ملاحظة داخلية (لا يراها العميل)</span>
            </label>
          )}
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
              }}
              placeholder="اكتب رسالتك..."
              rows={2}
              className="flex-1 bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all resize-none"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 px-1">Ctrl+Enter للإرسال السريع</p>
        </div>
      )}
    </div>
  );
}
