import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "المالك",
  ADMIN: "مدير",
  PHOTOGRAPHER: "مصور",
  EDITOR: "محرر",
  VIEWER: "مشاهد",
  SUPPORT: "دعم فني",
};

export default async function TeamPage() {
  const tenantUser = await requireTenant();
  const members = await db.tenantUser.findMany({
    where: { tenantId: tenantUser.tenant.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الفريق</h1>
          <p className="text-gray-500 text-sm">{members.length} عضو</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {members.map((member, i) => (
          <div key={member.id} className={`flex items-center gap-4 px-6 py-4 ${i < members.length - 1 ? "border-b border-gray-50" : ""}`}>
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
              {member.clerkUserId.slice(-2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800" dir="ltr">{member.clerkUserId}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              member.role === "OWNER" ? "bg-purple-50 text-purple-700" :
              member.role === "ADMIN" ? "bg-indigo-50 text-indigo-700" :
              "bg-gray-50 text-gray-600"
            }`}>
              {ROLE_LABELS[member.role]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700">
        دعوة أعضاء جدد إلى الفريق ستكون متاحة في المرحلة الرابعة.
      </div>
    </div>
  );
}
