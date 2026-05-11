/**
 * AWS Rekognition face recognition client.
 *
 * Design decisions:
 * - One Collection per event: `{sanitized_tenantId}--{sanitized_eventId}`
 * - ExternalImageId on each face = photoId → direct lookup without extra DB query
 * - Selfie never stored: sent as raw Bytes to SearchFacesByImage
 * - Face indexing uses thumbnail (small, fast, already processed)
 * - Similarity threshold configurable per event (default 80%)
 */

import {
  RekognitionClient,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  ListCollectionsCommand,
  DeleteFacesCommand,
  type FaceMatch,
  type FaceDetail,
} from "@aws-sdk/client-rekognition";

// ─── Client ───────────────────────────────────────────────────────────────────

function getClient(): RekognitionClient {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("AWS credentials missing — add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env");
  }
  return new RekognitionClient({
    region: process.env.AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

// ─── Collection ID ────────────────────────────────────────────────────────────

/**
 * Rekognition collection IDs: alphanumeric + underscore + hyphen, max 255 chars.
 * We sanitize cuid IDs (already alphanumeric) and prefix to identify ownership.
 */
export function getCollectionId(tenantId: string, eventId: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
  return `ef--${safe(tenantId)}--${safe(eventId)}`;
}

// ─── Collection management ────────────────────────────────────────────────────

const existingCollections = new Set<string>(); // in-memory cache per process

export async function ensureCollection(tenantId: string, eventId: string): Promise<string> {
  const collectionId = getCollectionId(tenantId, eventId);
  if (existingCollections.has(collectionId)) return collectionId;

  const client = getClient();
  try {
    await client.send(new CreateCollectionCommand({ CollectionId: collectionId }));
  } catch (err: any) {
    if (err.name === "ResourceAlreadyExistsException") {
      // Already exists — fine
    } else {
      throw err;
    }
  }

  existingCollections.add(collectionId);
  return collectionId;
}

export async function deleteCollection(tenantId: string, eventId: string): Promise<void> {
  const collectionId = getCollectionId(tenantId, eventId);
  const client = getClient();
  try {
    await client.send(new DeleteCollectionCommand({ CollectionId: collectionId }));
    existingCollections.delete(collectionId);
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") return; // already gone
    throw err;
  }
}

// ─── Face Indexing ────────────────────────────────────────────────────────────

export interface IndexedFace {
  faceId: string;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
  confidence: number;
}

/**
 * Index all faces in a photo into the event's Rekognition collection.
 * Uses the image buffer directly (downloaded thumbnail) — no S3 dependency.
 * ExternalImageId = photoId so SearchFacesByImage can return photoIds directly.
 */
export async function indexPhotoFaces(
  tenantId: string,
  eventId: string,
  photoId: string,
  imageBuffer: Buffer
): Promise<IndexedFace[]> {
  const collectionId = await ensureCollection(tenantId, eventId);
  const client = getClient();

  const response = await client.send(
    new IndexFacesCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageBuffer },
      ExternalImageId: photoId,
      MaxFaces: 15,
      QualityFilter: "AUTO",
      DetectionAttributes: ["DEFAULT"],
    })
  );

  return (response.FaceRecords ?? []).map((record) => ({
    faceId: record.Face?.FaceId ?? "",
    confidence: record.Face?.Confidence ?? 0,
    boundingBox: record.Face?.BoundingBox
      ? {
          left: record.Face.BoundingBox.Left ?? 0,
          top: record.Face.BoundingBox.Top ?? 0,
          width: record.Face.BoundingBox.Width ?? 0,
          height: record.Face.BoundingBox.Height ?? 0,
        }
      : null,
  }));
}

/**
 * Remove previously indexed faces for a photo (before re-indexing).
 */
export async function removeFacesForPhoto(
  tenantId: string,
  eventId: string,
  faceIds: string[]
): Promise<void> {
  if (faceIds.length === 0) return;
  const collectionId = getCollectionId(tenantId, eventId);
  const client = getClient();
  // Rekognition DeleteFaces accepts max 1000 IDs per call
  for (let i = 0; i < faceIds.length; i += 1000) {
    await client.send(
      new DeleteFacesCommand({
        CollectionId: collectionId,
        FaceIds: faceIds.slice(i, i + 1000),
      })
    );
  }
}

// ─── Face Search ──────────────────────────────────────────────────────────────

export interface FaceSearchResult {
  photoId: string;
  similarity: number;
  faceId: string;
}

export interface SelfieValidation {
  valid: boolean;
  faceCount: number;
  confidence: number;
  qualityIssues: string[];
}

