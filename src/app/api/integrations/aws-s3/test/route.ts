import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { S3Adapter } from "@/lib/storage-adapter";
import { z } from "zod";

const schema = z.object({
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucket: z.string(),
  region: z.string(),
  cdnUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  const { accessKeyId, secretAccessKey, bucket, region, cdnUrl } = parsed.data;

  const adapter = new S3Adapter({ accessKeyId, secretAccessKey, bucket, region, cdnUrl });
  const result = await adapter.testConnection();

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
