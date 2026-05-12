import { isRekognitionConfigured } from "@/lib/rekognition";
import { isFaceppConfigured } from "@/lib/faceplusplus";
import { ScanFace, CheckCircle, XCircle, ExternalLink, Sparkles, Crown, ArrowLeftRight } from "lucide-react";

export default async function RekognitionPage() {
  const awsReady = await isRekognitionConfigured();
  const fppReady = await isFaceppConfigured();

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ScanFace className="w-6 h-6 text-amber-600" />
          خدمة التعرف على الوجوه
        </h1>
        <p className="text-zinc-500 text-sm mt-1">يدعم AWS و Face++ — يُختار حسب باقة المشترك تلقائياً</p>
      </div>

      {/* Tier mapping */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-black rounded-2xl shadow-xl p-5 sm:p-6 text-white relative overflow-hidden mb-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            توزيع الخدمة حسب الباقة
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PlanCard
              name="STARTER"
              label="مبتدئ"
              provider="Face++"
              accuracy="93%"
              ready={fppReady}
              isHighlight={false}
            />
            <PlanCard
              name="PRO"
              label="احترافي"
              provider="AWS"
              accuracy="98%"
              ready={awsReady}
              isHighlight={true}
            />
            <PlanCard
              name="AGENCY"
              label="وكالة"
              provider="AWS"
              accuracy="98%"
              ready={awsReady}
              isHighlight={true}
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
            💡 إذا الباقة تحتاج AWS لكنه غير مفعّل، يُستخدم Face++ كـ fallback تلقائياً.
          </p>
        </div>
      </div>

      {/* Face++ Setup */}
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 sm:p-6 mb-5 ${
        fppReady ? "border-emerald-300" : "border-amber-300"
      }`}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              fppReady ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
            }`}>
              {fppReady ? <CheckCircle className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg">Face++ — للباقة المبتدئة</h2>
              <p className="text-xs text-emerald-700 font-bold">🎁 5000 عملية مجاناً للأبد — بدون بطاقة</p>
            </div>
          </div>
          <StatusBadge ready={fppReady} />
        </div>
        {!fppReady && (
          <>
            <ol className="space-y-2 text-sm text-zinc-700 mb-3">
              <li><strong>1.</strong> سجّل في <a href="https://www.faceplusplus.com" target="_blank" className="text-amber-700 underline font-bold">faceplusplus.com <ExternalLink className="w-3 h-3 inline" /></a></li>
              <li><strong>2.</strong> Console → Apps → Create New App</li>
              <li><strong>3.</strong> أضف المفاتيح في Vercel:</li>
            </ol>
            <CodeBlock vars={["FACEPP_API_KEY", "FACEPP_API_SECRET"]} />
          </>
        )}
      </div>

      {/* AWS Setup */}
      <div className={`bg-white rounded-2xl border-2 shadow-sm p-5 sm:p-6 mb-5 ${
        awsReady ? "border-emerald-300" : "border-amber-300"
      }`}>
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              awsReady ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              {awsReady ? <CheckCircle className="w-6 h-6" /> : <Crown className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg">AWS Rekognition — للباقات الأعلى</h2>
              <p className="text-xs text-zinc-600">جودة 98%+ — مجاني سنة كاملة (5000/شهر)</p>
            </div>
          </div>
          <StatusBadge ready={awsReady} />
        </div>
        {!awsReady && (
          <>
            <ol className="space-y-2 text-sm text-zinc-700 mb-3">
              <li><strong>1.</strong> أنشئ حساب <a href="https://aws.amazon.com" target="_blank" className="text-amber-700 underline font-bold">aws.amazon.com <ExternalLink className="w-3 h-3 inline" /></a> (يحتاج بطاقة)</li>
              <li><strong>2.</strong> IAM → Users → صلاحية <code className="bg-zinc-100 px-1.5 rounded">AmazonRekognitionFullAccess</code></li>
              <li><strong>3.</strong> Security credentials → Create access key</li>
              <li><strong>4.</strong> أضفها في Vercel:</li>
            </ol>
            <CodeBlock vars={["AWS_ACCESS_KEY_ID=AKIA...", "AWS_SECRET_ACCESS_KEY=...", "AWS_REGION=us-east-1"]} />
          </>
        )}
      </div>
    </div>
  );
}

function PlanCard({ name, label, provider, accuracy, ready, isHighlight }: {
  name: string; label: string; provider: string; accuracy: string; ready: boolean; isHighlight: boolean;
}) {
  return (
    <div className={`relative rounded-xl p-4 border-2 ${
      isHighlight
        ? "bg-gradient-to-br from-amber-500/10 to-yellow-600/10 border-amber-400/40"
        : "bg-white/5 border-white/10"
    }`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">{name}</span>
        <span className="text-xs text-zinc-300">— {label}</span>
      </div>
      <p className="text-base font-bold text-white">{provider}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-zinc-400">دقة {accuracy}</span>
        {ready ? (
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">جاهز</span>
        ) : (
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">يحتاج إعداد</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
      <CheckCircle className="w-3 h-3" /> مفعّل
    </span>
  ) : (
    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded-full flex items-center gap-1">
      <XCircle className="w-3 h-3" /> غير مفعّل
    </span>
  );
}

function CodeBlock({ vars }: { vars: string[] }) {
  return (
    <div className="bg-zinc-900 text-zinc-200 rounded-lg p-3 font-mono text-xs space-y-1" dir="ltr">
      {vars.map((v) => (
        <div key={v}><span className="text-amber-400">{v.split("=")[0]}</span>={v.split("=")[1] ?? "..."}</div>
      ))}
    </div>
  );
}