/**
 * Search for matching faces in an event collection.
 * Takes the raw selfie buffer — never stored anywhere.
 * Returns list of { photoId, similarity } sorted by similarity desc.
 */
export async function searchFacesByImage(
  tenantId: string,
  eventId: string,
  selfieBuffer: Buffer,
  similarityThreshold = 80
): Promise<{ results: FaceSearchResult[]; searchedFaceConfidence: number }> {
  const collectionId = getCollectionId(tenantId, eventId);
  const client = getClient();

  let response;
  try {
    response = await client.send(
      new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: selfieBuffer },
        MaxFaces: 200,
        FaceMatchThreshold: similarityThreshold,
      })
    );
  } catch (err: any) {
    if (err.name === "InvalidParameterException") {
      // No face detected in selfie
      throw new SearchError("NO_FACE", "لم يتم اكتشاف وجه في الصورة. يرجى رفع صورة واضحة لوجهك.");
    }
    if (err.name === "ResourceNotFoundException") {
      // Collection doesn't exist yet — no photos indexed
      return { results: [], searchedFaceConfidence: 0 };
    }
    throw err;
  }

  const results: FaceSearchResult[] = (response.FaceMatches ?? [])
    .map((match: FaceMatch) => ({
      photoId: match.Face?.ExternalImageId ?? "",
      similarity: match.Similarity ?? 0,
      faceId: match.Face?.FaceId ?? "",
    }))
    .filter((r) => r.photoId !== "")
    // Deduplicate by photoId — keep highest similarity per photo
    .reduce((acc: FaceSearchResult[], cur) => {
      const existing = acc.find((r) => r.photoId === cur.photoId);
      if (!existing) return [...acc, cur];
      if (cur.similarity > existing.similarity) {
        return acc.map((r) => (r.photoId === cur.photoId ? cur : r));
      }
      return acc;
    }, [])
    .sort((a, b) => b.similarity - a.similarity);

  return {
    results,
    searchedFaceConfidence: response.SearchedFaceConfidence ?? 0,
  };
}

/**
 * Validate a selfie before searching:
 * - Must have exactly 1 face
 * - Face must be large enough (>10% of image)
 * - Brightness & sharpness quality check
 */
export async function validateSelfie(selfieBuffer: Buffer): Promise<SelfieValidation> {
  const client = getClient();
  const qualityIssues: string[] = [];

  let response;
  try {
    response = await client.send(
      new DetectFacesCommand({
        Image: { Bytes: selfieBuffer },
        Attributes: ["ALL"],
      })
    );
  } catch {
    return { valid: false, faceCount: 0, confidence: 0, qualityIssues: ["فشل تحليل الصورة"] };
  }

  const faces: FaceDetail[] = response.FaceDetails ?? [];
  const faceCount = faces.length;

  if (faceCount === 0) {
    qualityIssues.push("لم يتم اكتشاف وجه");
    return { valid: false, faceCount, confidence: 0, qualityIssues };
  }

  if (faceCount > 1) {
    qualityIssues.push("يوجد أكثر من وجه في الصورة — يرجى رفع صورة لوجهك فقط");
    return { valid: false, faceCount, confidence: faces[0].Confidence ?? 0, qualityIssues };
  }

  const face = faces[0];
  const confidence = face.Confidence ?? 0;
  const box = face.BoundingBox;
  const quality = face.Quality;

  // Face too small
  if (box && box.Width && box.Height && box.Width * box.Height < 0.03) {
    qualityIssues.push("الوجه صغير جداً — اقترب من الكاميرا");
  }

  // Low confidence
  if (confidence < 85) {
    qualityIssues.push("جودة الصورة منخفضة — تأكد من الإضاءة الجيدة");
  }

  // Rekognition Quality score
  if (quality?.Brightness && quality.Brightness < 40) {
    qualityIssues.push("الصورة مظلمة — يرجى التصوير في مكان أكثر إضاءة");
  }
  if (quality?.Sharpness && quality.Sharpness < 40) {
    qualityIssues.push("الصورة غير واضحة — يرجى الثبات عند التصوير");
  }

  return {
    valid: qualityIssues.length === 0,
    faceCount,
    confidence,
    qualityIssues,
  };
}

// ─── Custom errors ────────────────────────────────────────────────────────────

export type SearchErrorCode = "NO_FACE" | "MULTIPLE_FACES" | "LOW_QUALITY" | "COLLECTION_EMPTY";

export class SearchError extends Error {
  constructor(
    public code: SearchErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SearchError";
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function isRekognitionConfigured(): Promise<boolean> {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION);
}
