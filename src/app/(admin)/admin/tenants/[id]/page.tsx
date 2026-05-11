import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Users, Image as ImageIcon, Globe, CreditCard,
  MessageSquare, Calendar, ExternalLink, CheckCircle, XCircle, Clock,
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
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Link
          href="/admin/tenants"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-amber-600 transition-colors shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-700 font-bold text-lg flex items-center justify-center shrink-0">
              {tenant.name[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight truncate">{tenant.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <code className="text-xs text-zinc-500 font-mono">@{tenant.slug}</code>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${PLAN_BADGE_COLOR[tenant.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                  {tenant.plan}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                  tenant.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {tenant.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {tenant.isActive ? "نشط" : "موقوف"}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={`/g/${tenant.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-zinc-900 hover:bg-zinc-800 text-white px-3 sm:px-4 py-2 rounded-xl font-bold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> زيارة المعرض
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "الفعاليات", value: eventCount, icon: Calendar },
          { label: "الصور", value: photoCount.toLocaleString("ar-SA"), icon: ImageIcon },
          { label: "الأعضاء", value: tenant._count.users, icon: Users },
          { label: "التخزين", value: formatStorage(tenant.storageUsedBytes), icon: Globe },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 text-center">
            <div className="inline-flex w-9 h-9 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-lg items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-5">
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

          {tenant.subscriptions.length > 0 && (
            <div className="mt-5 pt-5 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-700 mb-3 uppercase tracking-wider">سجل الاشتراكات</p>
              <div className="space-y-2">
                {tenant.subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5 gap-2 flex-wrap">
                    <span className="font-bold text-zinc-900">{s.plan} — {s.billingCycle}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold border ${
                      s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      s.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>{s.status}</span>
                    <span className="text-zinc-700 font-semibold">{s.amount} {s.currency}</span>
                    <span className="text-zinc-400">{new Date(s.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {tenant.invoices.length > 0 && (
          <Section title="الفواتير" icon={<CreditCard className="w-4 h-4" />}>
            <div className="space-y-2">
              {tenant.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 gap-2 flex-wrap">
                  <span className="text-zinc-900 font-semibold">{inv.description || "اشتراك"}</span>
                  <span className="font-bold text-zinc-900">{inv.amount} {inv.currency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                    inv.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    inv.status === "FAILED" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>{inv.status === "PAID" ? "مدفوعة" : inv.status === "FAILED" ? "فاشلة" : "معلقة"}</span>
                  <span className="text-zinc-400 text-xs">{new Date(inv.createdAt).toLocaleDateString("ar-SA")}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {tenant.domains.length > 0 && (
          <Section title="الدومينات المخصصة" icon={<Globe className="w-4 h-4" />}>
            <div className="space-y-2">
              {tenant.domains.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                  <code className="text-zinc-900 font-mono font-semibold" dir="ltr">{d.domain}</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    d.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    d.status === "ERROR" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {d.verified ? <CheckCircle className="w-3 h-3" /> :
                     d.status === "ERROR" ? <XCircle className="w-3 h-3" /> :
                     <Clock className="w-3 h-3" />}
                    {d.verified ? "متحقق" : d.status === "ERROR" ? "خطأ" : "قيد التحقق"}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="إرسال رسالة للمشترك" icon={<MessageSquare className="w-4 h-4" />}>
          <AdminMessageQuick tenantId={tenant.id} tenantName={tenant.name} />

          {tenant.adminMessages.length > 0 && (
            <div className="mt-5 pt-5 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-700 mb-3 uppercase tracking-wider">آخر الرسائل المرسلة</p>
              <div className="space-y-2">
                {tenant.adminMessages.map((m) => (
                  <div key={m.id} className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3">
                    <div className="flex justify-between text-xs mb-1.5 gap-2">
                      <span className="font-bold text-zinc-900">{m.subject}</span>
                      <span className="text-zinc-400 shrink-0">{new Date(m.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <p className="text-xs text-zinc-700 line-clamp-2 leading-relaxed">{m.body}</p>
                    {m.readAt && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> قرأها
                      </p>
                    )}
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
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
      <h2 className="font-bold text-zinc-900 text-sm flex items-center gap-2 mb-5">
        <span className="w-7 h-7 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}
