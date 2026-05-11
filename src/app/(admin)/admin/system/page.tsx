import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS, PLAN_BADGE_COLOR } from "@/lib/plans";
import PlanConfigEditor from "@/components/admin/PlanConfigEditor";
import { Settings2, Key } from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  STARTER: "مبتدئ",
  PRO: "احترافي",
  AGENCY: "وكالة",
};

export default async function AdminSystemPage() {
  const dbConfigs = await db.planConfig.findMany();

  const configs = (["STARTER", "PRO", "AGENCY"] as const).map((plan) => {
    const dbConfig = dbConfigs.find((c) => c.plan === plan);
    return dbConfig ?? { plan, ...DEFAULT_PLAN_LIMITS[plan] };
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-amber-600" />
          إعدادات المنصة
        </h1>
        <p className="text-zinc-500 text-sm mt-1">تحكم كامل بحدود الباقات وأسعارها</p>
      </div>

      {/* Plan editors */}
      <div className="space-y-5">
        {configs.map((config) => (
          <div key={config.plan} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6">
            <h2 className="font-bold text-zinc-900 mb-5 flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${PLAN_BADGE_COLOR[config.plan as keyof typeof PLAN_BADGE_COLOR]}`}>
                {config.plan}
              </span>
              <span>{PLAN_LABELS[config.plan]}</span>
            </h2>
            <PlanConfigEditor config={config as any} />
          </div>
        ))}
      </div>

      {/* Env vars reference */}
      <div className="mt-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="font-bold mb-1 text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            متغيرات البيئة المطلوبة
          </h2>
          <p className="text-xs text-zinc-400 mb-4">يجب ضبطها في إعدادات Vercel أو الـ server</p>
          <div className="space-y-1.5 font-mono text-xs">
            {[
              ["SUPER_ADMIN_USER_IDS", "Clerk user IDs للمشرفين"],
              ["AWS_ACCESS_KEY_ID", "مفتاح AWS Rekognition"],
              ["AWS_SECRET_ACCESS_KEY", "المفتاح السري لـ AWS"],
              ["AWS_REGION", "منطقة AWS (us-east-1)"],
              ["R2_ACCOUNT_ID", "حساب Cloudflare R2"],
              ["R2_ACCESS_KEY_ID", "مفتاح R2"],
              ["R2_SECRET_ACCESS_KEY", "السر R2"],
              ["R2_BUCKET_NAME", "اسم الـ bucket"],
              ["R2_PUBLIC_URL", "رابط CDN العام"],
              ["REDIS_URL", "رابط Redis للـ Queue"],
              ["ENCRYPTION_KEY", "مفتاح التشفير 32 bytes"],
              ["NEXT_PUBLIC_APP_URL", "رابط التطبيق الرئيسي"],
            ].map(([key, desc]) => (
              <div key={key} className="flex gap-3 py-1 border-b border-white/5 last:border-0">
                <span className="text-amber-400 shrink-0 font-bold">{key}</span>
                <span className="text-zinc-500">← {desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
