"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Save, Loader2, Mail, MessageCircle, Smartphone, Smartphone as InApp, Plus, Trash2, Calendar, CheckCircle, ChevronDown } from "lucide-react";

interface Template {
  id: string;
  key: string;
  title: string;
  description: string | null;
  channels: { email: boolean; whatsapp: boolean; sms: boolean; inApp: boolean };
  emailSubject: string | null;
  emailBody: string | null;
  whatsappBody: string | null;
  smsBody: string | null;
  inAppTitle: string | null;
  inAppBody: string | null;
  enabled: boolean;
  variables: string[] | null;
  isDefault?: boolean;
}

interface Schedule {
  id: string;
  templateId: string;
  templateKey: string;
  templateTitle: string;
  trigger: string;
  triggerData: any;
  enabled: boolean;
  lastRunAt: string | null;
}

const TRIGGERS: Record<string, string> = {
  ON_USER_SIGNUP: "عند تسجيل مستخدم جديد",
  ON_TENANT_CREATED: "عند إنشاء حساب شركة",
  ON_FIRST_EVENT: "عند إنشاء أول فعالية",
  ON_SUBSCRIPTION_CREATED: "عند الاشتراك",
  ON_TRIAL_STARTED: "عند بدء التجربة المجانية",
  BEFORE_TRIAL_ENDED: "قبل انتهاء التجربة",
  BEFORE_SUBSCRIPTION_EXPIRY: "قبل انتهاء الاشتراك",
  AFTER_SUBSCRIPTION_EXPIRED: "بعد انتهاء الاشتراك",
  ON_PAYMENT_FAILED: "عند فشل الدفع",
  ON_PAYMENT_SUCCESS: "عند نجاح الدفع",
  ON_TEAM_INVITE: "عند دعوة عضو فريق",
  ON_PHOTO_UPLOAD_COMPLETE: "عند انتهاء رفع الصور",
  ON_FACE_SEARCH_DONE: "عند انتهاء بحث الوجه",
  WEEKLY_DIGEST: "ملخص أسبوعي",
  MONTHLY_DIGEST: "ملخص شهري",
};

export default function NotificationsManager({ templates, schedules }: { templates: Template[]; schedules: Schedule[] }) {
  const [tab, setTab] = useState<"templates" | "schedules">("templates");
  return (
    <div>
      <div className="flex gap-2 mb-5 border-b border-zinc-200">
        <Tab active={tab === "templates"} onClick={() => setTab("templates")}>القوالب ({templates.length})</Tab>
        <Tab active={tab === "schedules"} onClick={() => setTab("schedules")}>الجدولة ({schedules.length})</Tab>
      </div>

      {tab === "templates" ? (
        <TemplatesList templates={templates} />
      ) : (
        <SchedulesList schedules={schedules} templates={templates.filter((t) => !t.isDefault)} />
      )}
    </div>
  );
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${
        active
          ? "border-amber-500 text-amber-700"
          : "border-transparent text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

/* ─── Templates ─── */
function TemplatesList({ templates }: { templates: Template[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <TemplateCard
          key={t.id}
          template={t}
          isOpen={openId === t.id}
          onToggle={() => setOpenId(openId === t.id ? null : t.id)}
        />
      ))}
    </div>
  );
}

