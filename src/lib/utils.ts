import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function generateToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: "زواج",
  CONFERENCE: "مؤتمر",
  GRADUATION: "تخرج",
  CORPORATE: "فعالية شركة",
  BIRTHDAY: "عيد ميلاد",
  OTHER: "أخرى",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشطة",
  ARCHIVED: "مؤرشفة",
};

export const PLAN_LIMITS = {
  STARTER: { events: 10, photosPerEvent: 500, storageGB: 5 },
  PRO: { events: 50, photosPerEvent: 1500, storageGB: 50 },
  AGENCY: { events: -1, photosPerEvent: -1, storageGB: 500 },
};
