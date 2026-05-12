import { db } from "./db";

export interface SiteSettingsData {
  siteName: string;
  siteTagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  footerLogoUrl: string | null;
  primaryColor: string;
  contactEmail: string | null;
  supportEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  socialLinks: { twitter?: string; instagram?: string; facebook?: string; linkedin?: string } | null;
  customCss: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

const DEFAULTS: SiteSettingsData = {
  siteName: "EventFace",
  siteTagline: "منصة معارض الفعاليات الذكية",
  logoUrl: null,
  faviconUrl: null,
  ogImageUrl: null,
  footerLogoUrl: null,
  primaryColor: "#f59e0b",
  contactEmail: null,
  supportEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  socialLinks: null,
  customCss: null,
  maintenanceMode: false,
  maintenanceMessage: null,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULTS;
  return {
    siteName: row.siteName,
    siteTagline: row.siteTagline,
    logoUrl: row.logoUrl,
    faviconUrl: row.faviconUrl,
    ogImageUrl: row.ogImageUrl,
    footerLogoUrl: row.footerLogoUrl,
    primaryColor: row.primaryColor,
    contactEmail: row.contactEmail,
    supportEmail: row.supportEmail,
    contactPhone: row.contactPhone,
    whatsappNumber: row.whatsappNumber,
    socialLinks: (row.socialLinks as any) ?? null,
    customCss: row.customCss,
    maintenanceMode: row.maintenanceMode,
    maintenanceMessage: row.maintenanceMessage,
  };
}

export async function upsertSiteSettings(
  data: Partial<SiteSettingsData>,
  updatedBy?: string
): Promise<void> {
  // Strip nulls from socialLinks for Prisma JSON typing
  const clean: any = { ...data, updatedBy };
  if (data.socialLinks === null) clean.socialLinks = undefined;

  await db.siteSettings.upsert({
    where: { id: 1 },
    update: clean,
    create: { id: 1, ...DEFAULTS, ...clean },
  });
}
