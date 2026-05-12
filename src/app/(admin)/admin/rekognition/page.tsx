import { isRekognitionConfigured } from "@/lib/rekognition";
import { ScanFace, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default async function RekognitionPage() {
  const configured = await isRekognitionConfigured();

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-amber-600" />
          AWS Rekognition (التعرف على الوجوه)
        </h1>
        <p className="text-zinc-500 text-sm mt-1">إعدادات خدمة التعرف على الوجوه</p>
      </div>

      {/* Status */}
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 sm:p-6 mb-5 ${
        configured ? "border-emerald-300" : "border-amber-300"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            configured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          }`}>
            {configured ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-900">
              {configured ? "✅ Rekognition مفعّل ويعمل" : "⚠️ Rekognition غير مفعّل"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {configured
                ? "البحث بالوجه متاح للضيوف على الفعاليات المفعّل بها هذه الميزة"
                : "أكمل الإعداد بالأسفل لتفعيل ميزة البحث بالوجه"}
            </p>
          </div>
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-6 mb-5">
        <h2 className="font-bold text-zinc-900 mb-4">خطوات الإعداد</h2>
        <ol className="space-y-3 text-sm text-zinc-700">
          <Step n={1} title="أنشئ حساب AWS مجاني">
            اذهب لـ <a href="https://aws.amazon.com/" target="_blank" className="text-amber-700 font-bold underline">aws.amazon.com</a> — مجاني للسنة الأولى (5000 صورة بحث/شهر).
          </Step>
          <Step n={2} title="أنشئ IAM User">
            من <strong>IAM → Users → Create User</strong>، أعطه صلاحية <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono text-xs">AmazonRekognitionFullAccess</code>.
          </Step>
          <Step n={3} title="احصل على Access Keys">
            من <strong>Security credentials → Access keys → Create access key</strong>، احفظ الـ Access Key ID والـ Secret.
          </Step>
          <Step n={4} title="أضفها في Vercel Environment Variables">
            <div className="mt-2 bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-xs space-y-1" dir="ltr">
              <div><span className="text-amber-400">AWS_ACCESS_KEY_ID</span>=AKIA...</div>
              <div><span className="text-amber-400">AWS_SECRET_ACCESS_KEY</span>=...</div>
              <div><span className="text-amber-400">AWS_REGION</span>=us-east-1</div>
            </div>
          </Step>
          <Step n={5} title="أعد نشر التطبيق">
            من Vercel Dashboard → Deployments → Redeploy.
          </Step>
        </ol>
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h3 className="font-bold text-amber-400 mb-3">💰 التسعير (تقديري)</h3>
          <div className="space-y-2 text-sm">
            <Pricing label="فهرسة وجه (IndexFaces)" price="$1.00 / 1000 وجه" />
            <Pricing label="بحث وجه (SearchFaces)" price="$1.00 / 1000 بحث" />
            <Pricing label="السنة الأولى" price="مجاني (5000 عملية/شهر)" />
          </div>
          <a
            href="https://aws.amazon.com/rekognition/pricing/"
            target="_blank"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-amber-400 hover:text-amber-300 font-bold"
          >
            <ExternalLink className="w-3 h-3" /> الأسعار الكاملة
          </a>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <div className="w-7 h-7 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-md">
        {n}
      </div>
      <div className="flex-1">
        <p className="font-bold text-zinc-900">{title}</p>
        <div className="text-zinc-600 mt-1 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function Pricing({ label, price }: { label: string; price: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-zinc-300">{label}</span>
      <span className="text-amber-400 font-bold">{price}</span>
    </div>
  );
}
