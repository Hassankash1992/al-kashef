import { db } from "@/lib/db";
import NotificationsManager from "@/components/admin/NotificationsManager";
import { Bell } from "lucide-react";

// قوالب افتراضية إذا لم تكن موجودة في الـ DB
const DEFAULT_TEMPLATES = [
  {
    key: "welcome_user",
    title: "ترحيب بالمستخدم الجديد",
    description: "يُرسل عند تسجيل المستخدم لأول مرة",
    channels: { email: true, whatsapp: false, sms: false, inApp: true },
    emailSubject: "مرحباً بك في {{siteName}}، {{userName}} 🎉",
    emailBody: "أهلاً {{userName}}،\n\nسعداء بانضمامك إلى {{siteName}}. ابدأ بإنشاء حسابك للشركة وأول فعالية لك.\n\nلأي استفسار، فريقنا في خدمتك.",
    whatsappBody: "مرحباً {{userName}}! انضممت لـ {{siteName}}. ابدأ من: {{appUrl}}",
    inAppTitle: "أهلاً وسهلاً 👋",
    inAppBody: "ابدأ بإنشاء أول فعالية لك",
    variables: ["userName", "siteName", "appUrl"],
  },
  {
    key: "tenant_created",
    title: "إنشاء حساب الشركة",
    description: "يُرسل عند إكمال onboarding",
    channels: { email: true, whatsapp: true, sms: false, inApp: true },
    emailSubject: "تم إنشاء حسابك: {{tenantName}}",
    emailBody: "تهانينا {{userName}}!\n\nتم إنشاء حساب شركتك بنجاح. رابطك: {{tenantUrl}}\n\nابدأ بإنشاء أول فعالية الآن.",
    whatsappBody: "🎉 تم إنشاء حساب {{tenantName}} بنجاح",
    variables: ["userName", "tenantName", "tenantUrl"],
  },
  {
    key: "subscription_created",
    title: "تأكيد الاشتراك",
    description: "يُرسل عند بدء الاشتراك",
    channels: { email: true, whatsapp: true, sms: false, inApp: true },
    emailSubject: "تم تفعيل اشتراك {{planName}}",
    emailBody: "اشتراكك في باقة {{planName}} نشط الآن.\nالمبلغ: {{amount}} {{currency}}/{{cycle}}\nالتجديد: {{renewalDate}}",
    whatsappBody: "✅ اشتراك {{planName}} نشط — التجديد {{renewalDate}}",
    variables: ["planName", "amount", "currency", "cycle", "renewalDate"],
  },
  {
    key: "subscription_expiring_soon",
    title: "تنبيه اقتراب انتهاء الاشتراك",
    description: "يُرسل قبل X أيام من انتهاء الاشتراك",
    channels: { email: true, whatsapp: true, sms: false, inApp: true },
    emailSubject: "اشتراكك ينتهي خلال {{daysLeft}} أيام",
    emailBody: "تنبيه: اشتراك {{tenantName}} ينتهي بتاريخ {{expiryDate}}.\n\nجدّد الآن لتجنب أي انقطاع في الخدمة.",
    whatsappBody: "⏰ {{daysLeft}} أيام متبقية على انتهاء اشتراكك",
    variables: ["tenantName", "daysLeft", "expiryDate"],
  },
  {
    key: "subscription_expired",
    title: "انتهاء الاشتراك",
    description: "يُرسل عند انتهاء الاشتراك",
    channels: { email: true, whatsapp: true, sms: false, inApp: true },
    emailSubject: "انتهى اشتراكك في {{planName}}",
    emailBody: "اشتراك {{tenantName}} انتهى. يمكنك التجديد من لوحة التحكم.",
    variables: ["tenantName", "planName"],
  },
  {
    key: "payment_failed",
    title: "فشل عملية الدفع",
    description: "يُرسل عند فشل تجديد الاشتراك",
    channels: { email: true, whatsapp: true, sms: true, inApp: true },
    emailSubject: "⚠️ فشل في عملية الدفع",
    emailBody: "لم نتمكن من تحصيل مبلغ الاشتراك من بطاقتك. يرجى تحديث بيانات الدفع.",
    whatsappBody: "⚠️ فشل دفع اشتراك {{tenantName}}",
    variables: ["tenantName"],
  },
  {
    key: "team_invite",
    title: "دعوة عضو فريق",
    description: "يُرسل عند دعوة عضو جديد للفريق",
    channels: { email: true, whatsapp: false, sms: false, inApp: false },
    emailSubject: "دعوة للانضمام إلى فريق {{tenantName}}",
    emailBody: "{{inviterName}} دعاك للانضمام إلى فريق {{tenantName}} على {{siteName}}.\n\nاقبل الدعوة: {{inviteLink}}",
    variables: ["inviterName", "tenantName", "siteName", "inviteLink"],
  },
  {
    key: "first_event_created",
    title: "تهنئة بأول فعالية",
    description: "يُرسل عند إنشاء أول فعالية",
    channels: { email: true, whatsapp: false, sms: false, inApp: true },
    emailSubject: "🎊 أول فعالية لك جاهزة",
    emailBody: "تم إنشاء فعالية '{{eventName}}'. ابدأ برفع الصور!",
    variables: ["eventName"],
  },
  {
    key: "support_message_admin",
    title: "رسالة دعم جديدة (للأدمن)",
    description: "يُرسل للأدمن عند فتح تذكرة دعم جديدة",
    channels: { email: true, whatsapp: false, sms: false, inApp: true },
    emailSubject: "تذكرة دعم جديدة: {{subject}}",
    emailBody: "العميل: {{tenantName}}\nالأولوية: {{priority}}\n\n{{body}}",
    variables: ["subject", "tenantName", "priority", "body"],
  },
  {
    key: "support_message_client",
    title: "رد على تذكرة الدعم (للعميل)",
    description: "يُرسل للعميل عند رد الدعم",
    channels: { email: true, whatsapp: true, sms: false, inApp: true },
    emailSubject: "رد جديد على تذكرتك: {{subject}}",
    emailBody: "{{adminName}} رد على تذكرتك:\n\n{{body}}\n\nافتح المحادثة: {{ticketLink}}",
    whatsappBody: "💬 رد جديد على تذكرتك: {{subject}}",
    variables: ["subject", "adminName", "body", "ticketLink"],
  },
];

export default async function NotificationsPage() {
  const existing = await db.notificationTemplate.findMany();
  const existingKeys = new Set(existing.map((t) => t.key));

  // Merge defaults that don't exist yet (without saving — admin sees them as "unsaved")
  const merged = [
    ...existing,
    ...DEFAULT_TEMPLATES.filter((t) => !existingKeys.has(t.key)).map((t) => ({
      ...t,
      id: `default-${t.key}`,
      enabled: true,
      isDefault: true,
    })),
  ];

  const schedules = await db.notificationSchedule.findMany({
    include: { template: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-600" />
          قوالب التنبيهات والجدولة
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          عدّل محتوى الإيميلات و WhatsApp و SMS، وحدد متى يُرسل كل قالب.
        </p>
      </div>

      <NotificationsManager
        templates={merged as any}
        schedules={schedules.map((s) => ({
          id: s.id,
          templateId: s.templateId,
          templateKey: s.template.key,
          templateTitle: s.template.title,
          trigger: s.trigger,
          triggerData: s.triggerData,
          enabled: s.enabled,
          lastRunAt: s.lastRunAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
