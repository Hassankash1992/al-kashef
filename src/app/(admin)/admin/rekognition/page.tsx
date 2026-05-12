import { getActiveProvider } from "@/lib/face-recognition";
import { ScanFace, CheckCircle, XCircle, ExternalLink, Sparkles } from "lucide-react";

export default async function RekognitionPage() {
  const provider = await getActiveProvider();
  const configured = provider !== "NONE";

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-amber-600" />
          خدمة التعرف على الوجوه
        </h1>
        <p className="text-zinc-500 text-sm mt-1">إعدادات بحث الوجوه — يدعم AWS و Face++</p>
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
              {configured ? `✅ مفعّل عبر ${provider === "AWS" ? "AWS Rekognition" : "Face++"}` : "⚠️ غير مفعّل"}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {configured
                ? "البحث بالوجه متاح للضيوف"
                : "اختر إحدى الخدمتين بالأسفل وأضف بياناتها في Vercel"}
            </p>
          </div>
        </div>
      </div>

      {/* Face++ Option */}
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 sm:p-6 mb-5 ${
        provider === "FACEPP" ? "border-emerald-300" : "border-zinc-100"
      }`}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg">Face++ (المُوصى به للبداية)</h2>
              <p className="text-xs text-emerald-700 font-bold">🎁 5000 عملية مجاناً للأبد — بدون بطاقة ائتمان</p>
            </div>
          </div>
          {provider === "FACEPP" && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">نشط</span>
          )}
        </div>
        <ol className="space-y-2 text-sm text-zinc-700 mb-3">
          <li><strong>1.</strong> سجّل في <a href="https://www.faceplusplus.com" target="_blank" className="text-amber-700 underline font-bold">faceplusplus.com <ExternalLink className="w-3 h-3 inline" /></a></li>
          <li><strong>2.</strong> Console → Apps → Create New App → اسم: <code className="bg-zinc-100 px-1.5 rounded">EventFace</code></li>
          <li><strong>3.</strong> انسخ <strong>API Key</strong> و <strong>API Secret</strong></li>
          <li><strong>4.</strong> أضفها في Vercel → Environment Variables:</li>
        </ol>
        <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-xs space-y-1" dir="ltr">
          <div><span className="text-amber-400">FACEPP_API_KEY</span>=...</div>
          <div><span className="text-amber-400">FACEPP_API_SECRET</span>=...</div>
        </div>
      </div>

      {/* AWS Option */}
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 sm:p-6 mb-5 ${
        provider === "AWS" ? "border-emerald-300" : "border-zinc-100"
      }`}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
              <ScanFace className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg">AWS Rekognition (للنطاق التجاري)</h2>
              <p className="text-xs text-zinc-600">جودة 98%+ — مجاني سنة كاملة (5000/شهر) — يحتاج بطاقة</p>
            </div>
          </div>
          {provider === "AWS" && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">نشط</span>
          )}
        </div>
        <ol className="space-y-2 text-sm text-zinc-700 mb-3">
          <li><strong>1.</strong> أنشئ حساب <a href="https://aws.amazon.com" target="_blank" className="text-amber-700 underline font-bold">aws.amazon.com <ExternalLink className="w-3 h-3 inline" /></a></li>
          <li><strong>2.</strong> IAM → Users → Create User → صلاحية <code className="bg-zinc-100 px-1.5 rounded">AmazonRekognitionFullAccess</code></li>
          <li><strong>3.</strong> Security credentials → Access keys → Create</li>
          <li><strong>4.</strong> أضفها في Vercel:</li>
        </ol>
        <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-xs space-y-1" dir="ltr">
          <div><span className="text-amber-400">AWS_ACCESS_KEY_ID</span>=AKIA...</div>
          <div><span className="text-amber-400">AWS_SECRET_ACCESS_KEY</span>=...</div>
          <div><span className="text-amber-400">AWS_REGION</span>=us-east-1</div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
        💡 <strong>ملاحظة:</strong> إذا فعّلت الاثنين، النظام يستخدم AWS تلقائياً (جودة أعلى).
      </div>
    </div>
  );
}
