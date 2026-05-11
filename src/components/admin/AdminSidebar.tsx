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
    <aside className="w-64 bg-zinc-950 text-white flex flex-col min-h-screen shrink-0 border-l border-zinc-900" dir="rtl">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 rounded-xl" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white leading-tight">لوحة الأدمن</p>
            <p className="text-[11px] text-amber-400/80 font-medium mt-0.5">EventFace — إدارة المنصة</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-gradient-to-l from-amber-500/20 to-amber-500/5 text-amber-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              )}
            >
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-l-full" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
                strokeWidth={2}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back */}
      <div className="px-3 py-4 border-t border-zinc-900 bg-black/30">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-amber-400 transition-colors font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          العودة للتطبيق
        </Link>
      </div>
    </aside>
  );
}
