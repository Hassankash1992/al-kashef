/**
 * Cloud source importer.
 * Orchestrates the flow: source (Drive/Dropbox/OneDrive) → download → storage upload → DB record.
 *
 * Designed to run inside a BullMQ worker but can also be called directly.
 * Emits progress via DB Job record so the frontend can poll it.
 */

import path from "path";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { getStorageAdapter, buildPhotoKey } from "../storage-adapter";
import { getImageProcessingQueue } from "../queue";
import * as GoogleDrive from "./google-drive";
import * as Dropbox from "./dropbox";
import * as OneDrive from "./onedrive";

export type SourceProvider = "GOOGLE_DRIVE" | "DROPBOX" | "ONEDRIVE";

export interface ImportOptions {
  tenantId: string;
  eventId: string;
  jobId: string;
  provider: SourceProvider;
  /** Folder/path identifier in the source system */
  sourceFolderId: string;
  /** Sync mode: import only files not already imported (by sourceFileId) */
  syncMode?: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  failed: number;
  skipped: number;
  status: "running" | "completed" | "failed";
  currentFile?: string;
  error?: string;
}

async function updateJobProgress(jobId: string, progress: ImportProgress) {
  await db.job.update({
    where: { id: jobId },
    data: {
      status: progress.status === "running" ? "PROCESSING" : progress.status === "completed" ? "COMPLETED" : "FAILED",
      result: progress as any,
      error: progress.error ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function runImport(opts: ImportOptions): Promise<ImportProgress> {
  const { tenantId, eventId, jobId, provider, sourceFolderId, syncMode } = opts;

  const progress: ImportProgress = { total: 0, processed: 0, failed: 0, skipped: 0, status: "running" };
  await updateJobProgress(jobId, progress);

  try {
    // 1. Get list of files from source
    let sourceFiles: Array<{ id: string; name: string; size: number; mimeType?: string }> = [];

    if (provider === "GOOGLE_DRIVE") {
      let pageToken: string | undefined;
      do {
        const res = await GoogleDrive.listFilesInFolder(tenantId, sourceFolderId, pageToken);
        sourceFiles.push(...res.files.map((f) => ({ id: f.id, name: f.name, size: f.size, mimeType: f.mimeType })));
        pageToken = res.nextPageToken ?? undefined;
      } while (pageToken);
    } else if (provider === "DROPBOX") {
      const files = await Dropbox.listFilesInFolder(tenantId, sourceFolderId);
      sourceFiles = files.map((f) => ({ id: f.id, name: f.name, size: f.size }));
    } else if (provider === "ONEDRIVE") {
      const files = await OneDrive.listFilesInFolder(tenantId, sourceFolderId);
      sourceFiles = files.map((f) => ({ id: f.id, name: f.name, size: f.size }));
    }

    progress.total = sourceFiles.length;
    await updateJobProgress(jobId, progress);

    if (sourceFiles.length === 0) {
      progress.status = "completed";
      await updateJobProgress(jobId, progress);
      return progress;
    }

    // 2. Get already-imported source IDs if sync mode
    let existingSourceIds = new Set<string>();
    if (syncMode) {
      const existing = await db.photo.findMany({
        where: { eventId, sourceFileId: { not: null } },
        select: { sourceFileId: true },
      });
      existingSourceIds = new Set(existing.map((p) => p.sourceFileId!));
    }

    // 3. Get storage adapter for this tenant
    const storageConfig = await db.storageConfig.findUnique({ where: { tenantId } });
    const storage = getStorageAdapter(storageConfig);

    // 4. Process files one by one
    for (const file of sourceFiles) {
      progress.currentFile = file.name;

      // Skip if already imported
      if (syncMode && existingSourceIds.has(file.id)) {
        progress.skipped++;
        await updateJobProgress(jobId, progress);
        continue;
      }

      try {
        // Download file
        let buffer: Buffer;
        if (provider === "GOOGLE_DRIVE") {
          buffer = await GoogleDrive.downloadFile(tenantId, file.id);
        } else if (provider === "DROPBOX") {
          buffer = await Dropbox.downloadFile(tenantId, file.id); // file.id is path for dropbox
        } else {
          const oneDriveFiles = await OneDrive.listFilesInFolder(tenantId, sourceFolderId);
          const match = oneDriveFiles.find((f) => f.id === file.id);
          if (!match) throw new Error("File not found");
          buffer = await OneDrive.downloadFile(match.downloadUrl);
        }

        // Build storage key
        const ext = path.extname(file.name) || ".jpg";
        const uniqueName = `${uuidv4()}${ext}`;
        const storageKey = buildPhotoKey(tenantId, eventId, uniqueName);

        // Upload to storage
        await storage.upload(storageKey, buffer, file.mimeType ?? "image/jpeg");

        // Create photo DB record
        const photo = await db.photo.create({
          data: {
            tenantId,
            eventId,
            storageKey,
            originalName: file.name,
            mimeType: file.mimeType ?? "image/jpeg",
            size: file.size,
            sourceFileId: file.id,
            status: "PROCESSING",
          },
        });

        // Queue for thumbnail generation
        await getImageProcessingQueue().add("process-image", {
          photoId: photo.id,
          eventId,
          tenantId,
          storageKey,
        }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });

        progress.processed++;
      } catch (err) {
        console.error(`Failed to import file ${file.name}:`, err);
        progress.failed++;
      }

      await updateJobProgress(jobId, progress);
    }

    // 5. Update event metadata
    await db.event.update({
      where: { id: eventId },
      data: {
        driveSourceId: sourceFolderId,
        lastSyncAt: new Date(),
        totalPhotos: { increment: progress.processed },
      },
    });

    progress.status = progress.failed === sourceFiles.length ? "failed" : "completed";
    await updateJobProgress(jobId, progress);
    return progress;
  } catch (err: any) {
    progress.status = "failed";
    progress.error = err.message;
    await updateJobProgress(jobId, progress);
    throw err;
  }
}
