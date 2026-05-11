"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntegrationCard from "./IntegrationCard";
import AWSS3Form from "./AWSS3Form";
import CloudflareR2Form from "./CloudflareR2Form";
import { HardDrive, Cloud, FolderTree, Package, MessageCircle, Send, Mail } from "lucide-react";

interface Props {
  googleDrive: { connected: boolean; email: string | null };
  awsS3: { connected: boolean };
  cloudflareR2: { connected: boolean };
  defaultStorage: string;
}

export default function IntegrationsHub({ googleDrive, awsS3, cloudflareR2, defaultStorage }: Props) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [expandedS3, setExpandedS3] = useState(!awsS3.connected);
  const [expandedR2, setExpandedR2] = useState(!cloudflareR2.connected && !awsS3.connected);

  async function disconnect(type: string) {
    setDisconnecting(type);
    try {
      await fetch(`/api/integrations/${type.toLowerCase().replace("_", "-")}/disconnect`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDisconnecting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Sources */}
      <Section title="مصادر الصور">
        <IntegrationCard
          title="Google Drive"
          description="استيراد صور الفعاليات من مجلداتك في Google Drive"
          icon={<FolderTree className="w-5 h-5 text-amber-700" />}
          connected={googleDrive.connected}
          email={googleDrive.email}
          connectHref="/api/integrations/google-drive/auth"
          onDisconnect={() => disconnect("google-drive")}
          disconnecting={disconnecting === "google-drive"}
        >
          {googleDrive.connected && (
            <p className="text-xs text-zinc-700 font-medium">
              ✓ يمكنك الآن استيراد الصور من Google Drive عند إنشاء الفعاليات
            </p>
          )}
        </IntegrationCard>

        <IntegrationCard
          title="Dropbox"
          description="استيراد الصور من مجلداتك في Dropbox"
          icon={<Package className="w-5 h-5 text-blue-600" />}
          connected={false}
          connectHref="/api/integrations/dropbox/auth"
          comingSoon={!process.env.NEXT_PUBLIC_DROPBOX_ENABLED}
        />

        <IntegrationCard
          title="Microsoft OneDrive"
          description="استيراد الصور من OneDrive الشخصي أو المؤسسي"
          icon={<Cloud className="w-5 h-5 text-blue-500" />}
          connected={false}
          connectHref="/api/integrations/onedrive/auth"
          comingSoon={!process.env.NEXT_PUBLIC_ONEDRIVE_ENABLED}
        />
      </Section>

      {/* Storage */}
      <Section title="وجهة التخزين">
        <div className="bg-gradient-to-l from-amber-50 to-amber-50/50 border border-amber-200 rounded-2xl p-4 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900">التخزين الحالي:</span>
            <span className="text-zinc-800">
              {defaultStorage === "PLATFORM" ? "تخزين المنصة (Cloudflare R2)" : defaultStorage}
            </span>
            {defaultStorage !== "PLATFORM" && (
              <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded-full">تخزينك الخاص</span>
            )}
          </div>
        </div>

        <IntegrationCard
          title="AWS S3"
          description="استخدم Bucket خاص بك في Amazon S3 لتخزين الصور"
          icon={<HardDrive className="w-5 h-5 text-orange-600" />}
          connected={awsS3.connected}
          onDisconnect={() => disconnect("aws-s3")}
          disconnecting={disconnecting === "aws-s3"}
          onConnect={() => setExpandedS3(true)}
        >
          {(expandedS3 || awsS3.connected) && (
            <AWSS3Form
              connected={awsS3.connected}
              onSuccess={() => { setExpandedS3(false); router.refresh(); }}
            />
          )}
        </IntegrationCard>

        <IntegrationCard
          title="Cloudflare R2"
          description="استخدم Bucket خاص بك في Cloudflare R2 — أسرع وأرخص"
          icon={<Cloud className="w-5 h-5 text-orange-500" />}
          connected={cloudflareR2.connected}
          onDisconnect={() => disconnect("cloudflare-r2")}
          disconnecting={disconnecting === "cloudflare-r2"}
          onConnect={() => setExpandedR2(true)}
        >
          {(expandedR2 || cloudflareR2.connected) && (
            <CloudflareR2Form
              connected={cloudflareR2.connected}
              onSuccess={() => { setExpandedR2(false); router.refresh(); }}
            />
          )}
        </IntegrationCard>
      </Section>

      {/* Messaging */}
      <Section title="الإشعارات والمراسلة">
        <IntegrationCard
          title="WhatsApp Business API"
          description="إرسال روابط الصور للضيوف عبر WhatsApp Cloud API"
          icon={<MessageCircle className="w-5 h-5 text-emerald-600" />}
          connected={false}
          comingSoon
          badge="قريباً"
        />
        <IntegrationCard
          title="Telegram Bot"
          description="إرسال تنبيهات وروابط عبر Telegram"
          icon={<Send className="w-5 h-5 text-blue-500" />}
          connected={false}
          comingSoon
          badge="قريباً"
        />
        <IntegrationCard
          title="البريد الإلكتروني (SMTP)"
          description="إرسال الصور والتقارير عبر SMTP الخاص بك"
          icon={<Mail className="w-5 h-5 text-zinc-600" />}
          connected={false}
          comingSoon
          badge="قريباً"
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 px-1">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
