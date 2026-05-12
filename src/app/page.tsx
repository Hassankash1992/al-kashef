import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Camera, ArrowLeft, Check, Brain, Plus, Minus, Star, ScanFace, Globe, Cloud, Lock, MessageCircle, BarChart3, Sparkles } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#fafaf7] text-zinc-900 selection:bg-amber-200/50 overflow-x-hidden">
      <Nav />
      <Hero />
      <Logos />
      <Problem />
      <Story />
      <Showcase />
      <Features />
      <Pricing />
      <Voices />
      <FAQ />
      <Closing />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#fafaf7]/90 border-b border-zinc-900/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3 flex items-center justify-between" dir="rtl">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">EventFace</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs font-medium">
          <a href="#story" className="text-zinc-600 hover:text-zinc-900 transition-colors">كيف يعمل</a>
          <a href="#features" className="text-zinc-600 hover:text-zinc-900 transition-colors">المزايا</a>
          <a href="#pricing" className="text-zinc-600 hover:text-zinc-900 transition-colors">الأسعار</a>
          <a href="#faq" className="text-zinc-600 hover:text-zinc-900 transition-colors">الأسئلة</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="text-xs text-zinc-700 hover:text-zinc-900 transition-colors hidden sm:block px-3 py-1.5 font-medium">دخول</Link>
          <Link href="/sign-up" className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-3.5 py-2 rounded-full font-semibold inline-flex items-center gap-1.5">
            ابدأ مجاناً
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-10 sm:pt-14 pb-12 sm:pb-16 overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -right-32 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl drift-slow" />
        <div className="absolute bottom-0 -left-32 w-72 h-72 bg-stone-200/40 rounded-full blur-3xl drift-slow" style={{ animationDelay: "5s" }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <span className="inline-flex items-center gap-1.5 bg-amber-100/60 text-amber-800 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            المنصة الأولى في الخليج لمعارض الفعاليات
          </span>
        </div>

        <h1 className="mt-5 text-3xl sm:text-5xl md:text-6xl leading-[1.1] tracking-tight font-bold max-w-3xl fade-up" style={{ animationDelay: "0.2s" }}>
          بسيلفي <span className="text-amber-700">واحد</span>،
          <br className="hidden sm:inline" />
          {" "}يستخرج صورته من بين ١٠٬٠٠٠.
        </h1>

        <p className="mt-4 text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed fade-up" style={{ animationDelay: "0.4s" }}>
          وداعاً لساعات التنظيم اليدوي. مرحباً بمحرّك ذكاء اصطناعي يميّز كل وجه من بين الآلاف، في أقل من ثلاث ثوانٍ.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2 fade-up" style={{ animationDelay: "0.55s" }}>
          <Link href="/sign-up" className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-zinc-900/10 transition-all">
            جرّب الآن — ١٤ يوم مجاناً
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <a href="#story" className="inline-flex items-center gap-1.5 text-sm text-zinc-700 hover:text-zinc-900 px-4 py-2.5 transition-colors font-medium">
            شاهد كيف يعمل
            <span className="w-1 h-1 bg-amber-700 rounded-full" />
          </a>
        </div>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500 fade-up" style={{ animationDelay: "0.7s" }}>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-700" strokeWidth={3} /> بدون بطاقة ائتمان</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-700" strokeWidth={3} /> دعم عربي</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-700" strokeWidth={3} /> إلغاء فوري</span>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 border-t border-zinc-900/10 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl fade-in" style={{ animationDelay: "0.85s" }}>
          <Stat number="+500K" label="صورة مفهرسة" />
          <Stat number="98%" label="دقة التعرّف" />
          <Stat number="<3 ث" label="متوسط البحث" />
        </div>
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <p className="text-xl sm:text-2xl font-bold tracking-tight">{number}</p>
      <p className="text-[10px] text-zinc-500 mt-0.5 tracking-wider">{label}</p>
    </div>
  );
}

