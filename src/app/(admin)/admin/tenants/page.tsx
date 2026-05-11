import { db } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, XCircle, Search, AlertTriangle } from "lucide-react";
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
    <div className="p-6 sm:p-8 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">المشتركون</h1>
        <p className="text-zinc-500 text-sm mt-1">{total} مشترك إجمالاً</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <form>
            <input
              name="q"
              defaultValue={q}
              placeholder="ابحث بالاسم أو الـ slug..."
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl pr-9 pl-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
            />
            <input type="hidden" name="plan" value={plan} />
            <input type="hidden" name="status" value={status} />
          </form>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["", "STARTER", "PRO", "AGENCY"].map((p) => (
            <Link
              key={p}
              href={buildUrl({ plan: p, page: "1" })}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                plan === p
                  ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-black shadow-md shadow-amber-500/20"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {p === "" ? "الكل" : p === "STARTER" ? "مبتدئ" : p === "PRO" ? "احترافي" : "وكالة"}
            </Link>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { val: "", label: "الجميع" },
            { val: "active", label: "نشط" },
            { val: "inactive", label: "موقوف" },
          ].map(({ val, label }) => (
            <Link
              key={val}
              href={buildUrl({ status: val, page: "1" })}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                status === val
                  ? "bg-zinc-900 text-amber-400"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-xs">
              <tr>
                <th className="text-right px-4 py-3 font-bold">الشركة</th>
                <th className="text-right px-4 py-3 font-bold">الباقة</th>
                <th className="text-right px-4 py-3 font-bold">الاشتراك</th>
                <th className="text-right px-4 py-3 font-bold">الفعاليات</th>
                <th className="text-right px-4 py-3 font-bold">التخزين</th>
                <th className="text-right px-4 py-3 font-bold">الحالة</th>
                <th className="text-right px-4 py-3 font-bold">التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {tenants.map((t) => {
                const sub = t.subscriptions[0];
                const isExpiringSoon =
                  sub?.currentPeriodEnd &&
                  new Date(sub.currentPeriodEnd) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tenants/${t.id}`} className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0">
                          {t.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 group-hover:text-amber-700 transition-colors truncate">{t.name}</p>
                          <p className="text-zinc-500 text-xs truncate">@{t.slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE_COLOR[t.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sub ? (
                        <div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {sub.status === "ACTIVE" ? "نشط" : "تجريبي"}
                          </span>
                          {sub.currentPeriodEnd && (
                            <p className={`text-xs mt-1 flex items-center gap-1 ${isExpiringSoon ? "text-red-600 font-bold" : "text-zinc-500"}`}>
                              {isExpiringSoon && <AlertTriangle className="w-3 h-3" />}
                              {new Date(sub.currentPeriodEnd).toLocaleDateString("ar-SA")}
                            </p>
                          )}
                          {sub.amount > 0 && (
                            <p className="text-xs text-zinc-400 mt-0.5">{sub.amount} ر.س</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 font-semibold">{t._count.events}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs font-mono">{formatStorage(t.storageUsedBytes)}</td>
                    <td className="px-4 py-3">
                      {t.isActive
                        ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                        : <XCircle className="w-5 h-5 text-red-500" />}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">لا يوجد مشتركون يطابقون البحث</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {pageNum > 1 && (
            <Link
              href={buildUrl({ page: String(pageNum - 1) })}
              className="px-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-amber-300 font-semibold text-zinc-700 transition-colors"
            >
              السابق
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-zinc-700 font-bold">{pageNum} / {totalPages}</span>
          {pageNum < totalPages && (
            <Link
              href={buildUrl({ page: String(pageNum + 1) })}
              className="px-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:border-amber-300 font-semibold text-zinc-700 transition-colors"
            >
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
