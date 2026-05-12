"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, CheckCircle, ExternalLink, CreditCard, AlertCircle, ChevronDown } from "lucide-react";

interface Config {
  provider: string;
  enabled: boolean;
  testMode: boolean;
  apiKeyMasked: string;
  webhookSecretConfigured: boolean;
  baseUrl: string;
  defaultCurrency: string;
}

interface Payment {
  id: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  customerEmail: string | null;
  createdAt: string;
}

const GATEWAYS = [
  {
    key: "MYFATOORAH",
    name: "MyFatoorah",
    desc: "البوابة الأكثر شيوعاً في الخليج — تدعم Mada، فيزا، Apple Pay، STC Pay",
    region: "🇰🇼 الكويت / الخليج",
    docsUrl: "https://docs.myfatoorah.com/",
    signupUrl: "https://portal.myfatoorah.com/EN/Login",
    recommended: true,
  },
  {
    key: "MOYASAR",
    name: "Moyasar",
    desc: "بوابة سعودية معتمدة — Mada، فيزا، Apple Pay، STC Pay",
    region: "🇸🇦 السعودية",
    docsUrl: "https://docs.moyasar.com/",
    signupUrl: "https://moyasar.com/",
    recommended: false,
  },
  {
    key: "TAP",
    name: "Tap Payments",
    desc: "بوابة كويتية بتغطية واسعة في الشرق الأوسط",
    region: "🌍 الشرق الأوسط",
    docsUrl: "https://www.tap.company/sa/ar",
    signupUrl: "https://www.tap.company/",
    recommended: false,
  },
  {
    key: "STRIPE",
    name: "Stripe",
    desc: "البوابة الأكثر شهرة عالمياً — للأسواق الدولية",
    region: "🌐 عالمي",
    docsUrl: "https://stripe.com/docs",
    signupUrl: "https://dashboard.stripe.com/register",
    recommended: false,
  },
];

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  INITIATED: "bg-blue-50 text-blue-700 border-blue-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  EXPIRED: "bg-zinc-100 text-zinc-500 border-zinc-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "مدفوعة", PENDING: "معلقة", INITIATED: "بدأت", FAILED: "فشلت",
  CANCELLED: "ملغاة", EXPIRED: "منتهية", REFUNDED: "مستردة",
};

