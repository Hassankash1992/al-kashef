"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntegrationCard from "./IntegrationCard";
import AWSS3Form from "./AWSS3Form";
import CloudflareR2Form from "./CloudflareR2Form";
import { HardDrive, Cloud } from "lucide-react";

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
      {/* Sources section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">مصادر الصور</h2>
        <div className="space-y-3">
          <IntegrationCard
            title="Google Drive"
            description="استيراد صور الفعاليات من مجلداتك في Google Drive"
            icon="🗂️"
            connected={googleDrive.connected}
            email={googleDrive.email}
            connectHref="/api/integrations/google-drive/auth"
            onDisconnect={() => disconnect("google-drive")}
            disconnecting={disconnecting === "google-drive"}
          >
            {googleDrive.connected && (
              <p className="text-xs text-gray-500">
                ✓ يمكنك الآن استيراد الصور من Google Drive عند إنشاء الفعاليات
              </p>
            )}
          </IntegrationCard>

          <IntegrationCard
            title="Dropbox"
            description="استيراد الصور من مجلداتك في Dropbox"
            icon="📦"
            connected={false}
            connectHref="/api/integrations/dropbox/auth"
            comingSoon={!process.env.NEXT_PUBLIC_DROPBOX_ENABLED}
          />

          <IntegrationCard
            title="Microsoft OneDrive"
            description="استيراد الصور من OneDrive الشخصي أو المؤسسي"
            icon="☁️"
            connected={false}
            connectHref="/api/integrations/onedrive/auth"
            comingSoon={!process.env.NEXT_PUBLIC_ONEDRIVE_ENABLED}
          />
        </div>
      </div>

      {/* Storage section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">وجهة التخزين</h2>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-3 text-sm text-indigo-700">
          <strong>التخزين الحالي: </strong>
          {defaultStorage === "PLATFORM" ? "تخزين المنصة الافتراضي (Cloudflare R2)" : defaultStorage}
          {defaultStorage !== "PLATFORM" && (
            <span className="ml-2 text-green-600 font-medium">(تخزينك الخاص)</span>
          )}
        </div>

        <div className="space-y-3">
          <IntegrationCard
            title="AWS S3"
            description="استخدم Bucket خاص بك في Amazon S3 لتخزين الصور"
            icon={<HardDrive className="w-5 h-5 text-orange-500" />}
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
            icon={<Cloud className="w-5 h-5 text-orange-400" />}
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
        </div>
      </div>

      {/* Messaging section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">الإشعارات والمراسلة</h2>
        <div className="space-y-3">
          <IntegrationCard title="WhatsApp Business API" description="إرسال روابط الصور للضيوف عبر WhatsApp Cloud API" icon="💬" connected={false} comingSoon badge="المرحلة 4" />
          <IntegrationCard title="Telegram Bot" description="إرسال تنبيهات وروابط عبر Telegram" icon="✈️" connected={false} comingSoon badge="المرحلة 4" />
          <IntegrationCard title="البريد الإلكتروني (SMTP)" description="إرسال الصور والتقارير عبر SMTP الخاص بك" icon="📧" connected={false} comingSoon badge="المرحلة 4" />
        </div>
      </div>
    </div>
  );
}
