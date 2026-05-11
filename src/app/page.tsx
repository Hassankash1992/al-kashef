import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Camera, Zap, Globe, Shield, ArrowLeft } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Camera className="w-8 h-8 text-indigo-400" />
          <span className="text-2xl font-bold">EventFace</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="px-4 py-2 text-sm text-indigo-200 hover:text-white transition-colors">
            تسجيل الدخول
          </Link>
          <Link href="/sign-up" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-sm font-medium transition-colors">
            ابدأ مجاناً
          </Link>
        </div>
      </nav>

      <section className="text-center py-24 px-8 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 rounded-full px-4 py-2 text-sm text-indigo-300 mb-8">
          <Zap className="w-4 h-4" />
          منصة SaaS متعددة المستأجرين
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          معارض الفعاليات
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400"> الذكية</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
          منصة احترافية تمكّن شركات التصوير من إنشاء معارض صور خاصة لكل فعالية، مع إمكانية البحث عن الصور بالوجه.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up" className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-lg font-semibold transition-all hover:scale-105">
            ابدأ مجاناً الآن
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="#features" className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-lg font-medium transition-colors">
            اعرف المزيد
          </Link>
        </div>
      </section>

      <section id="features" className="py-20 px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">كل ما تحتاجه في مكان واحد</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">باقات تناسب جميع الاحتياجات</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-6 border ${p.highlight ? "bg-indigo-500 border-indigo-400" : "bg-white/5 border-white/10"}`}>
              <h3 className="text-2xl font-bold mb-1">{p.name}</h3>
              <p className="text-3xl font-black mb-6">{p.price}<span className="text-sm font-normal opacity-70">/شهر</span></p>
              <ul className="space-y-2 text-sm">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 opacity-90">
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={`mt-6 block text-center py-3 rounded-xl font-semibold transition-colors ${p.highlight ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-500/20 hover:bg-indigo-500/40 text-white"}`}>
                ابدأ الآن
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/10">
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
