/**
 * Plan limits and enforcement helpers.
 * Default values — overridden by PlanConfig rows in DB if they exist.
 */

export type PlanKey = "STARTER" | "PRO" | "AGENCY";

export interface PlanLimits {
  displayName: string;
  maxEvents: number;           // -1 = unlimited
  maxPhotosPerEvent: number;   // -1 = unlimited
  maxStorageGB: number;        // -1 = unlimited
  maxTeamMembers: number;
  faceSearchEnabled: boolean;
  customDomainEnabled: boolean;
  watermarkRemoval: boolean;
  priceMonthly: number;
  priceYearly: number;
}

export const DEFAULT_PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  STARTER: {
    displayName: "مبتدئ",
    maxEvents: 3,
    maxPhotosPerEvent: 300,
    maxStorageGB: 5,
    maxTeamMembers: 1,
    faceSearchEnabled: false,
    customDomainEnabled: false,
    watermarkRemoval: false,
    priceMonthly: 0,
    priceYearly: 0,
  },
  PRO: {
    displayName: "احترافي",
    maxEvents: 20,
    maxPhotosPerEvent: 2000,
    maxStorageGB: 50,
    maxTeamMembers: 5,
    faceSearchEnabled: true,
    customDomainEnabled: true,
    watermarkRemoval: true,
    priceMonthly: 199,
    priceYearly: 1990,
  },
  AGENCY: {
    displayName: "وكالة",
    maxEvents: -1,
    maxPhotosPerEvent: -1,
    maxStorageGB: -1,
    maxTeamMembers: -1,
    faceSearchEnabled: true,
    customDomainEnabled: true,
    watermarkRemoval: true,
    priceMonthly: 599,
    priceYearly: 5990,
  },
};

/** Merge DB PlanConfig row on top of defaults */
export function mergePlanConfig(
  plan: PlanKey,
  dbConfig: Partial<PlanLimits> | null
): PlanLimits {
  return { ...DEFAULT_PLAN_LIMITS[plan], ...(dbConfig ?? {}) };
}

/** Check if a value is within limit (-1 means unlimited) */
export function withinLimit(current: number, max: number): boolean {
  if (max === -1) return true;
  return current < max;
}

export function formatStorage(bytes: bigint | number): string {
  const n = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function storagePercent(usedBytes: bigint | number, maxGB: number): number {
  if (maxGB === -1) return 0;
  const used = typeof usedBytes === "bigint" ? Number(usedBytes) : usedBytes;
  return Math.min(100, Math.round((used / (maxGB * 1024 ** 3)) * 100));
}

export const PLAN_BADGE_COLOR: Record<PlanKey, string> = {
  STARTER: "bg-gray-100 text-gray-600",
  PRO: "bg-indigo-100 text-indigo-700",
  AGENCY: "bg-purple-100 text-purple-700",
};
