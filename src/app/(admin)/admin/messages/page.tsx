import { db } from "@/lib/db";
import BroadcastForm from "@/components/admin/BroadcastForm";

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
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">المراسلات</h1>
        <p className="text-gray-500 text-sm">أرسل رسائل للمشتركين أو لجميعهم</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* نموذج الإرسال */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">إرسال رسالة جديدة</h2>
          <BroadcastForm tenants={tenants} />
        </div>

        {/* آخر الرسائل */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">آخر الرسائل المرسلة</h2>
          <div className="space-y-3">
            {recent.map((m) => (
              <div key={m.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-gray-800">{m.subject}</p>
                  <span className="text-xs text-gray-400 shrink-0 mr-2">
                    {new Date(m.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <p className="text-xs text-indigo-600 mb-1">{m.tenant.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{m.body}</p>
                {m.readAt && (
                  <p className="text-[10px] text-green-500 mt-1.5">تمت القراءة ✓</p>
                )}
              </div>
            ))}
            {recent.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">لا توجد رسائل بعد</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
