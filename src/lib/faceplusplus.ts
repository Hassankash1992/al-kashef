/**
 * Face++ (Megvii) face recognition client.
 * Free tier: 5000 calls/month forever. No credit card required.
 * Docs: https://www.faceplusplus.com/api-documentation/
 *
 * Design:
 * - One Faceset per event: external_id = `event-{eventId}`
 * - Each detected face stored with user_id = photoId for direct lookup
 * - SearchFaces uses raw bytes from selfie
 */

import sharp from "sharp";

const FPP_BASE = "https://api-us.faceplusplus.com/facepp/v3";

// Face++ has 2MB limit on image_base64 — resize aggressively
async function prepareImageForFpp(buffer: Buffer): Promise<Buffer> {
  // Resize to max 1024px on longest side, JPEG quality 85
  return sharp(buffer)
    .rotate() // auto-rotate based on EXIF
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

interface FppCredentials {
  apiKey: string;
  apiSecret: string;
}

function getCreds(): FppCredentials | null {
  const apiKey = process.env.FACEPP_API_KEY?.trim();
  const apiSecret = process.env.FACEPP_API_SECRET?.trim();
  if (!apiKey || !apiSecret) return null;
  if (apiKey.length < 10 || apiSecret.length < 10) return null;
  return { apiKey, apiSecret };
}

export async function isFaceppConfigured(): Promise<boolean> {
  return getCreds() !== null;
}

// Global mutex to enforce single concurrent Face++ call (free trial limit)
let fppLock: Promise<any> = Promise.resolve();

async function fppRequest(endpoint: string, params: Record<string, any>, fileBuffer?: Buffer): Promise<any> {
  // Chain after previous request to enforce serial execution
  const release = fppLock;
  let resolveNext: () => void = () => {};
  fppLock = new Promise<void>((r) => { resolveNext = r; });

  try {
    await release;
    return await fppRequestInner(endpoint, params, fileBuffer);
  } finally {
    resolveNext();
  }
}

async function fppRequestInner(endpoint: string, params: Record<string, any>, fileBuffer?: Buffer, retryCount = 0): Promise<any> {
  const creds = getCreds();
  if (!creds) throw new Error("Face++ not configured");

  const body = new URLSearchParams();
  body.append("api_key", creds.apiKey);
  body.append("api_secret", creds.apiSecret);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.append(k, String(v));
  }
  if (fileBuffer) {
    const resized = await prepareImageForFpp(fileBuffer);
    body.append("image_base64", resized.toString("base64"));
  }

  const res = await fetch(`${FPP_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Face++ returned invalid response (${res.status}): ${text.slice(0, 200)}`);
  }

  // Auto-retry on concurrency/rate limit (up to 4 times with exponential backoff)
  if (data.error_message === "CONCURRENCY_LIMIT_EXCEEDED" && retryCount < 4) {
    const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s, 4s, 8s
    await new Promise((r) => setTimeout(r, delay));
    return fppRequestInner(endpoint, params, fileBuffer, retryCount + 1);
  }

  if (data.error_message) {
    throw new Error(`Face++ error: ${data.error_message}`);
  }

  // Small delay after EVERY successful call to space requests (Face++ free trial = ~1 RPS)
  await new Promise((r) => setTimeout(r, 250));
  return data;
}

// ─── Faceset (Collection equivalent) ───────────────────────────────────────────

function getFacesetId(tenantId: string, eventId: string): string {
  return `kashef_${tenantId.slice(0, 8)}_${eventId.slice(0, 16)}`.replace(/[^a-zA-Z0-9_]/g, "");
}

export async function ensureFaceset(tenantId: string, eventId: string): Promise<string> {
  const id = getFacesetId(tenantId, eventId);
  try {
    await fppRequest("/faceset/create", {
      outer_id: id,
      display_name: `Event ${eventId}`,
    });
  } catch (err: any) {
    // Already exists is fine
    if (!err.message?.includes("FACESET_EXIST")) throw err;
  }
  return id;
}

export async function deleteFaceset(tenantId: string, eventId: string): Promise<void> {
  const id = getFacesetId(tenantId, eventId);
  await fppRequest("/faceset/delete", { outer_id: id, check_empty: 0 }).catch(() => {});
}

// ─── Index a photo ────────────────────────────────────────────────────────────

