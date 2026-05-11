import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listFilesInFolder, getFolderInfo } from "@/lib/integrations/google-drive";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantUser = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    select: { tenantId: true },
  });
  if (!tenantUser) return NextResponse.json({ error: "No tenant" }, { status: 404 });

  const folderId = req.nextUrl.searchParams.get("folderId");
  if (!folderId) return NextResponse.json({ error: "folderId required" }, { status: 400 });

  try {
    const [{ files }, info] = await Promise.all([
      listFilesInFolder(tenantUser.tenantId, folderId),
      getFolderInfo(tenantUser.tenantId, folderId),
    ]);
    return NextResponse.json({ files, folderName: info.name, imageCount: info.imageCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
