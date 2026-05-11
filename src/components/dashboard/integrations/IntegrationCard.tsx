"use client";

import { CheckCircle, XCircle, Loader2, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  email?: string | null;
  connectHref?: string;
  onDisconnect?: () => void;
  onConnect?: () => void;
  disconnecting?: boolean;
  badge?: string;
  comingSoon?: boolean;
  children?: React.ReactNode;
}

export default function IntegrationCard({
  title, description, icon, connected, email,
  connectHref, onDisconnect, onConnect, disconnecting,
  badge, comingSoon, children,
}: Props) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
      connected ? "border-amber-200 shadow-amber-100/50" : "border-zinc-100"
    )}>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border",
            connected
              ? "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200"
              : "bg-zinc-50 border-zinc-200"
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-zinc-900">{title}</h3>
              {badge && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">{badge}</span>
              )}
              {connected && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3" /> مرتبط
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">{description}</p>
            {email && connected && (
              <p className="text-xs text-amber-700 mt-1.5 font-mono bg-amber-50 px-2 py-0.5 rounded inline-block">{email}</p>
            )}
          </div>

          <div className="shrink-0">
            {comingSoon ? (
              <span className="text-xs text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-lg font-semibold">قريباً</span>
            ) : connected ? (
              <button
                onClick={onDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                فصل
              </button>
            ) : connectHref ? (
              <a
                href={connectHref}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5"
              >
                <Plug className="w-3.5 h-3.5" /> ربط
              </a>
            ) : onConnect ? (
              <button
                onClick={onConnect}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5"
              >
                <Plug className="w-3.5 h-3.5" /> ربط
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {children && <div className="border-t border-zinc-100 px-4 sm:px-5 py-4 bg-zinc-50/50">{children}</div>}
    </div>
  );
}