export default function PaymentGatewayManager({ initialConfigs, recentPayments }: { initialConfigs: Config[]; recentPayments: Payment[] }) {
  return (
    <div className="space-y-5">
      {GATEWAYS.map((g) => {
        const cfg = initialConfigs.find((c) => c.provider === g.key);
        return <GatewayCard key={g.key} gateway={g} config={cfg} />;
      })}

      {/* Recent Payments */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900">آخر المدفوعات</h3>
        </div>
        {recentPayments.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">لا توجد مدفوعات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{p.customerEmail || "عميل"}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{p.provider} · {new Date(p.createdAt).toLocaleString("ar-SA")}</p>
                </div>
                <span className="text-sm font-bold text-zinc-900 shrink-0">{p.amount} {p.currency}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shrink-0 ${STATUS_STYLES[p.status] ?? STATUS_STYLES.PENDING}`}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GatewayCard({ gateway, config }: { gateway: typeof GATEWAYS[number]; config?: Config }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    enabled: config?.enabled ?? false,
    testMode: config?.testMode ?? true,
    apiKey: "",
    webhookSecret: "",
    baseUrl: config?.baseUrl ?? "",
    defaultCurrency: config?.defaultCurrency ?? "SAR",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "w-full bg-white text-zinc-900 placeholder:text-zinc-400 border-2 border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all";

  async function save() {
    setSaving(true);
    setError("");
    setDone(false);
    try {
      const payload: any = {
        provider: gateway.key,
        enabled: form.enabled,
        testMode: form.testMode,
        baseUrl: form.baseUrl,
        defaultCurrency: form.defaultCurrency,
      };
      if (form.apiKey) payload.apiKey = form.apiKey;
      if (form.webhookSecret) payload.webhookSecret = form.webhookSecret;

      const res = await fetch("/api/admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isConfigured = config?.enabled;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${
      isConfigured ? "border-emerald-300" : open ? "border-amber-300" : "border-zinc-100"
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-right p-5 sm:p-6 hover:bg-zinc-50/50 transition-colors"
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isConfigured
              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
              : "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 text-amber-600"
          }`}>
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-zinc-900 text-lg">{gateway.name}</p>
              {gateway.recommended && (
                <span className="text-[10px] font-bold bg-zinc-900 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wide">موصى به</span>
              )}
              {isConfigured && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">مفعّل {config.testMode && "(تجريبي)"}</span>
              )}
            </div>
            <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{gateway.desc}</p>
            <p className="text-xs text-zinc-500 mt-1.5">{gateway.region}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 p-5 sm:p-6 space-y-4 bg-zinc-50/40">
          {/* Setup links */}
          <div className="flex flex-wrap gap-2 mb-3">
            <a
              href={gateway.signupUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> إنشاء حساب
            </a>
            <a
              href={gateway.docsUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> الوثائق التقنية
            </a>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
            <Toggle
              label="تفعيل البوابة"
              desc="عند التفعيل، تظهر للمشتركين كخيار دفع"
              value={form.enabled}
              onChange={(v) => setForm({ ...form, enabled: v })}
            />
            <Toggle
              label="وضع التجربة (Sandbox)"
              desc="معاملات وهمية للاختبار — لا خصم حقيقي"
              value={form.testMode}
              onChange={(v) => setForm({ ...form, testMode: v })}
            />
          </div>

          {/* Credentials */}
          <Field label="API Key / Token *" hint={config?.apiKeyMasked ? `محفوظ حالياً: ${config.apiKeyMasked} — اتركه فارغاً للإبقاء عليه` : "احصل عليه من لوحة تحكم البوابة"}>
            <input
              type="password" dir="ltr"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={config?.apiKeyMasked || "rLtt6JWvbUHDDhsZnfpAhpYk4dxYGYnUwk..."}
              className={inputCls + " font-mono"}
            />
          </Field>

          <Field label="Webhook Secret" hint={config?.webhookSecretConfigured ? "محفوظ — اتركه فارغاً للإبقاء عليه" : "للتحقق من صحة الـ webhooks الواردة"}>
            <input
              type="password" dir="ltr"
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
              placeholder="webhook_secret_..."
              className={inputCls + " font-mono"}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Base URL (اختياري)" hint="استخدم القيمة الافتراضية إذا لم تكن متأكداً">
              <input
                dir="ltr"
                value={form.baseUrl}
                onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                placeholder="https://api.myfatoorah.com"
                className={inputCls + " font-mono"}
              />
            </Field>
            <Field label="العملة الافتراضية">
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                className={inputCls + " appearance-none cursor-pointer"}
              >
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
              </select>
            </Field>
          </div>

          {/* Webhook URL hint */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-900 mb-1">رابط الـ Webhook (اضبطه في لوحة {gateway.name}):</p>
              <code className="text-xs font-mono text-amber-900 bg-white border border-amber-200 px-2 py-0.5 rounded inline-block break-all" dir="ltr">
                {typeof window !== "undefined" ? window.location.origin : "https://your-domain"}/api/webhooks/payments/{gateway.key.toLowerCase()}
              </code>
            </div>
          </div>

          {error && <p className="text-red-700 text-sm font-semibold">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 disabled:opacity-50 text-black px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الإعدادات
            </button>
            {done && (
              <span className="text-emerald-700 text-sm flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4" /> تم الحفظ
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm font-bold text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
          value ? "bg-gradient-to-l from-amber-300 via-yellow-500 to-amber-700" : "bg-zinc-300"
        }`}
      >
        <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${value ? "right-0.5" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}
