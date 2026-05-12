import { getSiteSettings } from "@/lib/site-settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { Globe2 } from "lucide-react";

export default async function AdminSitePage() {
  const settings = await getSiteSettings();
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-amber-600" />
          إعدادات الموقع
        </h1>
        <p className="text-zinc-500 text-sm mt-1">الشعار، الألوان، معلومات التواصل، وإعدادات الموقع العامة</p>
      </div>

      <SiteSettingsForm initial={settings} />
    </div>
  );
}
