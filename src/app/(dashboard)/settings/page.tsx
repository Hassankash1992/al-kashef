import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { Settings, Plug, HardDrive, Globe, Bell } from "lucide-react";

export default async function SettingsPage() {
  const tenantUser = await requireTenant();
  const { tenant } = tenantUser;

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 text-sm mt-1">{tenant.name}</p>
      </div>

      <div className="space-y-3">
        {settingsSections.map((s) => (
          <Link key={s.href} href={s.href} className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{s.title}</p>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
            <span className="text-gray-300 group-hover:text-gray-500 transition-colors">←</span>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">معلومات الحساب</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">اسم الشركة</span>
            <span className="font-medium">{tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">رابط الشركة</span>
            <span className="font-medium font-mono text-xs">{tenant.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الباقة</span>
            <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
              tenant.plan === "AGENCY" ? "bg-purple-100 text-purple-700" :
              tenant.plan === "PRO" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-600"
            }`}>{tenant.plan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const settingsSections = [
  { href: "/settings/integrations", icon: Plug, title: "التكاملات", desc: "Google Drive, WhatsApp, Telegram, والمزيد", color: "bg-blue-50 text-blue-600" },
  { href: "/settings/storage", icon: HardDrive, title: "التخزين", desc: "إعدادات R2 أو S3 الخاص بك", color: "bg-indigo-50 text-indigo-600" },
  { href: "/domains", icon: Globe, title: "الدومينات", desc: "ربط دومين مخصص لشركتك", color: "bg-green-50 text-green-600" },
  { href: "/team", icon: Settings, title: "الفريق والصلاحيات", desc: "إدارة مستخدمي الحساب", color: "bg-orange-50 text-orange-600" },
];
