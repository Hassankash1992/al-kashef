"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Camera, Menu, X, LayoutDashboard, CalendarDays, Settings,
  Plug, BarChart2, Globe, Users, CreditCard,
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

export default function MobileMenuButton({ tenantName, tenantSlug }: { tenantName: string; tenantSlug: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Mobile bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center shadow-md">
            <Camera className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-white truncate">{tenantName}</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-amber-400"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex" dir="rtl">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 bg-zinc-950 border-l border-zinc-900 flex flex-col h-full shadow-2xl">
            <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center shadow-md">
                  <Camera className="w-5 h-5 text-black" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm truncate">{tenantName}</p>
                  <p className="text-[10px] text-amber-400/80 truncate font-medium">@{tenantSlug}</p>
                </div>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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
                      "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-l from-amber-500/20 to-amber-500/5 text-amber-300"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-l-full" />
                    )}
                    <item.icon className={cn("w-4 h-4 shrink-0", active ? "text-amber-400" : "text-zinc-500")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-4 border-t border-zinc-900 bg-black/30">
              <div className="flex items-center gap-3">
                <div className="ring-2 ring-amber-400/30 rounded-full">
                  <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">الحساب الشخصي</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
