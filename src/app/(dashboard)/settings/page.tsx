import { requireTenant } from "@/lib/tenant";
import Link from "next/link";
import { Plug, HardDrive, Globe, Users, ChevronLeft } from "lucide-react";

export default async function SettingsPage() {
  const tenantUser = await requireTenant();
  const { tenant } = tenantUser;

  const planLabel: Record<string, string> = {
    STARTER: "مبتدئ",
    PRO: "احترافي",
    AGENCY: "وكالة",
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">الإعدادات</h1>
        <p className="text-zinc-500 text-sm mt-1">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-zinc-900 mb-4 text-base">معلومات الحساب</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-zinc-50">
            <span className="text-zinc-500">اسم الشركة</span>
            <span className="font-semibold text-zinc-900">{tenant.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-zinc-50">
            <span className="text-zinc-500">رابط الشركة</span>
            <span className="font-mono text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded">@{tenant.slug}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-zinc-500">الباقة الحالية</span>
            <span className="font-bold px-3 py-1 rounded-full text-xs bg-gradient-to-l from-amber-100 to-amber-50 text-amber-800 border border-amber-200">
              {planLabel[tenant.plan] ?? tenant.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {settingsSections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-amber-200 transition-all group"
          >
            <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-900 text-sm group-hover:text-amber-700 transition-colors">{s.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.desc}</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-zinc-300 group-hover:text-amber-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

const settingsSections = [
  { href: "/settings/integrations", icon: Plug, title: "التكاملات", desc: "Google Drive, Dropbox, OneDrive, وأكثر" },
  { href: "/domains", icon: Globe, title: "الدومين المخصص", desc: "اربط دومينك الخاص بشركتك" },
  { href: "/team", icon: Users, title: "الفريق والصلاحيات", desc: "إدارة مستخدمي حسابك" },
  { href: "/billing", icon: HardDrive, title: "الاشتراك والتخزين", desc: "باقتك واستخدام التخزين" },
];
