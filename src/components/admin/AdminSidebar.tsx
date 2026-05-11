"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  Settings2,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "المشتركون", icon: Users },
  { href: "/admin/billing", label: "الفوترة والاشتراكات", icon: CreditCard },
  { href: "/admin/messages", label: "المراسلات", icon: MessageSquare },
  { href: "/admin/system", label: "إعدادات المنصة", icon: Settings2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-64 bg-gray-950 text-white flex flex-col min-h-screen shrink-0" dir="rtl">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">لوحة الأدمن</p>
            <p className="text-[10px] text-gray-400">الكاشف — إدارة المنصة</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Back to app */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          العودة للتطبيق
        </Link>
      </div>
    </aside>
  );
}
