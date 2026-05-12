/**
 * Face recognition provider wrapper.
 * Auto-selects AWS Rekognition or Face++ based on configured env vars.
 * AWS gets priority if both are configured.
 */

import * as Aws from "./rekognition";
import * as Fpp from "./faceplusplus";

export type Provider = "AWS" | "FACEPP" | "NONE";

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
  const provider = await getActiveProvider();
  if (provider === "AWS") {
    const r = await Aws.searchFacesByImage(tenantId, eventId, selfieBuffer, similarityThreshold);
    return { ...r, provider };
  }
  if (provider === "FACEPP") {
    const r = await Fpp.searchFacesByImage(tenantId, eventId, selfieBuffer, similarityThreshold);
    return { ...r, provider };
  }
  throw new Error("لا توجد خدمة تعرف على الوجوه مفعّلة");
}

export interface ValidationResult {
  valid: boolean;
  qualityIssues: string[];
}

export async function validateSelfie(imageBuffer: Buffer): Promise<ValidationResult> {
  const provider = await getActiveProvider();
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
  const provider = await getActiveProvider();
  if (provider === "AWS") {
    await Aws.indexPhotoFaces(tenantId, eventId, photoId, imageBuffer);
  } else if (provider === "FACEPP") {
    await Fpp.indexPhotoFace(tenantId, eventId, photoId, imageBuffer);
  }
}

export async function deleteCollection(tenantId: string, eventId: string): Promise<void> {
  const provider = await getActiveProvider();
  if (provider === "AWS") await Aws.deleteCollection(tenantId, eventId);
  else if (provider === "FACEPP") await Fpp.deleteFaceset(tenantId, eventId);
}
