import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  eventId: z.string(),
  folderId: z.string(),
  syncMode: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { eventId, folderId, syncMode } = parsed.data;
  const { tenantId } = tenantUser;

  // Verify event belongs to tenant
  const event = await db.event.findUnique({
    where: { id: eventId, tenantId },
    select: { id: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Check Drive is connected
  const integration = await db.integration.findUnique({
    where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } },
    select: { connected: true },
  });
  if (!integration?.connected) {
    return NextResponse.json({ error: "Google Drive غير مرتبط" }, { status: 400 });
  }

  // Create a Job record to track progress
  const job = await db.job.create({
    data: {
      tenantId,
      eventId,
      type: "IMPORT_FROM_DRIVE",
      status: "PENDING",
      payload: { provider: "GOOGLE_DRIVE", folderId, syncMode },
    },
  });

  // Queue the import job via BullMQ
  // The worker picks it up and calls runImport()
  try {
    const { getImageProcessingQueue } = await import("@/lib/queue");
    await getImageProcessingQueue().add(
      "import-from-drive",
      { jobId: job.id, tenantId, eventId, provider: "GOOGLE_DRIVE", sourceFolderId: folderId, syncMode },
      { attempts: 1, jobId: job.id }
    );
  } catch {
    // If Redis not available, run inline (dev fallback — slower but works)
    const { runImport } = await import("@/lib/integrations/importer");
    runImport({ jobId: job.id, tenantId, eventId, provider: "GOOGLE_DRIVE", sourceFolderId: folderId, syncMode });
  }

  return NextResponse.json({ jobId: job.id, status: "started" }, { status: 202 });
}
