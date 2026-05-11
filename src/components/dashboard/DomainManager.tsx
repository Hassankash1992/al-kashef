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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <Lock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-700 mb-1">الدومين المخصص غير متاح في باقتك الحالية</p>
        <p className="text-sm text-gray-400 mb-5">هذه الميزة متاحة في باقة احترافي أو وكالة فقط.</p>
        <a
          href="/billing"
          className="inline-block text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors"
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
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> إضافة دومين مخصص
        </button>
      )}

      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 space-y-3">
          <p className="text-sm font-medium text-gray-700">أدخل الدومين أو الدومين الفرعي</p>
          <div className="flex gap-2">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="photos.yourcompany.com"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
              dir="ltr"
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
            />
            <button
              onClick={addDomain}
              disabled={adding || !newDomain.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "إضافة"}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600">
              إلغاء
            </button>
          </div>
          {addError && <p className="text-red-500 text-xs">{addError}</p>}
        </div>
      )}

      {domains.length === 0 && !showAdd && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 text-center">
          <Globe className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">لم تضف أي دومين مخصص بعد</p>
        </div>
      )}

      {domains.map((d) => (
        <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <Globe className="w-4 h-4 text-gray-400 shrink-0" />
            <code className="flex-1 text-sm text-gray-800 font-mono truncate" dir="ltr">{d.domain}</code>
            <StatusBadge status={d.status} verified={d.verified} />
            <button onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="text-gray-400 hover:text-gray-600 p-1">
              {expanded === d.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={() => deleteDomain(d.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {expanded === d.id && (
            <div className="border-t border-gray-50 bg-gray-50 p-5 space-y-5">
              {/* خطوة 1: CNAME */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">الخطوة 1 — أضف CNAME record في مزود الدومين:</p>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 text-xs font-mono" dir="ltr">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-gray-400">Type</span>
                    <span className="text-gray-800">CNAME</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-gray-400">Name</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-800">
                        {d.domain.split(".").length > 2
                          ? d.domain.split(".")[0]
                          : "@"}
                      </span>
                      <button onClick={() => copyText(d.domain)} className="text-gray-300 hover:text-indigo-500">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-gray-400">Value</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-600">{appHost}</span>
                      <button onClick={() => copyText(appHost)} className="text-gray-300 hover:text-indigo-500">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* خطوة 2: ملف التحقق */}
              {d.verifyToken && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">الخطوة 2 — ملف التحقق (اختياري لـ HTTP verify):</p>
                  <div className="bg-white rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono" dir="ltr">
                    <p className="text-gray-400 mb-0.5">Path: /.well-known/kashef-verify</p>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 truncate">{d.verifyToken}</p>
                      <button onClick={() => copyText(d.verifyToken!)} className="text-gray-300 hover:text-indigo-500 shrink-0">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* زر التحقق */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => verifyDomain(d.id)}
                  disabled={verifying === d.id}
                  className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  {verifying === d.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  تحقق الآن
                </button>
                {verifyMsg[d.id] && (
                  <p className={`text-xs ${d.verified ? "text-green-600" : "text-amber-600"}`}>
                    {verifyMsg[d.id]}
                  </p>
                )}
                {d.lastChecked && (
                  <p className="text-xs text-gray-400 mr-auto">
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
    <span className="flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> مفعّل
    </span>
  );
  if (status === "VERIFYING") return (
    <span className="flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> يتحقق
    </span>
  );
  if (status === "ERROR") return (
    <span className="flex items-center gap-1 text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> خطأ
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> في الانتظار
    </span>
  );
}
