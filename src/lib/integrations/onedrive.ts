/**
 * Microsoft OneDrive integration client.
 * Uses Microsoft Identity Platform OAuth 2.0 (MSAL).
 * Scope: Files.Read.All (read-only)
 */

import axios from "axios";
import { encrypt, decrypt } from "../crypto";
import { db } from "../db";

const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID!;
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET!;
const TENANT = process.env.ONEDRIVE_TENANT_ID ?? "common"; // 'common' for personal + work
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/onedrive/callback`;

const AUTHORITY = `https://login.microsoftonline.com/${TENANT}`;
const SCOPES = ["Files.Read.All", "User.Read", "offline_access"].join(" ");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".tiff"]);

export function getAuthUrl(tenantId: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    response_mode: "query",
    scope: SCOPES,
    state: tenantId,
  });
  return `${AUTHORITY}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  email: string;
  displayName: string;
}> {
  const res = await axios.post(
    `${AUTHORITY}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, refresh_token, expires_in } = res.data;

  const userRes = await axios.get("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  return {
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresAt: new Date(Date.now() + expires_in * 1000),
    email: userRes.data.mail ?? userRes.data.userPrincipalName,
    displayName: userRes.data.displayName,
  };
}

async function getValidToken(tenantId: string): Promise<string> {
  const integration = await db.integration.findFirst({
    where: { tenantId, connected: true, config: { path: ["provider"], equals: "ONEDRIVE" } },
  });
  if (!integration) throw new Error("OneDrive غير مرتبط");

  const config = integration.config as any;
  const refreshToken = decrypt(config.encryptedRefreshToken);

  const res = await axios.post(
    `${AUTHORITY}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: SCOPES,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  // Update stored token
  await db.integration.update({
    where: { id: integration.id },
    data: {
      config: { ...config, encryptedAccessToken: encrypt(res.data.access_token) },
      expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
    },
  });

  return res.data.access_token;
}

export interface OneDriveFolder {
  id: string;
  name: string;
  path: string;
  childCount: number;
}

export interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  downloadUrl: string;
  lastModified: string;
}

export async function listFolders(tenantId: string): Promise<OneDriveFolder[]> {
  const token = await getValidToken(tenantId);
  const res = await axios.get("https://graph.microsoft.com/v1.0/me/drive/root/children?$filter=folder ne null", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (res.data.value ?? []).map((item: any) => ({
    id: item.id,
    name: item.name,
    path: item.parentReference?.path + "/" + item.name,
    childCount: item.folder?.childCount ?? 0,
  }));
}

export async function listFilesInFolder(tenantId: string, folderId: string): Promise<OneDriveFile[]> {
  const token = await getValidToken(tenantId);
  const res = await axios.get(
    `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return (res.data.value ?? [])
    .filter((item: any) => {
      if (!item.file) return false;
      const ext = item.name.toLowerCase().match(/\.[^.]+$/)?.[0];
      return ext && IMAGE_EXTENSIONS.has(ext);
    })
    .map((item: any) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      downloadUrl: item["@microsoft.graph.downloadUrl"],
      lastModified: item.lastModifiedDateTime,
    }));
}

export async function downloadFile(url: string): Promise<Buffer> {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}
