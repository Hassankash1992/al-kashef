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
  ChevronLeft,
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
    <aside className="w-64 bg-white border-l border-gray-100 flex flex-col h-screen sticky top-0 shadow-sm">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{tenantName}</p>
          <p className="text-xs text-gray-400 truncate">{tenantSlug}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", active ? "text-indigo-600" : "text-gray-400")} />
              {item.label}
              {active && <ChevronLeft className="w-3 h-3 mr-auto text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <UserButton />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">الحساب الشخصي</p>
            <p className="text-xs text-gray-400">إدارة الملف الشخصي</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
