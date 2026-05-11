/**
 * Google Drive integration client.
 * Handles OAuth 2.0 flow, token refresh, folder listing, and file download.
 *
 * Scope strategy: request only drive.readonly (or drive.file for minimal access).
 * We NEVER ask for full Drive access — only what we need to read files.
 */

import { google, drive_v3 } from "googleapis";
import { decrypt, encrypt } from "../crypto";
import { db } from "../db";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/tiff",
];

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-drive/callback`
  );
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

export function getAuthUrl(tenantId: string): string {
  const oauth = getOAuthClient();
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: tenantId,
  });
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
}> {
  const oauth = getOAuthClient();
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const { data } = await oauth2.userinfo.get();

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: new Date(tokens.expiry_date!),
    email: data.email!,
  };
}

// ─── Token management ─────────────────────────────────────────────────────────

async function getValidOAuthClient(tenantId: string) {
  const integration = await db.integration.findUnique({
    where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } },
  });

  if (!integration || !integration.connected) {
    throw new Error("Google Drive غير مرتبط. يرجى الربط أولاً من إعدادات التكاملات.");
  }

  const config = integration.config as any;
  const accessToken = decrypt(config.encryptedAccessToken);
  const refreshToken = decrypt(config.encryptedRefreshToken);

  const oauth = getOAuthClient();
  oauth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: integration.expiresAt?.getTime(),
  });

  // Auto-refresh if expired or about to expire (within 5 minutes)
  const expiresAt = integration.expiresAt;
  const needsRefresh = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

  if (needsRefresh) {
    const { credentials } = await oauth.refreshAccessToken();
    oauth.setCredentials(credentials);

    // Persist the new token
    await db.integration.update({
      where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } },
      data: {
        accessToken: encrypt(credentials.access_token!),
        expiresAt: new Date(credentials.expiry_date!),
        config: {
          ...(integration.config as object),
          encryptedAccessToken: encrypt(credentials.access_token!),
        },
      },
    });
  }

  return oauth;
}

// ─── Drive API operations ─────────────────────────────────────────────────────

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  itemCount: number | null;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  thumbnailLink?: string;
}

export async function listFolders(tenantId: string): Promise<DriveFolder[]> {
  const auth = await getValidOAuthClient(tenantId);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: "files(id, name, parents)",
    pageSize: 100,
    orderBy: "name",
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name!,
    parentId: f.parents?.[0] ?? null,
    itemCount: null,
  }));
}

export async function listFilesInFolder(
  tenantId: string,
  folderId: string,
  pageToken?: string
): Promise<{ files: DriveFile[]; nextPageToken: string | null }> {
  const auth = await getValidOAuthClient(tenantId);
  const drive = google.drive({ version: "v3", auth });

  const mimeQuery = IMAGE_MIME_TYPES.map((m) => `mimeType='${m}'`).join(" or ");
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false and (${mimeQuery})`,
    fields: "nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink)",
    pageSize: 100,
    pageToken,
  });

  return {
    files: (res.data.files ?? []).map((f) => ({
      id: f.id!,
      name: f.name!,
      mimeType: f.mimeType!,
      size: parseInt(f.size ?? "0", 10),
      modifiedTime: f.modifiedTime!,
      thumbnailLink: f.thumbnailLink ?? undefined,
    })),
    nextPageToken: res.data.nextPageToken ?? null,
  };
}

export async function downloadFile(tenantId: string, fileId: string): Promise<Buffer> {
  const auth = await getValidOAuthClient(tenantId);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(res.data as ArrayBuffer);
}

export async function getFolderInfo(
  tenantId: string,
  folderId: string
): Promise<{ name: string; imageCount: number }> {
  const auth = await getValidOAuthClient(tenantId);
  const drive = google.drive({ version: "v3", auth });

  const [folderRes, countRes] = await Promise.all([
    drive.files.get({ fileId: folderId, fields: "name" }),
    drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (${IMAGE_MIME_TYPES.map((m) => `mimeType='${m}'`).join(" or ")})`,
      fields: "nextPageToken",
      pageSize: 1,
    }),
  ]);

  const { files: allFiles } = await listFilesInFolder(tenantId, folderId);

  return {
    name: folderRes.data.name!,
    imageCount: allFiles.length,
  };
}

// ─── Integration helpers ──────────────────────────────────────────────────────

export async function saveDriveIntegration(
  tenantId: string,
  data: { accessToken: string; refreshToken: string; expiresAt: Date; email: string }
) {
  await db.integration.upsert({
    where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } },
    create: {
      tenantId,
      type: "GOOGLE_DRIVE",
      accessToken: encrypt(data.accessToken),
      refreshToken: encrypt(data.refreshToken),
      expiresAt: data.expiresAt,
      connected: true,
      config: {
        encryptedAccessToken: encrypt(data.accessToken),
        encryptedRefreshToken: encrypt(data.refreshToken),
        email: data.email,
      },
    },
    update: {
      accessToken: encrypt(data.accessToken),
      refreshToken: encrypt(data.refreshToken),
      expiresAt: data.expiresAt,
      connected: true,
      config: {
        encryptedAccessToken: encrypt(data.accessToken),
        encryptedRefreshToken: encrypt(data.refreshToken),
        email: data.email,
      },
    },
  });
}

export async function getDriveEmail(tenantId: string): Promise<string | null> {
  const integration = await db.integration.findUnique({
    where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } },
    select: { config: true, connected: true },
  });
  if (!integration?.connected) return null;
  return (integration.config as any)?.email ?? null;
}
