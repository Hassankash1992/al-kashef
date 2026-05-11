import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Camera, Zap, Globe, Shield, ArrowLeft, Sparkles, Check } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white overflow-hidden" dir="rtl">
      {/* Decorative gold glows */}
      <div className="fixed top-0 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -left-32 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-50 rounded-lg" />
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center shadow-lg">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight">EventFace</span>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link
            href="/sign-in"
            className="px-3 sm:px-4 py-2 text-sm text-zinc-300 hover:text-amber-400 transition-colors font-medium"
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/sign-up"
            className="px-3 sm:px-5 py-2 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            ابدأ مجاناً
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center py-16 sm:py-24 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 rounded-full px-4 py-2 text-xs sm:text-sm text-amber-300 mb-6 sm:mb-8 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          منصة SaaS متعددة المستأجرين
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-5 sm:mb-6 leading-tight tracking-tight">
          معارض الفعاليات
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mt-1 sm:mt-2">
            الذكية
          </span>
        </h1>
        <p className="text-base sm:text-xl text-zinc-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          منصة احترافية تمكّن شركات التصوير من إنشاء معارض صور خاصة لكل فعالية، مع إمكانية البحث عن الصور بالوجه.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/sign-up"
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black rounded-xl text-base sm:text-lg font-bold transition-all shadow-xl shadow-amber-500/30 hover:scale-[1.02]"
          >
            ابدأ مجاناً الآن
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <Link
            href="#features"
            className="px-6 sm:px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-white rounded-xl text-base sm:text-lg font-medium transition-all"
          >
            اعرف المزيد
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-16 sm:py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16">
          كل ما تحتاجه في <span className="text-amber-400">مكان واحد</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white/5 border border-white/10 hover:border-amber-400/40 rounded-2xl p-5 sm:p-6 transition-all hover:bg-white/[0.07]"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="relative z-10 py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-16">
          باقات تناسب <span className="text-amber-400">جميع الاحتياجات</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-5 sm:p-6 border transition-all ${
                p.highlight
                  ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-amber-300 text-black shadow-2xl shadow-amber-500/30 lg:scale-105"
                  : "bg-white/5 border-white/10 hover:border-amber-400/40 text-white"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/40">
                  الأكثر شيوعاً
                </div>
              )}
              <h3 className={`text-xl sm:text-2xl font-bold mb-1 ${p.highlight ? "text-black" : "text-white"}`}>{p.name}</h3>
              <p className={`text-2xl sm:text-3xl font-black mb-5 sm:mb-6 ${p.highlight ? "text-black" : "text-white"}`}>
                {p.price}
                <span className={`text-sm font-normal ${p.highlight ? "text-black/70" : "text-zinc-400"}`}>/شهر</span>
              </p>
              <ul className="space-y-2.5 text-sm mb-6">
                {p.features.map((feat) => (
                  <li key={feat} className={`flex items-center gap-2 ${p.highlight ? "text-black/90" : "text-zinc-300"}`}>
                    <Check className={`w-4 h-4 shrink-0 ${p.highlight ? "text-black" : "text-amber-400"}`} strokeWidth={3} />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block text-center py-3 rounded-xl font-bold transition-all ${
                  p.highlight
                    ? "bg-black text-amber-400 hover:bg-zinc-900"
                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-400/30"
                }`}
              >
                ابدأ الآن
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 text-zinc-600 text-xs sm:text-sm border-t border-white/5">
        © 2026 EventFace. جميع الحقوق محفوظة.
      </footer>
    </main>
  );
}

const features = [
  { icon: Camera, title: "معارض ذكية", desc: "أنشئ معرضاً احترافياً لكل فعالية بدقائق، مع QR Code خاص وروابط مخصصة." },
  { icon: Zap, title: "بحث بالوجه", desc: "الضيف يرفع سيلفي ويجد جميع صوره فوراً باستخدام الذكاء الاصطناعي." },
  { icon: Globe, title: "دومين خاص", desc: "ربط دومينك أو دومين فرعي خاص بك لتقديم تجربة احترافية لعملائك." },
  { icon: Shield, title: "تعدد المستأجرين", desc: "كل شركة معزولة تماماً عن الأخرى مع بيانات وتخزين وإعدادات مستقلة." },
  { icon: Zap, title: "Google Drive", desc: "ربط مجلدات Google Drive مباشرة لاستيراد صور الفعاليات تلقائياً." },
  { icon: Globe, title: "واتساب وتيليجرام", desc: "إرسال روابط الصور للضيوف مباشرة عبر واتساب أو تيليجرام أو البريد." },
];

const plans = [
  { name: "Starter", price: "$29", highlight: false, features: ["10 فعاليات شهرياً", "500 صورة/فعالية", "دومين فرعي", "بحث وجه أساسي", "5 GB تخزين"] },
  { name: "Pro", price: "$79", highlight: true, features: ["50 فعالية شهرياً", "1500 صورة/فعالية", "دومين مخصص", "بحث وجه عالي", "واتساب/تيليجرام", "50 GB تخزين"] },
  { name: "Agency", price: "$199", highlight: false, features: ["فعاليات غير محدودة", "صور غير محدودة", "White Label", "تخزين خاص", "API Access", "دعم متقدم"] },
];
