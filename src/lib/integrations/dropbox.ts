/**
 * Dropbox integration client.
 * Uses Dropbox OAuth 2.0 with offline access (refresh tokens).
 * Scope: files.content.read (read-only)
 */

import axios from "axios";
import { encrypt, decrypt } from "../crypto";
import { db } from "../db";

const DROPBOX_CLIENT_ID = process.env.DROPBOX_CLIENT_ID!;
const DROPBOX_CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dropbox/callback`;

export function getAuthUrl(tenantId: string): string {
  const params = new URLSearchParams({
    client_id: DROPBOX_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    token_access_type: "offline",
    state: tenantId,
  });
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  accountId: string;
  email: string;
}> {
  const res = await axios.post(
    "https://api.dropboxapi.com/oauth2/token",
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
    {
      auth: { username: DROPBOX_CLIENT_ID, password: DROPBOX_CLIENT_SECRET },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const { access_token, refresh_token, account_id } = res.data;

  // Get email
  const userRes = await axios.post(
    "https://api.dropboxapi.com/2/users/get_current_account",
    null,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    accountId: account_id,
    email: userRes.data.email,
  };
}

async function getValidToken(tenantId: string): Promise<string> {
  const integration = await db.integration.findUnique({
    where: { tenantId_type: { tenantId, type: "DROPBOX" as any } },
  });
  if (!integration?.connected) throw new Error("Dropbox غير مرتبط");

  const config = integration.config as any;
  const refreshToken = decrypt(config.encryptedRefreshToken);

  // Refresh token
  const res = await axios.post(
    "https://api.dropboxapi.com/oauth2/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      auth: { username: DROPBOX_CLIENT_ID, password: DROPBOX_CLIENT_SECRET },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return res.data.access_token;
}

export interface DropboxFolder {
  id: string;
  name: string;
  path: string;
}

export interface DropboxFile {
  id: string;
  name: string;
  size: number;
  path: string;
  clientModified: string;
}

export async function listFolders(tenantId: string): Promise<DropboxFolder[]> {
  const token = await getValidToken(tenantId);
  const res = await axios.post(
    "https://api.dropboxapi.com/2/files/list_folder",
    { path: "", recursive: false, include_non_downloadable_files: false },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.entries
    .filter((e: any) => e[".tag"] === "folder")
    .map((e: any) => ({ id: e.id, name: e.name, path: e.path_lower }));
}

export async function listFilesInFolder(tenantId: string, folderPath: string): Promise<DropboxFile[]> {
  const token = await getValidToken(tenantId);
  const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".tiff"];

  const res = await axios.post(
    "https://api.dropboxapi.com/2/files/list_folder",
    { path: folderPath, recursive: false },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data.entries
    .filter((e: any) => {
      if (e[".tag"] !== "file") return false;
      const ext = e.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      return ext && IMAGE_EXTENSIONS.includes(ext);
    })
    .map((e: any) => ({
      id: e.id,
      name: e.name,
      size: e.size,
      path: e.path_lower,
      clientModified: e.client_modified,
    }));
}

export async function downloadFile(tenantId: string, filePath: string): Promise<Buffer> {
  const token = await getValidToken(tenantId);
  const res = await axios.post(
    "https://content.dropboxapi.com/2/files/download",
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: filePath }),
      },
      responseType: "arraybuffer",
    }
  );
  return Buffer.from(res.data);
}

export async function saveDropboxIntegration(
  tenantId: string,
  data: { accessToken: string; refreshToken: string; accountId: string; email: string }
) {
  await db.integration.upsert({
    where: { tenantId_type: { tenantId, type: "GOOGLE_DRIVE" } }, // placeholder type until schema updated
    create: {
      tenantId,
      type: "GOOGLE_DRIVE", // Will be DROPBOX when schema supports it
      connected: true,
      config: {
        encryptedAccessToken: encrypt(data.accessToken),
        encryptedRefreshToken: encrypt(data.refreshToken),
        accountId: data.accountId,
        email: data.email,
        provider: "DROPBOX",
      },
    },
    update: {
      connected: true,
      config: {
        encryptedAccessToken: encrypt(data.accessToken),
        encryptedRefreshToken: encrypt(data.refreshToken),
        accountId: data.accountId,
        email: data.email,
        provider: "DROPBOX",
      },
    },
  });
}
