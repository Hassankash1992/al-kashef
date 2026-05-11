"use client";

import { CheckCircle, XCircle, Loader2, ExternalLink, Plug } from "lucide-react";
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
      connected ? "border-indigo-100 shadow-indigo-50" : "border-gray-100"
    )}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
            connected ? "bg-indigo-50" : "bg-gray-50"
          )}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {badge && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>
              )}
              {connected && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> مرتبط
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{description}</p>
            {email && connected && (
              <p className="text-xs text-indigo-500 mt-1 font-mono">{email}</p>
            )}
          </div>

          <div className="flex-shrink-0">
            {comingSoon ? (
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg">قريباً</span>
            ) : connected ? (
              <button
                onClick={onDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                فصل
              </button>
            ) : connectHref ? (
              <a
                href={connectHref}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Plug className="w-3.5 h-3.5" /> ربط
              </a>
            ) : onConnect ? (
              <button
                onClick={onConnect}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <Plug className="w-3.5 h-3.5" /> ربط
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {children && <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">{children}</div>}
    </div>
  );
}
