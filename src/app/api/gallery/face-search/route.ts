import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import {
  searchFacesByImage,
  validateSelfie,
  SearchError,
  isRekognitionConfigured,
} from "@/lib/rekognition";
import { checkRateLimit, getClientIp, LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit: 5 face searches per minute per IP
  const ip = getClientIp(req);
  const rl = await checkRateLimit(ip, LIMITS.faceSearch);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `تجاوزت حد البحث المسموح، حاول بعد ${rl.retryAfter} ثانية` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  const formData = await req.formData();
  const selfie = formData.get("selfie") as File | null;
  const eventId = formData.get("eventId") as string | null;

  if (!selfie || !eventId) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  if (selfie.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة كبير جداً (أقصى 10MB)" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, tenantId: true, faceSearchEnabled: true, status: true },
  });

  if (!event || !event.faceSearchEnabled || event.status !== "ACTIVE") {
    return NextResponse.json({ error: "البحث بالوجه غير مفعل لهذه الفعالية" }, { status: 403 });
  }

  if (!await isRekognitionConfigured()) {
    return NextResponse.json(
      { error: "خدمة التعرف على الوجوه غير متاحة حالياً، تواصل مع مزود الخدمة" },
      { status: 503 }
    );
  }

  const selfieBuffer = Buffer.from(await selfie.arrayBuffer());
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "";

  // Quality check before hitting Rekognition
  const validation = await validateSelfie(selfieBuffer);
  if (!validation.valid) {
    return NextResponse.json(
      {
        error: validation.qualityIssues[0] || "الصورة غير صالحة للبحث",
        qualityIssues: validation.qualityIssues,
        code: "LOW_QUALITY",
      },
      { status: 422 }
    );
  }

  try {
    const { results, searchedFaceConfidence } = await searchFacesByImage(
      event.tenantId,
      eventId,
      selfieBuffer,
      80 // similarity threshold
    );

    const photoIds = results.map((r) => r.photoId).filter(Boolean);

    const photos =
      photoIds.length > 0
        ? await db.photo.findMany({
            where: {
              id: { in: photoIds },
              eventId,
              tenantId: event.tenantId,
              status: { not: "DELETED" },
            },
            select: {
              id: true,
              storageKey: true,
              thumbnailKey: true,
              previewKey: true,
              originalName: true,
            },
          })
        : [];

    // Re-sort by Rekognition similarity (DB query doesn't preserve order)
    const simMap = new Map(results.map((r) => [r.photoId, r.similarity]));
    const sorted = photos.sort(
      (a, b) => (simMap.get(b.id) ?? 0) - (simMap.get(a.id) ?? 0)
    );

    const photosWithUrls = sorted.map((p) => ({
      id: p.id,
      thumbUrl: p.thumbnailKey
        ? getPublicUrl(p.thumbnailKey)
        : getPublicUrl(p.storageKey),
      previewUrl: p.previewKey
        ? getPublicUrl(p.previewKey)
        : getPublicUrl(p.storageKey),
      fullUrl: getPublicUrl(p.storageKey),
      name: p.originalName || "صورة",
      similarity: Math.round(simMap.get(p.id) ?? 0),
    }));

    // Log async — never block response
    db.faceSearch
      .create({
        data: {
          tenantId: event.tenantId,
          eventId,
          resultPhotoIds: photoIds,
          matchCount: photosWithUrls.length,
          ipAddress,
        },
      })
      .catch(() => {});

    db.analyticsEvent
      .create({
        data: {
          tenantId: event.tenantId,
          eventId,
          type: "FACE_SEARCH",
          metadata: {
            matchCount: photosWithUrls.length,
            confidence: searchedFaceConfidence,
          },
          ipAddress,
        },
      })
      .catch(() => {});

    return NextResponse.json({
      photos: photosWithUrls,
      matchCount: photosWithUrls.length,
      searchedFaceConfidence: Math.round(searchedFaceConfidence),
    });
  } catch (err: any) {
    if (err instanceof SearchError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
    }
    console.error("[face-search]", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء البحث، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