export async function indexPhotoFace(
  tenantId: string,
  eventId: string,
  photoId: string,
  imageBuffer: Buffer
): Promise<{ faceTokens: string[] }> {
  // 1. Detect faces
  const detect = await fppRequest("/detect", { return_attributes: "none" }, imageBuffer);
  const faces = detect.faces ?? [];
  if (faces.length === 0) return { faceTokens: [] };

  // 2. Add faces to faceset
  const facesetId = await ensureFaceset(tenantId, eventId);
  const faceTokens: string[] = faces.map((f: any) => f.face_token);

  // user_id encodes our photoId — recovered during search
  for (const token of faceTokens) {
    await fppRequest("/face/setuserid", { face_token: token, user_id: photoId }).catch(() => {});
  }

  await fppRequest("/faceset/addface", {
    outer_id: facesetId,
    face_tokens: faceTokens.join(","),
  });

  return { faceTokens };
}

// ─── Search by selfie ─────────────────────────────────────────────────────────

export interface FppSearchResult {
  photoId: string;
  similarity: number;
}

export async function searchFacesByImage(
  tenantId: string,
  eventId: string,
  selfieBuffer: Buffer,
  similarityThreshold = 75
): Promise<{ results: FppSearchResult[]; searchedFaceConfidence: number }> {
  const facesetId = getFacesetId(tenantId, eventId);

  let data: any;
  try {
    data = await fppRequest("/search", {
      outer_id: facesetId,
      return_result_count: 50,
    }, selfieBuffer);
  } catch (err: any) {
    const msg = err?.message ?? "";
    console.error("[Face++ search]", msg);

    // Faceset doesn't exist or empty → no photos indexed → return empty
    if (msg.includes("INVALID_OUTER_ID") || msg.includes("EMPTY_FACESET") || msg.includes("FACESET_EMPTY")) {
      return { results: [], searchedFaceConfidence: 0 };
    }
    if (msg.includes("NO_FACE_FOUND")) {
      throw new SearchError("لم نعثر على وجه في صورتك", "NO_FACE_IN_SELFIE");
    }
    if (msg.includes("AUTHENTICATION") || msg.includes("AUTHORIZATION") || msg.includes("INVALID_API_KEY")) {
      throw new SearchError("خطأ في إعدادات الخدمة، تواصل مع الدعم", "AUTH_ERROR");
    }
    if (msg.includes("CONCURRENCY_LIMIT")) {
      throw new SearchError("الخدمة مزدحمة، حاول بعد لحظات", "RATE_LIMIT");
    }
    if (msg.includes("IMAGE_FILE_TOO_LARGE") || msg.includes("INVALID_IMAGE")) {
      throw new SearchError("الصورة غير صالحة، جرّب صورة أخرى", "BAD_IMAGE");
    }
    // Unknown error — log and return empty (don't 500)
    return { results: [], searchedFaceConfidence: 0 };
  }

  const searchedFaceConfidence = data.faces?.[0]?.confidence ?? 0;
  const results: FppSearchResult[] = (data.results ?? [])
    .filter((r: any) => r.confidence >= similarityThreshold)
    .map((r: any) => ({
      photoId: r.user_id,
      similarity: r.confidence,
    }))
    .filter((r: FppSearchResult) => !!r.photoId);

  return { results, searchedFaceConfidence };
}

// ─── Selfie quality validation ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  qualityIssues: string[];
}

export async function validateSelfie(imageBuffer: Buffer): Promise<ValidationResult> {
  const issues: string[] = [];
  try {
    const data = await fppRequest("/detect", {
      return_attributes: "facequality,blur,headpose",
    }, imageBuffer);

    const faces = data.faces ?? [];
    if (faces.length === 0) {
      issues.push("لم نعثر على وجه في الصورة");
      issues.push("تأكد أن وجهك واضح ومضاء جيداً");
      return { valid: false, qualityIssues: issues };
    }
    if (faces.length > 1) {
      issues.push("الصورة تحتوي على أكثر من وجه");
      issues.push("استخدم سيلفي لشخص واحد فقط");
      return { valid: false, qualityIssues: issues };
    }

    const face = faces[0];
    const quality = face.attributes?.facequality?.value ?? 0;
    const blur = face.attributes?.blur?.blurness?.value ?? 0;

    if (quality < 50) issues.push("جودة الصورة منخفضة جداً");
    if (blur > 50) issues.push("الصورة مهتزّة — التقطها مرة أخرى بثبات");

    if (issues.length > 0) {
      issues.unshift("الصورة غير واضحة بما يكفي");
      return { valid: false, qualityIssues: issues };
    }

    return { valid: true, qualityIssues: [] };
  } catch (err: any) {
    return { valid: false, qualityIssues: ["فشل تحليل الصورة", err.message] };
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function deleteFaceFromIndex(faceToken: string): Promise<void> {
  await fppRequest("/face/delete", { face_token: faceToken }).catch(() => {});
}

export class SearchError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
