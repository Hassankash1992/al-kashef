import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
});

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "studio";
  let slug = base;
  let attempt = 0;
  while (attempt < 8) {
    const exists = await db.tenant.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${randomSuffix()}`;
    attempt++;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "اسم الشركة مطلوب (حرفين على الأقل)" }, { status: 400 });
  }

  const { name } = parsed.data;

  // إذا عنده حساب شركة بالفعل، رجّعه له بدل ما نخطّيه
  const existing = await db.tenantUser.findFirst({
    where: { clerkUserId: userId },
    include: { tenant: true },
  });
  if (existing) {
    return NextResponse.json({ ...existing.tenant, alreadyExists: true }, { status: 200 });
  }

  const slug = await generateUniqueSlug(name);

  const tenant = await db.tenant.create({
    data: {
      name,
      slug,
      users: {
        create: { clerkUserId: userId, role: "OWNER" },
      },
    },
  });

  return NextResponse.json(tenant, { status: 201 });
}
