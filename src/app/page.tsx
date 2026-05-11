import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Camera, Zap, Globe, Shield, ArrowLeft, Sparkles, Check, ScanFace,
  Upload, Cloud, Smartphone, Lock, Star, TrendingUp, Users, Clock,
  ChevronDown, Heart, Award, Image as ImageIcon, MessageSquare, Search,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden" dir="rtl">
      {/* Ambient glows — fixed background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 -right-48 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-48 w-[600px] h-[600px] bg-yellow-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-400/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <Nav />

      {/* Hero */}
      <Hero />

      {/* Trust Bar */}
      <TrustBar />

      {/* Features */}
      <Features />

      {/* Preview / Demo */}
      <PreviewSection />

      {/* How it works */}
      <HowItWorks />

      {/* Use Cases */}
      <UseCases />

      {/* Pricing */}
      <Pricing />

      {/* Testimonials */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <Footer />
    </main>
  );
}

/* ─── Nav ─────────────────────────────────────────────── */
function Nav() {
  return (
    <nav className="relative z-50 sticky top-0 bg-black/60 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-amber-400 blur-lg opacity-60 rounded-lg group-hover:opacity-90 transition-opacity" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-xl">
              <Camera className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight">EventFace</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm">
          <a href="#features" className="text-zinc-300 hover:text-amber-400 transition-colors font-medium">المزايا</a>
          <a href="#how" className="text-zinc-300 hover:text-amber-400 transition-colors font-medium">كيف يعمل</a>
          <a href="#pricing" className="text-zinc-300 hover:text-amber-400 transition-colors font-medium">الباقات</a>
          <a href="#faq" className="text-zinc-300 hover:text-amber-400 transition-colors font-medium">الأسئلة الشائعة</a>
        </div>

        <div className="flex gap-2 sm:gap-3 items-center">
          <Link href="/sign-in" className="hidden sm:inline-flex px-3 sm:px-4 py-2 text-sm text-zinc-200 hover:text-amber-400 transition-colors font-semibold">
            تسجيل الدخول
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-500/30"
          >
            ابدأ مجاناً
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero ─────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative z-10 pt-12 sm:pt-20 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-l from-amber-500/10 to-amber-500/5 border border-amber-400/30 rounded-full px-4 py-1.5 text-xs sm:text-sm text-amber-300 mb-6 sm:mb-8 backdrop-blur-sm">
          <div className="relative">
            <Sparkles className="w-3.5 h-3.5" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="w-3.5 h-3.5 opacity-50" />
            </div>
          </div>
          <span className="font-semibold">منصة احترافية للمصورين العرب</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-5 sm:mb-7">
          <span className="block">صور فعالياتك</span>
          <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-l from-amber-200 via-yellow-400 to-amber-500">
            تصل لضيوفك تلقائياً
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl md:text-2xl text-zinc-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-medium px-2">
          منصة سحابية تمكّن استوديوهات التصوير من إنشاء معارض ذكية لكل فعالية، والضيف يجد صوره <span className="text-amber-300 font-bold">بسيلفي واحدة</span> فقط.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-14">
          <Link
            href="/sign-up"
            className="group inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-4 sm:py-5 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 hover:from-amber-200 hover:via-yellow-400 hover:to-amber-600 text-black rounded-2xl text-base sm:text-lg font-black transition-all shadow-2xl shadow-amber-500/40 hover:scale-[1.03]"
          >
            ابدأ مجاناً — بدون بطاقة ائتمان
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={3} />
          </Link>
          <a
            href="#preview"
            className="inline-flex items-center justify-center gap-2 px-7 sm:px-9 py-4 sm:py-5 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-amber-400/50 text-white rounded-2xl text-base sm:text-lg font-bold transition-all backdrop-blur-sm"
          >
            شاهد العرض التوضيحي
          </a>
        </div>

        {/* Trust micro-stats */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-amber-400" strokeWidth={3} />
            <span>تجربة مجانية 14 يوم</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-zinc-700 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-amber-400" strokeWidth={3} />
            <span>دعم باللغة العربية</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-zinc-700 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-amber-400" strokeWidth={3} />
            <span>إلغاء في أي وقت</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Bar ─────────────────────────────────────── */
function TrustBar() {
  const stats = [
    { value: "+500K", label: "صورة مفهرسة" },
    { value: "+12K", label: "بحث بالوجه" },
    { value: "98%", label: "دقة التعرف" },
    { value: "+50", label: "استوديو" },
  ];
  return (
    <section className="relative z-10 py-10 sm:py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500 tracking-tight">
                {s.value}
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─────────────────────────────────────── */
function Features() {
  const features = [
    {
      icon: ScanFace,
      title: "بحث بالوجه بالذكاء الاصطناعي",
      desc: "الضيف يلتقط سيلفي، والنظام يجد له كل صوره خلال ثوانٍ — مدعوم بـ AWS Rekognition.",
      tag: "AI",
    },
    {
      icon: Globe,
      title: "دومين مخصص لكل عميل",
      desc: "اربط دومينك الخاص (photos.shareketak.com) — الضيف يرى هويتك أنت فقط، لا منصتنا.",
      tag: "White-label",
    },
    {
      icon: Cloud,
      title: "استيراد من Google Drive",
      desc: "ارفع آلاف الصور بنقرة واحدة من Drive، Dropbox، أو OneDrive مباشرة.",
      tag: "تكامل",
    },
    {
      icon: Lock,
      title: "حماية متقدمة",
      desc: "كلمات مرور للمعارض، صلاحيات الفريق، علامة مائية، وعزل تام لبيانات كل عميل.",
      tag: "أمان",
    },
    {
      icon: Smartphone,
      title: "تجربة مذهلة على الجوال",
      desc: "الضيف يفتح المعرض من الواتساب، يلتقط سيلفي، ويحمّل صوره — كل ذلك من الجوال.",
      tag: "موبايل",
    },
    {
      icon: TrendingUp,
      title: "تحليلات احترافية",
      desc: "اعرف عدد الزيارات، الأكثر بحثاً، ومعدل المشاركة — تقارير لحظية لكل فعالية.",
      tag: "تقارير",
    },
  ];

  return (
    <section id="features" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">المزايا</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            كل ما تحتاجه <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">في مكان واحد</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            صُممت EventFace خصيصاً للمصورين العرب — بأدوات احترافية وتجربة سلسة للضيوف.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-amber-400/40 rounded-3xl p-6 sm:p-7 transition-all hover:bg-white/[0.06]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/0 group-hover:bg-amber-400/10 rounded-full blur-3xl transition-all" />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-400 blur-lg opacity-0 group-hover:opacity-40 rounded-xl transition-opacity" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 rounded-xl flex items-center justify-center group-hover:from-amber-300 group-hover:to-amber-600 group-hover:border-amber-300 transition-all">
                      <f.icon className="w-6 h-6 text-amber-300 group-hover:text-black transition-colors" strokeWidth={2} />
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400/60 group-hover:text-amber-300 transition-colors">{f.tag}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Preview / Mock Browser ───────────────────────── */
function PreviewSection() {
  return (
    <section id="preview" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">عرض حي</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            هكذا يبدو <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">معرض الضيوف</span>
          </h2>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 blur-3xl" />

          {/* Mock browser */}
          <div className="relative bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-950 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-zinc-900 border border-white/5 rounded-lg px-3 py-1 text-xs text-zinc-400 font-mono text-center" dir="ltr">
                photos.studio-alnoor.com/ahmad-wedding
              </div>
            </div>

            {/* Browser content */}
            <div className="p-6 sm:p-10 bg-gradient-to-br from-white via-zinc-50 to-amber-50/30 text-zinc-900 min-h-[400px] sm:min-h-[500px]">
              <div className="max-w-2xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-3 py-1 text-xs font-bold text-amber-800 mb-4">
                  <Sparkles className="w-3 h-3" />
                  ✨ ١٢٤٧ صورة في انتظارك
                </div>
                <h3 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight text-zinc-900">حفل زواج أحمد ومريم</h3>
                <p className="text-zinc-600 mb-8">١٥ مايو ٢٠٢٦ — قاعة الديوان</p>

                <div className="space-y-3 max-w-xs mx-auto">
                  <button className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-black font-bold py-4 rounded-2xl text-base shadow-xl shadow-amber-500/30">
                    <Camera className="w-5 h-5" strokeWidth={2.5} />
                    التقط سيلفي وابحث عن صورك
                  </button>
                  <button className="w-full inline-flex items-center justify-center gap-3 bg-white border-2 border-zinc-200 text-zinc-800 font-semibold py-3.5 rounded-2xl text-sm">
                    <Search className="w-4 h-4" />
                    تصفّح المعرض كاملاً
                  </button>
                </div>

                {/* Mock thumbnails */}
                <div className="grid grid-cols-5 gap-2 mt-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-gradient-to-br from-amber-200 to-amber-100 border border-amber-300 flex items-center justify-center"
                    >
                      <ImageIcon className="w-5 h-5 text-amber-700" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: Upload,
      title: "أنشئ الفعالية وارفع الصور",
      desc: "بنقرات قليلة، أنشئ معرضاً للفعالية وارفع آلاف الصور من جهازك أو Google Drive.",
    },
    {
      num: "02",
      icon: ScanFace,
      title: "النظام يفهرس الوجوه تلقائياً",
      desc: "خوارزميات AWS Rekognition تحلل كل صورة وتفهرس الوجوه — جاهزة للبحث الفوري.",
    },
    {
      num: "03",
      icon: MessageSquare,
      title: "أرسل الرابط للضيوف",
      desc: "شارك رابط المعرض عبر الواتساب أو SMS — يفتحه الضيف من جواله مباشرة.",
    },
    {
      num: "04",
      icon: Heart,
      title: "الضيف يلتقط سيلفي ويستلم صوره",
      desc: "تجربة سحرية: سيلفي واحدة، ويحصل الضيف على جميع صوره فوراً ليحملها أو يشاركها.",
    },
  ];

  return (
    <section id="how" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">سهلة الاستخدام</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            كيف <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">يعمل النظام</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            من الإنشاء إلى التسليم — 4 خطوات بسيطة فقط.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-0 right-0 -translate-x-full">
                  <div className="h-px bg-gradient-to-l from-amber-400/40 to-transparent" />
                </div>
              )}

              <div className="relative bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-6 sm:p-7 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative w-12 h-12 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <s.icon className="w-6 h-6 text-black" strokeWidth={2.5} />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black text-amber-400/30">{s.num}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-2 text-white leading-tight">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Use Cases ──────────────────────────────────────── */
function UseCases() {
  const cases = [
    { icon: "💍", title: "حفلات الزواج", desc: "أكثر من ألف صورة لكل حفل، والضيوف يحصلون على صورهم خلال ثوانٍ." },
    { icon: "🎓", title: "حفلات التخرج", desc: "تنظيم احترافي لصور الخريجين مع البحث الفوري للأهالي." },
    { icon: "🏢", title: "مؤتمرات الشركات", desc: "تسليم صور الفعاليات للموظفين والشركاء بهوية شركتك." },
    { icon: "🎂", title: "أعياد الميلاد", desc: "ذكريات أبدية للأطفال والعائلة — منظمة وآمنة." },
    { icon: "📸", title: "فعاليات الشركات", desc: "كل موظف يجد صوره دون الحاجة لتصفح الآلاف." },
    { icon: "🎤", title: "الحفلات الخاصة", desc: "خصوصية كاملة بكلمات مرور — تليق بمناسباتك المميزة." },
  ];
  return (
    <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02] border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">مناسب لكل فعالية</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            تجربة مثالية <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">لكل مناسبة</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {cases.map((c) => (
            <div
              key={c.title}
              className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 hover:border-amber-400/30 rounded-2xl p-5 sm:p-6 transition-all"
            >
              <div className="text-3xl sm:text-4xl mb-3">{c.icon}</div>
              <h3 className="text-base sm:text-lg font-bold mb-1.5 text-white">{c.title}</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ──────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: "مبتدئ",
      price: "29",
      desc: "للمصورين المستقلين",
      features: ["10 فعاليات شهرياً", "500 صورة لكل فعالية", "بحث بالوجه أساسي", "دومين فرعي", "5 GB تخزين", "دعم بالإيميل"],
      highlight: false,
      cta: "ابدأ مجاناً",
    },
    {
      name: "احترافي",
      price: "79",
      desc: "للاستوديوهات الصغيرة والمتوسطة",
      features: ["50 فعالية شهرياً", "1500 صورة لكل فعالية", "بحث بالوجه عالي الدقة", "دومين مخصص", "واتساب وتيليجرام", "5 أعضاء فريق", "50 GB تخزين", "دعم أولوية"],
      highlight: true,
      cta: "الأكثر شيوعاً",
      badge: "موصى به",
    },
    {
      name: "وكالة",
      price: "199",
      desc: "للوكالات الكبرى",
      features: ["فعاليات غير محدودة", "صور غير محدودة", "White Label كامل", "أعضاء غير محدودين", "API Access", "تكامل مخصص", "تخزين خاص بك", "دعم متقدم 24/7"],
      highlight: false,
      cta: "تواصل معنا",
    },
  ];
  return (
    <section id="pricing" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">الأسعار</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            باقات <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">تناسب الجميع</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            ادفع شهرياً أو سنوياً — وفّر ١٥٪ عند الدفع السنوي.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-6 sm:p-8 transition-all ${
                p.highlight
                  ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 text-black shadow-2xl shadow-amber-500/40 lg:scale-105 lg:-mt-4"
                  : "bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-amber-400/30 text-white"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-amber-400 text-xs font-black px-4 py-1.5 rounded-full border border-amber-400/40 shadow-lg uppercase tracking-wider">
                  {p.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-2xl font-black mb-1 ${p.highlight ? "text-black" : "text-white"}`}>{p.name}</h3>
                <p className={`text-sm ${p.highlight ? "text-black/70" : "text-zinc-400"}`}>{p.desc}</p>
              </div>
              <div className="mb-6">
                <p className={`text-5xl sm:text-6xl font-black tracking-tight ${p.highlight ? "text-black" : "text-white"}`}>
                  ${p.price}
                  <span className={`text-sm font-normal ${p.highlight ? "text-black/70" : "text-zinc-500"}`}>/شهر</span>
                </p>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-8">
                {p.features.map((feat) => (
                  <li key={feat} className={`flex items-start gap-2.5 text-sm ${p.highlight ? "text-black/90" : "text-zinc-300"}`}>
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${p.highlight ? "bg-black/15" : "bg-amber-500/15"}`}>
                      <Check className={`w-3 h-3 ${p.highlight ? "text-black" : "text-amber-400"}`} strokeWidth={3} />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`block text-center py-3.5 rounded-2xl font-black transition-all ${
                  p.highlight
                    ? "bg-black text-amber-400 hover:bg-zinc-900 shadow-xl"
                    : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─────────────────────────────────── */
function Testimonials() {
  const tests = [
    {
      quote: "وفرنا أكثر من 80% من الوقت الذي كنا نقضيه في تنظيم وتسليم الصور. الضيوف يحبون التجربة!",
      name: "محمد العتيبي",
      role: "مؤسس استوديو النور",
      avatar: "م",
    },
    {
      quote: "البحث بالوجه دقيق بشكل مذهل — حتى مع صور قديمة. أصبح خدمة جوهرية لكل فعالياتنا.",
      name: "فاطمة الحربي",
      role: "مديرة استوديو لمسة",
      avatar: "ف",
    },
    {
      quote: "وأخيراً منصة بالعربي وبجودة عالمية. الدعم سريع جداً والمميزات لا تضاهى.",
      name: "خالد القحطاني",
      role: "Memory Lens Studios",
      avatar: "خ",
    },
  ];
  return (
    <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            استوديوهات <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">تعشق المنصة</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
          {tests.map((t, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-6 sm:p-7"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-zinc-200 mb-6 leading-relaxed text-sm sm:text-base">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-full flex items-center justify-center text-black font-black text-base">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-zinc-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    {
      q: "هل أحتاج خبرة تقنية لاستخدام المنصة؟",
      a: "لا، المنصة مصممة لتكون سهلة جداً. خلال 5 دقائق تنشئ حسابك وأول فعالية وترفع الصور.",
    },
    {
      q: "كم تستغرق فهرسة الوجوه؟",
      a: "الفهرسة تعمل في الخلفية بشكل آلي. عادةً 1000 صورة تكتمل خلال 5-10 دقائق.",
    },
    {
      q: "هل أستطيع استخدام دومين شركتي؟",
      a: "نعم، في باقة احترافي ووكالة. يمكنك ربط photos.shareketak.com والضيوف لن يروا اسم المنصة.",
    },
    {
      q: "ماذا عن خصوصية صور عملائي؟",
      a: "بياناتك معزولة تماماً عن باقي العملاء. التشفير at-rest، كلمات مرور للمعارض، وعلامات مائية اختيارية.",
    },
    {
      q: "هل يمكنني الإلغاء في أي وقت؟",
      a: "نعم بدون التزامات. تستطيع الترقية أو التخفيض أو الإلغاء من لوحة التحكم مباشرة.",
    },
    {
      q: "هل تدعمون اللغة العربية بالكامل؟",
      a: "نعم، المنصة كاملة بالعربية — من لوحة التحكم وحتى تجربة الضيف. الدعم متاح بالعربية أيضاً.",
    },
  ];

  return (
    <section id="faq" className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">الأسئلة الشائعة</p>
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            عندك <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 to-yellow-500">سؤال؟</span>
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 hover:border-amber-400/30 rounded-2xl transition-all overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 p-5 sm:p-6 cursor-pointer list-none">
                <h3 className="text-base sm:text-lg font-bold text-white">{f.q}</h3>
                <ChevronDown className="w-5 h-5 text-amber-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-zinc-300 leading-relaxed text-sm sm:text-base">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16 text-center overflow-hidden shadow-2xl shadow-amber-500/30">
          {/* Decorative shapes */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-black/10 border border-black/20 rounded-full px-3 py-1 text-xs font-bold text-black mb-5">
              <Award className="w-3.5 h-3.5" />
              ابدأ الآن — بدون مخاطرة
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-black mb-4 sm:mb-5 tracking-tight leading-tight">
              جاهز ترتقي بفعالياتك للقمة؟
            </h2>
            <p className="text-base sm:text-xl text-black/80 mb-7 sm:mb-9 max-w-2xl mx-auto leading-relaxed font-medium">
              انضم لمئات الاستوديوهات التي تستخدم EventFace لتقديم تجربة لا تُنسى لعملائها.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black hover:bg-zinc-900 text-amber-400 rounded-2xl text-base sm:text-lg font-black transition-all shadow-2xl hover:scale-[1.02]"
              >
                ابدأ مجاناً الآن
                <ArrowLeft className="w-5 h-5" strokeWidth={3} />
              </Link>
              <a
                href="mailto:hello@kashef.app"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/30 hover:bg-white/40 backdrop-blur border-2 border-black/20 text-black rounded-2xl text-base sm:text-lg font-bold transition-all"
              >
                تواصل مع المبيعات
              </a>
            </div>
            <p className="text-xs text-black/60 mt-6 font-medium">14 يوم تجربة مجانية · لا حاجة لبطاقة ائتمان · إلغاء فوري</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ───────────────────────────────────────── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-black/40 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold">EventFace</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              منصة معارض الفعاليات الذكية بالذكاء الاصطناعي — مصنوعة بحب من السعودية.
            </p>
          </div>

          <FooterCol title="المنتج" links={[
            ["المزايا", "#features"],
            ["كيف يعمل", "#how"],
            ["الباقات", "#pricing"],
            ["الأسئلة الشائعة", "#faq"],
          ]} />

          <FooterCol title="الشركة" links={[
            ["عن EventFace", "/about"],
            ["تواصل معنا", "mailto:hello@kashef.app"],
            ["المدونة", "/blog"],
            ["الوظائف", "/careers"],
          ]} />

          <FooterCol title="قانوني" links={[
            ["شروط الاستخدام", "/terms"],
            ["سياسة الخصوصية", "/privacy"],
            ["اتفاقية SaaS", "/sla"],
            ["GDPR", "/gdpr"],
          ]} />
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 EventFace. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1.5">
            <span>صُنع بـ</span>
            <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
            <span>في المملكة العربية السعودية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-bold text-white mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-zinc-400 hover:text-amber-400 text-sm transition-colors">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
