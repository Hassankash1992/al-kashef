import { db } from "@/lib/db";
import AdminsManager from "@/components/admin/AdminsManager";
import { UserCog } from "lucide-react";

export default async function AdminAdminsPage() {
  const admins = await db.adminUser.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <UserCog className="w-6 h-6 text-amber-600" />
          فريق الإدارة
        </h1>
        <p className="text-zinc-500 text-sm mt-1">إدارة المسؤولين والصلاحيات</p>
      </div>

      <AdminsManager initialAdmins={admins.map((a) => ({
        id: a.id,
        clerkUserId: a.clerkUserId,
        email: a.email,
        name: a.name,
        role: a.role,
        permissions: (a.permissions as string[] | null) ?? [],
        active: a.active,
        createdAt: a.createdAt.toISOString(),
        lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
      }))} />
    </div>
  );
}
