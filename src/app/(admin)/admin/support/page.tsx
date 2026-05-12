import { db } from "@/lib/db";
import Link from "next/link";
import { LifeBuoy, AlertTriangle, MessageCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "مفتوحة",
  AWAITING_ADMIN: "بانتظار الرد",
  AWAITING_CLIENT: "بانتظار العميل",
  RESOLVED: "محلولة",
  CLOSED: "مغلقة",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  AWAITING_ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
  AWAITING_CLIENT: "bg-purple-50 text-purple-700 border-purple-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: "عاجل جداً",
  HIGH: "مهم",
  NORMAL: "عادي",
  LOW: "منخفض",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-50 text-red-700 border-red-300",
  HIGH: "bg-amber-50 text-amber-700 border-amber-300",
  NORMAL: "bg-zinc-100 text-zinc-600 border-zinc-200",
  LOW: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

export default async function AdminSupportPage() {
  const tickets = await db.supportTicket.findMany({
    orderBy: [
      { pinnedByAdmin: "desc" },
      { priority: "desc" },
      { lastMessageAt: "desc" },
    ],
    take: 100,
    include: {
      tenant: { select: { id: true, name: true, slug: true, plan: true } },
      _count: { select: { messages: true } },
    },
  });

  const totalUnread = tickets.reduce((sum, t) => sum + t.unreadByAdmin, 0);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-amber-600" />
          الدعم الفني
          {totalUnread > 0 && (
            <span className="text-sm font-bold bg-red-500 text-white px-2.5 py-0.5 rounded-full mr-2">
              {totalUnread} جديدة
            </span>
          )}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">إدارة محادثات الدعم مع المشتركين</p>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-12 text-center">
          <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
            <LifeBuoy className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-zinc-700 font-bold mb-1">لا توجد تذاكر دعم</p>
          <p className="text-zinc-500 text-sm">المحادثات ستظهر هنا عند فتحها من قبل المشتركين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/support/${t.id}`}
              className={`block bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-4 sm:p-5 ${
                t.unreadByAdmin > 0
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-zinc-100 hover:border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4 flex-wrap">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-zinc-900 truncate">{t.subject}</h3>
                    {t.pinnedByAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-amber-400 font-bold">📌</span>}
                    {t.unreadByAdmin > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {t.unreadByAdmin}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1 flex-wrap">
                    <span className="font-semibold text-amber-700">@{t.tenant.slug}</span>
                    <span>·</span>
                    <span>{t.tenant.name}</span>
                    <span>·</span>
                    <span>{t._count.messages} رسالة</span>
                    <span>·</span>
                    <span>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString("ar-SA") : "—"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority === "URGENT" && <AlertTriangle className="inline w-3 h-3 ml-0.5" />}
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
