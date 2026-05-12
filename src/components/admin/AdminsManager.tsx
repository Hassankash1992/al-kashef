"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserCog, Loader2, CheckCircle, XCircle, Crown, LifeBuoy, CreditCard, FileText, Eye } from "lucide-react";

interface Admin {
  id: string;
  clerkUserId: string;
  email: string | null;
  name: string | null;
  role: string;
  permissions: string[];
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const ROLE_META: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  SUPER_ADMIN: { label: "مدير عام", color: "from-amber-100 to-amber-50 text-amber-800 border-amber-300", icon: Crown, desc: "كل الصلاحيات بدون استثناء" },
  ADMIN: { label: "مدير", color: "from-purple-100 to-purple-50 text-purple-800 border-purple-300", icon: UserCog, desc: "معظم الصلاحيات + إدارة الموظفين" },
  SUPPORT: { label: "دعم فني", color: "from-blue-100 to-blue-50 text-blue-800 border-blue-300", icon: LifeBuoy, desc: "محادثات الدعم فقط" },
  BILLING: { label: "فوترة", color: "from-emerald-100 to-emerald-50 text-emerald-800 border-emerald-300", icon: CreditCard, desc: "الاشتراكات والفواتير" },
  CONTENT: { label: "محتوى", color: "from-pink-100 to-pink-50 text-pink-800 border-pink-300", icon: FileText, desc: "إعدادات الموقع والقوالب" },
  VIEWER: { label: "مشاهد", color: "from-zinc-100 to-zinc-50 text-zinc-700 border-zinc-300", icon: Eye, desc: "قراءة فقط" },
};

export default function AdminsManager({ initialAdmins }: { initialAdmins: Admin[] }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initialAdmins);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clerkUserId: "", email: "", name: "", role: "SUPPORT" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function add() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setAdmins([data, ...admins]);
      setForm({ clerkUserId: "", email: "", name: "", role: "SUPPORT" });
      setShowForm(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(admin: Admin) {
    setBusy(admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !admin.active }),
      });
      if (res.ok) {
        setAdmins(admins.map((a) => a.id === admin.id ? { ...a, active: !a.active } : a));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(admin: Admin) {
    if (!confirm(`حذف ${admin.name || admin.clerkUserId} من فريق الإدارة؟`)) return;
    setBusy(admin.id);
    try {
      await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
      setAdmins(admins.filter((a) => a.id !== admin.id));
    } finally {
      setBusy(null);
    }
  }

  async function updateRole(admin: Admin, newRole: string) {
    setBusy(admin.id);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setAdmins(admins.map((a) => a.id === admin.id ? { ...a, role: newRole } : a));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          إضافة عضو جديد
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-zinc-900">إضافة عضو لفريق الإدارة</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            احصل على Clerk User ID من <strong>dashboard.clerk.com → Users</strong>. العضو لازم يكون مسجّل في المنصة أولاً.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Clerk User ID *">
              <input
                value={form.clerkUserId}
                onChange={(e) => setForm({ ...form, clerkUserId: e.target.value })}
                placeholder="user_xxxxxxxxxxxxx"
                dir="ltr"
                className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </Field>
            <Field label="الاسم">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: أحمد القحطاني"
                className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </Field>
            <Field label="الإيميل">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="ahmed@example.com"
                dir="ltr"
                className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all"
              />
            </Field>
            <Field label="الدور">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all appearance-none cursor-pointer"
              >
                {Object.entries(ROLE_META).filter(([k]) => k !== "SUPER_ADMIN").map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label} — {meta.desc}</option>
                ))}
              </select>
            </Field>
          </div>

          {error && <p className="text-red-700 text-sm font-semibold">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={add}
              disabled={saving || !form.clerkUserId}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </button>
            <button
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-5 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 font-semibold transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {admins.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-12 text-center">
          <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
            <UserCog className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-zinc-700 font-bold text-base mb-1">لا يوجد موظفون بعد</p>
          <p className="text-zinc-500 text-sm">المدير العام الحالي محدد عبر متغير البيئة. أضف موظفين هنا لتفويض صلاحيات.</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {admins.map((a) => {
          const meta = ROLE_META[a.role] ?? ROLE_META.VIEWER;
          const Icon = meta.icon;
          return (
            <div
              key={a.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-5 transition-all ${
                a.active ? "border-zinc-100" : "border-zinc-200 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center text-black font-black text-lg shrink-0 shadow-md">
                  {(a.name || a.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-zinc-900">{a.name || a.email || "بدون اسم"}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border bg-gradient-to-l ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    {!a.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 text-red-700 border border-red-200">موقوف</span>
                    )}
                  </div>
                  {a.email && <p className="text-xs text-zinc-500 mt-0.5 font-mono" dir="ltr">{a.email}</p>}
                  <p className="text-[11px] text-zinc-400 mt-1 font-mono" dir="ltr">{a.clerkUserId}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={a.role}
                    onChange={(e) => updateRole(a, e.target.value)}
                    disabled={busy === a.id || a.role === "SUPER_ADMIN"}
                    className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1.5 font-bold focus:outline-none focus:border-amber-400 cursor-pointer disabled:opacity-50"
                  >
                    {Object.entries(ROLE_META).map(([key, m]) => (
                      <option key={key} value={key}>{m.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggle(a)}
                    disabled={busy === a.id}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                      a.active
                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {busy === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : a.active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => remove(a)}
                    disabled={busy === a.id}
                    className="text-zinc-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
