import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Camera, ArrowLeft, Check, Heart, Plus, Minus, Star } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#fafaf7] text-zinc-900 selection:bg-amber-200/50 overflow-x-hidden">
      <Nav />
      <Hero />
      <Quote />
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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#fafaf7]/80 border-b border-zinc-900/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between" dir="rtl">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center">
            <Camera className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">EventFace</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs">
          <a href="#story" className="text-zinc-600 hover:text-zinc-900 transition-colors">القصة</a>
          <a href="#features" className="text-zinc-600 hover:text-zinc-900 transition-colors">المزايا</a>
          <a href="#pricing" className="text-zinc-600 hover:text-zinc-900 transition-colors">الباقات</a>
          <a href="#faq" className="text-zinc-600 hover:text-zinc-900 transition-colors">الأسئلة</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-xs text-zinc-700 hover:text-zinc-900 transition-colors hidden sm:block">دخول</Link>
          <Link href="/sign-up" className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full font-semibold transition-all inline-flex items-center gap-1.5">
            ابدأ
            <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-28 overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl drift-slow" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-stone-200/40 rounded-full blur-3xl drift-slow" style={{ animationDelay: "5s" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-6 sm:mb-8">منصة احترافية للمصورين العرب</p>
        </div>

        <h1 className="text-[2.5rem] sm:text-6xl md:text-7xl leading-[1.05] tracking-tight font-bold max-w-4xl fade-up" style={{ animationDelay: "0.2s" }}>
          الضيوف يلتقطون
          <br />
          <span className="font-serif italic font-normal text-amber-700">سيلفي واحدة</span>
          <span className="text-zinc-400 mx-2">.</span>
          <br />
          ويستلمون كل صورهم.
        </h1>

        <p className="mt-6 sm:mt-8 text-base sm:text-lg text-zinc-600 max-w-xl leading-relaxed fade-up" style={{ animationDelay: "0.4s" }}>
          منصة للاستوديوهات والمصورين، تختصر ساعات التنظيم اليدوي إلى ثوانٍ للضيف. مدعومة بالذكاء الاصطناعي للتعرّف على الوجوه.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 fade-up" style={{ animationDelay: "0.55s" }}>
          <Link href="/sign-up" className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold px-6 py-3 rounded-full shadow-lg shadow-zinc-900/10 transition-all hover:shadow-zinc-900/30">
            جرّب مجاناً
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <a href="#story" className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 px-5 py-3 transition-colors font-medium">
            شاهد كيف يعمل
            <span className="w-1 h-1 bg-amber-700 rounded-full" />
          </a>
        </div>

        <div className="mt-16 sm:mt-24 pt-8 border-t border-zinc-900/10 grid grid-cols-3 gap-6 sm:gap-10 max-w-2xl fade-in" style={{ animationDelay: "0.8s" }}>
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
      <p className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{number}</p>
      <p className="text-[11px] text-zinc-500 mt-1 tracking-wider">{label}</p>
    </div>
  );
}

