/**
 * Face recognition provider wrapper.
 * Provider is selected based on tenant's plan:
 *   - STARTER  → Face++ (free, ~93% accuracy)
 *   - PRO      → AWS Rekognition (paid, ~98% accuracy)
 *   - AGENCY   → AWS Rekognition (paid, ~98% accuracy)
 *
 * If the preferred provider isn't configured, falls back to whichever IS configured.
 */

import * as Aws from "./rekognition";
import * as Fpp from "./faceplusplus";
import { db } from "./db";

export type Provider = "AWS" | "FACEPP" | "NONE";
export type Plan = "STARTER" | "PRO" | "AGENCY";

const PLAN_PREFERRED_PROVIDER: Record<Plan, Provider> = {
  STARTER: "FACEPP",
  PRO: "AWS",
  AGENCY: "AWS",
};

const PROVIDER_LABEL: Record<Provider, string> = {
  AWS: "AWS Rekognition (دقة 98%)",
  FACEPP: "Face++ (دقة 93%)",
  NONE: "غير مفعّل",
};

export function getProviderLabel(provider: Provider): string {
  return PROVIDER_LABEL[provider];
}

/**
 * Returns the provider that's actually available — preferred by plan, falling back if not configured.
 */
export async function resolveProvider(plan: Plan = "STARTER"): Promise<Provider> {
  const preferred = PLAN_PREFERRED_PROVIDER[plan];
  const awsReady = await Aws.isRekognitionConfigured();
  const fppReady = await Fpp.isFaceppConfigured();

  if (preferred === "AWS" && awsReady) return "AWS";
  if (preferred === "FACEPP" && fppReady) return "FACEPP";
  // Fallback to whichever is available
  if (awsReady) return "AWS";
  if (fppReady) return "FACEPP";
  return "NONE";
}

/**
 * Resolve provider from tenantId (looks up plan).
 */
export async function resolveProviderForTenant(tenantId: string): Promise<Provider> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  return resolveProvider((tenant?.plan as Plan) ?? "STARTER");
}

export async function getActiveProvider(): Promise<Provider> {
  if (await Aws.isRekognitionConfigured()) return "AWS";
  if (await Fpp.isFaceppConfigured()) return "FACEPP";
  return "NONE";
}

export async function isFaceRecognitionConfigured(): Promise<boolean> {
  return (await getActiveProvider()) !== "NONE";
}

export interface SearchResult {
  photoId: string;
  similarity: number;
}

export async function searchFacesByImage(
  tenantId: string,
  eventId: string,
  selfieBuffer: Buffer,
  similarityThreshold = 80
): Promise<{ results: SearchResult[]; searchedFaceConfidence: number; provider: Provider }> {
  const provider = await resolveProviderForTenant(tenantId);
  if (provider === "AWS") {
    const r = await Aws.searchFacesByImage(tenantId, eventId, selfieBuffer, similarityThreshold);
    return { ...r, provider };
  }
  if (provider === "FACEPP") {
    // Face++ has slightly lower threshold for similar precision
    const r = await Fpp.searchFacesByImage(tenantId, eventId, selfieBuffer, Math.max(70, similarityThreshold - 5));
    return { ...r, provider };
  }
  throw new Error("لا توجد خدمة تعرف على الوجوه مفعّلة");
}

export interface ValidationResult {
  valid: boolean;
  qualityIssues: string[];
}

export async function validateSelfie(imageBuffer: Buffer, tenantId?: string): Promise<ValidationResult> {
  const provider = tenantId ? await resolveProviderForTenant(tenantId) : await getActiveProvider();
  if (provider === "AWS") return Aws.validateSelfie(imageBuffer);
  if (provider === "FACEPP") return Fpp.validateSelfie(imageBuffer);
  return { valid: false, qualityIssues: ["خدمة التعرف على الوجوه غير متاحة"] };
}

export async function indexPhotoFace(
  tenantId: string,
  eventId: string,
  photoId: string,
  imageBuffer: Buffer
): Promise<void> {
  const provider = await resolveProviderForTenant(tenantId);
  if (provider === "AWS") {
    await Aws.indexPhotoFaces(tenantId, eventId, photoId, imageBuffer);
  } else if (provider === "FACEPP") {
    await Fpp.indexPhotoFace(tenantId, eventId, photoId, imageBuffer);
  }
}

export async function deleteCollection(tenantId: string, eventId: string): Promise<void> {
  // Try both — whichever succeeds is fine
  await Promise.allSettled([
    Aws.deleteCollection(tenantId, eventId),
    Fpp.deleteFaceset(tenantId, eventId),
  ]);
}
