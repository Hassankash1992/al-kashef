"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Camera,
  LayoutDashboard,
  CalendarDays,
  Settings,
  Plug,
  BarChart2,
  Globe,
  Users,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/events", icon: CalendarDays, label: "الفعاليات" },
  { href: "/analytics", icon: BarChart2, label: "التقارير" },
  { href: "/team", icon: Users, label: "الفريق" },
  { href: "/domains", icon: Globe, label: "الدومين المخصص" },
  { href: "/billing", icon: CreditCard, label: "الاشتراك" },
  { href: "/settings/integrations", icon: Plug, label: "التكاملات" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

interface SidebarProps {
  tenantName: string;
  tenantSlug: string;
}

export default function Sidebar({ tenantName, tenantSlug }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 bg-zinc-950 border-l border-zinc-900 flex-col h-screen sticky top-0 shadow-2xl">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-zinc-900">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-40 rounded-xl group-hover:opacity-60 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate leading-tight">{tenantName}</p>
            <p className="text-[11px] text-amber-400/80 truncate font-medium mt-0.5">@{tenantSlug}</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <item.icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
                strokeWidth={2}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-zinc-900 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="ring-2 ring-amber-400/30 rounded-full">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">الحساب الشخصي</p>
            <p className="text-[11px] text-zinc-500 truncate">إدارة الملف الشخصي</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