function Logos() {
  return (
    <section className="py-6 sm:py-8 border-y border-zinc-900/5 bg-stone-100/40" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <p className="text-center text-[10px] tracking-[0.3em] uppercase text-zinc-400 font-bold mb-3">يستخدمها استوديوهات في</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-zinc-500 font-bold">
          <span>الرياض</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>جدة</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>الدمام</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>الكويت</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>دبي</span>
          <span className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>الدوحة</span>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="py-14 sm:py-16" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-start">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold">المشكلة</span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
              ١٠٬٠٠٠ صورة في حفل واحد.
              <span className="block text-zinc-400 mt-1">ضيفك يبحث ساعات عن صورة واحدة.</span>
            </h2>
          </div>
          <div className="space-y-3 text-sm text-zinc-700 leading-relaxed md:pt-7">
            <p>
              Google Drive، WhatsApp، Telegram — كلها حلول مؤقتة. الضيف يضيع، المصوّر يُلاحق بالرسائل، والصور تنتهي في أرشيف لا يفتحه أحد.
            </p>
            <p className="text-zinc-500 text-xs">
              ٧٢٪ من ضيوف الحفلات لا يحصلون على صورهم خلال أسبوع.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Story() {
  const steps = [
    { num: "١", title: "أنشئ الفعالية بنقرتين", desc: "اسم، تاريخ، وارفع الصور — أو استوردها من Google Drive دفعة واحدة." },
    { num: "٢", title: "الذكاء الاصطناعي يشتغل", desc: "النظام يفهرس كل وجه في كل صورة. مدعوم بتقنيات AWS و Face++." },
    { num: "٣", title: "أرسل الرابط للضيوف", desc: "رابط واحد بهوية شركتك، يصل عبر WhatsApp أو SMS أو QR." },
    { num: "٤", title: "صوره. في ٣ ثوانٍ", desc: "الضيف يلتقط سيلفي، فيستخرج النظام كل صوره من بين الآلاف فوراً." },
  ];

  return (
    <section id="story" className="py-14 sm:py-20 bg-stone-100/60 border-y border-zinc-900/5" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="mb-10 max-w-xl">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">القصة</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            أربع خطوات. والمستحيل يصير ممكن.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {steps.map((s) => (
            <div key={s.num} className="bg-white border border-zinc-900/5 rounded-2xl p-5 sm:p-6 flex gap-4 hover:border-amber-400/40 transition-all">
              <div className="text-3xl sm:text-4xl text-amber-700/70 font-bold leading-none shrink-0">{s.num}</div>
              <div>
                <h3 className="text-base sm:text-lg font-bold mb-1 tracking-tight">{s.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase() {
  return (
    <section className="py-14 sm:py-20 bg-zinc-900 text-zinc-100 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto px-5 sm:px-6">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 order-2 md:order-1">
            <span className="text-[10px] tracking-[0.3em] uppercase text-amber-400 font-bold">من نظر الضيف</span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold leading-tight tracking-tight mb-4">
              سيلفي واحد. ذاكرة كاملة.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5 max-w-md">
              يفتح الرابط من جواله، يلتقط سيلفي، فيظهر له كل ما التُقط له من صور — جاهز للتنزيل والمشاركة. لا تطبيق، لا تسجيل.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-400" strokeWidth={3} /> بدون تطبيق</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-400" strokeWidth={3} /> بدون تسجيل</span>
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-400" strokeWidth={3} /> ثوانٍ فقط</span>
            </div>
          </div>

          <div className="md:col-span-6 order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-[240px]">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <div className="relative bg-stone-50 rounded-[2rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden float-slow">
                <div className="aspect-[9/19] p-4 flex flex-col" dir="rtl">
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 mb-3">
                    <span>9:41</span><span>•••</span>
                  </div>
                  <div className="text-center mb-4">
                    <div className="inline-flex w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mb-1.5">
                      <Camera className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-900">استوديو النور</p>
                  </div>
                  <h3 className="text-zinc-900 text-sm font-bold text-center mb-0.5">حفل أحمد ومريم</h3>
                  <p className="text-center text-[9px] text-zinc-500 mb-4">١٢ مايو ٢٠٢٦</p>
                  <button className="bg-zinc-900 text-amber-400 text-[10px] font-bold py-2.5 rounded-lg mb-2 flex items-center justify-center gap-1.5">
                    <Camera className="w-3 h-3" />
                    التقط سيلفي
                  </button>
                  <p className="text-center text-[9px] text-emerald-700 font-bold mt-3 mb-1.5">✓ ١٤ صورة لك</p>
                  <div className="grid grid-cols-3 gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gradient-to-br from-amber-200 via-stone-200 to-amber-100 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: ScanFace, tag: "AI", title: "محرّك التعرّف بالذكاء الاصطناعي", desc: "بنفس تقنية Snapchat وPinterest. يميّز الوجه من بين الآلاف بدقة ٩٨٪." },
    { icon: Globe, tag: "White-label", title: "هويتك أنت، لا هويتنا", desc: "دومينك، شعارك، ألوانك. الضيف يدخل عالم شركتك فقط." },
    { icon: Cloud, tag: "تكامل", title: "استيراد جماعي من السحابة", desc: "آلاف الصور من Google Drive أو Dropbox، بنقرة واحدة." },
    { icon: Lock, tag: "أمان", title: "حماية بمعايير المصارف", desc: "تشفير AES-256، نسخ احتياطي يومي، وعزل تام بين العملاء." },
    { icon: MessageCircle, tag: "WhatsApp", title: "أرسل الرابط بنقرة", desc: "رابط واحد لكل فعالية، يصل لكل ضيوفك في ثوانٍ." },
    { icon: BarChart3, tag: "تقارير", title: "نبض فعالياتك في الوقت الحقيقي", desc: "من فتح المعرض، الأكثر تنزيلاً، معدلات البحث — كل شيء." },
  ];
  return (
    <section id="features" className="py-14 sm:py-20" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="mb-10 max-w-xl">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">ما تحصل عليه</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            أدوات صنعها مصورون، لمصورين.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-zinc-900/5 rounded-2xl p-5 hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-amber-700" strokeWidth={2} />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{f.tag}</span>
              </div>
              <h3 className="text-base font-bold mb-1.5 tracking-tight">{f.title}</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "أساسي", price: "٩٩", desc: "للمصوّر المستقل",
      features: ["١٠ فعاليات/شهر", "٥٠٠ صورة/فعالية", "بحث بالوجه (٩٣٪)", "دومين فرعي", "٥ GB تخزين"],
      highlight: false },
    { name: "احترافي", price: "٢٩٩", desc: "للاستوديوهات",
      features: ["٥٠ فعالية/شهر", "١٥٠٠ صورة/فعالية", "بحث فائق (٩٨٪)", "دومين مخصص", "WhatsApp", "٥ أعضاء", "٥٠ GB تخزين"],
      highlight: true },
    { name: "وكالة", price: "٧٩٩", desc: "للوكالات الكبرى",
      features: ["فعاليات غير محدودة", "صور غير محدودة", "هوية بيضاء كاملة", "بحث فائق (٩٨٪)", "API مفتوح", "تخزين خاص"],
      highlight: false },
  ];
  return (
    <section id="pricing" className="py-14 sm:py-20 bg-stone-100/60 border-y border-zinc-900/5" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="text-center mb-10 max-w-md mx-auto">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">الأسعار</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            باقات شفّافة. بدون مفاجآت.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-6 transition-all ${
              p.highlight
                ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 lg:-mt-3"
                : "bg-white border border-zinc-900/5 hover:border-amber-400/30"
            }`}>
              {p.highlight && (
                <div className="absolute -top-2.5 right-1/2 translate-x-1/2 bg-amber-400 text-zinc-900 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest">موصى به</div>
              )}
              <p className={`text-[11px] uppercase tracking-widest font-bold mb-1 ${p.highlight ? "text-amber-400" : "text-amber-700"}`}>{p.name}</p>
              <p className={`text-xs mb-4 ${p.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{p.desc}</p>
              <p className={`font-bold tracking-tight mb-5 ${p.highlight ? "text-white" : "text-zinc-900"}`}>
                <span className="text-3xl sm:text-4xl">{p.price}</span>
                <span className={`text-xs font-bold mr-1 ${p.highlight ? "text-amber-400" : "text-amber-700"}`}>ر.س</span>
                <span className={`text-xs font-normal ${p.highlight ? "text-zinc-500" : "text-zinc-400"}`}> /شهر</span>
              </p>
              <ul className="space-y-2 mb-5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-xs ${p.highlight ? "text-zinc-300" : "text-zinc-700"}`}>
                    <Check className={`w-3 h-3 mt-0.5 shrink-0 ${p.highlight ? "text-amber-400" : "text-amber-700"}`} strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={`block text-center text-xs py-2.5 rounded-full font-bold transition-colors ${
                p.highlight ? "bg-amber-400 hover:bg-amber-300 text-zinc-900" : "bg-zinc-900 hover:bg-zinc-800 text-white"
              }`}>ابدأ {p.name}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Voices() {
  const quotes = [
    { author: "فاطمة الحربي", role: "استوديو لمسة", text: "وفّر علي ٨٠٪ من وقت التسليم. الضيوف صاروا يشكرونني بدل أن يلاحقوني برسائل." },
    { author: "خالد القحطاني", role: "Memory Lens", text: "في حفل لـ ٣٠٠ شخص، استلم كل ضيف صوره خلال ساعة. ما عشتها قبل." },
    { author: "محمد العتيبي", role: "استوديو النور", text: "أخيراً منصة عربية بمستوى عالمي. الدعم سريع، والتجربة تفوق التوقعات." },
  ];
  return (
    <section className="py-14 sm:py-20" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-6">
        <div className="mb-8 max-w-xl">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">أصوات من الميدان</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            ماذا يقول من جرّب.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
          {quotes.map((q) => (
            <figure key={q.author} className="bg-white border border-zinc-900/5 rounded-2xl p-5">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
              <blockquote className="text-sm text-zinc-800 leading-relaxed mb-4">&ldquo;{q.text}&rdquo;</blockquote>
              <figcaption className="flex items-center gap-2.5 pt-3 border-t border-zinc-900/5">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-xs">{q.author[0]}</div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">{q.author}</p>
                  <p className="text-[10px] text-zinc-500">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    { q: "كم يأخذ الإعداد؟", a: "خمس دقائق. لا تحتاج خبرة تقنية." },
    { q: "هل أحتاج خادم خاص؟", a: "لا. كل شيء في السحابة. ادفع وابدأ." },
    { q: "ماذا عن خصوصية العملاء؟", a: "كل عميل معزول تماماً. تشفير AES-256، وشهادات SOC 2." },
    { q: "هل أستطيع استخدام دومين شركتي؟", a: "نعم في باقة احترافي وأعلى. الضيف لا يرى اسم EventFace." },
    { q: "ماذا لو ألغيت؟", a: "تحتفظ ببياناتك ٣٠ يوماً. نصدّر لك كل الصور قبل الحذف." },
    { q: "هل يدعم اللهجة الخليجية؟", a: "المنصة بالعربية الفصحى، والتعليمات بصياغة خليجية مبسّطة." },
  ];

  return (
    <section id="faq" className="py-14 sm:py-20 bg-stone-100/60 border-y border-zinc-900/5" dir="rtl">
      <div className="max-w-3xl mx-auto px-5 sm:px-6">
        <div className="mb-8 max-w-xl">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">قبل ما تسأل</span>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            أسئلة شائعة.
          </h2>
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <details key={i} className="group bg-white rounded-xl border border-zinc-900/5 hover:border-amber-400/30 overflow-hidden transition-colors">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <h3 className="font-bold text-zinc-900 text-sm">{it.q}</h3>
                <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center shrink-0 group-open:bg-amber-100 transition-colors">
                  <Plus className="w-3 h-3 text-zinc-700 group-open:hidden" />
                  <Minus className="w-3 h-3 text-amber-800 hidden group-open:block" />
                </div>
              </summary>
              <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl drift-slow" />
      </div>
      <div className="relative max-w-2xl mx-auto px-5 sm:px-6 text-center">
        <span className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold">حان وقت التحوّل</span>
        <h2 className="mt-3 text-3xl sm:text-5xl font-bold leading-tight tracking-tight mb-4">
          فعالية واحدة، وستفهم لماذا الكل تحوّل إلينا.
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 mb-7 max-w-md mx-auto leading-relaxed">
          ١٤ يوم تجربة مجانية كاملة. بدون بطاقة ائتمان. ألغِ في أي لحظة.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/sign-up" className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-6 py-3 rounded-full transition-all">
            ابدأ مجاناً
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <a href="mailto:hello@kashef.app" className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 px-5 py-3 font-semibold transition-colors">
            تحدّث مع المبيعات
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900/10 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
                <Camera className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold">EventFace</span>
            </Link>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              منصة معارض الفعاليات الذكية. صُنعت بحنكة في السعودية.
            </p>
          </div>
          <FCol title="المنتج" links={[["المزايا", "#features"], ["كيف يعمل", "#story"], ["الأسعار", "#pricing"]]} />
          <FCol title="الشركة" links={[["تواصل", "mailto:hello@kashef.app"], ["المدونة", "/blog"]]} />
          <FCol title="قانوني" links={[["الشروط", "/terms"], ["الخصوصية", "/privacy"], ["GDPR", "/gdpr"]]} />
        </div>
        <div className="pt-5 border-t border-zinc-900/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-500">
          <p>© ٢٠٢٦ EventFace. كل الحقوق محفوظة.</p>
          <p className="flex items-center gap-1">صُنع بـ <Brain className="w-3 h-3 text-amber-600" /> في السعودية</p>
        </div>
      </div>
    </footer>
  );
}

function FCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold mb-2 tracking-widest uppercase">{title}</h4>
      <ul className="space-y-1.5">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-[11px] text-zinc-600 hover:text-amber-700 transition-colors">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
