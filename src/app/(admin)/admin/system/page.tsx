import { db } from "@/lib/db";
import { DEFAULT_PLAN_LIMITS } from "@/lib/plans";
import PlanConfigEditor from "@/components/admin/PlanConfigEditor";

export default async function AdminSystemPage() {
  const dbConfigs = await db.planConfig.findMany();

  const configs = (["STARTER", "PRO", "AGENCY"] as const).map((plan) => {
    const db = dbConfigs.find((c) => c.plan === plan);
    return db ?? { plan, ...DEFAULT_PLAN_LIMITS[plan] };
  });

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات المنصة</h1>
        <p className="text-gray-500 text-sm">تحكم كامل في باقات المنصة وحدودها وأسعارها</p>
      </div>

      <div className="space-y-6">
        {configs.map((config) => (
          <div key={config.plan} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                config.plan === "STARTER" ? "bg-gray-100 text-gray-600" :
                config.plan === "PRO" ? "bg-indigo-100 text-indigo-700" :
                "bg-purple-100 text-purple-700"
              }`}>{config.plan}</span>
              {config.displayName}
            </h2>
            <PlanConfigEditor config={config as any} />
          </div>
        ))}
      </div>

      {/* متغيرات البيئة */}
      <div className="mt-6 bg-gray-950 rounded-2xl p-6 text-white">
        <h2 className="font-bold mb-4 text-sm">متغيرات البيئة المطلوبة</h2>
        <div className="space-y-2 font-mono text-xs text-gray-400">
          {[
            ["SUPER_ADMIN_USER_IDS", "Clerk user IDs للمشرفين (مفصولة بفاصلة)"],
            ["AWS_ACCESS_KEY_ID", "مفتاح AWS للـ Rekognition"],
            ["AWS_SECRET_ACCESS_KEY", "المفتاح السري لـ AWS"],
            ["AWS_REGION", "منطقة AWS (مثال: us-east-1)"],
            ["R2_ACCOUNT_ID", "حساب Cloudflare R2"],
            ["R2_ACCESS_KEY_ID", "مفتاح R2"],
            ["R2_SECRET_ACCESS_KEY", "المفتاح السري لـ R2"],
            ["R2_BUCKET_NAME", "اسم الـ bucket"],
            ["R2_PUBLIC_URL", "رابط CDN العام"],
            ["REDIS_URL", "رابط Redis للـ Queue"],
            ["ENCRYPTION_KEY", "مفتاح التشفير (32 bytes hex)"],
            ["NEXT_PUBLIC_APP_URL", "رابط التطبيق الرئيسي"],
          ].map(([key, desc]) => (
            <div key={key} className="flex gap-3">
              <span className="text-green-400 shrink-0">{key}</span>
              <span className="text-gray-600">← {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
