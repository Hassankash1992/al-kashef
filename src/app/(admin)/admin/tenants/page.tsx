import { db } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, XCircle, Search, Plus } from "lucide-react";
import { PLAN_BADGE_COLOR, formatStorage } from "@/lib/plans";

interface Props {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; page?: string }>;
}

export default async function AdminTenantsPage({ searchParams }: Props) {
  const { q = "", plan = "", status = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = 20;

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }
  if (plan) where.plan = plan;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [tenants, total] = await Promise.all([
    db.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, name: true, slug: true, plan: true, isActive: true,
        storageUsedBytes: true, createdAt: true, notes: true,
        _count: { select: { events: true, users: true } },
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING"] } },
          select: { status: true, currentPeriodEnd: true, amount: true },
          take: 1, orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.tenant.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ q, plan, status, page: String(pageNum), ...params });
    return `/admin/tenants?${p}`;
  }

  return (
    <div className="p-8" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشتركون</h1>
          <p className="text-gray-500 text-sm">{total} مشترك إجمالاً</p>
        </div>
      </div>

      {/* فلاتر */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="ابحث بالاسم أو الـ slug..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input type="hidden" name="plan" value={plan} />
            <input type="hidden" name="status" value={status} />
          </form>
        </div>

        <div className="flex gap-2">
          {["", "STARTER", "PRO", "AGENCY"].map((p) => (
            <Link
              key={p}
              href={buildUrl({ plan: p, page: "1" })}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                plan === p
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p === "" ? "الكل" : p === "STARTER" ? "مبتدئ" : p === "PRO" ? "احترافي" : "وكالة"}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {[
            { val: "", label: "الكل" },
            { val: "active", label: "نشط" },
            { val: "inactive", label: "موقوف" },
          ].map(({ val, label }) => (
            <Link
              key={val}
              href={buildUrl({ status: val, page: "1" })}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                status === val
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-right px-4 py-3 font-medium">الشركة</th>
              <th className="text-right px-4 py-3 font-medium">الباقة</th>
              <th className="text-right px-4 py-3 font-medium">الاشتراك</th>
              <th className="text-right px-4 py-3 font-medium">الفعاليات</th>
              <th className="text-right px-4 py-3 font-medium">التخزين</th>
              <th className="text-right px-4 py-3 font-medium">الحالة</th>
              <th className="text-right px-4 py-3 font-medium">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tenants.map((t) => {
              const sub = t.subscriptions[0];
              const isExpiringSoon =
                sub?.currentPeriodEnd &&
                new Date(sub.currentPeriodEnd) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

              return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/tenants/${t.id}`} className="flex items-center gap-2 group">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {t.name}
                        </p>
                        <p className="text-gray-400 text-xs">{t.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_BADGE_COLOR[t.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub ? (
                      <div>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          sub.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {sub.status}
                        </span>
                        {sub.currentPeriodEnd && (
                          <p className={`text-xs mt-0.5 ${isExpiringSoon ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            {isExpiringSoon ? "⚠ " : ""}
                            {new Date(sub.currentPeriodEnd).toLocaleDateString("ar-SA")}
                          </p>
                        )}
                        {sub.amount > 0 && (
                          <p className="text-xs text-gray-400">{sub.amount} ر.س</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t._count.events}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatStorage(t.storageUsedBytes)}</td>
                  <td className="px-4 py-3">
                    {t.isActive
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">لا يوجد مشتركون يطابقون البحث</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {pageNum > 1 && (
            <Link href={buildUrl({ page: String(pageNum - 1) })} className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
              السابق
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-gray-500">{pageNum} / {totalPages}</span>
          {pageNum < totalPages && (
            <Link href={buildUrl({ page: String(pageNum + 1) })} className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
