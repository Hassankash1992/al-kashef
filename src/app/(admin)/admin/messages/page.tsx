import { db } from "@/lib/db";
import BroadcastForm from "@/components/admin/BroadcastForm";
import { Mail, CheckCircle } from "lucide-react";

export default async function AdminMessagesPage() {
  const recent = await db.adminMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { tenant: { select: { name: true, slug: true } } },
  });

  const tenants = await db.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, plan: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">المراسلات</h1>
        <p className="text-zinc-500 text-sm mt-1">أرسل رسائل للمشتركين فردياً أو جماعياً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-600" />
            إرسال رسالة جديدة
          </h2>
          <BroadcastForm tenants={tenants} />
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-bold text-zinc-900 mb-4">آخر الرسائل المرسلة</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex w-14 h-14 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
                  <Mail className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-zinc-500 text-sm">لا توجد رسائل مرسلة بعد</p>
              </div>
            ) : recent.map((m) => (
              <div key={m.id} className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 hover:bg-amber-50/30 hover:border-amber-200 transition-colors">
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <p className="text-sm font-bold text-zinc-900 truncate">{m.subject}</p>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {new Date(m.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <p className="text-xs text-amber-700 font-bold mb-2">@{m.tenant.name}</p>
                <p className="text-xs text-zinc-700 line-clamp-2 leading-relaxed">{m.body}</p>
                {m.readAt && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> تمت القراءة
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