function Quote() {
  return (
    <section className="py-12 sm:py-20" dir="rtl">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-amber-700 text-3xl font-serif mb-2">&ldquo;</p>
        <p className="font-serif italic text-xl sm:text-3xl leading-relaxed text-zinc-800 tracking-tight">
          في حفل لـ ٤٠٠ ضيف، توزيع الصور كان يأخذ أسبوعاً. الآن يستلم الضيف صوره خلال ٣ ثوانٍ.
        </p>
        <p className="mt-6 text-xs text-zinc-500 tracking-wider">— محمد العتيبي، استوديو النور</p>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="py-16 sm:py-24 bg-stone-100/60 border-y border-zinc-900/5" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7">
            <p className="text-[10px] tracking-[0.3em] uppercase text-zinc-500 font-bold mb-4">المشكلة</p>
            <h2 className="text-3xl sm:text-5xl font-serif leading-[1.15] tracking-tight">
              ٢٠٠٠ صورة من حفل واحد.
              <br />
              <span className="text-zinc-400">ضيفك يبحث ساعة عن صورة وحدة.</span>
            </h2>
          </div>
          <div className="md:col-span-5 md:pt-3 space-y-5 text-sm text-zinc-700 leading-relaxed">
            <p>
              الـ Google Drive، الـ WhatsApp، الـ Telegram — كل هذه حلول مكسورة. الضيف يضيع، المصور يتعب، والصور تنتهي بدون ما حد يستفيد منها.
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
    { num: "١", title: "أنشئ الفعالية", desc: "بنقرتين، أنشئ معرضاً خاصاً بكل فعالية واسحب آلاف الصور أو استوردها من Google Drive مباشرة." },
    { num: "٢", title: "النظام يفهرس الوجوه", desc: "خلال دقائق، يحلّل النظام كل صورة ويفهرس الوجوه باستخدام تقنية AWS Rekognition." },
    { num: "٣", title: "أرسل الرابط", desc: "شارك رابطاً واحداً عبر WhatsApp أو SMS. كل ضيف يفتحه ويلتقط سيلفي." },
    { num: "٤", title: "صور كل ضيف، في ثوانٍ", desc: "النظام يطابق الوجه فوراً ويعرض كل صور الضيف. ينزّلها أو يشاركها بنقرة." },
  ];

  return (
    <section id="story" className="py-20 sm:py-28" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="mb-12 sm:mb-20 max-w-2xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-4">القصة</p>
          <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight">
            أربع خطوات. لا تحتاج خبرة.
          </h2>
        </div>

        <div className="space-y-12 sm:space-y-20">
          {steps.map((s, i) => (
            <div key={s.num} className="grid grid-cols-12 gap-4 sm:gap-8 items-start">
              <div className="col-span-2 sm:col-span-3">
                <p className="editorial-num text-5xl sm:text-7xl text-amber-700/80 leading-none">{s.num}</p>
              </div>
              <div className="col-span-10 sm:col-span-9 pt-2 sm:pt-4">
                <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="mt-8 sm:mt-12 w-full h-px bg-gradient-to-l from-transparent via-zinc-200 to-transparent" />
                )}
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
    <section className="py-20 sm:py-28 bg-zinc-900 text-zinc-100 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5 order-2 md:order-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-amber-400 font-bold mb-4">من نظر الضيف</p>
            <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight mb-6">
              صورة واحدة.
              <br />
              <span className="italic text-amber-400/90">صوره كلها.</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-8">
              الضيف يفتح الرابط من جواله، يلتقط سيلفي، وفي ثوانٍ يشاهد كل صور حضوره. بدون تطبيق، بدون تسجيل.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-400" /> بدون تطبيق</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-400" /> بدون تسجيل</span>
              <span className="flex items-center gap-1.5"><Check className="w-3 h-3 text-amber-400" /> ثوانٍ فقط</span>
            </div>
          </div>

          <div className="md:col-span-7 order-1 md:order-2 flex justify-center">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <div className="relative bg-stone-50 rounded-[2.5rem] border-[10px] border-zinc-800 shadow-2xl overflow-hidden float-slow">
                <div className="aspect-[9/19] p-5 flex flex-col" dir="rtl">
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4">
                    <span>9:41</span>
                    <span>•••</span>
                  </div>
                  <div className="text-center mb-6">
                    <div className="inline-flex w-10 h-10 bg-amber-100 rounded-lg items-center justify-center mb-2">
                      <Camera className="w-5 h-5 text-amber-700" />
                    </div>
                    <p className="text-xs font-bold text-zinc-900">استوديو النور</p>
                  </div>
                  <h3 className="text-zinc-900 text-lg font-serif font-bold text-center mb-1">حفل أحمد ومريم</h3>
                  <p className="text-center text-[10px] text-zinc-500 mb-6">١٢ مايو ٢٠٢٦</p>
                  <button className="bg-zinc-900 text-amber-400 text-xs font-bold py-3 rounded-xl mb-2 flex items-center justify-center gap-2">
                    <Camera className="w-3.5 h-3.5" />
                    التقط سيلفي
                  </button>
                  <p className="text-center text-[10px] text-emerald-700 font-bold mt-4 mb-2">✓ ١٤ صورة لك</p>
                  <div className="grid grid-cols-3 gap-1 mt-1">
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
  return (
    <section id="features" className="py-20 sm:py-28" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="mb-12 sm:mb-16 max-w-xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-4">ما تحصل عليه</p>
          <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight">
            أدوات صنعها مصورون <span className="italic">لمصورين</span>.
          </h2>
        </div>

        <div className="grid md:grid-cols-6 gap-4 sm:gap-5">
          <FCard title="بحث بالوجه" tag="AI" subtitle="دقة 98%" big colspan="md:col-span-4">
            مدعوم بـ AWS Rekognition. تقنية بنفس جودة Snapchat وPinterest، في خدمة استوديوك.
          </FCard>
          <FCard title="هوية بيضاء" tag="White-label" colspan="md:col-span-2">
            دومينك المخصص. شعارك. ألوانك. الضيف لا يرى منصتنا.
          </FCard>
          <FCard title="استيراد من السحابة" tag="تكامل" colspan="md:col-span-2">
            ربط Google Drive، Dropbox، أو OneDrive في نقرتين.
          </FCard>
          <FCard title="حماية على مستوى المؤسسات" tag="أمان" colspan="md:col-span-4">
            تشفير AES-256، عزل بيانات تام بين العملاء، نسخ احتياطي يومي، علامات مائية اختيارية.
          </FCard>
          <FCard title="مشاركة فورية" tag="WhatsApp" colspan="md:col-span-3">
            رابط واحد لكل فعالية. أرسله مرة، الضيوف يصلونه دائماً.
          </FCard>
          <FCard title="إحصائيات لحظية" tag="تقارير" colspan="md:col-span-3">
            من فتح المعرض. كم بحثوا. الأكثر تنزيلاً. كل شيء في مكان واحد.
          </FCard>
        </div>
      </div>
    </section>
  );
}

function FCard({ title, tag, subtitle, children, big, colspan }: {
  title: string; tag: string; subtitle?: string; children: React.ReactNode; big?: boolean; colspan: string;
}) {
  return (
    <div className={`group relative ${colspan} bg-white border border-zinc-900/5 rounded-2xl p-6 sm:p-8 hover:border-amber-400/40 transition-all hover:shadow-xl hover:shadow-amber-500/5`}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">{tag}</span>
        {subtitle && <span className="text-[10px] text-zinc-400">{subtitle}</span>}
      </div>
      <h3 className={`font-serif font-bold mb-3 tracking-tight ${big ? "text-2xl sm:text-3xl" : "text-xl"}`}>{title}</h3>
      <p className="text-sm text-zinc-600 leading-relaxed">{children}</p>
    </div>
  );
}

function Pricing() {
  const plans = [
    {
      name: "أساسي",
      price: "29",
      desc: "للمصورين المستقلين",
      features: ["١٠ فعاليات/شهر", "٥٠٠ صورة/فعالية", "بحث وجه (٩٣٪)", "دومين فرعي", "٥ GB تخزين"],
      highlight: false,
    },
    {
      name: "احترافي",
      price: "79",
      desc: "للاستوديوهات",
      features: ["٥٠ فعالية/شهر", "١٥٠٠ صورة/فعالية", "بحث وجه فائق (٩٨٪)", "دومين مخصص", "WhatsApp", "٥ أعضاء", "٥٠ GB تخزين"],
      highlight: true,
    },
    {
      name: "وكالة",
      price: "199",
      desc: "للوكالات الكبرى",
      features: ["فعاليات غير محدودة", "صور غير محدودة", "White Label كامل", "بحث فائق (٩٨٪)", "API", "تخزين خاص", "أعضاء غير محدودين"],
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-stone-100/60" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12 sm:mb-16 max-w-xl mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-4">الأسعار</p>
          <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight mb-4">
            باقات شفّافة.
            <br />
            <span className="italic text-zinc-400">بدون مفاجآت.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl p-7 sm:p-8 transition-all ${
              p.highlight
                ? "bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20 lg:-mt-4"
                : "bg-white border border-zinc-900/5 hover:border-amber-400/30"
            }`}>
              {p.highlight && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-amber-400 text-zinc-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">موصى به</div>
              )}
              <p className={`text-xs uppercase tracking-widest font-bold mb-2 ${p.highlight ? "text-amber-400" : "text-amber-700"}`}>{p.name}</p>
              <p className={`text-sm mb-5 ${p.highlight ? "text-zinc-400" : "text-zinc-500"}`}>{p.desc}</p>
              <p className={`font-serif font-bold tracking-tight mb-6 ${p.highlight ? "text-white" : "text-zinc-900"}`}>
                <span className="text-4xl sm:text-5xl">${p.price}</span>
                <span className={`text-sm font-normal ${p.highlight ? "text-zinc-500" : "text-zinc-400"}`}>/شهر</span>
              </p>
              <ul className="space-y-2.5 mb-7">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-zinc-300" : "text-zinc-700"}`}>
                    <Check className={`w-3.5 h-3.5 mt-1 shrink-0 ${p.highlight ? "text-amber-400" : "text-amber-700"}`} strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" className={`block text-center text-sm py-3 rounded-full font-bold transition-colors ${
                p.highlight
                  ? "bg-amber-400 hover:bg-amber-300 text-zinc-900"
                  : "bg-zinc-900 hover:bg-zinc-800 text-white"
              }`}>
                ابدأ {p.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Voices() {
  return (
    <section className="py-20 sm:py-28" dir="rtl">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="mb-12 max-w-xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-4">أصوات من الميدان</p>
          <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight">
            ماذا يقول من <span className="italic">جرّب</span>.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Quote2 author="فاطمة الحربي" role="استوديو لمسة" stars={5}>
            وفّر علي ٨٠٪ من وقت التسليم. الضيوف صاروا يشكرونني بدل ما يلاحقوني.
          </Quote2>
          <Quote2 author="خالد القحطاني" role="Memory Lens" stars={5}>
            الدقة مذهلة. حتى في صور قديمة وزوايا غريبة، يلقى الصور.
          </Quote2>
          <Quote2 author="محمد العتيبي" role="استوديو النور" stars={5}>
            الدعم سريع جداً والمنصة بالعربي بشكل صحيح. أخيراً منتج عربي بمستوى عالمي.
          </Quote2>
        </div>
      </div>
    </section>
  );
}

function Quote2({ author, role, stars, children }: { author: string; role: string; stars: number; children: React.ReactNode }) {
  return (
    <figure className="bg-white border border-zinc-900/5 rounded-2xl p-7">
      <div className="flex gap-0.5 mb-5">
        {[...Array(stars)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
      </div>
      <blockquote className="text-zinc-800 font-serif text-base leading-relaxed mb-6">&ldquo;{children}&rdquo;</blockquote>
      <figcaption className="flex items-center gap-3 pt-4 border-t border-zinc-900/5">
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold text-xs">
          {author[0]}
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-900">{author}</p>
          <p className="text-[10px] text-zinc-500">{role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

function FAQ() {
  const items = [
    { q: "كم يأخذ الإعداد؟", a: "خمس دقائق. ما تحتاج خبرة تقنية." },
    { q: "هل أحتاج خادم خاص؟", a: "لا. كل شيء في السحابة. ادفع وابدأ." },
    { q: "ماذا عن خصوصية العملاء؟", a: "كل عميل معزول تماماً. تشفير AES-256 على البيانات. شهادات SOC 2." },
    { q: "هل أستطيع استخدام دومين شركتي؟", a: "نعم في باقة احترافي وأعلى. الضيف لا يرى اسم EventFace." },
    { q: "ماذا لو ألغيت؟", a: "تحتفظ ببياناتك ٣٠ يوماً. نصدّر لك كل الصور قبل الحذف." },
    { q: "هل يدعم لهجاتنا؟", a: "كل المنصة بالعربية الفصحى والتعليمات بصياغة خليجية." },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 bg-stone-100/60" dir="rtl">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="mb-12 sm:mb-16 max-w-xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-4">قبل ما تسأل</p>
          <h2 className="text-3xl sm:text-5xl font-serif leading-[1.1] tracking-tight">
            أسئلة <span className="italic">شائعة</span>.
          </h2>
        </div>

        <div className="space-y-2">
          {items.map((it, i) => (
            <details key={i} className="group bg-white rounded-2xl border border-zinc-900/5 hover:border-amber-400/30 overflow-hidden transition-colors">
              <summary className="flex items-center justify-between p-5 sm:p-6 cursor-pointer list-none">
                <h3 className="font-bold text-zinc-900 text-sm sm:text-base">{it.q}</h3>
                <div className="w-7 h-7 bg-stone-100 rounded-full flex items-center justify-center shrink-0 group-open:bg-amber-100 transition-colors">
                  <Plus className="w-3.5 h-3.5 text-zinc-700 group-open:hidden" />
                  <Minus className="w-3.5 h-3.5 text-amber-800 hidden group-open:block" />
                </div>
              </summary>
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-zinc-600 leading-relaxed">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-200/40 rounded-full blur-3xl drift-slow" />
      </div>
      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-amber-700 font-bold mb-6">ابدأ اليوم</p>
        <h2 className="text-4xl sm:text-7xl font-serif leading-[1.05] tracking-tight mb-6">
          فعالية واحدة.
          <br />
          <span className="italic text-amber-700">ستفهم لماذا.</span>
        </h2>
        <p className="text-base sm:text-lg text-zinc-600 mb-10 max-w-xl mx-auto leading-relaxed">
          ١٤ يوم تجربة مجانية. بدون بطاقة ائتمان. إلغاء فوري.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/sign-up" className="group inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold px-7 py-3.5 rounded-full transition-all">
            ابدأ مجاناً
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <a href="mailto:hello@kashef.app" className="inline-flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 px-6 py-3.5 font-semibold transition-colors">
            تحدّث مع المبيعات
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900/10 py-10 sm:py-12" dir="rtl">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center">
                <Camera className="w-3 h-3 text-amber-400" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold">EventFace</span>
            </Link>
            <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs">
              منصة معارض الفعاليات الذكية. صُنعت بحب في المملكة العربية السعودية.
            </p>
          </div>
          <FCol title="المنتج" links={[["المزايا", "#features"], ["كيف يعمل", "#story"], ["الأسعار", "#pricing"], ["الأسئلة", "#faq"]]} />
          <FCol title="الشركة" links={[["عن EventFace", "/about"], ["تواصل", "mailto:hello@kashef.app"], ["المدونة", "/blog"]]} />
          <FCol title="قانوني" links={[["الشروط", "/terms"], ["الخصوصية", "/privacy"], ["GDPR", "/gdpr"]]} />
        </div>
        <div className="pt-6 border-t border-zinc-900/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© ٢٠٢٦ EventFace. كل الحقوق محفوظة.</p>
          <p className="flex items-center gap-1.5">
            صُنع بـ <Heart className="w-3 h-3 fill-amber-500 text-amber-500" /> في السعودية
          </p>
        </div>
      </div>
    </footer>
  );
}

function FCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-bold mb-3 tracking-wider uppercase">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-xs text-zinc-600 hover:text-amber-700 transition-colors">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
