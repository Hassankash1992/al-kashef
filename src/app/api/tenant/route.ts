import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });

  const { name, slug } = parsed.data;

  const existing = await db.tenant.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "هذا الرابط مستخدم بالفعل، جرب رابطاً آخر" }, { status: 409 });

  const alreadyHasTenant = await db.tenantUser.findFirst({ where: { clerkUserId: userId } });
  if (alreadyHasTenant) return NextResponse.json({ error: "لديك حساب شركة بالفعل" }, { status: 409 });

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
