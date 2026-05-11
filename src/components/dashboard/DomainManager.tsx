"use client";

import { useState } from "react";
import {
  Globe, Plus, CheckCircle, Clock, AlertCircle, Trash2,
  RefreshCw, Loader2, Copy, ChevronDown, ChevronUp, Lock,
} from "lucide-react";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  status: string;
  verifyToken: string | null;
  lastChecked: string | null;
}

interface Props {
  domains: Domain[];
  canAddDomain: boolean;
  plan: string;
  appHost: string;
}

export default function DomainManager({ domains: initial, canAddDomain, plan, appHost }: Props) {
  const [domains, setDomains] = useState(initial);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  async function addDomain() {
    if (!newDomain.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDomains([data, ...domains]);
      setNewDomain("");
      setShowAdd(false);
      setExpanded(data.id);
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function deleteDomain(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الدومين؟")) return;
    await fetch(`/api/domains/${id}`, { method: "DELETE" });
    setDomains(domains.filter((d) => d.id !== id));
  }

  async function verifyDomain(id: string) {
    setVerifying(id);
    setVerifyMsg((p) => ({ ...p, [id]: "" }));
    try {
      const res = await fetch(`/api/domains/${id}`, { method: "POST" });
      const data = await res.json();
      setVerifyMsg((p) => ({ ...p, [id]: data.message }));
      if (data.verified) {
        setDomains((prev) =>
          prev.map((d) => d.id === id ? { ...d, verified: true, status: "VERIFIED" } : d)
        );
      } else {
        setDomains((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: "ERROR" } : d)
        );
      }
    } catch {
      setVerifyMsg((p) => ({ ...p, [id]: "فشل الاتصال" }));
    } finally {
      setVerifying(null);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  if (!canAddDomain) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 sm:p-10 text-center">
        <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-zinc-400" />
        </div>
        <p className="font-bold text-zinc-900 text-base mb-1.5">الدومين المخصص غير متاح في باقتك</p>
        <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto leading-relaxed">
          هذه الميزة متاحة في باقة <strong>احترافي</strong> أو <strong>وكالة</strong> فقط.
        </p>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          ترقية الباقة
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة دومين مخصص
        </button>
      )}

      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-4 sm:p-5 space-y-3">
          <p className="text-sm font-bold text-zinc-900">أدخل الدومين أو الدومين الفرعي</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="photos.yourcompany.com"
              className="flex-1 bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              dir="ltr"
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
            />
            <button
              onClick={addDomain}
              disabled={adding || !newDomain.trim()}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 disabled:opacity-50 text-black px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-3 py-2.5 text-sm text-zinc-500 hover:text-zinc-700 font-medium transition-colors"
            >
              إلغاء
            </button>
          </div>
          {addError && <p className="text-red-600 text-xs font-medium">{addError}</p>}
        </div>
      )}

      {domains.length === 0 && !showAdd && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm py-12 sm:py-16 text-center">
          <div className="inline-flex w-14 h-14 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
            <Globe className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-zinc-700 font-semibold text-sm">لم تضف أي دومين مخصص بعد</p>
          <p className="text-zinc-500 text-xs mt-1">اضغط زر الإضافة بالأعلى لربط دومينك</p>
        </div>
      )}

      {domains.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
            <code className="flex-1 text-sm text-zinc-900 font-mono truncate font-semibold" dir="ltr">{d.domain}</code>
            <StatusBadge status={d.status} verified={d.verified} />
            <button
              onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              className="text-zinc-400 hover:text-zinc-700 p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              {expanded === d.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => deleteDomain(d.id)}
              className="text-zinc-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expanded === d.id && (
            <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-zinc-900 mb-2">الخطوة 1 — أضف CNAME record عند مزود الدومين:</p>
                <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-xs font-mono" dir="ltr">
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-zinc-500 font-sans">Type</span>
                    <span className="text-zinc-900 font-bold">CNAME</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-zinc-500 font-sans">Name</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-900 font-semibold">
                        {d.domain.split(".").length > 2 ? d.domain.split(".")[0] : "@"}
                      </span>
                      <button onClick={() => copyText(d.domain)} className="text-zinc-400 hover:text-amber-600 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2.5">
                    <span className="text-zinc-500 font-sans">Value</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700 font-semibold">{appHost}</span>
                      <button onClick={() => copyText(appHost)} className="text-zinc-400 hover:text-amber-600 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {d.verifyToken && (
                <div>
                  <p className="text-xs font-bold text-zinc-900 mb-2">الخطوة 2 — ملف التحقق (اختياري لـ HTTP verify):</p>
                  <div className="bg-white rounded-xl border border-zinc-200 px-3 py-2.5 text-xs font-mono" dir="ltr">
                    <p className="text-zinc-500 mb-1 font-sans">Path: /.well-known/kashef-verify</p>
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-900 truncate font-semibold">{d.verifyToken}</p>
                      <button onClick={() => copyText(d.verifyToken!)} className="text-zinc-400 hover:text-amber-600 shrink-0 transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => verifyDomain(d.id)}
                  disabled={verifying === d.id}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {verifying === d.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  تحقق الآن
                </button>
                {verifyMsg[d.id] && (
                  <p className={`text-xs font-medium ${d.verified ? "text-emerald-700" : "text-amber-700"}`}>
                    {verifyMsg[d.id]}
                  </p>
                )}
                {d.lastChecked && (
                  <p className="text-xs text-zinc-400 mr-auto">
                    آخر فحص: {new Date(d.lastChecked).toLocaleString("ar-SA")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, verified }: { status: string; verified: boolean }) {
  if (verified) return (
    <span className="flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> مفعّل
    </span>
  );
  if (status === "VERIFYING") return (
    <span className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> يتحقق
    </span>
  );
  if (status === "ERROR") return (
    <span className="flex items-center gap-1 text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> خطأ
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> في الانتظار
    </span>
  );
}
