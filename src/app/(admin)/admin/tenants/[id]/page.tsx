import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Users, Image, Globe, CreditCard,
  MessageSquare, Calendar, ExternalLink,
} from "lucide-react";
import { PLAN_BADGE_COLOR, formatStorage } from "@/lib/plans";
import TenantEditForm from "@/components/admin/TenantEditForm";
import SubscriptionForm from "@/components/admin/SubscriptionForm";
import AdminMessageQuick from "@/components/admin/AdminMessageQuick";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTenantDetailPage({ params }: Props) {
  const { id } = await params;

  const tenant = await db.tenant.findUnique({
    where: { id },
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 5 },
      invoices: { orderBy: { createdAt: "desc" }, take: 8 },
      adminMessages: { orderBy: { createdAt: "desc" }, take: 5 },
      domains: true,
      _count: { select: { events: true, users: true } },
    },
  });

  if (!tenant) notFound();

  const [eventCount, photoCount] = await Promise.all([
    db.event.count({ where: { tenantId: id } }),
    db.photo.count({ where: { tenantId: id, status: { not: "DELETED" } } }),
  ]);

  const activeSub = tenant.subscriptions.find((s) =>
    ["ACTIVE", "TRIALING", "PAST_DUE"].includes(s.status)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/tenants" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center">
              {tenant.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-400">{tenant.slug}</code>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_BADGE_COLOR[tenant.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                  {tenant.plan}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tenant.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {tenant.isActive ? "نشط" : "موقوف"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={`/g/${tenant.slug}`}
          target="_blank"
          className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-xl transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> زيارة المعرض
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "الفعاليات", value: eventCount, icon: Calendar },
          { label: "الصور", value: photoCount.toLocaleString("ar-SA"), icon: Image },
          { label: "الأعضاء", value: tenant._count.users, icon: Users },
          { label: "التخزين", value: formatStorage(tenant.storageUsedBytes), icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <Icon className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* معلومات الشركة */}
        <Section title="معلومات الشركة" icon={<Globe className="w-4 h-4" />}>
          <TenantEditForm tenant={{
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
            isActive: tenant.isActive,
            notes: tenant.notes,
            primaryColor: tenant.primaryColor,
          }} />
        </Section>

        {/* الاشتراك */}
        <Section title="الاشتراك والفوترة" icon={<CreditCard className="w-4 h-4" />}>
          <SubscriptionForm
            tenantId={tenant.id}
            current={activeSub ? {
              plan: activeSub.plan,
              status: activeSub.status,
              billingCycle: activeSub.billingCycle,
              amount: activeSub.amount,
              currency: activeSub.currency,
              currentPeriodEnd: activeSub.currentPeriodEnd?.toISOString() ?? null,
            } : null}
          />

          {/* سجل الاشتراكات */}
          {tenant.subscriptions.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">سجل الاشتراكات</p>
              <div className="space-y-2">
                {tenant.subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{s.plan} — {s.billingCycle}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      s.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      s.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                      "bg-amber-100 text-amber-700"
                    }`}>{s.status}</span>
                    <span className="text-gray-400">{s.amount} {s.currency}</span>
                    <span className="text-gray-400">{new Date(s.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* الفواتير */}
        {tenant.invoices.length > 0 && (
          <Section title="الفواتير" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2">
              {tenant.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-gray-700">{inv.description || "اشتراك"}</span>
                  <span className="font-semibold text-gray-800">{inv.amount} {inv.currency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "PAID" ? "bg-green-100 text-green-700" :
                    inv.status === "FAILED" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>{inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}</span>
                  <span className="text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* الدومينات */}
        {tenant.domains.length > 0 && (
          <Section title="الدومينات المخصصة" icon={<Globe className="w-4 h-4" />}>
            <div className="space-y-2">
              {tenant.domains.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-4 py-3">
                  <code className="text-gray-700" dir="ltr">{d.domain}</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    d.verified ? "bg-green-100 text-green-700" :
                    d.status === "ERROR" ? "bg-red-100 text-red-600" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {d.verified ? "متحقق ✅" : d.status === "ERROR" ? "خطأ ❌" : "قيد التحقق ⏳"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* المراسلة */}
        <Section title="إرسال رسالة للمشترك" icon={<MessageSquare className="w-4 h-4" />}>
          <AdminMessageQuick tenantId={tenant.id} tenantName={tenant.name} />

          {tenant.adminMessages.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">آخر الرسائل المرسلة</p>
              <div className="space-y-2">
                {tenant.adminMessages.map((m) => (
                  <div key={m.id} className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-medium text-gray-700">{m.subject}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{m.body}</p>
                    {m.readAt && <p className="text-[10px] text-green-500 mt-1">قرأها ✓</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, icon, children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-5">
        <span className="text-indigo-400">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