function TemplateCard({ template, isOpen, onToggle }: { template: Template; isOpen: boolean; onToggle: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(template);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function save() {
    setSaving(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key,
          title: form.title,
          description: form.description,
          channels: form.channels,
          emailSubject: form.emailSubject,
          emailBody: form.emailBody,
          whatsappBody: form.whatsappBody,
          smsBody: form.smsBody,
          inAppTitle: form.inAppTitle,
          inAppBody: form.inAppBody,
          enabled: form.enabled,
          variables: form.variables,
        }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isOpen ? "border-amber-300" : "border-zinc-100"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 sm:p-5 text-right hover:bg-zinc-50/50 transition-colors">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-zinc-900">{form.title}</p>
            {template.isDefault && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold border border-zinc-200">افتراضي</span>
            )}
            {!form.enabled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-bold border border-red-200">معطّل</span>
            )}
          </div>
          {form.description && <p className="text-xs text-zinc-500 mt-0.5">{form.description}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            {form.channels.email && <ChannelBadge icon={Mail} label="إيميل" />}
            {form.channels.whatsapp && <ChannelBadge icon={MessageCircle} label="WhatsApp" />}
            {form.channels.sms && <ChannelBadge icon={Smartphone} label="SMS" />}
            {form.channels.inApp && <ChannelBadge icon={InApp} label="داخل التطبيق" />}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-zinc-100 p-4 sm:p-5 space-y-4 bg-zinc-50/40">
          {/* Channels toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              ["email", "إيميل"],
              ["whatsapp", "WhatsApp"],
              ["sms", "SMS"],
              ["inApp", "داخل التطبيق"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, channels: { ...form.channels, [key]: !form.channels[key] } })}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.channels[key]
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-white border-zinc-200 text-zinc-500"
                }`}
              >
                {form.channels[key] && <CheckCircle className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>

          {/* Email */}
          {form.channels.email && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> محتوى الإيميل</p>
              <input
                value={form.emailSubject ?? ""}
                onChange={(e) => setForm({ ...form, emailSubject: e.target.value })}
                placeholder="موضوع الإيميل..."
                className={inputCls}
              />
              <textarea
                rows={5}
                value={form.emailBody ?? ""}
                onChange={(e) => setForm({ ...form, emailBody: e.target.value })}
                placeholder="محتوى الإيميل (يدعم {{variables}})..."
                className={inputCls + " resize-y"}
              />
            </div>
          )}

          {form.channels.whatsapp && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /> رسالة WhatsApp</p>
              <textarea
                rows={3}
                value={form.whatsappBody ?? ""}
                onChange={(e) => setForm({ ...form, whatsappBody: e.target.value })}
                placeholder="رسالة WhatsApp..."
                className={inputCls + " resize-y"}
              />
            </div>
          )}

          {form.channels.sms && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> رسالة SMS</p>
              <textarea
                rows={2}
                value={form.smsBody ?? ""}
                onChange={(e) => setForm({ ...form, smsBody: e.target.value })}
                placeholder="رسالة SMS قصيرة..."
                className={inputCls + " resize-y"}
              />
            </div>
          )}

          {form.channels.inApp && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200">
              <p className="text-xs font-bold text-zinc-700 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> إشعار داخلي</p>
              <input
                value={form.inAppTitle ?? ""}
                onChange={(e) => setForm({ ...form, inAppTitle: e.target.value })}
                placeholder="عنوان الإشعار..."
                className={inputCls}
              />
              <textarea
                rows={2}
                value={form.inAppBody ?? ""}
                onChange={(e) => setForm({ ...form, inAppBody: e.target.value })}
                placeholder="نص الإشعار..."
                className={inputCls + " resize-y"}
              />
            </div>
          )}

          {form.variables && form.variables.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-900 mb-1.5">المتغيرات المتاحة:</p>
              <div className="flex flex-wrap gap-1.5">
                {form.variables.map((v) => (
                  <code key={v} className="text-xs bg-white px-2 py-0.5 rounded border border-amber-200 font-mono text-amber-800">
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ القالب
            </button>
            <button
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                form.enabled
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {form.enabled ? "إيقاف القالب" : "تفعيل القالب"}
            </button>
            {done && <span className="text-emerald-700 text-sm font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> محفوظ</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

/* ─── Schedules ─── */
function SchedulesList({ schedules, templates }: { schedules: Schedule[]; templates: Template[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ templateId: "", trigger: "ON_USER_SIGNUP", triggerData: "{}" });
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.templateId) return;
    setSaving(true);
    try {
      let triggerData: any = undefined;
      try { triggerData = JSON.parse(form.triggerData); } catch {}
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: form.templateId, trigger: form.trigger, triggerData, enabled: true }),
      });
      if (res.ok) {
        router.refresh();
        setShowForm(false);
        setForm({ templateId: "", trigger: "ON_USER_SIGNUP", triggerData: "{}" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/schedules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("حذف الجدولة؟")) return;
    await fetch(`/api/admin/schedules/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!showForm && templates.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          إضافة جدولة
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-md p-4 sm:p-5 space-y-3">
          <h3 className="font-bold text-zinc-900">جدولة جديدة</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
              className="bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="">اختر قالباً...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <select
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value })}
              className="bg-white text-zinc-900 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {Object.entries(TRIGGERS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {(form.trigger === "BEFORE_SUBSCRIPTION_EXPIRY" || form.trigger === "BEFORE_TRIAL_ENDED") && (
            <input
              value={form.triggerData}
              onChange={(e) => setForm({ ...form, triggerData: e.target.value })}
              placeholder='{"days": 7}'
              dir="ltr"
              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-400 transition-all"
            />
          )}
          <div className="flex gap-3">
            <button
              onClick={add}
              disabled={saving || !form.templateId}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              إضافة
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900 font-semibold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>تنبيه:</strong> لا توجد قوالب محفوظة بعد. اذهب لتبويب "القوالب" واحفظ قالباً واحداً على الأقل.
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-12 text-center">
          <div className="inline-flex w-16 h-16 bg-zinc-100 rounded-2xl items-center justify-center mb-3">
            <Calendar className="w-7 h-7 text-zinc-400" />
          </div>
          <p className="text-zinc-700 font-bold mb-1">لا توجد جدولة بعد</p>
          <p className="text-zinc-500 text-sm">أضف جدولة لربط قالب بحدث معين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 truncate">{s.templateTitle}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{TRIGGERS[s.trigger] ?? s.trigger}</p>
              </div>
              <button
                onClick={() => toggle(s.id, !s.enabled)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                  s.enabled
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-zinc-100 border-zinc-200 text-zinc-500"
                }`}
              >
                {s.enabled ? "فعّال" : "موقوف"}
              </button>
              <button
                onClick={() => remove(s.id)}
                className="text-zinc-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
